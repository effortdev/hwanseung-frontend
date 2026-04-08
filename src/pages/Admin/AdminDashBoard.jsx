import styles from './AdminContent.module.css';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function AdminDashBoard() {
    const navigate = useNavigate();
    const [counts, setCounts] = useState({ users: 0, products: 0, sellproducts: 0 });
    // 권고사항 2: 로딩 및 에러 상태 관리 추가
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // 데이터 페칭 함수 분리 (재사용성 및 Polling 목적)
        const fetchDashboardData = async () => {
            try {
                setError(null); // 재호출 시 이전 에러 초기화
                
                // HTTP 응답 상태(res.ok)를 1차적으로 검증하는 로직 추가
                const [userData, productData, sellData] = await Promise.all([
                    fetch('/api/user/count').then(res => {
                        if (!res.ok) throw new Error('사용자 통계 API 응답 오류');
                        return res.json();
                    }),
                    fetch('/api/products/count').then(res => {
                        if (!res.ok) throw new Error('상품 통계 API 응답 오류');
                        return res.json();
                    }),
                    fetch('/api/products/sellcount').then(res => {
                        if (!res.ok) throw new Error('판매 상품 통계 API 응답 오류');
                        return res.json();
                    })
                ]);

                setCounts({
                    users: userData.totalCount,
                    products: productData.totalCount,
                    sellproducts: sellData.sellCount
                });
            } catch (err) {
                console.error("대시보드 통계 데이터 로드 실패:", err);
                setError("데이터를 불러오는 중 문제가 발생했습니다.");
            } finally {
                setIsLoading(false);
            }
        };

        // 1. 마운트 시 최초 데이터 페칭
        fetchDashboardData();

        // 권고사항 3: Polling 적용 (30초마다 데이터 자동 갱신)
        const intervalId = setInterval(fetchDashboardData, 30000);

        // 언마운트 시 메모리 누수 방지를 위한 클린업 처리
        return () => clearInterval(intervalId);
    }, []);

    return (
        <div className={styles.container}>
            <h2 className={styles.title}>대시보드</h2>

            {/* 에러 발생 시 UI 노출 처리 */}
            {error && (
                <div className={styles.errorAlert} style={{ color: '#d9534f', padding: '10px 0', fontWeight: 'bold' }}>
                    <i className="bx bx-error-circle" style={{ marginRight: '8px' }}></i>
                    {error}
                </div>
            )}

            <div className={styles.cardGrid}>
                {/* 권고사항 1: 모든 아이콘을 boxicons(bx)로 통일 */}
                <div className={styles.card}>
                    <div className={styles.cardIcon}>
                        <i className="bx bx-user"></i>
                    </div>
                    <div className={styles.cardInfo}>
                        <span className={styles.cardLabel}>총 사용자</span>
                        <span className={styles.cardValue}>
                            {isLoading ? '로딩중...' : `${counts.users?.toLocaleString() || 0}명`}
                        </span>
                    </div>
                </div>
                <div className={styles.card}>
                    <div className={styles.cardIcon}>
                        <i className="bx bx-package"></i>
                    </div>
                    <div className={styles.cardInfo}>
                        <span className={styles.cardLabel}>등록 상품</span>
                        <span className={styles.cardValue}>
                            {isLoading ? '로딩중...' : `${counts.products?.toLocaleString() || 0}개`}
                        </span>
                    </div>
                </div>
                <div className={styles.card}>
                    <div className={styles.cardIcon}>
                        <i className="bx bx-store-alt"></i>
                    </div>
                    <div className={styles.cardInfo}>
                        <span className={styles.cardLabel}>판매 중인 상품</span>
                        <span className={styles.cardValue}>
                            {isLoading ? '로딩중...' : `${counts.sellproducts?.toLocaleString() || 0}개`}
                        </span>
                    </div>
                </div>
                <div className={styles.card}>
                    <div className={styles.cardIcon}>
                        <i className="bx bx-transfer"></i>
                    </div>
                    <div className={styles.cardInfo}>
                        <span className={styles.cardLabel}>진행 중 거래</span>
                        <span className={styles.cardValue}>-</span>
                    </div>
                </div>
                <div className={styles.card}>
                    <div className={styles.cardIcon}>
                        {/* FontAwesome 제거 및 Boxicons로 대체 */}
                        <i className="bx bx-check-circle"></i>
                    </div>
                    <div className={styles.cardInfo}>
                        <span className={styles.cardLabel}>거래 완료</span>
                        <span className={styles.cardValue}>-</span>
                    </div>
                </div>
                <div className={styles.card}>
                    <div className={styles.cardIcon}>
                        <i className="bx bx-error-circle"></i>
                    </div>
                    <div className={styles.cardInfo}>
                        <span className={styles.cardLabel}>미처리 신고</span>
                        <span className={styles.cardValue}>-</span>
                    </div>
                </div>
            </div>

            <p style={{ color: 'var(--text-color)', marginTop: '10px', fontSize: '0.85rem', opacity: 0.7 }}>
                <i className="bx bx-time-five" style={{ marginRight: '5px' }}></i>
                데이터는 30초 주기로 자동 갱신됩니다.
            </p>

            {/* --- 하단 시각화 레이아웃 영역 (이전 제안 기반) --- */}
            <div className={styles.dashboardBody} style={{ marginTop: '40px', display: 'flex', gap: '20px' }}>
                {/* 1. 통계 그래프 섹션 (추후 Recharts 연동 영역) */}
                <div className={styles.chartSection} style={{ flex: 2, background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '15px' }}>주간 거래 및 가입 추이</h3>
                    <div style={{ height: '300px', backgroundColor: '#f9f9f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa' }}>
                        [ Area Chart 렌더링 영역 ]
                    </div>
                </div>

                {/* 2. 빠른 처리 요망 섹션 */}
                <div className={styles.listSection} style={{ flex: 1, background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <h3 style={{ fontSize: '1.1rem' }}>🚨미처리 신고 내역</h3>
                        <span style={{ fontSize: '0.8rem', color: '#007bff', cursor: 'pointer' }} onClick={ () => navigate('/admin/reports') }>전체 보기</span>
                    </div>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {/* API 연동 전 UI 스켈레톤 */}
                        <li style={{ padding: '10px 0', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between' }}>
                            <span><strong style={{ color: '#d9534f' }}>사기 의심</strong> (user_123)</span>
                            <span style={{ color: '#888', fontSize: '0.9rem' }}>대기중</span>
                        </li>
                    </ul>
                </div>
            </div>

            {/* --- 3. 하단 실시간 시스템 및 상품 모니터링 영역 --- */}
            <div className={styles.dashboardFooter} style={{ marginTop: '20px', display: 'flex', gap: '20px' }}>
                
                {/* 3-1. 실시간 AI 및 FDS 시스템 로그 */}
                <div className={styles.logSection} style={{ flex: 1, background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <h3 style={{ fontSize: '1.1rem' }}>AI 및 FDS 실시간 로그</h3>
                        <span style={{ fontSize: '0.8rem', color: '#28a745' }}><i className="bx bx-radio-circle-marked bx-burst"></i> Live</span>
                    </div>
                    <div style={{ height: '250px', overflowY: 'auto', backgroundColor: '#2b2b2b', borderRadius: '6px', padding: '15px', color: '#a9b7c6', fontSize: '0.85rem', fontFamily: 'monospace' }}>
                        {/* API 연동 전 가상 로그 데이터 */}
                        <div style={{ marginBottom: '8px' }}>
                            <span style={{ color: '#6a8759' }}>[2026-04-03 14:25:11]</span> [AI_IMG] user_8821 상품 이미지 분석 완료 (위변조 확률: 2%)
                        </div>
                        <div style={{ marginBottom: '8px' }}>
                            <span style={{ color: '#6a8759' }}>[2026-04-03 14:26:05]</span> <span style={{ color: '#cc7832' }}>[FDS_WARN]</span> user_104 단기간 다중 접속 감지 (IP: 192.168.***)
                        </div>
                        <div style={{ marginBottom: '8px' }}>
                            <span style={{ color: '#6a8759' }}>[2026-04-03 14:26:30]</span> [AI_TEXT] PRD_9932 상품명 자동 추출 성공 ('아이폰 15 프로')
                        </div>
                        <div style={{ marginBottom: '8px' }}>
                            <span style={{ color: '#6a8759' }}>[2026-04-03 14:27:01]</span> <span style={{ color: '#cc4b37', fontWeight: 'bold' }}>[AI_IMG_FAIL]</span> PRD_9935 이미지 필터링 서버(FastAPI) 응답 지연
                        </div>
                    </div>
                </div>

                {/* 3-2. 최근 등록 상품 (썸네일 및 AI 추출 결과 확인) */}
                <div className={styles.recentProductSection} style={{ flex: 1, background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <h3 style={{ fontSize: '1.1rem' }}>최근 등록 상품 모니터링</h3>
                        <span style={{ fontSize: '0.8rem', color: '#007bff', cursor: 'pointer' }} onClick={ () => navigate('/admin/products') }>상품 관리로 이동</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
                        {/* 더미 상품 카드 1 */}
                        <div style={{ display: 'flex', gap: '10px', padding: '10px', border: '1px solid #eee', borderRadius: '6px' }}>
                            <div style={{ width: '60px', height: '60px', backgroundColor: '#e9ecef', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <i className="bx bx-image" style={{ color: '#adb5bd', fontSize: '1.5rem' }}></i>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                <span style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>아이폰 15 프로</span>
                                <span style={{ fontSize: '0.8rem', color: '#888' }}>1,050,000원</span>
                                <span style={{ fontSize: '0.75rem', color: '#17a2b8' }}><i className="bx bx-bot"></i> 이름 자동추출됨</span>
                            </div>
                        </div>
                        {/* 더미 상품 카드 2 */}
                        <div style={{ display: 'flex', gap: '10px', padding: '10px', border: '1px solid #eee', borderRadius: '6px' }}>
                            <div style={{ width: '60px', height: '60px', backgroundColor: '#e9ecef', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <i className="bx bx-image" style={{ color: '#adb5bd', fontSize: '1.5rem' }}></i>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                <span style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>나이키 조던 1</span>
                                <span style={{ fontSize: '0.8rem', color: '#888' }}>200,000원</span>
                                <span style={{ fontSize: '0.75rem', color: '#28a745' }}><i className="bx bx-check-shield"></i> 이미지 정상</span>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

export default AdminDashBoard;
