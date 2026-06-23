import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trash2,
  TrendingUp,
  Clock,
  Heart,
  Zap,
  Palette,
  X,
  Check,
  ChevronRight,
  Shield,
  Sun,
  Moon,
  Share2,
  ShieldCheck,
  ShieldAlert,
  ShieldOff,
  ToggleLeft,
  ToggleRight,
  Smartphone,
} from "lucide-react";
import { usePlayerStats } from "../hooks/usePlayerStats";
import { useFavorites } from "../hooks/useFavorites";
import { PageLayout, Header, SectionHeader } from "../components/Layout";
import useDocumentTitle from "../hooks/useDocumentTitle";
import { useTheme } from "../hooks/useTheme";
import { useToast } from "../components/Toast";
import { useSourcePrefs } from "../hooks/useSourcePrefs";
import { SOURCES } from "../services/gameApi";
import SEO from "../components/SEO";

// ── DiceBear Avatar Configuration ──────────────────────────────────────
// Free API — generates unique SVG avatars from a seed string.

const AVATAR_STYLES = [
  { id: "adventurer", label: "Adventurer" },
  { id: "adventurer-neutral", label: "Neutral" },
  { id: "avataaars", label: "Avataaars" },
  { id: "big-ears", label: "Big Ears" },
  { id: "big-ears-neutral", label: "Big Ears Alt" },
  { id: "bottts", label: "Robots" },
  { id: "croodles", label: "Croodles" },
  { id: "croodles-neutral", label: "Croodles Alt" },
  { id: "fun-emoji", label: "Fun Emoji" },
  { id: "icons", label: "Icons" },
  { id: "lorelei", label: "Lorelei" },
  { id: "micah", label: "Micah" },
  { id: "miniavs", label: "Mini Avatars" },
  { id: "open-peeps", label: "Open Peeps" },
  { id: "personas", label: "Personas" },
  { id: "pixel-art", label: "Pixel Art" },
  { id: "thumbs", label: "Thumbs" },
  { id: "notionists", label: "Notionists" },
];

const AVATAR_SEEDS = [
  "gamer1",
  "hero2",
  "ninja3",
  "wizard4",
  "dragon5",
  "phoenix6",
  "star7",
  "blaze8",
  "shadow9",
  "cyber10",
  "pixel11",
  "nova12",
  "titan13",
  "storm14",
  "viper15",
  "ace16",
  "rogue17",
  "spark18",
  "bolt19",
  "frost20",
];

function getAvatarUrl(style, seed, size = 96) {
  return `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(seed)}&size=${size}`;
}

// ── Avatar Picker Modal ────────────────────────────────────────────────

function AvatarPicker({ currentAvatar, onSelect, onClose }) {
  const [selectedStyle, setSelectedStyle] = useState("adventurer");
  const [selectedUrl, setSelectedUrl] = useState(currentAvatar);

  const avatars = useMemo(() => {
    return AVATAR_SEEDS.map((seed) => ({
      seed,
      url: getAvatarUrl(selectedStyle, seed),
    }));
  }, [selectedStyle]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-dark-950/90 backdrop-blur-sm flex items-end justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="w-full max-w-lg bg-dark-800 border-t border-neon-cyan/20 rounded-t-3xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-dark-500/30">
          <h3 className="font-display text-sm font-bold text-white tracking-wider uppercase">
            Choose Avatar
          </h3>
          <div className="flex gap-2">
            {selectedUrl && (
              <button
                onClick={() => {
                  onSelect(selectedUrl);
                  onClose();
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-neon-cyan text-dark-900 text-xs font-bold"
              >
                <Check size={14} /> Save
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-dark-600 text-white/60 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Style selector */}
        <div className="flex gap-2 px-4 py-3 overflow-x-auto no-scrollbar border-b border-dark-500/20">
          {AVATAR_STYLES.map((style) => (
            <button
              key={style.id}
              onClick={() => setSelectedStyle(style.id)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-semibold tracking-wide transition-all
                ${
                  selectedStyle === style.id
                    ? "bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/40"
                    : "bg-dark-600/50 text-dim border border-dark-500/30 hover:text-white/70"
                }`}
            >
              {style.label}
            </button>
          ))}
        </div>

        {/* Avatar grid */}
        <div className="flex-1 overflow-y-auto p-4 pb-24">
          <div className="grid grid-cols-4 gap-3">
            {avatars.map(({ seed, url }) => (
              <button
                key={`${selectedStyle}-${seed}`}
                onClick={() => setSelectedUrl(url)}
                className={`relative aspect-square rounded-xl overflow-hidden transition-all duration-200 active:scale-95
                  ${
                    selectedUrl === url
                      ? "ring-2 ring-neon-cyan ring-offset-2 ring-offset-dark-800 scale-105"
                      : "border border-dark-500/30 hover:border-neon-cyan/30"
                  }`}
              >
                <div className="w-full h-full bg-linear-to-br from-dark-600 to-dark-700 p-1.5">
                  <img
                    src={url}
                    alt={`Avatar ${seed}`}
                    className="w-full h-full rounded-lg"
                    loading="lazy"
                  />
                </div>
                {selectedUrl === url && (
                  <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-neon-cyan flex items-center justify-center">
                    <Check size={12} className="text-dark-900" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Profile Page ───────────────────────────────────────────────────────

export default function Profile() {
  useDocumentTitle("Profile");
  const { theme, toggleTheme } = useTheme();
  const toast = useToast();
  const { prefs, toggleSource, setAdShield, setMobileFilter, isSourceEnabled } =
    useSourcePrefs();
  const {
    stats,
    updateUsername,
    updateAvatar,
    clearGameStat,
    clearAllStats,
    getTopGames,
    getRecentGames,
    getSessionStats,
  } = usePlayerStats();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(stats.username);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [confirmClearAll, setConfirmClearAll] = useState(false);

  const handleSaveName = () => {
    if (newName.trim()) {
      updateUsername(newName.trim());
      setEditingName(false);
    }
  };

  const session = getSessionStats();
  const topGames = getTopGames(5);
  const recentGames = getRecentGames(5);

  const accountCreated = new Date(stats.created).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const defaultAvatar = getAvatarUrl("adventurer", stats.username || "Player");
  const avatarUrl = stats.avatar || defaultAvatar;

  return (
    <PageLayout header={<Header showBack title="Profile" showSearch={false} />}>
      <SEO
        title="Profile"
        description="Your GameHub gaming profile, stats, and preferences."
        path="/profile"
        noindex={true}
      />
      {/* Profile Header Card */}
      <div className="px-4 pt-4 pb-2">
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, rgba(0,245,255,0.08) 0%, rgba(191,0,255,0.08) 100%)",
            border: "1px solid rgba(0,245,255,0.15)",
          }}
        >
          {/* Banner gradient */}
          <div className="h-20 relative overflow-hidden">
            <div className="absolute inset-0 bg-linear-to-r from-neon-cyan/20 via-neon-purple/15 to-neon-pink/10" />
            <div className="absolute inset-0 bg-linear-to-t from-dark-800/80 to-transparent" />
            <div className="absolute top-3 right-3 flex gap-1">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-neon-cyan/30"
                />
              ))}
            </div>
          </div>

          {/* Avatar + Info */}
          <div className="px-5 pb-5 -mt-10 relative">
            <div className="flex items-end gap-4 mb-4">
              {/* Avatar */}
              <button
                onClick={() => setShowAvatarPicker(true)}
                className="relative group"
              >
                <div className="w-20 h-20 rounded-2xl overflow-hidden border-[3px] border-dark-800 bg-dark-700 shadow-lg shadow-neon-cyan/10">
                  <img
                    src={avatarUrl}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = defaultAvatar;
                    }}
                  />
                </div>
                <div className="absolute inset-0 rounded-2xl bg-dark-900/60 opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity flex items-center justify-center">
                  <Palette size={16} className="text-neon-cyan" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-neon-cyan flex items-center justify-center border-2 border-dark-800">
                  <Palette size={10} className="text-dark-900" />
                </div>
              </button>

              {/* Name + joined */}
              <div className="flex-1 mb-1">
                {editingName ? (
                  <div className="flex gap-2 min-w-0 max-w-full">
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
                      className="min-w-0 flex-1 bg-dark-700 border border-neon-cyan/40 rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-neon-cyan"
                      autoFocus
                      maxLength={20}
                    />
                    <button
                      onClick={handleSaveName}
                      className="shrink-0 px-3 py-1.5 bg-neon-cyan text-dark-900 rounded-lg text-xs font-bold whitespace-nowrap"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => {
                      setNewName(stats.username);
                      setEditingName(true);
                    }}
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <h2 className="font-display text-xl font-bold text-white leading-tight">
                      {stats.username}
                    </h2>
                    <p className="text-[11px] text-dim mt-0.5 flex items-center gap-1">
                      <Shield size={10} /> Joined {accountCreated}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-2">
              <StatCard
                icon={<Zap size={16} />}
                label="Games Played"
                value={session.gamesPlayed}
                color="cyan"
              />
              <StatCard
                icon={<Clock size={16} />}
                label="Playtime"
                value={session.totalPlaytime}
                color="purple"
              />
              <StatCard
                icon={<Heart size={16} />}
                label="Favorites"
                value={session.favoriteCount}
                color="pink"
              />
              <StatCard
                icon={<TrendingUp size={16} />}
                label="Top Game"
                value={stats.mostPlayedGame?.title || "None"}
                truncate
                color="green"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Achievement Badges */}
      <SectionHeader title="Badges" icon="🏅" />
      <div className="px-4 pb-2">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          <Badge
            emoji="🎮"
            label="First Play"
            unlocked={session.gamesPlayed >= 1}
          />
          <Badge
            emoji="🔥"
            label="5 Games"
            unlocked={session.gamesPlayed >= 5}
          />
          <Badge
            emoji="⚡"
            label="10 Games"
            unlocked={session.gamesPlayed >= 10}
          />
          <Badge
            emoji="🏆"
            label="25 Games"
            unlocked={session.gamesPlayed >= 25}
          />
          <Badge
            emoji="⏰"
            label="1 Hour"
            unlocked={session.totalPlaytimeMin >= 60}
          />
          <Badge
            emoji="💎"
            label="5 Hours"
            unlocked={session.totalPlaytimeMin >= 300}
          />
        </div>
      </div>

      {/* Most Played */}
      {topGames.length > 0 && (
        <>
          <SectionHeader title="Most Played" icon="🏆" />
          <div className="px-4 space-y-2 pb-2">
            {topGames.map((game, i) => (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  to={`/game/${encodeURIComponent(game.id)}`}
                  className="flex items-center gap-3 p-3 rounded-xl bg-dark-700/50 border border-dark-500/20 hover:border-neon-cyan/20 transition-all"
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-display font-bold
                  ${i === 0 ? "bg-neon-orange/20 text-neon-orange" : i === 1 ? "bg-white/10 text-white/60" : i === 2 ? "bg-neon-cyan/10 text-neon-cyan/60" : "bg-dark-600 text-dim"}`}
                  >
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">
                      {game.title}
                    </p>
                    <p className="text-[11px] text-dim mt-0.5">
                      {game.plays} plays &bull;{" "}
                      {Math.floor(game.totalTime / 60)}h {game.totalTime % 60}m
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      clearGameStat(game.id);
                    }}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-dim hover:text-neon-orange hover:bg-dark-600/50 transition-all"
                    title="Delete stats"
                  >
                    <Trash2 size={14} />
                  </button>
                </Link>
              </motion.div>
            ))}
          </div>
        </>
      )}

      {/* Recent Activity */}
      {recentGames.length > 0 && (
        <>
          <SectionHeader title="Recent Activity" icon="🕹️" />
          <div className="px-4 pb-4">
            <div className="space-y-1">
              {recentGames.map((game, i) => (
                <motion.div
                  key={game.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <Link
                    to={`/game/${encodeURIComponent(game.id)}`}
                    className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-dark-700/30 transition-colors"
                  >
                    <div className="w-2 h-2 rounded-full bg-neon-green/50" />
                    <p className="text-sm text-white/80 flex-1 truncate">
                      {game.title}
                    </p>
                    <p className="text-[10px] text-dim">
                      {new Date(game.lastPlayed).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                    <ChevronRight size={12} className="text-dim" />
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Settings */}
      <SectionHeader title="Settings" icon="⚙️" />
      <div className="px-4 pb-2 space-y-2">
        <button
          onClick={() => setShowAvatarPicker(true)}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-dark-700/50 border border-dark-500/20
                     hover:border-neon-cyan/30 transition-all text-white/80"
        >
          <Palette size={18} className="text-neon-cyan" />
          <span className="text-sm font-semibold flex-1 text-left">
            Change Avatar
          </span>
          <ChevronRight size={14} className="text-dim" />
        </button>

        <button
          onClick={() => {
            setNewName(stats.username);
            setEditingName(true);
          }}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-dark-700/50 border border-dark-500/20
                     hover:border-neon-cyan/30 transition-all text-white/80"
        >
          <Shield size={18} className="text-neon-purple" />
          <span className="text-sm font-semibold flex-1 text-left">
            Edit Username
          </span>
          <ChevronRight size={14} className="text-dim" />
        </button>

        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-dark-700/50 border border-dark-500/20
                     hover:border-neon-cyan/30 transition-all text-white/80"
        >
          {theme === "dark" ? (
            <Sun size={18} className="text-neon-orange" />
          ) : (
            <Moon size={18} className="text-neon-purple" />
          )}
          <span className="text-sm font-semibold flex-1 text-left">
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </span>
          <ChevronRight size={14} className="text-dim" />
        </button>

        <button
          onClick={async () => {
            const s = session;
            const cardText = `🎮 ${stats.username}'s GameHub Profile\n\n⚡ ${s.gamesPlayed} games played\n⏰ ${s.totalPlaytime} playtime\n❤️ ${s.favoriteCount} favorites\n🏆 Top: ${stats.mostPlayedGame?.title || "None"}\n\nPlay free games at GameHub!`;
            try {
              await navigator.share({
                title: `${stats.username}'s Profile`,
                text: cardText,
              });
            } catch {
              await navigator.clipboard?.writeText(cardText);
              toast("Profile copied to clipboard!", "success");
            }
          }}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-dark-700/50 border border-dark-500/20
                     hover:border-neon-cyan/30 transition-all text-white/80"
        >
          <Share2 size={18} className="text-neon-green" />
          <span className="text-sm font-semibold flex-1 text-left">
            Share Profile Card
          </span>
          <ChevronRight size={14} className="text-dim" />
        </button>
      </div>

      {/* Game Sources */}
      <SectionHeader title="Game Sources" icon="🌐" />
      <div className="px-4 pb-2 space-y-2">
        <p className="text-[11px] text-dim px-1 -mt-1 mb-2">
          Disable ad-heavy sources to improve your experience. Games from
          disabled sources won't appear.
        </p>

        {/* Mobile Games Only toggle */}
        <button
          onClick={() => setMobileFilter(!prefs.mobileFilter)}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all
            bg-dark-700/50 border-dark-500/20 text-white/80 hover:border-neon-cyan/30"
        >
          <Smartphone size={18} className="text-neon-cyan shrink-0" />
          <div className="flex-1 text-left">
            <p className="text-sm font-semibold">Mobile Games Only</p>
            <p className="text-[10px] text-dim mt-0.5 font-normal">
              Filters GameMonetize &amp; GameDistribution to mobile-verified
              games.
            </p>
          </div>
          {prefs.mobileFilter ? (
            <ToggleRight size={22} className="text-neon-green shrink-0" />
          ) : (
            <ToggleLeft size={22} className="text-dim shrink-0" />
          )}
        </button>
        {SOURCES.filter((s) => s.key).map((src) => {
          const enabled = isSourceEnabled(src.slug);
          return (
            <button
              key={src.slug}
              onClick={() => toggleSource(src.slug)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all
                ${
                  enabled
                    ? "bg-dark-700/50 border-dark-500/20 text-white/80 hover:border-neon-cyan/30"
                    : "bg-dark-800/50 border-neon-orange/15 text-dim"
                }`}
            >
              <span className="text-lg">{src.icon}</span>
              <span className="text-sm font-semibold flex-1 text-left">
                {src.label}
              </span>
              {src.slug === "gamemonetize" && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-neon-orange/15 text-neon-orange font-bold uppercase tracking-wider">
                  Heavy Ads
                </span>
              )}
              {src.slug === "gamepix" && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-dark-500/50 text-white/40 font-bold uppercase tracking-wider">
                  Needs SID
                </span>
              )}
              {enabled ? (
                <ToggleRight size={22} className="text-neon-green" />
              ) : (
                <ToggleLeft size={22} className="text-dim" />
              )}
            </button>
          );
        })}
      </div>

      {/* Ad Shield */}
      <SectionHeader title="Ad Shield" icon="🛡️" />
      <div className="px-4 pb-2 space-y-2">
        <p className="text-[11px] text-dim px-1 -mt-1 mb-2">
          Blocks popup ads, redirects, and unwanted overlays inside games.
          Higher levels may break some games.
        </p>
        {[
          {
            level: "off",
            label: "Off",
            desc: "No restrictions — games load as-is",
            Icon: ShieldOff,
            color: "text-dim",
          },
          {
            level: "light",
            label: "Light",
            desc: "Blocks popups & redirects (recommended)",
            Icon: ShieldCheck,
            color: "text-neon-green",
          },
          {
            level: "strict",
            label: "Strict",
            desc: "Max isolation — may break some games",
            Icon: ShieldAlert,
            color: "text-neon-orange",
          },
        ].map(({ level, label, desc, Icon, color }) => (
          <button
            key={level}
            onClick={() => setAdShield(level)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all
              ${
                prefs.adShield === level
                  ? "bg-neon-cyan/5 border-neon-cyan/30 text-white"
                  : "bg-dark-700/50 border-dark-500/20 text-white/70 hover:border-neon-cyan/20"
              }`}
          >
            <Icon size={18} className={color} />
            <div className="flex-1 text-left">
              <span className="text-sm font-semibold">{label}</span>
              <p className="text-[10px] text-dim mt-0.5">{desc}</p>
            </div>
            {prefs.adShield === level && (
              <div className="w-5 h-5 rounded-full bg-neon-cyan flex items-center justify-center">
                <Check size={12} className="text-dark-900" />
              </div>
            )}
          </button>
        ))}
      </div>

      <div className="px-4 pb-8 space-y-2">
        <button
          onClick={() => setConfirmClearAll(true)}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-dark-700/50 border border-neon-orange/20
                     hover:border-neon-orange/50 transition-all text-neon-orange"
        >
          <Trash2 size={18} />
          <span className="text-sm font-semibold flex-1 text-left">
            Clear All Data
          </span>
          <ChevronRight size={14} />
        </button>
        <p className="text-[11px] text-dim px-4">
          Permanently deletes your profile, stats, and saved preferences.
        </p>
      </div>

      {/* Avatar Picker */}
      <AnimatePresence>
        {showAvatarPicker && (
          <AvatarPicker
            currentAvatar={stats.avatar}
            onSelect={(url) => updateAvatar(url)}
            onClose={() => setShowAvatarPicker(false)}
          />
        )}
      </AnimatePresence>

      {/* Clear All Confirmation */}
      <AnimatePresence>
        {confirmClearAll && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-dark-950/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-dark-800 border border-neon-orange/30 rounded-2xl p-6 max-w-xs w-full"
            >
              <h3 className="font-display text-lg font-bold text-white mb-2">
                Clear All Data?
              </h3>
              <p className="text-sm text-dim mb-6">
                Your profile, game stats, favorites, and all saved data will be
                permanently deleted.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmClearAll(false)}
                  className="flex-1 py-2.5 rounded-xl bg-dark-600 text-white text-sm font-semibold hover:bg-dark-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    clearAllStats();
                    setConfirmClearAll(false);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-neon-orange text-dark-900 text-sm font-semibold hover:bg-neon-orange/90 transition-colors"
                >
                  Delete All
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageLayout>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────

function StatCard({ icon, label, value, truncate, color = "cyan" }) {
  const colorMap = {
    cyan: "text-neon-cyan",
    purple: "text-neon-purple",
    pink: "text-neon-pink",
    green: "text-neon-green",
    orange: "text-neon-orange",
  };

  return (
    <div className="rounded-xl bg-dark-800/60 border border-dark-500/15 p-3">
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className={colorMap[color] || "text-neon-cyan"}>{icon}</span>
        <p className="text-[10px] text-dim font-semibold uppercase tracking-wider">
          {label}
        </p>
      </div>
      <p
        className={`text-base font-display font-bold text-white ${truncate ? "line-clamp-1 text-sm" : ""}`}
      >
        {value}
      </p>
    </div>
  );
}

function Badge({ emoji, label, unlocked }) {
  return (
    <div
      className={`shrink-0 flex flex-col items-center gap-1 px-3 py-2 rounded-xl border transition-all
      ${
        unlocked
          ? "bg-neon-cyan/5 border-neon-cyan/20"
          : "bg-dark-700/30 border-dark-500/20 opacity-40 grayscale"
      }`}
    >
      <span className="text-xl">{emoji}</span>
      <span className="text-[9px] font-display font-bold text-dim tracking-wider uppercase whitespace-nowrap">
        {label}
      </span>
    </div>
  );
}
