import { useState, useCallback, useEffect } from 'react';

const RATINGS_KEY = 'gamehub_ratings';

function readRatings() {
  try { return JSON.parse(localStorage.getItem(RATINGS_KEY)) || {}; }
  catch { return {}; }
}

function writeRatings(ratings) {
  localStorage.setItem(RATINGS_KEY, JSON.stringify(ratings));
}

/**
 * Hook for managing game ratings (thumbs up / thumbs down).
 * Each game can have a rating of 'up', 'down', or null.
 * Returns { getRating, setRating, counts } for a given game id.
 */
export function useRatings() {
  const [ratings, setRatings] = useState(readRatings);

  // Cross-tab sync
  useEffect(() => {
    const handler = (e) => {
      if (e.key === RATINGS_KEY) setRatings(readRatings());
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const getRating = useCallback((gameId) => {
    return ratings[gameId] || null; // 'up' | 'down' | null
  }, [ratings]);

  const setRating = useCallback((gameId, value) => {
    setRatings(prev => {
      const next = { ...prev };
      if (prev[gameId] === value) {
        // Toggle off if same rating clicked again
        delete next[gameId];
      } else {
        next[gameId] = value; // 'up' or 'down'
      }
      writeRatings(next);
      return next;
    });
  }, []);

  // Summary stats
  const getLikedGames = useCallback(() => {
    return Object.entries(ratings).filter(([, v]) => v === 'up').map(([id]) => id);
  }, [ratings]);

  const getDislikedGames = useCallback(() => {
    return Object.entries(ratings).filter(([, v]) => v === 'down').map(([id]) => id);
  }, [ratings]);

  return { getRating, setRating, getLikedGames, getDislikedGames };
}
