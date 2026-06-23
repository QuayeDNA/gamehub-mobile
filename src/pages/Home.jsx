import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, Shuffle, Download } from "lucide-react";
import { fetchGames } from "../services/gameApi";
import { useInfiniteGames, useIntersectionLoader } from "../hooks/useGames";
import { useFavorites, useRecentlyPlayed } from "../hooks/useFavorites";
import { CATEGORIES } from "../services/gameApi";
import { getAllCachedGames } from "../services/gameCache";
import {
  PageLayout,
  Header,
  SectionHeader,
  CategoryPills,
  SkeletonGrid,
  SkeletonRow,
  ErrorBanner,
} from "../components/Layout";
import {
  GameCard,
  HorizontalCard,
  FeaturedCarousel,
} from "../components/GameCards";
import useDocumentTitle from "../hooks/useDocumentTitle";
import usePWAInstall from "../hooks/usePWAInstall";
import SEO from "../components/SEO";

const QUICK_CATS = CATEGORIES.slice(0, 8);

export default function Home() {
  useDocumentTitle("");
  const [activeCategory, setActiveCategory] = useState("all");
  const { toggleFavorite, isFavorite } = useFavorites();
  const { recent } = useRecentlyPlayed();
  const navigate = useNavigate();
  const { canInstall, promptInstall } = usePWAInstall();

  const { games, loading, loadingMore, error, hasMore, loadMore, refetch } =
    useInfiniteGames({
      category: activeCategory,
    });

  const sentinelRef = useIntersectionLoader(loadMore, hasMore, loadingMore);

  // Lock featured/trending slices from the first batch so the carousel
  // and featured row never shift when loadMore appends new games.
  const [lockedFeatured, setLockedFeatured] = useState(null);
  const [lockedTrending, setLockedTrending] = useState(null);
  useEffect(() => {
    if (games.length >= 18) {
      setLockedFeatured((prev) => prev || games.slice(0, 10));
      setLockedTrending((prev) => prev || games.slice(10, 18));
    }
  }, [games]);

  const featured = lockedFeatured || games.slice(0, 10);
  const trending = lockedTrending || games.slice(10, 18);
  const moreGames = games.slice(18);

  const [surpriseLoading, setSurpriseLoading] = useState(false);

  const handleSurpriseMe = async () => {
    setSurpriseLoading(true);
    // Use in-memory cache first; if empty (first visit) do a quick fetch
    let pool = getAllCachedGames();
    if (pool.length === 0) {
      try {
        const fresh = await fetchGames({ category: "all", page: 1, limit: 40 });
        pool = fresh;
      } catch {
        /* fall through — button will do nothing gracefully */
      }
    }
    setSurpriseLoading(false);
    if (pool.length === 0) return;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    navigate(`/game/${encodeURIComponent(pick.id)}`, { state: { game: pick } });
  };

  return (
    <PageLayout header={<Header />}>
      {/* Featured Carousel Hero */}
      {!loading && featured.length > 0 && (
        <FeaturedCarousel games={featured} maxGames={8} />
      )}
      {loading && (
        <div className="h-56 bg-linear-to-br from-dark-600 to-dark-800 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-2 border-neon-cyan/30 border-t-neon-cyan rounded-full animate-spin" />
            <span className="font-display text-xs text-neon-cyan/60 tracking-widest animate-pulse">
              LOADING
            </span>
          </div>
        </div>
      )}

      {/* Category Pills */}
      <div className="pt-3">
        <CategoryPills
          categories={QUICK_CATS}
          active={activeCategory}
          onSelect={setActiveCategory}
        />
      </div>

      {/* Surprise Me — always visible; fetches if cache is empty */}
      <div className="px-4 pt-3">
        <button
          onClick={handleSurpriseMe}
          disabled={surpriseLoading}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl
                     bg-linear-to-r from-neon-purple/15 to-neon-cyan/15
                     border border-neon-purple/20 hover:border-neon-cyan/30
                     text-white/80 text-sm font-display font-bold tracking-wider
                     active:scale-[0.97] transition-all disabled:opacity-60"
        >
          {surpriseLoading ? (
            <Loader2 size={16} className="text-neon-cyan animate-spin" />
          ) : (
            <Shuffle size={16} className="text-neon-cyan" />
          )}
          {surpriseLoading ? "FINDING A GAME..." : "SURPRISE ME"}
        </button>
      </div>

      {error && <ErrorBanner message={error} onRetry={refetch} />}

      {/* PWA Install Prompt */}
      {canInstall && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-4 pt-3"
        >
          <button
            onClick={promptInstall}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl
                       bg-linear-to-r from-neon-green/15 to-neon-cyan/15
                       border border-neon-green/20 hover:border-neon-green/40
                       text-white/80 text-sm font-display font-bold tracking-wider
                       active:scale-[0.97] transition-all"
          >
            <Download size={16} className="text-neon-green" />
            INSTALL APP
          </button>
        </motion.div>
      )}

      {/* Recently Played */}
      {recent.length > 0 && (
        <>
          <SectionHeader title="Continue Playing" icon="🕹️" />
          <div className="flex gap-3 px-4 overflow-x-auto no-scrollbar pb-1">
            {recent.slice(0, 6).map((game, i) => (
              <HorizontalCard key={game.id} game={game} index={i} />
            ))}
          </div>
        </>
      )}

      {/* Featured — positional slice, not real trending data */}
      <SectionHeader
        title="Featured"
        icon="🔥"
        actionTo="/browse"
        actionLabel="See All"
      />
      {loading ? (
        <SkeletonRow count={4} />
      ) : (
        <div className="flex gap-3 px-4 overflow-x-auto no-scrollbar pb-1">
          {trending.map((game, i) => (
            <HorizontalCard key={game.id} game={game} index={i} />
          ))}
        </div>
      )}

      {/* All Games Grid – infinite scroll */}
      <SectionHeader
        title="More Games"
        icon="🎮"
        actionTo="/browse"
        actionLabel="Browse All"
      />
      {loading ? (
        <SkeletonGrid count={6} />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 px-4">
          {moreGames.map((game, i) => (
            <GameCard
              key={game.id}
              game={game}
              index={i}
              badge={
                i === 0
                  ? { label: "NEW", type: "new" }
                  : i === 1
                    ? { label: "HOT", type: "hot" }
                    : null
              }
              onFavorite={toggleFavorite}
              isFavorite={isFavorite(game.id)}
            />
          ))}
        </div>
      )}

      {/* Infinite scroll sentinel */}
      {hasMore && !loading && (
        <div ref={sentinelRef} className="flex justify-center py-8">
          {loadingMore && (
            <div className="flex items-center gap-2 text-neon-cyan/60">
              <Loader2 size={18} className="animate-spin" />
              <span className="text-xs font-display tracking-wider">
                LOADING MORE...
              </span>
            </div>
          )}
        </div>
      )}

      {/* Genre grid removed — Browse page has the full category grid */}
    </PageLayout>
  );
}
