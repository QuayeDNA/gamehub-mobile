import React, { useState, useEffect, useSyncExternalStore } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Search, Grid3X3, Heart, User, Gamepad2, Menu, X, ChevronLeft, WifiOff } from 'lucide-react';

// ── Online Status Hook ──────────────────────────────────────────────────

function subscribeOnline(cb) {
  window.addEventListener('online', cb);
  window.addEventListener('offline', cb);
  return () => {
    window.removeEventListener('online', cb);
    window.removeEventListener('offline', cb);
  };
}
function getOnlineSnapshot() { return navigator.onLine; }

export function useOnlineStatus() {
  return useSyncExternalStore(subscribeOnline, getOnlineSnapshot, () => true);
}

// ── Offline Banner ──────────────────────────────────────────────────────

export function OfflineBanner() {
  const online = useOnlineStatus();
  const [dismissed, setDismissed] = useState(false);

  // Reset dismissed when coming back online then going offline again
  useEffect(() => { if (online) setDismissed(false); }, [online]);

  if (online || dismissed) return null;

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      className="bg-orange-500/90 text-dark-900 text-xs font-bold text-center px-4 py-2 flex items-center justify-center gap-2"
    >
      <WifiOff size={14} />
      You're offline — cached games still available
      <button onClick={() => setDismissed(true)} className="ml-2 opacity-70 hover:opacity-100" aria-label="Dismiss">
        <X size={14} />
      </button>
    </motion.div>
  );
}

// ── Bottom Navigation ───────────────────────────────────────────────────

const NAV_ITEMS = [
  { icon: Home, label: 'Home', to: '/', key: 'home' },
  { icon: Search, label: 'Search', to: '/search', key: 'search' },
  { icon: Grid3X3, label: 'Browse', to: '/browse', key: 'browse' },
  { icon: Heart, label: 'Favorites', to: '/favorites', key: 'favorites' },
  { icon: User, label: 'Profile', to: '/profile', key: 'profile' },
];

export function BottomNav() {
  const location = useLocation();
  
  const getActive = () => {
    const path = location.pathname;
    if (path === '/') return 'home';
    if (path.startsWith('/search')) return 'search';
    if (path.startsWith('/browse') || path.startsWith('/category')) return 'browse';
    if (path.startsWith('/favorites')) return 'favorites';
    if (path.startsWith('/profile')) return 'profile';
    return '';
  };

  const active = getActive();

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg z-50 glass-heavy border-t border-neon-cyan/10">
      <div className="flex justify-around items-center px-2 pt-2 safe-bottom">
        {NAV_ITEMS.map(({ icon: Icon, label, to, key }) => {
          const isActive = active === key;
          return (
            <Link
              key={key}
              to={to}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 active:scale-90 min-w-[60px]
                ${isActive ? 'text-neon-cyan' : 'text-dim hover:text-white/70'}`}
              aria-label={label}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="relative">
                <Icon size={22} strokeWidth={isActive ? 2.5 : 1.5} />
                {isActive && (
                  <motion.div
                    layoutId="nav-glow"
                    className="absolute -inset-2 bg-neon-cyan/10 rounded-full blur-md -z-10"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
              </div>
              <span className={`text-[10px] font-semibold tracking-wide ${isActive ? 'text-neon-cyan' : ''}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

// ── Top Header ──────────────────────────────────────────────────────────

export function Header({ title, showBack = false, showSearch = true, transparent = false, rightAction = null }) {
  const navigate = useNavigate();

  return (
    <header className={`sticky top-0 z-40 transition-colors duration-300
      ${transparent ? 'bg-transparent' : 'glass-heavy border-b border-neon-cyan/10'}`}>
      <div className="flex items-center gap-3 px-4 py-3">
        {showBack ? (
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-dark-600/50 text-white/80 hover:text-neon-cyan transition-colors active:scale-90"
            aria-label="Go back"
          >
            <ChevronLeft size={20} />
          </button>
        ) : (
          <Link to="/" className="flex items-center gap-0.5" aria-label="GameHub Home">
            <Gamepad2 size={24} className="text-neon-cyan" />
            <span className="font-display text-lg font-black tracking-wider">
              <span className="text-neon-cyan text-neon-glow">GAME</span>
              <span className="text-neon-purple text-neon-purple-glow">HUB</span>
            </span>
          </Link>
        )}

        {title && (
          <h1 className="font-display text-sm font-bold text-white/90 truncate flex-1">
            {title}
          </h1>
        )}

        {!title && <div className="flex-1" />}

        {showSearch && !showBack && (
          <Link
            to="/search"
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-dark-600/50 text-white/60 hover:text-neon-cyan transition-colors"
            aria-label="Search games"
          >
            <Search size={18} />
          </Link>
        )}

        {rightAction}
      </div>
    </header>
  );
}

// ── Page Layout Wrapper ─────────────────────────────────────────────────

export function PageLayout({ children, header, hideNav = false }) {
  return (
    <div className="min-h-screen bg-dark-900">
      <div className="max-w-lg mx-auto min-h-screen relative">
        <AnimatePresence><OfflineBanner /></AnimatePresence>
        {header}
        <main className={hideNav ? 'pb-4' : 'pb-20'}>
          {children}
        </main>
        {!hideNav && <BottomNav />}
      </div>
    </div>
  );
}

// ── Section Header ──────────────────────────────────────────────────────

export function SectionHeader({ title, icon, actionLabel, actionTo, className = '' }) {
  return (
    <div className={`flex items-center justify-between px-4 pt-6 pb-3 ${className}`}>
      <h2 className="flex items-center gap-2 font-display text-sm font-bold text-white/90 tracking-wider uppercase">
        {icon && <span className="text-lg">{icon}</span>}
        {title}
      </h2>
      {actionTo && (
        <Link
          to={actionTo}
          className="text-xs font-semibold text-neon-cyan/70 hover:text-neon-cyan transition-colors tracking-wide"
        >
          {actionLabel || 'See All'} →
        </Link>
      )}
    </div>
  );
}

// ── Category Pill Scroll ────────────────────────────────────────────────

export function CategoryPills({ categories, active, onSelect }) {
  return (
    <div className="flex gap-2 px-4 overflow-x-auto no-scrollbar py-2" role="tablist">
      {categories.map(cat => (
        <button
          key={cat.slug}
          onClick={() => onSelect(cat.slug)}
          className={`pill ${active === cat.slug ? 'pill-active' : ''}`}
          role="tab"
          aria-selected={active === cat.slug}
        >
          <span className="mr-1">{cat.icon}</span>
          {cat.label}
        </button>
      ))}
    </div>
  );
}

// ── Sort Bar ────────────────────────────────────────────────────────

const SORT_OPTIONS = [
  { value: 'default', label: 'Default' },
  { value: 'a-z', label: 'A → Z' },
  { value: 'z-a', label: 'Z → A' },
];

export function SortBar({ value, onChange }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2">
      {SORT_OPTIONS.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`text-[10px] font-display font-bold tracking-wider px-3 py-1.5 rounded-lg transition-all
            ${value === opt.value
              ? 'bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30'
              : 'bg-dark-700/40 text-dim border border-dark-500/20 hover:text-white/70'}`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ── Empty State ─────────────────────────────────────────────────────────

export function EmptyState({ icon = '🕹️', title, message, action }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 px-8 text-center"
    >
      <div className="text-5xl mb-4 animate-float">{icon}</div>
      <h3 className="font-display text-lg font-bold text-white/80 mb-2">{title}</h3>
      {message && <p className="text-sm text-dim max-w-xs">{message}</p>}
      {action}
    </motion.div>
  );
}

// ── Loading Skeleton ────────────────────────────────────────────────────

export function SkeletonCard() {
  return (
    <div className="rounded-2xl overflow-hidden bg-dark-700 border border-dark-500/30">
      <div className="skeleton-shimmer aspect-[16/10]" />
      <div className="p-3 space-y-2">
        <div className="skeleton-shimmer h-4 w-3/4 rounded-md" />
        <div className="skeleton-shimmer h-3 w-1/2 rounded-md" />
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 6 }) {
  return (
    <div className="grid grid-cols-2 gap-3 px-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonRow({ count = 4 }) {
  return (
    <div className="flex gap-3 px-4 overflow-hidden">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex-shrink-0 w-40">
          <div className="skeleton-shimmer aspect-[16/10] rounded-xl" />
          <div className="skeleton-shimmer h-3 w-24 rounded-md mt-2" />
        </div>
      ))}
    </div>
  );
}

// ── Error Banner ────────────────────────────────────────────────────────

export function ErrorBanner({ message, onRetry }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-4 mt-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3"
    >
      <span className="text-red-400 text-sm flex-1">⚠️ {message}</span>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-xs font-bold text-neon-cyan px-3 py-1 rounded-lg border border-neon-cyan/30 hover:bg-neon-cyan/10 transition-colors"
        >
          Retry
        </button>
      )}
    </motion.div>
  );
}
