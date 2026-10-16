/**
 * Inicialização e migração idempotente das tabelas SQLite (Módulo I + Módulo II Multi-Tenant SaaS)
 */
import { seedMinigameQuestions } from './seedQuestions.js';

function ensureColumn(sqlite, tableName, columnName, columnDef) {
  const cols = sqlite.prepare(`PRAGMA table_info(${tableName})`).all();
  if (!cols.some((c) => c.name === columnName)) {
    sqlite.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDef};`);
  }
}

export function initDb(sqlite) {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS couples (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      couple_name TEXT NOT NULL DEFAULT 'Nosso Universo',
      invite_code TEXT NOT NULL UNIQUE,
      anniversary_date TEXT NOT NULL DEFAULT '2026-01-30',
      plan_tier TEXT NOT NULL DEFAULT 'freemium',
      plan_expires_at TEXT,
      enable_bible_verses INTEGER NOT NULL DEFAULT 0,
      google_drive_folder_id TEXT,
      special_dates_json TEXT,
      push_subscriptions_json TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      couple_id INTEGER DEFAULT 1 REFERENCES couples(id) ON DELETE CASCADE,
      username TEXT NOT NULL UNIQUE,
      email TEXT,
      display_name TEXT NOT NULL,
      nickname TEXT,
      password_hash TEXT NOT NULL,
      birth_date TEXT,
      zodiac_sign TEXT,
      avatar_url TEXT,
      banner_color TEXT,
      bio TEXT,
      mood_status TEXT,
      theme TEXT NOT NULL DEFAULT 'dark-romantic',
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS memories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      couple_id INTEGER DEFAULT 1 REFERENCES couples(id) ON DELETE CASCADE,
      author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      memory_date TEXT NOT NULL,
      mood TEXT,
      tags TEXT,
      location TEXT,
      is_capsule INTEGER NOT NULL DEFAULT 0,
      unlock_at TEXT,
      position_x REAL NOT NULL DEFAULT 0,
      position_y REAL NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS memory_media (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      couple_id INTEGER DEFAULT 1 REFERENCES couples(id) ON DELETE CASCADE,
      memory_id INTEGER REFERENCES memories(id) ON DELETE CASCADE,
      uploaded_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      album_name TEXT NOT NULL DEFAULT 'Geral',
      caption TEXT,
      file_url TEXT NOT NULL,
      thumb_url TEXT,
      width INTEGER,
      height INTEGER,
      is_favorite INTEGER NOT NULL DEFAULT 0,
      taken_at TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS memory_likes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      memory_id INTEGER NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      reaction TEXT NOT NULL DEFAULT 'heart',
      created_at TEXT NOT NULL,
      UNIQUE(memory_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS memory_connections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source_memory_id INTEGER NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
      target_memory_id INTEGER NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
      label TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS word_nodes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      couple_id INTEGER DEFAULT 1 REFERENCES couples(id) ON DELETE CASCADE,
      word TEXT NOT NULL UNIQUE,
      normalized_word TEXT NOT NULL UNIQUE,
      meaning_or_note TEXT,
      color TEXT NOT NULL DEFAULT '#EC4899',
      icon_name TEXT NOT NULL DEFAULT 'Sparkles',
      position_x REAL NOT NULL DEFAULT 0,
      position_y REAL NOT NULL DEFAULT 0,
      created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      is_custom INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS favorite_verses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      couple_id INTEGER DEFAULT 1 REFERENCES couples(id) ON DELETE CASCADE,
      reference TEXT NOT NULL,
      text TEXT NOT NULL,
      book_name TEXT NOT NULL,
      chapter INTEGER NOT NULL,
      verse INTEGER NOT NULL,
      saved_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      note TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS couple_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      anniversary_date TEXT NOT NULL DEFAULT '2026-01-30',
      special_dates_json TEXT,
      push_subscriptions_json TEXT
    );

    CREATE TABLE IF NOT EXISTS custom_tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      couple_id INTEGER NOT NULL DEFAULT 1 REFERENCES couples(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      color TEXT NOT NULL DEFAULT '#EC4899',
      icon_name TEXT NOT NULL DEFAULT 'Tag',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS custom_albums (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      couple_id INTEGER NOT NULL DEFAULT 1 REFERENCES couples(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      color TEXT NOT NULL DEFAULT '#A855F7',
      icon_name TEXT NOT NULL DEFAULT 'Images',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS custom_moods (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      couple_id INTEGER NOT NULL DEFAULT 1 REFERENCES couples(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      color TEXT NOT NULL DEFAULT '#F43F5E',
      icon_name TEXT NOT NULL DEFAULT 'Heart',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS daily_feelings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      couple_id INTEGER NOT NULL DEFAULT 1 REFERENCES couples(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      feeling_date TEXT NOT NULL,
      mood_id INTEGER,
      mood_label TEXT NOT NULL,
      mood_color TEXT NOT NULL DEFAULT '#F43F5E',
      mood_icon TEXT NOT NULL DEFAULT 'Heart',
      intensity INTEGER NOT NULL DEFAULT 5,
      note TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS canvas_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      couple_id INTEGER NOT NULL DEFAULT 1 REFERENCES couples(id) ON DELETE CASCADE,
      created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      item_type TEXT NOT NULL,
      x REAL NOT NULL DEFAULT 0,
      y REAL NOT NULL DEFAULT 0,
      width REAL NOT NULL DEFAULT 220,
      height REAL NOT NULL DEFAULT 160,
      rotation REAL NOT NULL DEFAULT 0,
      z_index INTEGER NOT NULL DEFAULT 1,
      payload_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS custom_questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      couple_id INTEGER NOT NULL DEFAULT 1 REFERENCES couples(id) ON DELETE CASCADE,
      created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      question_type TEXT NOT NULL DEFAULT 'prefer_dislike',
      category TEXT NOT NULL DEFAULT 'Romantismo',
      text TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS partner_telemetry (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      couple_id INTEGER NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      accuracy REAL,
      speed REAL,
      battery_level INTEGER,
      is_charging INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL,
      UNIQUE(couple_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS minigame_questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question_type TEXT NOT NULL,
      category TEXT NOT NULL,
      question_text TEXT NOT NULL,
      option_a TEXT,
      option_b TEXT,
      is_custom INTEGER NOT NULL DEFAULT 0,
      couple_id INTEGER REFERENCES couples(id) ON DELETE CASCADE,
      created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS minigame_answers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      couple_id INTEGER NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      question_id INTEGER NOT NULL REFERENCES minigame_questions(id) ON DELETE CASCADE,
      answer_choice TEXT NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE(couple_id, user_id, question_id)
    );
  `);

  // Migrações idempotentes para bancos SQLite pré-existentes
  ensureColumn(sqlite, 'users', 'couple_id', 'INTEGER DEFAULT 1');
  ensureColumn(sqlite, 'users', 'email', 'TEXT');
  ensureColumn(sqlite, 'users', 'birth_date', 'TEXT');
  ensureColumn(sqlite, 'users', 'zodiac_sign', 'TEXT');

  ensureColumn(sqlite, 'memories', 'couple_id', 'INTEGER DEFAULT 1');
  ensureColumn(sqlite, 'memories', 'position_x', 'REAL NOT NULL DEFAULT 0');
  ensureColumn(sqlite, 'memories', 'position_y', 'REAL NOT NULL DEFAULT 0');

  ensureColumn(sqlite, 'memory_media', 'couple_id', 'INTEGER DEFAULT 1');

  ensureColumn(sqlite, 'word_nodes', 'couple_id', 'INTEGER DEFAULT 1');
  ensureColumn(sqlite, 'word_nodes', 'position_x', 'REAL NOT NULL DEFAULT 0');
  ensureColumn(sqlite, 'word_nodes', 'position_y', 'REAL NOT NULL DEFAULT 0');

  ensureColumn(sqlite, 'favorite_verses', 'couple_id', 'INTEGER DEFAULT 1');

  // Garantir casal #1 padrão e popular customizações iniciais se o banco já existia
  const firstCouple = sqlite.prepare('SELECT id FROM couples LIMIT 1').get();
  const now = new Date().toISOString();
  if (!firstCouple) {
    const legacySettings = sqlite.prepare('SELECT * FROM couple_settings LIMIT 1').get();
    sqlite.prepare(`
      INSERT INTO couples (id, couple_name, invite_code, anniversary_date, plan_tier, enable_bible_verses, special_dates_json, push_subscriptions_json, created_at)
      VALUES (1, 'Nosso Universo', 'AMOR26', ?, 'freemium', 0, ?, ?, ?)
    `).run(
      legacySettings?.anniversary_date || '2026-01-30',
      legacySettings?.special_dates_json || JSON.stringify([{ title: 'Nosso Primeiro Encontro', date: '2026-01-30', icon: 'Heart' }]),
      legacySettings?.push_subscriptions_json || '[]',
      now
    );
  }

  seedDefaultCustomizationsForCouple(sqlite, 1, now);
  seedMinigameQuestions(sqlite);
}

export function seedDefaultCustomizationsForCouple(sqlite, coupleId, now = new Date().toISOString()) {
  const existingMoods = sqlite.prepare('SELECT id FROM custom_moods WHERE couple_id = ? LIMIT 1').get(coupleId);
  if (!existingMoods) {
    const defaultMoods = [
      ['Apaixonado(a)', '#F43F5E', 'Heart'],
      ['Radiante', '#F59E0B', 'Sparkles'],
      ['Acolhido(a)', '#EC4899', 'Sun'],
      ['Com Saudade', '#A855F7', 'Moon'],
      ['Grato(a)', '#10B981', 'Star'],
      ['Nostálgico(a)', '#38BDF8', 'Cloud']
    ];
    const insertMood = sqlite.prepare('INSERT INTO custom_moods (couple_id, name, color, icon_name, created_at) VALUES (?, ?, ?, ?, ?)');
    for (const [name, color, icon] of defaultMoods) {
      insertMood.run(coupleId, name, color, icon, now);
    }
  }

  const existingTags = sqlite.prepare('SELECT id FROM custom_tags WHERE couple_id = ? LIMIT 1').get(coupleId);
  if (!existingTags) {
    const defaultTags = [
      ['viagem', '#38BDF8', 'Compass'],
      ['encontro', '#EC4899', 'Heart'],
      ['promessas', '#A855F7', 'Sparkles'],
      ['cotidiano', '#F59E0B', 'Coffee'],
      ['datas', '#F43F5E', 'Calendar']
    ];
    const insertTag = sqlite.prepare('INSERT INTO custom_tags (couple_id, name, color, icon_name, created_at) VALUES (?, ?, ?, ?, ?)');
    for (const [name, color, icon] of defaultTags) {
      insertTag.run(coupleId, name, color, icon, now);
    }
  }

  const existingAlbums = sqlite.prepare('SELECT id FROM custom_albums WHERE couple_id = ? LIMIT 1').get(coupleId);
  if (!existingAlbums) {
    const defaultAlbums = [
      ['Nossas Fotos', '#EC4899', 'Heart'],
      ['Viagens & Passeios', '#38BDF8', 'MapPin'],
      ['Encontros Especiais', '#A855F7', 'Sparkles'],
      ['Momentos Engraçados', '#F59E0B', 'Smile'],
      ['Geral', '#64748B', 'Images']
    ];
    const insertAlbum = sqlite.prepare('INSERT INTO custom_albums (couple_id, name, color, icon_name, created_at) VALUES (?, ?, ?, ?, ?)');
    for (const [name, color, icon] of defaultAlbums) {
      insertAlbum.run(coupleId, name, color, icon, now);
    }
  }
}
