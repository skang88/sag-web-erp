import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode'; // jwt-decode 라이브러리 가져오기
import Logo from './Logo';

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
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userIdToDisplay, setUserIdToDisplay] = useState(''); // 사용자 ID를 저장할 상태
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkAuthStatus = () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const decodedToken = jwtDecode(token); // 토큰 디코딩
          // 백엔드에서 토큰 생성 시 { userId: user._id } 형태로 저장했으므로
          // decodedToken.userId 로 접근 가능합니다.
          // 만약 토큰에 이메일도 포함시켰다면 decodedToken.email 등으로 접근할 수 있습니다.
          setUserIdToDisplay(decodedToken.email); // 예시: userId 표시 (MongoDB ObjectId)
          // 만약 이메일 표시를 원하고, 토큰에 이메일이 있다면:
          // setUserIdToDisplay(decodedToken.email || decodedToken.userId);
          setIsLoggedIn(true);
        } catch (error) {
          console.error("Invalid token:", error);
          // 잘못된 토큰 처리: 토큰 삭제 및 로그아웃 상태로 변경
          localStorage.removeItem('token');
          setIsLoggedIn(false);
          setUserIdToDisplay('');
        }
      } else {
        setIsLoggedIn(false);
        setUserIdToDisplay('');
      }
    };

    checkAuthStatus();

    const handleStorageChange = (event) => {
      if (event.key === 'token') {
        checkAuthStatus();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setUserIdToDisplay(''); // 로그아웃 시 사용자 ID 초기화
    alert('로그아웃 되었습니다.');
    navigate('/login');
  };

  return (
    <nav className="bg-[#0B4DA3] flex justify-between items-center p-2 w-full fixed top-0 left-0 z-[1000]">
      {/* 왼쪽 메뉴 (로고 및 기존 메뉴) */}
      <ul className="flex items-center m-0 p-0 list-none">
        {/* ... (기존 로고 및 navLinks 매핑 부분은 동일) ... */}
        <li className="mr-4">
          <Link to="/home" className="no-underline">
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
            {/* 사용자 ID 표시 */}
            <span className="text-white text-sm font-medium">
              {userIdToDisplay} {/* 여기에 사용자 ID (또는 이메일) 표시 */}
            </span>
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