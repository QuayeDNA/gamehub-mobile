import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Heart, ChevronLeft, ChevronRight } from "lucide-react";
import { getCategoryMeta } from "../services/gameApi";
import { getCategoryIcon } from "../utils/helpers";

// ── Reusable image with fallback ─────────────────────────────────────────

function GameImage({ src, alt, className, fallbackIcon, fallbackClassName }) {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    return (
      <div
        className={
          fallbackClassName ||
          "w-full h-full flex items-center justify-center bg-linear-to-br from-dark-600 to-dark-800 text-4xl"
        }
      >
        {fallbackIcon || "🎮"}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      referrerPolicy="no-referrer"
      className={className}
      onError={() => setFailed(true)}
    />
  );
}

// ── Standard Game Card (Grid) ───────────────────────────────────────────

export function GameCard({ game, index = 0, badge, onFavorite, isFavorite }) {
  const icon = getCategoryIcon(game.category);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.05, 0.4), duration: 0.3 }}
    >
      <Link
        to={`/game/${encodeURIComponent(game.id)}`}
        state={{ game }}
        className="group block rounded-2xl overflow-hidden bg-dark-700 border border-dark-500/30
                   hover:border-neon-cyan/20 transition-all duration-300 active:scale-[0.97]"
      >
        <div className="relative aspect-16/10 overflow-hidden bg-dark-800">
          <GameImage
            src={game.thumbnail}
            alt={game.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            fallbackIcon={icon}
          />

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-linear-to-t from-dark-900/60 via-transparent to-transparent" />

          {/* Badge */}
          {badge && (
            <span
              className={`absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-display font-bold tracking-wider uppercase
              ${
                badge.type === "hot"
                  ? "bg-neon-orange/90 text-white"
                  : badge.type === "new"
                    ? "bg-neon-green/90 text-dark-900"
                    : "bg-neon-cyan/90 text-dark-900"
              }`}
            >
              {badge.label}
            </span>
          )}

          {/* Desktop-only badge — shown when game.mobile is explicitly false */}
          {game.mobile === false && (
            <span
              className="absolute bottom-2 left-2 flex items-center gap-1 px-1.5 py-0.5
                             rounded-md bg-dark-900/80 backdrop-blur-sm border border-white/10
                             text-[9px] font-display font-bold text-white/50 tracking-wider
                             pointer-events-none select-none"
            >
              🖥️ PC
            </span>
          )}

          {/* Play overlay on hover */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="w-12 h-12 rounded-full bg-neon-cyan/20 backdrop-blur-md flex items-center justify-center border border-neon-cyan/40">
              <Play
                size={20}
                className="text-neon-cyan ml-0.5"
                fill="currentColor"
              />
            </div>
          </div>

          {/* Favorite button */}
          {onFavorite && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onFavorite(game);
              }}
              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-dark-900/60 backdrop-blur-sm flex items-center justify-center
                         transition-all active:scale-90 z-10"
              aria-label={
                isFavorite ? "Remove from favorites" : "Add to favorites"
              }
            >
              <Heart
                size={14}
                className={
                  isFavorite ? "text-neon-pink fill-neon-pink" : "text-white/60"
                }
              />
            </button>
          )}
        </div>

        <div className="p-3">
          <h3 className="text-sm font-semibold text-white/90 truncate leading-tight">
            {game.title}
          </h3>
          <p className="text-[11px] text-dim mt-1 flex items-center gap-1">
            <span>{icon}</span>
            <span className="truncate">
              {getCategoryMeta(game.category)?.label ||
                game.categoryRaw ||
                "Game"}
            </span>
          </p>
        </div>
      </Link>
    </motion.div>
  );
}

// ── Horizontal Scroll Card ──────────────────────────────────────────────

export function HorizontalCard({ game, index = 0 }) {
  const icon = getCategoryIcon(game.category);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: Math.min(index * 0.06, 0.48), duration: 0.3 }}
      className="shrink-0 w-44"
    >
      <Link
        to={`/game/${encodeURIComponent(game.id)}`}
        state={{ game }}
        className="group block"
      >
        <div
          className="relative aspect-16/10 rounded-xl overflow-hidden bg-dark-700 border border-dark-500/20
                        group-hover:border-neon-cyan/20 transition-all duration-300 active:scale-[0.97]"
        >
          <GameImage
            src={game.thumbnail}
            alt={game.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            fallbackIcon={icon}
            fallbackClassName="w-full h-full flex items-center justify-center bg-linear-to-br from-dark-600 to-dark-800 text-3xl"
          />
          <div className="absolute inset-0 bg-linear-to-t from-dark-900/50 to-transparent" />

          {/* Play icon */}
          <div
            className="absolute bottom-2 right-2 w-7 h-7 rounded-full bg-neon-cyan/20 backdrop-blur-sm flex items-center justify-center
                          border border-neon-cyan/30 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Play
              size={12}
              className="text-neon-cyan ml-px"
              fill="currentColor"
            />
          </div>
        </div>
        <h3 className="text-xs font-semibold text-white/80 mt-2 truncate px-1">
          {game.title}
        </h3>
        <p className="text-[10px] text-dim truncate px-1">
          {getCategoryMeta(game.category)?.label || game.categoryRaw || ""}
        </p>
      </Link>
    </motion.div>
  );
}

// ── Featured Carousel (auto-rotating with swipe) ────────────────────────

const AUTO_PLAY_MS = 8000; // 8 seconds per slide

export function FeaturedCarousel({ games = [], maxGames = 8 }) {
  const carouselGames = games.slice(0, maxGames);
  if (carouselGames.length === 0) return null;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);
  const [progress, setProgress] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = back
  const autoPlayRef = useRef(null);
  const progressRef = useRef(null);

  // Auto-play with progress bar
  useEffect(() => {
    if (!autoPlay || carouselGames.length <= 1) return;

    setProgress(0);
    const startTime = Date.now();

    progressRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      setProgress(Math.min(elapsed / AUTO_PLAY_MS, 1));
    }, 50);

    autoPlayRef.current = setTimeout(() => {
      setDirection(1);
      setCurrentIndex((i) => (i + 1) % carouselGames.length);
    }, AUTO_PLAY_MS);

    return () => {
      clearTimeout(autoPlayRef.current);
      clearInterval(progressRef.current);
    };
  }, [autoPlay, currentIndex, carouselGames.length]);

  const goToSlide = (index) => {
    setDirection(index > currentIndex ? 1 : -1);
    setAutoPlay(false);
    setProgress(0);
    setTimeout(() => setAutoPlay(true), 12000);
    setCurrentIndex(index);
  };

  const goNext = () => {
    setDirection(1);
    goToSlide((currentIndex + 1) % carouselGames.length);
  };

  const goPrev = () => {
    setDirection(-1);
    goToSlide((currentIndex - 1 + carouselGames.length) % carouselGames.length);
  };

  const handleTouchStart = (e) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e) => {
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;
    if (Math.abs(diff) > 50) {
      diff > 0 ? goNext() : goPrev();
    }
  };

  const game = carouselGames[currentIndex];
  const nextGame = carouselGames[(currentIndex + 1) % carouselGames.length];
  const icon = getCategoryIcon(game.category);

  const slideVariants = {
    enter: (d) => ({ opacity: 0, scale: 1.08, x: d > 0 ? 60 : -60 }),
    center: { opacity: 1, scale: 1, x: 0 },
    exit: (d) => ({ opacity: 0, scale: 0.95, x: d > 0 ? -60 : 60 }),
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="relative h-72 overflow-hidden cursor-grab active:cursor-grabbing select-none"
    >
      {/* Background image with ken-burns effect */}
      <AnimatePresence initial={false} custom={direction} mode="popLayout">
        <motion.div
          key={currentIndex}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="absolute inset-0"
        >
          <GameImage
            src={game.thumbnail}
            alt={game.title}
            className="w-full h-full object-cover"
            fallbackIcon={icon}
            fallbackClassName="w-full h-full bg-linear-to-br from-dark-600 to-dark-800 flex items-center justify-center text-6xl"
          />
        </motion.div>
      </AnimatePresence>

      {/* Multi-layer gradient overlay */}
      <div className="absolute inset-0 bg-linear-to-t from-dark-900 via-dark-900/50 to-dark-900/20" />
      <div className="absolute inset-0 bg-linear-to-r from-dark-900/60 via-transparent to-dark-900/40" />
      <div className="absolute top-0 inset-x-0 h-20 bg-linear-to-b from-dark-900/50 to-transparent" />

      {/* Neon accent line at top */}
      <div className="absolute top-0 inset-x-0 h-0.5 bg-linear-to-r from-transparent via-neon-cyan/40 to-transparent" />

      {/* Content card — glassmorphism */}
      <Link
        to={`/game/${encodeURIComponent(game.id)}`}
        state={{ game }}
        className="absolute bottom-12 left-3 right-3 z-10 block"
      >
        <motion.div
          key={`card-${currentIndex}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="rounded-2xl overflow-hidden"
          style={{
            background: "rgba(10, 10, 15, 0.65)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            border: "1px solid rgba(0, 245, 255, 0.12)",
          }}
        >
          <div className="flex items-center gap-3 p-3">
            {/* Mini thumbnail */}
            <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-white/10">
              <GameImage
                src={game.thumbnail}
                alt={game.title}
                className="w-full h-full object-cover"
                fallbackIcon={icon}
                fallbackClassName="w-full h-full flex items-center justify-center bg-dark-700 text-2xl"
              />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="px-1.5 py-0.5 rounded bg-neon-cyan/15 border border-neon-cyan/30 text-neon-cyan text-[9px] font-display font-bold tracking-widest uppercase">
                  Featured
                </span>
                <span className="text-[10px] text-white/40 flex items-center gap-1">
                  {icon} {getCategoryMeta(game.category)?.label || "Game"}
                </span>
              </div>
              <h2 className="font-display text-sm font-black text-white leading-tight truncate">
                {game.title}
              </h2>
              <p className="text-[11px] text-white/50 line-clamp-1 mt-0.5">
                {game.description || "Play this amazing game now!"}
              </p>
            </div>

            {/* Play button */}
            <div
              className="shrink-0 w-11 h-11 rounded-xl flex items-center justify-center"
              style={{
                background:
                  "linear-gradient(135deg, rgba(0,245,255,0.25), rgba(191,0,255,0.25))",
                border: "1px solid rgba(0,245,255,0.35)",
                boxShadow: "0 0 20px rgba(0,245,255,0.15)",
              }}
            >
              <Play
                size={18}
                className="text-neon-cyan ml-0.5"
                fill="currentColor"
              />
            </div>
          </div>
        </motion.div>
      </Link>

      {/* Up Next preview */}
      {carouselGames.length > 1 && nextGame && (
        <motion.div
          key={`next-${currentIndex}`}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="absolute top-3 right-3 z-10"
        >
          <button
            onClick={goNext}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-white/50 hover:text-white/70 transition-colors"
            style={{
              background: "rgba(10,10,15,0.5)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <span className="text-[9px] font-display tracking-wider uppercase">
              Up Next
            </span>
            <ChevronRight size={12} />
          </button>
        </motion.div>
      )}

      {/* Slide counter */}
      <div className="absolute top-3 left-3 z-10">
        <div
          className="px-2 py-1 rounded-lg text-[10px] font-display font-bold text-white/50 tracking-wider"
          style={{
            background: "rgba(10,10,15,0.5)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
          }}
        >
          {currentIndex + 1} / {carouselGames.length}
        </div>
      </div>

      {/* Progress bar + dot indicators */}
      <div className="absolute bottom-3 inset-x-3 z-10 flex items-center gap-2">
        {/* Dot indicators */}
        <div className="flex gap-1">
          {carouselGames.map((_, i) => (
            <button
              key={i}
              onClick={() => goToSlide(i)}
              className={`rounded-full transition-all duration-300 ${
                i === currentIndex
                  ? "bg-neon-cyan w-2 h-2 shadow-[0_0_6px_rgba(0,245,255,0.5)]"
                  : "bg-white/20 w-1.5 h-1.5 hover:bg-white/40"
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>

        {/* Progress bar */}
        <div className="flex-1 h-0.5 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{
              width: `${progress * 100}%`,
              background: "linear-gradient(90deg, #00f5ff, #bf00ff)",
            }}
          />
        </div>
      </div>
    </div>
  );
}

// ── Featured / Hero Card ────────────────────────────────────────────────

export function FeaturedCard({ game, index = 0 }) {
  const icon = getCategoryIcon(game.category);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
    >
      <Link
        to={`/game/${encodeURIComponent(game.id)}`}
        state={{ game }}
        className="group block mx-4 mb-3 rounded-2xl overflow-hidden bg-dark-700 neon-border
                   hover:neon-border-active transition-all duration-300 active:scale-[0.98]"
      >
        <div className="flex items-center gap-3 p-3">
          {/* Thumbnail */}
          <div className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-dark-800">
            <GameImage
              src={game.thumbnail}
              alt={game.title}
              className="w-full h-full object-cover"
              fallbackIcon={icon}
              fallbackClassName="w-full h-full flex items-center justify-center text-3xl"
            />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-white/90 truncate">
              {game.title}
            </h3>
            <p className="text-xs text-dim mt-1 line-clamp-2 leading-relaxed">
              {game.description || "Play this exciting game now!"}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[10px] text-dim flex items-center gap-1">
                <span>{icon}</span>{" "}
                {getCategoryMeta(game.category)?.label ||
                  game.categoryRaw ||
                  ""}
              </span>
            </div>
          </div>

          {/* Play button */}
          <div
            className="shrink-0 w-10 h-10 rounded-xl bg-linear-to-br from-neon-cyan/20 to-neon-purple/20
                                      border border-neon-cyan/20 flex items-center justify-center
                                      group-hover:from-neon-cyan/30 group-hover:to-neon-purple/30 transition-all"
          >
            <Play
              size={16}
              className="text-neon-cyan ml-0.5"
              fill="currentColor"
            />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// ── Hero Banner ─────────────────────────────────────────────────────────

export function HeroBanner({ game }) {
  if (!game) return null;
  const icon = getCategoryIcon(game.category);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Link
        to={`/game/${encodeURIComponent(game.id)}`}
        state={{ game }}
        className="block relative h-56 overflow-hidden group"
      >
        <GameImage
          src={game.thumbnail}
          alt={game.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          fallbackIcon={icon}
          fallbackClassName="w-full h-full bg-linear-to-br from-dark-600 to-dark-800 flex items-center justify-center text-6xl"
        />

        {/* Gradient overlays */}
        <div className="absolute inset-0 gradient-fade-b" />
        <div className="absolute top-0 left-0 right-0 h-20 gradient-fade-t" />

        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="inline-block px-2.5 py-1 rounded-md bg-neon-cyan text-dark-900 font-display text-[10px] font-bold tracking-widest uppercase mb-2">
            🔥 Featured
          </div>
          <h2 className="font-display text-xl font-black text-white leading-tight mb-1">
            {game.title}
          </h2>
          <p className="text-xs text-white/60 line-clamp-1 max-w-[80%]">
            {game.description}
          </p>
          <div className="mt-3 inline-flex items-center gap-2 btn-play text-xs py-2 px-5">
            <Play size={14} fill="currentColor" />
            PLAY NOW
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
