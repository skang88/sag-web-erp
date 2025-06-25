// src/pages/AuthPage.js
import { useState } from 'react';
import LoginForm from '../components/LoginForm';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { jwtDecode } from 'jwt-decode';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const AuthPage = () => {
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    // ⭐ MODIFICATION HERE: Removed 'user' from destructuring ⭐
    const { isLoggedIn, login } = useAuth(); 

    const navigate = useNavigate();

    const HomePageContent = (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] p-6">
            <h2 className="text-4xl font-extrabold text-blue-800 text-center leading-tight">
                Welcome to Seohan Auto Georgia
            </h2>
            <p className="mt-4 text-xl text-gray-600 text-center">
                Your go-to portal for internal systems.
            </p>
        </div>
    );

    const handleLoginSubmit = async (inputEmail, inputPassword) => {
        setIsLoading(true);
        setError('');

        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: inputEmail, password: inputPassword }),
            });

            const data = await response.json();
            setIsLoading(false);

            if (!response.ok) {
                setError(data.message || '로그인에 실패했습니다. 다시 시도해주세요.');
                return;
            }

            console.log('AuthPage: 백엔드 응답 (토큰만):', data);
            
            const token = data.token;
            
            let decodedToken = {};
            try {
                decodedToken = jwtDecode(token);
                console.log('AuthPage: 디코딩된 JWT 페이로드:', decodedToken);
            } catch (decodeError) {
                console.error("Failed to decode token after login:", decodeError);
                setError('로그인에는 성공했으나, 사용자 정보를 읽을 수 없습니다.');
                return;
            }

            const userData = {
                // Adjust these field names based on what you actually see in decodedToken
                email: decodedToken.email || '', 
                name: decodedToken.name || decodedToken.email || '', 
            };

            login(token, userData); 
            
        } catch (err) {
            setIsLoading(false);
            setError('예상치 못한 오류가 발생했습니다. 다시 시도해주세요.');
            console.error('AuthPage: Login error:', err);
        }
    };

    const handleForgotPasswordClick = () => {
        navigate('/forgot-password');
    };

    return (
        <div>
            {isLoggedIn ? (
                HomePageContent
            ) : (
                <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] p-6">
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
            )}
        </div>
    );
};

export default AuthPage;