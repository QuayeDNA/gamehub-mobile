/**
 * useSourcePrefs – Per-source enable/disable + Ad Shield preferences
 * ───────────────────────────────────────────────────────────────────
 * Stores in localStorage with cross-tab sync.
 *
 * adShield levels:
 *   'off'    – no restrictions (current behaviour)
 *   'light'  – block popups, top-navigation, form submissions
 *   'strict' – above + block same-origin access (isolates ads harder)
 */

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'gamehub_source_prefs';

const DEFAULT_PREFS = {
  // Per-source enabled state (all on by default)
  sources: {
    gamemonetize: true,
    gamedistribution: true,
    gamepix: true,
    htmlgames: true,
  },
  // Ad shield level
  adShield: 'light', // 'off' | 'light' | 'strict'
};

function loadPrefs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PREFS };
    const parsed = JSON.parse(raw);
    return {
      sources: { ...DEFAULT_PREFS.sources, ...parsed.sources },
      adShield: parsed.adShield || DEFAULT_PREFS.adShield,
    };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

function savePrefs(prefs) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch { /* quota */ }
}

export function useSourcePrefs() {
  const [prefs, setPrefs] = useState(loadPrefs);

  // Cross-tab sync
  useEffect(() => {
    const handler = (e) => {
      if (e.key === STORAGE_KEY) setPrefs(loadPrefs());
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const toggleSource = useCallback((slug) => {
    setPrefs(prev => {
      // Don't allow disabling ALL sources — keep at least one enabled
      const nextSources = { ...prev.sources, [slug]: !prev.sources[slug] };
      const enabledCount = Object.values(nextSources).filter(Boolean).length;
      if (enabledCount === 0) return prev; // block the toggle
      const next = { ...prev, sources: nextSources };
      savePrefs(next);
      return next;
    });
  }, []);

  const setAdShield = useCallback((level) => {
    setPrefs(prev => {
      const next = { ...prev, adShield: level };
      savePrefs(next);
      return next;
    });
  }, []);

  const isSourceEnabled = useCallback((slug) => {
    return prefs.sources[slug] !== false;
  }, [prefs.sources]);

  /** Returns array of enabled source keys like ['gm','gd','gp','hg'] */
  const getEnabledSourceKeys = useCallback(() => {
    const map = { gamemonetize: 'gm', gamedistribution: 'gd', gamepix: 'gp', htmlgames: 'hg' };
    return Object.entries(prefs.sources)
      .filter(([, enabled]) => enabled)
      .map(([slug]) => map[slug])
      .filter(Boolean);
  }, [prefs.sources]);

  return {
    prefs,
    toggleSource,
    setAdShield,
    isSourceEnabled,
    getEnabledSourceKeys,
  };
}

/**
 * Get enabled source keys directly (non-hook version for use in services).
 * Returns ['gm','gd','gp','hg'] filtered by user prefs.
 */
export function getEnabledSourceKeys() {
  const prefs = loadPrefs();
  const map = { gamemonetize: 'gm', gamedistribution: 'gd', gamepix: 'gp', htmlgames: 'hg' };
  return Object.entries(prefs.sources)
    .filter(([, enabled]) => enabled)
    .map(([slug]) => map[slug])
    .filter(Boolean);
}

/**
 * Get current ad shield level (non-hook version).
 */
export function getAdShieldLevel() {
  return loadPrefs().adShield;
}

/**
 * Build the iframe sandbox attribute value based on ad shield level.
 *
 * 'off'    → no sandbox (unrestricted, as before)
 * 'light'  → allow-scripts allow-same-origin allow-pointer-lock allow-orientation-lock
 *            (blocks popups, top-nav, forms — kills most ad redirects)
 * 'strict' → allow-scripts allow-pointer-lock allow-orientation-lock
 *            (drops allow-same-origin — isolates ad SDK storage/cookies)
 *            ⚠️ May break some games that need localStorage or same-origin access
 */
export function getSandboxValue(level) {
  switch (level) {
    case 'light':
      return 'allow-scripts allow-same-origin allow-pointer-lock allow-orientation-lock';
    case 'strict':
      return 'allow-scripts allow-pointer-lock allow-orientation-lock';
    default:
      return null; // no sandbox attribute
  }
}
