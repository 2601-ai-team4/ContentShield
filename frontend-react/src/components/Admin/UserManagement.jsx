// ==================== src/components/Admin/UserManagement.jsx ====================
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminService } from '../../services/adminService'
import { Search, UserX, UserCheck, Flag, FlagOff,Users } from 'lucide-react'

export default function UserManagement() {
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const queryClient = useQueryClient()

  const { data: users, isLoading } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: adminService.getAllUsers
  })

  // 🔴 정지
  const suspendMutation = useMutation({
    mutationFn: ({ userId, reason, days }) => adminService.suspendUser(userId, reason, days),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] })
      alert('사용자가 정지되었습니다.')
    },
  })

  // 🆕 ✅ 정지 해제
  const unsuspendMutation = useMutation({
    mutationFn: (userId) => adminService.unsuspendUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] })
      alert('정지가 해제되었습니다.')
    },
  })

  // 🟡 플래그
  const flagMutation = useMutation({
    mutationFn: ({ userId, reason }) => adminService.flagUser(userId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] })
      alert('사용자가 플래그되었습니다.')
    },
  })

  // 🆕 ⬜ 플래그 해제
  const unflagMutation = useMutation({
    mutationFn: (userId) => adminService.unflagUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] })
      alert('플래그가 해제되었습니다.')
    },
  })

  // 검색 필터
  const filteredUsers = users?.filter(user =>
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // 페이지네이션 계산
  const totalPages = Math.ceil((filteredUsers?.length || 0) / itemsPerPage)
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentUsers = filteredUsers?.slice(indexOfFirstItem, indexOfLastItem)

  // 검색어 변경 시 첫 페이지로 이동
  const handleSearch = (value) => {
    setSearchTerm(value)
    setCurrentPage(1)
  }

  // 페이지 번호 생성
  const getPageNumbers = () => {
    const pageNumbers = []
    const maxVisiblePages = 5
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1)
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i)
    }
    return pageNumbers
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold flex text-white items-center gap-2 mb-6"><Users className="text-blue-400" />User Management</h1>

      {/* 검색 */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="이메일 또는 이름으로 검색..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-slate-900 rounded-lg shadow-xl border border-slate-800 overflow-hidden">
        <table className="min-w-full divide-y divide-slate-800">
          <thead className="bg-slate-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                Created
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-slate-900 divide-y divide-slate-800">
            {isLoading ? (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-slate-400">Loading...</td>
              </tr>
            ) : currentUsers?.map((user) => (
              <tr key={user.userId} className="hover:bg-slate-800 transition-colors">
                <td className="px-6 py-4">
                  <div>
                    <p className="font-medium text-slate-200">{user.username}</p>
                    <p className="text-sm text-slate-400">{user.email}</p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs rounded ${
                    user.role === 'ADMIN' ? 'bg-purple-900/30 text-purple-400 border border-purple-900/50' : 'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col space-y-1">
                    <span className={`px-2 py-1 text-xs rounded w-fit ${
                      user.status === 'ACTIVE' ? 'bg-green-900/30 text-green-400 border border-green-900/50' :
                      user.status === 'SUSPENDED' ? 'bg-red-900/30 text-red-400 border border-red-900/50' :
                      'bg-slate-800 text-slate-300 border border-slate-700'
                    }`}>
                      {user.status}
                    </span>
                    {user.isFlagged && (
                      <span className="px-2 py-1 text-xs rounded bg-yellow-900/30 text-yellow-400 border border-yellow-900/50 w-fit">
                        Flagged
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-400">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                  {/* 🆕 정지/해제 버튼 (상태에 따라 변경) */}
                  {user.status === 'SUSPENDED' || user.isSuspended ? (
                    // ✅ 정지 해제 버튼
                    <button
                      onClick={() => {
                        if (confirm(`${user.username || user.email}의 정지를 해제하시겠습니까?`)) {
                          unsuspendMutation.mutate(user.userId)
                        }
                      }}
                      className="text-green-400 hover:text-green-300 transition-colors"
                      title="정지 해제"
                    >
                      <UserCheck className="h-5 w-5 inline" />
                    </button>
                  ) : (
                    // 🔴 정지 버튼
                    <button
                      onClick={() => {
                        const reason = prompt('정지 사유를 입력하세요:')
                        if (reason) {
                          const days = prompt('정지 기간(일)을 입력하세요:', '7')
                          if (days) {
                            suspendMutation.mutate({ userId: user.userId, reason, days: parseInt(days) })
                          }
                        }
                      }}
                      className="text-red-400 hover:text-red-300 transition-colors"
                      title="사용자 정지"
                    >
                      <UserX className="h-5 w-5 inline" />
                    </button>
                  )}

                  {/* 🆕 플래그/해제 버튼 (상태에 따라 변경) */}
                  {user.isFlagged ? (
                    // ⬜ 플래그 해제 버튼
                    <button
                      onClick={() => {
                        if (confirm(`${user.username || user.email}의 플래그를 해제하시겠습니까?`)) {
                          unflagMutation.mutate(user.userId)
                        }
                      }}
                      className="text-slate-400 hover:text-slate-300 transition-colors"
                      title="플래그 해제"
                    >
                      <FlagOff className="h-5 w-5 inline" />
                    </button>
                  ) : (
                    // 🟡 플래그 버튼
                    <button
                      onClick={() => {
                        const reason = prompt('플래그 사유를 입력하세요:')
                        if (reason) {
                          flagMutation.mutate({ userId: user.userId, reason })
                        }
                      }}
                      className="text-yellow-400 hover:text-yellow-300 transition-colors"
                      title="사용자 플래그"
                    >
                      <Flag className="h-5 w-5 inline" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 */}
      {filteredUsers && filteredUsers.length > 0 && (
        <div className="mt-4 flex items-center justify-between px-4">
          <div className="text-sm text-slate-400">
            Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredUsers.length)} of {filteredUsers.length} results
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 bg-slate-800 border border-slate-700 rounded text-slate-200 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            
            {getPageNumbers().map(number => (
              <button
                key={number}
                onClick={() => setCurrentPage(number)}
                className={`px-3 py-1 rounded transition-colors ${
                  currentPage === number
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700'
                }`}
              >
                {number}
              </button>
            ))}
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 bg-slate-800 border border-slate-700 rounded text-slate-200 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}