import React from 'react';
import { Link } from 'react-router-dom';
import Logo from './Logo';
import "./Navbar.css";
// Hi
// Debugging Completed


function Navbar() {
  return (
    <nav>
      <ul>
        {/* 로고 */}
        <li>
          <Link to="/home">
            <Logo />
          </Link>
        </li>
        {/* Inventory 메뉴 */}
        <li className="menu-item">
          <Link to="#">재고</Link>
          {/* 하위 메뉴 */}
          <ul className="submenu">
            <li><Link to="/inventory-count">재고 카운터</Link></li>
            <li><Link to="/camera-test">카메라 테스터</Link></li>
      
          </ul>
        </li>

        {/* HR 메뉴 */}
        <li className="menu-item">
          <Link to="#">HR</Link>
          {/* 하위 메뉴 */}
          <ul className="submenu">
            <li><Link to="/access">Access</Link></li>
            <li><Link to="/lastlogin">Last Login</Link></li>
          </ul>
        </li>
      </ul>
    </nav>
  );
}

export default Navbar;
