// @ts-nocheck
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 10000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return

          // Split recharts (heaviest lib ~366KB) — should be lazy-loaded by design
          if (id.includes('recharts')) return 'recharts'

          // Split React core — stable, cache-friendly
          if (
            id.includes('react-dom') ||
            id.includes('react/') ||
            id.includes('scheduler/')
          ) return 'react-vendor'

          // Split React Router — separate from core
          if (id.includes('react-router') || id.includes('react-router-dom')) return 'router-vendor'

          // Split icons — large icon library, separate chunk
          if (id.includes('lucide-react')) return 'icons'

          // Split date utilities
          if (id.includes('date-fns')) return 'date-vendor'

          // Split UI primitives (Radix, CVA, sonner, etc.)
          if (
            id.includes('@radix-ui') ||
            id.includes('class-variance-authority') ||
            id.includes('clsx') ||
            id.includes('tailwind-merge') ||
            id.includes('sonner')
          ) return 'ui-vendor'

          // Split state management
          if (
            id.includes('zustand') ||
            id.includes('jotai') ||
            id.includes('valtio') ||
            id.includes('react-redux')
          ) return 'state-vendor'

          // Split data/table libraries
          if (
            id.includes('@tanstack/react-table') ||
            id.includes('@tanstack/react-virtual')
          ) return 'data-vendor'

          // Remaining vendor (express, cors, etc. — server-side only, excluded at build)
          return 'vendor'
        },
      },
    },
  },
})
