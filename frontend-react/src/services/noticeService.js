import api from './api';

export const noticeService = {
    // 전체 목록 조회 (유저용)
    getAll: async () => {
        try {
            const response = await api.get('/notices/all');
            return response.data;
        } catch (error) {
            console.error('공지사항 조회 실패:', error);
            throw error;
        }
    },

    // 페이징된 목록 조회 (관리자용)
    getPaged: async (page = 0, size = 10) => {
        try {
            const response = await api.get(`/notices?page=${page}&size=${size}`);
            return response.data;
        } catch (error) {
            console.error('공지사항 페이징 조회 실패:', error);
            throw error;
        }
    },

    // 상세 조회
    getById: async (id) => {
        try {
            const response = await api.get(`/notices/${id}`);
            return response.data;
        } catch (error) {
            console.error('공지사항 상세 조회 실패:', error);
            throw error;
        }
    },

    // 생성
    create: async (data) => {
        try {
            const response = await api.post('/notices', data);
            return response.data;
        } catch (error) {
            console.error('공지사항 생성 실패:', error);
            throw error;
        }
    },

    // 수정
    update: async (id, data) => {
        try {
            const response = await api.put(`/notices/${id}`, data);
            return response.data;
        } catch (error) {
            console.error('공지사항 수정 실패:', error);
            throw error;
        }
    },

    // 삭제
    delete: async (id) => {
        try {
            const response = await api.delete(`/notices/${id}`);
            return response.data;
        } catch (error) {
            console.error('공지사항 삭제 실패:', error);
            throw error;
        }
    },

    // 고정/해제
    togglePin: async (id) => {
        try {
            const response = await api.put(`/notices/${id}/pin`);
            return response.data;
        } catch (error) {
            console.error('공지사항 고정 실패:', error);
            throw error;
        }
    }
};

export default noticeService;