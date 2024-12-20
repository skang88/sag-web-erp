import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import './App.css';
import AccDataFetcher from './AccDataFetcher';
import LastLoginFetcher from './LastLoginFetcher';

function Login() {
  return <h2>Hi, Login Page.</h2>;
}

function Home() {
  return <h2>Welcome to SAG Web ERP</h2>;
}

function App() {

  const openPopup = () => {
    const popupWidth = window.screen.width; // 팝업 창 너비
    const popupHeight = window.screen.height; // 팝업 창 높이
    const left = window.screenX + (window.outerWidth - popupWidth) / 2; // 화면 중앙에 위치
    const top = window.screenY + (window.outerHeight - popupHeight) / 2;

    window.open(
      `${process.env.REACT_APP_SHINY_URL}`, // 외부 앱 URL
      'KPI Dashboard', // 팝업 창 이름
      `width=${popupWidth},height=${popupHeight},top=${top},left=${left},resizable=yes,scrollbars=yes`
    );
  };

  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <nav>
            <ul>
              {/* 로고 추가 */}
              <li className="logo-item">
                <Link to="/home">
                  <img src={"/logo.png"} alt="Company Logo" className="logo" />
                </Link>
              </li>

              <li className="menu-item">
                <button onClick={openPopup} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                  KPI
                </button>
              </li>
              {/* HR 메뉴 */}
              <li className="menu-item">
                <Link to="#">HR</Link>
                {/* 하위 메뉴 */}
                <ul className="submenu">
                  <li>
                    <Link to="/data">Access</Link>
                  </li>
                  <li>
                    <Link to="/lastlogin">Last Login</Link>
                  </li>
                </ul>
              </li>
            </ul>
          </nav>

          <main>
            <Routes>
              <Route path="/" element={<Login />} />
              <Route path="/home" element={<Home />} />
              <Route path="/data" element={<AccDataFetcher />} />
              <Route path="/lastlogin" element={<LastLoginFetcher />} />
            </Routes>
          </main>
        </header>
      </div>
    </Router>
  );
}

export default App;
