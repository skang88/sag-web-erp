// src/pages/AuthPage.js
import { useState, useEffect } from 'react'; // useEffect 추가
import LoginForm from '../components/LoginForm';
import { useNavigate, useLocation } from 'react-router-dom'; // useLocation 추가
import { jwtDecode } from 'jwt-decode'; // jwt-decode 라이브러리 가져오기

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const AuthPage = () => {
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false); // 로그인 상태 추가
    const [userIdToDisplay, setUserIdToDisplay] = useState(''); // 로그인된 사용자 이메일 (선택 사항)

    const navigate = useNavigate();
    const location = useLocation(); // location 변화 감지용

    // 홈 페이지 내용 (HomePage.js에서 복사한 내용)
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

    // 인증 상태 확인 함수
    const checkAuthStatus = () => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decodedToken = jwtDecode(token);
                // 토큰 만료 시간 확인 (선택 사항, 서버에서도 검증되므로 클라이언트에서 빠르게 처리)
                if (decodedToken.exp * 1000 < Date.now()) {
                    localStorage.removeItem('token');
                    setIsLoggedIn(false);
                    setUserIdToDisplay('');
                    return;
                }
                setIsLoggedIn(true);
                setUserIdToDisplay(decodedToken.email || decodedToken.userId); // 이메일 또는 userId 표시
            } catch (err) {
                console.error("Invalid token on AuthPage:", err);
                localStorage.removeItem('token');
                setIsLoggedIn(false);
                setUserIdToDisplay('');
            }
        } else {
            setIsLoggedIn(false);
            setUserIdToDisplay('');
        }
    };

    // 컴포넌트 마운트 시 및 토큰/위치 변경 시 인증 상태 확인
    useEffect(() => {
        checkAuthStatus();

        // localStorage 변경 이벤트를 감지하여 실시간 로그인 상태 반영 (다른 탭/창에서 로그인/로그아웃 시)
        const handleStorageChange = (event) => {
            if (event.key === 'token') {
                checkAuthStatus();
            }
        };
        window.addEventListener('storage', handleStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [location]); // location이 변경될 때 (예: 로그인 후 리디렉션)도 체크하도록

    const handleLoginSubmit = async (email, password) => {
        setIsLoading(true);
        setError('');

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
            localStorage.setItem('token', data.token); // 토큰 저장

            // ⭐ 로그인 성공 후 상태 업데이트 ⭐
            checkAuthStatus(); // 상태를 강제로 업데이트하여 홈 화면 표시

        } catch (err) {
            setIsLoading(false);
            setError('예상치 못한 오류가 발생했습니다. 다시 시도해주세요.');
            console.error('Login error:', err);
        }
    };

    const handleForgotPasswordClick = () => {
        navigate('/forgot-password');
    };

    // 로그인 상태에 따라 다른 콘텐츠 렌더링
    return (
        <div>
            {isLoggedIn ? (
                // 로그인된 경우 홈 페이지 내용 표시
                HomePageContent
            ) : (
                // 로그인되지 않은 경우 로그인 폼 표시
                <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] p-6"> {/* 전체 페이지 중앙 정렬을 위해 div 추가 */}
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