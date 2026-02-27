// ==================== src/components/Admin/SuggestionManager.jsx ====================
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Lightbulb, CheckCircle, XCircle, Clock, X } from 'lucide-react'
import { getAllSuggestions, respondToSuggestion } from '../../api/suggestions'

export default function SuggestionManager() {
  const [page, setPage] = useState(0)
  const [selectedSuggestion, setSelectedSuggestion] = useState(null)
  const [responseText, setResponseText] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('IN_PROGRESS')
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ['suggestions', 'all', page],
    queryFn: () => getAllSuggestions({ page, size: 5 }),
    keepPreviousData: true
  })

  const suggestions = data?.content || []
  const totalPages = data?.totalPages || 0
  const isFirst = data?.first
  const isLast = data?.last

  // Mutation for responding to suggestions
  const respondMutation = useMutation({
    mutationFn: respondToSuggestion,
    onSuccess: () => {
      queryClient.invalidateQueries(['suggestions'])
      handleCloseModal()
    }
  })

  // ... (handlers remain the same)
  const handleOpenModal = (suggestion) => {
    setSelectedSuggestion(suggestion)
    setResponseText('')
    setSelectedStatus('IN_PROGRESS')
  }

  const handleCloseModal = () => {
    setSelectedSuggestion(null)
    setResponseText('')
    setSelectedStatus('IN_PROGRESS')
  }

  const handleSubmitResponse = () => {
    if (!responseText.trim()) {
      alert('응답 내용을 입력해주세요.')
      return
    }

    respondMutation.mutate({
      suggestionId: selectedSuggestion.suggestionId,
      response: responseText,
      status: selectedStatus
    })
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center">로딩 중...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center text-red-600">
          데이터를 불러오는 중 오류가 발생했습니다.
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-white mb-8">💡 Suggestion Management</h1>

      <div className="bg-slate-900 rounded-lg shadow-xl border border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-700 bg-slate-900 text-right text-sm text-slate-400">
          Page {page + 1} of {totalPages || 1}
        </div>
        <table className="min-w-full divide-y divide-slate-800">
          <thead className="bg-slate-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                Suggestion
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                Date
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-slate-900 divide-y divide-slate-800">
            {suggestions.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
                  건의사항이 없습니다.
                </td>
              </tr>
            ) : (
              suggestions.map((suggestion) => (
                <tr key={suggestion.suggestionId} className="hover:bg-slate-800 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-start flex-col">
                      <div className="flex items-center mb-1">
                        <Lightbulb className="h-5 w-5 text-yellow-400 mr-2" />
                        <span className="font-medium text-white">{suggestion.title}</span>
                      </div>
                      <p className="text-sm text-slate-400 ml-7 line-clamp-2">
                        {suggestion.content}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-400">
                    User ID: {suggestion.userId}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={suggestion.status} />
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {new Date(suggestion.createdAt).toLocaleDateString('ko-KR')}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleOpenModal(suggestion)}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                      Respond
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination Controls */}
        <div className="p-4 border-t border-slate-700 bg-slate-900 flex justify-center gap-2">
          <button
            onClick={() => setPage(old => Math.max(0, old - 1))}
            disabled={isFirst}
            className="px-4 py-2 text-sm bg-slate-800 border border-slate-700 text-slate-300 rounded hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <button
            onClick={() => setPage(old => (!isLast ? old + 1 : old))}
            disabled={isLast}
            className="px-4 py-2 text-sm bg-slate-800 border border-slate-700 text-slate-300 rounded hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>

      {/* Response Modal */}
      {selectedSuggestion && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-900 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto border border-slate-700">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-700">
              <h2 className="text-xl font-semibold flex items-center text-white">
                💬 응답 작성
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* Suggestion Info */}
              <div className="bg-slate-800 border border-slate-700 p-4 rounded-lg space-y-2">
                <div>
                  <span className="text-sm font-medium text-slate-400">건의:</span>
                  <p className="text-slate-200 mt-1">{selectedSuggestion.title}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-slate-400">내용:</span>
                  <p className="text-slate-400 text-sm mt-1">{selectedSuggestion.content}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-slate-400">고객:</span>
                  <p className="text-slate-200 mt-1">User ID: {selectedSuggestion.userId}</p>
                </div>
              </div>

              {/* Response Input */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  응답 내용:
                </label>
                <textarea
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  rows={6}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-200 placeholder-slate-500"
                  placeholder="고객에게 전달할 응답을 작성해주세요..."
                />
              </div>

              {/* Status Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  상태 변경:
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-200"
                >
                  <option value="SUBMITTED">🔵 Submitted (제출됨)</option>
                  <option value="IN_PROGRESS">🟡 In Progress (검토 중)</option>
                  <option value="COMPLETED">🟢 Completed (완료)</option>
                  <option value="REJECTED">🔴 Rejected (반려)</option>
                </select>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 p-6 border-t border-slate-700 bg-slate-900">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 text-slate-300 bg-slate-800 border border-slate-600 rounded-lg hover:bg-slate-700"
              >
                취소
              </button>
              <button
                onClick={handleSubmitResponse}
                disabled={respondMutation.isPending}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {respondMutation.isPending ? '전송 중...' : '응답 전송'}
              </button>
            </div>
          </div>
        </div>
      )}
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
    <span className={`flex items-center px-3 py-1.5 text-xs font-bold rounded-md ${color}`}>
      <Icon className="h-3 w-3 mr-1" />
      {label}
    </span>
  )
}