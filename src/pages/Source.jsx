import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useInfiniteGames, useIntersectionLoader } from '../hooks/useGames';
import { useFavorites } from '../hooks/useFavorites';
import { getSourceMeta, SOURCES } from '../services/gameApi';
import { PageLayout, Header, SkeletonGrid, EmptyState, ErrorBanner, SortBar } from '../components/Layout';
import { GameCard } from '../components/GameCards';
import useDocumentTitle from '../hooks/useDocumentTitle';
import SEO, { buildBreadcrumbJsonLd } from '../components/SEO';

/* Source‑specific accent colours for the hero section */
const SOURCE_COLORS = {
  gm: 'from-yellow-500/20 to-dark-900 border-yellow-400/15',
  gd: 'from-blue-500/20 to-dark-900 border-blue-400/15',
  gp: 'from-purple-500/20 to-dark-900 border-purple-400/15',
  hg: 'from-green-500/20 to-dark-900 border-green-400/15',
};

export default function Source() {
  const { slug } = useParams();
  const srcInfo = getSourceMeta(slug);
  useDocumentTitle(srcInfo.label);
  const { games, loading, loadingMore, error, hasMore, loadMore, refetch } = useInfiniteGames({ source: slug });
  const { toggleFavorite, isFavorite } = useFavorites();
  const sentinelRef = useIntersectionLoader(loadMore, hasMore, loadingMore);
  const [sort, setSort] = useState('default');
  const sorted = useMemo(() => {
    if (sort === 'default') return games;
    return [...games].sort((a, b) => sort === 'a-z' ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title));
  }, [games, sort]);

  const accentClass = SOURCE_COLORS[srcInfo.key] || 'from-neon-cyan/10 to-dark-900 border-neon-cyan/10';

  return (
    <PageLayout
      header={<Header showBack title={`${srcInfo.icon} ${srcInfo.label}`} />}
    >
      <SEO
        title={`${srcInfo.label} Games`}
        description={`Play free HTML5 games from ${srcInfo.label}. Browse the full ${srcInfo.label} catalogue on GameHub.`}
        path={`/source/${slug}`}
        jsonLd={buildBreadcrumbJsonLd([
          { name: 'Home', url: '/' },
          { name: srcInfo.label, url: `/source/${slug}` },
        ])}
      />
      {/* Source Hero */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`px-5 py-8 bg-gradient-to-br ${accentClass} border-b`}
      >
        <div className="text-5xl mb-3">{srcInfo.icon}</div>
        <h1 className="font-display text-2xl font-black text-white mb-1">{srcInfo.label}</h1>
        <p className="text-sm text-dim">
          {loading ? 'Loading games...' : `${games.length} games loaded`}
        </p>
      </motion.div>

      {error && <ErrorBanner message={error} onRetry={refetch} />}

      {/* Games Grid */}
      <SortBar value={sort} onChange={setSort} />
      <div className="py-4">
        {loading ? (
          <SkeletonGrid count={8} />
        ) : games.length === 0 ? (
          <EmptyState
            icon="🕹️"
            title="No Games Found"
            message="This source may be temporarily unavailable"
            action={
              <Link to="/browse" className="btn-cyber text-xs mt-4">Browse All</Link>
            }
          />
        ) : (
          <div className="grid grid-cols-2 gap-3 px-4">
            {sorted.map((game, i) => (
              <GameCard
                key={game.id}
                game={game}
                index={i}
                badge={i < 3 ? { label: `#${i + 1}`, type: i === 0 ? 'hot' : '' } : null}
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
      </div>
    </PageLayout>
  );
}
