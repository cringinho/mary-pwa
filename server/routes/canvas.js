import express from 'express';
import { db } from '../db/index.js';
import { canvasItems, couples } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { requireAuth } from '../middlewares/auth.js';

const router = express.Router();

const PLAN_ITEM_LIMITS = {
  freemium: 10,
  romance: 50,
  almas_gemeas: 9999
};

/**
 * GET /api/canvas
 * Lista todos os elementos do Mural do Casal
 */
router.get('/', requireAuth, (req, res) => {
  try {
    const coupleId = req.user.coupleId || 1;
    const items = db.select()
      .from(canvasItems)
      .where(eq(canvasItems.coupleId, coupleId))
      .orderBy(canvasItems.zIndex, canvasItems.id)
      .all();

    const couple = db.select().from(couples).where(eq(couples.id, coupleId)).get();
    const plan = couple?.planTier || 'freemium';
    const limit = PLAN_ITEM_LIMITS[plan] || 10;

    return res.json({
      success: true,
      items: items.map(item => ({
        ...item,
        payload: JSON.parse(item.payloadJson || '{}')
      })),
      plan,
      limit,
      count: items.length
    });
  } catch (err) {
    console.error('[Canvas:Get] Erro:', err);
    return res.status(500).json({ error: 'Falha ao carregar mural do casal.' });
  }
});

/**
 * POST /api/canvas
 * Adiciona um novo elemento ao Mural
 */
router.post('/', requireAuth, (req, res) => {
  try {
    const coupleId = req.user.coupleId || 1;
    const couple = db.select().from(couples).where(eq(couples.id, coupleId)).get();
    const plan = couple?.planTier || 'freemium';
    const limit = PLAN_ITEM_LIMITS[plan] || 10;

    const currentCount = db.select()
      .from(canvasItems)
      .where(eq(canvasItems.coupleId, coupleId))
      .all().length;

    if (currentCount >= limit) {
      return res.status(403).json({
        error: `Limite do plano ${plan.toUpperCase()} atingido (${limit} itens). Faça upgrade para o Plano Romance ou Almas Gêmeas para mural ilimitado!`,
        requiresUpgrade: true
      });
    }

    const {
      itemType = 'note',
      x = 0,
      y = 0,
      width = 220,
      height = 160,
      rotation = 0,
      zIndex = currentCount + 1,
      payload = {}
    } = req.body;

    const now = new Date().toISOString();

    const insertResult = db.insert(canvasItems).values({
      coupleId,
      createdBy: req.user.id,
      itemType: String(itemType).trim(),
      x: Number(x) || 0,
      y: Number(y) || 0,
      width: Number(width) || 220,
      height: Number(height) || 160,
      rotation: Number(rotation) || 0,
      zIndex: Number(zIndex) || 1,
      payloadJson: JSON.stringify(payload),
      updatedAt: now
    }).run();

    const created = db.select().from(canvasItems).where(eq(canvasItems.id, Number(insertResult.lastInsertRowid))).get();

    return res.status(201).json({
      success: true,
      item: {
        ...created,
        payload: JSON.parse(created.payloadJson || '{}')
      },
      message: 'Item fixado no mural com sucesso! ✨'
    });
  } catch (err) {
    console.error('[Canvas:Create] Erro:', err);
    return res.status(500).json({ error: 'Falha ao adicionar item no mural.' });
  }
});

/**
 * PATCH /api/canvas/:id
 * Atualiza coordenadas, dimensões, rotação ou conteúdo de um elemento
 */
router.patch('/:id', requireAuth, (req, res) => {
  try {
    const coupleId = req.user.coupleId || 1;
    const itemId = Number(req.params.id);

    const existing = db.select()
      .from(canvasItems)
      .where(and(eq(canvasItems.id, itemId), eq(canvasItems.coupleId, coupleId)))
      .get();

    if (!existing) {
      return res.status(404).json({ error: 'Item do mural não encontrado.' });
    }

    const { x, y, width, height, rotation, zIndex, payload } = req.body;
    const updates = { updatedAt: new Date().toISOString() };

    if (x !== undefined) updates.x = Number(x);
    if (y !== undefined) updates.y = Number(y);
    if (width !== undefined) updates.width = Number(width);
    if (height !== undefined) updates.height = Number(height);
    if (rotation !== undefined) updates.rotation = Number(rotation);
    if (zIndex !== undefined) updates.zIndex = Number(zIndex);
    if (payload !== undefined) updates.payloadJson = JSON.stringify(payload);

    db.update(canvasItems)
      .set(updates)
      .where(eq(canvasItems.id, itemId))
      .run();

    const updated = db.select().from(canvasItems).where(eq(canvasItems.id, itemId)).get();

    return res.json({
      success: true,
      item: {
        ...updated,
        payload: JSON.parse(updated.payloadJson || '{}')
      }
    });
  } catch (err) {
    console.error('[Canvas:Update] Erro:', err);
    return res.status(500).json({ error: 'Falha ao atualizar item do mural.' });
  }
});

/**
 * DELETE /api/canvas/:id
 * Remove um elemento do mural
 */
router.delete('/:id', requireAuth, (req, res) => {
  try {
    const coupleId = req.user.coupleId || 1;
    const itemId = Number(req.params.id);

    db.delete(canvasItems)
      .where(and(eq(canvasItems.id, itemId), eq(canvasItems.coupleId, coupleId)))
      .run();

    return res.json({
      success: true,
      message: 'Item removido do mural.'
    });
  } catch (err) {
    return res.status(500).json({ error: 'Falha ao remover item do mural.' });
  }
});

export default router;
