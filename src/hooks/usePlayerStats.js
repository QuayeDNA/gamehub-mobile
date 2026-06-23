/**
 * usePlayerStats – Local player profile, analytics, and data management
 * Tracks: games played, playtime, achievements, preferences
 */

import React, { useCallback, useEffect } from "react";

const STATS_KEY = "playerProfile_v1";
const STATS_EVENT = "gamehub:stats-updated";

// Default player stats
const defaultStats = {
  username: "Player",
  avatar: null, // DiceBear avatar URL
  created: new Date().toISOString(),
  gamesPlayed: 0,
  totalPlaytime: 0, // minutes
  currentStreak: 0,
  favoriteCount: 0,
  mostPlayedGame: null,
  gameStats: {}, // { gameId: { plays: 0, totalTime: 0, lastPlayed: ISO } }
};

function getStats() {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    return raw ? JSON.parse(raw) : { ...defaultStats };
  } catch {
    return { ...defaultStats };
  }
}

function saveStats(stats) {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch (e) {
    console.error("Failed to save player stats:", e);
  }
}

/**
 * Track that a game was played
 */
export function trackGamePlay(gameId, title, playtimeSecs = 0) {
  const stats = getStats();
  const now = new Date().toISOString();
  const playteimeMin = Math.max(1, Math.round(playtimeSecs / 60)); // min 1 min

  if (!stats.gameStats[gameId]) {
    stats.gameStats[gameId] = {
      plays: 0,
      totalTime: 0,
      lastPlayed: null,
      title,
    };
    stats.gamesPlayed += 1;
  }

  stats.gameStats[gameId].plays += 1;
  stats.gameStats[gameId].totalTime += playteimeMin;
  stats.gameStats[gameId].lastPlayed = now;
  stats.totalPlaytime += playteimeMin;

  // Update most played game
  let mostPlayed = stats.mostPlayedGame;
  let maxPlays = 0;
  for (const id in stats.gameStats) {
    if (stats.gameStats[id].plays > maxPlays) {
      maxPlays = stats.gameStats[id].plays;
      mostPlayed = { id, plays: maxPlays, title: stats.gameStats[id].title };
    }
  }
  stats.mostPlayedGame = mostPlayed;

  saveStats(stats);
  window.dispatchEvent(new CustomEvent(STATS_EVENT));
}

/**
 * Hook to access & manage player stats
 */
export function usePlayerStats() {
  const [stats, setStats] = React.useState(() => getStats());

  const refetch = useCallback(() => setStats(getStats()), []);

  useEffect(() => {
    window.addEventListener(STATS_EVENT, refetch);
    return () => window.removeEventListener(STATS_EVENT, refetch);
  }, [refetch]);

  const updateUsername = (name) => {
    const s = getStats();
    s.username = name;
    saveStats(s);
    refetch();
  };

  const updateAvatar = (avatarUrl) => {
    const s = getStats();
    s.avatar = avatarUrl;
    saveStats(s);
    refetch();
  };

  const clearGameStat = (gameId) => {
    const s = getStats();
    if (s.gameStats[gameId]) {
      const stat = s.gameStats[gameId];
      s.totalPlaytime -= stat.totalTime;
      s.gamesPlayed -= 1;
      delete s.gameStats[gameId];
      if (s.mostPlayedGame?.id === gameId) s.mostPlayedGame = null;
      saveStats(s);
      refetch();
    }
  };

  const clearAllStats = () => {
    localStorage.removeItem(STATS_KEY);
    setStats({ ...defaultStats });
  };

  const getTopGames = (limit = 5) => {
    return Object.entries(stats.gameStats)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.plays - a.plays)
      .slice(0, limit);
  };

  const getRecentGames = (limit = 5) => {
    return Object.entries(stats.gameStats)
      .map(([id, data]) => ({ id, ...data }))
      .filter((g) => g.lastPlayed)
      .sort((a, b) => new Date(b.lastPlayed) - new Date(a.lastPlayed))
      .slice(0, limit);
  };

  const getSessionStats = () => {
    const played = stats.gamesPlayed;
    const hours = Math.floor(stats.totalPlaytime / 60);
    const mins = stats.totalPlaytime % 60;
    // Read favorite count from the canonical favorites store
    let favCount = 0;
    try {
      const favs = JSON.parse(localStorage.getItem("gamehub_favorites"));
      favCount = Array.isArray(favs) ? favs.length : 0;
    } catch {
      /* ignore */
    }
    return {
      gamesPlayed: played,
      totalPlaytime: `${hours}h ${mins}m`,
      totalPlaytimeMin: stats.totalPlaytime,
      favoriteCount: favCount,
      mostPlayedGame: stats.mostPlayedGame,
    };
  };

  return {
    stats,
    refetch,
    updateUsername,
    updateAvatar,
    clearGameStat,
    clearAllStats,
    getTopGames,
    getRecentGames,
    getSessionStats,
  };
}

export default usePlayerStats;
