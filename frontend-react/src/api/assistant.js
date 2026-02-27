/**
 * AI Writing Assistant API 호출 함수
 * FastAPI 마이크로서비스와 통신
 */
import axios from 'axios'

// 개발 환경에서는 Vite 프록시 사용, 운영에서는 절대 경로
const API_BASE = import.meta.env.VITE_AI_BASE_URL || '/api/assistant'

/**
 * 텍스트 개선
 * @param {string} text - 개선할 텍스트
 * @param {string} tone - 톤 (polite/neutral/friendly/formal/casual)
 * @param {string} language - 언어 (ko/en)
 * @param {string|null} instruction - 추가 지시사항
 * @returns {Promise<Object>} suggestions 배열 포함 응답
 */
export async function improveText({ text, tone = 'polite', language = 'ko', instruction = null }) {
  try {
    const response = await axios.post(`${API_BASE}/improve`, {
      text,
      tone,
      language,
      instruction
    })
    return response.data
  } catch (error) {
    console.error('Improve text error:', error)
    throw new Error(error.response?.data?.detail || '텍스트 개선 중 오류가 발생했습니다')
  }
}

/**
 * 댓글 답변 생성
 * @param {string} comment - 답변할 댓글
 * @param {string|null} context - 추가 컨텍스트
 * @param {string} replyType - 답변 타입 (constructive/apology/explanation/neutral)
 * @param {string} language - 언어 (ko/en)
 * @returns {Promise<Object>} suggestions 배열 포함 응답
 */
export async function generateReply({ comment, context = null, replyType = 'constructive', language = 'ko' }) {
  try {
    const response = await axios.post(`${API_BASE}/reply`, {
      comment,
      context,
      reply_type: replyType,
      language
    })
    return response.data
  } catch (error) {
    console.error('Generate reply error:', error)
    throw new Error(error.response?.data?.detail || '답변 생성 중 오류가 발생했습니다')
  }
}

/**
 * 템플릿 생성
 * @param {string} situation - 상황 (promotion/announcement/apology/explanation)
 * @param {string} topic - 주제/내용
 * @param {string} tone - 톤 (polite/neutral/friendly/formal/casual)
 * @param {string} language - 언어 (ko/en)
 * @returns {Promise<Object>} suggestions 배열 포함 응답
 */
export async function generateTemplate({ situation, topic, tone = 'polite', language = 'ko' }) {
  try {
    const response = await axios.post(`${API_BASE}/template`, {
      situation,
      topic,
      tone,
      language
    })
    return response.data
  } catch (error) {
    console.error('Generate template error:', error)
    throw new Error(error.response?.data?.detail || '템플릿 생성 중 오류가 발생했습니다')
  }
}
