// [File: Signup.jsx - 비밀번호 유효성 검사 강화]
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, User, Mail, Lock, ArrowLeft, AlertCircle } from 'lucide-react';
import { authService } from '../../services/authService';

export default function Signup() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',  // ← 비밀번호 확인 필드 추가
    termsAgreed: false,
    privacyAgreed: false
  });

  const [activeModal, setActiveModal] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  // 🔥 비밀번호 유효성 검증 함수
  const validatePassword = (password) => {
    const errors = [];

    // ✅ 현재 활성화된 조건
    if (password.length < 8) {
      errors.push('8자 이상 입력하세요');
    }

    // 🔒 나중에 강화할 조건 (주석 해제하여 사용)
    /*
    if (!/[A-Z]/.test(password)) {
      errors.push('대문자 1개 이상 포함');
    }
    */

    // ✅ 현재 활성화된 조건
    if (!/[a-z]/.test(password)) {
      errors.push('소문자 1개 이상 포함');
    }

    // ✅ 현재 활성화된 조건
    if (!/[0-9]/.test(password)) {
      errors.push('숫자 1개 이상 포함');
    }

    // 🔒 나중에 강화할 조건 (주석 해제하여 사용)
    /*
    if (!/[!@#$%^&*]/.test(password)) {
      errors.push('특수문자(!@#$%^&*) 1개 이상 포함');
    }
    */

    return errors;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;

    setFormData({
      ...formData,
      [name]: newValue
    });

    // 🔥 실시간 비밀번호 검증
    if (name === 'password') {
      const errors = validatePassword(value);
      setValidationErrors({
        ...validationErrors,
        password: errors
      });
    }

    // 🔥 비밀번호 확인 검증
    if (name === 'confirmPassword') {
      if (value !== formData.password) {
        setValidationErrors({
          ...validationErrors,
          confirmPassword: ['비밀번호가 일치하지 않습니다']
        });
      } else {
        const { confirmPassword, ...rest } = validationErrors;
        setValidationErrors(rest);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 🔥 최종 유효성 검사
    const passwordErrors = validatePassword(formData.password);

    if (passwordErrors.length > 0) {
      alert('비밀번호 조건을 확인해주세요:\n' + passwordErrors.join('\n'));
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      alert('비밀번호가 일치하지 않습니다.');
      return;
    }

    if (!formData.termsAgreed || !formData.privacyAgreed) {
      alert('이용약관 및 개인정보 처리방침에 모두 동의해야 합니다.');
      return;
    }

    try {
      const response = await authService.signup(
        formData.email,
        formData.password,
        formData.username,
        {
          termsAgreed: formData.termsAgreed,
          privacyAgreed: formData.privacyAgreed,
          version: 'v1.0'
        }
      );
      console.log('가입 성공!', response);
      alert('회원가입에 성공했습니다! 로그인해 주세요.');
      navigate('/login');
    } catch (err) {
      console.error('가입 에러:', err.response?.data || err.message);
      alert('가입 실패: ' + (err.response?.data?.message || '서버 에러가 발생했습니다.'));
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <Link to="/login" className="inline-flex items-center gap-2 text-slate-500 hover:text-white mb-6 transition-colors group">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> 로그인으로 돌아가기
        </Link>

        <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl">
          <div className="mb-8">
            <h2 className="text-2xl font-black text-white">시작하기</h2>
            <p className="text-slate-500 text-sm mt-1">Guard AI와 함께 깨끗한 커뮤니티를 만드세요.</p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* 이름 */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-400 ml-1">이름</label>
              <div className="relative group">
                <User className="absolute left-3 top-3 text-slate-600" size={20} />
                <input
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-11 py-3 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                  placeholder="홍길동"
                  required
                  minLength={2}
                />
              </div>
            </div>

            {/* 이메일 */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-400 ml-1">이메일</label>
              <div className="relative group">
                <Mail className="absolute left-3 top-3 text-slate-600" size={20} />
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-11 py-3 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                  placeholder="name@example.com"
                  required
                />
              </div>
            </div>

            {/* 비밀번호 */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-400 ml-1">비밀번호</label>
              <div className="relative group">
                <Lock className="absolute left-3 top-3 text-slate-600" size={20} />
                <input
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full bg-slate-950 border rounded-xl px-11 py-3 text-white focus:ring-2 outline-none transition-all ${validationErrors.password?.length > 0
                      ? 'border-red-500 focus:ring-red-500/50'
                      : 'border-slate-800 focus:ring-blue-500/50'
                    }`}
                  placeholder="8자 이상, 소문자+숫자"
                  required
                  minLength={8}
                />
              </div>
              {/* 🔥 실시간 유효성 검사 피드백 */}
              {validationErrors.password?.length > 0 && (
                <div className="ml-1 space-y-1">
                  {validationErrors.password.map((error, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-red-400">
                      <AlertCircle size={12} />
                      {error}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 비밀번호 확인 */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-400 ml-1">비밀번호 확인</label>
              <div className="relative group">
                <Lock className="absolute left-3 top-3 text-slate-600" size={20} />
                <input
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`w-full bg-slate-950 border rounded-xl px-11 py-3 text-white focus:ring-2 outline-none transition-all ${validationErrors.confirmPassword
                      ? 'border-red-500 focus:ring-red-500/50'
                      : 'border-slate-800 focus:ring-blue-500/50'
                    }`}
                  placeholder="비밀번호 재입력"
                  required
                />
              </div>
              {validationErrors.confirmPassword && (
                <div className="ml-1 flex items-center gap-2 text-xs text-red-400">
                  <AlertCircle size={12} />
                  {validationErrors.confirmPassword[0]}
                </div>
              )}
            </div>

            {/* 약관 동의 */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between group">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="termsAgreed"
                    checked={formData.termsAgreed}
                    onChange={handleChange}
                    className="w-5 h-5 rounded-md bg-slate-950 border-slate-800 text-blue-500 focus:ring-blue-500/50 transition-all cursor-pointer"
                    required
                  />
                  <span className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">
                    [필수] 서비스 이용약관 동의
                  </span>
                </label>
                <button
                  type="button"
                  onClick={() => setActiveModal('terms')}
                  className="text-xs text-slate-600 hover:text-blue-400 underline transition-colors"
                >
                  보기
                </button>
              </div>

              <div className="flex items-center justify-between group">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="privacyAgreed"
                    checked={formData.privacyAgreed}
                    onChange={handleChange}
                    className="w-5 h-5 rounded-md bg-slate-950 border-slate-800 text-blue-500 focus:ring-blue-500/50 transition-all cursor-pointer"
                    required
                  />
                  <span className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">
                    [필수] 개인정보 처리방침 동의
                  </span>
                </label>
                <button
                  type="button"
                  onClick={() => setActiveModal('privacy')}
                  className="text-xs text-slate-600 hover:text-blue-400 underline transition-colors"
                >
                  보기
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={Object.keys(validationErrors).length > 0}
              className="w-full bg-slate-100 hover:bg-white text-slate-950 font-bold py-4 rounded-xl transition-all mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              계정 생성하기
            </button>
          </form>
        </div>
      </div>

      {/* 약관 모달 (생략 - 기존 코드와 동일) */}
    </div>
  );
}