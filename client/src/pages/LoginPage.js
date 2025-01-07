import React from 'react';
import LoginForm from '../components/LoginForm';

const LoginPage = () => {
  const handleLogin = (username, password) => {
    // 로그인 처리 로직 (예: API 호출, 인증)
    console.log('로그인 시도:', { username, password });
    // 여기서 로그인 성공/실패 처리 후 라우팅 또는 오류 메시지 표시 등을 할 수 있습니다.
  };

  return (
    <div>
      <LoginForm onSubmit={handleLogin} />
    </div>
  );
};

export default LoginPage;
