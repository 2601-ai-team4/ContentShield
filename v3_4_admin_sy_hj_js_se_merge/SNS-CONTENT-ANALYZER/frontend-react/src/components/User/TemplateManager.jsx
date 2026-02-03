import { useState, useEffect } from 'react'
import {
  Wand2, Copy, CheckCircle, AlertTriangle,
  XCircle, MessageSquare, FileText, Send,
  Sparkles, Loader2, AlertCircle, Save, Trash2, BookOpen
} from 'lucide-react'
import { analysisService } from '../../services/analysisService'
import api from '../../services/api'



export default function WritingAssistant() {
  // ==================== 상태 ====================
  const [activeTab, setActiveTab] = useState('improve')
  const [originalText, setOriginalText] = useState('')
  const [topic, setTopic] = useState('')
  const [loading, setLoading] = useState(false)
  const [analyzed, setAnalyzed] = useState(false)
  const [error, setError] = useState(null)
  const [suggestions, setSuggestions] = useState([])
  const [copiedVersion, setCopiedVersion] = useState(null)

  const [tone, setTone] = useState('polite')
  const [situation, setSituation] = useState('promotion')
  const [replyType, setReplyType] = useState('constructive')
  const [savedTemplates, setSavedTemplates] = useState([])
  const [showTemplates, setShowTemplates] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState(null)


  // ==================== 상수 ====================
  const tabs = [
    { id: 'improve', label: '텍스트 개선', icon: Sparkles },
    { id: 'reply', label: '댓글 답변', icon: MessageSquare },
    { id: 'template', label: '템플릿 생성', icon: FileText }
  ]

  const tones = [
    { value: 'polite', label: '공손하게' },
    { value: 'neutral', label: '중립적' },
    { value: 'friendly', label: '친근하게' },
    { value: 'formal', label: '격식있게' },
    { value: 'casual', label: '편안하게' }
  ]

  const situations = [
    { value: 'promotion', label: '홍보/마케팅' },
    { value: 'announcement', label: '공지/안내' },
    { value: 'apology', label: '사과/해명' },
    { value: 'explanation', label: '상황 설명' }
  ]

  // ==================== API ====================
  // ==================== API ====================
  const handleAnalyze = async () => {
    if (activeTab === 'template' && !topic.trim()) {
      setError('작성할 내용을 입력해주세요')
      return
    }

    if (activeTab !== 'template' && !originalText.trim()) {
      setError('텍스트를 입력해주세요')
      return
    }

    setLoading(true)
    setAnalyzed(false)
    setSuggestions([])
    setError(null)

    try {
      let data;

      if (activeTab === 'improve') {
        data = await analysisService.assistantImprove(originalText, tone, 'ko')
      }

      if (activeTab === 'reply') {
        data = await analysisService.assistantReply(originalText, null, replyType, 'ko')
      }

      if (activeTab === 'template') {
        data = await analysisService.assistantTemplate(situation, topic, tone, 'ko')
      }

      setSuggestions(data.suggestions || [])
      setAnalyzed(true)

    } catch (err) {
      console.error(err)
      setError(err.message || '분석 중 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async (text, version) => {
    await navigator.clipboard.writeText(text)
    setCopiedVersion(version)
    setTimeout(() => setCopiedVersion(null), 1500)
  }

  // 템플릿 저장 (로컬 스토리지 + SpringBoot API)
  // 장소영~여기까지: SpringBoot API가 없을 때 500 에러를 조용히 처리
  const handleSaveTemplate = async (text, version) => {
    const templateName = prompt('템플릿 이름을 입력하세요:')
    if (!templateName) return

    const template = {
      templateName,
      templateContent: text,
      category: activeTab === 'template' ? situation : activeTab,
      description: `Version ${version} - ${tone} tone`,
      tone,
      situation: activeTab === 'template' ? situation : null,
      createdAt: new Date().toISOString()
    }

    try {
      // SpringBoot API에 저장 시도 (없으면 로컬 스토리지에만 저장)
      // 장소영~여기까지: 404/500 에러는 SpringBoot API가 구현되지 않았을 때 발생하므로 조용히 무시
      try {
        await api.post('/templates', template)
      } catch (apiError) {
        // 장소영~여기까지: 404/500 에러는 SpringBoot API가 구현되지 않았을 때 발생하므로 조용히 무시
        // axios interceptor에서도 처리하지만, 여기서도 추가로 조용히 처리
        const status = apiError.response?.status
        if (status !== 404 && status !== 500) {
          console.warn('API 저장 실패, 로컬 스토리지에 저장:', apiError)
        }
        // 404/500 에러는 조용히 무시하고 로컬 스토리지로 진행
      }

      // 로컬 스토리지에도 저장 (백업)
      const localTemplates = JSON.parse(localStorage.getItem('writingTemplates') || '[]')
      localTemplates.push({ ...template, id: Date.now() })
      localStorage.setItem('writingTemplates', JSON.stringify(localTemplates))

      setSavedTemplates([...savedTemplates, { ...template, id: Date.now() }])
      alert('템플릿이 저장되었습니다!')
    } catch (error) {
      console.error('템플릿 저장 오류:', error)
      alert('템플릿 저장 중 오류가 발생했습니다.')
    }
  }

  // 저장된 템플릿 로드
  // 장소영~여기까지: SpringBoot API가 없을 때 500 에러를 조용히 처리
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        // SpringBoot API에서 로드 시도
        try {
          const response = await api.get('/templates')
          if (response.data && Array.isArray(response.data)) {
            setSavedTemplates(response.data)
            return
          }
        } catch (apiError) {
          // 장소영~여기까지: 404/500 에러는 SpringBoot API가 구현되지 않았을 때 발생하므로 조용히 무시
          // 404 (Not Found) 또는 500 (Internal Server Error)는 API 미구현으로 간주
          // axios interceptor에서도 처리하지만, 여기서도 추가로 조용히 처리
          const status = apiError.response?.status
          if (status !== 404 && status !== 500) {
            console.warn('API 로드 실패, 로컬 스토리지에서 로드:', apiError)
          }
          // 404/500 에러는 조용히 무시하고 로컬 스토리지로 진행
        }

        // 로컬 스토리지에서 로드
        const localTemplates = JSON.parse(localStorage.getItem('writingTemplates') || '[]')
        setSavedTemplates(localTemplates)
      } catch (error) {
        console.error('템플릿 로드 오류:', error)
      }
    }
    loadTemplates()
  }, [])

  // 템플릿 선택
  const handleSelectTemplate = (template) => {
    setSelectedTemplate(template)
    if (activeTab === 'template') {
      setSituation(template.situation || 'promotion')
      setTopic(template.templateContent)
    } else {
      setOriginalText(template.templateContent)
    }
    setTone(template.tone || 'polite')
    setShowTemplates(false)
  }

  // 템플릿 삭제
  // 장소영~여기까지: SpringBoot API가 없을 때 500 에러를 조용히 처리
  const handleDeleteTemplate = async (templateId) => {
    if (!confirm('정말 삭제하시겠습니까?')) return

    try {
      // SpringBoot API에서 삭제 시도
      try {
        await api.delete(`/templates/${templateId}`)
      } catch (apiError) {
        // 장소영~여기까지: 404/500 에러는 SpringBoot API가 구현되지 않았을 때 발생하므로 조용히 무시
        const status = apiError.response?.status
        if (status !== 404 && status !== 500) {
          console.warn('API 삭제 실패, 로컬 스토리지에서 삭제:', apiError)
        }
      }

      // 로컬 스토리지에서도 삭제
      const localTemplates = JSON.parse(localStorage.getItem('writingTemplates') || '[]')
      const filtered = localTemplates.filter(t => t.id !== templateId)
      localStorage.setItem('writingTemplates', JSON.stringify(filtered))

      setSavedTemplates(savedTemplates.filter(t => t.id !== templateId))
    } catch (error) {
      console.error('템플릿 삭제 오류:', error)
    }
  }

  // ==================== UI ====================
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#050b1c] to-[#020617] text-gray-100 p-8">
      {/* 헤더 */}
      <h1 className="text-3xl font-bold flex items-center mb-6">
        <Wand2 className="h-7 w-7 mr-3 text-primary-500" />
        AI Writing Assistant
      </h1>

      {/* 탭 */}
      <div className="flex gap-3 mb-6">
        {tabs.map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id)
                setOriginalText('')
                setTopic('')
                setAnalyzed(false)
                setSuggestions([])
              }}
              className={`px-4 py-2 rounded-lg flex items-center text-sm
                ${activeTab === tab.id
                  ? 'bg-primary-600 text-white'
                  : 'bg-white/5 text-gray-400'}
              `}
            >
              <Icon className="h-4 w-4 mr-2" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* 입력 카드 */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6 space-y-4">

        {/* 텍스트 개선 / 댓글 */}
        {activeTab !== 'template' && (
          <textarea
            value={originalText}
            onChange={e => setOriginalText(e.target.value)}
            placeholder={activeTab === 'improve' ? '개선할 텍스트 입력' : '댓글 입력'}
            rows={5}
            className="w-full bg-black/30 border border-white/10 rounded-lg p-4 text-sm"
          />
        )}

        {/* 템플릿 생성 전용 UI */}
        {activeTab === 'template' && (
          <>
            <select
              value={situation}
              onChange={e => setSituation(e.target.value)}
              className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-sm"
            >
              {situations.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>

            <select
              value={tone}
              onChange={e => setTone(e.target.value)}
              className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-sm"
            >
              {tones.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>

            <textarea
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder="작성할 상황이나 주제를 입력하세요"
              rows={3}
              className="w-full bg-black/30 border border-white/10 rounded-lg p-4 text-sm"
            />
          </>
        )}

        <div className="flex justify-between items-center">
          <button
            onClick={() => setShowTemplates(!showTemplates)}
            className="px-4 py-2 bg-white/10 rounded-lg flex items-center text-sm"
          >
            <BookOpen className="h-4 w-4 mr-2" />
            저장된 템플릿 ({savedTemplates.length})
          </button>
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="px-6 py-3 bg-primary-600 rounded-lg flex items-center"
          >
            {loading
              ? <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              : <Send className="h-5 w-5 mr-2" />}
            AI 실행
          </button>
        </div>
      </div>

      {/* 저장된 템플릿 목록 */}
      {showTemplates && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">저장된 템플릿</h3>
          {savedTemplates.length === 0 ? (
            <p className="text-gray-400 text-sm">저장된 템플릿이 없습니다.</p>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {savedTemplates.map((template, idx) => (
                <div key={template.id || idx} className="bg-black/30 p-4 rounded-lg border border-white/10">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-sm">{template.templateName}</h4>
                    <button
                      onClick={() => handleDeleteTemplate(template.id || idx)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mb-2">{template.category} • {template.tone}</p>
                  <p className="text-sm text-gray-300 line-clamp-2 mb-3">{template.templateContent}</p>
                  <button
                    onClick={() => handleSelectTemplate(template)}
                    className="w-full text-xs bg-primary-600/20 hover:bg-primary-600/30 rounded py-2"
                  >
                    사용하기
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 결과 */}
      {analyzed && (
        <div className="grid md:grid-cols-3 gap-6">
          {suggestions.map(s => (
            <div key={s.version} className="bg-white/5 p-5 rounded-xl border border-white/10">
              <p className="text-primary-400 font-semibold mb-2">
                Version {s.version}
              </p>
              <div className="text-sm bg-black/30 p-4 rounded-lg min-h-[120px]">
                {s.text}
              </div>

              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => handleCopy(s.text, s.version)}
                  className="flex-1 text-sm bg-white/10 rounded-lg py-2"
                >
                  {copiedVersion === s.version ? '복사됨' : '복사'}
                </button>
                <button
                  onClick={() => handleSaveTemplate(s.text, s.version)}
                  className="flex-1 text-sm bg-primary-600/20 hover:bg-primary-600/30 rounded-lg py-2 flex items-center justify-center"
                  title="템플릿 저장"
                >
                  <Save className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 에러 */}
      {error && (
        <div className="mt-6 bg-red-500/10 border border-red-500/30 p-4 rounded-lg flex">
          <AlertCircle className="h-5 w-5 mr-2 text-red-400" />
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}
    </div>
  )
}
