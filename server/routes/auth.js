import express from 'express';
import bcrypt from 'bcryptjs';
import { db, sqlite } from '../db/index.js';
import { couples, users } from '../db/schema.js';
import { seedDefaultCustomizationsForCouple } from '../db/init.js';
import { eq, or } from 'drizzle-orm';
import {
  COOKIE_NAME,
  generateToken,
  getAuthCookieOptions,
  requireAuth,
  sanitizeUser
} from '../middlewares/auth.js';
import { calculateZodiacSign } from '../utils/zodiac.js';

const router = express.Router();

function generateInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * POST /api/auth/login
 * Autentica por username ou email em arquitetura Multi-Casal
 */
router.post('/login', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const identifier = String(username || email || '').trim().toLowerCase();

    if (!identifier || !password) {
      return res.status(400).json({ error: 'Informe usuário/e-mail e senha.' });
    }

    const user = db.select()
      .from(users)
      .where(or(eq(users.username, identifier), eq(users.email, identifier)))
      .get();

    if (!user) {
      return res.status(401).json({ error: 'Usuário não autorizado neste Universo.' });
    }

    const passwordMatches = await bcrypt.compare(String(password), user.passwordHash);
    if (!passwordMatches) {
      return res.status(401).json({ error: 'Senha incorreta.' });
    }

    const token = generateToken(user);
    res.cookie(COOKIE_NAME, token, getAuthCookieOptions());

    const couple = db.select().from(couples).where(eq(couples.id, user.coupleId || 1)).get();

    return res.json({
      success: true,
      message: `Bem-vindo(a) de volta, ${user.displayName}!`,
      user: sanitizeUser(user),
      couple,
      token
    });
  } catch (err) {
    console.error('[Auth:Login] Erro:', err);
    return res.status(500).json({ error: 'Falha interna durante a autenticação.' });
  }
});

/**
 * POST /api/auth/register
 * Cadastro Multi-Tenant com cálculo automático de signo e criação/pareamento de casal
 */
router.post('/register', async (req, res) => {
  try {
    const {
      displayName,
      nickname,
      email,
      username,
      password,
      birthDate,
      anniversaryDate,
      coupleAction,
      mode,
      inviteCode,
      coupleName
    } = req.body;
    const effectiveAction = coupleAction || mode || (inviteCode ? 'join' : 'create');

    if (!displayName || !password) {
      return res.status(400).json({ error: 'Nome de exibição e senha são obrigatórios.' });
    }

    const cleanEmail = email ? String(email).trim().toLowerCase() : null;
    const baseUsername = username
      ? String(username).trim().toLowerCase()
      : (cleanEmail ? cleanEmail.split('@')[0] : String(displayName).trim().toLowerCase().replace(/[^a-z0-9]/g, '')) + '_' + Math.floor(100 + Math.random() * 900);

    const existingUser = db.select()
      .from(users)
      .where(cleanEmail ? or(eq(users.username, baseUsername), eq(users.email, cleanEmail)) : eq(users.username, baseUsername))
      .get();

    if (existingUser) {
      return res.status(409).json({ error: 'Este usuário ou e-mail já está cadastrado.' });
    }

    const now = new Date().toISOString();
    let targetCouple = null;

    if (effectiveAction === 'join') {
      if (!inviteCode || !String(inviteCode).trim()) {
        return res.status(400).json({ error: 'Informe o código de convite do seu amor.' });
      }
      const cleanCode = String(inviteCode).trim().toUpperCase();
      targetCouple = db.select().from(couples).where(eq(couples.inviteCode, cleanCode)).get();
      if (!targetCouple) {
        return res.status(404).json({ error: 'Código de convite não encontrado. Verifique com seu par!' });
      }
      const members = db.select().from(users).where(eq(users.coupleId, targetCouple.id)).all();
      if (members.length >= 2) {
        return res.status(400).json({ error: 'Este espaço de casal já possui 2 parceiros vinculados.' });
      }
    } else {
      let generatedCode = generateInviteCode();
      while (db.select().from(couples).where(eq(couples.inviteCode, generatedCode)).get()) {
        generatedCode = generateInviteCode();
      }
      const effectiveAnni = anniversaryDate || new Date().toISOString().split('T')[0];
      const coupleInsert = db.insert(couples).values({
        coupleName: coupleName ? String(coupleName).trim() : `Universo de ${displayName}`,
        inviteCode: generatedCode,
        anniversaryDate: effectiveAnni,
        planTier: 'freemium',
        enableBibleVerses: 0, // Desabilitado por padrão conforme Item 14
        specialDatesJson: JSON.stringify([
          { title: 'Início do Nosso Amor', date: effectiveAnni, icon: 'Heart' }
        ]),
        pushSubscriptionsJson: '[]',
        createdAt: now
      }).run();

      const newCoupleId = Number(coupleInsert.lastInsertRowid);
      seedDefaultCustomizationsForCouple(sqlite, newCoupleId, now);
      targetCouple = db.select().from(couples).where(eq(couples.id, newCoupleId)).get();
    }

    const zodiacSign = calculateZodiacSign(birthDate);
    const passwordHash = await bcrypt.hash(String(password), 10);

    const userInsert = db.insert(users).values({
      coupleId: targetCouple.id,
      username: baseUsername,
      email: cleanEmail,
      displayName: String(displayName).trim(),
      nickname: nickname ? String(nickname).trim() : 'Meu Amor',
      passwordHash,
      birthDate: birthDate || null,
      zodiacSign,
      bannerColor: '#EC4899',
      bio: 'Construindo nosso universo juntos ✨',
      moodStatus: 'Apaixonado(a)',
      theme: 'dark-romantic',
      termsAcceptedAt: now,
      privacyAcceptedAt: now,
      termsVersion: 'v1.0-2026',
      updatedAt: now
    }).run();

    const createdUser = db.select().from(users).where(eq(users.id, Number(userInsert.lastInsertRowid))).get();
    const token = generateToken(createdUser);
    res.cookie(COOKIE_NAME, token, getAuthCookieOptions());

    return res.status(201).json({
      success: true,
      message: 'Conta criada com sucesso! Bem-vindo(a) ao Nosso Universo ✨',
      user: sanitizeUser(createdUser),
      couple: targetCouple,
      token
    });
  } catch (err) {
    console.error('[Auth:Register] Erro:', err);
    return res.status(500).json({ error: 'Falha ao registrar nova conta.' });
  }
});

/**
 * GET /api/auth/me
 * Retorna dados da sessão ativa + dados do casal
 */
router.get('/me', requireAuth, (req, res) => {
  const couple = db.select().from(couples).where(eq(couples.id, req.user.coupleId || 1)).get();
  return res.json({
    authenticated: true,
    user: req.user,
    couple
  });
});

/**
 * POST /api/auth/logout
 * Limpa cookie da sessão
 */
router.post('/logout', (req, res) => {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  });
  return res.json({
    success: true,
    message: 'Sessão encerrada com sucesso.'
  });
});

export default router;
