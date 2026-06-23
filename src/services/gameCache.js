/**
 * GameHub – In-Memory Session Cache
 * ──────────────────────────────────
 * Module-level cache that survives React component unmount/remount
 * so navigating Home → Detail → Home (or Category → back) doesn't
 * re-fetch everything. Data lives for the browser session only.
 */

// ═══════════════════════════════════════════════════════════════════════
//  LIST CACHE  (infinite-scroll pages: Home, Browse, Category, Source)
// ═══════════════════════════════════════════════════════════════════════

/** @type {Map<string, { games: any[], cursors: object, seen: Set<string>, hasMore: boolean, ts: number }>} */
const _listCache = new Map();
const LIST_TTL = 10 * 60 * 1000;  // 10 min — keeps data fresh enough

/** Build a consistent cache key for a list view */
export function listKey(category = 'all', source = null) {
  return source ? `src_${source}_${category}` : `cat_${category}`;
}

export function getListCache(key) {
  const entry = _listCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > LIST_TTL) {
    _listCache.delete(key);
    return null;
  }
  return entry;
}

export function setListCache(key, { games, cursors, seen, hasMore }) {
  _listCache.set(key, { games, cursors, seen, hasMore, ts: Date.now() });
}

export function deleteListCache(key) {
  _listCache.delete(key);
}

// ═══════════════════════════════════════════════════════════════════════
//  DETAIL CACHE  (single game lookups)
// ═══════════════════════════════════════════════════════════════════════

/** @type {Map<string, { game: object, ts: number }>} */
const _detailCache = new Map();
const DETAIL_TTL = 30 * 60 * 1000;  // 30 min

export function getDetailCache(id) {
  const entry = _detailCache.get(id);
  if (!entry) return null;
  if (Date.now() - entry.ts > DETAIL_TTL) {
    _detailCache.delete(id);
    return null;
  }
  return entry.game;
}

export function setDetailCache(id, game) {
  _detailCache.set(id, { game, ts: Date.now() });
}

/**
 * Index all games from a list into the detail cache.
 * Called automatically when useInfiniteGames loads a batch.
 */
export function indexGamesForDetail(games) {
  for (const g of games) {
    if (g?.id) _detailCache.set(g.id, { game: g, ts: Date.now() });
  }
}

// ═══════════════════════════════════════════════════════════════════════
//  SEARCH CACHE
// ═══════════════════════════════════════════════════════════════════════

/** @type {Map<string, { results: any[], ts: number }>} */
const _searchCache = new Map();
const SEARCH_TTL = 5 * 60 * 1000;  // 5 min

export function getSearchCache(query, category) {
  const key = `${category}__${query.toLowerCase().trim()}`;
  const entry = _searchCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > SEARCH_TTL) {
    _searchCache.delete(key);
    return null;
  }
  return entry.results;
}

export function setSearchCache(query, category, results) {
  const key = `${category}__${query.toLowerCase().trim()}`;
  _searchCache.set(key, { results, ts: Date.now() });
}

// ═══════════════════════════════════════════════════════════════════════
//  SINGLE-SHOT FETCH CACHE  (useGames hook)
// ═══════════════════════════════════════════════════════════════════════

/** @type {Map<string, { data: any[], ts: number }>} */
const _singleCache = new Map();
const SINGLE_TTL = 10 * 60 * 1000;  // 10 min

export function getSingleCache(category, page, limit) {
  const key = `single_${category}_${page}_${limit}`;
  const entry = _singleCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > SINGLE_TTL) {
    _singleCache.delete(key);
    return null;
  }
  return entry.data;
}

export function setSingleCache(category, page, limit, data) {
  const key = `single_${category}_${page}_${limit}`;
  _singleCache.set(key, { data, ts: Date.now() });
}

// ═══════════════════════════════════════════════════════════════════════
//  AGGREGATE ALL CACHED GAMES  (for search / random)
// ═══════════════════════════════════════════════════════════════════════

/**
 * Collect every unique game currently stored in any cache layer.
 * Returns a deduplicated array (by g.id) — useful for full-text search
 * and "random game" features without an extra network fetch.
 */
export function getAllCachedGames() {
  const byId = new Map();

  // List caches (largest source of games)
  for (const entry of _listCache.values()) {
    if (Date.now() - entry.ts > LIST_TTL) continue;
    for (const g of entry.games) if (g?.id) byId.set(g.id, g);
  }

  // Single-shot caches
  for (const entry of _singleCache.values()) {
    if (Date.now() - entry.ts > SINGLE_TTL) continue;
    for (const g of entry.data) if (g?.id) byId.set(g.id, g);
  }

  // Detail cache (may have games not in any list)
  for (const [id, entry] of _detailCache.entries()) {
    if (Date.now() - entry.ts > DETAIL_TTL) continue;
    if (entry.game?.id) byId.set(entry.game.id, entry.game);
  }

  // HG cache mirror (200 games from htmlgames.com, refreshed every 30 min)
  for (const g of _hgGames) {
    if (g?.id) byId.set(g.id, g);
  }

  return Array.from(byId.values());
}

// ═══════════════════════════════════════════════════════════════════════
//  GLOBAL CLEAR
// ═══════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════
//  HG CACHE MIRROR  (from gameApi.js _hgCache — set via callback)
// ═══════════════════════════════════════════════════════════════════════

/** @type {any[]} */
let _hgGames = [];

/**
 * Called by gameApi.js whenever _hgCache is populated/refreshed.
 * Keeps a local slice so getAllCachedGames() can see HG games
 * without a circular import.
 */
export function setHGCacheGames(games) {
  _hgGames = games;
}

// ═══════════════════════════════════════════════════════════════════════
//  GLOBAL CLEAR
// ═══════════════════════════════════════════════════════════════════════

export function clearSessionCache() {
  _listCache.clear();
  _detailCache.clear();
  _searchCache.clear();
  _singleCache.clear();
  _hgGames = [];
}
