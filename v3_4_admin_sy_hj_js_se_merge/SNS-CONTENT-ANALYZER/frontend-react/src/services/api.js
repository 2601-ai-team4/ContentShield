// ==================== src/services/api.js ====================
// 장소영~여기까지: axios 인스턴스 생성 및 인터셉터 설정 (404 에러 조용히 처리)
import axios from 'axios'
import { useAuthStore } from '../stores/authStore'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

// 장소영~여기까지: axios 인스턴스 생성
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
// 장소영~여기까지: 404 에러 조용히 처리 (템플릿 API 등 미구현 API용)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 401 에러는 인증 문제이므로 처리
    if (error.response?.status === 401) {
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }
    // 장소영~여기까지: 404 에러는 API 미구현으로 간주하고 조용히 처리
    // 템플릿 API(/api/templates) 등이 SpringBoot에 구현되지 않았을 때 발생
    // 브라우저가 네트워크 요청 실패를 자동으로 콘솔에 표시하지만,
    // 우리는 추가적인 console.error/warn을 호출하지 않음
    if (error.response?.status === 404) {
      // 404 에러는 조용히 reject만 하고 추가 로깅 없음
      // TemplateManager에서 catch하여 로컬 스토리지로 fallback
      // 브라우저 네트워크 탭에는 표시되지만, 우리 코드에서 추가 에러 로깅은 하지 않음
      return Promise.reject(error)
    }
    return Promise.reject(error)
  }
)

export default api