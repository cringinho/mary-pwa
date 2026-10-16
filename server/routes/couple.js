import express from 'express';
import { db } from '../db/index.js';
import {
  couples,
  users,
  coupleSettings,
  customTags,
  customAlbums,
  customMoods
} from '../db/schema.js';
import { eq, ne, and } from 'drizzle-orm';
import { requireAuth, sanitizeUser } from '../middlewares/auth.js';

const router = express.Router();

const TABLE_MAP = {
  tags: customTags,
  albums: customAlbums,
  moods: customMoods
};

/**
 * GET /api/couple
 * Retorna dados sincronizados de ambos os parceiros, configurações do casal e customizações (tags, álbuns, humores)
 */
router.get('/', requireAuth, (req, res) => {
  try {
    const coupleId = req.user.coupleId || 1;
    const me = sanitizeUser(req.user);

    const partnerRaw = db.select()
      .from(users)
      .where(and(eq(users.coupleId, coupleId), ne(users.id, req.user.id)))
      .get();

    const partner = sanitizeUser(partnerRaw);
    const couple = db.select().from(couples).where(eq(couples.id, coupleId)).get();
    const legacySettings = db.select().from(coupleSettings).get();

    const tags = db.select().from(customTags).where(eq(customTags.coupleId, coupleId)).all();
    const albums = db.select().from(customAlbums).where(eq(customAlbums.coupleId, coupleId)).all();
    const moods = db.select().from(customMoods).where(eq(customMoods.coupleId, coupleId)).all();

    return res.json({
      success: true,
      me,
      partner,
      couple,
      settings: {
        anniversaryDate: couple?.anniversaryDate || legacySettings?.anniversaryDate || '2026-01-30',
        specialDatesJson: couple?.specialDatesJson || legacySettings?.specialDatesJson || '[]',
        enableBibleVerses: Boolean(couple?.enableBibleVerses),
        inviteCode: couple?.inviteCode || 'AMOR26',
        coupleName: couple?.coupleName || 'Nosso Universo',
        planTier: couple?.planTier || 'freemium'
      },
      customizations: {
        tags,
        albums,
        moods
      }
    });
  } catch (err) {
    console.error('[Couple:Get] Erro ao buscar dados do casal:', err);
    return res.status(500).json({ error: 'Falha ao buscar dados do casal.' });
  }
});

/**
 * PATCH /api/couple/settings
 * Atualiza configurações do casal (data de aniversário, toggle de versículos bíblicos, nome do casal, datas especiais)
 */
router.patch('/settings', requireAuth, (req, res) => {
  try {
    const coupleId = req.user.coupleId || 1;
    const { anniversaryDate, coupleName, enableBibleVerses, specialDates } = req.body;

    const updates = {};
    if (typeof anniversaryDate === 'string' && anniversaryDate.trim()) {
      updates.anniversaryDate = anniversaryDate.trim();
    }
    if (typeof coupleName === 'string' && coupleName.trim()) {
      updates.coupleName = coupleName.trim().slice(0, 80);
    }
    if (typeof enableBibleVerses !== 'undefined') {
      updates.enableBibleVerses = enableBibleVerses ? 1 : 0;
    }
    if (Array.isArray(specialDates)) {
      updates.specialDatesJson = JSON.stringify(specialDates);
    }

    if (Object.keys(updates).length > 0) {
      db.update(couples).set(updates).where(eq(couples.id, coupleId)).run();

      // Mantém sincronia com couple_settings legado caso seja coupleId === 1
      if (coupleId === 1 && (updates.anniversaryDate || updates.specialDatesJson)) {
        const legacy = db.select().from(coupleSettings).get();
        if (legacy) {
          db.update(coupleSettings)
            .set({
              anniversaryDate: updates.anniversaryDate || legacy.anniversaryDate,
              specialDatesJson: updates.specialDatesJson || legacy.specialDatesJson
            })
            .where(eq(coupleSettings.id, legacy.id))
            .run();
        }
      }
    }

    const updatedCouple = db.select().from(couples).where(eq(couples.id, coupleId)).get();

    return res.json({
      success: true,
      message: 'Configurações do casal atualizadas com sucesso!',
      couple: updatedCouple,
      settings: {
        anniversaryDate: updatedCouple?.anniversaryDate || '2026-01-30',
        specialDatesJson: updatedCouple?.specialDatesJson || '[]',
        enableBibleVerses: Boolean(updatedCouple?.enableBibleVerses),
        inviteCode: updatedCouple?.inviteCode || 'AMOR26',
        coupleName: updatedCouple?.coupleName || 'Nosso Universo',
        planTier: updatedCouple?.planTier || 'freemium'
      }
    });
  } catch (err) {
    console.error('[Couple:PatchSettings] Erro:', err);
    return res.status(500).json({ error: 'Falha ao atualizar configurações do casal.' });
  }
});

/**
 * GET /api/couple/customizations
 * Lista tags, álbuns e humores customizados do casal
 */
router.get('/customizations', requireAuth, (req, res) => {
  try {
    const coupleId = req.user.coupleId || 1;
    const tags = db.select().from(customTags).where(eq(customTags.coupleId, coupleId)).all();
    const albums = db.select().from(customAlbums).where(eq(customAlbums.coupleId, coupleId)).all();
    const moods = db.select().from(customMoods).where(eq(customMoods.coupleId, coupleId)).all();

    return res.json({
      success: true,
      tags,
      albums,
      moods
    });
  } catch (err) {
    return res.status(500).json({ error: 'Falha ao carregar personalizações.' });
  }
});

/**
 * POST /api/couple/customizations/:type
 * Cria nova tag, álbum ou humor customizado (type = 'tags' | 'albums' | 'moods')
 */
router.post('/customizations/:type', requireAuth, (req, res) => {
  try {
    const coupleId = req.user.coupleId || 1;
    const { type } = req.params;
    const table = TABLE_MAP[type];
    if (!table) {
      return res.status(400).json({ error: 'Tipo de personalização inválido.' });
    }

    const { name, label, color = '#EC4899', iconName, emoji } = req.body;
    const rawName = name ?? label;
    const rawIcon = iconName ?? emoji ?? 'Sparkles';
    if (!rawName || !String(rawName).trim()) {
      return res.status(400).json({ error: 'O nome é obrigatório.' });
    }

    const cleanName = String(rawName).trim().slice(0, 40);
    const now = new Date().toISOString();

    const insertRes = db.insert(table).values({
      coupleId,
      name: cleanName,
      color: String(color).trim().slice(0, 20),
      iconName: String(rawIcon).trim().slice(0, 40),
      createdAt: now
    }).run();

    const created = db.select().from(table).where(eq(table.id, Number(insertRes.lastInsertRowid))).get();

    return res.status(201).json({
      success: true,
      item: created,
      message: `"${cleanName}" adicionado com sucesso!`
    });
  } catch (err) {
    console.error('[Couple:CreateCustomization] Erro:', err);
    return res.status(500).json({ error: 'Falha ao criar item personalizado.' });
  }
});

/**
 * PATCH /api/couple/customizations/:type/:id
 * Edita nome, cor ou ícone de qualquer tag, álbum ou humor existente
 */
router.patch('/customizations/:type/:id', requireAuth, (req, res) => {
  try {
    const coupleId = req.user.coupleId || 1;
    const { type, id } = req.params;
    const table = TABLE_MAP[type];
    if (!table) {
      return res.status(400).json({ error: 'Tipo de personalização inválido.' });
    }

    const itemId = Number(id);
    const { name, label, color, iconName, emoji } = req.body;
    const rawName = name ?? label;
    const rawIcon = iconName ?? emoji;
    const updates = {};
    if (typeof rawName === 'string' && rawName.trim()) updates.name = rawName.trim().slice(0, 40);
    if (typeof color === 'string' && color.trim()) updates.color = color.trim().slice(0, 20);
    if (typeof rawIcon === 'string' && rawIcon.trim()) updates.iconName = rawIcon.trim().slice(0, 40);

    db.update(table)
      .set(updates)
      .where(and(eq(table.id, itemId), eq(table.coupleId, coupleId)))
      .run();

    const updated = db.select().from(table).where(eq(table.id, itemId)).get();
    return res.json({
      success: true,
      item: updated,
      message: 'Personalização atualizada!'
    });
  } catch (err) {
    return res.status(500).json({ error: 'Falha ao editar personalização.' });
  }
});

/**
 * DELETE /api/couple/customizations/:type/:id
 * Exclui qualquer tag, álbum ou humor (inclusive os padrões pré-existentes)
 */
router.delete('/customizations/:type/:id', requireAuth, (req, res) => {
  try {
    const coupleId = req.user.coupleId || 1;
    const { type, id } = req.params;
    const table = TABLE_MAP[type];
    if (!table) {
      return res.status(400).json({ error: 'Tipo de personalização inválido.' });
    }

    const itemId = Number(id);
    db.delete(table)
      .where(and(eq(table.id, itemId), eq(table.coupleId, coupleId)))
      .run();

    return res.json({
      success: true,
      message: 'Item removido com sucesso.'
    });
  } catch (err) {
    return res.status(500).json({ error: 'Falha ao excluir item.' });
  }
});

export default router;
