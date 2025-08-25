// src/App.js

import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'; // Navigate, useLocation 임포트 추가
import './App.css';
import { AuthProvider, useAuth } from './contexts/AuthContext'; // AuthProvider 및 useAuth 임포트

import Navbar from './components/Navbar'; // Navbar 컴포넌트 추가
import AccessData from './pages/AccessDataPage';
import LastLogin from './pages/LastLoginPage';
import PackingSummary from './pages/PackingSummaryPage';
import PackingItems from './pages/PackingItems';
import ContainerPackingViz from './components/ContainerPackingViz';
import AsnPage from './pages/AsnPage';
import StocktakingPage from './pages/StocktakingPage';

import RegisterPage from './pages/RegisterPage';
import ShellyPage from './pages/ShellyPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage';
import ProfilePage from './pages/ProfilePage';
import PlateLogPage from './pages/PlateLogPage';
import PlateRealTimeMonitoringPage from './pages/PlateRealTimeMonitoringPage';
import BargateControllerPage from './pages/BargateControllerPage';
import AuthPage from './pages/AuthPage';
import VisitorRegistrationPage from './pages/VisitorRegistrationPage';
import VisitorListPage from './pages/VisitorListPage'; // Import VisitorListPage

// MainAppContent 컴포넌트 정의
function MainAppContent() {
  const { isLoggedIn } = useAuth();
  const location = useLocation();

  // Navbar를 표시하지 않을 경로 목록
  const noNavbarPaths = ['/plate-monitoring', '/register-visitor'];

  // 현재 경로가 noNavbarPaths에 포함되는지 확인
  const showNavbar = !noNavbarPaths.includes(location.pathname);

  return (
    <div className="App">
      <header className="App-header">
        {showNavbar && <Navbar isLoggedIn={isLoggedIn} />} {/* showNavbar 값에 따라 Navbar 렌더링 */}
        <main>
          <Routes>
            {/* 공개 라우트 */}
            <Route path="/" element={<AuthPage />} />
            <Route path="/login" element={<AuthPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/plate-monitoring" element={<PlateRealTimeMonitoringPage />} />
            <Route path="/register-visitor" element={<VisitorRegistrationPage />} />

            {/* 보호된 라우트 */}
            {isLoggedIn ? (
              <>
                <Route path="/access" element={<AccessData />} />
                <Route path="/lastlogin" element={<LastLogin />} />
                <Route path="/packing" element={<PackingSummary />} />
                <Route path="/packing/items" element={<PackingItems />} />
                <Route path="/packing/pallets" element={<ContainerPackingViz />} />
                <Route path="/asn" element={<AsnPage />} />
                <Route path="/barcode-tester" element={<StocktakingPage />} />
                <Route path="/shelly" element={<ShellyPage />} />
                <Route path="/bargate-controller" element={<BargateControllerPage />} />
                <Route path="/plate-log" element={<PlateLogPage />} />
                <Route path="/visitors" element={<VisitorListPage />} /> {/* Add Visitor List Route */}
                <Route path="/profile" element={<ProfilePage />} />
                {/* 로그인 후 기본 페이지로 사용할 라우트 (예: /home) */}
                <Route path="/home" element={<AccessData />} />
              </>
            ) : (
              // 로그인되지 않은 상태에서 보호된 페이지 접근 시 /login으로 리디렉트
              <Route path="*" element={<Navigate to="/login" />} />
            )}
          </Routes>
        </main>
      </header>
    </div>
  );
}


function App() {
  return (
    <Router>
      <AuthProvider>
        <MainAppContent /> {/* AuthProvider의 자식으로 MainAppContent 렌더링 */}
      </AuthProvider>
    </Router>
  );
}

export default App;