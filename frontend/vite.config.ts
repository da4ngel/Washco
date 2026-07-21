import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'WashCo',
        short_name: 'WashCo',
        description: 'WashCo — Book a car wash in Colombo. Browse top-rated washes, book a slot, and pay in seconds.',
        start_url: '/',
        display: 'standalone',
        background_color: '#eaf4fe',
        theme_color: '#eaf4fe',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        navigateFallback: '/offline.html',
        navigateFallbackDenylist: [/^\/api/],
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        runtimeCaching: [
          {
            // Never cache Supabase auth or Stripe requests — auth tokens / payment
            // requests must always hit the network.
            urlPattern: ({ url }) =>
              /supabase\.co\/auth/.test(url.href) ||
              /js\.stripe\.com/.test(url.href) ||
              /api\.stripe\.com/.test(url.href),
            handler: 'NetworkOnly',
          },
          {
            // WashCo API calls (may be a separate origin from the frontend in prod):
            // prefer fresh data, fall back to last-known-good response when offline.
            urlPattern: ({ url }) => url.pathname.includes('/api/'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 8,
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 },
            },
          },
          {
            // Hashed static build assets: safe to cache-first since filenames change on rebuild.
            urlPattern: ({ request }) =>
              ['style', 'script', 'font', 'image'].includes(request.destination),
            handler: 'CacheFirst',
            options: {
              cacheName: 'static-assets',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    strictPort: false,
  },
  build: {
    rollupOptions: {
      output: {
        // Split large vendors into their own chunks for better caching.
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          charts: ['recharts'],
          stripe: ['@stripe/stripe-js', '@stripe/react-stripe-js'],
          supabase: ['@supabase/supabase-js'],
        },
      },
    },
  },
});
