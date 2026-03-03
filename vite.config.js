import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.svg'],
      manifest: {
        name: 'GameHub - Free Mobile Games',
        short_name: 'GameHub',
        description: 'Play thousands of free HTML5 games on your phone',
        theme_color: '#0a0a0f',
        background_color: '#0a0a0f',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          { src: '/icons/icon-192.svg', sizes: '192x192', type: 'image/svg+xml' },
          { src: '/icons/icon-512.svg', sizes: '512x512', type: 'image/svg+xml' },
          { src: '/icons/icon-512.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            // GameMonetize API (dev proxy + prod)
            urlPattern: /^(https:\/\/gamemonetize\.com|\/api\/gm)/,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'game-api-cache', expiration: { maxEntries: 50, maxAgeSeconds: 3600 } },
          },
          {
            // GameDistribution API
            urlPattern: /^https:\/\/catalog\.api\.gamedistribution\.com/,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'gd-api-cache', expiration: { maxEntries: 50, maxAgeSeconds: 3600 } },
          },
          {
            // GamePix API
            urlPattern: /^https:\/\/(games|feeds)\.gamepix\.com/,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'gp-api-cache', expiration: { maxEntries: 50, maxAgeSeconds: 3600 } },
          },
          {
            // CrazyGames API
            urlPattern: /^https:\/\/.*crazygames\.com/,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'cg-api-cache', expiration: { maxEntries: 50, maxAgeSeconds: 3600 } },
          },
          {
            // HTMLGames API + CDN
            urlPattern: /^https:\/\/(www|cdn)\.htmlgames\.com/,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'hg-api-cache', expiration: { maxEntries: 50, maxAgeSeconds: 3600 } },
          },
          {
            // Image cache — thumbnails, icons, avatars
            urlPattern: /\.(png|jpg|jpeg|webp|gif|svg)(\?.*)?$/,
            handler: 'CacheFirst',
            options: { cacheName: 'image-cache', expiration: { maxEntries: 300, maxAgeSeconds: 86400 * 7 } },
          },
          {
            // DiceBear avatar SVGs
            urlPattern: /^https:\/\/api\.dicebear\.com/,
            handler: 'CacheFirst',
            options: { cacheName: 'avatar-cache', expiration: { maxEntries: 100, maxAgeSeconds: 86400 * 30 } },
          },
        ],
      },
    }),
  ],
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api/gm': {
        target: 'https://gamemonetize.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/gm/, ''),
        secure: false,
      },
      '/api/hg': {
        target: 'https://www.htmlgames.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/hg/, ''),
        secure: false,
      },
    },
  },
});
