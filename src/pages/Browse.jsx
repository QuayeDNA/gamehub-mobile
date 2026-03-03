import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { CATEGORIES, SOURCES } from '../services/gameApi';
import { useInfiniteGames, useIntersectionLoader } from '../hooks/useGames';
import { useFavorites } from '../hooks/useFavorites';
import { PageLayout, Header, SectionHeader, SkeletonGrid, SortBar } from '../components/Layout';
import { GameCard } from '../components/GameCards';
import useDocumentTitle from '../hooks/useDocumentTitle';
import SEO from '../components/SEO';

function sortGames(games, sort) {
  if (sort === 'default') return games;
  return [...games].sort((a, b) => sort === 'a-z' ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title));
}

export default function Browse() {
  useDocumentTitle('Browse Games');
  const { games, loading, loadingMore, hasMore, loadMore } = useInfiniteGames({ category: 'all' });
  const { toggleFavorite, isFavorite } = useFavorites();
  const sentinelRef = useIntersectionLoader(loadMore, hasMore, loadingMore);
  const [sort, setSort] = useState('default');
  const sorted = useMemo(() => sortGames(games, sort), [games, sort]);

  return (
    <PageLayout header={<Header showBack title="Browse Games" />}>
      <SEO
        title="Browse Games"
        description="Browse all free HTML5 games by category. Action, puzzle, racing, sports, strategy & more — play instantly."
        path="/browse"
      />
      {/* Category Grid */}
      <SectionHeader title="Categories" icon="🗂️" />
      <div className="grid grid-cols-3 gap-2 px-4 pb-4">
        {CATEGORIES.filter(c => c.slug !== 'all').map((cat, i) => (
          <motion.div
            key={cat.slug}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.03 }}
          >
            <Link
              to={`/category/${cat.slug}`}
              className="flex flex-col items-center gap-1.5 py-5 px-2 rounded-2xl bg-dark-700/50 border border-dark-500/20 
                         hover:border-neon-cyan/20 hover:bg-dark-600/50 transition-all active:scale-95 text-center"
            >
              <span className="text-3xl">{cat.icon}</span>
              <span className="text-[10px] font-display font-bold text-white/70 tracking-wider uppercase">
                {cat.label}
              </span>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Browse by Source */}
      <SectionHeader title="Game Sources" icon="🌐" />
      <div className="grid grid-cols-2 gap-2 px-4 pb-4">
        {SOURCES.filter(s => s.slug !== 'all').map((src, i) => (
          <motion.div
            key={src.slug}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
          >
            <Link
              to={`/source/${src.slug}`}
              className="flex items-center gap-2 py-4 px-3 rounded-2xl bg-dark-700/50 border border-dark-500/20
                         hover:border-neon-cyan/20 hover:bg-dark-600/50 transition-all active:scale-95 min-w-0 overflow-hidden"
            >
              <span className="text-2xl flex-shrink-0">{src.icon}</span>
              <span className="text-[10px] font-display font-bold text-white/70 tracking-wider uppercase truncate">
                {src.label}
              </span>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* All Games – infinite scroll */}
      <SectionHeader title="All Games" icon="🎮" />
      <SortBar value={sort} onChange={setSort} />
      {loading ? (
        <SkeletonGrid count={6} />
      ) : (
        <div className="grid grid-cols-2 gap-3 px-4 pb-2">
          {sorted.map((game, i) => (
            <GameCard
              key={game.id}
              game={game}
              index={i}
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

      {!hasMore && games.length > 0 && (
        <p className="text-center text-xs text-dim py-6 font-display tracking-wider">
          — ALL {games.length} GAMES LOADED —
        </p>
      )}
    </PageLayout>
  );
}
