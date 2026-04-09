import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from "jwt-decode";
import './Header.css';
import axios from 'axios';
import { Client } from '@stomp/stompjs'; 
import SockJS from 'sockjs-client';       

// 🌟 1. 우리가 만든 전역 창고 도구를 가져옵니다.
import { useUser } from '../UserContext';

const Header = () => {
  const { userInfo, setUserInfo } = useUser();
  const isLoggedIn = !!userInfo; 

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // 알림 관련 상태값들
  const [isNotiOpen, setIsNotiOpen] = useState(false); 
  const [notifications, setNotifications] = useState([]); 
  const stompClient = useRef(null); 

  const searchRef = useRef(null);
  const navigate = useNavigate();

  // 💡 Context API(userInfo)에서 아이디를 먼저 찾고, 없으면 sessionStorage에서 찾도록 튼튼하게 보강!
  const token = sessionStorage.getItem("accessToken"); 
  const currentUser = userInfo?.username || userInfo?.userId || sessionStorage.getItem("username");

  const handleNearMeClick = () => {
    if (userInfo && userInfo.address) {
      const { kakao } = window;
      if (!kakao || !kakao.maps) {
        alert("카카오 지도 스크립트를 불러오지 못했습니다.");
        return;
      }
      kakao.maps.load(() => {
        if (!kakao.maps.services) {
          fallbackToBrowserLocation();
          return;
        }
        const geocoder = new kakao.maps.services.Geocoder();
        geocoder.addressSearch(userInfo.address, (result, status) => {
          if (status === kakao.maps.services.Status.OK) {
            const lat = result[0].y; 
            const lng = result[0].x; 
            navigate(`/near-me?lat=${lat}&lng=${lng}`);
          } else {
            fallbackToBrowserLocation();
          }
        });
      });
    } else {
      fallbackToBrowserLocation();
    }
  };

  const fallbackToBrowserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;   
          const lng = position.coords.longitude;  
          navigate(`/near-me?lat=${lat}&lng=${lng}`);
        },
        (error) => {
          console.error("위치 정보 에러:", error);
          alert("위치 권한을 허용하시거나, 마이페이지에서 주소를 등록해 주세요.");
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      alert("이 브라우저에서는 위치 정보(Geolocation)를 지원하지 않습니다.");
    }
  };

  useEffect(() => {
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        const userRole = decodedToken.role; 
        const authorizedRoles = ["SUPER", "SUB", "ROLE_SUPER", "ROLE_SUB", "ADMIN", "ROLE_ADMIN"];
        setIsAdmin(authorizedRoles.includes(userRole));
      } catch (error) {
        setIsAdmin(false);
      }
    } else {
      setIsAdmin(false);
    }
  }, [token]);

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
    if (!token || !currentUser) return;

    const fetchHistoryNotifications = async () => {
      try {
        // const res = await axios.get(`http://localhost/api/notifications`, {
        const res = await axios.get(`/api/notifications`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // 🚀 채팅 알림(CHAT)은 헤더에서 버립니다!
        const systemNotis = res.data.filter(n => n.type !== 'CHAT');
        setNotifications(systemNotis);
      } catch (error) {
        console.error("알림 내역 불러오기 실패:", error);
      }
    };
    fetchHistoryNotifications();

    const client = new Client({
      // webSocketFactory: () => new SockJS('http://localhost/ws-chat'),
      webSocketFactory: () => new SockJS('/ws-chat'),
      connectHeaders: { Authorization: `Bearer ${token}` },
      onConnect: () => {
        client.subscribe(`/sub/user/${currentUser}/notification`, (message) => {
          const newNoti = JSON.parse(message.body);
          if (newNoti.type === 'CHAT') return; 
          setNotifications(prev => [newNoti, ...prev]);
        });
      }
    });

    client.activate();
    stompClient.current = client;

    return () => {
      if (stompClient.current) stompClient.current.deactivate();
    };
  }, [token, currentUser]);

  const unreadNotiCount = (notifications || []).filter(noti => noti && noti.isRead !== true && noti.read !== true).length;

  const handleNotiClick = async (noti) => {
    setIsNotiOpen(false); 
    setNotifications(prev => prev.map(n => n.id === noti.id ? { ...n, isRead: true, read: true } : n));
    
    if (noti.type === 'FAVORITE' && noti.relatedItemId) {
      navigate(`/products/${noti.relatedItemId}`); 
    }

    try {
      // await axios.put(`http://localhost/api/notifications/${noti.id}/read`, {}, {
      await axios.put(`/api/notifications/${noti.id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch(e) { console.error(e); }
  };

  const handleReadAll = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true, read: true })));
    try {
      // await axios.put(`http://localhost/api/notifications/read-all`, {}, {
      await axios.put(`/api/notifications/read-all`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch(e) { console.error(e); }
  };

  const handleDeleteNoti = async (e, notiId) => {
    e.stopPropagation(); 
    setNotifications(prev => prev.filter(n => n.id !== notiId));
    try {
      // await axios.delete(`http://localhost/api/notifications/${notiId}`, {
      await axios.delete(`/api/notifications/${notiId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch(error) { 
      console.error("알림 삭제 통신 실패:", error); 
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("accessToken");
    sessionStorage.removeItem("refreshToken");
    sessionStorage.removeItem("tokenType");
    setUserInfo(null); 
    navigate('/'); 
  };

  return (
    <header className={`header-nav ${isScrolled ? 'scrolled' : ''}`}>
      <div className="header-container">
        <a href="/" className="logo">
          <div className="logo-icon"><i className="fas fa-exchange-alt"></i></div>
          <span><span className="logo-brand">환승</span>마켓</span>
        </a>

        <div className="search-area" ref={searchRef}>
          <div className={`search-input-wrapper ${isSearchOpen ? 'active' : ''}`}>
            <i className="fas fa-search search-icon"></i>
            <input type="text" placeholder="어떤 물건을 환승할까요?" onFocus={() => setIsSearchOpen(true)} />
          </div>
        </div>

        <div className="header-actions">
          <div className="nav-links">
            <button className="nav-link" onClick={handleNearMeClick}>내 근처</button>
            <button className="nav-link">인기매물</button>
          </div>
          
          {isLoggedIn && (
            <>
              <div className="user-profile-container" onMouseEnter={() => setIsNotiOpen(true)} onMouseLeave={() => setIsNotiOpen(false)}>
                <button className="icon-btn" title="알림">
                  <i className="far fa-bell"></i>
                  {unreadNotiCount > 0 && (
                    <span className="noti-badge">
                      {unreadNotiCount > 9 ? '9+' : unreadNotiCount}
                    </span>
                  )}
                </button>

                {isNotiOpen && (
                  <div className="profile-dropdown noti-dropdown">
                    <div className="noti-header">
                      <span>새로운 알림</span>
                      {unreadNotiCount > 0 && (
                        <span className="noti-read-all" onClick={(e) => { e.stopPropagation(); handleReadAll(); }}>
                          모두 읽음
                        </span>
                      )}
                    </div>
                    
                    {!(notifications && notifications.length > 0) ? (
                      <div className="noti-empty">새로운 알림이 없습니다.</div>
                    ) : (
                      notifications.map((noti) => (
                        /* 🌟 안 읽은 알림 배경색 동적 클래스 추가 (unread) */
                        <div 
                          key={noti.id} 
                          className={`noti-item ${!noti.isRead ? 'unread' : ''}`} 
                          onClick={() => handleNotiClick(noti)}
                        >
                          <div className="noti-item-top">
                            <div className="noti-content">
                              {noti.type === 'FAVORITE' && <i className="fas fa-heart noti-icon heart"></i>}
                              {noti.type === 'NOTICE' && <i className="fas fa-bullhorn noti-icon notice"></i>}
                              {noti.content}
                            </div>
                            <button onClick={(e) => handleDeleteNoti(e, noti.id)} className="noti-delete-btn" title="알림 삭제">
                              <i className="fas fa-times"></i>
                            </button>
                          </div>
                          <div className="noti-date">
                            {new Date(noti.createdAt || Date.now()).toLocaleString()}
                          </div>
                        </div>
                      ))
                    )}
                    <div className="dropdown-item noti-view-all" onClick={() => navigate('/notifications')}>
                      알림 전체보기
                    </div>
                  </div>
                )}
              </div>

              {/* 프로필 버튼 */}
              <div className="user-profile-container" onMouseEnter={() => setIsProfileOpen(true)} onMouseLeave={() => setIsProfileOpen(false)}>
                <button className="icon-btn user-avatar" title="내 프로필"><i className="far fa-user"></i></button>
                {isProfileOpen && (
                  <div className="profile-dropdown">
                    <div className="dropdown-item" style={{ fontWeight: 'bold', color: '#ff6f0f' }}>{userInfo.nickname || userInfo.username}님 환영합니다!</div>
                    <hr /> 
                    <div className="dropdown-item" onClick={() => navigate('/mypage')}><i className="far fa-id-card"></i> 내 정보 보기</div>
                    <div className="dropdown-item" onClick={() => navigate('/sales')}><i className="fas fa-box-open"></i> 거래 내역</div>
                    {/* <div className="dropdown-item" onClick={() => navigate('/purchase')}><i className="fas fa-shopping-bag"></i> 구매 내역</div> */}
                    <div className="dropdown-item" onClick={() => navigate('/wishlist')}><i className="fas fa-heart"></i> 관심 목록</div>
                    <hr />
                    <div className="dropdown-item logout-item" onClick={handleLogout}><i className="fas fa-sign-out-alt"></i> 로그아웃</div>
                  </div>
                )}
              </div>

              <button className="sell-btn" onClick={() => navigate("/products/create")}><i className="fas fa-plus"></i><span>판매하기</span></button>
              {isAdmin && <button className="admin-btn" onClick={() => navigate("/admin/dashboard")}><i className="fas fa-lock"></i><span>관리자 페이지</span></button>}
            </>
          )}

          {!isLoggedIn && <button className="login-btn" onClick={() => navigate('/login')}>로그인 / 회원가입</button>}
        </div>
      </div>
    </header>
  );
};

export default Header;