import React, { useState, useEffect } from 'react';
import styles from './Sidebar.module.css';
import { useNavigate, useLocation } from 'react-router-dom';

const menuItems = [
  { path: '/admin/dashboard', icon: 'bx-grid-alt', label: '대시보드' },
  { path: '/admin/statistics', icon: 'bx-bar-chart-alt-2', label: '통계' },
  { path: '/admin/products', icon: 'bx-package', label: '상품 관리' },
  { path: '/admin/transactions', icon: 'bx-transfer', label: '거래 관리' },
  { path: '/admin/categories', icon: 'bx-category', label: '카테고리 관리' },
  { path: '/admin/users', icon: 'bx-group', label: '사용자 관리' },
  { path: '/admin/reports', icon: 'bx-user-x', label: '신고/정지' },
  { path: '/admin/chat', icon: 'bx-message-dots', label: '채팅 관리' },
  { path: '/admin/notifications', icon: 'bx-bell', label: '알림' },
  { path: '/admin/announcements', icon: 'bx-news', label: '공지사항 관리' },
  { path: '/admin/inquiries', icon: 'bx-chat', label: '문의 내역' },
];

const Sidebar = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  const openSidebar = () => {
    setIsSidebarOpen(true);
  };

  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };

  const handleLogout = (e) => {
    e.preventDefault();
    sessionStorage.removeItem("accessToken");
    sessionStorage.removeItem("refreshToken");
    sessionStorage.removeItem("tokenType");
    navigate('/', { replace: true });
  };

  const handleMenuClick = (path) => {
    navigate(path);
  };

  return (
    <nav className={`${styles.sidebar} ${!isSidebarOpen ? styles.close : ''}`}>
      <header>
        <div className={styles.imageText}>
          <span className={styles.image}>
            <i className={`bx bx-store-alt ${styles.icon}`} style={{ fontSize: '35px', color: 'var(--primary-color)', cursor: 'pointer' }} onClick={() => navigate('/')}></i>
          </span>
          <div className={`${styles.text} ${styles.logoText}`}>
            <span className={styles.name}>환승마켓</span>
            <span className={styles.profession}>관리자 (Admin)</span>
          </div>
        </div>
        
        <i className={`bx bx-chevron-right ${styles.toggle}`} onClick={toggleSidebar}></i>
      </header>

      <div className={styles.menuBar}>
        <div className={styles.menu}>
          <li className={styles.searchBox} onClick={openSidebar}>
            <i className={`bx bx-search ${styles.icon}`}></i>
            <input type="text" placeholder="Search..." />
          </li>

          <ul className={styles.menuLinks} style={{ listStyle: 'none', padding: 0 }}>
            {menuItems.map((item) => (
              <li
                key={item.path}
                className={`${styles.navLink} ${location.pathname === item.path ? styles.active : ''}`}
                onClick={() => handleMenuClick(item.path)}
              >
                <a href="#" onClick={(e) => e.preventDefault()}>
                  <i className={`bx ${item.icon} ${styles.icon}`}></i>
                  <span className={`${styles.text} ${styles.navText}`}>{item.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.bottomContent}>
          <li style={{ listStyle: 'none' }} onClick={handleLogout}>
            <a href="#" onClick={(e) => e.preventDefault()}>
              <i className={`bx bx-log-out ${styles.icon}`}></i>
              <span className={`${styles.text} ${styles.navText}`}>Logout</span>
            </a>
          </li>

          <li className={styles.mode}>
            <div className={styles.sunMoon}>
              <i className={`bx bx-moon ${styles.icon} ${styles.moon}`}></i>
              <i className={`bx bx-sun ${styles.icon} ${styles.sun}`}></i>
            </div>
            <span className={`${styles.modeText} ${styles.text}`}>
              {isDarkMode ? 'Light mode' : 'Dark mode'}
            </span>
            <div className={styles.toggleSwitch} onClick={toggleDarkMode}>
              <span className={styles.switch}></span>
            </div>
          </li>
        </div>
      </div>
    </nav>
  );
};

export default Sidebar;
