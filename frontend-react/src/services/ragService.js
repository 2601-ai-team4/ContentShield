import axios from 'axios';

// FastAPI 백엔드 주소 (개발 환경)
const API_URL = 'http://localhost:8000';

export const ragService = {
    // 문서 로드 (벡터 DB 생성)
    loadDocuments: async (directoryPath = 'docs') => {
        try {
            const response = await axios.post(`${API_URL}/rag/load`, {
                directory_path: directoryPath
            });
            return response.data;
        } catch (error) {
            console.error('Error loading documents:', error);
            throw error;
        }
    },

    // RAG 질문하기
    chat: async (question) => {
        try {
            const response = await axios.post(`${API_URL}/rag/chat`, {
                question: question
            });
            return response.data;
        } catch (error) {
            console.error('Error querying RAG:', error);
            throw error;
        }
    },

    // 벡터 DB 초기화
    clearDatabase: async () => {
        try {
            const response = await axios.delete(`${API_URL}/rag/clear`);
            return response.data;
        } catch (error) {
            console.error('Error clearing database:', error);
            throw error;
        }
    }
};
