import { useEffect, useRef, useState, useCallback } from 'react';
import './MainPage.css';

/* ── 데이터 ── */
const categories = [
  { icon: 'fas fa-mobile-alt', emoji: '📱', label: '디지털기기' },
  { icon: 'fas fa-tshirt', emoji: '👕', label: '의류/잡화' },
  { icon: 'fas fa-couch', emoji: '🛋️', label: '가구/인테리어' },
  { icon: 'fas fa-blender', emoji: '🍳', label: '생활/가전' },
  { icon: 'fas fa-palette', emoji: '🎨', label: '취미/도서' },
  { icon: 'fas fa-futbol', emoji: '⚽', label: '스포츠/레저' },
  { icon: 'fas fa-ticket-alt', emoji: '🎫', label: '티켓/교환권' },
  { icon: 'fas fa-ellipsis-h', emoji: '✨', label: '전체보기' },
];

const products = [
  { id: 1, title: '아이폰 15 Pro 256GB 블루', price: 1250000, location: '서울 강남구', time: '2분 전', badge: '안심결제', likes: 45, chats: 12, img: '📱', color: '#f0f4ff' },
  { id: 2, title: '맥북 에어 M2 13인치 스페이스그레이', price: 1100000, location: '경기 성남시', time: '5분 전', badge: null, likes: 32, chats: 8, img: '💻', color: '#f0f0ff' },
  { id: 3, title: '소니 WH-1000XM5 노이즈캔슬링', price: 320000, location: '서울 송파구', time: '12분 전', badge: '안심결제', likes: 21, chats: 5, img: '🎧', color: '#f5f5f5' },
  { id: 4, title: '캠핑용 릴렉스 체어 2개 세트', price: 45000, location: '인천 연수구', time: '18분 전', badge: null, likes: 15, chats: 14, img: '⛺', color: '#fff8f0' },
  { id: 5, title: '닌텐도 스위치 OLED 화이트', price: 280000, location: '대구 수성구', time: '30분 전', badge: null, likes: 38, chats: 9, img: '🎮', color: '#fff0f0' },
  { id: 6, title: '파타고니아 레트로X 자켓 (L)', price: 150000, location: '부산 해운대구', time: '45분 전', badge: null, likes: 28, chats: 6, img: '🧥', color: '#f0fff4' },
  { id: 7, title: '다이슨 에어랩 멀티 스타일러', price: 420000, location: '서울 마포구', time: '1시간 전', badge: '안심결제', likes: 52, chats: 15, img: '💇', color: '#fff0f8' },
  { id: 8, title: '나이키 조던 1 레트로 하이 OG', price: 210000, location: '광주 북구', time: '2시간 전', badge: null, likes: 67, chats: 22, img: '👟', color: '#f5f5f0' },
];

const liveFeedData = [
  { user: '망원동 김*님', item: '맥북 에어', icon: 'fas fa-gift', status: '환승 완료' },
  { user: '성수동 이*님', item: '캠핑 체어', icon: 'fas fa-handshake', status: '매칭 중' },
  { user: '논현동 박*님', item: '자전거', icon: 'fas fa-bolt', status: '환승 완료' },
  { user: '판교동 최*님', item: '에어팟 맥스', icon: 'fas fa-star', status: '방금 업로드' },
  { user: '잠실동 정*님', item: 'PS5 슬림', icon: 'fas fa-fire', status: '환승 완료' },
];

const stats = [
  { label: '누적 거래액', value: 3482, suffix: '억+', icon: 'fas fa-chart-line' },
  { label: '오늘의 환승', value: 12402, suffix: '건', icon: 'fas fa-exchange-alt' },
  { label: '안전 결제 비중', value: 98.4, suffix: '%', icon: 'fas fa-shield-alt' },
];

/* ── 숫자 롤링 훅 ── */
function useCountUp(target, duration = 2000, startCounting = false) {
  const [value, setValue] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    if (!startCounting) return;
    let start = null;
    const step = (timestamp) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      // ease-out
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(eased * target);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      }
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration, startCounting]);

  return value;
}

/* ── 컴포넌트 ── */
const MainPage = () => {
  const [visibleCards, setVisibleCards] = useState(new Set());
  const [statsVisible, setStatsVisible] = useState(false);
  const [liveFeedItems, setLiveFeedItems] = useState(liveFeedData.slice(0, 3));
  const [heroVisible, setHeroVisible] = useState(false);
  const cardsRef = useRef([]);
  const statsRef = useRef(null);
  const liveFeedIndex = useRef(3);

  // 숫자 롤링
  const statValues = stats.map(s => useCountUp(s.value, 2200, statsVisible));

  // Hero 등장 애니메이션
  useEffect(() => {
    const timer = setTimeout(() => setHeroVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // 카드 스크롤 등장
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const idx = Number(entry.target.dataset.index);
          setVisibleCards(prev => new Set(prev).add(idx));
        }
      });
    }, { threshold: 0.1 });

    cardsRef.current.forEach(card => {
      if (card) observer.observe(card);
    });
    return () => observer.disconnect();
  }, []);

  // Stats 영역 진입 감지
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setStatsVisible(true);
        observer.disconnect();
      }
    }, { threshold: 0.3 });

    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  // 실시간 피드 자동 업데이트
  useEffect(() => {
    const interval = setInterval(() => {
      const nextItem = liveFeedData[liveFeedIndex.current % liveFeedData.length];
      liveFeedIndex.current++;
      setLiveFeedItems(prev => [nextItem, ...prev.slice(0, 2)]);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const formatPrice = useCallback((price) => {
    return price.toLocaleString();
  }, []);

  const formatStat = useCallback((value, suffix) => {
    if (suffix === '%') return value.toFixed(1) + suffix;
    return Math.floor(value).toLocaleString() + suffix;
  }, []);

  return (
    <div className="main-page">

      {/* ═══ Hero Section ═══ */}
      <section className="hero-section">
        <div className="hero-bg-decoration">
          <div className="hero-circle hero-circle-1"></div>
          <div className="hero-circle hero-circle-2"></div>
        </div>
        <div className={`hero-content container ${heroVisible ? 'visible' : ''}`}>
          <div className="hero-text">
            <div className="hero-badge">
              <i className="fas fa-rocket"></i>
              <span>실시간 1,248건의 새로운 물건이 환승 중!</span>
            </div>
            <h1 className="hero-title">
              쓰던 물건을 가치 있게,<br />
              새로운 주인에게 <span className="hero-highlight">환승하세요.</span>
            </h1>
            <p className="hero-desc">
              믿을 수 있는 이웃과 함께하는 중고 거래 플랫폼.<br />
              환승페이로 사기 걱정 없이 안전하게 거래하세요.
            </p>
            <div className="hero-buttons">
              <button className="btn-primary">
                <i className="fas fa-arrow-right"></i>
                거래 시작하기
              </button>
              <button className="btn-secondary">
                <i className="fas fa-book-open"></i>
                서비스 안내
              </button>
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-card-stack">
              <div className="hero-float-card card-1">
                <div className="float-card-icon">📱</div>
                <div className="float-card-info">
                  <div className="float-card-title">아이폰 14</div>
                  <div className="float-card-status">
                    <i className="fas fa-check-circle"></i> 방금 환승 완료!
                  </div>
                </div>
              </div>
              <div className="hero-float-card card-2">
                <div className="float-card-icon">🎧</div>
                <div className="float-card-info">
                  <div className="float-card-title">소니 헤드셋</div>
                  <div className="float-card-status">
                    <i className="fas fa-handshake"></i> 거래 성사!
                  </div>
                </div>
              </div>
              <div className="hero-float-card card-3">
                <div className="float-card-icon">🏕️</div>
                <div className="float-card-info">
                  <div className="float-card-title">캠핑 텐트</div>
                  <div className="float-card-status">
                    <i className="fas fa-clock"></i> 10분 전 환승
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Category Quick Menu ═══ */}
      <section className="category-section">
        <div className="container">
          <div className="category-grid">
            {categories.map((cat, idx) => (
              <a href="#" key={idx} className="category-item">
                <div className="category-icon-wrap">
                  <i className={cat.icon}></i>
                </div>
                <span className="category-label">{cat.label}</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ 실시간 환승 피드 (마퀴) ═══ */}
      <section className="live-marquee-section">
        <div className="marquee-track">
          <div className="marquee-content">
            {[...liveFeedData, ...liveFeedData].map((item, idx) => (
              <div key={idx} className="marquee-item">
                <span className="marquee-live-dot">
                  <i className="fas fa-circle"></i> LIVE
                </span>
                <span className="marquee-text">{item.user}이 {item.item}을(를) {item.status}했습니다!</span>
              </div>
            ))}
          </div>
        </div>
      </section><br/><br/><br/>

      {/* ═══ 인기 매물 그리드 ═══ */}
      <section className="products-section">
        <div className="container">
          <div className="section-header">
            <div>
              <h2 className="section-title">
                실시간 인기 매물 <i className="fas fa-fire" style={{ color: '#ef4444' }}></i>
              </h2>
              <p className="section-subtitle">지금 이 순간, 가장 많이 찾는 상품들이에요.</p>
            </div>
            <a href="#" className="view-all-link">
              전체보기 <i className="fas fa-chevron-right"></i>
            </a>
          </div>

          <div className="product-grid">
            {products.map((product, idx) => (
              <article
                key={product.id}
                className={`product-card ${visibleCards.has(idx) ? 'visible' : ''}`}
                ref={el => cardsRef.current[idx] = el}
                data-index={idx}
                style={{ transitionDelay: '0.08s' }}
              >
                <div className="product-image" style={{ backgroundColor: product.color }}>
                  <span className="product-emoji">{product.img}</span>
                  {product.badge && (
                    <span className="product-badge">
                      <i className="fas fa-shield-alt"></i> {product.badge}
                    </span>
                  )}
                  <button className="product-like-btn">
                    <i className="far fa-heart"></i>
                  </button>
                </div>
                <div className="product-info">
                  <h4 className="product-title">{product.title}</h4>
                  <div className="product-price">{formatPrice(product.price)}원</div>
                  <div className="product-meta">
                    <span className="product-location">
                      <i className="fas fa-map-marker-alt"></i>
                      {product.location} · {product.time}
                    </span>
                    <div className="product-stats">
                      <span><i className="far fa-heart"></i> {product.likes}</span>
                      <span><i className="far fa-comment"></i> {product.chats}</span>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Transit Insight (다크 섹션) ═══ */}
      <section className="insight-section" ref={statsRef}>
        <div className="insight-bg-glow"></div>
        <div className="container insight-container">
          <div className="insight-left">
            <div className="insight-label">
              <i className="fas fa-chart-bar"></i> Transit Insight
            </div>
            <h2 className="insight-title">
              데이터로 증명하는<br />
              <span>가장 안전한 환승</span>
            </h2>

            <div className="stats-grid">
              {stats.map((stat, idx) => (
                <div key={idx} className={`stat-card ${statsVisible ? 'visible' : ''}`} style={{ transitionDelay: '0.08s' }}>
                  <div className="stat-icon">
                    <i className={stat.icon}></i>
                  </div>
                  <div className="stat-label">{stat.label}</div>
                  <div className="stat-value">
                    {formatStat(statValues[idx], stat.suffix)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="insight-right">
            <div className="live-feed-card">
              <h4 className="live-feed-title">
                <span className="live-ping"></span>
                실시간 환승 현황
              </h4>
              <div className="live-feed-list">
                {liveFeedItems.map((item, idx) => (
                  <div key={`${item.user}-${idx}`} className="live-feed-item" style={{ animationDelay: `${idx * 0.1}s` }}>
                    <div className="feed-item-icon">
                      <i className={item.icon}></i>
                    </div>
                    <div className="feed-item-text">
                      <strong>{item.user}</strong>이 <span className="feed-item-highlight">{item.item}</span>을(를)
                    </div>
                    <span className="feed-item-status">{item.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ 안전거래 가이드 ═══ */}
      <section className="safety-section">
        <div className="container">
          <div className="safety-banner">
            <div className="safety-icon-wrap">
              <i className="fas fa-shield-alt"></i>
            </div>
            <div className="safety-content">
              <h3 className="safety-title">환승Pay로 안전하게 거래하세요</h3>
              <p className="safety-desc">
                구매 확정 전까지 결제 대금을 환승마켓이 안전하게 보관합니다.
                외부 결제 링크는 절대 클릭하지 마세요!
              </p>
              <div className="safety-tags">
                <span className="safety-tag">
                  <i className="fas fa-check"></i> 사기 계좌 100% 차단
                </span>
                <span className="safety-tag">
                  <i className="fas fa-check"></i> 결제 수수료 0원
                </span>
                <span className="safety-tag">
                  <i className="fas fa-check"></i> 24시간 모니터링
                </span>
              </div>
            </div>
            <button className="safety-cta">
              가이드 보기 <i className="fas fa-arrow-right"></i>
            </button>
          </div>
        </div>
      </section>

      {/* ═══ 신뢰 지표 ═══ */}
      <section className="trust-section">
        <div className="container">
          <h2 className="trust-title">안심하세요. 환승마켓은 24시간 가동 중입니다.</h2>
          <div className="trust-grid">
            <div className="trust-card">
              <div className="trust-card-icon">
                <i className="fas fa-user-shield"></i>
              </div>
              <h4>사기 방지 시스템</h4>
              <p>AI 기반의 실시간 모니터링으로 의심 거래를 즉시 차단합니다.</p>
            </div>
            <div className="trust-card">
              <div className="trust-card-icon">
                <i className="fas fa-credit-card"></i>
              </div>
              <h4>100% 안심 결제</h4>
              <p>구매가 확정될 때까지 결제 대금을 안전하게 보호합니다.</p>
            </div>
            <div className="trust-card">
              <div className="trust-card-icon">
                <i className="fas fa-headset"></i>
              </div>
              <h4>24/7 고객 지원</h4>
              <p>언제 어디서든 문제 발생 시 즉각적으로 대응해 드립니다.</p>
            </div>
          </div>

          <div className="trust-stats-bar">
            <div className="trust-stat">
              <span className="trust-stat-value">99.8%</span>
              <span className="trust-stat-label">매너 지수 만족도</span>
            </div>
            <div className="trust-stat-divider"></div>
            <div className="trust-stat">
              <span className="trust-stat-value">0.01%</span>
              <span className="trust-stat-label">사기 발생률</span>
            </div>
            <div className="trust-stat-divider"></div>
            <div className="trust-stat">
              <span className="trust-stat-value">2.4M</span>
              <span className="trust-stat-label">월간 활성 사용자</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default MainPage;
