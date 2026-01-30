// ==================== NoticeList.jsx ====================
// 위치: frontend/src/components/User/NoticeList.jsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Bell, Pin, Calendar, Eye, ChevronRight, Filter } from 'lucide-react';
import { noticeService } from '../../services/noticeService';

const Card = ({ children, className = "" }) => (
    <div className={`bg-slate-900 text-slate-100 rounded-xl border border-slate-800 shadow-xl ${className}`}>{children}</div>
);
const CardHeader = ({ children, className = "" }) => <div className={`flex flex-col space-y-1.5 p-6 ${className}`}>{children}</div>;
const CardTitle = ({ children, className = "" }) => <h3 className={`text-xl font-bold tracking-tight text-white ${className}`}>{children}</h3>;
const CardContent = ({ children, className = "" }) => <div className={`p-6 pt-0 ${className}`}>{children}</div>;

export default function NoticeList() {
    const navigate = useNavigate();
    const [selectedType, setSelectedType] = useState('ALL');
    const [page, setPage] = useState(0);
    const pageSize = 10;

    // ✅ 페이징된 공지사항 조회
    const { data: pageData, isLoading } = useQuery({
        queryKey: ['notices', page, selectedType],
        queryFn: () => noticeService.getPaged(page, pageSize),
    });

    const notices = pageData?.content || [];
    const totalPages = pageData?.totalPages || 1;
    const currentPage = pageData?.number || 0;
    const totalElements = pageData?.totalElements || 0;

    // 타입별 필터링 (클라이언트 사이드)
    const filteredNotices = notices.filter(notice =>
        selectedType === 'ALL' || notice.noticeType === selectedType
    );

    const handleNoticeClick = (noticeId) => {
        // ✅ NoticeDetail 페이지로 이동
        navigate(`/notices/${noticeId}`);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="text-slate-500 animate-pulse">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 p-8">
            <div className="max-w-5xl mx-auto">
                {/* 헤더 */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3 mb-2">
                        <Bell className="text-blue-400" />
                        공지사항
                    </h1>
                    <p className="text-slate-500">중요한 소식과 업데이트를 확인하세요.</p>
                </div>

                {/* 필터 */}
                <Card className="mb-6">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                            <Filter className="text-slate-500" size={18} />
                            <span className="text-sm text-slate-400 mr-3">필터:</span>
                            <div className="flex gap-2 flex-wrap">
                                {['ALL', 'GENERAL', 'MAINTENANCE', 'UPDATE', 'URGENT'].map(type => (
                                    <button
                                        key={type}
                                        onClick={() => {
                                            setSelectedType(type);
                                            setPage(0); // 필터 변경 시 첫 페이지로
                                        }}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${selectedType === type
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                            }`}
                                    >
                                        {type === 'ALL' ? '전체' : getTypeLabel(type)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 공지사항 목록 */}
                <div className="space-y-3">
                    {filteredNotices.length > 0 ? (
                        filteredNotices.map((notice) => (
                            <Card key={notice.noticeId} className="overflow-hidden hover:border-blue-500/30 transition-all">
                                <div
                                    onClick={() => handleNoticeClick(notice.noticeId)}
                                    className="p-6 cursor-pointer hover:bg-slate-800/50 transition-all group"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                {notice.isPinned && (
                                                    <Pin size={18} className="text-blue-400 fill-blue-400/20" />
                                                )}
                                                <h3 className="text-lg font-bold text-white group-hover:text-blue-300 transition-colors">
                                                    {notice.title}
                                                </h3>
                                                <span className={`px-2.5 py-1 text-[10px] font-bold rounded ${getNoticeTypeStyle(notice.noticeType)}`}>
                                                    {getTypeLabel(notice.noticeType)}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-4 text-xs text-slate-500">
                                                <span className="flex items-center gap-1">
                                                    <Calendar size={14} />
                                                    {new Date(notice.createdAt).toLocaleDateString('ko-KR', {
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric'
                                                    })}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Eye size={14} />
                                                    조회 {notice.viewCount}
                                                </span>
                                            </div>

                                            <p className="mt-3 text-sm text-slate-400 line-clamp-2">
                                                {notice.content}
                                            </p>
                                        </div>

                                        <ChevronRight size={20} className="text-slate-600 transition-transform group-hover:translate-x-1 flex-shrink-0 ml-4" />
                                    </div>
                                </div>
                            </Card>
                        ))
                    ) : (
                        <Card>
                            <CardContent className="p-12 text-center">
                                <Bell className="mx-auto mb-4 text-slate-700" size={48} />
                                <p className="text-slate-500">등록된 공지사항이 없습니다.</p>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* ✅ 페이징 UI */}
                {totalPages > 1 && (
                    <div className="flex justify-center items-center mt-10 gap-4">
                        <button
                            disabled={currentPage === 0}
                            onClick={() => setPage(p => Math.max(0, p - 1))}
                            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            이전
                        </button>

                        <div className="flex items-center gap-2">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                let pageNum;
                                if (totalPages <= 5) {
                                    pageNum = i;
                                } else if (currentPage < 3) {
                                    pageNum = i;
                                } else if (currentPage > totalPages - 4) {
                                    pageNum = totalPages - 5 + i;
                                } else {
                                    pageNum = currentPage - 2 + i;
                                }

                                return (
                                    <button
                                        key={i}
                                        onClick={() => setPage(pageNum)}
                                        className={`w-10 h-10 rounded-lg font-semibold transition-all ${currentPage === pageNum
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                            }`}
                                    >
                                        {pageNum + 1}
                                    </button>
                                );
                            })}
                        </div>

                        <button
                            disabled={currentPage >= totalPages - 1}
                            onClick={() => setPage(p => p + 1)}
                            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            다음
                        </button>

                        <span className="text-slate-500 text-sm ml-2">
                            {currentPage + 1} / {totalPages} 페이지 (총 {totalElements}개)
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}

function getTypeLabel(type) {
    const labels = {
        GENERAL: '일반',
        MAINTENANCE: '점검',
        UPDATE: '업데이트',
        URGENT: '긴급'
    };
    return labels[type] || type;
}

function getNoticeTypeStyle(type) {
    const styles = {
        GENERAL: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
        MAINTENANCE: 'bg-orange-500/10 text-orange-400 border border-orange-500/20',
        UPDATE: 'bg-green-500/10 text-green-400 border border-green-500/20',
        URGENT: 'bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse'
    };
    return styles[type] || styles.GENERAL;
}