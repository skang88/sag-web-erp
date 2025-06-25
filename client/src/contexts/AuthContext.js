// src/contexts/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode'; // jwtDecode 임포트 확인!

const AuthContext = createContext(null);

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [user, setUser] = useState(null); // 사용자 정보 (이메일, 이름 등)

    useEffect(() => {
        const checkAuthAndSetUser = () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const decodedToken = jwtDecode(token);
                    // 토큰 만료 시간 확인 (선택 사항)
                    if (decodedToken.exp * 1000 < Date.now()) {
                        console.log("AuthContext: Token expired, logging out automatically.");
                        localStorage.removeItem('token');
                        setIsLoggedIn(false);
                        setUser(null);
                        return;
                    }

                    // ⭐⭐⭐ 중요: 여기 'decodedToken.email'이 실제 JWT 페이로드 필드와 일치하는지 확인! ⭐⭐⭐
                    // 백엔드에서 JWT 페이로드에 이메일을 'email'이라는 필드로 넣어주는지 확인해야 합니다.
                    // 만약 'userEmail', 'id', 'username' 등 다른 이름이라면 해당 이름으로 변경해야 합니다.
                    const userDataFromToken = {
                        email: decodedToken.email, // <-- 이 부분을 백엔드 JWT 페이로드 필드명에 맞추세요.
                        name: decodedToken.name || decodedToken.email, // 'name' 필드가 없으면 'email' 사용
                        // 필요한 경우 다른 사용자 정보도 추가 (예: role: decodedToken.role)
                    };
                    
                    setIsLoggedIn(true);
                    setUser(userDataFromToken); // ⭐ Navbar에 전달될 user 객체 설정 ⭐

                } catch (error) {
                    console.error("AuthContext: Invalid or malformed token found:", error);
                    localStorage.removeItem('token');
                    setIsLoggedIn(false);
                    setUser(null);
                }
            } else {
                setIsLoggedIn(false);
                setUser(null);
            }
        };

        checkAuthAndSetUser();

        const handleStorageChange = (event) => {
            if (event.key === 'token') {
                console.log("AuthContext: 'token' in localStorage changed, re-checking auth status.");
                checkAuthAndSetUser();
            }
        };

        window.addEventListener('storage', handleStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    // ⭐⭐⭐ 중요: AuthPage에서 넘겨주는 'userData' 객체의 'email' 필드명을 확인! ⭐⭐⭐
    const login = (token, userData) => {
        console.log("AuthContext: login function called with userData:", userData);
        localStorage.setItem('token', token);
        setIsLoggedIn(true);
        setUser(userData); // ⭐ AuthPage에서 받은 userData를 그대로 user 상태에 저장 ⭐
    };

    const logout = () => {
        console.log("AuthContext: logout function called.");
        localStorage.removeItem('token');
        setIsLoggedIn(false);
        setUser(null);
    };

    const value = {
        isLoggedIn,
        user,
        login,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};