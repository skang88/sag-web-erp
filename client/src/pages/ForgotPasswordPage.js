// src/pages/ForgotPasswordPage.js
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL; // 백엔드 URL

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      setIsLoading(false);

      if (!response.ok) {
        setError(data.message || '비밀번호 재설정 링크 요청에 실패했습니다.');
        return;
      }

      setMessage(data.message || '비밀번호 재설정 링크가 이메일로 전송되었습니다.');
      // 선택 사항: 성공 후 로그인 페이지로 리다이렉트
      // setTimeout(() => navigate('/login'), 3000);

    } catch (err) {
      setIsLoading(false);
      setError('예상치 못한 오류가 발생했습니다. 다시 시도해주세요.');
      console.log("Hello", API_BASE_URL)
      console.error('Forgot Password error:', err);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-sm mx-auto p-5 bg-white rounded-lg shadow-lg mt-24">
      <h2 className="text-3xl text-gray-800 mb-5 font-semibold">Forgot Password</h2>
      <form onSubmit={handleSubmit} className="w-full">
        <div className="mb-6">
          <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">
            Enter your email to receive a password reset link:
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
            {isLoading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </div>
      </form>

      {isLoading && <p className="text-center mt-3 text-blue-600">Processing request...</p>}
      {message && <p className="text-center mt-3 text-green-600">{message}</p>}
      {error && <p className="text-center mt-3 text-red-600">{error}</p>}

      <div className="text-center mt-4">
        <button
          onClick={() => navigate('/login')}
          className="font-bold text-blue-600 hover:text-blue-800 underline cursor-pointer focus:outline-none"
        >
          Back to Login
        </button>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;