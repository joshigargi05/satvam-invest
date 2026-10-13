import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3000'
    }
  },
  plugins: [
    react()
  ],
})
