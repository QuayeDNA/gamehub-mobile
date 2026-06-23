import React, { useEffect, lazy, Suspense, useState, useRef } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  useNavigationType,
  Link,
} from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import ErrorBoundary from "./components/ErrorBoundary";
import { ToastProvider } from "./components/Toast";
import { ThemeProvider } from "./hooks/useTheme";
import Onboarding from "./components/Onboarding";
import PingPongLoader from "./components/PingPongLoader";

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

/** Shows PingPongLoader on every client-side navigation */
function NavigationLoader() {
  const location = useLocation();
  const [visible, setVisible] = useState(false);
  const prevPath = useRef(location.pathname);

  useEffect(() => {
    if (location.pathname !== prevPath.current) {
      prevPath.current = location.pathname;
      setVisible(true);
    }
  }, [location.pathname]);

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => setVisible(false), 350);
    return () => clearTimeout(timer);
  }, [visible]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="nav-loader"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-100"
        >
          <PingPongLoader />
        </motion.div>
      )}
    </AnimatePresence>
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
            <NavigationLoader />
            <Suspense fallback={<PingPongLoader />}>
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
