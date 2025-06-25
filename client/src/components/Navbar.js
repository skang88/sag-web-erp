import { Link, useNavigate } from 'react-router-dom'; // useLocation은 더 이상 필요 없으므로 제거
// useState, useEffect, jwtDecode는 이제 필요 없으므로 제거합니다.
import Logo from './Logo';
import { useAuth } from '../contexts/AuthContext'; // AuthContext의 useAuth 훅 임포트


// navLinks 정의는 이전과 동일하게 유지됩니다...
const navLinks = [
  {
    label: 'HR',
    path: '/access',
    isRouterLink: true,
    submenu: [
      { label: 'Access', path: '/access', isRouterLink: true },
      { label: 'Last Login', path: '/lastlogin', isRouterLink: true },
    ],
    submenuWidth: 'w-52',
  },
  {
    label: 'MAT',
    path: '/asn',
    isRouterLink: true,
    submenu: [
      { label: 'ASN', path: '/asn', isRouterLink: true },
      { label: 'Packing Summary', path: '/packing', isRouterLink: true },
      { label: 'Packing items', path: '/packing/items', isRouterLink: true },
      { label: 'Packing Plans', path: '/packing/pallets', isRouterLink: true },
      { label: 'Barcode Tester', path: '/barcode-tester', isRouterLink: true },
    ],
    submenuWidth: 'w-60',
  },
  {
    label: 'Visitor',
    path: '/shelly',
    isRouterLink: true,
    submenu: [
      { label: 'Shelly', path: '/shelly', isRouterLink: true },
      { label: 'License Plate', path: '/plate', isRouterLink: true },
      { label: 'Plate Log', path: '/plate-log', isRouterLink: true },
    ],
    submenuWidth: 'w-60',
  },
  {
    label: 'Dashboard',
    isRouterLink: false,
    submenu: [
      {
        label: 'Inventory Plan',
        url: 'http://172.16.220.32:9090/d/bejpb6qiyiakgb/inventory-plan?orgId=1&from=now-5m&to=now&timezone=browser&var-itmno=$__all&var-chj=$__all&var-pumcd=$__all&var-pmjcd=$__all&refresh=5s',
        isPopup: true,
      },
      {
        label: 'Lot In Status',
        url: 'http://172.16.220.32:9090/d/cej6swgueibcwb/lot-in-dashboard?orgId=1&from=now-5m&to=now&timezone=browser&refresh=auto',
        isPopup: true,
      },
      {
        label: 'StandBy Inventory',
        url: 'http://172.16.220.32:9090/d/feif5m482ffuoa/standby-inventory-dashboard?orgId=1&from=now-5m&to=now&timezone=browser&refresh=auto',
        isPopup: true,
      },
    ],
    submenuWidth: 'w-60',
  },
  {
    label: 'Support',
    isRouterLink: false,
    submenu: [
      {
        label: 'Manuals',
        url: 'https://efficacious-sand-116.notion.site/1bd471a31f6180c485d5fc4941b6ba49?v=1bd471a31f61800c9317000cd622af8d&source=copy_link',
        isPopup: true,
      },
      {
        label: 'Slack',
        url: 'https://seohanautogeorgia.slack.com/',
        isPopup: true,
      },
    ],
    submenuWidth: 'w-60',
  },
];


function Navbar() {
  // AuthContext에서 전역 로그인 상태, 사용자 정보, 로그아웃 함수를 가져옵니다.
  const { isLoggedIn, user, logout } = useAuth(); 
  const navigate = useNavigate();
  // ⭐ 제거할 코드: 아래 세 줄은 더 이상 필요 없습니다. ⭐
  // const [isLoggedIn, setIsLoggedIn] = useState(false);
  // const [userIdToDisplay, setUserIdToDisplay] = useState(''); 
  // const location = useLocation();

  // ⭐ 제거할 코드: useEffect 및 handleStorageChange 관련 로직도 더 이상 필요 없습니다. ⭐
  // useEffect(() => { ... }, [location]);

  const handleLogout = () => {
    logout(); // AuthContext의 logout 함수를 호출하여 전역 상태를 업데이트합니다.
    alert('로그아웃 되었습니다.');
    navigate('/'); // 로그아웃 후 홈으로 이동
  };

  // user 객체에서 이메일을 가져와 표시합니다.
  // user가 null이거나 email 속성이 없으면 빈 문자열이 됩니다.
  const userIdToDisplay = user ? user.email : ''; 

  return (
    <nav className="bg-[#0B4DA3] flex justify-between items-center p-2 w-full fixed top-0 left-0 z-[1000]">
      {/* 왼쪽 메뉴 (로고 및 기존 메뉴) */}
      <ul className="flex items-center m-0 p-0 list-none">
        <li className="mr-4">
          <Link to="/" className="no-underline">
            <Logo />
          </Link>
        </li>
        {navLinks.map((menuItem) => (
          <li key={menuItem.label} className="relative mx-4 group">
            {menuItem.isRouterLink ? (
              <Link to={menuItem.path} className="text-white no-underline font-bold text-lg hover:text-yellow-300">
                {menuItem.label}
              </Link>
            ) : (
              <span className="text-white cursor-default font-bold text-lg">
                {menuItem.label}
              </span>
            )}
            {menuItem.submenu && (
              <ul
                className={`hidden group-hover:block absolute top-full left-[-0.5rem] bg-[#2a73d3] p-3 rounded-md list-none ${menuItem.submenuWidth} shadow-lg`}
              >
                {menuItem.submenu.map((subItem) => (
                  <li key={subItem.label} className="py-1">
                    {subItem.isPopup ? (
                      <a
                        href={subItem.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-white no-underline px-2 py-1 hover:bg-blue-700 hover:text-yellow-200 rounded-sm"
                      >
                        {subItem.label}
                      </a>
                    ) : (
                      <Link
                        to={subItem.path}
                        className="block text-white no-underline px-2 py-1 hover:bg-blue-700 hover:text-yellow-200 rounded-sm"
                      >
                        {subItem.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>

      {/* 오른쪽 로그인/로그아웃 상태 표시 */}
      <div className="flex items-center space-x-4 mr-4">
        {isLoggedIn ? (
          <>
            {/* 사용자 ID (이메일) 표시: 이제 AuthContext의 user 객체에서 가져옵니다. */}
            <span className="text-white text-sm font-medium">
              {userIdToDisplay}
            </span>
            {/* Edit Profile Link */}
            <Link
              to="/profile" // 프로필 페이지 경로
              className="text-white text-sm font-medium hover:text-yellow-300 underline transition duration-150 ease-in-out"
              style={{ whiteSpace: 'nowrap' }} // 텍스트가 줄바꿈되지 않도록
            >
              Edit Profile
            </Link>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-3 rounded text-sm transition duration-150 ease-in-out"
            >
              Logout
            </button>
          </>
        ) : (
          <Link
            to="/login"
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded text-sm transition duration-150 ease-in-out"
          >
            Login
          </Link>
        )}
      </div>
    </nav>
  );
}

export default Navbar;