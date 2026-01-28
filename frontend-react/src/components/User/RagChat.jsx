import React, { useState, useRef, useEffect } from 'react';
import { ragService } from '../../services/ragService';
import { Button, Input, List, Avatar, Spin, message, Card } from 'antd';
import { SendOutlined, SyncOutlined, DatabaseOutlined, UploadOutlined, CloseOutlined, MessageOutlined } from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';

// 스타일
const styles = {
    floatingContainer: {
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '16px',
    },
    toggleButton: {
        width: '60px',
        height: '60px',
        borderRadius: '30px',
        backgroundColor: '#007ACC',
        border: 'none',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        cursor: 'pointer',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontSize: '24px',
        color: 'white',
        transition: 'all 0.3s ease',
    },
    chatWindow: (isOpen) => ({
        display: isOpen ? 'flex' : 'none',
        flexDirection: 'column',
        width: '400px',
        height: '600px',
        backgroundColor: '#1E1E1E',
        borderRadius: '16px',
        border: '1px solid #333',
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        animation: 'slideIn 0.3s ease-out',
    }),
    header: {
        padding: '16px',
        borderBottom: '1px solid #333',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#252526',
    },
    headerTitle: {
        color: '#E0E0E0',
        fontSize: '16px',
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
    },
    messageList: {
        flex: 1,
        padding: '16px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        backgroundColor: '#1E1E1E',
    },
    inputArea: {
        padding: '16px',
        borderTop: '1px solid #333',
        backgroundColor: '#252526',
        display: 'flex',
        gap: '8px',
    },
    messageBubble: (isUser) => ({
        maxWidth: '80%',
        padding: '12px 16px',
        borderRadius: '12px',
        backgroundColor: isUser ? '#007ACC' : '#333333',
        color: '#E0E0E0',
        alignSelf: isUser ? 'flex-end' : 'flex-start',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        lineHeight: '1.5',
        fontSize: '14px',
    }),
    sourceBox: {
        marginTop: '8px',
        padding: '8px',
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderRadius: '6px',
        fontSize: '12px',
        color: '#aaa',
    },
    typingIndicator: {
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        color: '#888',
        fontSize: '12px',
        marginTop: '4px',
    }
};

const RagChat = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'system', content: '안녕하세요! 문서에 대해 궁금한 점을 물어보세요. (예: "이 문서의 요약해줘")' }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isDBLoading, setIsDBLoading] = useState(false);
    const messagesEndRef = useRef(null);

    // 자동 스크롤
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // 문서 로드 핸들러
    const handleLoadDocs = async () => {
        setIsDBLoading(true);
        try {
            // 기본 경로 'docs' 로드
            const result = await ragService.loadDocuments('docs');
            message.success(`문서 로드 완료! (${result.count}개 파일, ${result.chunks} 청크)`);
            setMessages(prev => [...prev, { role: 'system', content: `✅ 문서 로드 완료: ${result.count}개 파일이 준비되었습니다.` }]);
        } catch (error) {
            if (error.response?.status === 503) {
                message.warning('RAG 서비스가 켜져 있는지 확인해주세요.');
            } else {
                message.error('문서 로드 실패: ' + (error.response?.data?.detail || error.message));
            }
        } finally {
            setIsDBLoading(false);
        }
    };

    // 메시지 전송 핸들러
    const handleSend = async () => {
        if (!inputValue.trim()) return;

        const userMsg = { role: 'user', content: inputValue };
        setMessages(prev => [...prev, userMsg]);
        setInputValue('');
        setIsLoading(true);

        try {
            const result = await ragService.chat(userMsg.content);

            const aiResponse = {
                role: 'ai',
                content: result.answer,
                sources: result.sources
            };

            setMessages(prev => [...prev, aiResponse]);
        } catch (error) {
            console.error(error);
            const errorMsg = { role: 'system', content: '❌ 답변 생성 중 오류가 발생했습니다.' };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={styles.floatingContainer}>
            {/* 스타일 애니메이션 정의 */}
            <style>
                {`
                    @keyframes slideIn {
                        from { opacity: 0; transform: translateY(20px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                `}
            </style>

            {/* 채팅 창 */}
            <div style={styles.chatWindow(isOpen)}>
                {/* 헤더 */}
                <div style={styles.header}>
                    <div style={styles.headerTitle}>
                        <DatabaseOutlined style={{ color: '#007ACC' }} />
                        <span>AI 문서 질문 (Beta)</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <Button
                            type="text"
                            icon={isDBLoading ? <Spin size="small" /> : <SyncOutlined />}
                            onClick={handleLoadDocs}
                            disabled={isDBLoading}
                            style={{ color: '#aaa' }}
                            title="DB 연결 확인"
                        />
                        <Button
                            type="text"
                            icon={<CloseOutlined />}
                            onClick={() => setIsOpen(false)}
                            style={{ color: '#aaa' }}
                        />
                    </div>
                </div>

                {/* 메시지 영역 */}
                <div style={styles.messageList}>
                    {messages.map((msg, idx) => (
                        <div key={idx} style={styles.messageBubble(msg.role === 'user')}>
                            {msg.role === 'ai' || msg.role === 'system' ? (
                                <ReactMarkdown>{msg.content}</ReactMarkdown>
                            ) : (
                                msg.content
                            )}

                            {/* 출처 표시 (AI 답변일 경우) */}
                            {msg.sources && msg.sources.length > 0 && (
                                <div style={styles.sourceBox}>
                                    📚 참고: {msg.sources.map(s => s.split('\\').pop().split('/').pop()).join(', ')}
                                </div>
                            )}
                        </div>
                    ))}
                    {isLoading && (
                        <div style={{ ...styles.messageBubble(false), backgroundColor: 'transparent', padding: 0 }}>
                            <div style={styles.typingIndicator}>
                                <Spin size="small" /> AI가 답변을 작성 중입니다...
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* 입력 영역 */}
                <div style={styles.inputArea}>
                    <Input
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onPressEnter={handleSend}
                        placeholder="질문 입력..."
                        style={{ backgroundColor: '#333', color: '#fff', border: 'none' }}
                        disabled={isLoading}
                    />
                    <Button
                        type="primary"
                        icon={<SendOutlined />}
                        onClick={handleSend}
                        loading={isLoading}
                    >
                        전송
                    </Button>
                </div>
            </div>

            {/* 토글 버튼 */}
            <button
                style={styles.toggleButton}
                onClick={() => setIsOpen(!isOpen)}
                onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
                {isOpen ? <CloseOutlined /> : <MessageOutlined />}
            </button>
        </div>
    );
};

export default RagChat;
