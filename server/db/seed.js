import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { db, sqlite } from './index.js';
import { couples, users, wordNodes, coupleSettings } from './schema.js';
import { seedDefaultCustomizationsForCouple } from './init.js';
import { eq } from 'drizzle-orm';

export async function runSeed() {
  console.log('🌱 [Seed] Iniciando população do banco SQLite Nosso Universo...');

  const now = new Date().toISOString();
  const lehPass = process.env.LEH_PASSWORD || 'cringinho123';
  const maryPass = process.env.MARY_PASSWORD || 'maricota123';

  const lehHash = await bcrypt.hash(lehPass, 10);
  const maryHash = await bcrypt.hash(maryPass, 10);

  // 0. Garantir Casal Principal (Multi-Tenant #1)
  let mainCouple = db.select().from(couples).where(eq(couples.id, 1)).get();
  if (!mainCouple) {
    db.insert(couples).values({
      id: 1,
      coupleName: 'Nosso Universo',
      inviteCode: 'AMOR26',
      anniversaryDate: '2026-01-30',
      planTier: 'freemium',
      enableBibleVerses: 0,
      specialDatesJson: JSON.stringify([
        { title: 'Nosso Primeiro Encontro', date: '2026-01-30', icon: 'Heart' }
      ]),
      pushSubscriptionsJson: JSON.stringify([]),
      createdAt: now
    }).run();
    mainCouple = db.select().from(couples).where(eq(couples.id, 1)).get();
    console.log('  💑 Casal #1 (Código: AMOR26) inicializado.');
  }

  seedDefaultCustomizationsForCouple(sqlite, 1, now);

  // 1. Usuários Principais do Casal #1
  const initialUsers = [
    {
      coupleId: 1,
      username: 'leh',
      email: 'parceiro_a@nossouniverso.app',
      displayName: 'Parceiro A',
      nickname: 'Meu Amor',
      passwordHash: lehHash,
      birthDate: '2001-08-12',
      zodiacSign: 'leo',
      avatarUrl: null,
      bannerColor: '#8B5CF6',
      bio: 'Construindo nossa história juntos',
      moodStatus: 'Apaixonado(a)',
      theme: 'cyber-goth',
      updatedAt: now
    },
    {
      coupleId: 1,
      username: 'mary',
      email: 'parceiro_b@nossouniverso.app',
      displayName: 'Mary ₊˚⊹♡',
      nickname: 'Minha Vida',
      passwordHash: maryHash,
      birthDate: '2002-10-15',
      zodiacSign: 'libra',
      avatarUrl: null,
      bannerColor: '#38BDF8',
      bio: 'Música, estrelas e memórias eternas',
      moodStatus: 'Radiante ✨',
      theme: 'dark-romantic',
      updatedAt: now
    }
  ];

  for (const u of initialUsers) {
    const existing = db.select().from(users).where(eq(users.username, u.username)).get();
    if (!existing) {
      db.insert(users).values(u).run();
      console.log(`  👤 Usuário '${u.username}' criado com sucesso.`);
    } else {
      db.update(users)
        .set({
          coupleId: existing.coupleId || 1,
          passwordHash: u.passwordHash,
          birthDate: existing.birthDate || u.birthDate,
          zodiacSign: existing.zodiacSign || u.zodiacSign,
          bio: existing.bio || u.bio,
          theme: existing.theme || u.theme,
          updatedAt: now
        })
        .where(eq(users.username, u.username))
        .run();
      console.log(`  👤 Usuário '${u.username}' já existia (credenciais e signo sincronizados).`);
    }
  }

  // 2. Grafo de Palavras Afetivas Iniciais
  const initialWords = [
    { word: 'Meu Amor', meaning: 'Sentimento maior que o universo observável', color: '#E11D48', iconName: 'Heart' },
    { word: 'Minha Vida', meaning: 'Pessoa que ilumina todos os nossos dias', color: '#EC4899', iconName: 'Sparkles' },
    { word: 'Nossa Viagem', meaning: 'Aventuras e destinos inesquecíveis a dois', color: '#38BDF8', iconName: 'Cloud' },
    { word: 'Promessa', meaning: 'Pacto inquebrável de lealdade e carinho', color: '#A855F7', iconName: 'Handshake' },
    { word: 'Nosso Cantinho', meaning: 'Nosso refúgio seguro de paz e afeto', color: '#F59E0B', iconName: 'Star' },
    { word: 'Primeiro Encontro', meaning: 'Onde tudo começou a brilhar', color: '#F43F5E', iconName: 'Heart' },
    { word: 'Saudade', meaning: 'Contando os minutos para o próximo abraço', color: '#8B5CF6', iconName: 'Sparkles' },
    { word: 'Futuro', meaning: 'Todos os sonhos que vamos realizar juntos', color: '#10B981', iconName: 'Crown' },
    { word: 'Protagonistas', meaning: 'Donos do enredo da própria história de amor', color: '#EC4899', iconName: 'Crown' }
  ];

  const lehUser = db.select().from(users).where(eq(users.username, 'leh')).get();

  for (let i = 0; i < initialWords.length; i++) {
    const item = initialWords[i];
    const normalized = item.word.trim().toLowerCase();
    const existing = db.select().from(wordNodes).where(eq(wordNodes.normalizedWord, normalized)).get();
    if (!existing) {
      const angle = (i / initialWords.length) * Math.PI * 2;
      const radius = 190 + (i % 2) * 45;
      db.insert(wordNodes).values({
        coupleId: 1,
        word: item.word,
        normalizedWord: normalized,
        meaningOrNote: item.meaning,
        color: item.color,
        iconName: item.iconName,
        positionX: Math.round(400 + Math.cos(angle) * radius),
        positionY: Math.round(300 + Math.sin(angle) * radius),
        createdBy: lehUser ? lehUser.id : null,
        isCustom: 1,
        createdAt: now
      }).run();
      console.log(`  ✨ Palavra do grafo cadastrada: '${item.word}'`);
    }
  }

  // 3. Configurações Globais Legadas (sincronizadas com couples)
  const existingSettings = db.select().from(coupleSettings).get();
  if (!existingSettings) {
    db.insert(coupleSettings).values({
      anniversaryDate: '2026-01-30',
      specialDatesJson: JSON.stringify([
        { title: 'Nosso Primeiro Encontro', date: '2026-01-30', icon: 'Heart' }
      ]),
      pushSubscriptionsJson: JSON.stringify([])
    }).run();
    console.log('  💍 Configurações do Casal inicializadas (Aniversário: 2026-01-30).');
  }

  console.log('🎉 [Seed] Banco SQLite populado com 100% de sucesso!');
}

// Execução direta via CLI (node server/db/seed.js)
if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  runSeed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ [Seed] Falha na execução:', err);
      process.exit(1);
    });
}
