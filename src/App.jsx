import React, { useEffect, lazy, Suspense } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  useNavigationType,
  Link,
} from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary";
import { ToastProvider } from "./components/Toast";
import { ThemeProvider } from "./hooks/useTheme";
import Onboarding from "./components/Onboarding";

// Lazy-loaded page components — each becomes its own chunk
const Home = lazy(() => import("./pages/Home"));
const GameDetail = lazy(() => import("./pages/GameDetail"));
const Category = lazy(() => import("./pages/Category"));
const Source = lazy(() => import("./pages/Source"));
const Search = lazy(() => import("./pages/Search"));
const Browse = lazy(() => import("./pages/Browse"));
const Favorites = lazy(() => import("./pages/Favorites"));
const Profile = lazy(() => import("./pages/Profile"));
const Collection = lazy(() => import("./pages/Collection"));

/** Scroll to top on every route change */
function ScrollToTop() {
  const { pathname } = useLocation();
  const navType = useNavigationType();
  useEffect(() => {
    if (navType !== "POP") window.scrollTo(0, 0);
  }, [pathname, navType]);
  return null;
}

/** Route loading fallback */
function RouteFallback() {
  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-2 border-neon-cyan/30 border-t-neon-cyan rounded-full animate-spin" />
        <span className="font-display text-xs text-neon-cyan/60 tracking-widest animate-pulse">
          LOADING
        </span>
      </div>
    </div>
  );
}

/** 404 page */
function NotFound() {
  return (
    <div className="min-h-screen bg-dark-900 max-w-lg mx-auto flex flex-col items-center justify-center p-8 text-center">
      <span className="text-6xl mb-4">🚀</span>
      <h1 className="font-display text-2xl font-black text-white mb-2">404</h1>
      <p className="text-sm text-dim mb-6">
        This page doesn't exist — but thousands of games do!
      </p>
      <Link to="/" className="btn-cyber text-sm">
        Go Home
      </Link>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <ToastProvider>
          <ScrollToTop />
          <ErrorBoundary>
            <Suspense fallback={<RouteFallback />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/game/:id" element={<GameDetail />} />
                <Route path="/category/:slug" element={<Category />} />
                <Route path="/source/:slug" element={<Source />} />
                <Route path="/search" element={<Search />} />
                <Route path="/browse" element={<Browse />} />
                <Route path="/favorites" element={<Favorites />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/collection/:id" element={<Collection />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
          <Onboarding />
        </ToastProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
