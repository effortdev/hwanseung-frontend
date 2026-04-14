import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Header.css';

const Header = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("accessToken"));
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const searchRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // 2. 다른 탭에서 로그아웃하거나 설정이 바뀔 때를 대비해 상태를 감시할 수 있습니다.
    const checkLogin = () => {
      setIsLoggedIn(!!localStorage.getItem("accessToken"));
    };

    // 스토리지 이벤트 리스너 등록 (선택 사항)
    window.addEventListener('storage', checkLogin);
    return () => window.removeEventListener('storage', checkLogin);
  }, []);

  const recentSearches = ['아이폰 15 Pro', '캠핑 의자', '맥북 에어 M2'];
  const trendingKeywords = ['자전거', '플레이스테이션 5', '에어팟 맥스'];

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("tokenType");
    setIsLoggedIn(false);
    navigate('/'); // 3. 새로고침 없이 메인으로 이동

  };

  const goToLogin = () => {
    navigate('/login'); // 4. /login 경로로 이동 (App.jsx의 Route 설정과 일치해야 함)
  };

  return (
    <header className={`header-nav ${isScrolled ? 'scrolled' : ''}`}>
      <div className="header-container">
        {/* 로고 */}
        <a href="/" className="logo">
          <div className="logo-icon">
            <i className="fas fa-exchange-alt"></i>
          </div>
          <span><span className="logo-brand">환승</span>마켓</span>
        </a>

        {/* 검색 영역 */}
        <div className="search-area" ref={searchRef}>
          <div className={`search-input-wrapper ${isSearchOpen ? 'active' : ''}`}>
            <i className="fas fa-search search-icon"></i>
            <input
              type="text"
              placeholder="어떤 물건을 환승할까요?"
              onFocus={() => setIsSearchOpen(true)}
            />
          </div>

          {isSearchOpen && (
            <div className="search-dropdown">
              <div className="search-dropdown-grid">
                <div className="search-dropdown-col">
                  <div className="dropdown-label">최근 검색어</div>
                  <div className="recent-tags">
                    {recentSearches.map((tag, idx) => (
                      <button key={idx} className="recent-tag">{tag}</button>
                    ))}
                  </div>
                </div>
                <div className="search-dropdown-col">
                  <div className="dropdown-label">인기 키워드 <i className="fas fa-fire" style={{ color: '#ef4444', marginLeft: 4 }}></i></div>
                  <div className="trending-list">
                    {trendingKeywords.map((keyword, idx) => (
                      <div key={idx} className="trending-item">
                        <span className="trending-rank">{idx + 1}</span>
                        <span>{keyword}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 액션 버튼 */}
        <div className="header-actions">
          <div className="nav-links">
            <button className="nav-link">내 근처</button>
            <button className="nav-link">인기매물</button>
          </div>
{isLoggedIn && (
  <>
          <button className="icon-btn" title="채팅">
            <i className="far fa-comment-dots"></i>
          </button>
          <button className="icon-btn" title="알림">
            <i className="far fa-bell"></i>
            <span className="notification-dot"></span>
          </button>
          <div 
                className="user-profile-container"
                onMouseEnter={() => setIsProfileOpen(true)}
                onMouseLeave={() => setIsProfileOpen(false)}
              >
          <button className="icon-btn user-avatar" title="내 프로필">
            <i className="far fa-user"></i>
          </button>
{isProfileOpen && (
                  <div className="profile-dropdown">
                    <div className="dropdown-item" onClick={() => navigate('/mypage')}>
                      <i className="far fa-id-card"></i> 내 정보 보기
                    </div>
                    <div className="dropdown-item" onClick={() => navigate('/settings')}>
                      <i className="fas fa-cog"></i> 설정
                    </div>
                    <hr />
                    <div className="dropdown-item logout-item" onClick={handleLogout}>
                      <i className="fas fa-sign-out-alt"></i> 로그아웃
                    </div>
                  </div>
                )}
              </div>
          <button className="sell-btn">
            <i className="fas fa-plus"></i>
            <span>판매하기</span>
          </button>

          
</>
          )}

          {!isLoggedIn && (
            <button className="login-btn" onClick={() => window.location.href='/login'}>
              로그인 / 회원가입
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
