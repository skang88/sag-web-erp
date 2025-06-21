import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Navbar from './components/Navbar'; // Navbar 컴포넌트 추가
import Home from './pages/HomePage';
import AccessData from './pages/AccessDataPage';
import LastLogin from './pages/LastLoginPage';
import PackingSummary from './pages/PackingSummaryPage';
import PackingItems from './pages/PackingItems';
import ContainerPackingViz from './components/ContainerPackingViz'; // 위에서 만든 컴포넌트 임포트
import AsnPage from './pages/AsnPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ShellyPage from './pages/ShellyPage';
import PlatePage from './pages/PlatePage';
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage';   // 추가
import ProfilePage from './pages/ProfilePage'; // ⭐ 새로 추가: 프로필 페이지 임포트 ⭐
import PlateLogPage from './pages/PlateLogPage';


function App() {
  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <Navbar /> {/* Navbar 추가 */}
          <main>
            <Routes>
              <Route path="/" element={<LoginPage />} />
              <Route path="/home" element={<Home />} />
              <Route path="/access" element={<AccessData />} />
              <Route path="/lastlogin" element={<LastLogin />} />
              <Route path="/packing" element={<PackingSummary />} />
              <Route path="/packing/items" element={<PackingItems />} />
              <Route path="/packing/pallets" element={<ContainerPackingViz />} />
              <Route path="/asn" element={<AsnPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/shelly" element={<ShellyPage />} />
              <Route path="/plate" element={<PlatePage />} />
              <Route path="/plate-log" element={<PlateLogPage />} />

              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} /> 
              <Route path="/profile" element={<ProfilePage />} />
            </Routes>
          </main>
        </header>
      </div>
    </Router>
  );
}

export default App;
