// src/components/User/NoticeDetail.jsx
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Pin, Calendar, Eye, Bell } from 'lucide-react';
import { noticeService } from '../../services/noticeService';

const Card = ({ children, className = "" }) => (
    <div className={`bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 shadow-2xl ${className}`}>{children}</div>
);

export default function NoticeDetail() {
    const { noticeId } = useParams();
    const navigate = useNavigate();

    const { data: notice, isLoading, error } = useQuery({
        queryKey: ['notice', noticeId],
        queryFn: () => noticeService.getById(noticeId),
        enabled: !!noticeId,
    });

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="text-slate-400 animate-pulse text-xl">로딩 중...</div>
            </div>
        );
    }

    if (error || !notice) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-6 p-6">
                <Bell className="text-slate-700" size={80} />
                <h2 className="text-2xl font-bold text-slate-300">공지사항을 찾을 수 없습니다</h2>
                <button
                    onClick={() => navigate('/notices')}
                    className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-blue-900/30"
                >
                    목록으로 돌아가기
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 py-10 px-6 md:px-12 lg:px-20">
            <div className="max-w-4xl mx-auto">
                <button
                    onClick={() => navigate('/notices')}
                    className="mb-10 flex items-center gap-3 text-slate-400 hover:text-white transition-colors group"
                >
                    <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="text-lg">공지사항 목록</span>
                </button>

                <Card>
                    <div className="p-8 md:p-12">
                        <div className="mb-10">
                            <div className="flex flex-wrap items-center gap-4 mb-4">
                                {notice.isPinned && (
                                    <div className="flex items-center gap-2 px-4 py-1.5 bg-yellow-500/10 text-yellow-400 rounded-full border border-yellow-500/30">
                                        <Pin size={18} className="fill-yellow-400/70" />
                                        <span className="font-medium">고정 공지</span>
                                    </div>
                                )}
                                <span className={`px-4 py-1.5 rounded-full text-sm font-medium ${getNoticeTypeStyle(notice.noticeType)}`}>
                                    {getTypeLabel(notice.noticeType)}
                                </span>
                            </div>

                            <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight mb-6">
                                {notice.title}
                            </h1>

                            <div className="flex flex-wrap gap-6 text-sm text-slate-400">
                                <span className="flex items-center gap-2">
                                    <Calendar size={18} />
                                    {new Date(notice.createdAt).toLocaleString('ko-KR', {
                                        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                    })}
                                </span>
                                <span className="flex items-center gap-2">
                                    <Eye size={18} />
                                    조회 {notice.viewCount.toLocaleString()}회
                                </span>
                            </div>
                        </div>

                        <div className="prose prose-invert prose-lg max-w-none">
                            <div className="whitespace-pre-wrap leading-relaxed text-slate-200 text-[1.05rem]">
                                {notice.content}
                            </div>
                        </div>

                        {notice.updatedAt && notice.updatedAt !== notice.createdAt && (
                            <div className="mt-16 pt-8 border-t border-slate-800 text-sm text-slate-500">
                                최종 수정: {new Date(notice.updatedAt).toLocaleString('ko-KR')}
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
}

function getTypeLabel(type) {
    const map = { GENERAL: '일반', MAINTENANCE: '점검', UPDATE: '업데이트', URGENT: '긴급' };
    return map[type] || type;
}

function getNoticeTypeStyle(type) {
    const map = {
        GENERAL: 'bg-blue-600/15 text-blue-300 border border-blue-500/40',
        MAINTENANCE: 'bg-orange-600/15 text-orange-300 border border-orange-500/40',
        UPDATE: 'bg-green-600/15 text-green-300 border border-green-500/40',
        URGENT: 'bg-red-600/15 text-red-300 border border-red-500/40 animate-pulse'
    };
    return map[type] || map.GENERAL;
}