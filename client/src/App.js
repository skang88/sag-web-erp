// src/App.js

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
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
import PlatePage from './pages/PlatePage';
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage';
import ProfilePage from './pages/ProfilePage';
import PlateLogPage from './pages/PlateLogPage';
import AuthPage from './pages/AuthPage'; // ⭐ 새로 추가: AuthPage 임포트 ⭐

function App() {
  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <Navbar />
          <main>
            <Routes>
              {/* ⭐ 수정: 기본 경로와 로그인 경로를 AuthPage로 연결 ⭐ */}
              <Route path="/" element={<AuthPage />} />
              <Route path="/login" element={<AuthPage />} /> {/* /login 경로도 AuthPage로 연결 */}
              
              <Route path="/access" element={<AccessData />} />
              <Route path="/lastlogin" element={<LastLogin />} />
              <Route path="/packing" element={<PackingSummary />} />
              <Route path="/packing/items" element={<PackingItems />} />
              <Route path="/packing/pallets" element={<ContainerPackingViz />} />
              <Route path="/asn" element={<AsnPage />} />
              <Route path="/stocktaking" element={<StocktakingPage />} />
              
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/shelly" element={<ShellyPage />} />
              <Route path="/plate" element={<PlatePage />} />

              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/plate-log" element={<PlateLogPage />} />

              {/* 만약 로그인되지 않은 상태에서 보호된 페이지로 접근 시 /login으로 리디렉트하는 로직이 필요하다면 */}
              {/* <Route path="*" element={localStorage.getItem('token') ? null : <Navigate to="/login" />} /> */}
            </Routes>
          </main>
        </header>
      </div>
    </Router>
  );
}

export default App;