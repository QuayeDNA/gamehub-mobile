/**
 * useSourcePrefs – Per-source enable/disable + Ad Shield + Mobile Filter
 * ───────────────────────────────────────────────────────────────────────
 * Stores in localStorage with cross-tab sync.
 *
 * adShield levels:
 *   'off'    – no restrictions
 *   'light'  – block popups, top-navigation, form submissions
 *   'strict' – above + block same-origin access (isolates ads harder)
 *
 * mobileFilter:
 *   true  – pass mobile=true / type=mobile to GD and GM APIs so only
 *           games verified for mobile screens are returned (default)
 *   false – pass mobile=all to receive the full catalog including
 *           desktop-only games
 */

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "gamehub_source_prefs";

const DEFAULT_PREFS = {
  sources: {
    gamemonetize: true,
    gamedistribution: true,
    // GamePix requires a publisher SID for reliable results — disabled by
    // default so first-time users don't see empty/failed source batches.
    // Users can enable it manually in Settings once they have a SID.
    gamepix: false,
    htmlgames: true,
  },
  adShield: "light", // 'off' | 'light' | 'strict'
  mobileFilter: true, // true = mobile-verified games only (recommended)
};

function loadPrefs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw)
      return { ...DEFAULT_PREFS, sources: { ...DEFAULT_PREFS.sources } };
    const parsed = JSON.parse(raw);
    return {
      sources: { ...DEFAULT_PREFS.sources, ...parsed.sources },
      adShield: parsed.adShield ?? DEFAULT_PREFS.adShield,
      mobileFilter: parsed.mobileFilter ?? DEFAULT_PREFS.mobileFilter,
    };
  } catch {
    return { ...DEFAULT_PREFS, sources: { ...DEFAULT_PREFS.sources } };
  }
}

function savePrefs(prefs) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    /* quota */
  }
}

export function useSourcePrefs() {
  const [prefs, setPrefs] = useState(loadPrefs);

  // Cross-tab sync
  useEffect(() => {
    const handler = (e) => {
      if (e.key === STORAGE_KEY) setPrefs(loadPrefs());
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const toggleSource = useCallback((slug) => {
    setPrefs((prev) => {
      // Don't allow disabling ALL sources — keep at least one enabled
      const nextSources = { ...prev.sources, [slug]: !prev.sources[slug] };
      const enabledCount = Object.values(nextSources).filter(Boolean).length;
      if (enabledCount === 0) return prev;
      const next = { ...prev, sources: nextSources };
      savePrefs(next);
      return next;
    });
  }, []);

  const setAdShield = useCallback((level) => {
    setPrefs((prev) => {
      const next = { ...prev, adShield: level };
      savePrefs(next);
      return next;
    });
  }, []);

  const setMobileFilter = useCallback((value) => {
    setPrefs((prev) => {
      const next = { ...prev, mobileFilter: Boolean(value) };
      savePrefs(next);
      return next;
    });
  }, []);

  const isSourceEnabled = useCallback(
    (slug) => {
      return prefs.sources[slug] !== false;
    },
    [prefs.sources],
  );

  /** Returns array of enabled source keys like ['gm','gd','hg'] */
  const getEnabledSourceKeys = useCallback(() => {
    const map = {
      gamemonetize: "gm",
      gamedistribution: "gd",
      gamepix: "gp",
      htmlgames: "hg",
    };
    return Object.entries(prefs.sources)
      .filter(([, enabled]) => enabled)
      .map(([slug]) => map[slug])
      .filter(Boolean);
  }, [prefs.sources]);

  return {
    prefs,
    toggleSource,
    setAdShield,
    setMobileFilter,
    isSourceEnabled,
    getEnabledSourceKeys,
  };
}

// ── Non-hook helpers (used inside services that can't call hooks) ─────────────

/** Returns enabled source keys — e.g. ['gm','gd','hg'] */
export function getEnabledSourceKeys() {
  const prefs = loadPrefs();
  const map = {
    gamemonetize: "gm",
    gamedistribution: "gd",
    gamepix: "gp",
    htmlgames: "hg",
  };
  return Object.entries(prefs.sources)
    .filter(([, enabled]) => enabled)
    .map(([slug]) => map[slug])
    .filter(Boolean);
}

/** Returns current ad shield level. */
export function getAdShieldLevel() {
  return loadPrefs().adShield;
}

/**
 * Returns whether the mobile-games-only filter is active.
 * When true, rawGD and rawGM pass mobile=true / type=mobile to their APIs
 * so only verified mobile games are returned.
 */
export function getMobileFilter() {
  return loadPrefs().mobileFilter;
}

/**
 * Build the iframe sandbox attribute value based on ad shield level.
 *
 * 'off'    → no sandbox (unrestricted)
 * 'light'  → allow-scripts allow-same-origin allow-pointer-lock allow-orientation-lock
 *            (blocks popups, top-nav, forms — kills most ad redirects)
 * 'strict' → allow-scripts allow-pointer-lock allow-orientation-lock
 *            (drops allow-same-origin — isolates ad SDK storage/cookies)
 *            ⚠️ May break some games that need localStorage or same-origin access
 */
export function getSandboxValue(level) {
  switch (level) {
    case "light":
      return "allow-scripts allow-same-origin allow-pointer-lock allow-orientation-lock";
    case "strict":
      return "allow-scripts allow-pointer-lock allow-orientation-lock";
    default:
      return null; // no sandbox attribute
  }
}
