import { useState, useEffect, useCallback } from 'react';

const OFFLINE_KEY = 'gamehub_offline_games';
const MAX_OFFLINE = 15;

/**
 * Read/write offline-saved games from localStorage.
 * Each entry stores the full game object (id, title, thumbnail, category, url, source, savedAt).
 */
function readOffline() {
  try { return JSON.parse(localStorage.getItem(OFFLINE_KEY)) || []; }
  catch { return []; }
}

function writeOffline(games) {
  try { localStorage.setItem(OFFLINE_KEY, JSON.stringify(games)); }
  catch { /* quota */ }
}

/**
 * Try to add a game's iframe URL (and thumbnail) to the Cache API
 * so the service worker can serve them offline.
 */
async function cacheGameAssets(game) {
  if (!('caches' in window) || !game?.url) return;
  try {
    const cache = await caches.open('offline-games-cache');
    // Cache the game URL page (best-effort — cross-origin may fail)
    try { await cache.add(new Request(game.url, { mode: 'no-cors' })); }
    catch { /* cross-origin iframe, opaque response is still cached */ }
    // Cache the thumbnail
    if (game.thumbnail) {
      try { await cache.add(new Request(game.thumbnail, { mode: 'no-cors' })); }
      catch { /* fine */ }
    }
  } catch { /* caches unavailable */ }
}

/**
 * Remove a game's cached assets from the Cache API.
 */
async function uncacheGameAssets(game) {
  if (!('caches' in window) || !game?.url) return;
  try {
    const cache = await caches.open('offline-games-cache');
    await cache.delete(game.url);
    if (game.thumbnail) await cache.delete(game.thumbnail);
  } catch { /* fine */ }
}

/**
 * Hook for saving games for offline access.
 * Stores game metadata in localStorage and the game iframe/thumbnail in Cache API.
 */
export function useOfflineGames() {
  const [offlineGames, setOfflineGames] = useState(readOffline);

  // Sync from storage on mount (in case another tab modified it)
  useEffect(() => {
    const handler = (e) => {
      if (e.key === OFFLINE_KEY) setOfflineGames(readOffline());
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const saveOffline = useCallback(async (game) => {
    if (!game?.id) return;
    setOfflineGames(prev => {
      const exists = prev.some(g => g.id === game.id);
      if (exists) return prev;
      const entry = {
        id: game.id,
        title: game.title,
        thumbnail: game.thumbnail,
        category: game.category,
        url: game.url,
        source: game.source,
        width: game.width,
        height: game.height,
        savedAt: Date.now(),
      };
      const next = [entry, ...prev].slice(0, MAX_OFFLINE);
      writeOffline(next);
      return next;
    });
    await cacheGameAssets(game);
  }, []);

  const removeOffline = useCallback(async (gameId) => {
    const game = readOffline().find(g => g.id === gameId);
    setOfflineGames(prev => {
      const next = prev.filter(g => g.id !== gameId);
      writeOffline(next);
      return next;
    });
    if (game) await uncacheGameAssets(game);
  }, []);

  const isOffline = useCallback((gameId) => {
    return offlineGames.some(g => g.id === gameId);
  }, [offlineGames]);

  const clearOffline = useCallback(async () => {
    const current = readOffline();
    for (const g of current) await uncacheGameAssets(g);
    writeOffline([]);
    setOfflineGames([]);
  }, []);

  return { offlineGames, saveOffline, removeOffline, isOffline, clearOffline };
}

/**
 * Auto-save recently played games for offline access.
 * Call this in the game player when a game finishes loading.
 */
export async function autoSaveForOffline(game) {
  if (!game?.url) return;
  const existing = readOffline();
  const already = existing.some(g => g.id === game.id);
  if (already) return;

  const entry = {
    id: game.id,
    title: game.title,
    thumbnail: game.thumbnail,
    category: game.category,
    url: game.url,
    source: game.source,
    width: game.width,
    height: game.height,
    savedAt: Date.now(),
  };
  const next = [entry, ...existing].slice(0, MAX_OFFLINE);
  writeOffline(next);
  await cacheGameAssets(game);
}
