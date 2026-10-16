import express from 'express';
import { db } from '../db/index.js';
import { memories, memoryMedia, memoryConnections, wordNodes, users } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { requireAuth } from '../middlewares/auth.js';
import { analyzeMemoriesWords, normalizeWord } from '../utils/wordAnalyzer.js';

const router = express.Router();

/**
 * GET /api/graph/data
 * Retorna dados completos para os dois modos do Grafo (Memórias e Palavras), incluindo positionX e positionY persistidos
 */
router.get('/data', requireAuth, (req, res) => {
  try {
    const coupleId = req.user.coupleId || 1;
    const rawMemories = db.select()
      .from(memories)
      .where(eq(memories.coupleId, coupleId))
      .orderBy(memories.memoryDate)
      .all();

    const allMedia = db.select().from(memoryMedia).all();
    const allUsers = db.select().from(users).all();
    const userMap = new Map(allUsers.map(u => [u.id, u]));

    // 1. Memory Nodes
    const memoryNodes = rawMemories.map((m) => {
      const author = userMap.get(m.authorId);
      const mediaList = allMedia.filter(med => med.memoryId === m.id);
      let parsedTags = [];
      try {
        parsedTags = m.tags ? JSON.parse(m.tags) : [];
      } catch (e) {
        parsedTags = typeof m.tags === 'string' ? m.tags.split(',') : [];
      }

      return {
        id: `mem-${m.id}`,
        memoryId: m.id,
        title: m.title,
        memoryDate: m.memoryDate,
        mood: m.mood,
        tags: parsedTags,
        location: m.location,
        authorId: m.authorId,
        authorName: author?.nickname || author?.displayName || 'Autor',
        authorUsername: author?.username || 'mary',
        thumbUrl: mediaList[0]?.thumbUrl || mediaList[0]?.fileUrl || null,
        photoCount: mediaList.length,
        positionX: Number(m.positionX || 0),
        positionY: Number(m.positionY || 0)
      };
    });

    // 2. Memory Direct Edges (de memory_connections)
    const memoryIdSet = new Set(rawMemories.map(m => m.id));
    const rawConnections = db.select().from(memoryConnections).all();
    const memoryEdges = rawConnections
      .filter(c => memoryIdSet.has(c.sourceMemoryId) && memoryIdSet.has(c.targetMemoryId))
      .map(c => ({
        id: `edge-conn-${c.id}`,
        connectionId: c.id,
        source: `mem-${c.sourceMemoryId}`,
        target: `mem-${c.targetMemoryId}`,
        label: c.label || 'Momento Conectado',
        type: 'smoothstep',
        animated: true
      }));

    // 3. Registered Words & Suggestions (com wordAnalyzer)
    const rawWordNodes = db.select()
      .from(wordNodes)
      .where(eq(wordNodes.coupleId, coupleId))
      .all();

    const { registeredWords: analyzedWords, suggestedWords } = analyzeMemoriesWords(rawMemories, rawWordNodes);
    const wordPosMap = new Map(rawWordNodes.map(w => [w.id, { x: Number(w.positionX || 0), y: Number(w.positionY || 0) }]));
    const registeredWords = analyzedWords.map(w => ({
      ...w,
      positionX: wordPosMap.get(w.id)?.x || 0,
      positionY: wordPosMap.get(w.id)?.y || 0
    }));

    // 4. Co-ocorrências entre palavras (ligações entre palavras que aparecem juntas)
    const wordCoOccurrences = [];
    for (let i = 0; i < registeredWords.length; i++) {
      for (let j = i + 1; j < registeredWords.length; j++) {
        const w1 = registeredWords[i];
        const w2 = registeredWords[j];
        const sharedMemories = w1.memoryIds.filter(id => w2.memoryIds.includes(id));
        if (sharedMemories.length > 0) {
          wordCoOccurrences.push({
            id: `edge-word-${w1.id}-${w2.id}`,
            source: `word-${w1.id}`,
            target: `word-${w2.id}`,
            sharedCount: sharedMemories.length,
            memoryIds: sharedMemories
          });
        }
      }
    }

    return res.json({
      success: true,
      memoryNodes,
      memoryEdges,
      registeredWords,
      suggestedWords,
      wordCoOccurrences
    });
  } catch (err) {
    console.error('[Graph:Data] Erro:', err);
    return res.status(500).json({ error: 'Falha ao processar dados do grafo.' });
  }
});

/**
 * PATCH /api/graph/node-position
 * Persiste coordenadas (x, y) de um nó de memória ou palavra após onNodeDragStop (Correção Bug 2)
 */
router.patch('/node-position', requireAuth, (req, res) => {
  try {
    const { nodeType, id, nodeId, x, y, positionX, positionY } = req.body;
    const rawId = id ?? nodeId;
    const numericId = Number(String(rawId).replace(/^(mem-|memory_|word-|word_)/, ''));
    const posX = Number(x ?? positionX);
    const posY = Number(y ?? positionY);

    if (!numericId || Number.isNaN(posX) || Number.isNaN(posY)) {
      return res.status(400).json({ error: 'Coordenadas ou ID inválidos.' });
    }

    if (nodeType === 'memory' || /^(mem-|memory_)/.test(String(rawId))) {
      db.update(memories)
        .set({ positionX: posX, positionY: posY })
        .where(eq(memories.id, numericId))
        .run();
    } else if (nodeType === 'word' || /^(word-|word_)/.test(String(rawId))) {
      db.update(wordNodes)
        .set({ positionX: posX, positionY: posY })
        .where(eq(wordNodes.id, numericId))
        .run();
    } else {
      return res.status(400).json({ error: 'Tipo de nó inválido. Use memory ou word.' });
    }

    return res.json({
      success: true,
      id: numericId,
      nodeType,
      x: posX,
      y: posY
    });
  } catch (err) {
    console.error('[Graph:NodePosition] Erro:', err);
    return res.status(500).json({ error: 'Falha ao salvar posição do nó.' });
  }
});

/**
 * POST /api/graph/connections
 * Cria conexão manual entre dois relatos no Grafo (Correção Bug 2)
 */
router.post('/connections', requireAuth, (req, res) => {
  try {
    const { sourceMemoryId, targetMemoryId, label = 'Momento Conectado' } = req.body;
    const srcId = Number(String(sourceMemoryId).replace(/^mem-/, ''));
    const tgtId = Number(String(targetMemoryId).replace(/^mem-/, ''));

    if (!srcId || !tgtId || srcId === tgtId) {
      return res.status(400).json({ error: 'Selecione duas memórias distintas para conectar.' });
    }

    const existing = db.select()
      .from(memoryConnections)
      .where(and(
        eq(memoryConnections.sourceMemoryId, srcId),
        eq(memoryConnections.targetMemoryId, tgtId)
      ))
      .get();

    if (existing) {
      return res.json({
        success: true,
        connection: existing,
        edge: {
          id: `edge-conn-${existing.id}`,
          connectionId: existing.id,
          source: `mem-${existing.sourceMemoryId}`,
          target: `mem-${existing.targetMemoryId}`,
          label: existing.label || 'Momento Conectado'
        }
      });
    }

    const insertResult = db.insert(memoryConnections).values({
      sourceMemoryId: srcId,
      targetMemoryId: tgtId,
      label: String(label || 'Momento Conectado').trim(),
      createdAt: new Date().toISOString()
    }).run();

    const created = db.select()
      .from(memoryConnections)
      .where(eq(memoryConnections.id, Number(insertResult.lastInsertRowid)))
      .get();

    return res.status(201).json({
      success: true,
      message: 'Memórias conectadas no grafo! ✨',
      connection: created,
      edge: {
        id: `edge-conn-${created.id}`,
        connectionId: created.id,
        source: `mem-${created.sourceMemoryId}`,
        target: `mem-${created.targetMemoryId}`,
        label: created.label
      }
    });
  } catch (err) {
    console.error('[Graph:CreateConnection] Erro:', err);
    return res.status(500).json({ error: 'Falha ao conectar memórias.' });
  }
});

/**
 * DELETE /api/graph/connections/:id
 * Remove uma conexão entre memórias
 */
router.delete('/connections/:id', requireAuth, (req, res) => {
  try {
    const connId = Number(String(req.params.id).replace(/^edge-conn-/, ''));
    db.delete(memoryConnections).where(eq(memoryConnections.id, connId)).run();
    return res.json({
      success: true,
      message: 'Conexão removida com sucesso.'
    });
  } catch (err) {
    return res.status(500).json({ error: 'Falha ao remover conexão.' });
  }
});

/**
 * POST /api/graph/words
 * Cadastra uma nova palavra ou aprova uma sugestão
 */
router.post('/words', requireAuth, (req, res) => {
  try {
    const coupleId = req.user.coupleId || 1;
    const { word, color = '#EC4899', meaningOrNote = null, iconName = 'Sparkles', positionX = 0, positionY = 0 } = req.body;

    if (!word || !word.trim()) {
      return res.status(400).json({ error: 'A palavra é obrigatória.' });
    }

    const clean = String(word).trim();
    const norm = normalizeWord(clean);

    const existing = db.select().from(wordNodes).where(eq(wordNodes.normalizedWord, norm)).get();
    if (existing) {
      return res.json({
        success: true,
        word: existing,
        message: 'Esta palavra já estava registrada no grafo!'
      });
    }

    const insertResult = db.insert(wordNodes).values({
      coupleId,
      word: clean,
      normalizedWord: norm,
      meaningOrNote: meaningOrNote ? String(meaningOrNote).trim() : null,
      color: String(color || '#EC4899').trim(),
      iconName: String(iconName || 'Sparkles').trim(),
      positionX: Number(positionX || 0),
      positionY: Number(positionY || 0),
      createdBy: req.user.id,
      isCustom: 1,
      createdAt: new Date().toISOString()
    }).run();

    const created = db.select().from(wordNodes).where(eq(wordNodes.id, Number(insertResult.lastInsertRowid))).get();

    return res.status(201).json({
      success: true,
      message: `Palavra "${clean}" eternizada no grafo! ✨`,
      word: created
    });
  } catch (err) {
    console.error('[Graph:WordCreate] Erro:', err);
    return res.status(500).json({ error: 'Falha ao registrar palavra.' });
  }
});

/**
 * DELETE /api/graph/words/:id
 * Remove uma palavra do grafo
 */
router.delete('/words/:id', requireAuth, (req, res) => {
  try {
    const wordId = Number(req.params.id);
    db.delete(wordNodes).where(eq(wordNodes.id, wordId)).run();

    return res.json({
      success: true,
      message: 'Palavra removida do grafo.'
    });
  } catch (err) {
    console.error('[Graph:WordDelete] Erro:', err);
    return res.status(500).json({ error: 'Falha ao remover palavra.' });
  }
});

export default router;
