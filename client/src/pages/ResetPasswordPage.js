// src/pages/ResetPasswordPage.js
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom'; // useParams 대신 useLocation 임포트

const API_BASE_URL = process.env.REACT_APP_API_URL;

const ResetPasswordPage = () => {
  // const { token } = useParams(); // 이 줄은 제거합니다.
  const location = useLocation(); // useLocation 훅 사용
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // useEffect를 사용하여 URL에서 토큰 추출
  const [token, setToken] = useState(null); // 토큰 상태 추가

  useEffect(() => {
    // URL의 쿼리 문자열 (예: ?token=...)을 파싱
    const queryParams = new URLSearchParams(location.search);
    const tokenFromQuery = queryParams.get('token'); // 'token' 쿼리 파라미터 값 가져오기

    if (!tokenFromQuery) {
      setError('비밀번호 재설정 토큰이 없습니다. 잘못된 접근입니다.');
    }
    setToken(tokenFromQuery); // 추출한 토큰 값을 상태에 저장

  }, [location.search]); // location.search가 변경될 때마다 실행

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    setError('');

    // 토큰이 없으면 즉시 종료 (useEffect에서 이미 에러 처리됨)
    if (!token) {
        setError('비밀번호 재설정 토큰이 유효하지 않습니다.');
        setIsLoading(false);
        return;
    }

    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/reset-password/${token}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();
      setIsLoading(false);

      if (!response.ok) {
        setError(data.message || '비밀번호 재설정에 실패했습니다. 다시 시도해주세요.');
        return;
      }

      setMessage(data.message || '비밀번호가 성공적으로 재설정되었습니다!');
      setTimeout(() => navigate('/login'), 1000);

    } catch (err) {
      setIsLoading(false);
      setError('예상치 못한 오류가 발생했습니다. 다시 시도해주세요.');
      console.error('Reset Password error:', err);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-sm mx-auto p-5 bg-white rounded-lg shadow-lg mt-24">
      <h2 className="text-3xl text-gray-800 mb-5 font-semibold">Reset Password</h2>
      {/* 토큰이 없으면 에러 메시지를 우선 표시하고 폼은 숨김 */}
      {error && !token && <p className="text-center mt-3 text-red-600">{error}</p>}

      {message && <p className="text-center mt-3 text-green-600">{message}</p>}

      {/* 토큰이 있고 에러가 없거나 메시지가 있을 때만 폼 표시 */}
      {token && !error && ( // 이 조건문을 !error -> (!error || message) 와 token && 으로 변경
        <form onSubmit={handleSubmit} className="w-full">
          <div className="mb-6">
            <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-2">
              New Password:
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 text-base font-sans"
            />
          </div>
          <div className="mb-6">
            <label htmlFor="confirmPassword" className="block text-gray-700 text-sm font-bold mb-2">
              Confirm New Password:
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 text-base font-sans"
            />
          </div>
          <div className="flex items-center justify-between">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded focus:outline-none focus:shadow-outline w-full text-lg transition duration-300 ease-in-out"
              disabled={isLoading}
            >
              {isLoading ? 'Resetting...' : 'Reset Password'}
            </button>
          </div>
        </form>
      )}

      {/* 로딩 메시지 조건 수정 */}
      {!message && !error && isLoading && <p className="text-center mt-3 text-blue-600">Processing request...</p>}
      {/* 에러가 토큰 없음이 아니고 다른 에러이거나, 폼 제출 후 에러일 때 표시 */}
      {error && token && <p className="text-center mt-3 text-red-600">{error}</p>}
    </div>
  );
};

export default ResetPasswordPage;