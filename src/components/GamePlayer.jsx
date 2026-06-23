import React, { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Maximize,
  Minimize,
  RotateCcw,
  Flag,
  Loader2,
  AlertTriangle,
  ShieldOff,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";
import { trackGamePlay } from "../hooks/usePlayerStats";
import { autoSaveForOffline } from "../hooks/useOfflineGames";
import { getAdShieldLevel, getSandboxValue } from "../hooks/useSourcePrefs";

// ── Report-broken helper (localStorage only, no hook needed) ─────────────────
const REPORTS_KEY = "gamehub_broken_reports";

function markGameBroken(game) {
  try {
    const existing = JSON.parse(localStorage.getItem(REPORTS_KEY) || "[]");
    if (existing.some((r) => r.id === game.id)) return false; // already reported
    const report = {
      id: game.id,
      title: game.title,
      source: game.source,
      reportedAt: Date.now(),
    };
    localStorage.setItem(
      REPORTS_KEY,
      JSON.stringify([report, ...existing].slice(0, 100)),
    );
    return true;
  } catch {
    return false;
  }
}

function isAlreadyReported(gameId) {
  try {
    return JSON.parse(localStorage.getItem(REPORTS_KEY) || "[]").some(
      (r) => r.id === gameId,
    );
  } catch {
    return false;
  }
}

/**
 * Full-screen game player with iframe embedding.
 *
 * Fixes implemented (REVIEW.md P1):
 *  - Aspect-ratio iframe scaling: game renders at its native W×H ratio,
 *    letter-boxed in remaining space instead of stretching to fill.
 *  - Shield change confirmation: cycling the ad shield asks before reloading
 *    so users don't lose game progress accidentally.
 *  - "Open in new tab" removed; replaced with "Report broken game".
 *  - Shield status toast moved to top-4 so it no longer covers game controls.
 */
export default function GamePlayer({ game, onClose }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef(null);
  const iframeRef = useRef(null);
  const startTimeRef = useRef(null);

  // ── Ad Shield ─────────────────────────────────────────────────────────────
  const [adShield, setAdShield] = useState(() => getAdShieldLevel());
  const [pendingShield, setPendingShield] = useState(null); // waiting for confirm
  const [shieldToast, setShieldToast] = useState(null);
  const sandboxVal = getSandboxValue(adShield);

  // ── Report broken ──────────────────────────────────────────────────────────
  const [reportToast, setReportToast] = useState(null);

  // ── Orientation ────────────────────────────────────────────────────────────
  const isPortrait = game.height > game.width;
  const orientationToLock = isPortrait ? "portrait" : "landscape";

  // Detect mobile once at mount (doesn't need to be reactive).
  // Uses maxTouchPoints so tablets in landscape are still caught.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const isMobileDevice =
    window.innerWidth < 1024 || navigator.maxTouchPoints > 0;

  // Track whether the physical device is currently in portrait orientation.
  const [deviceIsPortrait, setDeviceIsPortrait] = useState(
    () => window.innerHeight > window.innerWidth,
  );
  // Set to true when the user explicitly dismisses the rotate hint.
  const [rotateDismissed, setRotateDismissed] = useState(false);

  // Show the rotate-device overlay when:
  //   • The game is landscape  (not portrait)
  //   • The device is mobile
  //   • The device is currently held in portrait mode
  //   • The user hasn’t dismissed it
  const showRotateHint =
    !isPortrait && isMobileDevice && deviceIsPortrait && !rotateDismissed;

  // ── Auto-landscape orientation ──────────────────────────────────────────
  // For landscape games on mobile: try to lock to landscape immediately on
  // mount so the user doesn’t have to rotate manually.
  //
  // • Works on:  Android Chrome, Samsung Internet, installed PWAs
  // • Fails on:  iOS Safari (throws — the rotate hint handles the fallback)
  // • Ignored:   portrait games, desktop browsers
  useEffect(() => {
    if (!isMobileDevice || isPortrait) return;

    screen.orientation?.lock("landscape").catch(() => {
      // Lock not supported or not allowed in this context.
      // showRotateHint will be true if the device is currently portrait,
      // prompting the user to rotate manually.
    });

    // Sync deviceIsPortrait with real orientation changes so the hint
    // auto-dismisses the moment the user physically rotates the device.
    const onResize = () => {
      setDeviceIsPortrait(window.innerHeight > window.innerWidth);
    };
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      // Release the orientation lock when the player closes.
      try {
        screen.orientation?.unlock();
      } catch {
        /* */
      }
    };
  }, [isMobileDevice, isPortrait]);

  // ── Fullscreen ────────────────────────────────────────────────────────────
  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await containerRef.current?.requestFullscreen();
        setIsFullscreen(true);
        try {
          await screen.orientation?.lock(orientationToLock);
        } catch {
          /* unsupported */
        }
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
        try {
          screen.orientation?.unlock();
        } catch {
          /* */
        }
      }
    } catch {
      /* unsupported */
    }
  }, [orientationToLock]);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  // ── Escape key ────────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape" && !document.fullscreenElement) handleClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Playtime tracking ─────────────────────────────────────────────────────
  const handleClose = useCallback(() => {
    if (startTimeRef.current) {
      const elapsed = Math.round((Date.now() - startTimeRef.current) / 1000);
      trackGamePlay(game.id, game.title, elapsed);
    }
    onClose();
  }, [game, onClose]);

  // ── Prevent body scroll ───────────────────────────────────────────────────
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // ── Iframe events ─────────────────────────────────────────────────────────
  const handleIframeLoad = () => {
    setLoading(false);
    setError(false);
    startTimeRef.current = Date.now();
    autoSaveForOffline(game);
  };

  const handleIframeError = () => {
    setLoading(false);
    setError(true);
  };

  const reload = useCallback(() => {
    setLoading(true);
    setError(false);
    if (iframeRef.current) iframeRef.current.src = game.url;
  }, [game.url]);

  // ── Ad Shield: ask before reloading to protect game progress ─────────────
  const cycleShield = () => {
    const order = ["off", "light", "strict"];
    const idx = order.indexOf(adShield);
    setPendingShield(order[(idx + 1) % order.length]);
  };

  const SHIELD_LABELS = {
    off: "Ad Shield OFF — no restrictions",
    light: "Ad Shield LIGHT — popups & redirects blocked",
    strict: "Ad Shield STRICT — max isolation (may break some games)",
  };

  const applyShield = () => {
    if (!pendingShield) return;
    setAdShield(pendingShield);
    setShieldToast(SHIELD_LABELS[pendingShield]);
    setTimeout(() => setShieldToast(null), 3000);
    setTimeout(() => reload(), 100);
    setPendingShield(null);
  };

  const cancelShield = () => setPendingShield(null);

  const ShieldIcon =
    adShield === "strict"
      ? ShieldAlert
      : adShield === "light"
        ? ShieldCheck
        : ShieldOff;
  const shieldColor =
    adShield === "strict"
      ? "text-neon-orange"
      : adShield === "light"
        ? "text-neon-green"
        : "text-white/50";

  // ── Report broken game ────────────────────────────────────────────────────
  const handleReport = () => {
    if (isAlreadyReported(game.id)) {
      setReportToast("Already reported — thanks for the heads up!");
    } else {
      markGameBroken(game);
      setReportToast("Reported! We'll review this game.");
    }
    setTimeout(() => setReportToast(null), 3000);
  };

  const gameUrl = game.url;

  if (!gameUrl) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] bg-dark-900 flex flex-col items-center justify-center p-8"
        >
          <AlertTriangle size={48} className="text-neon-orange mb-4" />
          <h2 className="font-display text-lg font-bold text-white mb-2">
            Game Not Available
          </h2>
          <p className="text-dim text-sm text-center mb-6">
            This game doesn't have a playable URL
          </p>
          <button onClick={handleClose} className="btn-cyber">
            Go Back
          </button>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        ref={containerRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[200] bg-dark-950 flex flex-col"
      >
        {/* ── Top control bar ──────────────────────────────────────────── */}
        <motion.div
          initial={{ y: -40 }}
          animate={{ y: 0 }}
          className="flex items-center justify-between px-3 py-2 bg-dark-900/95 backdrop-blur-lg border-b border-neon-cyan/10 z-10 flex-shrink-0"
        >
          <button
            onClick={handleClose}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-dark-600/50 text-white/70 hover:text-neon-cyan transition-colors active:scale-90"
            aria-label="Close game"
          >
            <X size={18} />
          </button>

          <h3 className="font-display text-xs font-bold text-white/80 truncate mx-3 flex-1 text-center">
            {game.title}
          </h3>

          <div className="flex items-center gap-1">
            {/* Ad Shield — opens confirm dialog before reloading */}
            <button
              onClick={cycleShield}
              className={`w-8 h-8 flex items-center justify-center rounded-lg ${shieldColor} hover:text-neon-cyan transition-colors active:scale-90`}
              aria-label={`Ad Shield: ${adShield} (tap to change)`}
              title={`Ad Shield: ${adShield}`}
            >
              <ShieldIcon size={15} />
            </button>

            {/* Reload */}
            <button
              onClick={reload}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-white/50 hover:text-neon-cyan transition-colors active:scale-90"
              aria-label="Reload game"
              title="Reload"
            >
              <RotateCcw size={15} />
            </button>

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-white/50 hover:text-neon-cyan transition-colors active:scale-90"
              aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? <Minimize size={15} /> : <Maximize size={15} />}
            </button>

            {/* Report broken — replaces "open in new tab" */}
            <button
              onClick={handleReport}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-white/30 hover:text-neon-orange transition-colors active:scale-90"
              aria-label="Report broken game"
              title="Report broken game"
            >
              <Flag size={14} />
            </button>
          </div>
        </motion.div>

        {/* ── Game area: letter-boxed to the game's native aspect ratio ─── */}
        <div className="relative flex-1 bg-black overflow-hidden flex items-center justify-center">
          {/* ── Rotate-device hint ─────────────────────────────────────── */}
          {/* Shown when: landscape game + mobile device + device is portrait */}
          <AnimatePresence>
            {showRotateHint && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-dark-950/95"
              >
                {/* Phone silhouette animating portrait → landscape → portrait */}
                <motion.div
                  animate={{ rotate: [0, -90, -90, 0, 0] }}
                  transition={{
                    duration: 2.5,
                    times: [0, 0.35, 0.65, 0.85, 1],
                    repeat: Infinity,
                    repeatDelay: 0.8,
                    ease: "easeInOut",
                  }}
                  className="text-6xl mb-6 select-none"
                >
                  📱
                </motion.div>

                <p className="font-display text-sm font-black text-white tracking-wider mb-2">
                  ROTATE YOUR DEVICE
                </p>
                <p className="text-xs text-dim text-center px-10 mb-8">
                  This game is designed to play in landscape mode
                </p>

                <button
                  onClick={() => setRotateDismissed(true)}
                  className="px-6 py-2.5 rounded-xl bg-dark-700/60 border border-dark-400/30
                             text-white/40 text-xs font-display tracking-wider
                             active:scale-95 transition-all hover:text-white/60"
                >
                  Play in Portrait Anyway
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Aspect-ratio wrapper — constrains iframe to game dimensions */}
          <div
            style={{
              aspectRatio: `${game.width} / ${game.height}`,
              maxWidth: "100%",
              maxHeight: "100%",
              // Portrait games fill height; landscape games fill width
              ...(isPortrait
                ? { height: "100%", width: "auto" }
                : { width: "100%", height: "auto" }),
              position: "relative",
            }}
          >
            {/* Loading overlay */}
            {loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-dark-900 z-10">
                <Loader2
                  size={40}
                  className="text-neon-cyan animate-spin mb-4"
                />
                <p className="font-display text-sm text-neon-cyan animate-pulse tracking-wider">
                  LOADING GAME...
                </p>
                <p className="text-[11px] text-dim mt-2">
                  This may take a moment
                </p>
              </div>
            )}

            {/* Error overlay */}
            {error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-dark-900 z-10 p-8">
                <AlertTriangle size={40} className="text-neon-orange mb-4" />
                <h3 className="font-display text-sm font-bold text-white mb-2">
                  Failed to Load
                </h3>
                <p className="text-dim text-xs text-center mb-4">
                  The game couldn't be loaded. It may be temporarily
                  unavailable.
                </p>
                <button
                  onClick={reload}
                  className="btn-cyber text-xs px-4 py-2"
                >
                  Try Again
                </button>
              </div>
            )}

            {/* The iframe itself */}
            <iframe
              ref={iframeRef}
              src={gameUrl}
              title={game.title}
              className="absolute inset-0 w-full h-full border-0"
              onLoad={handleIframeLoad}
              onError={handleIframeError}
              allow="autoplay; fullscreen; gamepad; pointer-lock; accelerometer; gyroscope"
              allowFullScreen
              referrerPolicy="no-referrer"
              loading="eager"
              {...(sandboxVal ? { sandbox: sandboxVal } : {})}
            />

            {/* ── Ad Shield confirm overlay ──────────────────────────────── */}
            <AnimatePresence>
              {pendingShield && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-30 flex items-end justify-center bg-dark-950/70 backdrop-blur-sm p-4"
                >
                  <motion.div
                    initial={{ y: 40, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 40, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 28 }}
                    className="w-full max-w-sm bg-dark-800 rounded-2xl border border-neon-cyan/15 p-5"
                  >
                    <p className="font-display text-xs font-bold text-white/90 tracking-wider mb-1">
                      CHANGE AD SHIELD?
                    </p>
                    <p className="text-xs text-dim mb-4">
                      Switching to{" "}
                      <span className="text-white/80 font-semibold">
                        {pendingShield.toUpperCase()}
                      </span>{" "}
                      will reload the game and you'll lose your progress.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={applyShield}
                        className="flex-1 py-2.5 rounded-xl bg-neon-cyan/15 border border-neon-cyan/30
                                   text-neon-cyan text-xs font-display font-bold tracking-wider active:scale-95 transition-all"
                      >
                        Apply & Reload
                      </button>
                      <button
                        onClick={cancelShield}
                        className="flex-1 py-2.5 rounded-xl bg-dark-700/50 border border-dark-500/30
                                   text-white/60 text-xs font-display font-bold tracking-wider active:scale-95 transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Shield status toast (top, not bottom) ─────────────────── */}
            <AnimatePresence>
              {shieldToast && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="absolute top-3 left-3 right-3 z-20 px-4 py-2.5 rounded-xl
                             bg-dark-900/95 backdrop-blur border border-neon-cyan/20 text-center"
                >
                  <p className="text-xs font-semibold text-white flex items-center justify-center gap-2">
                    <ShieldIcon size={13} className={shieldColor} />
                    {shieldToast}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Report toast ───────────────────────────────────────────── */}
            <AnimatePresence>
              {reportToast && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="absolute top-3 left-3 right-3 z-20 px-4 py-2.5 rounded-xl
                             bg-dark-900/95 backdrop-blur border border-neon-orange/20 text-center"
                >
                  <p className="text-xs font-semibold text-neon-orange flex items-center justify-center gap-2">
                    <Flag size={13} />
                    {reportToast}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
