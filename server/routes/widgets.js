import express from 'express';
import { db, schema, sqlite } from '../db/index.js';
import { requireAuth } from '../middlewares/auth.js';
import { eq, and, ne } from 'drizzle-orm';

const router = express.Router();

/**
 * Cálculo da distância geográfica (fórmula de Haversine)
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371; // km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * GET /api/widgets/summary
 * Retorna dados ultraleves para renderização dos Widgets de Tela Inicial
 */
router.get('/summary', requireAuth, async (req, res) => {
  try {
    const coupleId = req.user.coupleId || 1;
    const userId = req.user.id;

    // Buscar casal
    const couple = await db.query.couples.findFirst({
      where: eq(schema.couples.id, coupleId)
    });

    // Calcular dias juntos
    const anniversaryStr = couple?.anniversaryDate || '2026-01-30';
    const startDate = new Date(`${anniversaryStr}T00:00:00`);
    const diffMs = Math.max(0, Date.now() - startDate.getTime());
    const daysTogether = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    // Buscar parceiro
    const partner = await db.query.users.findFirst({
      where: and(
        eq(schema.users.coupleId, coupleId),
        ne(schema.users.id, userId)
      )
    });

    // Buscar sentimento de hoje do parceiro
    const today = new Date().toISOString().split('T')[0];
    let partnerMood = null;

    if (partner) {
      const feeling = sqlite.prepare(`
        SELECT mood_label, mood_color, mood_icon, intensity, note
        FROM daily_feelings
        WHERE couple_id = ? AND user_id = ? AND feeling_date = ?
      `).get(coupleId, partner.id, today);

      if (feeling) {
        partnerMood = {
          label: feeling.mood_label,
          color: feeling.mood_color,
          icon: feeling.mood_icon,
          intensity: feeling.intensity,
          note: feeling.note
        };
      }
    }

    // Buscar telemetria e distância
    let partnerBattery = null;
    let distanceKm = null;

    if (partner) {
      const pTelem = sqlite.prepare(`
        SELECT latitude, longitude, battery_level, is_charging
        FROM partner_telemetry
        WHERE couple_id = ? AND user_id = ?
      `).get(coupleId, partner.id);

      const sTelem = sqlite.prepare(`
        SELECT latitude, longitude
        FROM partner_telemetry
        WHERE couple_id = ? AND user_id = ?
      `).get(coupleId, userId);

      if (pTelem) {
        partnerBattery = {
          level: pTelem.battery_level,
          isCharging: Boolean(pTelem.is_charging)
        };

        if (sTelem?.latitude && pTelem?.latitude) {
          distanceKm = calculateDistance(sTelem.latitude, sTelem.longitude, pTelem.latitude, pTelem.longitude);
        }
      }
    }

    // Buscar última foto favorita da galeria
    const favMedia = sqlite.prepare(`
      SELECT file_url, thumb_url, caption
      FROM memory_media
      WHERE couple_id = ? AND is_favorite = 1
      ORDER BY id DESC LIMIT 1
    `).get(coupleId);

    return res.json({
      coupleName: couple?.coupleName || 'Nosso Universo',
      anniversaryDate: anniversaryStr,
      daysTogether,
      user: {
        id: req.user.id,
        username: req.user.username,
        displayName: req.user.displayName
      },
      partner: partner ? {
        displayName: partner.displayName,
        nickname: partner.nickname,
        avatarUrl: partner.avatarUrl,
        zodiacSign: partner.zodiacSign
      } : null,
      partnerMood,
      partnerBattery,
      distanceKm: distanceKm !== null ? Number(distanceKm.toFixed(1)) : null,
      latestFavoritePhoto: favMedia ? {
        fileUrl: favMedia.file_url,
        thumbUrl: favMedia.thumb_url || favMedia.file_url,
        caption: favMedia.caption
      } : null,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro em GET /api/widgets/summary:', error);
    return res.status(500).json({ error: 'Erro ao gerar dados do widget' });
  }
});

export default router;
