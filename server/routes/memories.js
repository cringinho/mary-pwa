import express from 'express';
import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { db } from '../db/index.js';
import { memories, memoryMedia, memoryLikes, memoryConnections, users, wordNodes } from '../db/schema.js';
import { eq, desc, inArray, or } from 'drizzle-orm';
import { requireAuth, sanitizeUser } from '../middlewares/auth.js';
import { sendPushToPartner } from '../pushService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsMemoriesDir = path.resolve(__dirname, '../uploads/memories');
const thumbsMemoriesDir = path.resolve(__dirname, '../uploads/memories/thumbs');

if (!fs.existsSync(thumbsMemoriesDir)) {
  fs.mkdirSync(thumbsMemoriesDir, { recursive: true });
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024,
    files: 10
  },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Apenas arquivos de imagem são permitidos.'));
    }
    cb(null, true);
  }
});

const router = express.Router();

/**
 * Normalizador Único de DTO de Memórias (Correção Definitiva do Bug 1 - Tela Preta)
 * Garante estrutura idêntica em GET, POST e PUT para nunca quebrar .map() no React/IndexedDB/MiniSearch
 */
export function normalizeMemoryDTO(rawMemory, mediaList = [], likesList = [], connectionsList = [], authorObj = null) {
  const now = new Date();
  const isCapsuleBool = Boolean(rawMemory.isCapsule);
  const isLocked = isCapsuleBool && Boolean(rawMemory.unlockAt) && new Date(rawMemory.unlockAt) > now;

  let safeTags = [];
  if (Array.isArray(rawMemory.tags)) {
    safeTags = rawMemory.tags.map(t => String(t).trim()).filter(Boolean);
  } else if (typeof rawMemory.tags === 'string' && rawMemory.tags.trim()) {
    try {
      const parsed = JSON.parse(rawMemory.tags);
      safeTags = Array.isArray(parsed)
        ? parsed.map(t => String(t).trim()).filter(Boolean)
        : rawMemory.tags.split(',').map(s => s.trim()).filter(Boolean);
    } catch (e) {
      safeTags = rawMemory.tags.split(',').map(s => s.trim()).filter(Boolean);
    }
  }

  const safeMedia = Array.isArray(mediaList) ? mediaList : [];
  const safeLikes = Array.isArray(likesList) ? likesList : [];
  const safeConnections = Array.isArray(connectionsList) ? connectionsList : [];

  return {
    id: Number(rawMemory.id),
    coupleId: Number(rawMemory.coupleId || 1),
    authorId: Number(rawMemory.authorId),
    author: authorObj || { displayName: 'Autor', nickname: '' },
    title: String(rawMemory.title || ''),
    content: isLocked
      ? `🔒 Esta cápsula do tempo está selada com amor e só será aberta em ${new Date(rawMemory.unlockAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}.`
      : String(rawMemory.content || ''),
    memoryDate: String(rawMemory.memoryDate || ''),
    mood: rawMemory.mood || null,
    tags: safeTags,
    location: rawMemory.location || null,
    isCapsule: isCapsuleBool,
    unlockAt: rawMemory.unlockAt || null,
    isLocked,
    positionX: Number(rawMemory.positionX || 0),
    positionY: Number(rawMemory.positionY || 0),
    createdAt: rawMemory.createdAt,
    updatedAt: rawMemory.updatedAt,
    media: isLocked ? [] : safeMedia,
    likes: safeLikes,
    connectionsCount: safeConnections.length,
    connections: safeConnections
  };
}

/**
 * GET /api/memories
 * Lista relatos do casal com imagens, likes/reações, conexões do grafo e guarda de Cápsula do Tempo
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const coupleId = req.user.coupleId || 1;
    const rawMemories = db.select()
      .from(memories)
      .where(eq(memories.coupleId, coupleId))
      .orderBy(desc(memories.memoryDate), desc(memories.id))
      .all();

    if (rawMemories.length === 0) {
      return res.json({ success: true, memories: [] });
    }

    const memoryIds = rawMemories.map(m => m.id);

    const allMedia = db.select()
      .from(memoryMedia)
      .where(inArray(memoryMedia.memoryId, memoryIds))
      .all();

    const allLikes = db.select({
      id: memoryLikes.id,
      memoryId: memoryLikes.memoryId,
      userId: memoryLikes.userId,
      reaction: memoryLikes.reaction,
      createdAt: memoryLikes.createdAt,
      username: users.username,
      displayName: users.displayName,
      nickname: users.nickname,
      avatarUrl: users.avatarUrl
    })
      .from(memoryLikes)
      .leftJoin(users, eq(memoryLikes.userId, users.id))
      .where(inArray(memoryLikes.memoryId, memoryIds))
      .all();

    const allConnections = db.select()
      .from(memoryConnections)
      .where(or(
        inArray(memoryConnections.sourceMemoryId, memoryIds),
        inArray(memoryConnections.targetMemoryId, memoryIds)
      ))
      .all();

    const allUsers = db.select().from(users).all();
    const userMap = new Map(allUsers.map(u => [u.id, sanitizeUser(u)]));

    const formatted = rawMemories.map((m) => {
      const author = userMap.get(m.authorId) || { displayName: 'Desconhecido', nickname: '' };
      const mediaList = allMedia.filter(med => med.memoryId === m.id);
      const likesList = allLikes.filter(l => l.memoryId === m.id);
      const connectionsList = allConnections.filter(c => c.sourceMemoryId === m.id || c.targetMemoryId === m.id);

      return normalizeMemoryDTO(m, mediaList, likesList, connectionsList, author);
    });

    return res.json({ success: true, memories: formatted });
  } catch (err) {
    console.error('[Memories:Get] Erro ao listar:', err);
    return res.status(500).json({ error: 'Falha ao buscar relatos.' });
  }
});

/**
 * POST /api/memories
 * Cria relato com upload múltiplo de imagens comprimidas com Sharp (.webp) e retorna DTO normalizado
 */
router.post('/', requireAuth, upload.array('images', 10), async (req, res) => {
  try {
    const coupleId = req.user.coupleId || 1;
    const {
      title,
      content,
      memoryDate,
      mood,
      tags,
      location,
      isCapsule,
      unlockAt,
      connectedMemoryIds,
      customWords
    } = req.body;

    if (!title || !content || !memoryDate) {
      return res.status(400).json({ error: 'Título, conteúdo e data do relato são obrigatórios.' });
    }

    const now = new Date().toISOString();

    let parsedTags = '[]';
    if (tags) {
      if (Array.isArray(tags)) parsedTags = JSON.stringify(tags);
      else if (typeof tags === 'string') {
        try {
          parsedTags = JSON.stringify(JSON.parse(tags));
        } catch (e) {
          parsedTags = JSON.stringify(tags.split(',').map(t => t.trim()).filter(Boolean));
        }
      }
    }

    // 1. Inserir relato
    const insertResult = db.insert(memories).values({
      coupleId,
      authorId: req.user.id,
      title: String(title).trim(),
      content: String(content).trim(),
      memoryDate: String(memoryDate).trim(),
      mood: mood ? String(mood).trim() : null,
      tags: parsedTags,
      location: location ? String(location).trim() : null,
      isCapsule: isCapsule === 'true' || isCapsule === true || isCapsule === 1 ? 1 : 0,
      unlockAt: unlockAt ? String(unlockAt).trim() : null,
      positionX: 0,
      positionY: 0,
      createdAt: now,
      updatedAt: now
    }).run();

    const memoryId = Number(insertResult.lastInsertRowid);

    // 2. Processar imagens anexadas com Sharp
    const savedMedia = [];
    if (req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        const timestamp = Date.now();
        const mainFilename = `memory_${memoryId}_${i}_${timestamp}.webp`;
        const thumbFilename = `thumb_${memoryId}_${i}_${timestamp}.webp`;

        const mainPath = path.join(uploadsMemoriesDir, mainFilename);
        const thumbPath = path.join(thumbsMemoriesDir, thumbFilename);

        const metadata = await sharp(file.buffer).metadata();

        await sharp(file.buffer)
          .rotate()
          .resize(1600, 1600, { fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 82 })
          .toFile(mainPath);

        await sharp(file.buffer)
          .rotate()
          .resize(400, 400, { fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 75 })
          .toFile(thumbPath);

        const mediaInsert = db.insert(memoryMedia).values({
          coupleId,
          memoryId,
          uploadedBy: req.user.id,
          albumName: 'Relatos',
          caption: null,
          fileUrl: `/api/uploads/memories/${mainFilename}`,
          thumbUrl: `/api/uploads/memories/thumbs/${thumbFilename}`,
          width: metadata.width || 800,
          height: metadata.height || 600,
          isFavorite: 0,
          takenAt: String(memoryDate).trim(),
          createdAt: now
        }).run();

        const createdMediaRow = db.select()
          .from(memoryMedia)
          .where(eq(memoryMedia.id, Number(mediaInsert.lastInsertRowid)))
          .get();
        if (createdMediaRow) savedMedia.push(createdMediaRow);
      }
    }

    // 3. Vincular memórias conectadas
    const savedConnections = [];
    if (connectedMemoryIds) {
      let ids = [];
      try {
        ids = Array.isArray(connectedMemoryIds) ? connectedMemoryIds : JSON.parse(connectedMemoryIds);
      } catch (e) {
        ids = String(connectedMemoryIds).split(',').map(s => Number(s.trim())).filter(Boolean);
      }

      for (const targetId of ids) {
        if (targetId && Number(targetId) !== memoryId) {
          const connInsert = db.insert(memoryConnections).values({
            sourceMemoryId: memoryId,
            targetMemoryId: Number(targetId),
            label: 'Conectado',
            createdAt: now
          }).run();
          const createdConn = db.select()
            .from(memoryConnections)
            .where(eq(memoryConnections.id, Number(connInsert.lastInsertRowid)))
            .get();
          if (createdConn) savedConnections.push(createdConn);
        }
      }
    }

    // 4. Cadastrar palavras customizadas no grafo
    if (customWords) {
      let wordsArr = [];
      try {
        wordsArr = Array.isArray(customWords) ? customWords : JSON.parse(customWords);
      } catch (e) {
        wordsArr = String(customWords).split(',').map(s => s.trim()).filter(Boolean);
      }

      for (const wordStr of wordsArr) {
        const clean = String(wordStr).trim();
        const norm = clean.toLowerCase();
        if (clean.length > 1) {
          const exists = db.select().from(wordNodes).where(eq(wordNodes.normalizedWord, norm)).get();
          if (!exists) {
            db.insert(wordNodes).values({
              coupleId,
              word: clean,
              normalizedWord: norm,
              meaningOrNote: `Criada no relato "${title}"`,
              color: '#EC4899',
              iconName: 'Sparkles',
              positionX: 0,
              positionY: 0,
              createdBy: req.user.id,
              isCustom: 1,
              createdAt: now
            }).run();
          }
        }
      }
    }

    const created = db.select().from(memories).where(eq(memories.id, memoryId)).get();

    // Dispara notificação push para o parceiro
    sendPushToPartner(req.user.id, {
      title: '💌 Nova Memória no Universo!',
      body: `${req.user.nickname || req.user.displayName} adicionou: "${title}"`,
      url: '/?tab=feed'
    }).catch(() => null);

    const normalizedMemory = normalizeMemoryDTO(
      created,
      savedMedia,
      [],
      savedConnections,
      sanitizeUser(req.user)
    );

    return res.status(201).json({
      success: true,
      message: 'Relato gravado no Universo com sucesso! ✨',
      memory: normalizedMemory
    });
  } catch (err) {
    console.error('[Memories:Create] Erro ao criar relato:', err);
    return res.status(500).json({ error: err.message || 'Falha ao salvar relato.' });
  }
});

/**
 * PUT /api/memories/:id
 * Atualiza um relato existente e retorna o DTO normalizado
 */
router.put('/:id', requireAuth, (req, res) => {
  try {
    const memoryId = Number(req.params.id);
    const existing = db.select().from(memories).where(eq(memories.id, memoryId)).get();
    if (!existing) {
      return res.status(404).json({ error: 'Relato não encontrado.' });
    }

    const { title, content, memoryDate, mood, tags, location } = req.body;
    const now = new Date().toISOString();

    const updates = { updatedAt: now };
    if (typeof title === 'string' && title.trim()) updates.title = title.trim();
    if (typeof content === 'string' && content.trim()) updates.content = content.trim();
    if (typeof memoryDate === 'string' && memoryDate.trim()) updates.memoryDate = memoryDate.trim();
    if (typeof mood !== 'undefined') updates.mood = mood ? String(mood).trim() : null;
    if (typeof location !== 'undefined') updates.location = location ? String(location).trim() : null;
    if (typeof tags !== 'undefined') {
      updates.tags = Array.isArray(tags) ? JSON.stringify(tags) : String(tags);
    }

    db.update(memories).set(updates).where(eq(memories.id, memoryId)).run();

    const updated = db.select().from(memories).where(eq(memories.id, memoryId)).get();
    const mediaList = db.select().from(memoryMedia).where(eq(memoryMedia.memoryId, memoryId)).all();
    const likesList = db.select({
      id: memoryLikes.id,
      memoryId: memoryLikes.memoryId,
      userId: memoryLikes.userId,
      reaction: memoryLikes.reaction,
      createdAt: memoryLikes.createdAt,
      username: users.username,
      displayName: users.displayName,
      nickname: users.nickname,
      avatarUrl: users.avatarUrl
    })
      .from(memoryLikes)
      .leftJoin(users, eq(memoryLikes.userId, users.id))
      .where(eq(memoryLikes.memoryId, memoryId))
      .all();

    const connectionsList = db.select()
      .from(memoryConnections)
      .where(or(
        eq(memoryConnections.sourceMemoryId, memoryId),
        eq(memoryConnections.targetMemoryId, memoryId)
      ))
      .all();

    const author = db.select().from(users).where(eq(users.id, updated.authorId)).get();

    return res.json({
      success: true,
      memory: normalizeMemoryDTO(updated, mediaList, likesList, connectionsList, sanitizeUser(author))
    });
  } catch (err) {
    console.error('[Memories:Update] Erro:', err);
    return res.status(500).json({ error: 'Falha ao atualizar relato.' });
  }
});

/**
 * POST /api/memories/:id/like
 * Alterna ou atualiza o like / reação do usuário no relato
 */
router.post('/:id/like', requireAuth, (req, res) => {
  try {
    const memoryId = Number(req.params.id);
    const userId = req.user.id;
    const { reaction = 'heart' } = req.body;

    const validReactions = ['heart', 'sparkle', 'sparkle_heart', 'kuromi', 'fire', 'emotional'];
    const chosenReaction = validReactions.includes(reaction) ? reaction : 'heart';

    const existingLike = db.select()
      .from(memoryLikes)
      .where(eq(memoryLikes.memoryId, memoryId))
      .all()
      .find(l => l.userId === userId);

    let action = 'added';

    if (existingLike) {
      if (existingLike.reaction === chosenReaction) {
        db.delete(memoryLikes).where(eq(memoryLikes.id, existingLike.id)).run();
        action = 'removed';
      } else {
        db.update(memoryLikes)
          .set({ reaction: chosenReaction })
          .where(eq(memoryLikes.id, existingLike.id))
          .run();
        action = 'updated';
      }
    } else {
      db.insert(memoryLikes).values({
        memoryId,
        userId,
        reaction: chosenReaction,
        createdAt: new Date().toISOString()
      }).run();
      action = 'added';
    }

    const updatedLikes = db.select({
      id: memoryLikes.id,
      memoryId: memoryLikes.memoryId,
      userId: memoryLikes.userId,
      reaction: memoryLikes.reaction,
      username: users.username,
      displayName: users.displayName,
      nickname: users.nickname,
      avatarUrl: users.avatarUrl
    })
      .from(memoryLikes)
      .leftJoin(users, eq(memoryLikes.userId, users.id))
      .where(eq(memoryLikes.memoryId, memoryId))
      .all();

    if (action === 'added' || action === 'updated') {
      const memoryItem = db.select().from(memories).where(eq(memories.id, memoryId)).get();
      if (memoryItem && memoryItem.authorId !== req.user.id) {
        sendPushToPartner(req.user.id, {
          title: '❤️ Reação no seu relato!',
          body: `${req.user.nickname || req.user.displayName} amou o seu relato "${memoryItem.title}"!`,
          url: '/?tab=feed'
        }).catch(() => null);
      }
    }

    return res.json({
      success: true,
      action,
      likes: updatedLikes,
      userReaction: action === 'removed' ? null : chosenReaction
    });
  } catch (err) {
    console.error('[Memories:Like] Erro ao alternar like:', err);
    return res.status(500).json({ error: 'Falha ao processar reação.' });
  }
});

/**
 * DELETE /api/memories/:id
 * Remove relato e arquivos anexados
 */
router.delete('/:id', requireAuth, (req, res) => {
  try {
    const memoryId = Number(req.params.id);
    const memory = db.select().from(memories).where(eq(memories.id, memoryId)).get();

    if (!memory) {
      return res.status(404).json({ error: 'Relato não encontrado.' });
    }

    if (memory.authorId !== req.user.id) {
      return res.status(403).json({ error: 'Você não tem permissão para apagar este relato.' });
    }

    const mediaFiles = db.select().from(memoryMedia).where(eq(memoryMedia.memoryId, memoryId)).all();
    for (const m of mediaFiles) {
      try {
        const mainPath = path.join(uploadsMemoriesDir, path.basename(m.fileUrl));
        const thumbPath = path.join(thumbsMemoriesDir, path.basename(m.thumbUrl || ''));
        if (fs.existsSync(mainPath)) fs.unlinkSync(mainPath);
        if (fs.existsSync(thumbPath)) fs.unlinkSync(thumbPath);
      } catch (fileErr) {
        console.warn('[Memories:Delete] Aviso ao remover arquivo:', fileErr.message);
      }
    }

    db.delete(memories).where(eq(memories.id, memoryId)).run();

    return res.json({ success: true, message: 'Relato removido com sucesso.' });
  } catch (err) {
    console.error('[Memories:Delete] Erro ao deletar relato:', err);
    return res.status(500).json({ error: 'Falha ao excluir relato.' });
  }
});

export default router;
