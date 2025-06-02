import { Link } from 'react-router-dom';
import Logo from './Logo'; // 가정: Logo 컴포넌트는 동일한 위치에 있습니다.

// 메뉴 데이터 정의
const navLinks = [
  {
    label: 'HR',
    path: '/access', // 주 메뉴 링크 경로 (React Router Link 용)
    isRouterLink: true,
    submenu: [
      { label: 'Access', path: '/access', isRouterLink: true },
      { label: 'Last Login', path: '/lastlogin', isRouterLink: true },
    ],
    submenuWidth: 'w-52',
  },
  {
    label: 'MAT',
    path: '/asn', // 주 메뉴 링크 경로
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
    label: 'Dashboard',
    // path: '/dashboard-overview', // 대시보드 메뉴 자체가 링크일 경우
    isRouterLink: false, // true로 하고 path를 설정하면 Dashboard 글자도 링크가 됩니다. 현재는 하위메뉴 트리거 역할만 합니다.
    submenu: [
      {
        label: 'Inventory Plan',
        url: 'http://172.16.220.32:9090/d/bejpb6qiyiakgb/inventory-plan?orgId=1&from=now-5m&to=now&timezone=browser&var-itmno=$__all&var-chj=$__all&var-pumcd=$__all&var-pmjcd=$__all&refresh=5s',
        popupName: 'InventoryPlanPopup',
        isPopup: true,
      },
      {
        label: 'Lot In Status',
        url: 'http://172.16.220.32:9090/d/cej6swgueibcwb/lot-in-dashboard?orgId=1&from=now-5m&to=now&timezone=browser&refresh=auto',
        popupName: 'LotInStatusPopup', // 고유한 팝업 이름
        isPopup: true,
      },
      {
        label: 'StandBy Inventory',
        url: 'http://172.16.220.32:9090/d/feif5m482ffuoa/standby-inventory-dashboard?orgId=1&from=now-5m&to=now&timezone=browser&refresh=auto',
        popupName: 'StandbyInventoryPopup', // 고유한 팝업 이름
        isPopup: true,
      },
    ],
    submenuWidth: 'w-60',
  },
];

// 재사용 가능한 팝업 열기 함수
const openPopup = (event, url, popupName) => {
  event.preventDefault();
  const fullscreenWidth = window.screen.availWidth;
  const fullscreenHeight = window.screen.availHeight;
  const windowFeatures = `
    width=${fullscreenWidth},
    height=${fullscreenHeight},
    left=0,
    top=0,
    menubar=no,
    toolbar=no,
    location=no,
    resizable=yes,
    scrollbars=yes,
    status=yes
  `.replace(/\s/g, ''); // 문자열 내 공백 제거
  window.open(url, popupName, windowFeatures);
};

function Navbar() {
  return (
    <nav className="bg-[#0B4DA3] flex justify-between items-center p-2 w-full fixed top-0 left-0 z-[1000]"> {/* z-index에 대괄호 사용 가능 */}
      <ul className="flex items-center m-0 p-0 list-none">
        {/* 로고 */}
        <li className="mr-4">
          <Link to="/home" className="no-underline">
            <Logo />
          </Link>
        </li>

        {/* 메뉴 아이템 동적 생성 */}
        {navLinks.map((menuItem) => (
          <li key={menuItem.label} className="relative mx-4 group">
            {menuItem.isRouterLink ? (
              <Link to={menuItem.path} className="text-white no-underline font-bold text-lg">
                {menuItem.label}
              </Link>
            ) : (
              // 링크가 아닌 단순 텍스트 또는 다른 요소 (예: span)
              <span className="text-white cursor-default font-bold text-lg">
                {menuItem.label}
              </span>
            )}

            {/* 하위 메뉴 */}
            {menuItem.submenu && (
              <ul
                className={`hidden group-hover:block absolute top-full left-[-0.5rem] bg-[#2a73d3] p-3 rounded-md list-none ${menuItem.submenuWidth}`}
              >
                {menuItem.submenu.map((subItem) => (
                  <li key={subItem.label} className="py-1">
                    {subItem.isPopup ? (
                      <a
                        href={subItem.url}
                        onClick={(e) => openPopup(e, subItem.url, subItem.popupName)}
                        className="block text-white no-underline px-2 py-1 hover:bg-gray-200 hover:text-black rounded-sm"
                      >
                        {subItem.label}
                      </a>
                    ) : (
                      <Link
                        to={subItem.path}
                        className="block text-white no-underline px-2 py-1 hover:bg-gray-200 hover:text-black rounded-sm"
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
      {/* 네비게이션 바의 오른쪽에 다른 요소들이 있다면 여기에 추가 (예: 사용자 프로필, 로그아웃 버튼 등) */}
      {/* <div className="flex items-center"> ... </div> */}
    </nav>
  );
}

export default Navbar;