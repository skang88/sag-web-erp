import React from 'react';
import { Link } from 'react-router-dom';
import Logo from './Logo';
import KPIButton from './KPIButton';
import "./Navbar.css";

const Navbar = () => {
  return (
    <nav>
      <ul>
        {/* 로고 */}
        <li>
          <Link to="/home">
            <Logo />
          </Link>
        </li>

        {/* KPI 버튼 */}
        <li>
          <KPIButton />
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
};

export default Navbar;
