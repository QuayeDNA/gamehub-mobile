/**
 * GameHub – Unified Multi-Source Game API
 * ─────────────────────────────────────────
 * Sources:  GameMonetize · GameDistribution · GamePix · HTMLGames
 * Features: parallel fetching, per-source pagination, unified
 *           category normalization, interleaved results, caching.
 */

import {
  getDetailCache,
  setDetailCache as setDetCache,
  getAllCachedGames,
} from "./gameCache.js";
import {
  getEnabledSourceKeys,
  getMobileFilter,
} from "../hooks/useSourcePrefs.js";

// ═══════════════════════════════════════════════════════════════════════
//  CACHE
// ═══════════════════════════════════════════════════════════════════════

const CACHE_KEY = "gh_v2";
const CACHE_TTL = 20 * 60 * 1000; // 20 min

function getCached(key) {
  try {
    const raw = localStorage.getItem(`${CACHE_KEY}_${key}`);
    if (!raw) return null;
    const { d, t } = JSON.parse(raw);
    if (Date.now() - t > CACHE_TTL) {
      localStorage.removeItem(`${CACHE_KEY}_${key}`);
      return null;
    }
    return d;
  } catch {
    return null;
  }
}

function setCache(key, data) {
  try {
    localStorage.setItem(
      `${CACHE_KEY}_${key}`,
      JSON.stringify({ d: data, t: Date.now() }),
    );
  } catch {
    /* quota */
  }
}

/** Wipe all gamehub caches (call after code updates) */
export function clearAllCaches() {
  const toRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k?.startsWith("gh_") || k?.startsWith("gamehub_cache"))
      toRemove.push(k);
  }
  toRemove.forEach((k) => localStorage.removeItem(k));
}

// ═══════════════════════════════════════════════════════════════════════
//  UNIFIED CATEGORY MAP
// ═══════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════
//  GAME SOURCES
// ═══════════════════════════════════════════════════════════════════════

export const SOURCES = [
  { slug: "all", label: "All Sources", icon: "🌐", key: null },
  { slug: "gamemonetize", label: "GameMonetize", icon: "💰", key: "gm" },
  {
    slug: "gamedistribution",
    label: "GameDistribution",
    icon: "🎯",
    key: "gd",
  },
  { slug: "gamepix", label: "GamePix", icon: "🕹️", key: "gp" },
  { slug: "htmlgames", label: "HTMLGames", icon: "🧩", key: "hg" },
];

/** Get a SOURCES entry by slug */
export function getSourceMeta(slug) {
  return SOURCES.find((s) => s.slug === slug) || SOURCES[0];
}

// ═══════════════════════════════════════════════════════════════════════
//  UNIFIED CATEGORY MAP
// ═══════════════════════════════════════════════════════════════════════

export const CATEGORIES = [
  { slug: "all", label: "All Games", icon: "🎮" },
  { slug: "action", label: "Action", icon: "💥" },
  { slug: "adventure", label: "Adventure", icon: "🗺️" },
  { slug: "arcade", label: "Arcade", icon: "👾" },
  { slug: "puzzle", label: "Puzzle", icon: "🧩" },
  { slug: "racing", label: "Racing", icon: "🏎️" },
  { slug: "sports", label: "Sports", icon: "⚽" },
  { slug: "shooting", label: "Shooting", icon: "🔫" },
  { slug: "strategy", label: "Strategy", icon: "🧠" },
  { slug: "multiplayer", label: "Multiplayer", icon: "👥" },
  { slug: "io", label: ".io Games", icon: "🌐" },
  { slug: "hypercasual", label: "Hyper Casual", icon: "🎯" },
  { slug: "simulation", label: "Simulation", icon: "🏗️" },
  { slug: "board", label: "Board & Card", icon: "♟️" },
  { slug: "clicker", label: "Clicker/Idle", icon: "👆" },
];

/* ── Alias map: normalise every raw category string to one of our slugs ── */
const _ALIAS_MAP = (() => {
  const m = {};
  const add = (slug, ...aliases) =>
    aliases.forEach((a) => {
      m[a.toLowerCase().trim()] = slug;
    });

  add("action", "action");
  add("adventure", "adventure");
  add("arcade", "arcade", "stunt");
  add(
    "puzzle",
    "puzzle",
    "brain",
    "match-3",
    "match3",
    "word",
    "trivia",
    "quiz",
    "match 3",
    "jigsaw",
    "agility",
  );
  add("racing", "racing", "driving", "car", "motorcycle", "drift");
  add(
    "sports",
    "sports",
    "sport",
    "soccer",
    "football",
    "basketball",
    "baseball",
    "cricket",
    "golf",
    "tennis",
    "boxing",
    "wrestling",
  );
  add("shooting", "shooting", "shooter", "fps", "gun", "sniper");
  add(
    "strategy",
    "strategy",
    "tower-defense",
    "tower defense",
    "defense",
    "td",
  );
  add("multiplayer", "multiplayer", "2-player", "2 player", "two player");
  add("io", "io", ".io");
  add("hypercasual", "hypercasual", "hyper-casual", "hyper casual", "casual");
  add(
    "simulation",
    "simulation",
    "simulator",
    "sim",
    "tycoon",
    "management",
    "cooking",
    "farming",
    "building",
  );
  add(
    "board",
    "board",
    "card",
    "boardgame",
    "board game",
    "card game",
    "tabletop",
    "chess",
    "solitaire",
    "mahjong",
  );
  add("clicker", "clicker", "idle", "incremental", "tap");
  add("action", "battle");
  // HTMLGames uses verbose category names like "Mahjong Games", "Puzzle Games"
  add(
    "puzzle",
    "puzzle games",
    "brain games",
    "bubble shooter games",
    "match 3 games",
    "word games",
    "memory games",
    "number games",
    "slide games",
    "connect games",
    "tetris games",
    "sokoban games",
  );
  add("board", "mahjong games", "solitaire games", "card games", "board games");
  add(
    "arcade",
    "arcade games",
    "platform games",
    "snake games",
    "block games",
    "breakout games",
  );
  add("shooting", "shooting games");
  add("racing", "racing games");
  add("sports", "sports games", "golf games", "pool games");
  add("strategy", "strategy games", "tower defense games", "defense games");
  add("simulation", "simulation games", "farming games", "hidden object games");
  add("hypercasual", "fun games", "skill games");

  return m;
})();

/** Normalise any raw category string to a unified slug */
function normalizeCategory(raw) {
  if (!raw) return "other";
  const lower = (
    typeof raw === "string" ? raw : Array.isArray(raw) ? raw[0] : String(raw)
  )
    .toLowerCase()
    .trim();
  return _ALIAS_MAP[lower] || "other";
}

/** Get our CATEGORIES entry by slug */
export function getCategoryMeta(slug) {
  return (
    CATEGORIES.find((c) => c.slug === slug) || { slug, label: slug, icon: "🎮" }
  );
}

// ── Per-source category name for API query params ──
const _SRC_CAT = {
  gm: {
    action: "Action",
    adventure: "Adventure",
    arcade: "Arcade",
    puzzle: "Puzzle",
    racing: "Racing",
    sports: "Sports",
    shooting: "Shooting",
    strategy: "Strategy",
    multiplayer: "Multiplayer",
    io: ".io",
    hypercasual: "Hypercasual",
    simulation: "Simulation",
    board: "Board",
    clicker: "Clicker",
  },
  gd: {
    action: "Action",
    adventure: "Adventure",
    arcade: "Arcade",
    puzzle: "Puzzle",
    racing: "Racing",
    sports: "Sports",
    shooting: "Shooting",
    strategy: "Strategy",
    multiplayer: "Multiplayer",
    io: "IO",
    hypercasual: "Hypercasual",
    simulation: "Simulation",
    board: "Board",
    clicker: "Clicker",
  },
  gp: {
    action: "action",
    adventure: "adventure",
    arcade: "arcade",
    puzzle: "puzzle",
    racing: "racing",
    sports: "sports",
    shooting: "shooting",
    strategy: "strategy",
    multiplayer: "multiplayer",
    io: "io",
    hypercasual: "hypercasual",
    simulation: "simulation",
    board: "board",
    clicker: "clicker",
  },
};

function sourceCat(slug, src) {
  if (!slug || slug === "all") return "";
  return _SRC_CAT[src]?.[slug] || "";
}

// ═══════════════════════════════════════════════════════════════════════
//  SAFE HELPERS
// ═══════════════════════════════════════════════════════════════════════

function str(val) {
  if (!val) return "";
  if (typeof val === "string") return val;
  if (Array.isArray(val)) return val.filter(Boolean).join(", ");
  return String(val);
}

function firstStr(val) {
  if (!val) return "";
  if (typeof val === "string") return val;
  if (Array.isArray(val)) return val[0] || "";
  return String(val);
}

// ═══════════════════════════════════════════════════════════════════════
//  PER-SOURCE RAW FETCHERS
// ═══════════════════════════════════════════════════════════════════════

const TIMEOUT = 12000;

// ── Proxy paths ─────────────────────────────────────────────────────────────
// Both dev and prod use the same /api/* paths — no environment variables
// or build-time branching needed:
//
//   Dev:  vite.config.js server.proxy forwards /api/gm → gamemonetize.com
//         and /api/hg → htmlgames.com  (see vite.config.js)
//
//   Prod: Vercel Edge Function at api/gm/[...path].js handles GM server-side.
//         HG uses api/hg-proxy.js — a flat edge function at a path that
//         avoids Vercel's WAF block on the /api/hg/ directory pattern.
//
const GM_BASE = "/api/gm";

async function rawGM(category, page, amount) {
  const params = new URLSearchParams({
    format: "json",
    page: String(page),
    amount: String(amount),
  });
  if (category) params.set("category", category);
  // Mobile filter: restrict to mobile-verified games when user preference is on.
  // GameMonetize supports ?type=mobile in their rssfeed endpoint.
  if (getMobileFilter()) params.set("type", "mobile");
  const res = await fetch(`${GM_BASE}/rssfeed.php?${params}`, {
    signal: AbortSignal.timeout(TIMEOUT),
  });
  if (!res.ok) throw new Error(`GM ${res.status}`);
  const json = await res.json();
  return Array.isArray(json) ? json : [];
}

async function rawGD(category, page, amount) {
  const cat = category || "All";
  // GD's mobile=true filter crashes their server (returns 500).
  // Always use mobile=all until they fix their endpoint.
  const url = `https://catalog.api.gamedistribution.com/api/v2.0/rss/All/?collection=all&categories=${encodeURIComponent(cat)}&subType=all&type=all&mobile=all&rewarded=all&amount=${amount}&page=${page}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT) });
  if (!res.ok) throw new Error(`GD ${res.status}`);
  const json = await res.json();
  return Array.isArray(json) ? json : [];
}

// GamePix v2 feed requires a publisher SID. Try the public games endpoint first;
// if it fails the source is silently skipped (caught in fetchGamesBatch).
async function rawGP(category, page, amount) {
  // Primary: public games list (no SID needed)
  const params = new URLSearchParams({
    page: String(page),
    num: String(amount),
    order: "q",
  });
  if (category) params.set("category", category);

  // Try the public HTML5 games endpoint first
  try {
    const res = await fetch(`https://games.gamepix.com/games?${params}`, {
      signal: AbortSignal.timeout(TIMEOUT),
    });
    if (res.ok) {
      const json = await res.json();
      const items = json?.data || json?.items || json;
      if (Array.isArray(items) && items.length) return items;
    }
  } catch {
    /* fall through */
  }

  // Fallback: v2 feed (needs SID — will 400 without one but keeps the source pluggable)
  try {
    const res2 = await fetch(`https://feeds.gamepix.com/v2/json?${params}`, {
      signal: AbortSignal.timeout(TIMEOUT),
    });
    if (res2.ok) {
      const json = await res2.json();
      const items = json?.data || json?.items || json;
      if (Array.isArray(items) && items.length) return items;
    }
  } catch {
    /* fall through */
  }

  return []; // source unavailable — other sources will still provide games
}

// HTMLGames returns ALL games in a single JSON array (no pagination).
// We cache the full list and slice by page/amount on each call.
let _hgCache = null;
let _hgCacheTime = 0;
const HG_CACHE_TTL = 30 * 60 * 1000; // 30 min

async function rawHG(category, page, amount) {
  // Fetch full list once, then cache in memory
  if (!_hgCache || Date.now() - _hgCacheTime > HG_CACHE_TTL) {
    try {
      const res = await fetch("/api/hg-proxy?type=json", {
        signal: AbortSignal.timeout(TIMEOUT),
      });
      if (!res.ok) throw new Error(`HG ${res.status}`);
      const json = await res.json();
      _hgCache = Array.isArray(json) ? json : [];
      _hgCacheTime = Date.now();
    } catch {
      return [];
    }
  }

  let items = _hgCache;

  // Client-side category filter (skip when 'all' or empty)
  if (category && category !== "all") {
    const catLower = category.toLowerCase();
    items = items.filter((g) => g.category?.toLowerCase().includes(catLower));
  }

  // Client-side pagination
  const start = (page - 1) * amount;
  return items.slice(start, start + amount);
}

// ═══════════════════════════════════════════════════════════════════════
//  UNIFIED PARSER – each source → common Game schema
// ═══════════════════════════════════════════════════════════════════════

/**
 * Infer whether a game is mobile-compatible.
 *   true  = works on mobile  (portrait layout, ≤800px wide, or API confirms)
 *   false = desktop-only     (large landscape dimensions, or API confirms)
 *
 * Used to badge GameCards and to warn the player before launching
 * a desktop-sized game on a small screen.
 */
function inferMobile(explicitFlag, width, height) {
  // Explicit API flag is the only definitive signal — trust it completely.
  // GameDistribution is the only source that currently provides g.Mobile.
  if (explicitFlag === true || explicitFlag === "true" || explicitFlag === 1)
    return true;
  if (explicitFlag === false || explicitFlag === "false" || explicitFlag === 0)
    return false;

  const w = Number(width) || 800;
  const h = Number(height) || 600;

  // Portrait games are always mobile-friendly.
  if (h > w) return true;

  // For landscape games WITHOUT an explicit API flag, only mark as desktop when
  // dimensions are unambiguously desktop-sized (≥1280px wide).
  //
  // Rationale: many real mobile games run in landscape mode at 960×540,
  // 1024×600, or 1024×768 — these are NOT desktop games. Flagging them as
  // "PC" causes false badges and pre-play warnings. The auto-landscape feature
  // in GamePlayer handles orientation for these games instead.
  if (w >= 1280) return false;

  // Default: assume mobile-compatible.
  return true;
}

function parseGM(g) {
  const rawCat = str(g.category);
  const w = Number(g.width) || 800;
  const h = Number(g.height) || 600;
  return {
    id: `gm_${g.id || g.title?.replace(/\s+/g, "_")}`,
    title: str(g.title) || "Untitled",
    description: str(g.description),
    thumbnail: str(g.thumb || g.image),
    url: str(g.url),
    category: normalizeCategory(rawCat),
    categoryRaw: rawCat,
    tags: str(g.tags),
    instructions: str(g.instructions),
    width: w,
    height: h,
    mobile: inferMobile(null, w, h), // GM feed has no explicit mobile flag
    source: "gamemonetize",
  };
}

function parseGD(g) {
  const thumb = Array.isArray(g.Asset)
    ? g.Asset.find((u) => u?.includes("512x384")) || g.Asset[0] || ""
    : "";
  const rawCat = firstStr(g.Category);
  const tags = Array.isArray(g.Tag)
    ? g.Tag.filter((t) => !["Kids Friendly", "No Blood"].includes(t)).join(", ")
    : str(g.Tag);
  const w = Number(g.Width) || 800;
  const h = Number(g.Height) || 600;
  return {
    id: `gd_${g.Md5 || g.GameId || g.Title?.replace(/\s+/g, "_")}`,
    title: str(g.Title) || "Untitled",
    description: str(g.Description),
    thumbnail: thumb,
    url: str(g.Url),
    category: normalizeCategory(rawCat),
    categoryRaw: rawCat,
    tags,
    instructions: str(g.Instructions),
    width: w,
    height: h,
    // GD returns g.Mobile (boolean) — most reliable explicit flag available
    mobile: inferMobile(g.Mobile ?? g.IsMobile, w, h),
    source: "gamedistribution",
  };
}

function parseGP(g) {
  const rawCat = str(g.category);
  // GamePix returns various thumbnail fields depending on endpoint
  const thumbnail = str(
    g.thumbnailUrl ||
      g.thumbnailUrl100 ||
      g.banner_image ||
      g.cover_image ||
      g.coverImage ||
      g.thumb ||
      g.thumbnail ||
      g.image ||
      g.imageUrl ||
      (g.images && (g.images.cover || g.images.banner || g.images.thumb)) ||
      (g.assets && (g.assets.cover_image || g.assets.banner || g.assets.thumb)),
  );
  const w = Number(g.width) || 800;
  const h = Number(g.height) || 600;
  return {
    id: `gp_${g.id || g.namespace || g.title?.replace(/\s+/g, "_")}`,
    title: str(g.title) || "Untitled",
    description: str(g.description),
    thumbnail: thumbnail,
    url: str(g.url),
    category: normalizeCategory(rawCat),
    categoryRaw: rawCat,
    tags: "",
    instructions: "",
    width: w,
    height: h,
    mobile: inferMobile(g.mobile ?? g.isMobile ?? null, w, h),
    source: "gamepix",
  };
}

function parseHG(g) {
  const rawCat = str(g.category);
  const w = Number(g.width) || 800;
  const h = Number(g.height) || 480;
  return {
    id: `hg_${g.name?.replace(/\s+/g, "_") || Math.random().toString(36).slice(2)}`,
    title: str(g.name) || "Untitled",
    description: str(g.description),
    thumbnail: str(
      g.thumb5 || g.thumb6 || g.thumb4 || g.thumb3 || g.thumb2 || g.thumb1,
    ),
    url: str(g.url),
    category: normalizeCategory(rawCat),
    categoryRaw: rawCat,
    tags: "",
    instructions: "",
    width: w,
    height: h,
    mobile: inferMobile(null, w, h), // HTMLGames feed has no explicit mobile flag
    source: "htmlgames",
  };
}

// ═══════════════════════════════════════════════════════════════════════
//  FETCH + PARSE (single page, single source)
// ═══════════════════════════════════════════════════════════════════════

async function fetchSourcePage(src, category, page, amount) {
  switch (src) {
    case "gm":
      return (await rawGM(sourceCat(category, "gm"), page, amount)).map(
        parseGM,
      );
    case "gd":
      return (await rawGD(sourceCat(category, "gd"), page, amount)).map(
        parseGD,
      );
    case "gp":
      return (await rawGP(sourceCat(category, "gp"), page, amount)).map(
        parseGP,
      );
    case "hg":
      return (await rawHG(category, page, amount)).map(parseHG);
    default:
      return [];
  }
}

// ═══════════════════════════════════════════════════════════════════════
//  MULTI-SOURCE PAGINATED ENGINE
// ═══════════════════════════════════════════════════════════════════════

const PER_SOURCE = 30;

/** Initial cursor state — each source starts at page 1 */
export function initCursors() {
  return {
    gm: 1,
    gd: 1,
    gp: 1,
    hg: 1,
    gmDone: false,
    gdDone: false,
    gpDone: false,
    hgDone: false,
  };
}

/**
 * Fetch the next batch of games from ALL sources in parallel.
 * Each source tracks its own page cursor and exhaustion state.
 * Returns { games, cursors, allDone }.
 */
const ALL_SRCS = ["gm", "gd", "gp", "hg"];

export async function fetchGamesBatch({
  category = "all",
  cursors,
  amount = PER_SOURCE,
  sourceFilter = null,
} = {}) {
  const c = cursors || initCursors();

  // Respect user's source preferences (disabled sources are excluded)
  const enabledSrcs = getEnabledSourceKeys();

  // If sourceFilter is set (e.g. 'gm'), only fetch from that source; otherwise use all enabled sources
  const activeSrcs = sourceFilter
    ? enabledSrcs.includes(sourceFilter)
      ? [sourceFilter]
      : [sourceFilter] // still allow single-source fetch even if disabled
    : ALL_SRCS.filter((src) => enabledSrcs.includes(src));

  const jobs = [];
  for (const src of activeSrcs) {
    if (!c[`${src}Done`]) {
      jobs.push(
        fetchSourcePage(src, category, c[src], amount)
          .then((g) => ({ src, g }))
          .catch(() => ({ src, g: [] })),
      );
    }
  }

  if (jobs.length === 0) return { games: [], cursors: c, allDone: true };

  const results = await Promise.all(jobs);

  const next = { ...c };
  for (const { src, g } of results) {
    // Only mark a source as exhausted when it returns zero results.
    // Returning fewer than `amount` is normal for some APIs and doesn't mean done.
    if (g.length === 0) next[`${src}Done`] = true;
    else next[src] = c[src] + 1;
  }

  const merged = sourceFilter
    ? results[0]?.g || [] // single-source: no interleave needed
    : interleave(results.map((r) => r.g));

  const allDone = activeSrcs.every((src) => next[`${src}Done`]);
  return { games: merged, cursors: next, allDone };
}

/** Interleave N arrays round-robin */
function interleave(arrays) {
  const lists = arrays.filter((a) => a.length > 0);
  if (lists.length === 0) return [];
  const out = [];
  const max = Math.max(...lists.map((a) => a.length));
  for (let i = 0; i < max; i++) {
    for (const l of lists) if (i < l.length) out.push(l[i]);
  }
  return out;
}

/** Deduplicate by unique game ID */
function dedup(games) {
  const seen = new Set();
  return games.filter((g) => {
    if (seen.has(g.id)) return false;
    seen.add(g.id);
    return true;
  });
}

// ═══════════════════════════════════════════════════════════════════════
//  PUBLIC API
// ═══════════════════════════════════════════════════════════════════════

/**
 * Single-shot fetch (backwards-compatible). Used by Home, search, etc.
 */
export async function fetchGames({
  category = "all",
  page = 1,
  limit = 40,
} = {}) {
  const cacheKey = `f_${category}_${page}_${limit}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const cursors = {
    gm: page,
    gd: page,
    gp: page,
    hg: page,
    gmDone: false,
    gdDone: false,
    gpDone: false,
    hgDone: false,
  };
  const { games } = await fetchGamesBatch({ category, cursors, amount: limit });
  const result = dedup(games);

  if (result.length) setCache(cacheKey, result);
  if (result.length === 0)
    throw new Error("All game sources unavailable. Check your connection.");
  return result;
}

/**
 * Look up a single game by its prefixed id.
 * Priority: in-memory session cache → localStorage → source-specific fetch.
 */
export async function fetchGameById(id) {
  // 1. Check in-memory detail cache (populated by list views)
  const memHit = getDetailCache(id);
  if (memHit) return memHit;

  // 2. Check localStorage single-game cache
  const ck = `gid_${id}`;
  const cached = getCached(ck);
  if (cached) return cached;

  // 3. Scan all existing localStorage list caches
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key?.startsWith(CACHE_KEY)) continue;
    try {
      const { d } = JSON.parse(localStorage.getItem(key));
      if (Array.isArray(d)) {
        const found = d.find((g) => g.id === id);
        if (found) {
          setCache(ck, found);
          setDetCache(id, found);
          return found;
        }
      }
    } catch {
      /* skip */
    }
  }

  // 4. Determine source from ID prefix and fetch just that source
  const prefix = id.split("_")[0]; // gm, gd, gp, or hg
  const srcKey = ["gm", "gd", "gp", "hg"].includes(prefix) ? prefix : null;

  try {
    const cursors = initCursors();
    const { games } = await fetchGamesBatch({
      category: "all",
      cursors,
      amount: 80,
      sourceFilter: srcKey,
    });
    const found = games.find((g) => g.id === id);
    if (found) {
      setCache(ck, found);
      setDetCache(id, found);
      return found;
    }
  } catch {
    /* */
  }

  return null;
}

/**
 * Client-side search across ALL cached games + a fresh fetch.
 * Searches in-memory session cache first (which may contain 1000+ games
 * from prior browsing), then supplements with a fresh page if needed.
 */
export async function searchGames(query, category = "all") {
  const q = query.toLowerCase().trim();
  if (!q) {
    return fetchGames({ category, page: 1, limit: 100 });
  }

  const matchFn = (g) =>
    g.title.toLowerCase().includes(q) ||
    g.description.toLowerCase().includes(q) ||
    g.category.includes(q) ||
    g.categoryRaw?.toLowerCase().includes(q) ||
    g.tags?.toLowerCase().includes(q);

  // 1. Search ALL games in the in-memory session cache
  let pool = getAllCachedGames();

  // 2. If the cache is small, fetch a fresh batch to expand the pool
  if (pool.length < 200) {
    try {
      const fresh = await fetchGames({ category, page: 1, limit: 100 });
      const ids = new Set(pool.map((g) => g.id));
      for (const g of fresh) {
        if (!ids.has(g.id)) {
          pool.push(g);
          ids.add(g.id);
        }
      }
    } catch {
      /* use what we have */
    }
  }

  // 3. Optionally filter by category
  if (category && category !== "all") {
    pool = pool.filter((g) => g.category === category);
  }

  return pool.filter(matchFn);
}
