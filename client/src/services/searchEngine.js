import MiniSearch from 'minisearch';
import { get, set, del } from 'idb-keyval';

export const CACHE_KEY = 'mary_cached_memories_v1';

let miniSearchInstance = null;

export function stripHtml(html = '') {
  if (!html || typeof html !== 'string') return '';
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

export function sanitizeMemoryForCache(m) {
  if (!m || typeof m !== 'object') return null;

  let safeTags = [];
  if (Array.isArray(m.tags)) {
    safeTags = m.tags.map(t => String(t).trim()).filter(Boolean);
  } else if (typeof m.tags === 'string' && m.tags.trim()) {
    try {
      const parsed = JSON.parse(m.tags);
      safeTags = Array.isArray(parsed) ? parsed.map(t => String(t).trim()).filter(Boolean) : [m.tags.trim()];
    } catch (e) {
      safeTags = m.tags.split(',').map(t => t.trim()).filter(Boolean);
    }
  }

  return {
    ...m,
    id: Number(m.id),
    title: String(m.title || ''),
    content: String(m.content || ''),
    tags: safeTags,
    media: Array.isArray(m.media) ? m.media : [],
    likes: Array.isArray(m.likes) ? m.likes : [],
    connections: Array.isArray(m.connections) ? m.connections : [],
    connectionsCount: Array.isArray(m.connections) ? m.connections.length : Number(m.connectionsCount || 0)
  };
}

export function initSearchEngine(memories = []) {
  try {
    miniSearchInstance = new MiniSearch({
      fields: ['title', 'plainContent', 'tagsStr', 'location', 'authorName', 'mood'],
      storeFields: ['id', 'title', 'memoryDate', 'authorName'],
      searchOptions: {
        prefix: true,
        fuzzy: 0.2,
        boost: { title: 2.5, tagsStr: 2, plainContent: 1 }
      }
    });

    const seenIds = new Set();
    const docs = [];

    for (const raw of (Array.isArray(memories) ? memories : [])) {
      const m = sanitizeMemoryForCache(raw);
      if (!m || !m.id || seenIds.has(m.id)) continue;
      seenIds.add(m.id);

      docs.push({
        id: m.id,
        title: m.title,
        plainContent: stripHtml(m.content),
        tagsStr: m.tags.join(' '),
        location: m.location || '',
        authorName: m.author?.nickname || m.author?.displayName || '',
        mood: m.mood || '',
        memoryDate: m.memoryDate || ''
      });
    }

    miniSearchInstance.addAll(docs);
  } catch (err) {
    console.warn('[SearchEngine] Índice reconstruído em modo seguro:', err);
  }
  return miniSearchInstance;
}

export function searchMemories(query, memories = []) {
  const safeList = Array.isArray(memories) ? memories : [];
  if (!query || !query.trim()) {
    return safeList;
  }

  try {
    if (!miniSearchInstance) {
      initSearchEngine(safeList);
    }

    const results = miniSearchInstance.search(query.trim());
    const matchedIds = new Set(results.map(r => r.id));

    return safeList.filter(m => matchedIds.has(m.id));
  } catch (err) {
    console.warn('[SearchEngine] Fallback de busca linear ativado:', err);
    const q = query.trim().toLowerCase();
    return safeList.filter(m =>
      String(m.title || '').toLowerCase().includes(q) ||
      String(m.content || '').toLowerCase().includes(q)
    );
  }
}

export async function persistMemoriesToCache(memories) {
  try {
    const sanitized = (Array.isArray(memories) ? memories : [])
      .map(sanitizeMemoryForCache)
      .filter(Boolean);
    await set(CACHE_KEY, sanitized);
  } catch (err) {
    console.warn('[SearchEngine] Falha ao persistir no IndexedDB:', err);
  }
}

export async function loadMemoriesFromCache() {
  try {
    const cached = await get(CACHE_KEY);
    if (!Array.isArray(cached)) return null;
    return cached.map(sanitizeMemoryForCache).filter(Boolean);
  } catch (err) {
    console.warn('[SearchEngine] Falha ao carregar do IndexedDB:', err);
    return null;
  }
}

export async function clearMemoriesCache() {
  try {
    await del(CACHE_KEY);
  } catch (err) {
    console.warn('[SearchEngine] Erro ao limpar cache:', err);
  }
}
