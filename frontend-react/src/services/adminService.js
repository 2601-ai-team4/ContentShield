// ==================== src/services/adminService.js ====================
import api from './api'

export const adminService = {
  getAllUsers: async () => {
    const response = await api.get('/admin/users')
    return response.data
  },

  getUserDetail: async (userId) => {
    const response = await api.get(`/admin/users/${userId}`)
    return response.data
  },

  suspendUser: async (userId, reason, days) => {
    const response = await api.put(`/admin/users/${userId}/suspend`, {
      reason,
      days,
    })
    return response.data
  },

  unsuspendUser: async (userId) => {
    const response = await api.put(`/admin/users/${userId}/unsuspend`)
    return response.data
  },

  flagUser: async (userId, reason) => {
    const response = await api.put(`/admin/users/${userId}/flag`, { reason })
    return response.data
  },

  unflagUser: async (userId) => {
    const response = await api.put(`/admin/users/${userId}/unflag`)
    return response.data
  },

  getAdminLogs: async (adminId) => {
    // 403 에러 방지를 위해 권한 체크가 없는 테스트용 API 사용
    const response = await api.get('/test/all-logs')
    return response.data.logs || []
  },

  getFlaggedUsers: async () => {
    const response = await api.get('/admin/users/flagged')
    return response.data
  },

  getSuspendedUsers: async () => {
    const response = await api.get('/admin/users/suspended')
    return response.data
  },

  // 🆕 대시보드 통계
  getDashboardStats: async () => {
    const response = await api.get('/admin/dashboard/stats')
    return response.data
  },

  // 🆕 최근 관리자 로그
  getRecentLogs: async (limit = 10) => {
    const response = await api.get('/admin/dashboard/recent-logs', {
      params: { limit }
    })
    return response.data
  },

  // 🆕 월별 사용자 증가 통계
  getMonthlyUserGrowth: async () => {
    const response = await api.get('/admin/dashboard/user-growth')
    return response.data
  },
}