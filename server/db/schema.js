import { sqliteTable, integer, text, real, unique } from 'drizzle-orm/sqlite-core';

export const couples = sqliteTable('couples', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  coupleName: text('couple_name').default('Nosso Universo').notNull(),
  inviteCode: text('invite_code').notNull().unique(),
  anniversaryDate: text('anniversary_date').default('2026-01-30').notNull(),
  planTier: text('plan_tier').default('freemium').notNull(),
  planExpiresAt: text('plan_expires_at'),
  enableBibleVerses: integer('enable_bible_verses').default(0).notNull(),
  googleDriveFolderId: text('google_drive_folder_id'),
  specialDatesJson: text('special_dates_json'),
  pushSubscriptionsJson: text('push_subscriptions_json'),
  createdAt: text('created_at').notNull()
});

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  coupleId: integer('couple_id').default(1).references(() => couples.id, { onDelete: 'cascade' }),
  username: text('username').notNull().unique(),
  email: text('email'),
  displayName: text('display_name').notNull(),
  nickname: text('nickname'),
  passwordHash: text('password_hash').notNull(),
  birthDate: text('birth_date'),
  zodiacSign: text('zodiac_sign'),
  avatarUrl: text('avatar_url'),
  bannerColor: text('banner_color'),
  bio: text('bio'),
  moodStatus: text('mood_status'),
  theme: text('theme').default('dark-romantic').notNull(),
  updatedAt: text('updated_at').notNull()
});

export const memories = sqliteTable('memories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  coupleId: integer('couple_id').default(1).references(() => couples.id, { onDelete: 'cascade' }),
  authorId: integer('author_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  content: text('content').notNull(),
  memoryDate: text('memory_date').notNull(),
  mood: text('mood'),
  tags: text('tags'), // JSON string array: ["tag1", "tag2"]
  location: text('location'),
  isCapsule: integer('is_capsule').default(0).notNull(),
  unlockAt: text('unlock_at'),
  positionX: real('position_x').default(0).notNull(),
  positionY: real('position_y').default(0).notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull()
});

export const memoryMedia = sqliteTable('memory_media', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  coupleId: integer('couple_id').default(1).references(() => couples.id, { onDelete: 'cascade' }),
  memoryId: integer('memory_id').references(() => memories.id, { onDelete: 'cascade' }),
  uploadedBy: integer('uploaded_by').notNull().references(() => users.id, { onDelete: 'cascade' }),
  albumName: text('album_name').default('Geral').notNull(),
  caption: text('caption'),
  fileUrl: text('file_url').notNull(),
  thumbUrl: text('thumb_url'),
  width: integer('width'),
  height: integer('height'),
  isFavorite: integer('is_favorite').default(0).notNull(),
  takenAt: text('taken_at'),
  createdAt: text('created_at').notNull()
});

export const memoryLikes = sqliteTable('memory_likes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  memoryId: integer('memory_id').notNull().references(() => memories.id, { onDelete: 'cascade' }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  reaction: text('reaction').default('heart').notNull(),
  createdAt: text('created_at').notNull()
}, (t) => [
  unique('uniq_memory_user_like').on(t.memoryId, t.userId)
]);

export const memoryConnections = sqliteTable('memory_connections', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  sourceMemoryId: integer('source_memory_id').notNull().references(() => memories.id, { onDelete: 'cascade' }),
  targetMemoryId: integer('target_memory_id').notNull().references(() => memories.id, { onDelete: 'cascade' }),
  label: text('label'),
  createdAt: text('created_at').notNull()
});

export const wordNodes = sqliteTable('word_nodes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  coupleId: integer('couple_id').default(1).references(() => couples.id, { onDelete: 'cascade' }),
  word: text('word').notNull().unique(),
  normalizedWord: text('normalized_word').notNull().unique(),
  meaningOrNote: text('meaning_or_note'),
  color: text('color').default('#EC4899').notNull(),
  iconName: text('icon_name').default('Sparkles').notNull(),
  positionX: real('position_x').default(0).notNull(),
  positionY: real('position_y').default(0).notNull(),
  createdBy: integer('created_by').references(() => users.id, { onDelete: 'set null' }),
  isCustom: integer('is_custom').default(1).notNull(),
  createdAt: text('created_at').notNull()
});

export const favoriteVerses = sqliteTable('favorite_verses', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  coupleId: integer('couple_id').default(1).references(() => couples.id, { onDelete: 'cascade' }),
  reference: text('reference').notNull(),
  text: text('text').notNull(),
  bookName: text('book_name').notNull(),
  chapter: integer('chapter').notNull(),
  verse: integer('verse').notNull(),
  savedBy: integer('saved_by').notNull().references(() => users.id, { onDelete: 'cascade' }),
  note: text('note'),
  createdAt: text('created_at').notNull()
});

export const coupleSettings = sqliteTable('couple_settings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  anniversaryDate: text('anniversary_date').default('2026-01-30').notNull(),
  specialDatesJson: text('special_dates_json'),
  pushSubscriptionsJson: text('push_subscriptions_json')
});

export const customTags = sqliteTable('custom_tags', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  coupleId: integer('couple_id').default(1).notNull().references(() => couples.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  color: text('color').default('#EC4899').notNull(),
  iconName: text('icon_name').default('Tag').notNull(),
  createdAt: text('created_at').notNull()
});

export const customAlbums = sqliteTable('custom_albums', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  coupleId: integer('couple_id').default(1).notNull().references(() => couples.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  color: text('color').default('#A855F7').notNull(),
  iconName: text('icon_name').default('Images').notNull(),
  createdAt: text('created_at').notNull()
});

export const customMoods = sqliteTable('custom_moods', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  coupleId: integer('couple_id').default(1).notNull().references(() => couples.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  color: text('color').default('#F43F5E').notNull(),
  iconName: text('icon_name').default('Heart').notNull(),
  createdAt: text('created_at').notNull()
});

export const dailyFeelings = sqliteTable('daily_feelings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  coupleId: integer('couple_id').default(1).notNull().references(() => couples.id, { onDelete: 'cascade' }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  feelingDate: text('feeling_date').notNull(),
  moodId: integer('mood_id'),
  moodLabel: text('mood_label').notNull(),
  moodColor: text('mood_color').default('#F43F5E').notNull(),
  moodIcon: text('mood_icon').default('Heart').notNull(),
  intensity: integer('intensity').default(5).notNull(),
  note: text('note'),
  createdAt: text('created_at').notNull()
});

export const canvasItems = sqliteTable('canvas_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  coupleId: integer('couple_id').default(1).notNull().references(() => couples.id, { onDelete: 'cascade' }),
  createdBy: integer('created_by').references(() => users.id, { onDelete: 'set null' }),
  itemType: text('item_type').notNull(),
  x: real('x').default(0).notNull(),
  y: real('y').default(0).notNull(),
  width: real('width').default(220).notNull(),
  height: real('height').default(160).notNull(),
  rotation: real('rotation').default(0).notNull(),
  zIndex: integer('z_index').default(1).notNull(),
  payloadJson: text('payload_json').notNull(),
  updatedAt: text('updated_at').notNull()
});

export const customQuestions = sqliteTable('custom_questions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  coupleId: integer('couple_id').default(1).notNull().references(() => couples.id, { onDelete: 'cascade' }),
  createdBy: integer('created_by').references(() => users.id, { onDelete: 'set null' }),
  questionType: text('question_type').default('prefer_dislike').notNull(),
  category: text('category').default('Romantismo').notNull(),
  text: text('text').notNull(),
  createdAt: text('created_at').notNull()
});
