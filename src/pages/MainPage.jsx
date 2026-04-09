import { useEffect, useRef, useState, useCallback } from 'react';
import './MainPage.css';
import { useNavigate } from 'react-router-dom';
import { fetchCategories } from '../api/CategoriesAPI';
import axios from 'axios';

/* ── 데이터 ── */
const categories = [
    { emoji: '📱', label: '디지털기기', key: 'digital' },
    { emoji: '👕', label: '의류/잡화', key: 'fashion' },
    { emoji: '🛋️', label: '가구/인테리어', key: 'furniture' },
    { emoji: '🍳', label: '생활/가전', key: 'life' },
    { emoji: '🎨', label: '취미/도서', key: 'hobby' },
    { emoji: '⚽', label: '스포츠/레저', key: 'sports' },
    { emoji: '🎫', label: '티켓/교환권', key: 'ticket' },
    { emoji: '✨', label: '전체보기', key: 'all' },
];

const extraCategories = [
    { emoji: '', label: '' },
    { emoji: '', label: '' },
    { emoji: '', label: '' },
    { emoji: '', label: '' },
    { emoji: '', label: '' },
    { emoji: '', label: '' },
    { emoji: '', label: '' },
    { emoji: '', label: '' },
];

const liveFeedData = [
    { user: '망원동 김*님', item: '맥북 에어', icon: 'fas fa-gift', status: '환승 완료' },
    { user: '성수동 이*님', item: '캠핑 체어', icon: 'fas fa-handshake', status: '매칭' },
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

const MainPage = () => {
    const [visibleCards, setVisibleCards] = useState(new Set());
    const [statsVisible, setStatsVisible] = useState(false);
    const [liveFeedItems, setLiveFeedItems] = useState(liveFeedData.slice(0, 3));
    const [heroVisible, setHeroVisible] = useState(false);
    const [products, setProducts] = useState([]);
    const [showAllCategories, setShowAllCategories] = useState(false);
    const [imageErrorMap, setImageErrorMap] = useState({});

    const cardsRef = useRef([]);
    const statsRef = useRef(null);
    const liveFeedIndex = useRef(3);

    const navigate = useNavigate();

    const statValues = stats.map((s) => useCountUp(s.value, 2200, statsVisible));

    // 인기 매물 조회
    useEffect(() => {
        const fetchPopularProducts = async () => {
            try {
                const token = sessionStorage.getItem('accessToken');

                const response = await fetch('/api/products/popular', {
                    headers: token
                        ? { Authorization: `Bearer ${token}` }
                        : {},
                });

                if (!response.ok) {
                    throw new Error('인기 매물 조회 실패');
                }

                const data = await response.json();
                setProducts(Array.isArray(data) ? data : []);
                setImageErrorMap({});
            } catch (error) {
                console.error('인기 매물 조회 실패:', error);
                setProducts([]);
                setImageErrorMap({});
            }
        };

        fetchPopularProducts();
    }, []);

    //백엔드에서 진짜 가져오기 
    const [realProducts, setRealProducts] = useState([]);

    // 🌟 2. 화면이 처음 켜질 때 백엔드 창고에서 물건 가져오기
   useEffect(() => {
        const fetchRealProducts = async () => {
            try {
                const response = await axios.get('/api/products');
                
                // 🚨 기존 코드: 도착한 데이터를 그대로 바구니에 담음 (최신순)
                // setRealProducts(response.data);

                const filteredProducts = response.data.filter(product => {
                    return (product.likeCount || 0) >= 2;
                });


                // 🌟 [수정된 코드] 도착한 데이터를 '찜(likeCount)'이 많은 순서대로 줄 세웁니다!
                const popularProducts = response.data.sort((a, b) => {
                    return (b.likeCount || 0) - (a.likeCount || 0); // 내림차순 정렬
                });

                // 1등부터 6등까지만 딱 잘라서(slice) 보여주는 것이 좋습니다!
                const top6Products = popularProducts.slice(0, 6);

                // 정렬되고 잘라진 1~6등 상품들을 바구니에 담습니다.
                setRealProducts(top6Products);

            } catch (error) {
                console.error("인기 매물을 불러오지 못했습니다.", error);
            }
        };
        fetchRealProducts();
    }, []);
    // Hero 등장 애니메이션
    useEffect(() => {
        const timer = setTimeout(() => setHeroVisible(true), 100);
        return () => clearTimeout(timer);
    }, []);

    // 카드 스크롤 등장
    useEffect(() => {
        if (!products.length) return;

        setVisibleCards(new Set());

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const idx = Number(entry.target.dataset.index);
                    setVisibleCards((prev) => new Set(prev).add(idx));
                }
            });
        }, { threshold: 0.1 });

        cardsRef.current.forEach((card) => {
            if (card) observer.observe(card);
        });

        return () => observer.disconnect();
    }, [products]);

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
            setLiveFeedItems((prev) => [nextItem, ...prev.slice(0, 2)]);
        }, 4000);

        return () => clearInterval(interval);
    }, []);

    const formatPrice = useCallback((price) => {
        return Number(price || 0).toLocaleString();
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
                            쓰던 물건을 가치 있게,
                            <br />
                            새로운 주인에게 <span className="hero-highlight">환승하세요.</span>
                        </h1>

                        <p className="hero-desc">
                            믿을 수 있는 이웃과 함께하는 중고 거래 플랫폼.
                            <br />
                            환승페이로 사기 걱정 없이 안전하게 거래하세요.
                        </p>

                        <div className="hero-buttons">
                            <button className="btn-primary" onClick={() => navigate('/products')}>
                                <i className="fas fa-arrow-right"></i>
                                거래 시작하기
                            </button>
                            <button className="btn-secondary" onClick={() => navigate("/info")} >
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
                            <button
                                type="button"
                                key={idx}
                                className="category-item"
                                onClick={() => {
                                    if (cat.key === 'all') {
                                        setShowAllCategories((prev) => !prev);
                                        return;
                                    }

                                    navigate(`/products?category=${cat.key}`);
                                }}
                            >
                                <div className="category-icon-wrap">
                                    <span className="category-emoji">{cat.emoji}</span>
                                </div>
                                <span className="category-label">
                                    {cat.label === '전체보기'
                                        ? (showAllCategories ? '접기' : '전체보기')
                                        : cat.label}
                                </span>
                            </button>
                        ))}

                        {showAllCategories && extraCategories.map((cat, idx) => (
                            <button
                                type="button"
                                key={`extra-${idx}`}
                                className="category-item"
                            >
                                <div className="category-icon-wrap">
                                    <span className="category-emoji">{cat.emoji}</span>
                                </div>
                                <span className="category-label">{cat.label}</span>
                            </button>
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
                                <span className="marquee-text">
                                    {item.user}이 {item.item}을(를) {item.status}했습니다!
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══ 인기 매물 그리드 ═══ */}
            <section className="products-section">
                <div className="container">
                    <div className="section-header">
                        <div>
                            <h2 className="section-title">
                                실시간 인기 매물 <i className="fas fa-fire" style={{ color: '#ef4444' }}></i>
                            </h2>
                            <p className="section-subtitle">지금 이순간, 가장 많이 찾는 상품들이에요.</p>
                        </div>
                       <span 
                                className="view-all-link" 
                                // 🌟 꼬리표(?filter=popular)를 붙여서 이동시킵니다!
                                onClick={() => navigate('/products?filter=popular')} 
                                style={{ cursor: 'pointer' }}
                            >
                            전체보기 <i className="fas fa-chevron-right"></i>
                        </span>
                    </div>

                    <div className="main-popular-grid">
                        {products.map((product, idx) => (
                            <article
                                key={product.productId}
                                className={`main-popular-card ${visibleCards.has(idx) ? 'visible' : ''}`}
                                ref={(el) => (cardsRef.current[idx] = el)}
                                data-index={idx}
                                style={{ transitionDelay: `${idx * 0.08}s` }}
                                onClick={() => navigate(`/products/${product.productId}`)}
                            >
                                <div className="main-popular-image">
                                    {product.thumbnailUrl && !imageErrorMap[product.productId] ? (
                                        <img
                                            src={product.thumbnailUrl}
                                            alt=""
                                            className="main-popular-thumb"
                                            onError={() => {
                                                setImageErrorMap((prev) => ({
                                                    ...prev,
                                                    [product.productId]: true,
                                                }));
                                            }}
                                        />
                                    ) : (
                                        <div className="main-popular-no-image">
                                            <span className="product-emoji">📦</span>
                                        </div>
                                    )}

                                    <span className="product-badge">
                                        <i className="fas fa-fire"></i> 인기
                                    </span>
                                </div>

                                <div className="main-popular-info">
                                    <h4 className="main-popular-title">{product.title}</h4>
                                    <div className="main-popular-price">{formatPrice(product.price)}원</div>

                                    <div className="main-popular-meta">
                                        <span className="main-popular-location">
                                            <i className="fas fa-map-marker-alt"></i>
                                            {product.location}
                                        </span>

                                        <div className="main-popular-stats">
                                            <span><i className="far fa-heart"></i> {product.likeCount}</span>
                                            <span><i className="far fa-comment"></i> {product.chatCount}</span>
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
                            데이터로 증명하는
                            <br />
                            <span>가장 안전한 환승</span>
                        </h2>

                        <div className="stats-grid">
                            {stats.map((stat, idx) => (
                                <div
                                    key={idx}
                                    className={`stat-card ${statsVisible ? 'visible' : ''}`}
                                    style={{ transitionDelay: '0.08s' }}
                                >
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
                                    <div
                                        key={`${item.user}-${idx}`}
                                        className="live-feed-item"
                                        style={{ animationDelay: `${idx * 0.1}s` }}
                                    >
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
                        {/* <button className="safety-cta">
                            가이드 보기 <i className="fas fa-arrow-right"></i>
                        </button> */}
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