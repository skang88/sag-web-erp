import { Link } from 'react-router-dom';
import Logo from './Logo';
import "./Navbar.css";
// Hi

function Navbar() {
  return (
    <nav>
      <ul>
        {/* 로고 */}
        <li>
          <Link className='' to="/home" style={{ textDecoration: 'none' }}>
            <Logo />
          </Link>
        </li>

        {/* HR 메뉴 */}
        <li className="menu-item">
          <Link to="/access">HR</Link>
          {/* 하위 메뉴 */}
          <ul className="submenu">
            <li><Link to="/access">Access</Link></li>
            <li><Link to="/lastlogin">Last Login</Link></li>
          </ul>
        </li>
        <li className='menu-item'>
          <Link to="/packing">MAT</Link>
          <ul className="submenu">
            <li><Link to="/packing">Packing Summary</Link></li>
            <li><Link to="/packing/items">Packing items</Link></li>
            {/* <li><Link to="/pallet">Pallet Packing</Link></li> */}
          </ul>
        </li>
      </ul>
    </nav>
  );
}

export default Navbar;
