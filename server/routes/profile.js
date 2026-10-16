import express from 'express';
import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { requireAuth, sanitizeUser } from '../middlewares/auth.js';
import { calculateZodiacSign } from '../utils/zodiac.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const avatarsDir = path.resolve(__dirname, '../uploads/avatars');
if (!fs.existsSync(avatarsDir)) {
  fs.mkdirSync(avatarsDir, { recursive: true });
}

// Multer configurado em memória para pós-processamento com Sharp
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 15 * 1024 * 1024 // 15MB máximo para upload
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
 * POST /api/profile/avatar
 * Upload com recorte 400x400 cover, compressão WebP (quality 85) e remoção de avatar antigo
 */
router.post('/avatar', requireAuth, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhuma imagem foi enviada.' });
    }

    const currentUserId = req.user.id;
    const currentUser = db.select().from(users).where(eq(users.id, currentUserId)).get();

    // 1. Apagar avatar antigo do disco para economizar espaço na VM
    if (currentUser?.avatarUrl && currentUser.avatarUrl.startsWith('/api/uploads/avatars/')) {
      const oldFilename = path.basename(currentUser.avatarUrl);
      const oldFilePath = path.join(avatarsDir, oldFilename);
      if (fs.existsSync(oldFilePath)) {
        try {
          fs.unlinkSync(oldFilePath);
          console.log(`[Profile] Avatar antigo removido: ${oldFilename}`);
        } catch (cleanupErr) {
          console.warn('[Profile] Aviso ao remover avatar antigo:', cleanupErr.message);
        }
      }
    }

    // 2. Processar e comprimir nova imagem com Sharp (WebP 400x400 cover)
    const newFilename = `avatar_${currentUser.username}_${Date.now()}.webp`;
    const newFilePath = path.join(avatarsDir, newFilename);

    await sharp(req.file.buffer)
      .rotate() // Respeita rotação EXIF de fotos do smartphone
      .resize(400, 400, {
        fit: 'cover',
        position: 'center'
      })
      .webp({ quality: 85 })
      .toFile(newFilePath);

    const publicAvatarUrl = `/api/uploads/avatars/${newFilename}`;
    const now = new Date().toISOString();

    // 3. Persistir no SQLite
    db.update(users)
      .set({
        avatarUrl: publicAvatarUrl,
        updatedAt: now
      })
      .where(eq(users.id, currentUserId))
      .run();

    const updatedUser = db.select().from(users).where(eq(users.id, currentUserId)).get();

    return res.json({
      success: true,
      message: 'Foto de perfil atualizada com sucesso!',
      avatarUrl: publicAvatarUrl,
      user: sanitizeUser(updatedUser)
    });
  } catch (err) {
    console.error('[Profile:Avatar] Erro:', err);
    return res.status(500).json({ error: err.message || 'Falha ao processar a imagem de perfil.' });
  }
});

/**
 * PATCH /api/profile
 * Atualiza campos customizáveis de perfil (displayName, nickname, bio, moodStatus, theme, bannerColor)
 */
router.patch('/', requireAuth, (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { displayName, nickname, bio, moodStatus, theme, bannerColor, birthDate } = req.body;

    const updates = {
      updatedAt: new Date().toISOString()
    };

    if (typeof displayName === 'string' && displayName.trim().length > 0) {
      updates.displayName = displayName.trim().slice(0, 50);
    }
    if (typeof nickname === 'string') {
      updates.nickname = nickname.trim().slice(0, 50);
    }
    if (typeof bio === 'string') {
      updates.bio = bio.trim().slice(0, 300);
    }
    if (typeof moodStatus === 'string') {
      updates.moodStatus = moodStatus.trim().slice(0, 100);
    }
    if (typeof theme === 'string') {
      updates.theme = theme.trim().slice(0, 50);
    }
    if (typeof bannerColor === 'string') {
      updates.bannerColor = bannerColor.trim().slice(0, 20);
    }
    if (typeof birthDate === 'string' && birthDate.trim()) {
      updates.birthDate = birthDate.trim();
      updates.zodiacSign = calculateZodiacSign(birthDate.trim());
    }

    db.update(users).set(updates).where(eq(users.id, currentUserId)).run();

    const updatedUser = db.select().from(users).where(eq(users.id, currentUserId)).get();

    return res.json({
      success: true,
      message: 'Perfil atualizado com sucesso!',
      user: sanitizeUser(updatedUser)
    });
  } catch (err) {
    console.error('[Profile:Patch] Erro:', err);
    return res.status(500).json({ error: 'Falha ao atualizar informações do perfil.' });
  }
});

/**
 * DELETE /api/account/purge
 * Exclusão definitiva de conta e expurgo completo de dados (LGPD & Google Play)
 */
router.delete('/purge', requireAuth, (req, res) => {
  try {
    const userId = req.user.id;
    const coupleId = req.user.coupleId || 1;

    // Verificar se há outro membro no casal
    const otherUsers = sqlite.prepare(`
      SELECT id FROM users WHERE couple_id = ? AND id != ?
    `).all(coupleId, userId);

    // Se era o único membro ou casal optou por deletar tudo, remove memórias e arquivos do casal
    if (otherUsers.length === 0) {
      sqlite.prepare('DELETE FROM memories WHERE couple_id = ?').run(coupleId);
      sqlite.prepare('DELETE FROM memory_media WHERE couple_id = ?').run(coupleId);
      sqlite.prepare('DELETE FROM canvas_items WHERE couple_id = ?').run(coupleId);
      sqlite.prepare('DELETE FROM daily_feelings WHERE couple_id = ?').run(coupleId);
      sqlite.prepare('DELETE FROM partner_telemetry WHERE couple_id = ?').run(coupleId);
      sqlite.prepare('DELETE FROM minigame_answers WHERE couple_id = ?').run(coupleId);
      sqlite.prepare('DELETE FROM couple_rewards WHERE couple_id = ?').run(coupleId);
      sqlite.prepare('DELETE FROM reward_submissions WHERE couple_id = ?').run(coupleId);
      sqlite.prepare('DELETE FROM couples WHERE id = ?').run(coupleId);
    } else {
      // Exclui apenas registros criados pelo usuário
      sqlite.prepare('DELETE FROM memories WHERE author_id = ?').run(userId);
      sqlite.prepare('DELETE FROM memory_media WHERE uploaded_by = ?').run(userId);
      sqlite.prepare('DELETE FROM daily_feelings WHERE user_id = ?').run(userId);
      sqlite.prepare('DELETE FROM partner_telemetry WHERE user_id = ?').run(userId);
      sqlite.prepare('DELETE FROM minigame_answers WHERE user_id = ?').run(userId);
    }

    // Exclui o usuário
    sqlite.prepare('DELETE FROM users WHERE id = ?').run(userId);

    res.clearCookie('token');
    return res.json({
      success: true,
      message: 'Sua conta e seus dados foram expurgados permanentemente com sucesso.'
    });
  } catch (err) {
    console.error('[Profile:Purge] Erro:', err);
    return res.status(500).json({ error: 'Falha ao expurgar conta e dados.' });
  }
});

export default router;
