// ==================== src/components/User/Suggestions.jsx ====================
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Lightbulb, Send, CheckCircle, Clock, MessageSquare, XCircle, Shield, Search, UserX, Wand2, Activity, User, Bell } from 'lucide-react'
import { getMySuggestions, createSuggestion } from '../../api/suggestions'
import { Link as RouterLink, useLocation } from 'react-router-dom'

export default function Suggestions() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [page, setPage] = useState(0)
  const queryClient = useQueryClient()
  const { pathname } = useLocation()

  const { data, isLoading, error } = useQuery({
    queryKey: ['suggestions', 'my', page],
    queryFn: () => getMySuggestions({ page, size: 5 }),
    keepPreviousData: true
  })

  const suggestions = data?.content || []
  const totalPages = data?.totalPages || 0
  const isFirst = data?.first
  const isLast = data?.last

  // Mutation for creating suggestions
  const createMutation = useMutation({
    mutationFn: createSuggestion,
    onSuccess: () => {
      queryClient.invalidateQueries(['suggestions'])
      setTitle('')
      setContent('')
      alert('건의사항이 제출되었습니다!')
    },
    onError: (error) => {
      alert('건의사항 제출에 실패했습니다: ' + (error.message || '알 수 없는 오류'))
    }
  })

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!title.trim() || !content.trim()) {
      alert('제목과 내용을 모두 입력해주세요.')
      return
    }

    createMutation.mutate({ title, content })
  }

  // User Menu Items
  const menuItems = [
    { id: 'dashboard', label: '대시보드', icon: Shield, path: '/dashboard' },
    { id: 'analysis', label: 'AI 문장분석', icon: Search, path: '/aianalysis' },
    { id: 'management', label: '댓글분석', icon: MessageSquare, path: '/comments' },
    { id: 'blacklist', label: '블랙리스트', icon: UserX, path: '/blacklist' },
    { id: 'writing', label: 'AI 문장 템플릿', icon: Wand2, path: '/aiassistant' },
    //{ id: 'writingassistant', label: 'AI Writing Assistant', icon: Wand2, path: '/writing' },
    { id: 'suggestions', label: '제안/건의', icon: Lightbulb, path: '/suggestions' },
    { id: 'stats', label: '통계', icon: Activity, path: '/statistics' },
    { id: 'profile', label: '설정', icon: User, path: '/profile' },
    { id: 'notices', label: '공지사항', icon: Bell, path: '/notices' },
  ]

  const activeTab = menuItems.find(item => item.path === pathname)?.id || 'suggestions'

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
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                activeTab === item.id
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
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
            <Lightbulb className="h-8 w-8 text-yellow-400" />
            제안 / 건의
          </h1>

          {/* Submit Form */}
          <div className="bg-slate-900 rounded-lg shadow-xl border border-slate-800 p-6 mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">내용</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">제목</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="건의사항 제목을 입력하세요"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">상세내용</label>
                <textarea
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="건의사항 내용을 자세히 입력하세요"
                />
              </div>
              <div className="flex justify-center">
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transition-colors"
                >
                  <Send className="h-5 w-5 mr-2" />
                  {createMutation.isPending ? '제출 중...' : '전송'}
                </button>
              </div>
            </form>
          </div>

          {/* My Suggestions */}
          <div className="bg-slate-900 rounded-lg shadow-xl border border-slate-800">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-white">📝 나의 제안 / 건의</h2>
              <span className="text-sm text-slate-400">Page {page + 1} of {totalPages || 1}</span>
            </div>

            {isLoading ? (
              <div className="p-8 text-center text-slate-400">로딩 중...</div>
            ) : error ? (
              <div className="p-8 text-center text-red-400">
                데이터를 불러오는 중 오류가 발생했습니다.
              </div>
            ) : suggestions.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                아직 제출한 건의사항이 없습니다.
              </div>
            ) : (
              <>
                <div className="divide-y divide-slate-800">
                  {suggestions.map((suggestion) => (
                    <div key={suggestion.suggestionId} className="p-4 hover:bg-slate-800 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <Lightbulb className="h-5 w-5 text-yellow-400 mr-2" />
                            <h3 className="font-semibold text-slate-200">{suggestion.title}</h3>
                          </div>
                          <p className="text-sm text-slate-300 mb-2">{suggestion.content}</p>
                          <p className="text-xs text-slate-500">
                            제출일: {new Date(suggestion.createdAt).toLocaleDateString('ko-KR')}
                          </p>
                        </div>
                        <StatusBadge status={suggestion.status} />
                      </div>

                      {/* Admin Response */}
                      {suggestion.adminResponse && (
                        <div className="mt-3 bg-blue-900/20 border-l-4 border-blue-500 p-3 rounded">
                          <div className="flex items-start">
                            <MessageSquare className="h-5 w-5 text-blue-400 mr-2 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-blue-300 mb-1">관리자 응답</p>
                              <p className="text-sm text-blue-200">{suggestion.adminResponse}</p>
                              {suggestion.respondedAt && (
                                <p className="text-xs text-blue-400 mt-1">
                                  응답일: {new Date(suggestion.respondedAt).toLocaleDateString('ko-KR')}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Pagination Controls */}
                <div className="p-4 border-t border-slate-800 flex justify-center gap-2">
                  <button
                    onClick={() => setPage(old => Math.max(0, old - 1))}
                    disabled={isFirst}
                    className="px-4 py-2 text-sm bg-slate-800 border border-slate-700 text-slate-200 rounded hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(old => (!isLast ? old + 1 : old))}
                    disabled={isLast}
                    className="px-4 py-2 text-sm bg-slate-800 border border-slate-700 text-slate-200 rounded hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }) {
  const config = {
    SUBMITTED: { icon: Clock, color: 'bg-blue-900/30 text-blue-400 border border-blue-900/50', label: 'Submitted' },
    IN_PROGRESS: { icon: Clock, color: 'bg-yellow-900/30 text-yellow-400 border border-yellow-900/50', label: 'In Progress' },
    COMPLETED: { icon: CheckCircle, color: 'bg-green-900/30 text-green-400 border border-green-900/50', label: 'Completed' },
    REJECTED: { icon: XCircle, color: 'bg-red-900/30 text-red-400 border border-red-900/50', label: 'Rejected' },
  }

  const { icon: Icon, color, label } = config[status] || config.SUBMITTED

  return (
    <span className={`flex items-center px-2 py-1 text-xs rounded ${color}`}>
      <Icon className="h-3 w-3 mr-1" />
      {label}
    </span>
  )
}