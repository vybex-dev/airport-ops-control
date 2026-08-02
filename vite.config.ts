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
    chunkSizeWarningLimit: 6000,
    // Manual chunking so vendor libs & parsed JSON datasets split cleanly
    // from app code — keeps initial JS payload lean for Lighthouse Performance.
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('/src/data/parsed/')) {
            return 'parsed-data';
          }
          if (id.includes('node_modules')) {
            if (id.includes('recharts')) return 'vendor-charts';
            if (id.includes('framer-motion')) return 'vendor-motion';
            if (id.includes('react-dom') || id.includes('/react/')) return 'vendor-react';
          }
        },
      },
    },
  },
})

