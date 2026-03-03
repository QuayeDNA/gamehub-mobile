import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, Shuffle, Download } from 'lucide-react';
import { useInfiniteGames, useIntersectionLoader } from '../hooks/useGames';
import { useFavorites, useRecentlyPlayed } from '../hooks/useFavorites';
import { CATEGORIES } from '../services/gameApi';
import { getAllCachedGames } from '../services/gameCache';
import { PageLayout, Header, SectionHeader, CategoryPills, SkeletonGrid, SkeletonRow, ErrorBanner } from '../components/Layout';
import { GameCard, HorizontalCard, FeaturedCarousel } from '../components/GameCards';
import useDocumentTitle from '../hooks/useDocumentTitle';
import usePWAInstall from '../hooks/usePWAInstall';

const QUICK_CATS = CATEGORIES.slice(0, 8);

export default function Home() {
  useDocumentTitle('');
  const [activeCategory, setActiveCategory] = useState('all');
  const { toggleFavorite, isFavorite } = useFavorites();
  const { recent } = useRecentlyPlayed();
  const navigate = useNavigate();
  const { canInstall, promptInstall } = usePWAInstall();

  const { games, loading, loadingMore, error, hasMore, loadMore, refetch } = useInfiniteGames({
    category: activeCategory,
  });

  const sentinelRef = useIntersectionLoader(loadMore, hasMore, loadingMore);

  const handleSurpriseMe = () => {
    // Pick from all cached games first, fall back to currently loaded games
    const pool = getAllCachedGames();
    const source = pool.length > 0 ? pool : games;
    if (source.length === 0) return;
    const pick = source[Math.floor(Math.random() * source.length)];
    navigate(`/game/${encodeURIComponent(pick.id)}`, { state: { game: pick } });
  };

  const featured = games.slice(0, 10); // 10 games for carousel hero
  const trending = games.slice(10, 18);
  const moreGames = games.slice(18);

  return (
    <PageLayout header={<Header />}>
      {/* Featured Carousel Hero */}
      {!loading && featured.length > 0 && <FeaturedCarousel games={featured} maxGames={8} />}
      {loading && (
        <div className="h-56 bg-gradient-to-br from-dark-600 to-dark-800 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-2 border-neon-cyan/30 border-t-neon-cyan rounded-full animate-spin" />
            <span className="font-display text-xs text-neon-cyan/60 tracking-widest animate-pulse">LOADING</span>
          </div>
        </div>
      )}

      {/* Category Pills */}
      <div className="pt-3">
        <CategoryPills categories={QUICK_CATS} active={activeCategory} onSelect={setActiveCategory} />
      </div>

      {/* Surprise Me */}
      {games.length > 0 && (
        <div className="px-4 pt-3">
          <button
            onClick={handleSurpriseMe}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl
                       bg-gradient-to-r from-neon-purple/15 to-neon-cyan/15
                       border border-neon-purple/20 hover:border-neon-cyan/30
                       text-white/80 text-sm font-display font-bold tracking-wider
                       active:scale-[0.97] transition-all"
          >
            <Shuffle size={16} className="text-neon-cyan" />
            SURPRISE ME
          </button>
        </div>
      )}

      {error && <ErrorBanner message={error} onRetry={refetch} />}

      {/* PWA Install Prompt */}
      {canInstall && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="px-4 pt-3">
          <button
            onClick={promptInstall}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl
                       bg-gradient-to-r from-neon-green/15 to-neon-cyan/15
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

      {/* Trending */}
      <SectionHeader title="Trending" icon="🔥" actionTo="/browse" actionLabel="See All" />
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
      <SectionHeader title="New Games" icon="🆕" actionTo="/browse" actionLabel="Browse All" />
      {loading ? (
        <SkeletonGrid count={6} />
      ) : (
        <div className="grid grid-cols-2 gap-3 px-4">
          {moreGames.map((game, i) => (
            <GameCard
              key={game.id}
              game={game}
              index={i}
              badge={i === 0 ? { label: 'NEW', type: 'new' } : i === 1 ? { label: 'HOT', type: 'hot' } : null}
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
              <span className="text-xs font-display tracking-wider">LOADING MORE...</span>
            </div>
          )}
        </div>
      )}

      {/* Browse by Genre */}
      <SectionHeader title="Browse by Genre" icon="🗂️" />
      <div className="grid grid-cols-3 gap-2 px-4 pb-4">
        {CATEGORIES.filter(c => c.slug !== 'all').map((cat, i) => (
          <motion.div key={cat.slug} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }}>
            <Link
              to={`/category/${cat.slug}`}
              className="flex flex-col items-center gap-1 py-4 px-2 rounded-xl bg-dark-700/50 border border-dark-500/20 
                         hover:border-neon-cyan/20 hover:bg-dark-600/50 transition-all active:scale-95 text-center"
            >
              <span className="text-2xl">{cat.icon}</span>
              <span className="text-[10px] font-display font-bold text-white/70 tracking-wider uppercase">
                {cat.label}
              </span>
            </Link>
          </motion.div>
        ))}
      </div>
    </PageLayout>
  );
}
