// ==================== src/components/Admin/UserManagement.jsx ====================
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminService } from '../../services/adminService'
import { Search, UserX, UserCheck, Flag, FlagOff, RefreshCw } from 'lucide-react'

export default function UserManagement() {
  const [searchTerm, setSearchTerm] = useState('')
  const queryClient = useQueryClient()

  // ✅ React Query v5 문법
  const { data: users, isLoading, refetch } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: adminService.getAllUsers
  })

  // ✅ 정지 Mutation (v5)
  const suspendMutation = useMutation({
    mutationFn: ({ userId, reason, days }) => adminService.suspendUser(userId, reason, days),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] })
      alert('사용자가 정지되었습니다.')
    },
    onError: (error) => {
      alert('정지 실패: ' + (error.response?.data?.message || error.message))
    }
  })

  // ✅ 정지 해제 Mutation (v5)
  const unsuspendMutation = useMutation({
    mutationFn: (userId) => adminService.unsuspendUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] })
      alert('정지가 해제되었습니다.')
    },
    onError: (error) => {
      alert('해제 실패: ' + (error.response?.data?.message || error.message))
    }
  })

  // ✅ 플래그 Mutation (v5)
  const flagMutation = useMutation({
    mutationFn: ({ userId, reason }) => adminService.flagUser(userId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] })
      alert('사용자가 플래그되었습니다.')
    },
    onError: (error) => {
      alert('플래그 실패: ' + (error.response?.data?.message || error.message))
    }
  })

  // ✅ 플래그 해제 Mutation (v5)
  const unflagMutation = useMutation({
    mutationFn: (userId) => adminService.unflagUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] })
      alert('플래그가 해제되었습니다.')
    },
    onError: (error) => {
      alert('해제 실패: ' + (error.response?.data?.message || error.message))
    }
  })

  // 검색 필터
  const filteredUsers = users?.filter(user =>
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  // 정지 처리
  const handleSuspend = (user) => {
    const reason = prompt('정지 사유를 입력하세요:')
    if (reason) {
      const days = prompt('정지 기간(일)을 입력하세요:', '7')
      if (days) {
        suspendMutation.mutate({ userId: user.userId, reason, days: parseInt(days) })
      }
    }
  }

  // 정지 해제 처리
  const handleUnsuspend = (user) => {
    if (confirm(`${user.username || user.email} 사용자의 정지를 해제하시겠습니까?`)) {
      unsuspendMutation.mutate(user.userId)
    }
  }

  // 플래그 처리
  const handleFlag = (user) => {
    const reason = prompt('플래그 사유를 입력하세요:')
    if (reason) {
      flagMutation.mutate({ userId: user.userId, reason })
    }
  }

  // 플래그 해제 처리
  const handleUnflag = (user) => {
    if (confirm(`${user.username || user.email} 사용자의 플래그를 해제하시겠습니까?`)) {
      unflagMutation.mutate(user.userId)
    }
  }

  // 상태 배지 컴포넌트
  const StatusBadge = ({ status, isSuspended, isFlagged }) => {
    if (isSuspended) {
      return (
        <span className="px-2 py-1 text-xs rounded bg-red-500/20 text-red-400 border border-red-500/30">
          SUSPENDED
        </span>
      )
    }
    if (status === 'ACTIVE') {
      return (
        <span className="px-2 py-1 text-xs rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
          ACTIVE
        </span>
      )
    }
    return (
      <span className="px-2 py-1 text-xs rounded bg-slate-500/20 text-slate-400 border border-slate-500/30">
        {status}
      </span>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* 헤더 */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-white">👥 사용자 관리</h1>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
        >
          <RefreshCw size={16} />
          새로고침
        </button>
      </div>

      {/* 검색 */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="이메일 또는 이름으로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <p className="text-slate-400 text-sm">전체 사용자</p>
          <p className="text-2xl font-bold text-slate-100">{users?.length || 0}</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <p className="text-slate-400 text-sm">활성 사용자</p>
          <p className="text-2xl font-bold text-emerald-400">
            {users?.filter(u => !u.isSuspended).length || 0}
          </p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <p className="text-slate-400 text-sm">정지된 사용자</p>
          <p className="text-2xl font-bold text-red-400">
            {users?.filter(u => u.isSuspended).length || 0}
          </p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <p className="text-slate-400 text-sm">플래그된 사용자</p>
          <p className="text-2xl font-bold text-yellow-400">
            {users?.filter(u => u.isFlagged).length || 0}
          </p>
        </div>
      </div>

      {/* 사용자 테이블 */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-slate-700">
          <thead className="bg-slate-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                사용자
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                역할
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                상태
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                가입일
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                관리
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {isLoading ? (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
                  <RefreshCw className="animate-spin h-6 w-6 mx-auto mb-2" />
                  로딩 중...
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-slate-400">
                  사용자가 없습니다.
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.userId} className="hover:bg-slate-700/50 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-slate-200">{user.username || '-'}</p>
                      <p className="text-sm text-slate-500">{user.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded ${user.role === 'ADMIN'
                      ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                      : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                      }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <StatusBadge
                        status={user.status}
                        isSuspended={user.isSuspended}
                        isFlagged={user.isFlagged}
                      />
                      {user.isFlagged && (
                        <span className="px-2 py-1 text-xs rounded bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                          ⚠️ FLAGGED
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-400">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString('ko-KR') : '-'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      {/* 정지/해제 버튼 */}
                      {user.isSuspended ? (
                        <button
                          onClick={() => handleUnsuspend(user)}
                          className="p-2 text-emerald-400 hover:bg-emerald-500/20 rounded-lg transition-colors"
                          title="정지 해제"
                        >
                          <UserCheck size={18} />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleSuspend(user)}
                          className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                          title="사용자 정지"
                          disabled={user.role === 'ADMIN'}
                        >
                          <UserX size={18} />
                        </button>
                      )}

                      {/* 플래그/해제 버튼 */}
                      {user.isFlagged ? (
                        <button
                          onClick={() => handleUnflag(user)}
                          className="p-2 text-slate-400 hover:bg-slate-500/20 rounded-lg transition-colors"
                          title="플래그 해제"
                        >
                          <FlagOff size={18} />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleFlag(user)}
                          className="p-2 text-yellow-400 hover:bg-yellow-500/20 rounded-lg transition-colors"
                          title="플래그 설정"
                        >
                          <Flag size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 범례 */}
      <div className="mt-4 flex gap-6 text-sm text-slate-400">
        <div className="flex items-center gap-2">
          <UserX size={16} className="text-red-400" />
          <span>정지</span>
        </div>
        <div className="flex items-center gap-2">
          <UserCheck size={16} className="text-emerald-400" />
          <span>정지 해제</span>
        </div>
        <div className="flex items-center gap-2">
          <Flag size={16} className="text-yellow-400" />
          <span>플래그</span>
        </div>
        <div className="flex items-center gap-2">
          <FlagOff size={16} className="text-slate-400" />
          <span>플래그 해제</span>
        </div>
      </div>
    </div>
  )
}
