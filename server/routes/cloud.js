import express from 'express';
import { db, schema, sqlite } from '../db/index.js';
import { requireAuth } from '../middlewares/auth.js';
import { eq } from 'drizzle-orm';

const router = express.Router();

/**
 * GET /api/cloud/drive-status
 * Retorna o status de vinculação com Google Drive / Cloud
 */
router.get('/drive-status', requireAuth, async (req, res) => {
  try {
    const coupleId = req.user.coupleId || 1;
    const couple = await db.query.couples.findFirst({
      where: eq(schema.couples.id, coupleId)
    });

    return res.json({
      isLinked: Boolean(couple?.googleDriveFolderId),
      folderId: couple?.googleDriveFolderId || null,
      planTier: couple?.planTier || 'freemium',
      storageMode: couple?.googleDriveFolderId ? 'byos_google_drive' : 'app_cloud_vault'
    });
  } catch (error) {
    console.error('Erro em GET /api/cloud/drive-status:', error);
    return res.status(500).json({ error: 'Erro ao verificar status do Google Drive' });
  }
});

/**
 * POST /api/cloud/drive-link
 * Salva a pasta de backup do casal no Google Drive
 */
router.post('/drive-link', requireAuth, async (req, res) => {
  try {
    const coupleId = req.user.coupleId || 1;
    const { folderId } = req.body;

    sqlite.prepare('UPDATE couples SET google_drive_folder_id = ? WHERE id = ?')
      .run(folderId || 'appDataFolder', coupleId);

    return res.json({
      success: true,
      folderId: folderId || 'appDataFolder',
      message: 'Google Drive conectado com sucesso ao cofre do casal!'
    });
  } catch (error) {
    console.error('Erro em POST /api/cloud/drive-link:', error);
    return res.status(500).json({ error: 'Erro ao vincular Google Drive' });
  }
});

/**
 * GET /api/cloud/export-vault
 * Exporta todo o universo do casal em um cofre JSON criptografável/portátil (.universo)
 */
router.get('/export-vault', requireAuth, async (req, res) => {
  try {
    const coupleId = req.user.coupleId || 1;

    const couple = sqlite.prepare('SELECT * FROM couples WHERE id = ?').get(coupleId);
    const users = sqlite.prepare('SELECT id, username, display_name, nickname, birth_date, zodiac_sign, bio FROM users WHERE couple_id = ?').all(coupleId);
    const memories = sqlite.prepare('SELECT * FROM memories WHERE couple_id = ?').all(coupleId);
    const media = sqlite.prepare('SELECT * FROM memory_media WHERE couple_id = ?').all(coupleId);
    const feelings = sqlite.prepare('SELECT * FROM daily_feelings WHERE couple_id = ?').all(coupleId);
    const canvas = sqlite.prepare('SELECT * FROM canvas_items WHERE couple_id = ?').all(coupleId);
    const answers = sqlite.prepare('SELECT * FROM minigame_answers WHERE couple_id = ?').all(coupleId);

    const vault = {
      app: 'Nosso Universo',
      version: '4.0',
      exportedAt: new Date().toISOString(),
      couple,
      users,
      memories,
      media,
      feelings,
      canvas,
      minigameAnswers: answers
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="nosso-universo-vault-${coupleId}.json"`);
    return res.json(vault);
  } catch (error) {
    console.error('Erro em GET /api/cloud/export-vault:', error);
    return res.status(500).json({ error: 'Erro ao gerar cofre de backup' });
  }
});

export default router;
