import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Maximize, Minimize, RotateCcw, Volume2, VolumeX, Loader2, AlertTriangle, ExternalLink, Shield, ShieldOff, ShieldCheck, ShieldAlert } from 'lucide-react';
import { trackGamePlay } from '../hooks/usePlayerStats';
import { autoSaveForOffline } from '../hooks/useOfflineGames';
import { getAdShieldLevel, getSandboxValue } from '../hooks/useSourcePrefs';

/**
 * Full-screen game player with iframe embedding
 * Supports: GameMonetize, GameDistribution, GamePix URLs
 * Detects game orientation and locks accordingly
 */
export default function GamePlayer({ game, onClose }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [muted, setMuted] = useState(false);
  const containerRef = useRef(null);
  const iframeRef = useRef(null);
  const startTimeRef = useRef(null);

  // Ad Shield state — user can cycle between off/light/strict per-session
  const [adShield, setAdShield] = useState(() => getAdShieldLevel());
  const sandboxVal = getSandboxValue(adShield);
  const [shieldToast, setShieldToast] = useState(null);

  // Detect game orientation from dimensions
  const isPortrait = game.height > game.width;
  const orientationToLock = isPortrait ? 'portrait' : 'landscape';

  // Fullscreen toggle with orientation lock
  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await containerRef.current?.requestFullscreen();
        setIsFullscreen(true);
        // Lock to detected orientation (portrait or landscape)
        try { 
          await screen.orientation?.lock(orientationToLock); 
        } catch { /* not supported */ }
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
        try { screen.orientation?.unlock(); } catch { /* */ }
      }
    } catch { /* fullscreen not supported */ }
  }, [orientationToLock]);

  // Listen for fullscreen changes
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  // Handle escape key
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape' && !document.fullscreenElement) handleClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Track playtime and close
  const handleClose = useCallback(() => {
    if (startTimeRef.current) {
      const elapsedSecs = Math.round((Date.now() - startTimeRef.current) / 1000);
      trackGamePlay(game.id, game.title, elapsedSecs);
    }
    onClose();
  }, [game, onClose]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleIframeLoad = () => {
    setLoading(false);
    setError(false);
    // Record the start time for playtime tracking
    startTimeRef.current = Date.now();
    // Auto-save for offline access
    autoSaveForOffline(game);
  };

  const handleIframeError = () => {
    setLoading(false);
    setError(true);
  };

  const reload = () => {
    setLoading(true);
    setError(false);
    if (iframeRef.current) {
      iframeRef.current.src = game.url;
    }
  };

  // Cycle ad shield level: off → light → strict → off
  const cycleShield = () => {
    const order = ['off', 'light', 'strict'];
    const idx = order.indexOf(adShield);
    const next = order[(idx + 1) % order.length];
    setAdShield(next);
    const labels = { off: 'Ad Shield OFF — no restrictions', light: 'Ad Shield LIGHT — popups & redirects blocked', strict: 'Ad Shield STRICT — max isolation (may break some games)' };
    setShieldToast(labels[next]);
    setTimeout(() => setShieldToast(null), 3000);
    // Force reload with new sandbox
    setTimeout(() => reload(), 100);
  };

  const ShieldIcon = adShield === 'strict' ? ShieldAlert : adShield === 'light' ? ShieldCheck : ShieldOff;
  const shieldColor = adShield === 'strict' ? 'text-neon-orange' : adShield === 'light' ? 'text-neon-green' : 'text-white/50';

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
          <h2 className="font-display text-lg font-bold text-white mb-2">Game Not Available</h2>
          <p className="text-dim text-sm text-center mb-6">This game doesn't have a playable URL</p>
          <button onClick={handleClose} className="btn-cyber">Go Back</button>
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
        {/* Top control bar */}
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
            <button
              onClick={cycleShield}
              className={`w-8 h-8 flex items-center justify-center rounded-lg ${shieldColor} hover:text-neon-cyan transition-colors active:scale-90`}
              aria-label={`Ad Shield: ${adShield}`}
              title={`Ad Shield: ${adShield} (tap to cycle)`}
            >
              <ShieldIcon size={15} />
            </button>

            <button
              onClick={reload}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-white/50 hover:text-neon-cyan transition-colors active:scale-90"
              aria-label="Reload game"
              title="Reload"
            >
              <RotateCcw size={15} />
            </button>

            <button
              onClick={toggleFullscreen}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-white/50 hover:text-neon-cyan transition-colors active:scale-90"
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize size={15} /> : <Maximize size={15} />}
            </button>

            <a
              href={gameUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 flex items-center justify-center rounded-lg text-white/50 hover:text-neon-cyan transition-colors"
              aria-label="Open in new tab"
              title="Open in new tab"
            >
              <ExternalLink size={15} />
            </a>
          </div>
        </motion.div>

        {/* Game iframe */}
        <div className="flex-1 relative bg-black">
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-dark-900 z-10">
              <Loader2 size={40} className="text-neon-cyan animate-spin mb-4" />
              <p className="font-display text-sm text-neon-cyan animate-pulse tracking-wider">LOADING GAME...</p>
              <p className="text-[11px] text-dim mt-2">This may take a moment</p>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-dark-900 z-10 p-8">
              <AlertTriangle size={40} className="text-neon-orange mb-4" />
              <h3 className="font-display text-sm font-bold text-white mb-2">Failed to Load</h3>
              <p className="text-dim text-xs text-center mb-4">
                The game couldn't be loaded. It may be temporarily unavailable.
              </p>
              <div className="flex gap-3">
                <button onClick={reload} className="btn-cyber text-xs px-4 py-2">
                  Try Again
                </button>
                <a
                  href={gameUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-cyber text-xs px-4 py-2 flex items-center gap-1"
                >
                  <ExternalLink size={12} /> Open External
                </a>
              </div>
            </div>
          )}

          <iframe
            ref={iframeRef}
            src={gameUrl}
            title={game.title}
            className="w-full h-full border-0"
            style={{ minHeight: '100%', minWidth: '100%' }}
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            allow="autoplay; fullscreen; gamepad; pointer-lock; accelerometer; gyroscope"
            allowFullScreen
            referrerPolicy="no-referrer"
            loading="eager"
            {...(sandboxVal ? { sandbox: sandboxVal } : {})}
          />

          {/* Ad Shield toast notification */}
          <AnimatePresence>
            {shieldToast && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 30 }}
                className="absolute bottom-4 left-4 right-4 z-20 px-4 py-3 rounded-xl bg-dark-900/95 backdrop-blur border border-neon-cyan/20 text-center"
              >
                <p className="text-xs font-semibold text-white flex items-center justify-center gap-2">
                  <ShieldIcon size={14} className={shieldColor} />
                  {shieldToast}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
