import express from 'express';
import { db, schema, sqlite } from '../db/index.js';

const router = express.Router();
const ADMIN_MASTER_KEY = process.env.ADMIN_MASTER_KEY || 'mary_super_admin_secret_2026';

/**
 * Middleware para rastrear o uso de funcionalidades agregadas
 */
export function featureTracker(featureKey) {
  return (req, res, next) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      sqlite.prepare(`
        INSERT INTO feature_usage_stats (feature_key, event_date, usage_count)
        VALUES (?, ?, 1)
        ON CONFLICT(feature_key, event_date) DO UPDATE SET usage_count = usage_count + 1
      `).run(featureKey, today);
    } catch (e) {
      // Ignorar falhas de telemetria para não quebrar a requisição principal
    }
    next();
  };
}

/**
 * Middleware de proteção do painel Admin por chave mestra
 */
function requireAdmin(req, res, next) {
  const authHeader = req.headers['x-admin-key'] || req.query.adminKey || req.cookies?.adminKey;
  if (authHeader && authHeader === ADMIN_MASTER_KEY) {
    return next();
  }
  return res.status(401).json({ error: 'Acesso não autorizado ao SuperAdmin' });
}

/**
 * GET /api/admin/metrics
 * Retorna as métricas completas de usuários, armazenamento, assinaturas e retenção
 */
router.get('/metrics', requireAdmin, async (req, res) => {
  try {
    // 1. Usuários e Casais
    const totalUsers = sqlite.prepare('SELECT COUNT(*) as count FROM users').get().count;
    const totalCouples = sqlite.prepare('SELECT COUNT(*) as count FROM couples').get().count;
    
    const today = new Date().toISOString().split('T')[0];
    const firstDayOfMonth = today.slice(0, 7) + '-01';

    const dau = sqlite.prepare(`
      SELECT COUNT(DISTINCT user_id) as count
      FROM daily_feelings
      WHERE feeling_date = ?
    `).get(today).count || 1;

    const mau = sqlite.prepare(`
      SELECT COUNT(DISTINCT user_id) as count
      FROM daily_feelings
      WHERE feeling_date >= ?
    `).get(firstDayOfMonth).count || 2;

    // 2. Raio-X de Armazenamento
    const storageStats = sqlite.prepare(`
      SELECT 
        SUM(internal_storage_used_bytes) as totalUsedBytes,
        COUNT(CASE WHEN storage_mode = 'google_drive' THEN 1 END) as googleDriveCouples,
        COUNT(CASE WHEN storage_mode = 'internal_cloud' OR storage_mode IS NULL THEN 1 END) as internalCloudCouples,
        COUNT(CASE WHEN storage_mode = 'hybrid' THEN 1 END) as hybridCouples
      FROM couples
    `).get();

    const totalUsedMB = Number(((storageStats.totalUsedBytes || 0) / (1024 * 1024)).toFixed(2));
    const totalUsedGB = Number((totalUsedMB / 1024).toFixed(3));

    // 3. Assinantes por Plano e MRR
    const planCounts = sqlite.prepare(`
      SELECT plan_tier, COUNT(*) as count
      FROM couples
      GROUP BY plan_tier
    `).all();

    let freemiumCount = 0;
    let romanceCount = 0;
    let almasGemeasCount = 0;

    for (const p of planCounts) {
      if (p.plan_tier === 'romance') romanceCount += p.count;
      else if (p.plan_tier === 'almas_gemeas' || p.plan_tier === 'almas_gemeas_vip') almasGemeasCount += p.count;
      else freemiumCount += p.count;
    }

    // Cálculo de MRR aproximado (Romance R$ 12,90 + Almas Gêmeas R$ 24,90)
    const mrr = Number((romanceCount * 12.90 + almasGemeasCount * 24.90).toFixed(2));

    // 4. Ranking de Funcionalidades Mais Usadas
    const topFeatures = sqlite.prepare(`
      SELECT feature_key, SUM(usage_count) as total_usage
      FROM feature_usage_stats
      GROUP BY feature_key
      ORDER BY total_usage DESC
      LIMIT 10
    `).all();

    return res.json({
      success: true,
      timestamp: new Date().toISOString(),
      overview: {
        totalUsers,
        totalCouples,
        dau,
        mau
      },
      storage: {
        totalUsedMB,
        totalUsedGB,
        googleDriveCouples: storageStats.googleDriveCouples,
        internalCloudCouples: storageStats.internalCloudCouples,
        hybridCouples: storageStats.hybridCouples
      },
      billing: {
        freemiumCount,
        romanceCount,
        almasGemeasCount,
        mrr,
        currency: 'BRL'
      },
      topFeatures
    });
  } catch (error) {
    console.error('Erro em GET /api/admin/metrics:', error);
    return res.status(500).json({ error: 'Erro ao gerar métricas do SuperAdmin' });
  }
});

export default router;

