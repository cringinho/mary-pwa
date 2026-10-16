import express from 'express';
import { db } from '../db/index.js';
import { dailyFeelings, users, couples } from '../db/schema.js';
import { eq, and, desc } from 'drizzle-orm';
import { requireAuth } from '../middlewares/auth.js';

const router = express.Router();

/**
 * GET /api/feelings
 * Retorna o histórico de sentimentos do casal e os sentimentos de hoje
 */
router.get('/', requireAuth, (req, res) => {
  try {
    const coupleId = req.user.coupleId || 1;
    const allFeelings = db.select()
      .from(dailyFeelings)
      .where(eq(dailyFeelings.coupleId, coupleId))
      .orderBy(desc(dailyFeelings.feelingDate), desc(dailyFeelings.id))
      .all();

    const coupleUsers = db.select()
      .from(users)
      .where(eq(users.coupleId, coupleId))
      .all();

    const userMap = new Map(coupleUsers.map(u => [u.id, {
      id: u.id,
      displayName: u.displayName,
      nickname: u.nickname,
      username: u.username,
      avatarUrl: u.avatarUrl,
      zodiacSign: u.zodiacSign
    }]));

    const todayDate = new Date().toISOString().split('T')[0];

    const enriched = allFeelings.map(f => ({
      ...f,
      user: userMap.get(f.userId) || { displayName: 'Amor' }
    }));

    // Sentimentos de hoje para o topo do céu
    const todayFeelings = enriched.filter(f => f.feelingDate === todayDate);
    const pastFeelings = enriched.filter(f => f.feelingDate !== todayDate);

    return res.json({
      success: true,
      todayDate,
      todayFeelings,
      pastFeelings,
      allFeelings: enriched,
      users: Array.from(userMap.values())
    });
  } catch (err) {
    console.error('[Feelings:Get] Erro:', err);
    return res.status(500).json({ error: 'Falha ao buscar sentimentos.' });
  }
});

/**
 * POST /api/feelings
 * Registra ou atualiza o sentimento diário do usuário logado
 */
router.post('/', requireAuth, (req, res) => {
  try {
    const coupleId = req.user.coupleId || 1;
    const userId = req.user.id;
    const { 
      feelingDate = new Date().toISOString().split('T')[0],
      moodLabel, 
      moodColor = '#F43F5E', 
      moodIcon = 'Heart', 
      intensity = 5, 
      note = null,
      moodId = null
    } = req.body;

    if (!moodLabel || !String(moodLabel).trim()) {
      return res.status(400).json({ error: 'Selecione ou descreva seu sentimento.' });
    }

    const cleanDate = String(feelingDate).slice(0, 10);
    const now = new Date().toISOString();

    // Verifica se já existe registro para este usuário nesta data
    const existing = db.select()
      .from(dailyFeelings)
      .where(and(
        eq(dailyFeelings.coupleId, coupleId),
        eq(dailyFeelings.userId, userId),
        eq(dailyFeelings.feelingDate, cleanDate)
      ))
      .get();

    if (existing) {
      db.update(dailyFeelings)
        .set({
          moodId: moodId ? Number(moodId) : null,
          moodLabel: String(moodLabel).trim(),
          moodColor: String(moodColor).trim(),
          moodIcon: String(moodIcon).trim(),
          intensity: Math.max(1, Math.min(5, Number(intensity) || 5)),
          note: note ? String(note).trim() : null
        })
        .where(eq(dailyFeelings.id, existing.id))
        .run();

      const updated = db.select().from(dailyFeelings).where(eq(dailyFeelings.id, existing.id)).get();
      return res.json({
        success: true,
        feeling: updated,
        message: 'Sentimento de hoje atualizado na sua constelação! ✨'
      });
    }

    const insertResult = db.insert(dailyFeelings).values({
      coupleId,
      userId,
      feelingDate: cleanDate,
      moodId: moodId ? Number(moodId) : null,
      moodLabel: String(moodLabel).trim(),
      moodColor: String(moodColor).trim(),
      moodIcon: String(moodIcon).trim(),
      intensity: Math.max(1, Math.min(5, Number(intensity) || 5)),
      note: note ? String(note).trim() : null,
      createdAt: now
    }).run();

    const created = db.select().from(dailyFeelings).where(eq(dailyFeelings.id, Number(insertResult.lastInsertRowid))).get();

    return res.status(201).json({
      success: true,
      feeling: created,
      message: 'Estrela adicionada ao Céu de Sentimentos! 🌟'
    });
  } catch (err) {
    console.error('[Feelings:Create] Erro:', err);
    return res.status(500).json({ error: 'Falha ao registrar sentimento.' });
  }
});

/**
 * GET /api/feelings/calendar/:yearMonth
 * Retorna os sentimentos do mês especificado (ex: '2026-02') para o calendário bicolor
 */
router.get('/calendar/:yearMonth', requireAuth, (req, res) => {
  try {
    const coupleId = req.user.coupleId || 1;
    const { yearMonth } = req.params;

    const feelingsInMonth = db.select()
      .from(dailyFeelings)
      .where(eq(dailyFeelings.coupleId, coupleId))
      .all()
      .filter(f => f.feelingDate.startsWith(yearMonth));

    const dateMap = {};
    for (const f of feelingsInMonth) {
      if (!dateMap[f.feelingDate]) {
        dateMap[f.feelingDate] = [];
      }
      dateMap[f.feelingDate].push(f);
    }

    return res.json({
      success: true,
      yearMonth,
      calendarDays: dateMap
    });
  } catch (err) {
    return res.status(500).json({ error: 'Falha ao carregar calendário emocional.' });
  }
});

export default router;
