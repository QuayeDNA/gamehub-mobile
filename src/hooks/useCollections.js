import { useState, useCallback, useEffect } from 'react';

const COLLECTIONS_KEY = 'gamehub_collections';

/**
 * Collections data shape:
 * [{ id, name, emoji, games: [{ id, title, thumbnail, category, url, source }], createdAt }]
 */

function readCollections() {
  try { return JSON.parse(localStorage.getItem(COLLECTIONS_KEY)) || []; }
  catch { return []; }
}

function writeCollections(c) {
  localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(c));
}

let nextId = Date.now();

export function useCollections() {
  const [collections, setCollections] = useState(readCollections);

  // Cross-tab sync
  useEffect(() => {
    const handler = (e) => {
      if (e.key === COLLECTIONS_KEY) setCollections(readCollections());
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const createCollection = useCallback((name, emoji = '🎮') => {
    const id = `col_${++nextId}`;
    setCollections(prev => {
      const next = [{ id, name, emoji, games: [], createdAt: Date.now() }, ...prev];
      writeCollections(next);
      return next;
    });
    return id;
  }, []);

  const deleteCollection = useCallback((colId) => {
    setCollections(prev => {
      const next = prev.filter(c => c.id !== colId);
      writeCollections(next);
      return next;
    });
  }, []);

  const renameCollection = useCallback((colId, name) => {
    setCollections(prev => {
      const next = prev.map(c => c.id === colId ? { ...c, name } : c);
      writeCollections(next);
      return next;
    });
  }, []);

  const addGameToCollection = useCallback((colId, game) => {
    setCollections(prev => {
      const next = prev.map(c => {
        if (c.id !== colId) return c;
        if (c.games.some(g => g.id === game.id)) return c; // already in
        return {
          ...c,
          games: [...c.games, { id: game.id, title: game.title, thumbnail: game.thumbnail, category: game.category, url: game.url, source: game.source }],
        };
      });
      writeCollections(next);
      return next;
    });
  }, []);

  const removeGameFromCollection = useCallback((colId, gameId) => {
    setCollections(prev => {
      const next = prev.map(c => {
        if (c.id !== colId) return c;
        return { ...c, games: c.games.filter(g => g.id !== gameId) };
      });
      writeCollections(next);
      return next;
    });
  }, []);

  const getCollection = useCallback((colId) => {
    return collections.find(c => c.id === colId) || null;
  }, [collections]);

  const isGameInCollection = useCallback((colId, gameId) => {
    const col = collections.find(c => c.id === colId);
    return col ? col.games.some(g => g.id === gameId) : false;
  }, [collections]);

  return {
    collections,
    createCollection,
    deleteCollection,
    renameCollection,
    addGameToCollection,
    removeGameFromCollection,
    getCollection,
    isGameInCollection,
  };
}
