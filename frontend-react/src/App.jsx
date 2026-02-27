import React from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'

// Auth 관련 컴포넌트
import Login from './components/Auth/Login'
import Signup from './components/Auth/Signup'
import PrivateRoute from './components/Auth/PrivateRoute'

// 레이아웃 컴포넌트
import Navbar from './components/Layout/Navbar'
import Sidebar from './components/Layout/Sidebar'

// 통합 대시보드 (V2) - 사용자용
import UserDashboard from './components/User/DashboardV2'

// 🆕 정지 사용자 페이지
import SuspendedPage from './components/User/SuspendedPage'

// 관리자 전용 대시보드
import AdminDashboard from './components/Admin/Dashboard'

// Template Manager (AI Writing Assistant 역할)
import TemplateManager from './components/User/TemplateManager'

// Blocked Word Manager (차단 단어 관리)
import BlockedWordManager from './components/User/BlockedWordManager'

// 사용자 기능
import Suggestions from './components/User/Suggestions'

// 관리자 전용 기능
import UserManagement from './components/Admin/UserManagement'
import NoticeManager from './components/Admin/NoticeManager'
import LogViewer from './components/Admin/LogViewer'
import SuggestionManager from './components/Admin/SuggestionManager'

function App() {
  const { user, isSuspended } = useAuthStore()  // 🆕 isSuspended 추가
  const location = useLocation()
  
  const isAdminMode = location.pathname.startsWith('/admin')
  // 🆕 정지 상태가 아닐 때만 사이드바 표시
  const showSidebar = user && user.role === 'ADMIN' && isAdminMode && !isSuspended

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden">
      {showSidebar && <Sidebar />}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6">
          
          {/* 🆕 정지된 사용자는 SuspendedPage만 표시 */}
          {user && isSuspended ? (
            <SuspendedPage />
          ) : (
            <Routes>
              {/* 공공 경로 */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />

              {/* 사용자 경로 (모두 통합 대시보드 V2로 연결) */}
              <Route path="/dashboard" element={
                <PrivateRoute>
                  <UserDashboard />
                </PrivateRoute>
              } />
              <Route path="/analysis" element={
                <PrivateRoute>
                  <UserDashboard />
                </PrivateRoute>
              } />
              <Route path="/aianalysis" element={
                <PrivateRoute>
                  <UserDashboard />
                </PrivateRoute>
              } />
              <Route path="/comments" element={
                <PrivateRoute>
                  <UserDashboard />
                </PrivateRoute>
              } />
              <Route path="/statistics" element={
                <PrivateRoute>
                  <UserDashboard />
                </PrivateRoute>
              } />
              <Route path="/blacklist" element={
                <PrivateRoute>
                  <UserDashboard />
                </PrivateRoute>
              } />
              <Route path="/aiassistant" element={
                <PrivateRoute>
                  <UserDashboard />
                </PrivateRoute>
              } />
              <Route path="/templates" element={
                <PrivateRoute>
                  <UserDashboard />
                </PrivateRoute>
              } />
              <Route path="/profile" element={
                <PrivateRoute>
                  <UserDashboard />
                </PrivateRoute>
              } />
              <Route path="/notices" element={
                <PrivateRoute>
                  <UserDashboard />
                </PrivateRoute>
              } />
              <Route path="/notices/:noticeId" element={
                <PrivateRoute>
                  <UserDashboard />
                </PrivateRoute>
              } />

              {/* Template Manager (독립 페이지) */}
              <Route path="/writing" element={
                <PrivateRoute>
                  <TemplateManager />
                </PrivateRoute>
              } />

              {/* Blocked Word Manager (차단 단어 관리) */}
              <Route path="/blocked-words" element={
                <PrivateRoute>
                  <BlockedWordManager />
                </PrivateRoute>
              } />

              {/* Suggestions (건의사항) */}
              <Route path="/suggestions" element={
                <PrivateRoute>
                  <Suggestions />
                </PrivateRoute>
              } />

              {/* 관리자 경로 (Admin 전용) */}
              <Route path="/admin/dashboard" element={
                <PrivateRoute requireAdmin>
                  <AdminDashboard />
                </PrivateRoute>
              } />
              <Route path="/admin/users" element={
                <PrivateRoute requireAdmin>
                  <UserManagement />
                </PrivateRoute>
              } />
              <Route path="/admin/notices" element={
                <PrivateRoute requireAdmin>
                  <NoticeManager />
                </PrivateRoute>
              } />
              <Route path="/admin/logs" element={
                <PrivateRoute requireAdmin>
                  <LogViewer />
                </PrivateRoute>
              } />
              <Route path="/admin/suggestions" element={
                <PrivateRoute requireAdmin>
                  <SuggestionManager />
                </PrivateRoute>
              } />

              {/* 기본 리다이렉트 설정 (역할별 분기) */}
              <Route path="/" element={
                user
                  ? <Navigate to={user.role === 'ADMIN' ? '/admin/dashboard' : '/dashboard'} />
                  : <Navigate to="/login" />
              } />
            </Routes>
          )}
          
        </main>
      </div>
    </div>
  )
}

export default App