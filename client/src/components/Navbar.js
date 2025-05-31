import { Link } from 'react-router-dom';
import Logo from './Logo';

function Navbar() {
  return (
    <nav className="bg-[#0B4DA3] flex justify-between items-center p-2 w-full fixed top-0 left-0 z-1000"> {/* 네비게이션 스타일 */}
      <ul className="flex items-center m-0 p-0 list-none">
        {/* 로고 */}
        <li className="mr-4"> {/* margin-right 추가 */}
          <Link to="/home" className="no-underline hover:no-underline"> {/* textDecoration: 'none' */}
            <Logo />
          </Link>
        </li>

        {/* HR 메뉴 */}
        <li className="relative mx-4 group"> {/* menu-item */}
          <Link to="/access" className="text-white no-underline font-bold text-lg hover:no-underline">HR</Link>
          {/* 하위 메뉴 */}
          {/* 'left-0'을 'left-[-0.5rem]'으로 수정하여 왼쪽으로 0.5rem 이동 */}
          <ul className="hidden group-hover:block absolute top-full left-[-0.5rem] bg-[#2a73d3] p-3 rounded-md list-none w-52"> {/* submenu */}
            <li className="py-1">
              <Link to="/access" className="block text-white no-underline px-2 py-1 hover:bg-gray-200 hover:text-black hover:no-underline rounded-sm">Access</Link>
            </li>
            <li className="py-1">
              <Link to="/lastlogin" className="block text-white no-underline px-2 py-1 hover:bg-gray-200 hover:text-black hover:no-underline rounded-sm">Last Login</Link>
            </li>
          </ul>
        </li>

        {/* MAT 메뉴 */}
        <li className="relative mx-4 group"> {/* menu-item */}
          <Link to="/asn" className="text-white no-underline font-bold text-lg hover:no-underline">MAT</Link>
          {/* 하위 메뉴 */}
          {/* 'left-0'을 'left-[-0.5rem]'으로 수정하여 왼쪽으로 0.5rem 이동 */}
          <ul className="hidden group-hover:block absolute top-full left-[-0.5rem] bg-[#2a73d3] p-3 rounded-md list-none w-60"> {/* submenu */}
            <li className="py-1">
              <Link to="/asn" className="block text-white no-underline px-2 py-1 hover:bg-gray-200 hover:text-black hover:no-underline rounded-sm">ASN</Link>
            </li>
            <li className="py-1">
              <Link to="/packing" className="block text-white no-underline px-2 py-1 hover:bg-gray-200 hover:text-black hover:no-underline rounded-sm">Packing Summary</Link>
            </li>
            <li className="py-1">
              <Link to="/packing/items" className="block text-white no-underline px-2 py-1 hover:bg-gray-200 hover:text-black hover:no-underline rounded-sm">Packing items</Link>
            </li>
            <li className="py-1">
              <Link to="/packing/pallets" className="block text-white no-underline px-2 py-1 hover:bg-gray-200 hover:text-black hover:no-underline rounded-sm">Packing Plans</Link>
            </li>
            {/* <li><Link to="/pallet">Pallet Packing</Link></li> */}
          </ul>
        </li>
      </ul>
    </nav>
  );
}

export default Navbar;