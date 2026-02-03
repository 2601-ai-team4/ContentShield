import api from './api';

export const noticeService = {
    getAll: async () => {
        const response = await api.get('/notices');
        // Page 객체 대응: content가 있으면 content를, 없으면 데이터를 직접 반환
        return response.data.content || response.data;
    },
    getById: (id) => api.get(`/notices/${id}`),
    create: (data) => api.post('/notices', data),
    update: (id, data) => api.put(`/notices/${id}`, data),
    delete: (id) => api.delete(`/notices/${id}`),
    togglePin: (id) => api.put(`/notices/${id}/pin`)
};