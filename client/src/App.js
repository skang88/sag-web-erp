import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Navbar from './components/Navbar'; // Navbar 컴포넌트 추가
import Home from './pages/Home';
import Login from './pages/Login';
import AccessData from './pages/AccessData';
import LastLogin from './pages/LastLogin';

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
