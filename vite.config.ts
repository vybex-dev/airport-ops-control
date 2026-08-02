import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  build: {
    // Surface real sizes — do not hide bundle regressions
    chunkSizeWarningLimit: 1000,
    // Show compressed sizes in the build output
    reportCompressedSize: true,
    // Target modern browsers — smaller output than the ES2017 default
    target: 'es2020',
    // esbuild minifier (default in Vite ≥5, faster than terser, equally good)
    minify: 'esbuild',
    // Disabled: Vite's default modulepreload polyfill/link injector was
    // causing route-level lazy chunks (e.g. vendor-charts, only needed on
    // /security and /retail) to be fetched on EVERY page load, including
    // the Overview route that never imports Recharts. Confirmed via
    // Network tab: vendor-charts-*.js loaded on a cold "/" request with
    // its initiator being the entry chunk, not a route navigation.
    modulePreload: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // JSON data is now served from /public/data/ — NOT bundled.
          // The 'parsed-data' chunk is intentionally removed.
          if (id.includes('node_modules')) {
            if (id.includes('recharts')) return 'vendor-charts';
            if (id.includes('framer-motion')) return 'vendor-motion';
            if (id.includes('react-dom') || id.includes('/react/')) return 'vendor-react';
            if (id.includes('react-router')) return 'vendor-router';
            if (id.includes('zustand')) return 'vendor-state';
            if (id.includes('lucide-react')) return 'vendor-icons';
          }
        },
      },
    },
  },
})
