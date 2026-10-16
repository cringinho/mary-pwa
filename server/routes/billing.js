import express from 'express';
import { db, schema, sqlite } from '../db/index.js';
import { requireAuth } from '../middlewares/auth.js';
import { eq } from 'drizzle-orm';

const router = express.Router();

export const PLANS_CONFIG = {
  freemium: {
    name: 'Plano Gratuito',
    priceMonthly: 0,
    priceAnnual: 0,
    hasAds: true,
    maxCanvasItems: 10,
    maxDailyFeelingsDays: 14,
    minigamesUnlimited: false,
    customQuestions: false,
    googleDriveBackup: false,
    liveTrackerContinuous: false
  },
  romance: {
    name: 'Plano Romance',
    priceMonthly: 12.90,
    priceAnnual: 109.90, // 29% OFF
    hasAds: false,
    maxCanvasItems: 50,
    maxDailyFeelingsDays: 365,
    minigamesUnlimited: true,
    customQuestions: false,
    googleDriveBackup: true,
    liveTrackerContinuous: true
  },
  almas_gemeas: {
    name: 'Plano Almas Gêmeas (VIP)',
    priceMonthly: 24.90,
    priceAnnual: 199.90, // 33% OFF
    hasAds: false,
    maxCanvasItems: 9999,
    maxDailyFeelingsDays: 9999,
    minigamesUnlimited: true,
    customQuestions: true,
    googleDriveBackup: true,
    liveTrackerContinuous: true,
    exclusiveThemes: true
  }
};

/**
 * GET /api/billing/plan
 * Retorna o plano atual do casal e os benefícios ativos
 */
router.get('/plan', requireAuth, async (req, res) => {
  try {
    const coupleId = req.user.coupleId || 1;
    const couple = await db.query.couples.findFirst({
      where: eq(schema.couples.id, coupleId)
    });

    const currentTier = couple?.planTier || 'freemium';
    const config = PLANS_CONFIG[currentTier] || PLANS_CONFIG.freemium;

    return res.json({
      planTier: currentTier,
      planName: config.name,
      planExpiresAt: couple?.planExpiresAt || null,
      features: config,
      allPlans: PLANS_CONFIG
    });
  } catch (error) {
    console.error('Erro em GET /api/billing/plan:', error);
    return res.status(500).json({ error: 'Erro ao consultar plano do casal' });
  }
});

/**
 * POST /api/billing/upgrade
 * Atualiza ou simula upgrade de plano para o casal
 */
router.post('/upgrade', requireAuth, async (req, res) => {
  try {
    const coupleId = req.user.coupleId || 1;
    let target = req.body.targetTier || req.body.planTier;
    const cycle = req.body.cycle || req.body.billingCycle || 'monthly';

    if (target === 'almas_gemeas_vip') {
      target = 'almas_gemeas';
    }

    if (!['freemium', 'romance', 'almas_gemeas'].includes(target)) {
      return res.status(400).json({ error: 'Plano inválido' });
    }

    // Calcula validade (30 dias para mensal, 365 dias para anual)
    const now = new Date();
    const daysToAdd = (cycle === 'annual' || cycle === 'yearly') ? 365 : 30;
    const expiresAt = new Date(now.getTime() + daysToAdd * 24 * 60 * 60 * 1000).toISOString();

    sqlite.prepare(`
      UPDATE couples
      SET plan_tier = ?, plan_expires_at = ?
      WHERE id = ?
    `).run(target, expiresAt, coupleId);

    const config = PLANS_CONFIG[target];

    return res.json({
      success: true,
      message: `Parabéns! O casal agora está no ${config.name}! ✨`,
      planTier: target,
      planExpiresAt: expiresAt,
      features: config
    });
  } catch (error) {
    console.error('Erro em POST /api/billing/upgrade:', error);
    return res.status(500).json({ error: 'Erro ao atualizar plano' });
  }
});

export default router;
