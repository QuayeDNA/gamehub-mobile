import { useState, useEffect, useCallback } from 'react';

const FAVORITES_KEY = 'gamehub_favorites';
const RECENT_KEY = 'gamehub_recent';
const MAX_RECENT = 20;

/**
 * Read/write favorites from localStorage
 */
function readFavorites() {
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY)) || [];
  } catch { return []; }
}

function writeFavorites(favs) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs));
}

/**
 * Hook for managing favorite games
 */
export function useFavorites() {
  const [favorites, setFavorites] = useState(readFavorites);

  // Cross-tab sync: re-read when another tab updates localStorage
  useEffect(() => {
    const handler = (e) => {
      if (e.key === FAVORITES_KEY) setFavorites(readFavorites());
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const toggleFavorite = useCallback((game) => {
    setFavorites(prev => {
      const exists = prev.some(f => f.id === game.id);
      const next = exists
        ? prev.filter(f => f.id !== game.id)
        : [{ id: game.id, title: game.title, thumbnail: game.thumbnail, category: game.category, url: game.url, source: game.source }, ...prev];
      writeFavorites(next);
      return next;
    });
  }, []);

  const isFavorite = useCallback((id) => {
    return favorites.some(f => f.id === id);
  }, [favorites]);

  return { favorites, toggleFavorite, isFavorite };
}

/**
 * Hook for recently played games
 */
export function useRecentlyPlayed() {
  const [recent, setRecent] = useState(() => {
    try { return JSON.parse(localStorage.getItem(RECENT_KEY)) || []; }
    catch { return []; }
  });

  // Cross-tab sync
  useEffect(() => {
    const handler = (e) => {
      if (e.key === RECENT_KEY) {
        try { setRecent(JSON.parse(e.newValue) || []); }
        catch { /* ignore */ }
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const addRecent = useCallback((game) => {
    setRecent(prev => {
      const filtered = prev.filter(g => g.id !== game.id);
      const next = [
        { id: game.id, title: game.title, thumbnail: game.thumbnail, category: game.category, url: game.url, source: game.source, playedAt: Date.now() },
        ...filtered,
      ].slice(0, MAX_RECENT);
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const clearRecent = useCallback(() => {
    localStorage.removeItem(RECENT_KEY);
    setRecent([]);
  }, []);

  return { recent, addRecent, clearRecent };
}
