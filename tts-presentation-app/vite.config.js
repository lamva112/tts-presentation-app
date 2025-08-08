import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy all API calls during development to avoid CORS
      '/api': {
        target: 'https://mc-ctx-bot-app-dfa2gmaddhc8f5dh.southeastasia-01.azurewebsites.net',
        changeOrigin: true,
        secure: true,
      },
    },
  },
})
