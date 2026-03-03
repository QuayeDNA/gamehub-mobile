import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trash2, WifiOff, Download, FolderOpen, ChevronRight } from 'lucide-react';
import { useFavorites, useRecentlyPlayed } from '../hooks/useFavorites';
import { useOfflineGames } from '../hooks/useOfflineGames';
import { useCollections } from '../hooks/useCollections';
import { PageLayout, Header, SectionHeader, EmptyState } from '../components/Layout';
import { GameCard, FeaturedCard } from '../components/GameCards';
import useDocumentTitle from '../hooks/useDocumentTitle';
import SEO from '../components/SEO';

export default function Favorites() {
  useDocumentTitle('Favorites');
  const { favorites, toggleFavorite, isFavorite } = useFavorites();
  const { recent, clearRecent } = useRecentlyPlayed();
  const { offlineGames, removeOffline, clearOffline } = useOfflineGames();
  const { collections } = useCollections();

  return (
    <PageLayout
      header={
        <Header
          showBack
          title="Favorites"
          rightAction={
            recent.length > 0 ? (
              <button
                onClick={clearRecent}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-dark-600/50 text-dim hover:text-red-400 transition-colors"
                aria-label="Clear history"
                title="Clear recent history"
              >
                <Trash2 size={16} />
              </button>
            ) : null
          }
        />
      }
    >
      <SEO
        title="Favorites"
        description="Your favorite games, collections, and recently played titles — all in one place."
        path="/favorites"
        noindex={true}
      />
      {/* Favorites Section */}
      <SectionHeader title="My Favorites" icon="❤️" />
      {favorites.length === 0 ? (
        <EmptyState
          icon="💜"
          title="No Favorites Yet"
          message="Tap the heart icon on any game to save it here"
          action={
            <Link to="/" className="btn-cyber text-xs mt-4">
              Discover Games
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 px-4">
          {favorites.map((game, i) => (
            <GameCard
              key={game.id}
              game={game}
              index={i}
              onFavorite={toggleFavorite}
              isFavorite={true}
            />
          ))}
        </div>
      )}

      {/* Collections */}
      {collections.length > 0 && (
        <>
          <SectionHeader title="My Collections" icon="📁" />
          <div className="px-4 pb-4 space-y-2">
            {collections.map((col, i) => (
              <motion.div
                key={col.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Link
                  to={`/collection/${col.id}`}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-dark-700/50 border border-dark-500/20 hover:border-neon-cyan/20 transition-all"
                >
                  <span className="text-2xl">{col.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{col.name}</p>
                    <p className="text-[10px] text-dim">{col.games.length} game{col.games.length !== 1 ? 's' : ''}</p>
                  </div>
                  <ChevronRight size={14} className="text-dim" />
                </Link>
              </motion.div>
            ))}
          </div>
        </>
      )}

      {/* Recently Played */}
      {recent.length > 0 && (
        <>
          <SectionHeader title="Recently Played" icon="🕘" />
          <div className="space-y-0">
            {recent.map((game, i) => (
              <FeaturedCard key={game.id} game={game} index={i} />
            ))}
          </div>
        </>
      )}

      {/* Offline / Saved Games */}
      {offlineGames.length > 0 && (
        <>
          <SectionHeader title="Available Offline" icon="📥" />
          <div className="px-4 pb-1">
            <p className="text-[11px] text-dim mb-3 flex items-center gap-1">
              <WifiOff size={12} /> These games are cached and can be played without internet
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 px-4 pb-2">
            {offlineGames.map((game, i) => (
              <div key={game.id} className="relative">
                <GameCard game={game} index={i} />
                <button
                  onClick={() => removeOffline(game.id)}
                  className="absolute top-2 left-2 w-7 h-7 flex items-center justify-center rounded-lg bg-dark-900/70 text-dim hover:text-neon-orange transition-colors z-10"
                  title="Remove offline copy"
                >
                  <Trash2 size={12} />
                </button>
                <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-neon-green/20 border border-neon-green/30 z-10">
                  <span className="text-[9px] font-display font-bold text-neon-green tracking-wider">OFFLINE</span>
                </div>
              </div>
            ))}
          </div>
          <div className="px-4 pb-4">
            <button
              onClick={clearOffline}
              className="text-xs text-dim hover:text-neon-orange transition-colors"
            >
              Clear all offline games
            </button>
          </div>
        </>
      )}
    </PageLayout>
  );
}
