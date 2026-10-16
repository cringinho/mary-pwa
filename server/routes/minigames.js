import express from 'express';
import { db, schema, sqlite } from '../db/index.js';
import { requireAuth } from '../middlewares/auth.js';
import { eq, and, ne } from 'drizzle-orm';

const router = express.Router();

/**
 * GET /api/minigames/categories
 * Retorna as categorias disponíveis de perguntas
 */
router.get('/categories', requireAuth, (req, res) => {
  try {
    const { type } = req.query;
    let query = 'SELECT DISTINCT category FROM minigame_questions';
    const params = [];
    if (type) {
      query += ' WHERE question_type = ?';
      params.push(type);
    }
    query += ' ORDER BY category ASC';

    const rows = sqlite.prepare(query).all(...params);
    res.json(rows.map(r => r.category));
  } catch (error) {
    console.error('Erro ao listar categorias:', error);
    res.status(500).json({ error: 'Erro ao carregar categorias' });
  }
});

/**
 * GET /api/minigames/questions
 * Lista perguntas com status de resposta do usuário e do parceiro
 */
router.get('/questions', requireAuth, async (req, res) => {
  try {
    const coupleId = req.user.coupleId || 1;
    const userId = req.user.id;
    const { type = 'prefer_dislike', category, page = 1, limit = 20 } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const offset = (pageNum - 1) * limitNum;

    // Buscar parceiro
    const partner = await db.query.users.findFirst({
      where: and(
        eq(schema.users.coupleId, coupleId),
        ne(schema.users.id, userId)
      )
    });
    const partnerId = partner ? partner.id : null;

    let whereClause = 'WHERE (q.is_custom = 0 OR q.couple_id = ?)';
    const params = [coupleId];

    if (type) {
      whereClause += ' AND q.question_type = ?';
      params.push(type);
    }

    if (category) {
      whereClause += ' AND q.category = ?';
      params.push(category);
    }

    // Contar total
    const totalRow = sqlite.prepare(`
      SELECT count(*) as total
      FROM minigame_questions q
      ${whereClause}
    `).get(...params);

    const total = totalRow ? totalRow.total : 0;

    // Selecionar perguntas com respostas
    const query = `
      SELECT
        q.id,
        q.question_type as questionType,
        q.category,
        q.question_text as questionText,
        q.option_a as optionA,
        q.option_b as optionB,
        q.is_custom as isCustom,
        ua.answer_choice as myAnswer,
        pa.answer_choice as partnerAnswer
      FROM minigame_questions q
      LEFT JOIN minigame_answers ua ON ua.question_id = q.id AND ua.user_id = ? AND ua.couple_id = ?
      LEFT JOIN minigame_answers pa ON pa.question_id = q.id AND pa.user_id = ? AND pa.couple_id = ?
      ${whereClause}
      ORDER BY q.id ASC
      LIMIT ? OFFSET ?
    `;

    const queryParams = [userId, coupleId, partnerId || -1, coupleId, ...params, limitNum, offset];
    const rows = sqlite.prepare(query).all(...queryParams);

    const questions = rows.map(r => {
      const answeredByMe = Boolean(r.myAnswer);
      const answeredByPartner = Boolean(r.partnerAnswer);
      // O resultado só é revelado se ambos responderam
      const isRevealed = answeredByMe && answeredByPartner;

      let isMatch = false;
      if (isRevealed) {
        if (r.questionType === 'prefer_dislike') {
          isMatch = r.myAnswer === r.partnerAnswer;
        } else if (r.questionType === 'who_would') {
          // No "who_would", se eu votei "me" e o parceiro votou "partner" (ou vice-versa), eles concordaram na mesma pessoa!
          if (r.myAnswer === 'me' && r.partnerAnswer === 'partner') isMatch = true;
          else if (r.myAnswer === 'partner' && r.partnerAnswer === 'me') isMatch = true;
          else if (r.myAnswer === r.partnerAnswer) isMatch = false; // ambos votaram em si mesmos ou ambos votaram no outro
        }
      }

      return {
        id: r.id,
        questionType: r.questionType,
        category: r.category,
        questionText: r.questionText,
        optionA: r.optionA,
        optionB: r.optionB,
        isCustom: Boolean(r.isCustom),
        myAnswer: r.myAnswer || null,
        partnerAnswer: isRevealed ? r.partnerAnswer : null,
        answeredByMe,
        answeredByPartner,
        isRevealed,
        isMatch
      };
    });

    return res.json({
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
      questions
    });
  } catch (error) {
    console.error('Erro em GET /api/minigames/questions:', error);
    return res.status(500).json({ error: 'Erro ao buscar perguntas' });
  }
});

/**
 * POST /api/minigames/answers
 * Salva a resposta do usuário
 */
router.post('/answers', requireAuth, async (req, res) => {
  try {
    const coupleId = req.user.coupleId || 1;
    const userId = req.user.id;
    const { questionId, answerChoice } = req.body;

    if (!questionId || !answerChoice) {
      return res.status(400).json({ error: 'questionId e answerChoice são obrigatórios' });
    }

    const question = sqlite.prepare('SELECT * FROM minigame_questions WHERE id = ?').get(questionId);
    if (!question) {
      return res.status(404).json({ error: 'Pergunta não encontrada' });
    }

    const now = new Date().toISOString();

    sqlite.prepare(`
      INSERT INTO minigame_answers (couple_id, user_id, question_id, answer_choice, created_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(couple_id, user_id, question_id) DO UPDATE SET
        answer_choice = excluded.answer_choice,
        created_at = excluded.created_at
    `).run(coupleId, userId, questionId, answerChoice, now);

    // Buscar se o parceiro já respondeu
    const partner = await db.query.users.findFirst({
      where: and(
        eq(schema.users.coupleId, coupleId),
        ne(schema.users.id, userId)
      )
    });

    let partnerAnswer = null;
    let isRevealed = false;
    let isMatch = false;

    if (partner) {
      const pa = sqlite.prepare(`
        SELECT answer_choice FROM minigame_answers
        WHERE couple_id = ? AND user_id = ? AND question_id = ?
      `).get(coupleId, partner.id, questionId);

      if (pa) {
        partnerAnswer = pa.answer_choice;
        isRevealed = true;
        if (question.question_type === 'prefer_dislike') {
          isMatch = answerChoice === partnerAnswer;
        } else if (question.question_type === 'who_would') {
          if (answerChoice === 'me' && partnerAnswer === 'partner') isMatch = true;
          else if (answerChoice === 'partner' && partnerAnswer === 'me') isMatch = true;
          else isMatch = false;
        }
      }
    }

    return res.json({
      success: true,
      questionId,
      myAnswer: answerChoice,
      partnerAnswer: isRevealed ? partnerAnswer : null,
      isRevealed,
      isMatch
    });
  } catch (error) {
    console.error('Erro em POST /api/minigames/answers:', error);
    return res.status(500).json({ error: 'Erro ao registrar resposta' });
  }
});

/**
 * GET /api/minigames/compatibility
 * Retorna as estatísticas de compatibilidade do casal (geral e por categoria)
 */
router.get('/compatibility', requireAuth, async (req, res) => {
  try {
    const coupleId = req.user.coupleId || 1;
    const userId = req.user.id;

    const partner = await db.query.users.findFirst({
      where: and(
        eq(schema.users.coupleId, coupleId),
        ne(schema.users.id, userId)
      )
    });

    if (!partner) {
      return res.json({
        totalAnsweredTogether: 0,
        overallCompatibility: 100,
        byCategory: []
      });
    }

    // Buscar todas as perguntas respondidas por AMBOS os parceiros
    const rows = sqlite.prepare(`
      SELECT
        q.id,
        q.question_type,
        q.category,
        a1.answer_choice as user1_answer,
        a2.answer_choice as user2_answer
      FROM minigame_questions q
      JOIN minigame_answers a1 ON a1.question_id = q.id AND a1.user_id = ? AND a1.couple_id = ?
      JOIN minigame_answers a2 ON a2.question_id = q.id AND a2.user_id = ? AND a2.couple_id = ?
    `).all(userId, coupleId, partner.id, coupleId);

    if (rows.length === 0) {
      return res.json({
        totalAnsweredTogether: 0,
        overallCompatibility: 100,
        byCategory: []
      });
    }

    let matches = 0;
    const catStats = {};

    for (const r of rows) {
      if (!catStats[r.category]) {
        catStats[r.category] = { total: 0, matches: 0 };
      }
      catStats[r.category].total++;

      let isMatch = false;
      if (r.question_type === 'prefer_dislike') {
        isMatch = r.user1_answer === r.user2_answer;
      } else if (r.question_type === 'who_would') {
        if (r.user1_answer === 'me' && r.user2_answer === 'partner') isMatch = true;
        else if (r.user1_answer === 'partner' && r.user2_answer === 'me') isMatch = true;
      }

      if (isMatch) {
        matches++;
        catStats[r.category].matches++;
      }
    }

    const overall = Math.round((matches / rows.length) * 100);

    const byCategory = Object.keys(catStats).map(cat => ({
      category: cat,
      total: catStats[cat].total,
      matches: catStats[cat].matches,
      percentage: Math.round((catStats[cat].matches / catStats[cat].total) * 100)
    })).sort((a, b) => b.percentage - a.percentage);

    return res.json({
      totalAnsweredTogether: rows.length,
      overallCompatibility: overall,
      byCategory
    });
  } catch (error) {
    console.error('Erro em GET /api/minigames/compatibility:', error);
    return res.status(500).json({ error: 'Erro ao calcular compatibilidade' });
  }
});

/**
 * POST /api/minigames/custom
 * Permite ao usuário criar uma pergunta própria exclusiva para o parceiro
 */
router.post('/custom', requireAuth, (req, res) => {
  try {
    const coupleId = req.user.coupleId || 1;
    const userId = req.user.id;
    const { questionType = 'prefer_dislike', category = 'Romantismo', questionText, optionA, optionB } = req.body;

    if (!questionText || questionText.trim().length === 0) {
      return res.status(400).json({ error: 'O texto da pergunta é obrigatório' });
    }

    const now = new Date().toISOString();
    const optA = optionA || (questionType === 'prefer_dislike' ? 'Prefiro / Amo' : 'Eu');
    const optB = optionB || (questionType === 'prefer_dislike' ? 'Não Gosto' : 'Meu Amor');

    const result = sqlite.prepare(`
      INSERT INTO minigame_questions (question_type, category, question_text, option_a, option_b, is_custom, couple_id, created_by, created_at)
      VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?)
    `).run(questionType, category, questionText.trim(), optA, optB, coupleId, userId, now);

    return res.status(201).json({
      success: true,
      question: {
        id: Number(result.lastInsertRowid),
        questionType,
        category,
        questionText: questionText.trim(),
        optionA: optA,
        optionB: optB,
        isCustom: true,
        createdAt: now
      }
    });
  } catch (error) {
    console.error('Erro em POST /api/minigames/custom:', error);
    return res.status(500).json({ error: 'Erro ao criar pergunta customizada' });
  }
});

export default router;
