import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      jsxRuntime: 'automatic',  // ✅ React 자동 import
    })
  ],
  server: {
    port: 3000,
    proxy: {
      // ✅ AI Writing Assistant (FastAPI 마이크로서비스)
      '/api/assistant': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path  // /api/assistant/* → http://localhost:8000/api/assistant/*
      },
      // ✅ AI Content Analysis (FastAPI)
      '/analyze': {
        target: 'http://localhost:8000',
        changeOrigin: true
      },
      '/crawl': {
        target: 'http://localhost:8000',
        changeOrigin: true
      },
      // ✅ Spring Boot API (나머지)
      '/api': {
        target: 'http://localhost:8081',
        changeOrigin: true
      }
    }
  }
})