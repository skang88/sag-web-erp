import { useState } from 'react';
import LoginForm from '../components/LoginForm'; // 경로가 맞는지 확인해주세요.
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
        // 백엔드 오류 처리 (예: "잘못된 자격 증명", "이메일 미인증")
        setError(data.message || '로그인에 실패했습니다. 다시 시도해주세요.');
        return;
      }

      // 로그인 성공
      console.log('Login successful:', data);
      localStorage.setItem('token', data.token); // 토큰 저장

      // !!!! 수정된 부분 !!!!
      // alert 메시지 제거하고 메인 페이지로 이동
      navigate('/home'); // 또는 원하시는 메인 페이지 경로 (예: '/')

    } catch (err) {
      setIsLoading(false);
      setError('예상치 못한 오류가 발생했습니다. 다시 시도해주세요.');
      console.error('Login error:', err);
    }
  };

  return (
    <div>
      <LoginForm onSubmit={handleLoginSubmit} />
      {isLoading && <p className="text-center mt-3 text-blue-600">Logging in...</p>}
      {error && <p className="text-center mt-3 text-red-600">{error}</p>}
      <div className="text-center mt-4">
        <p className="text-gray-700">
          Don't have an account?{' '}
          <button
            onClick={() => navigate('/register')} // 회원가입 페이지 경로가 맞는지 확인
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