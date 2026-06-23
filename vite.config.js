import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icons/*.svg", "icons/*.png", "og-image.png"],
      manifest: {
        name: "GameHub - Free Mobile Games",
        short_name: "GameHub",
        description: "Play thousands of free HTML5 games on your phone",
        theme_color: "#0a0a0f",
        background_color: "#0a0a0f",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        categories: ["games", "entertainment"],
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
          {
            src: "/icons/maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
          { src: "/icons/icon-192.svg", sizes: "any", type: "image/svg+xml" },
        ],
        screenshots: [
          {
            src: "/og-image.png",
            sizes: "1200x630",
            type: "image/png",
            label: "GameHub - Free Mobile Games",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        runtimeCaching: [
          {
            urlPattern: /^(https:\/\/gamemonetize\.com|\/api\/gm)/,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "game-api-cache",
              expiration: { maxEntries: 50, maxAgeSeconds: 3600 },
            },
          },
          {
            urlPattern: /^https:\/\/catalog\.api\.gamedistribution\.com/,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "gd-api-cache",
              expiration: { maxEntries: 50, maxAgeSeconds: 3600 },
            },
          },
          {
            urlPattern: /^https:\/\/(games|feeds)\.gamepix\.com/,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "gp-api-cache",
              expiration: { maxEntries: 50, maxAgeSeconds: 3600 },
            },
          },
          {
            urlPattern: /^https:\/\/.*crazygames\.com/,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "cg-api-cache",
              expiration: { maxEntries: 50, maxAgeSeconds: 3600 },
            },
          },
          {
            urlPattern: /^https:\/\/(www|cdn)\.htmlgames\.com/,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "hg-api-cache",
              expiration: { maxEntries: 50, maxAgeSeconds: 3600 },
            },
          },
          {
            urlPattern: /\.(png|jpg|jpeg|webp|gif|svg)(\?.*)?$/,
            handler: "CacheFirst",
            options: {
              cacheName: "image-cache",
              expiration: { maxEntries: 300, maxAgeSeconds: 86400 * 7 },
            },
          },
          {
            urlPattern: /^https:\/\/api\.dicebear\.com/,
            handler: "CacheFirst",
            options: {
              cacheName: "avatar-cache",
              expiration: { maxEntries: 100, maxAgeSeconds: 86400 * 30 },
            },
          },
        ],
      },
    }),
  ],
  server: {
    port: 3000,
    host: true,
    proxy: {
      "/api/gm": {
        target: "https://gamemonetize.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/gm/, ""),
        secure: false,
      },
      "/api/hg-proxy": {
        target: "https://www.htmlgames.com",
        changeOrigin: true,
        rewrite: () => "/rss/games.php",
        secure: false,
      },
    },
  },
});
