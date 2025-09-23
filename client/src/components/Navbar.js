import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Logo from './Logo';
import { useAuth } from '../contexts/AuthContext';

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
      label: 'PI',
      path: '/asn',
      isRouterLink: true,
      submenu: [
        { label: 'ASN', path: '/asn', isRouterLink: true },
        { label: 'Inventory Plan', url: 'https://grafana.seohanga.com/goto/gMilP3jHR?orgId=1', isPopup: true },
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
        { label: 'Bargate Controller', url: '/bargate-controller', isRouterLink: true },
        { label: 'Plate Log', path: '/plate-log', isRouterLink: true },
        { label: 'Visitor List', path: '/visitors', isRouterLink: true },
        { label: 'Plate Monitoring', path: '/plate-monitoring', isRouterLink: true },
      ],
      submenuWidth: 'w-64',
    },
    {
      label: 'Apps',
      isRouterLink: false,
      submenu: [
        {
          label: 'Grafana',
          url: 'https://grafana.seohanga.com',
          isPopup: true,
        },
        {
          label: 'Rstudio',
          url: 'https://rstudio.seohanga.com',
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
          label: 'Guides',
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

function Navbar({ isLoggedIn }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState(null);

  const handleLogout = () => {
    logout();
    alert('로그아웃 되었습니다.');
    navigate('/');
    setIsMenuOpen(false);
  };

  const handleSubmenuToggle = (label) => {
    setOpenSubmenu(openSubmenu === label ? null : label);
  };

  const userIdToDisplay = user ? user.email : '';

  const filteredNavLinks = navLinks.filter(menuItem => {
    const hiddenLabels = ['HR', 'MAT', 'Visitor', 'Apps'];
    if (hiddenLabels.includes(menuItem.label) && !isLoggedIn) {
      return false;
    }
    return true;
  });

  const renderNavLinks = (isMobile) =>
    filteredNavLinks.map((menuItem) => {
      const hasSubmenu = menuItem.submenu && menuItem.submenu.length > 0;

      if (isMobile) {
        return (
          <li key={menuItem.label} className="w-full text-center border-b border-gray-700 last:border-b-0">
            <div
              className="flex justify-between items-center w-full py-2 text-white font-bold text-lg cursor-pointer"
              onClick={() => hasSubmenu && handleSubmenuToggle(menuItem.label)}
            >
              {hasSubmenu ? (
                <span className="flex-grow text-center">{menuItem.label}</span>
              ) : (
                <Link to={menuItem.path} className="no-underline text-white flex-grow text-center" onClick={() => setIsMenuOpen(false)}>
                  {menuItem.label}
                </Link>
              )}
              {hasSubmenu && (
                <span className="px-2">
                  {openSubmenu === menuItem.label ? '▲' : '▼'}
                </span>
              )}
            </div>
            {hasSubmenu && openSubmenu === menuItem.label && (
              <ul className="bg-[#1c5cb0] list-none m-0 p-0">
                {menuItem.submenu.map((subItem) => (
                  <li key={subItem.label} className="py-1">
                    {subItem.isPopup ? (
                      <a
                        href={subItem.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-white no-underline px-2 py-1 hover:bg-blue-700 hover:text-yellow-200 rounded-sm"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {subItem.label}
                      </a>
                    ) : (
                      <Link
                        to={subItem.path}
                        className="block text-white no-underline px-2 py-1 hover:bg-blue-700 hover:text-yellow-200 rounded-sm"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {subItem.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </li>
        );
      }

      // Desktop Nav Links
      return (
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
          {hasSubmenu && (
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
      );
    });

  return (
    <>
      <nav className="bg-[#0B4DA3] flex justify-between items-center p-2 w-full fixed top-0 left-0 z-[1000]">
        <div className="flex-shrink-0">
          <Link to="/" className="no-underline" onClick={() => setIsMenuOpen(false)}>
            <Logo />
          </Link>
        </div>

        <ul className="hidden md:flex items-center m-0 p-0 list-none">
          {renderNavLinks(false)}
        </ul>

        <div className="hidden md:flex items-center space-x-4 mr-4">
          {isLoggedIn ? (
            <>
              <span className="text-white text-sm font-medium">{userIdToDisplay}</span>
              <Link
                to="/profile"
                className="text-white text-sm font-medium hover:text-yellow-300 underline"
                style={{ whiteSpace: 'nowrap' }}
              >
                Edit Profile
              </Link>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-3 rounded text-sm"
              >
                Logout
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded text-sm"
            >
              Login
            </Link>
          )}
        </div>

        <div className="md:hidden">
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-white focus:outline-none mr-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
              )}
            </svg>
          </button>
        </div>
      </nav>

      {isMenuOpen && (
        <div className="md:hidden fixed top-[56px] left-0 w-full bg-[#0B4DA3] z-[999] p-4 shadow-lg">
          <ul className="flex flex-col items-center m-0 p-0 list-none">
            {renderNavLinks(true)}
          </ul>
          <div className="flex flex-col items-center space-y-4 mt-4 pt-4 border-t border-gray-500">
            {isLoggedIn ? (
              <>
                <span className="text-white text-sm font-medium">{userIdToDisplay}</span>
                <Link
                  to="/profile"
                  className="text-white text-sm font-medium hover:text-yellow-300 underline"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Edit Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-3 rounded text-sm w-full max-w-xs"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded text-sm w-full max-w-xs text-center"
                onClick={() => setIsMenuOpen(false)}
              >
                Login
              </Link>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default Navbar;
