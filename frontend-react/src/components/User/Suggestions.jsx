// ==================== src/components/User/Suggestions.jsx ====================
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Lightbulb, Send, CheckCircle, Clock, MessageSquare, XCircle } from 'lucide-react'
import { getMySuggestions, createSuggestion } from '../../api/suggestions'

export default function Suggestions() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [page, setPage] = useState(0)
  const queryClient = useQueryClient()

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

  // ... (handleSubmit remains same)
  const handleSubmit = (e) => {
    e.preventDefault()

    if (!title.trim() || !content.trim()) {
      alert('제목과 내용을 모두 입력해주세요.')
      return
    }

    createMutation.mutate({ title, content })
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-white mb-8">💡 Suggestions</h1>

      {/* Submit Form */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Submit a Suggestion</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              placeholder="건의사항 제목을 입력하세요"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Details</label>
            <textarea
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              placeholder="건의사항 내용을 자세히 입력하세요"
            />
          </div>
          <div className="flex justify-center">
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-6 py-2 bg-blue-700 text-white rounded hover:bg-blue-800 flex items-center disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              <Send className="h-5 w-5 mr-2" />
              {createMutation.isPending ? '제출 중...' : 'Submit Suggestion'}
            </button>
          </div>
        </form>
      </div>

      {/* My Suggestions */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold text-black">📝 My Suggestions</h2>
          <span className="text-sm text-gray-500">Page {page + 1} of {totalPages || 1}</span>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-gray-500">로딩 중...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-600">
            데이터를 불러오는 중 오류가 발생했습니다.
          </div>
        ) : suggestions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            아직 제출한 건의사항이 없습니다.
          </div>
        ) : (
          <>
            <div className="divide-y">
              {suggestions.map((suggestion) => (
                <div key={suggestion.suggestionId} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <Lightbulb className="h-5 w-5 text-yellow-500 mr-2" />
                        <h3 className="font-semibold text-black">{suggestion.title}</h3>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{suggestion.content}</p>
                      <p className="text-xs text-gray-400">
                        제출일: {new Date(suggestion.createdAt).toLocaleDateString('ko-KR')}
                      </p>
                    </div>
                    <StatusBadge status={suggestion.status} />
                  </div>

                  {/* Admin Response */}
                  {suggestion.adminResponse && (
                    <div className="mt-3 bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
                      <div className="flex items-start">
                        <MessageSquare className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-blue-900 mb-1">관리자 응답</p>
                          <p className="text-sm text-blue-800">{suggestion.adminResponse}</p>
                          {suggestion.respondedAt && (
                            <p className="text-xs text-blue-600 mt-1">
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
            <div className="p-4 border-t flex justify-center gap-2">
              <button
                onClick={() => setPage(old => Math.max(0, old - 1))}
                disabled={isFirst}
                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(old => (!isLast ? old + 1 : old))}
                disabled={isLast}
                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function StatusBadge({ status }) {
  const config = {
    SUBMITTED: { icon: Clock, color: 'bg-blue-100 text-blue-800', label: 'Submitted' },
    IN_PROGRESS: { icon: Clock, color: 'bg-yellow-100 text-yellow-800', label: 'In Progress' },
    COMPLETED: { icon: CheckCircle, color: 'bg-green-100 text-green-800', label: 'Completed' },
    REJECTED: { icon: XCircle, color: 'bg-red-100 text-red-800', label: 'Rejected' },
  }

  const { icon: Icon, color, label } = config[status] || config.SUBMITTED

  return (
    <span className={`flex items-center px-2 py-1 text-xs rounded ${color}`}>
      <Icon className="h-3 w-3 mr-1" />
      {label}
    </span>
  )
}
