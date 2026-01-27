// ==================== src/services/analysisService.js ====================
import api from './api'
import axios from 'axios'
import * as assistantApi from '../api/assistant'

// ✅ FastAPI(파이썬) 서버 주소 (필요 시 .env로 빼도 됨)
const AI_BASE_URL = import.meta.env.VITE_AI_BASE_URL || 'http://localhost:8000'

export const analysisService = {
  analyzeComment: async (commentId) => {
    const response = await api.post('/analysis/comment', { commentId })
    return response.data
  },

  getHistory: async () => {
    const response = await api.get('/analysis/history')
    return response.data
  },

  getStats: async () => {
    const response = await api.get('/analysis/stats')
    return response.data
  },
  // 장소영 수정
  analyzeText: async (text) => {
    // 🔥 기존 Spring(8081) 말고 FastAPI(8000)로 직접 호출
    const response = await axios.post(
      `${AI_BASE_URL}/analyze/text`,
      {
        text,
        language: 'auto',
        use_dual_model: true,
      },
      {
        headers: { 'Content-Type': 'application/json' },
      }
    )
    return response.data
  },

  // ✅ AI Writing Assistant 함수들 (assistant.js 래퍼)
  assistantImprove: async (text, tone = 'polite', language = 'ko', instruction = null) => {
    return await assistantApi.improveText({ text, tone, language, instruction })
  },

  assistantReply: async (comment, context = null, replyType = 'constructive', language = 'ko') => {
    return await assistantApi.generateReply({ comment, context, replyType, language })
  },

  assistantTemplate: async (situation, topic, tone = 'polite', language = 'ko') => {
    return await assistantApi.generateTemplate({ situation, topic, tone, language })
  },
}
