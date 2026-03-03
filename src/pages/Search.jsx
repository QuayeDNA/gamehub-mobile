import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search as SearchIcon, X, SlidersHorizontal } from 'lucide-react';
import { useSearch } from '../hooks/useGames';
import { useFavorites } from '../hooks/useFavorites';
import { CATEGORIES, SOURCES } from '../services/gameApi';
import { PageLayout, Header, CategoryPills, SkeletonGrid, EmptyState } from '../components/Layout';
import { GameCard } from '../components/GameCards';
import useDocumentTitle from '../hooks/useDocumentTitle';

export default function Search() {
  useDocumentTitle('Search');
  const [query, setQuery] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [srcFilter, setSrcFilter] = useState('all');
  const { toggleFavorite, isFavorite } = useFavorites();

  const { results: rawResults, loading } = useSearch(query, catFilter);

  // Client-side source filter
  const results = srcFilter === 'all'
    ? rawResults
    : rawResults.filter(g => g.source === srcFilter);

  // Source filter pills (reformat SOURCES for pill display)
  const sourcePills = SOURCES.filter(s => s.slug !== 'all').map(s => ({
    slug: s.slug,
    icon: s.icon,
    label: s.label,
  }));

  return (
    <PageLayout header={<Header showBack title="Search" showSearch={false} />}>
      {/* Search Input */}
      <div className="px-4 pt-4 pb-2">
        <div className="relative">
          <SearchIcon
            size={18}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dim pointer-events-none"
          />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search games, genres, tags..."
            autoFocus
            className="w-full bg-dark-700 border border-dark-500/50 focus:border-neon-cyan/40 rounded-xl 
                       pl-10 pr-10 py-3 text-sm text-white/90 placeholder:text-dim/50 font-body
                       outline-none transition-all duration-200"
            aria-label="Search games"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-dark-500/50 text-dim hover:text-white transition-colors"
              aria-label="Clear search"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Category Filter */}
      <CategoryPills categories={CATEGORIES.slice(0, 8)} active={catFilter} onSelect={setCatFilter} />

      {/* Source Filter */}
      <div className="flex gap-2 px-4 pb-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setSrcFilter('all')}
          className={`flex-shrink-0 text-[10px] font-display font-bold tracking-wider px-3 py-1.5 rounded-lg transition-all
            ${srcFilter === 'all'
              ? 'bg-neon-purple/15 text-neon-purple border border-neon-purple/30'
              : 'bg-dark-700/40 text-dim border border-dark-500/20 hover:text-white/70'}`}
        >
          All Sources
        </button>
        {sourcePills.map(s => (
          <button
            key={s.slug}
            onClick={() => setSrcFilter(s.slug)}
            className={`flex-shrink-0 text-[10px] font-display font-bold tracking-wider px-3 py-1.5 rounded-lg transition-all
              ${srcFilter === s.slug
                ? 'bg-neon-purple/15 text-neon-purple border border-neon-purple/30'
                : 'bg-dark-700/40 text-dim border border-dark-500/20 hover:text-white/70'}`}
          >
            {s.icon} {s.label}
          </button>
        ))}
      </div>

      {/* Results */}
      <div className="py-4">
        {loading ? (
          <SkeletonGrid count={6} />
        ) : query.length < 2 ? (
          <EmptyState
            icon="🔍"
            title="Search Games"
            message="Type at least 2 characters to search across thousands of playable HTML5 games"
          />
        ) : results.length === 0 ? (
          <EmptyState
            icon="🕵️"
            title="No Results"
            message={`No games found for "${query}". Try different keywords.`}
          />
        ) : (
          <>
            <div className="px-4 pb-3 text-xs text-dim font-semibold">
              {results.length} result{results.length !== 1 ? 's' : ''} for "{query}"
            </div>
            <div className="grid grid-cols-2 gap-3 px-4">
              {results.slice(0, 50).map((game, i) => (
                <GameCard
                  key={game.id}
                  game={game}
                  index={i}
                  onFavorite={toggleFavorite}
                  isFavorite={isFavorite(game.id)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </PageLayout>
  );
}
