// Navbar.jsx
import { useAuthStore } from '../../stores/authStore';
import { useNavigate, useLocation } from 'react-router-dom';
import { Shield, User, Power, ArrowLeftRight, AlertTriangle, Flag } from 'lucide-react';

export default function Navbar() {
  const { user, logout, isSuspended, isFlagged } = useAuthStore();  // 🆕 isFlagged 추가
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) return null;

  const isAdminMode = location.pathname.startsWith('/admin');
  const isAdmin = user?.role === 'ADMIN';

  const toggleMode = () => {
    if (isAdminMode) {
      navigate('/dashboard');
    } else {
      navigate('/admin/dashboard');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // 🆕 주의 클릭 시 설정 페이지로 이동
  const handleWarningClick = () => {
    navigate('/profile?tab=warning');
  };

  return (
    <nav className="bg-slate-900 border-b border-slate-800 px-6 py-3">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-white tracking-tight">GUARD AI</h1>

          {/* 현재 모드 상태 배지 (정지/주의 상태가 아닐 때만) */}
          {isAdmin && !isSuspended && !isFlagged && (
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${isAdminMode
                ? 'bg-red-900/30 text-red-400 border border-red-900/50'
                : 'bg-blue-900/30 text-blue-400 border border-blue-900/50'
              }`}>
              {isAdminMode ? (
                <><Shield className="inline h-3 w-3 mr-1" />Admin Mode</>
              ) : (
                <><User className="inline h-3 w-3 mr-1" />User Mode</>
              )}
            </span>
          )}
        </div>

        <div className="flex items-center gap-4">
          {/* 🆕 일시정지 사용자 표시 */}
          {isSuspended && (
            <div className="flex items-center gap-2 px-4 py-2 bg-red-900/30 border border-red-500/50 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <span className="text-red-400 font-medium text-sm">
                {user?.username || user?.email} : 일시정지
              </span>
            </div>
          )}

          {/* 🆕 주의(플래그) 사용자 표시 - 클릭 가능 */}
          {isFlagged && !isSuspended && (
            <button
              onClick={handleWarningClick}
              className="flex items-center gap-2 px-4 py-2 bg-yellow-900/30 border border-yellow-500/50 rounded-lg hover:bg-yellow-900/50 transition-colors cursor-pointer"
            >
              <Flag className="h-4 w-4 text-yellow-400" />
              <span className="text-yellow-400 font-medium text-sm">
                {user?.username || user?.email} : <span className="underline">주의</span>
              </span>
            </button>
          )}

          {/* 관리자용 모드 전환 버튼 (정지/주의 상태가 아닐 때만) */}
          {isAdmin && !isSuspended && (
            <button
              onClick={toggleMode}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all border border-slate-700"
            >
              <ArrowLeftRight className="h-4 w-4" />
              {isAdminMode ? 'Switch to User View' : 'Switch to Admin View'}
            </button>
          )}

          <div className="h-6 w-px bg-slate-700 mx-2"></div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            <Power className="h-4 w-4" />
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}