/**
 * Suggestion API Service
 * Handles all suggestion-related API calls
 */
import api from '../services/api'

/**
 * Get all suggestions (Admin only)
 */// 내 건의사항 조회 (페이징)
export const getMySuggestions = async ({ page = 0, size = 5 } = {}) => {
    const response = await api.get(`/suggestions`, {
        params: { page, size }
    })
    return response.data
}

// 모든 건의사항 조회 (관리자용 - 페이징)
export const getAllSuggestions = async ({ page = 0, size = 5 } = {}) => {
    const response = await api.get(`/suggestions/all`, {
        params: { page, size }
    })
    return response.data
}

/**
 * Get a specific suggestion by ID
 */
export const getSuggestion = async (suggestionId) => {
    const response = await api.get(`/suggestions/${suggestionId}`)
    return response.data
}

/**
 * Create a new suggestion
 */
export const createSuggestion = async ({ title, content }) => {
    const response = await api.post('/suggestions', { title, content })
    return response.data
}

/**
 * Admin responds to a suggestion
 */
export const respondToSuggestion = async ({ suggestionId, response, status }) => {
    const responseData = await api.post(`/suggestions/${suggestionId}/response`, {
        response,
        status
    })
    return responseData.data
}

/**
 * Update suggestion status (Admin only)
 */
export const updateSuggestionStatus = async ({ suggestionId, status }) => {
    const response = await api.put(`/suggestions/${suggestionId}/status`, { status })
    return response.data
}
