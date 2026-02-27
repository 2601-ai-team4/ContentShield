// src/components/User/SuspendedPage.jsx
import { useAuthStore } from '../../stores/authStore';
import { AlertTriangle, Mail } from 'lucide-react';

export default function SuspendedPage() {
  const { user } = useAuthStore();

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="bg-slate-900 border border-orange-500/30 rounded-2xl p-12 max-w-lg text-center">
        {/* 아이콘 */}
        <div className="w-20 h-20 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-10 h-10 text-orange-400" />
        </div>

        {/* 제목 */}
        <h1 className="text-2xl font-bold text-white mb-2">
          계정이 일시정지 되었습니다
        </h1>
        <p className="text-slate-400 mb-8">
          서비스 이용이 일시적으로 제한되었습니다.
        </p>

        {/* 정보 */}
        <div className="bg-slate-800/50 rounded-lg p-6 text-left space-y-4 mb-8">
          <div className="flex items-center gap-3">
            <span className="text-slate-500">사용자:</span>
            <span className="text-white font-medium">{user?.username || user?.email}</span>
          </div>
          
          {user?.suspensionReason && (
            <div className="flex items-center gap-3">
              <span className="text-slate-500">정지 사유:</span>
              <span className="text-orange-400">{user.suspensionReason}</span>
            </div>
          )}
        </div>

        {/* 안내 */}
        <div className="text-sm text-slate-500">
          <p className="flex items-center justify-center gap-2">
            <Mail className="w-4 h-4" />
            문의: support@guardai.com
          </p>
        </div>
      </div>
    </div>
  );
}