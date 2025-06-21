// src/pages/LoginPage.js
import { useState } from 'react';
import LoginForm from '../components/LoginForm';
import { useNavigate } from 'react-router-dom';

// 개발 환경에서 사용할 백엔드 URL (이미 정의되어 있음)
const API_BASE_URL = 'http://172.16.220.32:8001';

const LoginPage = () => {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLoginSubmit = async (email, password) => {
    setIsLoading(true);
    setError(''); // 이전 오류 제거

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      setIsLoading(false);

      if (!response.ok) {
        setError(data.message || '로그인에 실패했습니다. 다시 시도해주세요.');
        return;
      }

      console.log('Login successful:', data);
      localStorage.setItem('token', data.token);
      navigate('/home');

    } catch (err) {
      setIsLoading(false);
      setError('예상치 못한 오류가 발생했습니다. 다시 시도해주세요.');
      console.error('Login error:', err);
    }
  };

  // 새로 추가된 함수: 비밀번호 찾기 페이지로 이동
  const handleForgotPasswordClick = () => {
    navigate('/forgot-password'); // 비밀번호 찾기 페이지 경로
  };

  return (
    <div>
      {/* LoginForm에 onForgotPasswordClick prop 전달 */}
      <LoginForm onSubmit={handleLoginSubmit} onForgotPasswordClick={handleForgotPasswordClick} />
      {isLoading && <p className="text-center mt-3 text-blue-600">Logging in...</p>}
      {error && <p className="text-center mt-3 text-red-600">{error}</p>}
      <div className="text-center mt-4">
        <p className="text-gray-700">
          Don't have an account?{' '}
          <button
            onClick={() => navigate('/register')}
            className="font-bold text-blue-600 hover:text-blue-800 underline cursor-pointer focus:outline-none"
          >
            Sign up
          </button>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;