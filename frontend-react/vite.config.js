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
        target: process.env.VITE_API_TARGET_AI || 'http://backend-fastapi:8000',
        changeOrigin: true,
        rewrite: (path) => path  // /api/assistant/* → http://backend-fastapi:8000/api/assistant/*
      },
      // ✅ AI Content Analysis (FastAPI)
      '/analyze': {
        target: process.env.VITE_API_TARGET_AI || 'http://backend-fastapi:8000',
        changeOrigin: true
      },
      '/crawl': {
        target: process.env.VITE_API_TARGET_AI || 'http://backend-fastapi:8000',
        changeOrigin: true
      },
      // ✅ Spring Boot API (나머지)
      '/api': {
        target: process.env.VITE_API_TARGET_BACKEND || 'http://backend-springboot:8081',
        changeOrigin: true
      }
    }
  }
})