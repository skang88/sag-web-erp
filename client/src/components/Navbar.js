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
    isRouterLink: false,
    submenu: [
      {
        label: 'Inventory Plan',
        url: 'http://172.16.220.32:9090/d/bejpb6qiyiakgb/inventory-plan?orgId=1&from=now-5m&to=now&timezone=browser&var-itmno=$__all&var-chj=$__all&var-pumcd=$__all&var-pmjcd=$__all&refresh=5s',
        // popupName: 'InventoryPlanPopup', // 새 탭으로 열 경우 popupName은 필수는 아님
        isPopup: true, // 이 플래그를 사용하여 새 탭으로 열지 결정
      },
      {
        label: 'Lot In Status',
        url: 'http://172.16.220.32:9090/d/cej6swgueibcwb/lot-in-dashboard?orgId=1&from=now-5m&to=now&timezone=browser&refresh=auto',
        // popupName: 'LotInStatusPopup',
        isPopup: true,
      },
      {
        label: 'StandBy Inventory',
        url: 'http://172.16.220.32:9090/d/feif5m482ffuoa/standby-inventory-dashboard?orgId=1&from=now-5m&to=now&timezone=browser&refresh=auto',
        // popupName: 'StandbyInventoryPopup',
        isPopup: true,
      },
    ],
    submenuWidth: 'w-60',
  },
];

// openPopup 함수는 더 이상 대시보드 링크에 의해 직접 사용되지 않지만,
// 다른 종류의 팝업을 위해 남겨둘 수 있습니다.
// 만약 모든 'isPopup'이 새 탭을 의미한다면 이 함수는 필요 없을 수 있습니다.
// const openPopup = (event, url, popupName) => {
//   event.preventDefault();
//   const fullscreenWidth = window.screen.availWidth;
//   const fullscreenHeight = window.screen.availHeight;
//   const windowFeatures = `
//     width=${fullscreenWidth},
//     height=${fullscreenHeight},
//     left=0,
//     top=0,
//     menubar=no,
//     toolbar=no,
//     location=no,
//     resizable=yes,
//     scrollbars=yes,
//     status=yes
//   `.replace(/\s/g, '');
//   window.open(url, popupName, windowFeatures);
// };

function Navbar() {
  return (
    <nav className="bg-[#0B4DA3] flex justify-between items-center p-2 w-full fixed top-0 left-0 z-[1000]">
      <ul className="flex items-center m-0 p-0 list-none">
        <li className="mr-4">
          <Link to="/home" className="no-underline">
            <Logo />
          </Link>
        </li>

        {navLinks.map((menuItem) => (
          <li key={menuItem.label} className="relative mx-4 group">
            {menuItem.isRouterLink ? (
              <Link to={menuItem.path} className="text-white no-underline font-bold text-lg">
                {menuItem.label}
              </Link>
            ) : (
              <span className="text-white cursor-default font-bold text-lg">
                {menuItem.label}
              </span>
            )}

            {menuItem.submenu && (
              <ul
                className={`hidden group-hover:block absolute top-full left-[-0.5rem] bg-[#2a73d3] p-3 rounded-md list-none ${menuItem.submenuWidth}`}
              >
                {menuItem.submenu.map((subItem) => (
                  <li key={subItem.label} className="py-1">
                    {/* 여기가 수정된 부분입니다 */}
                    {subItem.isPopup ? ( // 'isPopup'이 true이면 새 탭으로 링크를 엽니다.
                      <a
                        href={subItem.url}
                        target="_blank" // 이 속성으로 새 탭에서 열립니다.
                        rel="noopener noreferrer" // 보안 및 성능을 위한 권장 사항입니다.
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
    </nav>
  );
}

export default Navbar;