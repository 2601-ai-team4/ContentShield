// ==================== src/components/Admin/Dashboard.jsx ====================
import { useQuery } from '@tanstack/react-query'
import { adminService } from '../../services/adminService'
import { Users, UserX, AlertTriangle, Activity } from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'

// #장소영~ 토큰/rehydrate 상태로 enabled 제어
import { useAuthStore } from '../../stores/authStore'
// #여기까지

export default function AdminDashboard() {
  // #장소영~ rehydrate 완료 + token 있을 때만 API 호출
  const token = useAuthStore((s) => s.token)
  const hasHydrated = useAuthStore((s) => s.hasHydrated)
  const canFetch = hasHydrated && !!token
  // #여기까지

  const { data: dashboardStats } = useQuery({
    queryKey: ['adminDashboardStats'],
    queryFn: adminService.getDashboardStats,
    enabled: canFetch,
    retry: false,
  })

  const { data: recentLogs } = useQuery({
    queryKey: ['adminRecentLogs', 10],
    queryFn: () => adminService.getRecentLogs(10),
    enabled: canFetch,
    retry: false,
  })

  // ==================== #장소영~여기까지: ✅ 최근 7일(일별) 가입자수 추이 ====================
  // GET /api/admin/dashboard/signups-daily?days=7
  const { data: dailySignups } = useQuery({
    queryKey: ['adminDailySignups', 7],
    queryFn: () => adminService.getDailySignups(7),
    enabled: canFetch,
    retry: false,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  })
  // ==================== #여기까지 ====================

  const stats = {
    totalUsers: dashboardStats?.totalUsers ?? 0,
    flaggedUsers: dashboardStats?.flaggedUsers ?? 0,
    suspendedUsers: dashboardStats?.suspendedUsers ?? 0,
    activeUsers: dashboardStats?.activeUsers ?? 0,
  }

  // ==================== #장소영~여기까지: ✅ 최근 7일 유지 + X축을 일~토로 고정 ====================
  const rawDaily = Array.isArray(dailySignups) ? dailySignups : (dailySignups?.data ?? [])
  const chartData = buildLast7DaysFixedWeekdayChart(rawDaily) // ✅ 여기 변경
  const hasChart = chartData.length > 0
  // ==================== #여기까지 ====================

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-white mb-8">📊 Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <AdminStatCard title="Total Users" value={stats.totalUsers} icon={Users} color="blue" />
        <AdminStatCard title="Active Users" value={stats.activeUsers} icon={Activity} color="green" />
        <AdminStatCard title="Flagged Users" value={stats.flaggedUsers} icon={AlertTriangle} color="yellow" />
        <AdminStatCard title="Suspended Users" value={stats.suspendedUsers} icon={UserX} color="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* LEFT: Daily Signups */}
        <div className="bg-white rounded-lg shadow p-6 h-[420px] flex flex-col">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 shrink-0">
           Daily Signups (Last 7 Days, by Weekday)
          </h2>

          <div className="flex-1 min-h-0">
            {hasChart ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 12, right: 18, left: 8, bottom: 40 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    // ==================== #장소영~여기까지: X축을 '일~토'로 고정 ====================
                    dataKey="weekday"
                    interval={0}
                    height={36}
                    tickMargin={12}
                    axisLine={{ stroke: '#111827' }}
                    tickLine={{ stroke: '#111827' }}
                    tick={{ fill: '#111827', fontSize: 12, fontWeight: 700 }}
                    // ==================== #여기까지 ====================
                  />
                  <YAxis
                    allowDecimals={false}
                    width={44}
                    tickMargin={10}
                    axisLine={{ stroke: '#111827' }}
                    tickLine={{ stroke: '#111827' }}
                    tick={{ fill: '#111827', fontSize: 12, fontWeight: 700 }}
                  />
                  <Tooltip
                    // ==================== #장소영~여기까지: 고정 X축이라도 툴팁에 날짜/요일 같이 표시 ====================
                    formatter={(value) => [value, '가입자수']}
                    labelFormatter={(label, payload) => {
                      const p = payload?.[0]?.payload
                      // 요일 단위로 합산되므로, 기간 범위를 함께 보여줌
                      return p?.range ? `${label} (${p.range})` : label
                    }}
                    contentStyle={{ color: '#111827' }}
                    // ==================== #여기까지 ====================
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#3b82f6"
                    fill="#93c5fd"
                    fillOpacity={0.7}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-600 font-medium">
                최근 7일 가입자 데이터가 없습니다.
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Recent Activity */}
        <div className="bg-white rounded-lg shadow p-6 h-[420px] flex flex-col">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 shrink-0">
            Recent Activity
          </h2>

          <div className="flex-1 min-h-0 overflow-y-auto pr-2">
            <div className="space-y-3">
              {(recentLogs || []).slice(0, 50).map((log) => (
                <div
                  key={log.logId}
                  className="flex items-start justify-between p-3 bg-gray-50 rounded border border-gray-200"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900">
                      {log.actionType}
                      {log.targetType ? ` • ${log.targetType}/${log.targetId ?? '-'}` : ''}
                    </p>
                    <p className="text-sm text-gray-700">adminId: {log.adminId}</p>
                    {log.description && (
                      <p className="text-sm text-gray-800 break-words">{log.description}</p>
                    )}
                  </div>

                  <span className="text-xs text-gray-700 font-medium shrink-0 ml-3">
                    {log.createdAt ? new Date(log.createdAt).toLocaleString() : '-'}
                  </span>
                </div>
              ))}

              {(!recentLogs || recentLogs.length === 0) && (
                <div className="text-sm text-gray-700 font-medium">최근 로그가 없습니다.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function AdminStatCard({ title, value, icon: Icon, color }) {
  const colors = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    red: 'bg-red-100 text-red-600',
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-700 font-medium">{title}</p>
          <p className="text-3xl font-extrabold mt-1 text-gray-900">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colors[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  )
}

// ==================== #장소영~여기까지: ✅ 최근 7일 유지 + X축을 일~토로 고정(빈 요일 0) ====================
// - 최근 7일은 날짜 기준으로 유지
// - 차트는 요일 축을 고정(일~토)시키고,
//   최근 7일에 해당하는 날짜들만 해당 요일에 "합산"해서 채움
function buildLast7DaysFixedWeekdayChart(rawDaily) {
  const weekdays = ['일', '월', '화', '수', '목', '금', '토']

  // 1) rawDaily를 YYYY-MM-DD -> count로 맵
  const byDate = new Map()
  for (const x of rawDaily || []) {
    const dayRaw =
      x.day ??
      x.date ??
      x.createdAt ??
      x.created_at ??
      x.signupDate ??
      x.signup_day

    const countRaw =
      x.signup_count ??
      x.signupCount ??
      x.count ??
      x.value ??
      0

    const key = toDateKey(dayRaw)
    if (!key) continue
    byDate.set(key, Number(countRaw ?? 0))
  }

  // 2) "최근 7일" 날짜 리스트 생성 (오늘 포함)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const last7 = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    const key = toDateKey(d)
    last7.push({ date: key, dayIndex: d.getDay() })
  }

  // 3) 요일별 합산(일~토 고정)
  const counts = new Array(7).fill(0)
  for (const item of last7) {
    const c = byDate.get(item.date) ?? 0
    counts[item.dayIndex] += c
  }

  // 4) 툴팁에 "최근 7일 범위"도 같이 보여주기 위해 range 생성
  const start = last7[0]?.date
  const end = last7[last7.length - 1]?.date
  const range = start && end ? `${start} ~ ${end}` : ''

  // 5) 차트 데이터(항상 7개 고정)
  return weekdays.map((w, idx) => ({
    weekday: w,
    count: counts[idx],
    range, // 툴팁용
  }))
}
// ==================== #여기까지 ====================

function toDateKey(value) {
  if (!value) return null

  if (value instanceof Date) {
    const y = value.getFullYear()
    const m = String(value.getMonth() + 1).padStart(2, '0')
    const d = String(value.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  if (typeof value === 'number') {
    const d = new Date(value)
    if (isNaN(d.getTime())) return null
    return toDateKey(d)
  }

  const str = String(value).trim()
  let datePart = str
  if (datePart.includes('T')) datePart = datePart.split('T')[0]
  if (datePart.includes(' ')) datePart = datePart.split(' ')[0]

  const d = new Date(`${datePart}T00:00:00`)
  if (isNaN(d.getTime())) return null
  return toDateKey(d)
}
// ==================== #여기까지 ====================
