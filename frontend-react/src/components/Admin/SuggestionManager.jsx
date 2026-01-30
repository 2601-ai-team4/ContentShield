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

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b bg-gray-50 text-right text-sm text-gray-500">
          Page {page + 1} of {totalPages || 1}
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Suggestion
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Date
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {suggestions.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                  건의사항이 없습니다.
                </td>
              </tr>
            ) : (
              suggestions.map((suggestion) => (
                <tr key={suggestion.suggestionId}>
                  <td className="px-6 py-4">
                    <div className="flex items-start flex-col">
                      <div className="flex items-center mb-1">
                        <Lightbulb className="h-5 w-5 text-yellow-500 mr-2" />
                        <span className="font-medium text-black">{suggestion.title}</span>
                      </div>
                      <p className="text-sm text-gray-600 ml-7 line-clamp-2">
                        {suggestion.content}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    User ID: {suggestion.userId}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={suggestion.status} />
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(suggestion.createdAt).toLocaleDateString('ko-KR')}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleOpenModal(suggestion)}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
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
        <div className="p-4 border-t bg-gray-50 flex justify-center gap-2">
          <button
            onClick={() => setPage(old => Math.max(0, old - 1))}
            disabled={isFirst}
            className="px-4 py-2 text-sm bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <button
            onClick={() => setPage(old => (!isLast ? old + 1 : old))}
            disabled={isLast}
            className="px-4 py-2 text-sm bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>

      {/* Response Modal */}
      {selectedSuggestion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold flex items-center text-black">
                💬 응답 작성
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* Suggestion Info */}
              <div className="bg-gray-100 border border-gray-300 p-4 rounded-lg space-y-2">
                <div>
                  <span className="text-sm font-medium text-gray-700">건의:</span>
                  <p className="text-gray-900 mt-1">{selectedSuggestion.title}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">내용:</span>
                  <p className="text-gray-600 text-sm mt-1">{selectedSuggestion.content}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">고객:</span>
                  <p className="text-gray-900 mt-1">User ID: {selectedSuggestion.userId}</p>
                </div>
              </div>

              {/* Response Input */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  응답 내용:
                </label>
                <textarea
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  placeholder="고객에게 전달할 응답을 작성해주세요..."
                />
              </div>

              {/* Status Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  상태 변경:
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                >
                  <option value="SUBMITTED">🔵 Submitted (제출됨)</option>
                  <option value="IN_PROGRESS">🟡 In Progress (검토 중)</option>
                  <option value="COMPLETED">🟢 Completed (완료)</option>
                  <option value="REJECTED">🔴 Rejected (반려)</option>
                </select>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
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
