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
          // Split vendor libs into separate chunks for better caching
          if (id.includes('node_modules')) {
            if (id.includes('recharts')) return 'recharts'
            if (id.includes('lucide-react')) return 'icons'
            if (id.includes('zustand') || id.includes('jotai') || id.includes('valtio')) return 'state'
            return 'vendor'
          }
        },
      },
    },
  },
})
