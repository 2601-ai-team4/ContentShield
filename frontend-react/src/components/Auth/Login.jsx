import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { authService } from '../../services/authService'

export default function Login() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)


  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // 하나의 handleSubmit 함수로 로직을 통합합니다.
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. 서버에 로그인 요청
      const data = await authService.login(email, password);
      console.log("1. 서버 응답 성공:", data);

      // 2. Zustand 스토어에 데이터 저장
      // 서버 응답 구조(data.role 등)에 따라 적절히 매핑합니다.
      const userRole = data.role || 'USER';

      await setAuth(
        {
          userId: data.user_id || data.userId,
          email: data.email,
          username: data.username,
          role: userRole,
        },
        data.token
      );

      console.log("2. 상태 저장 완료, 역할 확인:", userRole);

      // 3. 안전장치 후 역할별 페이지 이동
      setTimeout(() => {
        // 🔥 역할별 자동 분기 로직 통합
        if (userRole === 'ADMIN') {
          console.log("3. 관리자 페이지로 이동");
          navigate('/admin/dashboard', { replace: true });
        } else {
          console.log("3. 일반 유저 대시보드로 이동");
          navigate('/dashboard', { replace: true });
        }
      }, 100);

    } catch (err) {
      console.error("로그인 시 실패 로그:", err);
      // 서버에서 전달하는 에러 메시지가 있으면 사용하고, 없으면 기본 메시지 출력
      setError(err.response?.data?.message || err.message || '아이디 또는 비밀번호가 올바르지 않습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full space-y-8 p-8 bg-white shadow rounded-lg">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">로그인</h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && <div className="text-red-500 text-sm text-center font-bold">{error}</div>}
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="이메일 주소"
              />
            </div>
            <div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="비밀번호"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? '로그인 중...' : '로그인'}
            </button>
          </div>
        </form>
        <div className="text-center mt-4 pt-4 border-t border-gray-200">
          <span className="text-gray-500 text-sm">계정이 없으신가요? </span>
          <Link to="/signup" className="text-blue-600 hover:text-blue-500 text-sm font-semibold">
            회원가입
          </Link>
        </div>
      </div>
    </div>
  )
}