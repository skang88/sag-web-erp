import React, { useState } from 'react';
import './LoginForm.css';

const LoginForm = ({ onSubmit }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(email, password);  // 부모 컴포넌트에서 전달된 onSubmit 함수 실행
  };

  return (
    <div className="login-container">
      <h2 className="login-title">Login</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email">Email:</label>
          <input
            type="text"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div className="button-container">
          <button className="login-button" type="submit">Login</button>
        </div>
      </form>
      <div className="forgot-password">
        <button className="forgot-password-button" onClick={() => console.log('Did you forget the password? Click')}>
          Did you forget the password?
        </button>
      </div>
    </div>
  );
};

export default LoginForm;
