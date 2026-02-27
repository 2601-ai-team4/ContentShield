// ==================== src/components/Admin/Dashboard.jsx ====================
import { useQuery } from '@tanstack/react-query'
import { adminService } from '../../services/adminService'
import { Users, UserX, AlertTriangle, Activity } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useAuthStore } from '../../stores/authStore'

export default function AdminDashboard() {
  const token = useAuthStore((s) => s.token)
  const hasHydrated = useAuthStore((s) => s.hasHydrated)
  const canFetch = hasHydrated && !!token

  // 사용자 목록
  const { data: allUsers } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: adminService.getAllUsers,
    enabled: canFetch,
    retry: false,
  })

  const { data: flaggedUsers } = useQuery({
    queryKey: ['flaggedUsers'],
    queryFn: adminService.getFlaggedUsers,
    enabled: canFetch,
    retry: false,
  })

  const { data: suspendedUsers } = useQuery({
    queryKey: ['suspendedUsers'],
    queryFn: adminService.getSuspendedUsers,
    enabled: canFetch,
    retry: false,
  })

  // 🆕 월별 사용자 증가 통계
  const { data: userGrowthData, isLoading: growthLoading } = useQuery({
    queryKey: ['userGrowth'],
    queryFn: adminService.getMonthlyUserGrowth,
    enabled: canFetch,
    retry: false,
  })

  // 🆕 최근 관리자 로그
  const { data: recentLogs, isLoading: logsLoading } = useQuery({
    queryKey: ['recentLogs'],
    queryFn: () => adminService.getRecentLogs(5),
    enabled: canFetch,
    retry: false,
  })

  const stats = {
    totalUsers: allUsers?.length || 0,
    flaggedUsers: flaggedUsers?.length || 0,
    suspendedUsers: suspendedUsers?.length || 0,
    activeUsers: allUsers?.filter((u) => u.status === 'ACTIVE').length || 0,
  }

  // 🆕 로그 액션 타입 한글 변환
  const getActionLabel = (actionType) => {
    const labels = {
      'SUSPEND_USER': '사용자 정지',
      'UNSUSPEND_USER': '정지 해제',
      'FLAG_USER': '사용자 플래그',
      'UNFLAG_USER': '플래그 해제',
      'CREATE_NOTICE': '공지 생성',
      'UPDATE_NOTICE': '공지 수정',
      'DELETE_NOTICE': '공지 삭제',
    }
    return labels[actionType] || actionType
  }

  // 🆕 시간 경과 계산
  const getTimeAgo = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return '방금 전'
    if (diffMins < 60) return `${diffMins}분 전`
    if (diffHours < 24) return `${diffHours}시간 전`
    return `${diffDays}일 전`
  }

  return (
    <div className="min-h-screen bg-slate-950 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">📊 Admin Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <AdminStatCard title="Total Users" value={stats.totalUsers} icon={Users} color="blue" />
          <AdminStatCard title="Active Users" value={stats.activeUsers} icon={Activity} color="green" />
          <AdminStatCard title="Flagged Users" value={stats.flaggedUsers} icon={AlertTriangle} color="yellow" />
          <AdminStatCard title="Suspended Users" value={stats.suspendedUsers} icon={UserX} color="red" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 🆕 User Growth - 실제 데이터 */}
          <div className="bg-slate-900 rounded-lg shadow-xl border border-slate-800 p-6">
            <h2 className="text-xl font-semibold mb-4 text-white">User Growth</h2>
            {growthLoading ? (
              <div className="flex justify-center items-center h-[300px] text-slate-400">
                Loading...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={userGrowthData || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f1f5f9' }}
                    itemStyle={{ color: '#f1f5f9' }}
                    labelStyle={{ color: '#94a3b8' }}
                    cursor={{ fill: '#334155', opacity: 0.4 }}
                    formatter={(value) => [`${value}명`, '신규 가입']}
                    labelFormatter={(label) => `${label}`}
                  />
                  <Bar dataKey="users" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* 🆕 Recent Activity - 실제 데이터 */}
          <div className="bg-slate-900 rounded-lg shadow-xl border border-slate-800 p-6">
            <h2 className="text-xl font-semibold mb-4 text-white">Recent Activity</h2>
            {logsLoading ? (
              <div className="flex justify-center items-center h-[300px] text-slate-400">
                Loading...
              </div>
            ) : recentLogs && recentLogs.length > 0 ? (
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                {recentLogs.map((log, idx) => (
                  <div key={log.logId || idx} className="flex items-center justify-between p-3 bg-slate-800/50 rounded hover:bg-slate-800 transition-colors border border-slate-700/50">
                    <div>
                      <p className="font-medium text-slate-200">{getActionLabel(log.actionType)}</p>
                      <p className="text-sm text-slate-400">
                        {log.targetType} #{log.targetId}
                        {log.description && (
                          <span className="ml-2 text-slate-500">- {log.description.substring(0, 30)}...</span>
                        )}
                      </p>
                    </div>
                    <span className="text-xs text-slate-500 whitespace-nowrap ml-2">
                      {getTimeAgo(log.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex justify-center items-center h-[300px] text-slate-500">
                최근 활동이 없습니다.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function AdminStatCard({ title, value, icon: Icon, color }) {
  const colors = {
    blue: 'bg-blue-900/30 text-blue-400 border border-blue-900/50',
    green: 'bg-green-900/30 text-green-400 border border-green-900/50',
    yellow: 'bg-yellow-900/30 text-yellow-400 border border-yellow-900/50',
    red: 'bg-red-900/30 text-red-400 border border-red-900/50',
  }

  return (
    <div className="bg-slate-900 rounded-lg shadow-xl border border-slate-800 p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-400">{title}</p>
          <p className="text-3xl font-bold mt-1 text-white">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colors[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  )
}