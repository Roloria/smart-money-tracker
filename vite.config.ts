// @ts-nocheck
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Force all modules into a single JS file (no code splitting)
        manualChunks: () => 'vendor',
      },
    },
    chunkSizeWarningLimit: 10000,
  },
})
