import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import './App.css';
import AccDataFetcher from './AccDataFetcher';
import LastLoginFetcher from './LastLoginFetcher';

function Login() {
  return <h2>Login Page</h2>;
}

function Home() {
  return <h2>Welcome to SAG Web ERP</h2>;
}

function App() {
  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <nav>
            <ul>
              <li>
                <Link to="/">Login</Link>
              </li>
              <li>
                <Link to="/home">Home</Link>
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
