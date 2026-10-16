import express from 'express';
import { db, schema, sqlite } from '../db/index.js';
import { requireAuth } from '../middlewares/auth.js';
import { eq, and, ne } from 'drizzle-orm';

const router = express.Router();

/**
 * POST /api/telemetry/ping
 * Salva ou atualiza a telemetria em tempo real do usuário autenticado (localização + bateria)
 */
router.post('/ping', requireAuth, (req, res) => {
  try {
    const coupleId = req.user.coupleId || 1;
    const userId = req.user.id;
    const { latitude, longitude, accuracy, speed, batteryLevel, isCharging } = req.body;

    if (latitude === undefined || longitude === undefined || latitude === null || longitude === null) {
      return res.status(400).json({ error: 'Latitude e longitude são obrigatórias' });
    }

    const lat = Number(latitude);
    const lng = Number(longitude);

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ error: 'Coordenadas geográficas inválidas' });
    }

    const now = new Date().toISOString();
    const battery = batteryLevel !== undefined && batteryLevel !== null ? Math.round(Number(batteryLevel)) : null;
    const charging = isCharging ? 1 : 0;
    const acc = accuracy !== undefined && accuracy !== null ? Number(accuracy) : null;
    const spd = speed !== undefined && speed !== null ? Number(speed) : null;

    const stmt = sqlite.prepare(`
      INSERT INTO partner_telemetry (couple_id, user_id, latitude, longitude, accuracy, speed, battery_level, is_charging, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(couple_id, user_id) DO UPDATE SET
        latitude = excluded.latitude,
        longitude = excluded.longitude,
        accuracy = excluded.accuracy,
        speed = excluded.speed,
        battery_level = excluded.battery_level,
        is_charging = excluded.is_charging,
        updated_at = excluded.updated_at
    `);

    stmt.run(coupleId, userId, lat, lng, acc, spd, battery, charging, now);

    return res.json({
      success: true,
      timestamp: now
    });
  } catch (error) {
    console.error('Erro em POST /api/telemetry/ping:', error);
    return res.status(500).json({ error: 'Erro ao registrar telemetria' });
  }
});

/**
 * GET /api/telemetry/partner
 * Retorna as coordenadas e status de bateria do outro parceiro do casal
 */
router.get('/partner', requireAuth, async (req, res) => {
  try {
    const coupleId = req.user.coupleId || 1;
    const userId = req.user.id;

    // Buscar o outro parceiro do casal
    const partner = await db.query.users.findFirst({
      where: and(
        eq(schema.users.coupleId, coupleId),
        ne(schema.users.id, userId)
      )
    });

    if (!partner) {
      return res.json({
        hasPartner: false,
        message: 'Aguardando o parceiro conectar ao espaço do casal'
      });
    }

    // Buscar telemetria do parceiro
    const telemetry = sqlite.prepare(`
      SELECT latitude, longitude, accuracy, speed, battery_level, is_charging, updated_at
      FROM partner_telemetry
      WHERE couple_id = ? AND user_id = ?
    `).get(coupleId, partner.id);

    // Buscar telemetria do usuário atual para comparação
    const selfTelemetry = sqlite.prepare(`
      SELECT latitude, longitude, accuracy, speed, battery_level, is_charging, updated_at
      FROM partner_telemetry
      WHERE couple_id = ? AND user_id = ?
    `).get(coupleId, userId);

    return res.json({
      hasPartner: true,
      partner: {
        id: partner.id,
        displayName: partner.displayName,
        nickname: partner.nickname,
        avatarUrl: partner.avatarUrl,
        zodiacSign: partner.zodiacSign
      },
      partnerTelemetry: telemetry ? {
        latitude: telemetry.latitude,
        longitude: telemetry.longitude,
        accuracy: telemetry.accuracy,
        speed: telemetry.speed,
        batteryLevel: telemetry.battery_level,
        isCharging: Boolean(telemetry.is_charging),
        updatedAt: telemetry.updated_at
      } : null,
      selfTelemetry: selfTelemetry ? {
        latitude: selfTelemetry.latitude,
        longitude: selfTelemetry.longitude,
        accuracy: selfTelemetry.accuracy,
        speed: selfTelemetry.speed,
        batteryLevel: selfTelemetry.battery_level,
        isCharging: Boolean(selfTelemetry.is_charging),
        updatedAt: selfTelemetry.updated_at
      } : null
    });
  } catch (error) {
    console.error('Erro em GET /api/telemetry/partner:', error);
    return res.status(500).json({ error: 'Erro ao buscar dados do parceiro' });
  }
});

/**
 * POST /api/telemetry/ios-battery-webhook
 * Atalho do Apple Shortcuts no iOS para atualizar status de bateria sem a Battery Status API
 */
router.post('/ios-battery-webhook', requireAuth, (req, res) => {
  try {
    const coupleId = req.user.coupleId || 1;
    const userId = req.user.id;
    const { batteryLevel, isCharging } = req.body;

    const battery = batteryLevel !== undefined ? Math.round(Number(batteryLevel)) : null;
    const charging = isCharging ? 1 : 0;
    const now = new Date().toISOString();

    const existing = sqlite.prepare('SELECT latitude, longitude FROM partner_telemetry WHERE couple_id = ? AND user_id = ?').get(coupleId, userId);
    if (existing) {
      sqlite.prepare(`
        UPDATE partner_telemetry
        SET battery_level = ?, is_charging = ?, updated_at = ?
        WHERE couple_id = ? AND user_id = ?
      `).run(battery, charging, now, coupleId, userId);
    }

    return res.json({ success: true, batteryLevel: battery, isCharging: Boolean(charging) });
  } catch (error) {
    console.error('Erro em webhook iOS:', error);
    return res.status(500).json({ error: 'Erro ao processar telemetria iOS' });
  }
});

export default router;
