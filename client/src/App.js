import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Navbar from './components/Navbar'; // Navbar 컴포넌트 추가
import Home from './pages/HomePage';
import Login from './pages/LoginPage';
import AccessData from './pages/AccessDataPage';
import LastLogin from './pages/LastLoginPage';

function App() {
  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <Navbar /> {/* Navbar 추가 */}
          <main>
            <Routes>
              <Route path="/" element={<Login />} />
              <Route path="/home" element={<Home />} />
              <Route path="/access" element={<AccessData />} />
              <Route path="/lastlogin" element={<LastLogin />} />
            </Routes>
          </main>
        </header>
      </div>
    </Router>
  );
}

export default App;
