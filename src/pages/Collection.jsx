import React from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Trash2 } from "lucide-react";
import { useCollections } from "../hooks/useCollections";
import { useFavorites } from "../hooks/useFavorites";
import { PageLayout, Header, EmptyState } from "../components/Layout";
import { GameCard } from "../components/GameCards";
import useDocumentTitle from "../hooks/useDocumentTitle";
import SEO from "../components/SEO";

export default function Collection() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getCollection, removeGameFromCollection, deleteCollection } =
    useCollections();
  const { toggleFavorite, isFavorite } = useFavorites();

  const col = getCollection(id);
  useDocumentTitle(col?.name || "Collection");

  if (!col) {
    return (
      <PageLayout header={<Header showBack title="Collection" />}>
        <EmptyState
          icon="📁"
          title="Collection Not Found"
          message="This collection doesn't exist or was deleted."
          action={
            <Link to="/favorites" className="btn-cyber text-xs mt-4">
              Back to Favorites
            </Link>
          }
        />
      </PageLayout>
    );
  }

  const handleDelete = () => {
    deleteCollection(id);
    navigate("/favorites", { replace: true });
  };

  return (
    <PageLayout
      header={
        <Header
          showBack
          title={`${col.emoji} ${col.name}`}
          rightAction={
            <button
              onClick={handleDelete}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-dark-600/50 text-dim hover:text-red-400 transition-colors"
              aria-label="Delete collection"
              title="Delete collection"
            >
              <Trash2 size={16} />
            </button>
          }
        />
      }
    >
      <SEO
        title={col.name}
        description={`${col.emoji} ${col.name} — a custom collection of ${col.games.length} game${col.games.length !== 1 ? "s" : ""} on GameHub.`}
        path={`/collection/${id}`}
        noindex={true}
      />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="px-5 py-6 bg-linear-to-br from-dark-600/50 to-dark-900 border-b border-neon-cyan/5"
      >
        <div className="text-5xl mb-3">{col.emoji}</div>
        <h1 className="font-display text-2xl font-black text-white mb-1">
          {col.name}
        </h1>
        <p className="text-sm text-dim">
          {col.games.length} game{col.games.length !== 1 ? "s" : ""}
        </p>
      </motion.div>

      {col.games.length === 0 ? (
        <EmptyState
          icon="🎮"
          title="Empty Collection"
          message="Add games from any game detail page"
          action={
            <Link to="/" className="btn-cyber text-xs mt-4">
              Discover Games
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 px-4 py-4">
          {col.games.map((game, i) => (
            <div key={game.id} className="relative">
              <GameCard
                game={game}
                index={i}
                onFavorite={toggleFavorite}
                isFavorite={isFavorite(game.id)}
              />
              <button
                onClick={() => removeGameFromCollection(id, game.id)}
                className="absolute top-2 left-2 w-7 h-7 flex items-center justify-center rounded-lg bg-dark-900/70 text-dim hover:text-neon-orange transition-colors z-10"
                title="Remove from collection"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </PageLayout>
  );
}
