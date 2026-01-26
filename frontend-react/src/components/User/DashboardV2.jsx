/** [File: DashboardV2.jsx / Date: 2026-01-22 / 설명: 대시보드 실시간 통계 데이터 연동 로직 복구 및 UI 레이아웃 수정] */
/** [File: DashboardV2.jsx / Date: 2026-01-22 / 작성자: Antigravity / 설명: 대시보드 메뉴별 독립적 Top-level URL 라우팅 적용 및 30초 간격 실시간 데이터 자동 갱신(setInterval) 로직 추가] */
/** [File: DashboardV2.jsx / Date: 2026-01-22 / 작성자: 윤혜정 / 설명: AI 분석 연동 및 프로필 관리 기능 추가] */
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
  Youtube, Link as LinkIcon, Calendar as CalendarIcon, Globe, RefreshCw, Zap, Database
} from 'lucide-react';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import dashboardService from '../../services/dashboardService';
import ProfileSettings from './ProfileSettings';
import TemplateManager from './TemplateManager';
import Statistics from './Statistics';

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
const Textarea = (props) => <textarea className="flex min-h-[80px] w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-slate-600" {...props} />;

// --- [메인 컴포넌트] ---
export default function DashboardV2() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Shield, path: '/dashboard' },
    { id: 'analysis', label: 'AI Analysis', icon: Search, path: '/aianalysis' },
    { id: 'management', label: 'Comments', icon: MessageSquare, path: '/comments' },
    { id: 'blacklist', label: 'Blacklist', icon: UserX, path: '/blacklist' },
    { id: 'writing', label: 'AI Assistant', icon: Wand2, path: '/aiassistant' },
    { id: 'templates', label: 'Templates', icon: FileText, path: '/templates' },
    { id: 'stats', label: 'Statistics', icon: Activity, path: '/statistics' },
    { id: 'profile', label: 'Profile', icon: User, path: '/profile' },
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
          {activeTab === 'templates' && <TemplateView />}
          {activeTab === 'stats' && <StatisticsView />}
          {activeTab === 'profile' && <ProfileSettings />}
        </div>
      </main>
    </div>
  );
}

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

    // 최초 로드 시 실행
    fetchStats();

    // 30초마다 실시간 데이터 갱신 (setInterval 추가)
    const interval = setInterval(() => {
      console.log("[DEBUG] 실시간 데이터 새로고침 중...");
      fetchStats();
    }, 30000);

    // 컴포넌트 언마운트 시 인터벌 제거 (Cleanup)
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="text-center p-20 text-slate-500 text-sm animate-pulse">데이터를 불러오는 중...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h1 className="text-3xl font-bold text-white">System Overview</h1>
        <p className="text-slate-500">실시간 보안 및 댓글 분석 현황입니다.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total" value={stats.total.toLocaleString()} icon={Shield} color="text-blue-400" />
        <StatCard title="Malicious" value={stats.malicious.toLocaleString()} icon={AlertTriangle} color="text-red-400" />
        <StatCard title="Clean" value={stats.clean.toLocaleString()} icon={CheckCircle} color="text-emerald-400" />
        <StatCard title="Detection" value={stats.detectionRate} icon={TrendingUp} color="text-amber-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Weekly Activity</CardTitle></CardHeader>
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
        <Card>
          <CardHeader><CardTitle>Notifications</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {stats.notifications.length > 0 ? stats.notifications.map((note, i) => (
              <div key={note.id || i} className="flex gap-3 p-3 rounded-lg bg-slate-950/50 border border-slate-800">
                <div className={`h-2 w-2 rounded-full mt-2 ${note.isMalicious ? 'bg-red-500' : 'bg-emerald-500'}`} />
                <div>
                  <p className="text-sm font-medium">{note.isMalicious ? '악성' : '클린'} 댓글 감지 ({note.category})</p>
                  <p className="text-xs text-slate-500">{new Date(note.analyzedAt).toLocaleString()}</p>
                </div>
              </div>
            )) : <p className="text-center text-slate-500 text-sm py-10">알림 내역이 없습니다.</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// --- [2. Blacklist View] ---
function BlacklistView() {
  const [list, setList] = useState([
    { id: '1', name: 'SpamUser123', identifier: 'UC123abc', count: 5, reason: 'Repeated spam', date: '2024-01-15' },
    { id: '2', name: 'TrollAccount', identifier: 'UC456def', count: 12, reason: 'Hate speech', date: '2024-01-10' }
  ]);
  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-white">Blacklist Management</h2>
          <p className="text-slate-500 text-sm">차단된 사용자 목록을 관리합니다.</p>
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
                  <div className="text-xs text-slate-500 font-mono">{i.identifier}</div>
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

// --- [3. AI Analysis View] ---
// function CommentAnalysisView() {
//   const [text, setText] = useState('');
//   return (
//     <div className="max-w-3xl mx-auto space-y-8 animate-in zoom-in-95 duration-500">
//       <div className="text-center space-y-2">
//         <div className="inline-flex p-3 rounded-2xl bg-blue-600/10 text-blue-500 mb-2"><Search size={32} /></div>
//         <h2 className="text-3xl font-black text-white">AI Content Analysis</h2>
//         <p className="text-slate-500">문장의 맥락을 분석하여 유해성을 판별합니다.</p>
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
    <div className="max-w-3xl mx-auto space-y-8 animate-in zoom-in-95 duration-500">
      <div className="text-center space-y-2">
        <div className="inline-flex p-3 rounded-2xl bg-blue-600/10 text-blue-500 mb-2">
          <Search size={32} />
        </div>
        <h2 className="text-3xl font-black text-white">AI Content Analysis</h2>
        <p className="text-slate-500">문장의 맥락을 분석하여 유해성을 판별합니다.</p>
      </div>

      <Card className="border-blue-900/30 bg-slate-900/80 backdrop-blur">
        <CardContent className="p-8 space-y-6">
          <Textarea
            placeholder="분석할 댓글이나 문장을 입력하세요..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="h-48 bg-slate-950/50 border-slate-800 text-lg p-6"
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
              <span className="text-slate-500">카테고리:</span>
              <span className="px-3 py-1 rounded-full bg-blue-600/20 text-blue-400 text-sm font-bold">
                {result.category}
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
      )}
    </div>
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
              <p className="text-sm text-slate-500 leading-relaxed">{t.content}</p>
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
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{title}</p>
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
        <p className="text-slate-500 text-sm">계정 정보를 확인하고 관리합니다.</p>
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
      <p className="text-xs text-slate-500 mb-1">{label}</p>
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

  // 초기 댓글 목록 로드
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
        // Fetch full history from AnalysisResult table
        const historyData = await analysisService.getHistory();
        // Map AnalysisResult fields to Comment UI expected fields
        data = historyData.map(item => ({
          commentId: item.analysisId, // Use analysisId as unique key
          authorIdentifier: item.author || 'Unknown',
          commentText: item.commentText,
          isMalicious: item.toxicityScore > 0,
          commentedAt: item.analyzedAt, // Use analysis time for history
          toxicityScore: item.toxicityScore
        }));
        setLastAnalyzedUrl(''); // Clear current URL context
      } else {
        const targetUrl = overrideUrl !== null ? overrideUrl : lastAnalyzedUrl;
        data = await commentService.getComments(
          targetUrl,
          startDate,
          endDate,
          filterStatus
        );
      }

      // Apply Client-side filtering if needed (though backend handles most)
      let filteredData = data;
      if (filterStatus === 'clean') {
        filteredData = data.filter(c => !c.isMalicious);
      } else if (filterStatus === 'malicious') {
        filteredData = data.filter(c => c.isMalicious);
      }

      setComments(filteredData);
    } catch (error) {
      console.error('Failed to load comments:', error);
      // Fallback for demo/empty state
      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  // 날짜 또는 필터 변경 시 목록 자동 갱신 및 스마트 기간 설정
  useEffect(() => {
    if (startDate && endDate) {
      loadComments();
    }
  }, [startDate, endDate, filterStatus]);

  // 시작 날짜 변경 시 종료 날짜 자동 7일 세팅
  const handleStartDateChange = (e) => {
    const newStart = e.target.value;
    setStartDate(newStart);

    if (newStart) {
      const date = new Date(newStart);
      date.setDate(date.getDate() + 7);
      const newEnd = date.toISOString().split('T')[0];
      setEndDate(newEnd);
      setMessage({ type: 'success', text: '분석 기간이 시작일로부터 7일로 자동 설정되었습니다.' });

      // 3초 후 메시지 제거
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

    // 시작일보다 이전 날짜 선택 방지
    if (end < start) {
      setMessage({ type: 'error', text: '종료일은 시작일보다 빠를 수 없습니다.' });
      setEndDate(startDate); // 시작일과 동일하게 보정
      return;
    }

    const diffTime = end - start;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 7) {
      setMessage({ type: 'error', text: '분석 기간은 최대 7일을 초과할 수 없습니다.' });
      // 강제로 7일로 맞춤
      const maxEnd = new Date(start);
      maxEnd.setDate(maxEnd.getDate() + 7);
      setEndDate(maxEnd.toISOString().split('T')[0]);
    } else {
      setEndDate(newEnd);
      setMessage(null);
    }
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
      setMessage({ type: 'error', text: '분석 기간은 최대 1주일까지만 가능합니다.' });
      return;
    }

    setAnalyzing(true);
    setLoadingStatus('유튜브 데이터 수집 중...');
    setMessage(null);

    // 단계별 메시지 시뮬레이션
    const statusTimer = setTimeout(() => setLoadingStatus('AI 유해성 분석 및 필터링 수행 중...'), 3000);

    try {
      const result = await commentService.crawlAndAnalyze(url, startDate, endDate);
      clearTimeout(statusTimer);
      setLoadingStatus('분석 완료! 결과 동기화 중...');

      // 사용자 경험을 위해 살짝 지연 후 결과 표시
      setTimeout(() => {
        setLastAnalyzedUrl(url); // 마지막 분석 URL 저장
        setMessage({
          type: 'success',
          text: `수집 완료: ${result.totalCrawled}개, 분석 완료: ${result.analyzedCount}개 (기간 필터링 적용)`
        });
        loadComments(url); // 해당 URL로 목록 갱신
      }, 800);

    } catch (error) {
      clearTimeout(statusTimer);
      setMessage({ type: 'error', text: '분석 요청 실패: ' + (error.response?.data?.error || error.message) });
    } finally {
      // 결과 표시 지연 시간에 맞춰 analyzing 해제
      setTimeout(() => {
        setAnalyzing(false);
        setLoadingStatus('');
      }, 1000);
    }
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

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-lg bg-red-600/10 text-red-500">
              <Youtube size={20} />
            </div>
            <h2 className="text-2xl font-bold text-white">YouTube Insight</h2>
          </div>
          <p className="text-slate-500 text-sm">영상 URL과 기간을 설정하여 악성 댓글을 정밀 탐색합니다.</p>
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
                <span className="text-xs text-slate-500 font-medium">분석이 끝날 때까지 페이지를 유지해주세요.</span>
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
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors">
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
                <CalendarIcon size={12} /> ANALYSIS PERIOD (MAX 7 DAYS)
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
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/40 active:scale-[0.98]'}`}
              >
                {analyzing ? (
                  <RefreshCw size={18} className="animate-spin" />
                ) : (
                  <Zap size={18} className="fill-current" />
                )}
                {analyzing ? 'Processing...' : 'Start Extraction'}
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
            <CardTitle className="text-lg">Analysis History</CardTitle>
            <p className="text-xs text-slate-500">수집된 데이터 중 현재 필터 조건에 맞는 목록입니다.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-slate-950/50 p-1 rounded-lg border border-slate-800">
              {['all', 'clean', 'malicious'].map(status => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all uppercase ${filterStatus === status
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-300'
                    }`}
                >
                  {status}
                </button>
              ))}
            </div>
            {lastAnalyzedUrl && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadComments(null, true)}
                className="h-8 gap-2 text-[10px] font-bold border-slate-700 hover:bg-slate-800"
              >
                <Database size={12} /> SHOW ALL HISTORY
              </Button>
            )}
            <div className="px-3 py-1 rounded-full bg-slate-800 text-[10px] font-bold text-slate-400 border border-slate-700">
              {comments.length} ITEMS {lastAnalyzedUrl ? 'FOR THIS VIDEO' : 'TOTAL'}
            </div>
            <Button variant="ghost" size="sm" onClick={() => loadComments()} className="h-8 w-8 p-0 rounded-full hover:bg-slate-800">
              <RotateCcw size={14} className={loading ? 'animate-spin' : ''} />
            </Button>
            {/* Bulk Actions */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800 ml-2">
              {selectedIds.length > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  className="h-8 text-[10px] font-bold px-3 animate-in fade-in"
                  onClick={handleDeleteSelected}
                >
                  DELETE SELECTED ({selectedIds.length})
                </Button>
              )}
              {comments.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-[10px] font-bold px-3 text-red-400 hover:text-red-500 hover:bg-red-500/10 border-red-900/30"
                  onClick={handleDeleteAll}
                >
                  DELETE ALL
                </Button>
              )}
            </div>
          </div >
        </CardHeader>
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
                  <th className="p-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-tighter w-[15%]">Author</th>
                  <th className="p-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-tighter w-[50%]">Comment Content</th>
                  <th className="p-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-tighter w-[15%] text-center">Verdict</th>
                  <th className="p-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-tighter w-[10%] text-center">Date</th>
                  <th className="p-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-tighter w-[10%] text-right">Settings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {loading ? (
                  <tr><td colSpan="6" className="p-20 text-center text-slate-600 text-sm animate-pulse tracking-widest">SCANNING DATA...</td></tr>
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
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-200 text-sm truncate max-w-[120px]">{comment.authorIdentifier}</span>
                        <span className="text-[10px] text-slate-600 font-mono tracking-tighter">YOUTUBE_USER</span>
                      </div>
                    </td>
                    <td className="p-4 align-top">
                      <p className="text-sm text-slate-300 leading-relaxed line-clamp-2 max-w-xl group-hover:line-clamp-none transition-all duration-300">
                        {comment.commentText}
                      </p>
                    </td>
                    <td className="p-4 align-top text-center">
                      {comment.isMalicious ? (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase">
                          <AlertTriangle size={10} /> MALICIOUS
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-black uppercase">
                          <CheckCircle size={10} /> CLEAN
                        </div>
                      )}
                    </td>
                    <td className="p-4 align-top text-center">
                      <div className="text-[11px] text-slate-500 font-medium">
                        {new Date(comment.commentedAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                      </div>
                    </td>
                    <td className="p-4 align-top text-right">
                      <button
                        onClick={() => handleDelete(comment.commentId)}
                        className="p-2 rounded-lg text-slate-600 hover:text-red-500 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan="6" className="p-20 text-center text-slate-600 text-sm italic tracking-wide">No data analyzed in the selected period.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}