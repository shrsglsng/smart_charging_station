import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  // Dev mode runs at http://localhost:5173/
  // Production build runs at http://localhost:3000/admin/
  base: mode === 'production' ? '/admin/' : '/',
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      }
    }
  }
}))
