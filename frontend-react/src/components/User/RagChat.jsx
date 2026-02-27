import React, { useState, useRef, useEffect } from 'react';
import { ragService } from '../../services/ragService';
import { Button, Input, List, Avatar, Spin, message, Card } from 'antd';
import { SendOutlined, SyncOutlined, DatabaseOutlined, UploadOutlined, CloseOutlined, MessageOutlined, DownloadOutlined } from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';

// 스타일
const styles = {
    floatingContainer: {
        position: 'fixed',
        bottom: '30px',
        right: '30px',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '16px',
    },
    toggleButton: {
        width: '64px',
        height: '64px',
        borderRadius: '32px',
        background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', // Modern Gradient
        border: 'none',
        boxShadow: '0 8px 20px rgba(99, 102, 241, 0.4)',
        cursor: 'pointer',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontSize: '28px',
        color: 'white',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    },
    chatWindow: (isOpen) => ({
        display: isOpen ? 'flex' : 'none',
        flexDirection: 'column',
        width: '420px',
        height: '650px',
        backgroundColor: '#1E1E1E', // Dark Theme Base
        borderRadius: '24px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        overflow: 'hidden',
        boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
        animation: 'slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        transformOrigin: 'bottom right',
    }),
    header: {
        padding: '20px 24px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'rgba(30, 30, 30, 0.95)',
        backdropFilter: 'blur(10px)',
    },
    headerTitle: {
        color: '#fff',
        fontSize: '18px',
        fontWeight: '600',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        background: 'linear-gradient(90deg, #fff, #a5b4fc)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
    },
    messageList: {
        flex: 1,
        padding: '24px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        backgroundColor: '#171717',
    },
    inputArea: {
        padding: '20px',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        backgroundColor: '#1E1E1E',
        display: 'flex',
        gap: '12px',
        alignItems: 'flex-end',
    },
    messageBubble: (isUser) => ({
        maxWidth: '85%',
        padding: '14px 18px',
        borderRadius: isUser ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
        background: isUser
            ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)'
            : '#262626',
        color: isUser ? '#fff' : '#e5e5e5',
        alignSelf: isUser ? 'flex-end' : 'flex-start',
        boxShadow: isUser
            ? '0 4px 12px rgba(99, 102, 241, 0.25)'
            : '0 2px 8px rgba(0,0,0,0.1)',
        lineHeight: '1.6',
        fontSize: '15px',
        position: 'relative',
    }),
    sourceBox: {
        marginTop: '10px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '6px',
    },
    sourceTag: {
        fontSize: '11px',
        padding: '4px 8px',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: '12px',
        color: '#a5b4fc',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
    },
    typingIndicator: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        color: '#9ca3af',
        fontSize: '13px',
        padding: '8px 12px',
        background: '#262626',
        borderRadius: '20px',
        width: 'fit-content',
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
                sources: result.sources,
                userQuestion: userMsg.content,  // CSV export용
                data: result.data || []  // 원본 데이터 저장 (CSV export용)
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

    // CSV 다운로드 핸들러 (API 호출 없이 저장된 데이터 사용)
    const handleExport = (aiMessage) => {
        try {
            const data = aiMessage.data || [];

            if (!data || data.length === 0) {
                message.error('다운로드할 데이터가 없습니다.');
                return;
            }

            // AI 답변에서 메타데이터 추출
            const content = aiMessage.content || '';
            const question = aiMessage.userQuestion || '';

            // 간단한 파싱 (마크다운 섹션 추출)
            const summaryMatch = content.match(/### 1\. 요약.*?\n([\s\S]*?)(?=###|$)/);
            const analysisMatch = content.match(/### 2\. 상세 분석.*?\n([\s\S]*?)(?=###|$)/);
            const conclusionMatch = content.match(/### 3\. 결론.*?\n([\s\S]*?)(?=###|$)/);

            const summary = summaryMatch ? summaryMatch[1].trim().replace(/\n/g, ' ') : '';
            const analysis = analysisMatch ? analysisMatch[1].trim().replace(/\n/g, ' ') : '';
            const conclusion = conclusionMatch ? conclusionMatch[1].trim().replace(/\n/g, ' ') : '';

            // CSV 구조: 메타데이터 + 빈 줄 + 데이터 테이블
            const metadataRows = [
                ['질문', `"${question.replace(/"/g, '""')}"`],
                ['요약', `"${summary.replace(/"/g, '""')}"`],
                ['상세분석', `"${analysis.replace(/"/g, '""')}"`],
                ['결론', `"${conclusion.replace(/"/g, '""')}"`],
                [], // 빈 줄
                ['=== 상세 데이터 ==='], // 구분선
                []
            ];

            // 데이터 테이블 헤더
            const headers = ['댓글내용', '작성자', '위험도', '카테고리', '분석시간'];

            // 데이터 행
            const rows = data.map(item => [
                item.댓글내용 ? `"${item.댓글내용.replace(/"/g, '""')}"` : '',
                item.작성자 || '',
                item.위험도 || 0,
                item.카테고리 || '',
                item.분석시간 || ''
            ]);

            // CSV 문자열 생성 (BOM 추가로 Excel 호환)
            const csvContent = '\uFEFF' +
                [...metadataRows, headers, ...rows]
                    .map(row => row.map(cell =>
                        typeof cell === 'string' && (cell.includes(',') || cell.includes('\n'))
                            ? cell.startsWith('"') ? cell : `"${cell}"`
                            : cell
                    ).join(','))
                    .join('\n');

            // 다운로드
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `rag_export_${new Date().toISOString().slice(0, 10)}.csv`;
            link.click();
            URL.revokeObjectURL(link.href);

            message.success('CSV 파일 다운로드 완료!');
        } catch (error) {
            console.error('Error exporting to CSV:', error);
            message.error('다운로드 실패: ' + error.message);
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
                        <div key={idx} style={{ ...styles.messageBubble(msg.role === 'user'), position: 'relative' }}>
                            {msg.role === 'ai' || msg.role === 'system' ? (
                                <div style={{ lineHeight: '1.6' }}>
                                    <ReactMarkdown
                                        components={{
                                            p: ({ node, ...props }) => <p style={{ margin: '0 0 8px 0' }} {...props} />,
                                            ul: ({ node, ...props }) => <ul style={{ margin: '0 0 8px 0', paddingLeft: '20px' }} {...props} />,
                                            li: ({ node, ...props }) => <li style={{ marginBottom: '4px' }} {...props} />,
                                            strong: ({ node, ...props }) => <strong style={{ color: '#a5b4fc', fontWeight: '600' }} {...props} />,
                                            table: ({ node, ...props }) => <table style={{ borderCollapse: 'collapse', width: '100%', marginTop: '8px' }} {...props} />,
                                            th: ({ node, ...props }) => <th style={{ border: '1px solid rgba(255,255,255,0.2)', padding: '6px', backgroundColor: 'rgba(99,102,241,0.2)' }} {...props} />,
                                            td: ({ node, ...props }) => <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '6px' }} {...props} />
                                        }}
                                    >
                                        {msg.content}
                                    </ReactMarkdown>
                                </div>
                            ) : (
                                msg.content
                            )}

                            {/* CSV 다운로드 버튼 (AI 답변인 경우 항상 표시) */}
                            {msg.role === 'ai' && (
                                <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
                                    <Button
                                        type="primary"
                                        size="small"
                                        icon={<DownloadOutlined />}
                                        onClick={() => handleExport(msg)}
                                        style={{
                                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                            border: 'none',
                                            borderRadius: '8px',
                                            fontSize: '13px',
                                            fontWeight: '600',
                                            padding: '4px 12px',
                                            height: 'auto',
                                            boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
                                        }}
                                    >
                                        CSV 다운로드
                                    </Button>
                                </div>
                            )}

                            {/* 출처 표시 (AI 답변일 경우) */}
                            {msg.sources && msg.sources.length > 0 && (
                                <div style={styles.sourceBox}>
                                    {msg.sources.map((s, idx) => (
                                        <span key={idx} style={styles.sourceTag}>
                                            📄 {s.split('\\').pop().split('/').pop()}
                                        </span>
                                    ))}
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
                        placeholder="무엇이든 물어보세요..."
                        style={{
                            backgroundColor: '#262626',
                            color: '#fff',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '12px',
                            padding: '10px 16px'
                        }}
                        disabled={isLoading}
                    />
                    <Button
                        type="primary"
                        icon={<SendOutlined />}
                        onClick={handleSend}
                        loading={isLoading}
                        style={{
                            height: '42px',
                            borderRadius: '12px',
                            background: '#6366f1',
                            border: 'none',
                            width: '42px',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center'
                        }}
                    >
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
