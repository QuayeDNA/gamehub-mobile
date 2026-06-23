import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchGames, fetchGamesBatch, fetchGameById, searchGames, initCursors, getSourceMeta } from '../services/gameApi';
import {
  listKey, getListCache, setListCache, deleteListCache,
  getDetailCache, setDetailCache, indexGamesForDetail,
  getSearchCache, setSearchCache,
  getSingleCache, setSingleCache,
  getAllCachedGames,
} from '../services/gameCache';

// ═══════════════════════════════════════════════════════════════════════
//  useGames – single-shot fetch (Home hero / trending / etc.)
//  ★ Now checks in-memory cache first — no re-fetch on remount
// ═══════════════════════════════════════════════════════════════════════

export function useGames({ category = 'all', page = 1, limit = 40 } = {}) {
  const cached = getSingleCache(category, page, limit);
  const [games, setGames] = useState(cached || []);
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchGames({ category, page, limit });
      setSingleCache(category, page, limit, data);
      indexGamesForDetail(data);
      setGames(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [category, page, limit]);

  useEffect(() => {
    // If we already have cached data, skip the fetch
    const hit = getSingleCache(category, page, limit);
    if (hit) {
      setGames(hit);
      setLoading(false);
      return;
    }
    load();
  }, [category, page, limit, load]);

  return { games, loading, error, refetch: load };
}

// ═══════════════════════════════════════════════════════════════════════
//  useInfiniteGames – paginated multi-source with session caching
//  ★ Restores full scroll state from in-memory cache on remount
//  ★ Supports optional `source` filter for single-source browsing
// ═══════════════════════════════════════════════════════════════════════

export function useInfiniteGames({ category = 'all', perPage = 30, source = null } = {}) {
  // Resolve source slug → API key (e.g. 'gamemonetize' → 'gm')
  const sourceKey = source ? (getSourceMeta(source)?.key || null) : null;
  const cacheId = listKey(category, sourceKey);

  // Try to restore from session cache on first render
  const cached = getListCache(cacheId);

  const [games, setGames] = useState(cached?.games || []);
  const [loading, setLoading] = useState(!cached);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  const cursorsRef = useRef(cached?.cursors || null);
  const seenRef = useRef(cached?.seen ? new Set(cached.seen) : new Set());
  const loadingRef = useRef(false);

  // Helper: persist current state to session cache
  const saveToCache = useCallback((g, c, s, hm) => {
    setListCache(cacheId, {
      games: g,
      cursors: c,
      seen: s,  // Set is serialised as-is (module-level Map stores references)
      hasMore: hm,
    });
    indexGamesForDetail(g);
  }, [cacheId]);

  // ── Initial load (& reset on category/source change) ──────────────
  useEffect(() => {
    // Check if cache is still valid for this key
    const hit = getListCache(cacheId);
    if (hit) {
      // Restore cached state — no fetch needed
      setGames(hit.games);
      cursorsRef.current = hit.cursors;
      seenRef.current = new Set(hit.seen);
      setHasMore(true);
      setLoading(false);
      setError(null);
      loadingRef.current = false;
      return;
    }

    // No cache — fetch fresh
    cursorsRef.current = null;
    seenRef.current = new Set();
    loadingRef.current = false;
    setGames([]);
    setHasMore(true);
    setError(null);
    setLoading(true);

    let cancelled = false;

    (async () => {
      try {
        const cursors = initCursors();
        const { games: batch, cursors: next, allDone } = await fetchGamesBatch({
          category,
          cursors,
          amount: perPage,
          sourceFilter: sourceKey,
        });

        if (cancelled) return;

        cursorsRef.current = next;
        const done = allDone;
        if (done) setHasMore(false);

        const unique = batch.filter(g => {
          if (seenRef.current.has(g.id)) return false;
          seenRef.current.add(g.id);
          return true;
        });

        setGames(unique);
        saveToCache(unique, next, seenRef.current, !done);
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [category, perPage, sourceKey, cacheId, saveToCache]);

  // ── Load more (subsequent pages) ───────────────────────────────────
  const loadMore = useCallback(async () => {
    if (loadingRef.current || !cursorsRef.current) return;
    loadingRef.current = true;
    setLoadingMore(true);

    try {
      const { games: batch, cursors: next, allDone } = await fetchGamesBatch({
        category,
        cursors: cursorsRef.current,
        amount: perPage,
        sourceFilter: sourceKey,
      });

      cursorsRef.current = next;
      const done = allDone;
      if (done) setHasMore(false);

      const unique = batch.filter(g => {
        if (seenRef.current.has(g.id)) return false;
        seenRef.current.add(g.id);
        return true;
      });

      setGames(prev => {
        const merged = [...prev, ...unique];
        saveToCache(merged, next, seenRef.current, !done);
        return merged;
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoadingMore(false);
      loadingRef.current = false;
    }
  }, [category, perPage, sourceKey, saveToCache]);

  // ── Manual refetch (clears cache for this key) ─────────────────────
  const refetch = useCallback(() => {
    deleteListCache(cacheId);
    cursorsRef.current = null;
    seenRef.current = new Set();
    loadingRef.current = false;
    setGames([]);
    setHasMore(true);
    setError(null);
    setLoading(true);

    (async () => {
      try {
        const cursors = initCursors();
        const { games: batch, cursors: next, allDone } = await fetchGamesBatch({
          category,
          cursors,
          amount: perPage,
          sourceFilter: sourceKey,
        });
        cursorsRef.current = next;
        if (allDone) setHasMore(false);
        const unique = batch.filter(g => {
          if (seenRef.current.has(g.id)) return false;
          seenRef.current.add(g.id);
          return true;
        });
        setGames(unique);
        saveToCache(unique, next, seenRef.current, !allDone);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [category, perPage, sourceKey, cacheId, saveToCache]);

  return { games, loading, loadingMore, error, hasMore, loadMore, refetch };
}

// ═══════════════════════════════════════════════════════════════════════
//  useIntersectionLoader – trigger loadMore when sentinel is visible
// ═══════════════════════════════════════════════════════════════════════

export function useIntersectionLoader(loadMore, hasMore, loading) {
  const sentinelRef = useRef(null);
  const cooldownRef = useRef(false);

  useEffect(() => {
    if (!hasMore || loading) return;
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !cooldownRef.current) {
          cooldownRef.current = true;
          loadMore();
        }
      },
      { rootMargin: '400px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore, hasMore, loading]);

  // Separate cooldown: resets 300ms after loading finishes, preventing
  // rapid re-fire when loadMore completes quickly (cached/error responses).
  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => { cooldownRef.current = false; }, 300);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  return sentinelRef;
}

// ═══════════════════════════════════════════════════════════════════════
//  useGame – single game by ID
//  ★ Checks in-memory detail cache first (populated by list views)
// ═══════════════════════════════════════════════════════════════════════

export function useGame(id) {
  const hit = id ? getDetailCache(id) : null;
  const [game, setGame] = useState(hit || null);
  const [loading, setLoading] = useState(!hit);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;

    // Check in-memory detail cache first
    const cached = getDetailCache(id);
    if (cached) {
      setGame(cached);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    fetchGameById(id)
      .then(data => {
        if (data) setDetailCache(id, data);
        setGame(data);
        setLoading(false);
      })
      .catch(e => { setError(e.message); setLoading(false); });
  }, [id]);

  return { game, loading, error };
}

// ═══════════════════════════════════════════════════════════════════════
//  useSearch – debounced client-side search with caching
// ═══════════════════════════════════════════════════════════════════════

export function useSearch(query, category = 'all', debounceMs = 300) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    // Check search cache
    const cached = getSearchCache(query, category);
    if (cached) {
      setResults(cached);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const data = await searchGames(query, category);
        setSearchCache(query, category, data);
        indexGamesForDetail(data);
        setResults(data);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, category, debounceMs]);

  return { results, loading };
}

// ═══════════════════════════════════════════════════════════════════════
//  useRelatedGames – same-category games for the detail page
//  ★ Pulls from in-memory cache first, fetches only if needed
// ═══════════════════════════════════════════════════════════════════════

export function useRelatedGames(game, count = 6) {
  const [related, setRelated] = useState([]);

  useEffect(() => {
    if (!game) return;

    // First try in-memory cache for instant results
    const pool = getAllCachedGames();
    const sameCategory = pool.filter(
      g => g.id !== game.id && g.category === game.category
    );

    if (sameCategory.length >= count) {
      // Shuffle and pick `count` games
      const shuffled = sameCategory.sort(() => Math.random() - 0.5);
      setRelated(shuffled.slice(0, count));
      return;
    }

    // Not enough in cache — fetch a page of the same category
    let cancelled = false;
    (async () => {
      try {
        const fresh = await fetchGames({ category: game.category, page: 1, limit: 40 });
        if (cancelled) return;
        indexGamesForDetail(fresh);
        const combined = [...sameCategory];
        const ids = new Set(combined.map(g => g.id));
        ids.add(game.id); // exclude current game
        for (const g of fresh) {
          if (!ids.has(g.id)) { combined.push(g); ids.add(g.id); }
        }
        const shuffled = combined.sort(() => Math.random() - 0.5);
        setRelated(shuffled.slice(0, count));
      } catch {
        // Use whatever we have
        if (!cancelled) setRelated(sameCategory.slice(0, count));
      }
    })();

    return () => { cancelled = true; };
  }, [game?.id, game?.category, count]);

  return related;
}
