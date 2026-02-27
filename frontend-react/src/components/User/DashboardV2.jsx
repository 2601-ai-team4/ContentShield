/** [File: DashboardV2.jsx / Date: 2026-01-22 / 설명: 대시보드 실시간 통계 데이터 연동 로직 복구 및 UI 레이아웃 수정] */
/** [File: DashboardV2.jsx / Date: 2026-01-22 / 작성자: Antigravity / 설명: 대시보드 메뉴별 독립적 Top-level URL 라우팅 적용 및 30초 간격 실시간 데이터 자동 갱신(setInterval) 로직 추가] */
/** [File: DashboardV2.jsx / Date: 2026-01-22 / 작성자: 윤혜정 / 설명: AI 분석 연동 및 프로필 관리 기능 추가] */
/** [File: DashboardV2.jsx / Date: 2026-01-29 / 작성자: 원종성 / 설명: 대시보드 페이지 공지사항 표시 기능 추가 및 공지사항 리스트 페이지 추가] */
/** [File: DashboardV2.jsx / Date: 2026-01-29 / 작성자: 원종성 / 설명: 대시보드 페이지 공지사항 표시 기능 추가 및 공지사항 리스트 페이지 추가] */
import { blockedWordService } from '../../services/blockedWordService';
import React, { useState, useEffect } from 'react';
import { userService } from '../../services/userService';
import analysisService from '../../services/analysisService';
import { commentService } from '../../services/commentService';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import {
  TrendingUp, Shield, AlertTriangle, CheckCircle, FileText, Plus, Edit, Trash2,
  Wand2, Copy, RotateCcw, Sparkles, UserX, Search, MessageSquare,
  User, Activity, Bell, Lock, Save, Send, Lightbulb,
  Youtube, Link as LinkIcon, Calendar as CalendarIcon, Globe, RefreshCw, Zap, Database, Pin,
  Eye, ChevronRight, Filter, Calendar, MessageCircle, X
} from 'lucide-react';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import dashboardService from '../../services/dashboardService';
import ProfileSettings from './ProfileSettings';
import TemplateManager from './TemplateManager';
import Statistics from './Statistics';
import { blacklistService } from '../../services/blacklistService';
import { noticeService } from '../../services/noticeService';
import { useQuery } from '@tanstack/react-query';
import NoticeDetail from './NoticeDetail';
import RagChat from './RagChat';
// --- [다크 모드 전용 UI 부품] ---
const Card = ({ children, className = "" }) => (
  <div className={`bg-slate-900 text-slate-100 rounded-xl border border-slate-800 shadow-xl ${className}`}>{children}</div>
);
const CardHeader = ({ children, className = "" }) => <div className={`flex flex-col space-y-1.5 p-6 ${className}`}>{children}</div>;
const CardTitle = ({ children, className = "" }) => <h3 className={`text-xl font-bold tracking-tight text-white ${className}`}>{children}</h3>;
const CardContent = ({ children, className = "" }) => <div className={`p-6 pt-0 ${className}`}>{children}</div>;

const Button = ({ children, variant = "primary", className = "", ...props }) => {
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-900/20",
    outline: "border border-slate-700 bg-transparent hover:bg-slate-800 text-slate-300",
    ghost: "hover:bg-slate-800 text-slate-400 hover:text-white",
    destructive: "bg-red-900/20 text-red-500 border border-red-900/50 hover:bg-red-900/30"
  };
  return <button className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-all active:scale-95 ${variants[variant]} ${className}`} {...props}>{children}</button>;
};

const Input = (props) => <input className="flex h-10 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-slate-600" {...props} />;
// 장소영~여기까지: Textarea 기본 스타일 (w-full은 기본 포함)
const Textarea = (props) => <textarea className="flex min-h-[80px] w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-slate-600" {...props} />;
// --- [메인 컴포넌트] ---
export default function DashboardV2() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  // ✅ /notices/:noticeId 패턴 체크
  const noticeDetailMatch = pathname.match(/^\/notices\/(\d+)$/);

  // ✅ NoticeDetail 페이지면 바로 렌더링
  if (noticeDetailMatch) {
    return <NoticeDetail />;
  }

  const menuItems = [
    { id: 'dashboard', label: '대시보드', icon: Shield, path: '/dashboard' },
    { id: 'analysis', label: 'AI 문장분석', icon: Search, path: '/aianalysis' },
    { id: 'management', label: '댓글분석', icon: MessageSquare, path: '/comments' },
    { id: 'blacklist', label: '블랙리스트', icon: UserX, path: '/blacklist' },
    { id: 'writing', label: 'AI 문장 템플릿', icon: Wand2, path: '/aiassistant' },
    { id: 'suggestions', label: '제안/건의', icon: Lightbulb, path: '/suggestions' },
    { id: 'stats', label: '통계', icon: Activity, path: '/statistics' },
    { id: 'profile', label: '설정', icon: User, path: '/profile' },
    { id: 'notices', label: '공지사항', icon: Bell, path: '/notices' },
  ];

  // URL 경로에 따라 activeTab 결정
  const activeTab = menuItems.find(item => item.path === pathname)?.id || 'dashboard';

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-200 font-sans">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800 bg-slate-900/50 backdrop-blur-xl hidden md:block">
        <div className="p-8">
          <h2 className="text-2xl font-black text-blue-500 flex items-center gap-2 tracking-tighter">
            <Shield className="fill-blue-500/20" /> GUARD AI
          </h2>
        </div>
        <nav className="px-4 space-y-2">
          {menuItems.map(item => (
            <RouterLink
              key={item.id}
              to={item.path}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${activeTab === item.id
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'text-slate-500 hover:bg-slate-800 hover:text-slate-200'
                }`}
            >
              <item.icon size={20} strokeWidth={activeTab === item.id ? 2.5 : 2} />
              {item.label}
            </RouterLink>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950">
        <div className="max-w-6xl mx-auto">
          {activeTab === 'dashboard' && <DashboardView />}
          {activeTab === 'analysis' && <CommentAnalysisView />}
          {activeTab === 'management' && <CommentManagementView />}
          {activeTab === 'blacklist' && <BlacklistView />}
          {activeTab === 'writing' && <TemplateManager />}
          {/* {activeTab === 'templates' && <TemplateView />} */}
          {activeTab === 'stats' && <StatisticsView />}
          {activeTab === 'profile' && <ProfileSettings />}
          {activeTab === 'notices' && <NoticeListView />}
          {pathname === '/' && <DashboardView />}
        </div>
      </main>

      {/* ✨ RAG Chat Component (has its own floating button) */}
      <RagChat />
    </div>
  );
}

// ✨ 아이콘 추가

// ✨ 아이콘 추가 (Moved to top)


// --- [1. Dashboard View] ---
function DashboardView() {
  const [stats, setStats] = useState({
    total: 0,
    malicious: 0,
    clean: 0,
    detectionRate: '0.0%',
    weeklyActivity: [],
    notifications: []
  });
  const [loading, setLoading] = useState(true);

  // 공지사항 state 추가 - 원종성
  const navigate = useNavigate();
  const [allNotices, setAllNotices] = useState([]);
  const [displayedNotices, setDisplayedNotices] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [noticesLoading, setNoticesLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await dashboardService.getStats();
        setStats(data);
      } catch (error) {
        console.error("Failed to fetch dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };

    // ✅ 공지사항 조회
    const fetchNotices = async () => {
      try {
        console.log('🔔 [Dashboard] 공지사항 조회 시작...');
        const data = await noticeService.getAll();
        console.log('🔔 [Dashboard] 공지사항 응답:', data);

        if (data && Array.isArray(data)) {
          const sortedNotices = data.sort((a, b) => {
            if (a.isPinned !== b.isPinned) return b.isPinned ? 1 : -1;
            return new Date(b.createdAt) - new Date(a.createdAt);
          });

          setAllNotices(sortedNotices);
          setDisplayedNotices(sortedNotices.slice(0, 2));  // ✅ 처음 2개만
          console.log('🔔 [Dashboard] 표시할 공지사항:', sortedNotices.slice(0, 2));
        }
      } catch (error) {
        console.error("❌ [Dashboard] 공지사항 조회 실패:", error);
      } finally {
        setNoticesLoading(false);
      }
    };

    // 최초 로드 시 실행
    fetchStats();
    // 공지사항 조회 - 원종성
    fetchNotices();

    // 30초마다 실시간 데이터 갱신 (setInterval 추가)
    const interval = setInterval(() => {
      console.log("[DEBUG] 실시간 데이터 새로고침 중...");
      fetchStats();
      fetchNotices();
    }, 30000);

    // 컴포넌트 언마운트 시 인터벌 제거 (Cleanup)
    return () => clearInterval(interval);
  }, []);

  // ✅ 공지사항 로테이션 (5초마다)
  useEffect(() => {
    if (allNotices.length <= 2) return;  // 2개 이하면 로테이션 불필요

    const rotationInterval = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const nextIndex = (prevIndex + 2) % allNotices.length;
        const endIndex = Math.min(nextIndex + 2, allNotices.length);

        // 끝에 도달하면 처음부터
        if (nextIndex >= allNotices.length - 1) {
          setDisplayedNotices(allNotices.slice(0, 2));
          return 0;
        }

        setDisplayedNotices(allNotices.slice(nextIndex, endIndex));
        return nextIndex;
      });
    }, 5000);  // 5초마다 로테이션

    return () => clearInterval(rotationInterval);
  }, [allNotices]);

  if (loading) {
    return <div className="text-center p-20 text-slate-500 text-sm animate-pulse">데이터를 불러오는 중...</div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h1 className="text-3xl font-bold text-white">🖥️ 대시보드</h1>
        <p className="text-slate-400">실시간 보안 및 댓글 분석 현황입니다.</p>
      </header>

      {/* ✅ 공지사항 카드 추가 (통계 카드 위에) */}
      {displayedNotices.length > 0 && (
        <Card>
          <CardHeader>
            {/* ✅ 제목과 더보기 버튼을 flex로 양쪽 배치 */}
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Bell className="text-blue-400" /> 📢 공지사항
              </CardTitle>
              <div className="flex items-center gap-3">
                {/* ✅ 로테이션 인디케이터 (3개 이상일 때만) */}
                {allNotices.length > 2 && (
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.ceil(allNotices.length / 2) }).map((_, idx) => (
                      <div
                        key={idx}
                        className={`w-1.5 h-1.5 rounded-full transition-all ${idx === Math.floor(currentIndex / 2)
                          ? 'bg-blue-400 w-4'
                          : 'bg-slate-700'
                          }`}
                      />
                    ))}
                  </div>
                )}
                <button
                  onClick={() => navigate('/notices')}
                  className="text-sm text-slate-400 hover:text-blue-400 transition-colors"
                >
                  더보기 →
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {displayedNotices.map((notice) => (
                <div
                  key={notice.noticeId}
                  className="flex items-start gap-3 p-4 rounded-lg bg-slate-800/80 border border-slate-600 hover:bg-blue-900/20 hover:border-blue-500/50 transition-all duration-200 cursor-pointer group"
                  onClick={() => window.location.href = `/notices/${notice.noticeId}`}  // ✅ 공지 클릭 시에도 이동
                >
                  {notice.isPinned && (
                    <Pin size={16} className="text-blue-400 mt-1 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-sm font-semibold text-white group-hover:text-blue-300 transition-colors">
                        {notice.title}
                      </span>
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${getNoticeTypeColor(notice.noticeType)}`}>
                        {getTypeLabel(notice.noticeType)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-2 group-hover:text-slate-300 transition-colors">
                      {notice.content}
                    </p>
                  </div>
                  <span className="text-[10px] text-slate-600 group-hover:text-slate-500 whitespace-nowrap transition-colors">
                    {new Date(notice.createdAt).toLocaleDateString('ko-KR', {
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="전체" value={stats.total.toLocaleString()} icon={Shield} color="text-blue-400" />
        <StatCard title="악성" value={stats.malicious.toLocaleString()} icon={AlertTriangle} color="text-red-400" />
        <StatCard title="정상" value={stats.clean.toLocaleString()} icon={CheckCircle} color="text-emerald-400" />
        <StatCard title="탐지율" value={stats.detectionRate} icon={TrendingUp} color="text-amber-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-3">
          <CardHeader><CardTitle>주간 분석 추이</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.weeklyActivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                  cursor={{ fill: '#1e293b' }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// --- [2. Blacklist View] ---
/*function BlacklistView() {
  const [list, setList] = useState([
    { id: '1', name: 'SpamUser123', identifier: 'UC123abc', count: 5, reason: 'Repeated spam', date: '2024-01-15' },
    { id: '2', name: 'TrollAccount', identifier: 'UC456def', count: 12, reason: 'Hate speech', date: '2024-01-10' }
  ]);
  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-white">🚫 Blacklist Management</h2>
          <p className="text-slate-400 text-sm">차단된 사용자 목록을 관리합니다.</p>
        </div>
        <Button className="gap-2"><Plus size={16} /> Add User</Button>
      </div>
      <Card><CardContent className="p-0 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-800/50 text-slate-400 text-xs font-bold uppercase tracking-wider">
            <tr>
              <th className="p-4">User Info</th>
              <th className="p-4">Violations</th>
              <th className="p-4">Primary Reason</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {list.map(i => (
              <tr key={i.id} className="hover:bg-slate-800/30 transition-colors group">
                <td className="p-4">
                  <div className="font-bold text-slate-200">{i.name}</div>
                  <div className="text-xs text-slate-400 font-mono">{i.identifier}</div>
                </td>
                <td className="p-4">
                  <span className="px-2 py-1 rounded bg-red-900/20 text-red-400 text-xs font-bold border border-red-900/30">{i.count} Hits</span>
                </td>
                <td className="p-4 text-slate-400 text-sm">{i.reason}</td>
                <td className="p-4 text-right">
                  <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100"><Trash2 size={16} className="text-red-500" /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent></Card>
    </div>
  );
}
*/
// --- [2. Blacklist View] ---
function BlacklistView() {
  const [activeTab, setActiveTab] = useState('users'); // 'users' or 'words'

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-white">🚫 블랙리스트 / 차단단어</h2>
          <p className="text-slate-400 text-sm">차단된 사용자 및 단어를 관리합니다.</p>
        </div>
      </div>

      {/* 탭 버튼 */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-lg font-semibold transition-all ${activeTab === 'users'
            ? 'bg-blue-600 text-white'
            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
        >
          <UserX size={16} className="inline mr-2" />
          차단 사용자
        </button>
        <button
          onClick={() => setActiveTab('words')}
          className={`px-4 py-2 rounded-lg font-semibold transition-all ${activeTab === 'words'
            ? 'bg-blue-600 text-white'
            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
        >
          <AlertTriangle size={16} className="inline mr-2" />
          차단 단어
        </button>
      </div>

      {/* 탭 컨텐츠 */}
      {activeTab === 'users' ? <BlockedUsersTab /> : <BlockedWordsTab />}
    </div>
  );
}

// --- 차단 사용자 탭 ---
function BlockedUsersTab() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 추가 모달 상태
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAuthorName, setNewAuthorName] = useState('');
  const [newAuthorId, setNewAuthorId] = useState('');
  const [newReason, setNewReason] = useState('');
  const [newCommentText, setNewCommentText] = useState('');

  useEffect(() => {
    loadBlacklistUsers();
  }, []);

  const loadBlacklistUsers = async () => {
    try {
      setLoading(true);
      const data = await blacklistService.getBlacklist();
      setList(data);
    } catch (err) {
      console.error('Failed to load blacklist:', err);
      setError('블랙리스트를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    if (!newAuthorName.trim() || !newAuthorId.trim()) {
      setError('이름과 ID를 모두 입력해주세요.');
      return;
    }

    try {
      const added = await blacklistService.addToBlacklist({
        authorName: newAuthorName.trim(),
        authorIdentifier: newAuthorId.trim(),
        reason: newReason.trim(),
        platform: 'YOUTUBE',
        commentText: newCommentText.trim()
      });
      setList([...list, added]);
      setShowAddModal(false);
      setNewAuthorName('');
      setNewAuthorId('');
      setNewReason('');
      setNewCommentText('');
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || '추가에 실패했습니다.');
    }
  };

  const handleDeleteUser = async (blacklistId) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;

    try {
      await blacklistService.removeFromBlacklist(blacklistId);
      setList(list.filter(item => item.blacklistId !== blacklistId));
    } catch (err) {
      setError(err.response?.data?.error || '삭제에 실패했습니다.');
    }
  };

  // 🆕 엑셀 다운로드 함수
  const handleExportExcel = () => {
    if (list.length === 0) {
      alert('다운로드할 데이터가 없습니다.');
      return;
    }

    // CSV 헤더
    const headers = ['사용자명', '사용자ID', '위반횟수', '차단사유', '문제댓글', '등록일시'];

    // CSV 데이터 행
    const rows = list.map(item => [
      item.blockedAuthorName || '',
      item.blockedAuthorIdentifier || '',
      item.violationCount || 0,
      item.reason || '',
      item.commentText ? `"${item.commentText.replace(/"/g, '""')}"` : '',
      item.createdAt ? new Date(item.createdAt).toLocaleString('ko-KR') : ''
    ]);

    // CSV 문자열 생성
    const csvContent = '\uFEFF' + [headers, ...rows]
      .map(row => row.map(cell =>
        typeof cell === 'string' && (cell.includes(',') || cell.includes('\n'))
          ? `"${cell}"`
          : cell
      ).join(','))
      .join('\n');

    // 다운로드
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `blacklist_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  // 🆕 날짜 포맷 함수
  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  if (loading) {
    return <div className="text-center p-10 text-slate-400">로딩 중...</div>;
  }

  return (
    <div className="space-y-4">
      {/* 에러 메시지 */}
      {error && (
        <div className="p-3 rounded-lg bg-red-900/20 text-red-400 border border-red-900/50 text-sm">
          {error}
        </div>
      )}

      {/* 추가 모달 */}
      {showAddModal && (
        <Card className="border-blue-900/50">
          <CardContent className="p-4 space-y-4">
            <h3 className="text-lg font-bold text-white">블랙리스트 추가</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">사용자 이름 *</label>
                <Input
                  value={newAuthorName}
                  onChange={(e) => setNewAuthorName(e.target.value)}
                  placeholder="예: @lovenjoy68"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">사용자 ID *</label>
                <Input
                  value={newAuthorId}
                  onChange={(e) => setNewAuthorId(e.target.value)}
                  placeholder="예: UC1234abc..."
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">차단 사유</label>
              <Input
                value={newReason}
                onChange={(e) => setNewReason(e.target.value)}
                placeholder="예: 반복적인 악성 댓글"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">문제 댓글 내용</label>
              <Textarea
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                placeholder="차단 사유가 된 댓글 내용..."
                className="h-20"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => {
                setShowAddModal(false);
                setNewAuthorName('');
                setNewAuthorId('');
                setNewReason('');
                setNewCommentText('');
                setError(null);
              }}>
                취소
              </Button>
              <Button onClick={handleAddUser}>
                <Plus size={16} className="mr-1" /> 추가
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0 overflow-hidden">
          {/* 🆕 버튼 영역: Add User + 엑셀 다운로드 */}
          <div className="p-4 border-b border-slate-800 flex justify-between items-center">
            <div className="text-sm text-slate-400">
              총 <span className="text-white font-bold">{list.length}</span>명
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2" onClick={handleExportExcel}>
                <FileText size={16} /> 엑셀 다운로드
              </Button>
              <Button className="gap-2" onClick={() => setShowAddModal(true)}>
                <Plus size={16} /> Add User
              </Button>
            </div>
          </div>

          {list.length === 0 ? (
            <div className="text-center p-10 text-slate-400">
              등록된 블랙리스트가 없습니다.
            </div>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-slate-800/50 text-slate-400 text-xs font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-4">유저 정보</th>
                  <th className="p-4">위반 횟수</th>
                  <th className="p-4">사유</th>
                  <th className="p-4">댓글</th>
                  <th className="p-4 text-right">등록일시</th>
                  <th className="p-4 text-right">해제</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {list.map(item => (
                  <tr key={item.blacklistId} className="hover:bg-slate-800/30 transition-colors group">
                    <td className="p-4">
                      <div className="font-bold text-slate-200">{item.blockedAuthorName}</div>
                      <div className="text-xs text-slate-400 font-mono">{item.blockedAuthorIdentifier}</div>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-1 rounded bg-red-900/20 text-red-400 text-xs font-bold border border-red-900/30">
                        {item.violationCount} Hits
                      </span>
                    </td>
                    <td className="p-4 text-slate-400 text-sm max-w-[150px]">
                      <p className="line-clamp-2">{item.reason || '-'}</p>
                    </td>
                    <td className="p-4 text-slate-400 text-sm max-w-[250px]">
                      {item.commentText ? (
                        <p className="line-clamp-2 text-xs bg-slate-800/50 p-2 rounded border border-slate-700" title={item.commentText}>
                          "{item.commentText}"
                        </p>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>
                    {/* 🆕 등록일시 컬럼 */}
                    <td className="p-4 text-right text-xs text-slate-400">
                      {formatDateTime(item.createdAt)}
                    </td>
                    {/* 🆕 해제 버튼 */}
                    <td className="p-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteUser(item.blacklistId)}
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-400"
                        title="블랙리스트 해제"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// --- 차단 단어 탭 ---
function BlockedWordsTab() {
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newWord, setNewWord] = useState('');
  const [newCategory, setNewCategory] = useState('PROFANITY');
  const [newSeverity, setNewSeverity] = useState('MEDIUM');
  const [error, setError] = useState(null);

  const categories = [
    { value: 'PROFANITY', label: '욕설' },
    { value: 'HATE', label: '혐오' },
    { value: 'VIOLENCE', label: '폭력' },
    { value: 'SEXUAL', label: '성적' },
    { value: 'SPAM', label: '스팸' },
  ];

  const severities = [
    { value: 'LOW', label: '낮음' },
    { value: 'MEDIUM', label: '보통' },
    { value: 'HIGH', label: '높음' },
    { value: 'CRITICAL', label: '심각' },
  ];

  useEffect(() => {
    loadBlockedWords();
  }, []);

  const loadBlockedWords = async () => {
    try {
      setLoading(true);
      const data = await blockedWordService.getBlockedWords();
      setWords(data);
    } catch (err) {
      console.error('Failed to load blocked words:', err);
      setError('차단 단어를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddWord = async () => {
    if (!newWord.trim()) return;

    try {
      const added = await blockedWordService.addBlockedWord(newWord.trim(), newCategory, newSeverity);
      setWords([...words, added]);
      setNewWord('');
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || '추가에 실패했습니다.');
    }
  };

  const handleDeleteWord = async (wordId) => {
    try {
      await blockedWordService.deleteBlockedWord(wordId);
      setWords(words.filter(w => w.wordId !== wordId));
    } catch (err) {
      setError(err.response?.data?.error || '삭제에 실패했습니다.');
    }
  };

  const handleToggleWord = async (wordId) => {
    try {
      const updated = await blockedWordService.toggleBlockedWord(wordId);
      setWords(words.map(w => w.wordId === wordId ? updated : w));
    } catch (err) {
      setError(err.response?.data?.error || '변경에 실패했습니다.');
    }
  };

  const getCategoryLabel = (value) => categories.find(c => c.value === value)?.label || value;
  const getSeverityColor = (severity) => {
    const colors = {
      LOW: 'text-green-400 bg-green-900/20 border-green-900/30',
      MEDIUM: 'text-yellow-400 bg-yellow-900/20 border-yellow-900/30',
      HIGH: 'text-orange-400 bg-orange-900/20 border-orange-900/30',
      CRITICAL: 'text-red-400 bg-red-900/20 border-red-900/30',
    };
    return colors[severity] || colors.MEDIUM;
  };

  if (loading) {
    return <div className="text-center p-10 text-slate-400">로딩 중...</div>;
  }

  return (
    <div className="space-y-4">
      {/* 에러 메시지 */}
      {error && (
        <div className="p-3 rounded-lg bg-red-900/20 text-red-400 border border-red-900/50 text-sm">
          {error}
        </div>
      )}

      {/* 단어 추가 폼 */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-3 items-end flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs text-slate-400 mb-1">차단 단어</label>
              <Input
                value={newWord}
                onChange={(e) => setNewWord(e.target.value)}
                placeholder="차단할 단어 입력..."
                onKeyPress={(e) => e.key === 'Enter' && handleAddWord()}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">카테고리</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="h-10 rounded-lg border border-slate-800 bg-slate-950 px-3 text-sm text-slate-200"
              >
                {categories.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">심각도</label>
              <select
                value={newSeverity}
                onChange={(e) => setNewSeverity(e.target.value)}
                className="h-10 rounded-lg border border-slate-800 bg-slate-950 px-3 text-sm text-slate-200"
              >
                {severities.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <Button onClick={handleAddWord} className="gap-2">
              <Plus size={16} /> 추가
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 단어 목록 */}
      <Card>
        <CardContent className="p-0 overflow-hidden">
          {words.length === 0 ? (
            <div className="text-center p-10 text-slate-400">
              등록된 차단 단어가 없습니다.
            </div>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-slate-800/50 text-slate-400 text-xs font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-4">단어</th>
                  <th className="p-4">카테고리</th>
                  <th className="p-4">심각도</th>
                  <th className="p-4">상태</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {words.map(word => (
                  <tr key={word.wordId} className={`hover:bg-slate-800/30 transition-colors group ${!word.isActive ? 'opacity-50' : ''}`}>
                    <td className="p-4">
                      <span className="font-bold text-slate-200">{word.word}</span>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-1 rounded bg-blue-900/20 text-blue-400 text-xs border border-blue-900/30">
                        {getCategoryLabel(word.category)}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs border ${getSeverityColor(word.severity)}`}>
                        {severities.find(s => s.value === word.severity)?.label}
                      </span>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => handleToggleWord(word.wordId)}
                        className={`px-2 py-1 rounded text-xs ${word.isActive
                          ? 'bg-emerald-900/20 text-emerald-400 border border-emerald-900/30'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}
                      >
                        {word.isActive ? '활성' : '비활성'}
                      </button>
                    </td>
                    <td className="p-4 text-right">
                      <Button
                        variant="ghost"
                        onClick={() => handleDeleteWord(word.wordId)}
                        className="opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={16} className="text-red-500" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// --- [3. AI Analysis View] ---
// function CommentAnalysisView() {
//   const [text, setText] = useState('');
//   return (
//     <div className="max-w-3xl mx-auto space-y-8 animate-in zoom-in-95 duration-500">
//       <div className="text-center space-y-2">
//         <div className="inline-flex p-3 rounded-2xl bg-blue-600/10 text-blue-500 mb-2"><Search size={32} /></div>
//         <h2 className="text-3xl font-black text-white">AI Content Analysis</h2>
//         <p className="text-slate-400">문장의 맥락을 분석하여 유해성을 판별합니다.</p>
//       </div>
//       <Card className="border-blue-900/30 bg-slate-900/80 backdrop-blur">
//         <CardContent className="p-8 space-y-6">
//           <Textarea 
//             placeholder="분석할 댓글이나 문장을 입력하세요..." 
//             value={text} 
//             onChange={(e)=>setText(e.target.value)} 
//             className="h-48 bg-slate-950/50 border-slate-800 text-lg p-6" 
//           />
//           <Button className="w-full h-14 text-lg font-bold shadow-blue-600/20" variant="primary">
//             <Sparkles className="mr-2" size={20} /> 실시간 분석하기
//           </Button>
//         </CardContent>
//       </Card>
//     </div>
//   );
// }

// --- [3. AI Analysis View] 윤혜정---
function CommentAnalysisView() {
  const [text, setText] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAnalyze = async () => {
    if (!text.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await analysisService.analyzeText(text.trim());
      setResult(response);
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err.message || '분석 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in zoom-in-95 duration-500">
      <div className="text-center space-y-2">
        <div className="inline-flex p-3 rounded-2xl bg-blue-600/10 text-blue-500 mb-2">
          <Search size={32} />
        </div>
        <h2 className="text-3xl font-black text-white">AI 문장분석</h2>
        <p className="text-slate-400">문장의 맥락을 분석하여 유해성을 판별합니다.</p>
      </div>

      <Card className="border-blue-900/30 bg-slate-900/80 backdrop-blur">
        <CardContent className="p-4 space-y-6">
          <Textarea
            placeholder="분석할 댓글이나 문장을 입력하세요..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full h-64 bg-slate-950/50 border-slate-800 text-lg p-6"
          />
          <Button
            className="w-full h-14 text-lg font-bold shadow-blue-600/20"
            variant="primary"
            onClick={handleAnalyze}
            disabled={!text.trim() || loading}
          >
            {loading ? (
              <>분석 중...</>
            ) : (
              <><Sparkles className="mr-2" size={20} /> 실시간 분석하기</>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="border-red-900/50 bg-red-900/10">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 text-red-400">
              <AlertTriangle size={24} />
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Display */}
      {result && (
        <Card className="border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              {result.is_malicious ? (
                <><AlertTriangle className="text-red-500" /> 악성 콘텐츠 감지</>
              ) : (
                <><CheckCircle className="text-emerald-500" /> 안전한 콘텐츠</>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Category */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400">카테고리:</span>
              <span className="px-3 py-1 rounded-full bg-blue-600/20 text-blue-400 text-sm font-bold">
                {(() => {
                  const normalizeCategory = (code) => {
                    if (!code) return '정상';
                    const up = code.toUpperCase();

                    // --- [S1~S13 Llama Guard Code Translation] ---
                    // 이 부분이 배지로 출력될 때 한글로 나오게 함
                    const llamaGuardMap = {
                      'S1': '강력 범죄', 'VIOLENT_CRIMES': '강력 범죄',
                      'S2': '비폭력 범죄', 'NON_VIOLENT_CRIMES': '비폭력 범죄',
                      'S3': '성범죄', 'SEX_RELATED_CRIMES': '성범죄',
                      'S4': '아동 성착취', 'CHILD_SEXUAL_EXPLOITATION': '아동 성착취', 'CHILD_EXPLOITATION': '아동 성착취',
                      'S5': '명예훼손', 'DEFAMATION': '명예훼손',
                      'S6': '전문 조언 위반', 'SPECIALIZED_ADVICE': '전문 조언 위반',
                      'S7': '개인정보 침해', 'PRIVACY': '개인정보 침해',
                      'S8': '지적재산권 침해', 'INTELLECTUAL_PROPERTY': '지적재산권 침해',
                      'S9': '무차별 무기 편취', 'INDISCRIMINATE_WEAPONS': '무차별 무기 편취',
                      'S10': '혐오 발언', 'HATE': '혐오 발언',
                      'S11': '자해 및 자살', 'SELF_HARM': '자해 및 자살',
                      'S12': '성적 콘텐츠', 'SEXUAL_CONTENT': '성적 콘텐츠',
                      'S13': '선거 개입', 'ELECTIONS': '선거 개입'
                    };

                    if (llamaGuardMap[up]) return llamaGuardMap[up];

                    // --- [기존 7대 카테고리 매핑 (Fallback)] ---
                    if (['PROFANITY', '욕설'].includes(up)) return '욕설';
                    if (['HATE', 'HATE_SPEECH', '혐오표현'].includes(up)) return '혐오표현';
                    if (['VIOLENCE', '폭력성'].includes(up)) return '폭력성';
                    if (['THREAT', '협박'].includes(up)) return '협박';
                    if (['SEXUAL', '성적희롱', 'OBSCENE', 'SEXUALLY_EXPLICIT', 'FLIRTATION'].includes(up)) return '성적희롱';
                    if (['SPAM', '스팸'].includes(up)) return '스팸';

                    // 2. 기타 독성 매핑
                    if (['SEVERE_TOXICITY', 'HIGHLY_TOXIC'].includes(up)) return '매우 유해함';
                    if (['TOXICITY', 'TOXIC'].includes(up)) return '유해함';
                    if (['MODERATELY_TOXIC'].includes(up)) return '보통 유해함';
                    if (['INSULT'].includes(up)) return '욕설';
                    if (['IDENTITY_ATTACK', 'DEFAMATION'].includes(up)) return '혐오표현';

                    // 3. 정상/기타
                    if (['CLEAN', 'NORMAL', 'SAFE', '정상'].includes(up)) return '정상';

                    return '정상';
                  };

                  return normalizeCategory(result.category);
                })()}
              </span>
            </div>

            {/* Scores */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <ScoreItem label="유해성" score={result.toxicity_score} />
              <ScoreItem label="혐오표현" score={result.hate_speech_score} />
              <ScoreItem label="욕설" score={result.profanity_score} />
              <ScoreItem label="위협" score={result.threat_score} />
              <ScoreItem label="폭력성" score={result.violence_score} />
              <ScoreItem label="신뢰도" score={result.confidence_score} />
            </div>

            {/* AI Reasoning */}
            {result.llama_reasoning && (
              <div className="p-4 rounded-lg bg-slate-950 border border-slate-800">
                <h4 className="text-sm font-bold text-slate-400 mb-2">AI 분석 의견</h4>
                <p className="text-slate-300">{result.llama_reasoning}</p>
              </div>
            )}

            {/* Detected Keywords */}
            {result.detected_keywords?.length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-slate-400 mb-2">감지된 키워드</h4>
                <div className="flex flex-wrap gap-2">
                  {result.detected_keywords.map((kw, idx) => (
                    <span key={idx} className="px-3 py-1 rounded-full bg-red-900/30 text-red-400 text-sm border border-red-900/50">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )
      }
    </div >
  );
}

// Score Item Component
function ScoreItem({ label, score }) {
  const percentage = Math.min(Math.max(score || 0, 0), 100);
  const color = percentage > 70 ? 'bg-red-500' : percentage > 40 ? 'bg-yellow-500' : 'bg-emerald-500';

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-slate-400">{label}</span>
        <span className="font-bold text-white">{percentage.toFixed(1)}%</span>
      </div>
      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

// 🆕 Status Badge Component (이 함수 추가!)
function StatusBadge({ status, isMalicious, isBlocked }) {
  let finalStatus = status;
  if (!finalStatus) {
    if (isBlocked) finalStatus = 'blocked';
    else if (isMalicious) finalStatus = 'malicious';
    else finalStatus = 'clean';
  }

  const statusConfig = {
    clean: {
      label: 'Clean',
      icon: CheckCircle,
      className: 'bg-emerald-900/30 text-emerald-400 border-emerald-900/50'
    },
    malicious: {
      label: 'Malicious',
      icon: AlertTriangle,
      className: 'bg-red-900/30 text-red-400 border-red-900/50'
    },
    blocked: {
      label: '차단단어',  // 🆕 한글로 변경!
      icon: AlertTriangle,
      className: 'bg-orange-900/30 text-orange-400 border-orange-900/50'
    }
  };

  const config = statusConfig[finalStatus] || statusConfig.clean;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold border ${config.className}`}>
      <Icon size={12} className="mr-1" /> {config.label}
    </span>
  );
}

// --- [4. Template View (Legacy for HEAD compatibility)] ---
function TemplateView() {
  const templates = [
    { id: 1, name: 'Welcome Message', category: 'General', content: '방문해주셔서 감사합니다! 긍정적인 커뮤니티를 함께 만들어요.' },
    { id: 2, name: 'Support Reply', category: 'Help', content: '문의하신 내용은 확인 후 빠르게 답변 드리겠습니다.' },
  ];
  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex justify-between items-center"><h2 className="text-2xl font-bold">Reply Templates</h2><Button className="gap-2"><Plus size={16} /> New</Button></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templates.map(t => (
          <Card key={t.id} className="hover:border-blue-600/50 transition-all cursor-pointer group">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-400 bg-blue-400/10 px-2 py-1 rounded">{t.category}</span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"><Edit size={14} /><Trash2 size={14} className="text-red-500" /></div>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{t.name}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{t.content}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// --- [공통 보조 컴포넌트] ---
function StatCard({ title, value, icon: Icon, color }) {
  return (
    <Card className="border-slate-800/50 hover:bg-slate-800/50 transition-colors">
      <CardContent className="p-6 flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-black text-white">{value}</p>
        </div>
        <div className={`p-3 rounded-xl bg-slate-950 border border-slate-800 ${color} shadow-inner`}>
          <Icon size={24} strokeWidth={2.5} />
        </div>
      </CardContent>
    </Card>
  );
}

// 윤혜정--- [8. Profile View] ---
function ProfileView() {
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 비밀번호 변경 상태
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState(null);

  useEffect(() => {
    loadUserInfo();
  }, []);

  const loadUserInfo = async () => {
    try {
      setLoading(true);
      const data = await userService.getUserInfo();
      setUserInfo(data);
    } catch (err) {
      console.error('Failed to load user info:', err);
      setError('사용자 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: '새 비밀번호가 일치하지 않습니다.' });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: '비밀번호는 6자 이상이어야 합니다.' });
      return;
    }

    try {
      await userService.changePassword(currentPassword, newPassword);
      setPasswordMessage({ type: 'success', text: '비밀번호가 변경되었습니다.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordForm(false);
    } catch (err) {
      setPasswordMessage({ type: 'error', text: err.response?.data?.error || '비밀번호 변경에 실패했습니다.' });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('ko-KR');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400">로딩 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-400">{error}</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-bold text-white">Profile Settings</h2>
        <p className="text-slate-400 text-sm">계정 정보를 확인하고 관리합니다.</p>
      </div>

      {/* 계정 정보 카드 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User size={20} /> 계정 정보
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoItem label="이메일" value={userInfo?.email} />
            <InfoItem label="사용자명" value={userInfo?.username} />
            <InfoItem label="역할" value={userInfo?.role === 'ADMIN' ? '관리자' : '일반 사용자'} />
            <InfoItem label="상태" value={userInfo?.status === 'ACTIVE' ? '활성' : userInfo?.status} />
            <InfoItem label="가입일" value={formatDate(userInfo?.createdAt)} />
            <InfoItem label="마지막 로그인" value={formatDate(userInfo?.lastLoginAt)} />
          </div>
        </CardContent>
      </Card>

      {/* 비밀번호 변경 카드 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock size={20} /> 비밀번호 변경
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!showPasswordForm ? (
            <Button
              variant="outline"
              onClick={() => setShowPasswordForm(true)}
              className="gap-2"
            >
              <Lock size={16} /> 비밀번호 변경하기
            </Button>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">현재 비밀번호</label>
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="현재 비밀번호 입력"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">새 비밀번호</label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="새 비밀번호 입력"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">새 비밀번호 확인</label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="새 비밀번호 다시 입력"
                />
              </div>

              {passwordMessage && (
                <div className={`p-3 rounded-lg text-sm ${passwordMessage.type === 'error'
                  ? 'bg-red-900/20 text-red-400 border border-red-900/50'
                  : 'bg-emerald-900/20 text-emerald-400 border border-emerald-900/50'
                  }`}>
                  {passwordMessage.text}
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={handlePasswordChange}>
                  <Save size={16} className="mr-2" /> 변경 저장
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPasswordForm(false);
                    setPasswordMessage(null);
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                  }}
                >
                  취소
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// 정보 표시 컴포넌트
function InfoItem({ label, value }) {
  return (
    <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      <p className="text-slate-200 font-medium">{value || '-'}</p>
    </div>
  );
}

// 나머지 뷰는 위와 동일한 다크 테마 컨셉으로 표시 (생략된 뷰들)
function WritingAssistantView() {
  return <TemplateManager />;
}
function StatisticsView() { return <Statistics />; }
// --- [5. Comment Management View] ---
function CommentManagementView() {
  const [url, setUrl] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('');
  const [message, setMessage] = useState(null);
  const [lastAnalyzedUrl, setLastAnalyzedUrl] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedIds, setSelectedIds] = useState([]); // Bulk select state
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [isBatchAnalyzing, setIsBatchAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const pageSize = 10;

  // Refs for tracking latest state in async loops (avoid stale closures)
  const currentPageRef = React.useRef(currentPage);
  const lastAnalyzedUrlRef = React.useRef(lastAnalyzedUrl);
  const startDateRef = React.useRef(startDate);
  const endDateRef = React.useRef(endDate);
  const filterStatusRef = React.useRef(filterStatus);

  useEffect(() => { currentPageRef.current = currentPage; }, [currentPage]);
  useEffect(() => { lastAnalyzedUrlRef.current = lastAnalyzedUrl; }, [lastAnalyzedUrl]);
  useEffect(() => { startDateRef.current = startDate; }, [startDate]);
  useEffect(() => { endDateRef.current = endDate; }, [endDate]);
  useEffect(() => { filterStatusRef.current = filterStatus; }, [filterStatus]);
  useEffect(() => {
    loadComments();
    // 기본 날짜 설정 (최근 1주일)
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 7);

    setEndDate(end.toISOString().split('T')[0]);
    setStartDate(start.toISOString().split('T')[0]);
  }, []);

  const loadComments = async (overrideUrl = null, fromHistory = false) => {
    setLoading(true);
    try {
      let data;
      if (fromHistory) {
        // Fetch full history from AnalysisResult table (Paginated)
        const paginatedData = await analysisService.getHistory(currentPage, pageSize);

        // Map Page content to Comment UI fields
        data = {
          ...paginatedData,
          content: paginatedData.content.map(item => ({
            commentId: item.commentId || item.analysisId,
            authorIdentifier: item.author || 'Unknown',
            commentText: item.commentText,
            isMalicious: item.toxicityScore > 50,
            isAnalyzed: true, // History is always analyzed
            commentedAt: item.analyzedAt,
            toxicityScore: item.toxicityScore
          }))
        };
        setLastAnalyzedUrl(''); // Clear current URL context
      } else {
        const targetUrl = overrideUrl !== null ? overrideUrl : lastAnalyzedUrlRef.current;
        data = await commentService.getComments(
          targetUrl,
          startDateRef.current,
          endDateRef.current,
          filterStatusRef.current,
          currentPageRef.current,
          pageSize
        );
      }

      if (data && data.content) {
        setComments(data.content.map(c => ({
          ...c,
          isAnalyzed: c.isAnalyzed !== undefined ? c.isAnalyzed : (c.toxicityScore !== undefined)
        })));
        setTotalPages(data.totalPages);
        setTotalElements(data.totalElements);
      } else {
        setComments(Array.isArray(data) ? data : []);
        setTotalPages(0);
        setTotalElements(Array.isArray(data) ? data.length : 0);
      }
    } catch (error) {
      console.error('Failed to load comments:', error);
      // Fallback for demo/empty state
      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (startDate && endDate) {
      loadComments();
    }
  }, [startDate, endDate, filterStatus, currentPage]);

  const handleStartDateChange = (e) => {
    const newStart = e.target.value;
    setStartDate(newStart);

    if (newStart) {
      const date = new Date(newStart);
      date.setDate(date.getDate() + 7);
      const newEnd = date.toISOString().split('T')[0];
      setEndDate(newEnd);
      setMessage({ type: 'success', text: '분석 기간이 시작일로부터 7일로 자동 설정되었습니다.' });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleEndDateChange = (e) => {
    const newEnd = e.target.value;
    if (!startDate) {
      setEndDate(newEnd);
      return;
    }
    const start = new Date(startDate);
    const end = new Date(newEnd);
    if (end < start) {
      setMessage({ type: 'error', text: '종료일은 시작일보다 빠를 수 없습니다.' });
      setEndDate(startDate);
      return;
    }
    const diffTime = end - start;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays > 7) {
      setMessage({ type: 'error', text: '분석 기간은 최대 7일을 초과할 수 없습니다.' });
      const maxEnd = new Date(start);
      maxEnd.setDate(maxEnd.getDate() + 7);
      setEndDate(maxEnd.toISOString().split('T')[0]);
    } else {
      setEndDate(newEnd);
      setMessage(null);
    }
    setCurrentPage(0);
  };

  const handleAnalyze = async () => {
    if (!url.trim()) return;
    if (!startDate || !endDate) {
      setMessage({ type: 'error', text: '시작일과 종료일을 입력해주세요.' });
      return;
    }
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start > end) {
      setMessage({ type: 'error', text: '시작일이 종료일보다 늦을 수 없습니다.' });
      return;
    }
    const diffTime = end - start;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays > 7) {
      setMessage({ type: 'error', text: '분석 기간은 최대 7일까지 가능합니다.' });
      return;
    }
    setCurrentPage(0);
    setAnalyzing(true);
    setLoadingStatus('유튜브 데이터 수집 중...');
    setMessage(null);

    try {
      const crawlResult = await commentService.crawlAndAnalyze(url, startDate, endDate);
      setLastAnalyzedUrl(url);
      setAnalyzing(false);
      const { totalCrawled, savedCount, skippedCount, dateSkipCount } = crawlResult;
      setMessage({
        type: 'success',
        text: `수집 완료: 총 ${totalCrawled}개 (신규: ${savedCount}, 중복: ${skippedCount || 0}, 기간지남: ${dateSkipCount || 0}).`
      });
      await loadComments(url);
      triggerSequentialAnalysis(url, crawlResult.savedCount);
    } catch (error) {
      setAnalyzing(false);
      setMessage({ type: 'error', text: '수집 실패: ' + (error.response?.data?.error || error.message) });
    }
  };

  const triggerSequentialAnalysis = async (targetUrl, totalCount) => {
    if (totalCount === 0) return;
    setIsBatchAnalyzing(true);
    setAnalysisProgress(0);
    const totalPagesToAnalyze = Math.ceil(totalCount / pageSize);
    for (let i = 0; i < totalPagesToAnalyze; i++) {
      setLoadingStatus(`분석 진행 중: ${i + 1} / ${totalPagesToAnalyze} 페이지...`);
      try {
        // Use refs to get latest state during the long loop
        const pageData = await commentService.getComments(
          targetUrl,
          startDateRef.current,
          endDateRef.current,
          'all',
          i,
          pageSize
        );

        const unanalyzedIds = pageData.content.filter(c => !c.isAnalyzed).map(c => c.commentId);
        if (unanalyzedIds.length > 0) {
          await commentService.analyzeBatch(unanalyzedIds);
        }

        // If the user is currently looking at THIS page, refresh the UI
        if (currentPageRef.current === i) {
          await loadComments(targetUrl);
        }

        setAnalysisProgress(Math.round(((i + 1) / totalPagesToAnalyze) * 100));
      } catch (error) {
        console.error(`Page ${i + 1} analysis failed:`, error);
      }
    }
    setIsBatchAnalyzing(false);
    setLoadingStatus('');
    setMessage({ type: 'success', text: '모든 댓글의 분석이 완료되었습니다.' });
    loadComments(targetUrl);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;
    try {
      await commentService.deleteComment(id);
      setComments(comments.filter(c => c.commentId !== id));
    } catch (error) {
      alert('삭제 실패: ' + error.message);
    }
  };

  // --- Bulk Action Handlers ---
  const toggleSelectAll = () => {
    if (selectedIds.length === comments.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(comments.map(c => c.commentId));
    }
  };

  const toggleSelect = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(idx => idx !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`선택한 ${selectedIds.length}개의 분석 기록을 삭제하시겠습니까?`)) return;
    try {
      await commentService.deleteComments(selectedIds);
      setComments(comments.filter(c => !selectedIds.includes(c.commentId)));
      setSelectedIds([]);
      setMessage({ type: 'success', text: `${selectedIds.length}개의 항목이 삭제되었습니다.` });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      alert('일괄 삭제 실패: ' + error.message);
    }
  };

  const handleDeleteAll = async () => {
    if (comments.length === 0) return;
    const targetMsg = url ? '현재 조회된 모든' : '전체';
    if (!window.confirm(`${targetMsg} 분석 기록을 영구적으로 삭제하시겠습니까?\n(삭제 후 복구할 수 없습니다)`)) return;

    try {
      // url 필터가 있으면 해당 url만 아니면 전체 다 삭제 (Service 로직 따름)
      await commentService.deleteAllComments(url);
      setComments([]);
      setSelectedIds([]);
      setMessage({ type: 'success', text: '모든 기록이 삭제되었습니다.' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      alert('전체 삭제 실패: ' + error.message);
    }
  };

  // 🆕 블랙리스트 추가 함수
  const handleAddToBlacklist = async (comment) => {
    const authorName = comment.authorName || comment.authorIdentifier;
    const authorId = comment.authorIdentifier;

    if (!window.confirm(`"${authorName}"을(를) 블랙리스트에 추가하시겠습니까?`)) return;

    try {
      await blacklistService.addToBlacklist({
        authorName: authorName,
        authorIdentifier: authorId,
        reason: '악성 댓글 작성',
        platform: 'YOUTUBE',
        commentText: comment.commentText
      });
      setMessage({ type: 'success', text: `"${authorName}"이(가) 블랙리스트에 추가되었습니다.` });
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.response?.data?.message || '블랙리스트 추가 실패';
      setMessage({ type: 'error', text: errorMsg });
    }
  };

  // 🆕 ID 복사 함수
  const handleCopyId = (id) => {
    navigator.clipboard.writeText(id);
    setMessage({ type: 'success', text: 'ID가 클립보드에 복사되었습니다.' });
    setTimeout(() => setMessage(null), 2000);
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-lg bg-red-600/10 text-red-500">
              <Youtube size={20} />
            </div>
            <h2 className="text-2xl font-bold text-white">YouTube 댓글분석</h2>
          </div>
          <p className="text-slate-400 text-sm">영상 URL과 기간을 설정하여 악성 댓글을 정밀 탐색합니다.</p>
        </div>
      </div>

      {/* Premium Analysis Control Panel */}
      <Card className="border-slate-800 bg-slate-900/40 backdrop-blur-md overflow-hidden relative min-h-[160px]">
        <div className="absolute -top-px left-10 right-10 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />

        {/* Loading Overlay - Fixed height/width and centering */}
        {analyzing && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="flex flex-col items-center gap-4 text-center px-6">
              <div className="relative">
                <div className="h-14 w-14 rounded-full border-t-2 border-blue-500 animate-spin" />
                <Zap size={24} className="absolute inset-0 m-auto text-blue-500 animate-pulse" />
              </div>
              <div className="flex flex-col items-center gap-2">
                <span className="text-sm font-black text-white tracking-[0.2em] uppercase animate-pulse">
                  {loadingStatus || 'Processing...'}
                </span>
                <span className="text-xs text-slate-400 font-medium">분석이 끝날 때까지 페이지를 유지해주세요.</span>
              </div>
            </div>
          </div>
        )}

        <CardContent className="p-8 pt-10">
          <div className={`grid grid-cols-1 lg:grid-cols-12 gap-6 items-end transition-all duration-700 ${analyzing ? 'opacity-20 blur-sm scale-[0.98]' : 'opacity-100 blur-0 scale-100'}`}>
            {/* URL Input Group */}
            <div className="lg:col-span-5 space-y-2">
              <label className="text-xs font-bold text-slate-400 flex items-center gap-2 ml-1">
                <LinkIcon size={12} /> YOUTUBE VIDEO URL
              </label>
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                  <Globe size={16} />
                </div>
                <input
                  className="w-full h-11 pl-10 pr-10 rounded-xl border border-slate-800 bg-slate-950/50 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all placeholder:text-slate-600 disabled:opacity-50"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  disabled={analyzing}
                />
                {url && !analyzing && (
                  <button
                    onClick={() => setUrl('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-200 transition-colors"
                  >
                    <Plus size={16} className="rotate-45" />
                  </button>
                )}
              </div>
            </div>

            {/* Date Picker Group */}
            <div className="lg:col-span-4 space-y-2">
              <label className="text-xs font-bold text-slate-400 flex items-center gap-2 ml-1">
                <CalendarIcon size={12} /> 분류 기간 설정 (최대 7일)
              </label>
              <div className={`flex items-center gap-2 h-11 px-3 rounded-xl border border-slate-800 bg-slate-950/50 group focus-within:ring-2 focus-within:ring-blue-500/30 focus-within:border-blue-500/50 transition-all ${analyzing ? 'opacity-50' : 'opacity-100'}`}>
                <input
                  type="date"
                  className="bg-transparent border-none text-xs text-slate-300 focus:outline-none flex-1 [color-scheme:dark] disabled:cursor-not-allowed"
                  value={startDate}
                  onChange={handleStartDateChange}
                  disabled={analyzing}
                />
                <span className="text-slate-700 font-bold">~</span>
                <input
                  type="date"
                  className="bg-transparent border-none text-xs text-slate-300 focus:outline-none flex-1 [color-scheme:dark] disabled:cursor-not-allowed"
                  value={endDate}
                  onChange={handleEndDateChange}
                  disabled={analyzing}
                />
              </div>
            </div>

            {/* Action Button */}
            <div className="lg:col-span-3">
              <button
                onClick={handleAnalyze}
                disabled={analyzing || !url}
                className={`w-full h-11 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all 
                  ${analyzing
                    ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/40 active:scale-[0.98]'}`}
              >
                {analyzing ? (
                  <RefreshCw size={18} className="animate-spin" />
                ) : (
                  <Zap size={18} className="fill-current" />
                )}
                {analyzing ? '분류 중...' : '분류 시작'}
              </button>
            </div>
          </div>

          {message && (
            <div className={`mt-6 p-4 rounded-xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300 
              ${message.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
              <div className={`p-1.5 rounded-full ${message.type === 'success' ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
                {message.type === 'success' ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
              </div>
              <span className="text-sm font-medium">{message.text}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Comments List Section */}
      <Card className="border-slate-800 bg-slate-900/20">
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
          <div className="space-y-1">
            <CardTitle className="text-lg">분석 이력 ({totalElements})</CardTitle>
            <p className="text-xs text-slate-400">수집된 데이터 중 현재 필터 조건에 맞는 목록입니다.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-slate-950/40 p-1 rounded-xl border border-slate-800 shadow-inner">
              {[
                { id: 'all', label: '전체', icon: Database },
                { id: 'clean', label: '안전', icon: CheckCircle },
                { id: 'malicious', label: '악성', icon: AlertTriangle }
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => {
                    setFilterStatus(item.id);
                    setCurrentPage(0);
                  }}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-black transition-all uppercase ${filterStatus === item.id
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                    }`}
                >
                  <item.icon size={12} className={filterStatus === item.id ? 'animate-pulse' : ''} />
                  {item.label}
                </button>
              ))}
            </div>


            <div className="px-3 py-1 rounded-full bg-slate-800 text-[10px] font-bold text-slate-400 border border-slate-700">
              현재 페이지 {comments.length}개
            </div>

            <button onClick={() => loadComments()} className="h-8 w-8 flex items-center justify-center p-0 rounded-full hover:bg-slate-800 text-slate-400 transition-all">
              <RotateCcw size={14} className={loading ? 'animate-spin' : ''} />
            </button>

            {/* Bulk Actions */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800 ml-2">
              {selectedIds.length > 0 && (
                <button
                  onClick={handleDeleteSelected}
                  className="h-8 px-3 rounded-lg text-[10px] font-bold bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all animate-in fade-in"
                >
                  선택항목 삭제 ({selectedIds.length})
                </button>
              )}
              {comments.length > 0 && (
                <button
                  onClick={handleDeleteAll}
                  className="h-8 px-3 rounded-lg text-[10px] font-bold border border-red-900/30 text-red-400 hover:bg-red-950/30 hover:text-red-300 transition-all"
                >
                  전체삭제
                </button>
              )}
            </div>
          </div>
        </CardHeader >
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-y border-slate-800 bg-slate-900/40">
                  <th className="p-4 py-3 w-[40px] text-center">
                    <input
                      type="checkbox"
                      className="rounded border-slate-700 bg-slate-800 text-blue-500 focus:ring-offset-slate-900"
                      checked={comments.length > 0 && selectedIds.length === comments.length}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th className="p-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-tighter w-[15%]">작성자</th>
                  <th className="p-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-tighter w-[50%]">작성 댓글</th>
                  <th className="p-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-tighter w-[15%] text-center">분류 결과</th>
                  <th className="p-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-tighter w-[10%] text-center">작성일</th>
                  <th className="p-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-tighter w-[10%] text-right">설정</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {loading ? (
                  <tr><td colSpan="6" className="p-20 text-center text-slate-600 text-sm animate-pulse tracking-widest">분석중...</td></tr>
                ) : comments.length > 0 ? comments.map(comment => (
                  <tr key={comment.commentId} className={`transition-all group ${selectedIds.includes(comment.commentId) ? 'bg-blue-900/10' : 'hover:bg-blue-500/5'}`}>
                    <td className="p-4 align-top text-center">
                      <input
                        type="checkbox"
                        className="rounded border-slate-700 bg-slate-800 text-blue-500 focus:ring-offset-slate-900"
                        checked={selectedIds.includes(comment.commentId)}
                        onChange={() => toggleSelect(comment.commentId)}
                      />

                    </td>
                    <td className="p-4 align-top">
                      <div className="flex items-center gap-2">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-200 text-sm truncate max-w-[120px]">
                            {comment.authorIdentifier}
                          </span>
                          <span className="text-[10px] text-slate-600 font-mono tracking-tighter">
                            YOUTUBE_USER
                          </span>
                        </div>
                        {/* ID 복사 버튼 - 오른쪽에 배치 */}
                        <button
                          onClick={() => handleCopyId(comment.authorIdentifier)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-blue-400 hover:bg-blue-500/10 transition-all opacity-0 group-hover:opacity-100"
                          title="ID 복사"
                        >
                          <Copy size={14} />
                        </button>
                      </div>
                    </td>
                    <td className="p-4 align-top">
                      <p className="text-sm text-slate-300 leading-relaxed line-clamp-2 max-w-xl group-hover:line-clamp-none transition-all duration-300">
                        {comment.commentText}
                      </p>
                    </td>
                    <td className="p-4 align-top text-center">
                      {!comment.isAnalyzed ? (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-500 text-[10px] font-black uppercase animate-pulse">
                          <RefreshCw size={10} className="animate-spin" /> 분석중...
                        </div>
                      ) : comment.isMalicious ? (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase">
                          <AlertTriangle size={10} /> 악성
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-black uppercase">
                          <CheckCircle size={10} /> 안전
                        </div>
                      )}
                    </td>
                    <td className="p-4 align-top text-center">
                      <div className="text-[11px] text-slate-400 font-medium">
                        {new Date(comment.commentedAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                      </div>
                    </td>
                    <td className="p-4 align-top text-right">
                      <div className="flex flex-row items-center justify-end gap-1">
                        {/* 블랙리스트 추가 버튼 (악성 댓글만 표시) */}
                        {comment.isMalicious && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAddToBlacklist(comment)}
                            className="text-slate-400 hover:text-orange-400 opacity-0 group-hover:opacity-100"
                            title="블랙리스트 추가"
                          >
                            <UserX size={16} />
                          </Button>
                        )}
                        <button
                          onClick={() => handleDelete(comment.commentId)}
                          className="p-2 rounded-lg text-slate-600 hover:text-red-500 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan="6" className="p-20 text-center text-slate-600 text-sm italic tracking-wide">No data analyzed in the selected period.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card >

      {/* Pagination UI */}
      {
        totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 mt-6 bg-slate-900/40 border border-slate-800 rounded-xl">
            <div className="flex flex-1 justify-between sm:hidden">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                disabled={currentPage === 0}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                disabled={currentPage === totalPages - 1}
                className="ml-3"
              >
                Next
              </Button>
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-xs text-slate-400">
                  전체 <span className="font-bold text-slate-200">{totalElements}</span>개 중{' '}
                  <span className="font-bold text-slate-200">{currentPage * pageSize + 1}</span>
                  {' - '}
                  <span className="font-bold text-slate-200">
                    {Math.min((currentPage + 1) * pageSize, totalElements)}
                  </span>
                </p>
              </div>
              <div>
                <nav className="isolate inline-flex -space-x-px rounded-lg shadow-sm" aria-label="Pagination">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                    disabled={currentPage === 0}
                    className="relative inline-flex items-center rounded-l-lg px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-800 hover:bg-slate-800 focus:z-20 focus:outline-offset-0 disabled:opacity-30"
                  >
                    <span className="sr-only">Previous</span>
                    <RotateCcw size={16} className="rotate-180" />
                  </button>

                  {[...Array(totalPages)].map((_, i) => {
                    if (i === 0 || i === totalPages - 1 || (i >= currentPage - 2 && i <= currentPage + 2)) {
                      return (
                        <button
                          key={i}
                          onClick={() => setCurrentPage(i)}
                          className={`relative inline-flex items-center px-4 py-2 text-xs font-bold transition-all ${currentPage === i
                            ? 'z-10 bg-blue-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                            : 'text-slate-400 ring-1 ring-inset ring-slate-800 hover:bg-slate-800 focus:z-20 focus:outline-offset-0'
                            }`}
                        >
                          {i + 1}
                        </button>
                      )
                    }
                    if (i === 1 || i === totalPages - 2) {
                      return <span key={i} className="relative inline-flex items-center px-4 py-2 text-xs font-bold text-slate-600 ring-1 ring-inset ring-slate-800 focus:outline-none">...</span>
                    }
                    return null;
                  })}

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                    disabled={currentPage === totalPages - 1}
                    className="relative inline-flex items-center rounded-r-lg px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-800 hover:bg-slate-800 focus:z-20 focus:outline-offset-0 disabled:opacity-30"
                  >
                    <span className="sr-only">Next</span>
                    <RotateCcw size={16} />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
}

// ========================================
// 0. NoticeListView 컴포넌트
// ========================================
function NoticeListView() {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState('ALL');
  const [page, setPage] = useState(0);
  const pageSize = 10;

  const { data: pageData, isLoading, error } = useQuery({
    queryKey: ['notices-paged', page],
    queryFn: () => noticeService.getPaged(page, pageSize),
  });

  const notices = pageData?.content || [];
  const totalPages = pageData?.totalPages || 1;
  const currentPage = pageData?.number || 0;
  const totalElements = pageData?.totalElements || 0;

  const filteredNotices = notices.filter(notice =>
    selectedType === 'ALL' || notice.noticeType === selectedType
  );

  const handleNoticeClick = (noticeId) => {
    navigate(`/notices/${noticeId}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="text-slate-500 animate-pulse">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="text-red-500">에러: {error.message}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* 헤더 */}
      <header>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3 mb-2">
          <Bell className="text-blue-400" />
          공지사항
        </h1>
        <p className="text-slate-500">중요한 소식과 업데이트를 확인하세요.</p>
      </header>

      {/* 필터 */}
      <Card>
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
                    setPage(0);
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
                        <CalendarIcon size={14} />
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

                  <ChevronRight
                    size={20}
                    className="text-slate-600 transition-transform group-hover:translate-x-1 flex-shrink-0 ml-4"
                  />
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
        <div className="flex flex-col items-center mt-10 gap-4">
          <div className="flex items-center gap-4">
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
          </div>

          <span className="text-slate-500 text-sm">
            {currentPage + 1} / {totalPages} 페이지 (총 {totalElements}개)
          </span>
        </div>
      )}
    </div>
  );
}

// 공지사항 헬퍼 함수 추가
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

function getNoticeTypeColor(type) {
  const colors = {
    GENERAL: 'bg-blue-500/10 text-blue-400',
    MAINTENANCE: 'bg-orange-500/10 text-orange-400',
    UPDATE: 'bg-green-500/10 text-green-400',
    URGENT: 'bg-red-500/10 text-red-400'
  };
  return colors[type] || colors.GENERAL;
}