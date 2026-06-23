import React, { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Heart,
  Share2,
  ArrowLeft,
  Clock,
  Tag,
  User,
  Building2,
  Monitor,
  Calendar,
  Loader2,
  Download,
  CheckCircle,
  ThumbsUp,
  ThumbsDown,
  FolderPlus,
  Plus,
  X,
} from "lucide-react";
import { useGame, useRelatedGames } from "../hooks/useGames";
import { useFavorites, useRecentlyPlayed } from "../hooks/useFavorites";
import { useOfflineGames } from "../hooks/useOfflineGames";
import { getCategoryMeta } from "../services/gameApi";
import { getCategoryIcon } from "../utils/helpers";
import GamePlayer from "../components/GamePlayer";
import { GameCard } from "../components/GameCards";
import useDocumentTitle from "../hooks/useDocumentTitle";
import { useToast } from "../components/Toast";
import { useRatings } from "../hooks/useRatings";
import { useCollections } from "../hooks/useCollections";
import SEO, { buildGameJsonLd } from "../components/SEO";

export default function GameDetail() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const passedGame = location.state?.game;

  const { game: fetchedGame, loading, error } = useGame(passedGame ? null : id);
  const game = passedGame || fetchedGame;

  const { toggleFavorite, isFavorite } = useFavorites();
  const { addRecent } = useRecentlyPlayed();
  const { saveOffline, removeOffline, isOffline } = useOfflineGames();
  const toast = useToast();
  const { getRating, setRating } = useRatings();
  const {
    collections,
    createCollection,
    addGameToCollection,
    isGameInCollection,
  } = useCollections();
  const [showPlayer, setShowPlayer] = useState(false);
  const [showDesktopWarning, setShowDesktopWarning] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const [showColPicker, setShowColPicker] = useState(false);
  const [newColName, setNewColName] = useState("");

  // Key for suppressing the desktop-game warning (stored in localStorage)
  const DESKTOP_WARN_KEY = "gamehub_skip_desktop_warn";
  const skipDesktopWarn = () => {
    try {
      localStorage.setItem(DESKTOP_WARN_KEY, "1");
    } catch {
      /* */
    }
  };

  useDocumentTitle(game?.title || "Game");
  const related = useRelatedGames(game, 6);

  const favd = game ? isFavorite(game.id) : false;
  const saved = game ? isOffline(game.id) : false;
  const icon = getCategoryIcon(game?.category);

  const handlePlay = () => {
    if (!game) return;
    // Warn before launching a desktop-only game on a small screen
    const isSmallScreen = window.innerWidth < 1024;
    const alreadySuppressed = (() => {
      try {
        return !!localStorage.getItem("gamehub_skip_desktop_warn");
      } catch {
        return false;
      }
    })();
    if (game.mobile === false && isSmallScreen && !alreadySuppressed) {
      setShowDesktopWarning(true);
      return;
    }
    addRecent(game);
    setShowPlayer(true);
  };

  const confirmPlayDesktop = (dontShowAgain) => {
    if (dontShowAgain) skipDesktopWarn();
    setShowDesktopWarning(false);
    addRecent(game);
    setShowPlayer(true);
  };

  const handleShare = async () => {
    if (!game) return;
    try {
      await navigator.share({
        title: game.title,
        text: `Play ${game.title} on GameHub!`,
        url: window.location.href,
      });
    } catch {
      await navigator.clipboard?.writeText(window.location.href);
      toast("Link copied to clipboard!", "success");
    }
  };

  // Loading state
  if (loading && !game) {
    return (
      <div className="min-h-screen bg-dark-900 max-w-lg mx-auto">
        <div className="skeleton-shimmer h-56" />
        <div className="p-5 space-y-4">
          <div className="skeleton-shimmer h-7 w-3/4 rounded-lg" />
          <div className="skeleton-shimmer h-4 w-1/2 rounded-lg" />
          <div className="skeleton-shimmer h-12 w-full rounded-xl mt-4" />
          <div className="space-y-2 mt-6">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="skeleton-shimmer h-3 rounded-md"
                style={{ width: `${90 - i * 15}%` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-dark-900 max-w-lg mx-auto flex flex-col items-center justify-center p-8">
        <span className="text-5xl mb-4">😕</span>
        <h2 className="font-display text-lg font-bold text-white mb-2">
          Game Not Found
        </h2>
        <p className="text-dim text-sm mb-6">This game may have been removed</p>
        <button onClick={() => navigate("/")} className="btn-cyber text-sm">
          Go Home
        </button>
      </div>
    );
  }

  return (
    <>
      <SEO
        title={game.title}
        description={
          game.description ||
          `Play ${game.title} for free — no download required. ${game.category} game on GameHub.`
        }
        path={`/game/${encodeURIComponent(game.id)}`}
        image={game.thumbnail}
        type="game"
        jsonLd={buildGameJsonLd(game)}
      />
      <div className="min-h-screen bg-dark-900 max-w-lg mx-auto">
        {/* Hero Image */}
        <div className="relative h-64 overflow-hidden">
          {game.thumbnail && !imgFailed ? (
            <>
              <img
                src={game.thumbnail}
                alt={game.title}
                referrerPolicy="no-referrer"
                className={`w-full h-full object-cover transition-opacity duration-500 ${imgLoaded ? "opacity-100" : "opacity-0"}`}
                onLoad={() => setImgLoaded(true)}
                onError={() => setImgFailed(true)}
              />
              {!imgLoaded && (
                <div className="absolute inset-0 skeleton-shimmer" />
              )}
            </>
          ) : (
            <div className="w-full h-full bg-linear-to-br from-dark-600 to-dark-800 flex items-center justify-center text-6xl">
              {icon}
            </div>
          )}

          {/* Gradient overlays */}
          <div className="absolute inset-0 gradient-fade-b" />
          <div className="absolute top-0 left-0 right-0 h-16 gradient-fade-t" />

          {/* Top bar */}
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-3">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-dark-900/60 backdrop-blur-sm text-white/80 active:scale-90 transition-transform"
              aria-label="Go back"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex gap-2">
              <button
                onClick={() =>
                  saved ? removeOffline(game.id) : saveOffline(game)
                }
                className={`w-10 h-10 flex items-center justify-center rounded-xl backdrop-blur-sm active:scale-90 transition-all
                  ${saved ? "bg-neon-green/20 text-neon-green" : "bg-dark-900/60 text-white/70"}`}
                aria-label={saved ? "Remove offline copy" : "Save for offline"}
              >
                {saved ? <CheckCircle size={18} /> : <Download size={18} />}
              </button>
              <button
                onClick={() => toggleFavorite(game)}
                className={`w-10 h-10 flex items-center justify-center rounded-xl backdrop-blur-sm active:scale-90 transition-all
                  ${favd ? "bg-neon-pink/20 text-neon-pink" : "bg-dark-900/60 text-white/70"}`}
                aria-label={favd ? "Remove from favorites" : "Add to favorites"}
              >
                <Heart size={18} fill={favd ? "currentColor" : "none"} />
              </button>
              <button
                onClick={handleShare}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-dark-900/60 backdrop-blur-sm text-white/70 active:scale-90 transition-transform"
                aria-label="Share"
              >
                <Share2 size={18} />
              </button>
              <button
                onClick={() => setShowColPicker(true)}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-dark-900/60 backdrop-blur-sm text-white/70 active:scale-90 transition-transform"
                aria-label="Add to collection"
              >
                <FolderPlus size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="relative -mt-8 rounded-t-3xl bg-dark-900 px-5 pt-6 pb-8">
          {/* Category badge */}
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neon-cyan/10 border border-neon-cyan/20 text-neon-cyan text-[10px] font-display font-bold tracking-wider uppercase">
              {icon}{" "}
              {getCategoryMeta(game.category)?.label ||
                game.categoryRaw ||
                "Game"}
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neon-green/10 border border-neon-green/20 text-neon-green text-[10px] font-display font-bold tracking-wider uppercase">
              FREE
            </span>
          </div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-2xl font-black text-white leading-tight mb-2"
          >
            {game.title}
          </motion.h1>

          {/* Source badge */}
          <p className="text-[11px] text-dim mb-5">
            via{" "}
            {game.source === "gamemonetize"
              ? "GameMonetize"
              : game.source === "gamedistribution"
                ? "GameDistribution"
                : game.source === "htmlgames"
                  ? "HTMLGames"
                  : "GamePix"}
          </p>

          {/* Play Button */}
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onClick={handlePlay}
            className="w-full btn-play flex items-center justify-center gap-2 text-base py-4 mb-6"
          >
            <Play size={20} fill="currentColor" />
            PLAY NOW
          </motion.button>

          {/* Rating Thumbs */}
          {game &&
            (() => {
              const rating = getRating(game.id);
              return (
                <div className="flex items-center gap-3 mb-6">
                  <button
                    onClick={() => setRating(game.id, "up")}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border text-sm font-display font-bold tracking-wider transition-all active:scale-95
                    ${
                      rating === "up"
                        ? "bg-neon-green/15 border-neon-green/30 text-neon-green"
                        : "bg-dark-700/50 border-dark-500/20 text-dim hover:text-white/70"
                    }`}
                  >
                    <ThumbsUp
                      size={16}
                      fill={rating === "up" ? "currentColor" : "none"}
                    />
                    Like
                  </button>
                  <button
                    onClick={() => setRating(game.id, "down")}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border text-sm font-display font-bold tracking-wider transition-all active:scale-95
                    ${
                      rating === "down"
                        ? "bg-red-500/15 border-red-500/30 text-red-400"
                        : "bg-dark-700/50 border-dark-500/20 text-dim hover:text-white/70"
                    }`}
                  >
                    <ThumbsDown
                      size={16}
                      fill={rating === "down" ? "currentColor" : "none"}
                    />
                    Dislike
                  </button>
                </div>
              );
            })()}

          {/* Description */}
          {game.description && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-6"
            >
              <h2 className="font-display text-xs font-bold text-neon-cyan tracking-widest uppercase mb-3">
                About
              </h2>
              <p className="text-sm text-white/60 leading-relaxed">
                {game.description}
              </p>
            </motion.div>
          )}

          {/* Instructions */}
          {game.instructions && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25 }}
              className="mb-6"
            >
              <h2 className="font-display text-xs font-bold text-neon-cyan tracking-widest uppercase mb-3">
                How to Play
              </h2>
              <p className="text-sm text-white/60 leading-relaxed">
                {game.instructions}
              </p>
            </motion.div>
          )}

          {/* Info Grid */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-2 gap-2"
          >
            {[
              {
                icon: <Tag size={14} />,
                label: "Category",
                value:
                  getCategoryMeta(game.category)?.label ||
                  game.categoryRaw ||
                  "N/A",
              },
              {
                icon: <Monitor size={14} />,
                label: "Platform",
                value: "HTML5 / Mobile",
              },
              {
                icon: <Building2 size={14} />,
                label: "Source",
                value: game.source || "Web",
              },
              {
                icon: <Clock size={14} />,
                label: "Type",
                value: "Free to Play",
              },
            ].map((info) => (
              <div
                key={info.label}
                className="p-3 rounded-xl bg-dark-700/50 border border-dark-500/20"
              >
                <div className="flex items-center gap-1.5 text-neon-cyan/60 mb-1">
                  {info.icon}
                  <span className="text-[10px] font-display font-bold tracking-wider uppercase">
                    {info.label}
                  </span>
                </div>
                <p className="text-xs text-white/70 truncate">{info.value}</p>
              </div>
            ))}
          </motion.div>

          {/* Tags */}
          {game.tags && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
              className="mt-5"
            >
              <h2 className="font-display text-xs font-bold text-neon-cyan tracking-widest uppercase mb-3">
                Tags
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {game.tags
                  .split(",")
                  .map((tag) => tag.trim())
                  .filter(Boolean)
                  .slice(0, 8)
                  .map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-1 rounded-lg bg-dark-600/50 border border-dark-400/20 text-[11px] text-dim"
                    >
                      {tag}
                    </span>
                  ))}
              </div>
            </motion.div>
          )}

          {/* Related Games */}
          {related.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-8"
            >
              <h2 className="font-display text-xs font-bold text-neon-cyan tracking-widest uppercase mb-4">
                More Like This
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {related.map((g, i) => (
                  <GameCard key={g.id} game={g} index={i} />
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Game Player Modal */}
      <AnimatePresence>
        {showPlayer && (
          <GamePlayer game={game} onClose={() => setShowPlayer(false)} />
        )}
      </AnimatePresence>

      {/* Desktop-game warning — shown on small screens when game.mobile === false */}
      <AnimatePresence>
        {showDesktopWarning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] flex items-end justify-center bg-dark-950/80 backdrop-blur-sm p-4"
            onClick={() => setShowDesktopWarning(false)}
          >
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-dark-800 rounded-3xl border border-neon-orange/20 p-6"
            >
              <div className="flex items-start gap-3 mb-4">
                <span className="text-3xl flex-shrink-0">🖥️</span>
                <div>
                  <h3 className="font-display text-sm font-black text-white tracking-wider mb-1">
                    DESKTOP GAME
                  </h3>
                  <p className="text-xs text-dim leading-relaxed">
                    <span className="text-white/80 font-semibold">
                      {game?.title}
                    </span>{" "}
                    was designed for desktop screens. Controls may be too small
                    and the game may not respond correctly to touch on your
                    device.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  onClick={() => confirmPlayDesktop(false)}
                  className="w-full py-3 rounded-xl bg-neon-orange/15 border border-neon-orange/30
                             text-neon-orange font-display font-bold text-xs tracking-wider
                             active:scale-95 transition-all"
                >
                  Play Anyway
                </button>
                <button
                  onClick={() => confirmPlayDesktop(true)}
                  className="w-full py-3 rounded-xl bg-dark-700/50 border border-dark-500/30
                             text-dim font-display font-bold text-xs tracking-wider
                             active:scale-95 transition-all"
                >
                  Play Anyway &amp; Don't Show Again
                </button>
                <button
                  onClick={() => setShowDesktopWarning(false)}
                  className="w-full py-2.5 text-dim text-xs font-semibold active:scale-95"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add to Collection Sheet */}
      <AnimatePresence>
        {showColPicker && game && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm flex items-end justify-center"
            onClick={() => setShowColPicker(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-dark-800 rounded-t-3xl p-5 pb-10 border-t border-neon-cyan/10"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-sm font-bold text-white tracking-wider">
                  ADD TO COLLECTION
                </h3>
                <button
                  onClick={() => setShowColPicker(false)}
                  className="text-dim hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Existing collections */}
              <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
                {collections.length === 0 && (
                  <p className="text-xs text-dim text-center py-4">
                    No collections yet — create one below!
                  </p>
                )}
                {collections.map((col) => {
                  const inCol = isGameInCollection(col.id, game.id);
                  return (
                    <button
                      key={col.id}
                      onClick={() => {
                        if (!inCol) {
                          addGameToCollection(col.id, game);
                          toast(`Added to "${col.name}"`, "success");
                        }
                      }}
                      disabled={inCol}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left
                        ${
                          inCol
                            ? "bg-neon-green/10 border-neon-green/20 text-neon-green"
                            : "bg-dark-700/50 border-dark-500/20 hover:border-neon-cyan/30 text-white/80"
                        }`}
                    >
                      <span className="text-lg">{col.emoji}</span>
                      <span className="text-sm font-semibold flex-1 truncate">
                        {col.name}
                      </span>
                      <span className="text-[10px] text-dim">
                        {col.games.length} games
                      </span>
                      {inCol && <CheckCircle size={14} />}
                    </button>
                  );
                })}
              </div>

              {/* Create new collection */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newColName}
                  onChange={(e) => setNewColName(e.target.value)}
                  placeholder="New collection name..."
                  className="flex-1 bg-dark-700 border border-dark-500/50 focus:border-neon-cyan/40 rounded-xl px-4 py-2.5 text-sm text-white/90 placeholder:text-dim/50 outline-none"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newColName.trim()) {
                      const id = createCollection(newColName.trim());
                      addGameToCollection(id, game);
                      toast(
                        `Created "${newColName.trim()}" and added game`,
                        "success",
                      );
                      setNewColName("");
                    }
                  }}
                />
                <button
                  onClick={() => {
                    if (newColName.trim()) {
                      const id = createCollection(newColName.trim());
                      addGameToCollection(id, game);
                      toast(
                        `Created "${newColName.trim()}" and added game`,
                        "success",
                      );
                      setNewColName("");
                    }
                  }}
                  disabled={!newColName.trim()}
                  className="px-4 py-2.5 rounded-xl bg-neon-cyan/15 border border-neon-cyan/30 text-neon-cyan text-sm font-display font-bold disabled:opacity-30 transition-all active:scale-95"
                >
                  <Plus size={18} />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
