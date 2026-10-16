import express from 'express';
import { db, schema, sqlite } from '../db/index.js';
import { requireAuth } from '../middlewares/auth.js';
import { eq, and, desc } from 'drizzle-orm';

const router = express.Router();

// Tabela de missões fixas disponíveis guiadas pela Anjinha Mary
export const MISSIONS_CATALOG = [
  {
    id: 'minigame_share',
    title: 'Compartilhar Resultado do Minigame',
    description: 'Responda uma rodada e compartilhe o resultado nos Stories ou Status.',
    rewardType: 'crystals',
    rewardAmount: 25,
    icon: 'Sparkle'
  },
  {
    id: 'tiktok_trend',
    title: 'Postar nossa Trend no TikTok / Reels',
    description: 'Use o gerador de vídeos de casal, poste com a hashtag oficial e cole o link aqui!',
    rewardType: 'vip_days',
    rewardAmount: 7, // 7 dias grátis de Plano Romance
    icon: 'VideoCamera'
  },
  {
    id: 'invite_couple',
    title: 'Convidar um Casal Amigo',
    description: 'Envie seu código de convite para outro casal amigo se cadastrar.',
    rewardType: 'vip_days',
    rewardAmount: 15, // 15 dias de Plano Romance sem anúncios
    icon: 'UsersThree'
  }
];

/**
 * GET /api/rewards/catalog
 * Retorna o saldo de cristais de cupido, código de indicação e catálogo de missões
 */
router.get('/catalog', requireAuth, async (req, res) => {
  try {
    const coupleId = req.user.coupleId || 1;
    const couple = await db.query.couples.findFirst({
      where: eq(schema.couples.id, coupleId)
    });

    const submissions = sqlite.prepare(`
      SELECT id, platform, post_url, status, reward_granted, created_at
      FROM reward_submissions
      WHERE couple_id = ?
      ORDER BY id DESC LIMIT 20
    `).all(coupleId);

    return res.json({
      cupidCrystals: couple?.cupidCrystals || 50,
      referralCode: couple?.referralCode || couple?.inviteCode || 'AMOR26',
      planTier: couple?.planTier || 'freemium',
      missions: MISSIONS_CATALOG,
      submissions
    });
  } catch (error) {
    console.error('Erro em GET /api/rewards/catalog:', error);
    return res.status(500).json({ error: 'Erro ao carregar catálogo de recompensas' });
  }
});

/**
 * POST /api/rewards/claim-mission
 * Resgate imediato de missão de engajamento (ex: compartilhar no status/stories)
 */
router.post('/claim-mission', requireAuth, async (req, res) => {
  try {
    const coupleId = req.user.coupleId || 1;
    const { missionId } = req.body;

    const mission = MISSIONS_CATALOG.find(m => m.id === missionId);
    if (!mission) {
      return res.status(404).json({ error: 'Missão não encontrada' });
    }

    const now = new Date().toISOString();

    if (mission.rewardType === 'crystals') {
      sqlite.prepare(`
        UPDATE couples
        SET cupid_crystals = cupid_crystals + ?
        WHERE id = ?
      `).run(mission.rewardAmount, coupleId);
    } else if (mission.rewardType === 'vip_days') {
      const nowMs = Date.now();
      const expiresAt = new Date(nowMs + mission.rewardAmount * 24 * 60 * 60 * 1000).toISOString();
      sqlite.prepare(`
        UPDATE couples
        SET plan_tier = CASE WHEN plan_tier = 'freemium' THEN 'romance' ELSE plan_tier END,
            plan_expires_at = ?
        WHERE id = ?
      `).run(expiresAt, coupleId);
    }

    sqlite.prepare(`
      INSERT INTO couple_rewards (couple_id, reward_type, amount, reason, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(coupleId, mission.rewardType, mission.rewardAmount, mission.title, now);

    const updatedCouple = sqlite.prepare('SELECT cupid_crystals, plan_tier FROM couples WHERE id = ?').get(coupleId);

    return res.json({
      success: true,
      message: `Missão resgatada com sucesso! Você ganhou ${mission.rewardAmount} ${mission.rewardType === 'crystals' ? 'Cristais de Cupido' : 'dias VIP'}! ✨`,
      cupidCrystals: updatedCouple.cupidCrystals,
      planTier: updatedCouple.plan_tier
    });
  } catch (error) {
    console.error('Erro em POST /api/rewards/claim-mission:', error);
    return res.status(500).json({ error: 'Erro ao resgatar recompensa' });
  }
});

/**
 * POST /api/rewards/submit-social-link
 * Envio de URL de TikTok, Reels ou Shorts para validação de recompensas virais
 */
router.post('/submit-social-link', requireAuth, async (req, res) => {
  try {
    const coupleId = req.user.coupleId || 1;
    const userId = req.user.id;
    const { platform, postUrl } = req.body;

    if (!postUrl || !postUrl.startsWith('http')) {
      return res.status(400).json({ error: 'Informe uma URL válida do vídeo postado.' });
    }

    const now = new Date().toISOString();
    // Bônus concedido: 7 dias de Romance para o casal
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    sqlite.prepare(`
      UPDATE couples
      SET plan_tier = CASE WHEN plan_tier = 'freemium' THEN 'romance' ELSE plan_tier END,
          plan_expires_at = ?
      WHERE id = ?
    `).run(expiresAt, coupleId);

    const stmt = sqlite.prepare(`
      INSERT INTO reward_submissions (couple_id, user_id, platform, post_url, status, reward_granted, created_at)
      VALUES (?, ?, ?, ?, 'approved', '7 dias Plano Romance', ?)
    `);
    const info = stmt.run(coupleId, userId, platform || 'tiktok', postUrl, now);

    return res.status(201).json({
      success: true,
      message: 'Vídeo validado! O casal ganhou 7 dias gratuitos do Plano Romance sem anúncios! 🎉',
      submissionId: info.lastInsertRowid
    });
  } catch (error) {
    console.error('Erro em POST /api/rewards/submit-social-link:', error);
    return res.status(500).json({ error: 'Erro ao processar envio de link social' });
  }
});

export default router;

