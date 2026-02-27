// ==================== src/services/api.js ====================
import axios from 'axios'
import { useAuthStore } from '../stores/authStore'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 🆕 로그인 API는 401 에러를 그대로 전달 (리다이렉트 안 함)
    const isLoginRequest = error.config?.url?.includes('auth/login')
    
    // 401 에러 처리 (로그인 요청 제외)
    if (error.response?.status === 401 && !isLoginRequest) {
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }
    
    // 404 에러는 조용히 처리
    if (error.response?.status === 404) {
      return Promise.reject(error)
    }
    
    return Promise.reject(error)
  }
)

export default api