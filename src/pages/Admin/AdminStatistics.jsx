import { useEffect, useState, useCallback } from 'react';
import styles from './AdminStatistics.module.css';
import {
    fetchOnlineUsers,
    fetchUserStats,
    fetchTransactionStats,
    fetchProductStats,
    fetchSearchStats,
    fetchReportStats,
} from '../../api/StatisticsAPI';

// 숫자 포맷 헬퍼
const fmt = (v) => (v != null ? v.toLocaleString() : '-');
const fmtWon = (v) => (v != null ? `${v.toLocaleString()}원` : '-');

function AdminStatistics() {
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [errors, setErrors] = useState({});
    const [lastUpdated, setLastUpdated] = useState(null);

    // 각 섹션 데이터
    const [onlineUsers, setOnlineUsers] = useState(0);
    const [userStats, setUserStats] = useState(null);
    const [txStats, setTxStats] = useState(null);
    const [productStats, setProductStats] = useState(null);
    const [searchStats, setSearchStats] = useState(null);
    const [reportStats, setReportStats] = useState(null);

    const loadAllData = useCallback(async (isManualRefresh = false) => {
        if (isManualRefresh) setIsRefreshing(true);

        const newErrors = {};

        // 각 API를 독립적으로 호출하여 하나가 실패해도 나머지는 표시
        const results = await Promise.allSettled([
            fetchOnlineUsers(),
            fetchUserStats(),
            fetchTransactionStats(),
            fetchProductStats(),
            fetchSearchStats(),
            fetchReportStats(),
        ]);

        if (results[0].status === 'fulfilled') setOnlineUsers(results[0].value);
        else newErrors.online = '실시간 접속자 데이터를 불러올 수 없습니다.';

        if (results[1].status === 'fulfilled') setUserStats(results[1].value);
        else newErrors.user = '사용자 통계를 불러올 수 없습니다.';

        if (results[2].status === 'fulfilled') setTxStats(results[2].value);
        else newErrors.tx = '거래 통계를 불러올 수 없습니다.';

        if (results[3].status === 'fulfilled') setProductStats(results[3].value);
        else newErrors.product = '상품 통계를 불러올 수 없습니다.';

        if (results[4].status === 'fulfilled') setSearchStats(results[4].value);
        else newErrors.search = '검색 통계를 불러올 수 없습니다.';

        if (results[5].status === 'fulfilled') setReportStats(results[5].value);
        else newErrors.report = '신고 통계를 불러올 수 없습니다.';

        setErrors(newErrors);
        setLastUpdated(new Date());
        setIsLoading(false);
        setIsRefreshing(false);
    }, []);

    useEffect(() => {
        loadAllData();
        const intervalId = setInterval(() => loadAllData(), 60000);
        return () => clearInterval(intervalId);
    }, [loadAllData]);

    // 로딩 중 표시
    if (isLoading) {
        return (
            <div className={styles.statsContainer}>
                <div className={styles.loadingOverlay}>
                    <i className="bx bx-loader-alt"></i>
                    <span>통계 데이터를 불러오는 중...</span>
                </div>
            </div>
        );
    }

    const hasAnyError = Object.keys(errors).length > 0;

    // 카테고리별 분포 - 최대값 기준 퍼센트 계산
    const categories = productStats?.categoryDistribution || [];
    const maxCategoryCount = Math.max(...categories.map(c => c.count), 1);

    // 가격 분포 도넛 차트 conic-gradient 생성
    const priceRanges = productStats?.priceDistribution || [];
    const totalPriceCount = priceRanges.reduce((sum, r) => sum + r.count, 0) || 1;
    const priceColors = ['#00d68f', '#3b82f6', '#8b5cf6'];
    let cumulativeDeg = 0;
    const conicStops = priceRanges.map((range, i) => {
        const startDeg = cumulativeDeg;
        const endDeg = startDeg + (range.count / totalPriceCount) * 360;
        cumulativeDeg = endDeg;
        return `${priceColors[i] || '#ccc'} ${startDeg}deg ${endDeg}deg`;
    });
    const donutStyle = priceRanges.length > 0
        ? { background: `conic-gradient(${conicStops.join(', ')})` }
        : { background: 'var(--toggle-color)' };

    // 인기 검색어
    const keywords = searchStats?.popularKeywords || [];

    // 바 차트 색상 순환
    const barFills = [styles.fillGreen, styles.fillBlue, styles.fillPurple, styles.fillOrange, styles.fillTeal, styles.fillPink, styles.fillRed, styles.fillYellow];

    return (
        <div className={styles.statsContainer}>
            {/* 헤더 */}
            <div className={styles.pageHeader}>
                <h2 className={styles.pageTitle}>통계</h2>
                <button
                    className={styles.refreshBtn}
                    onClick={() => loadAllData(true)}
                    disabled={isRefreshing}
                >
                    <i className={`bx bx-refresh ${isRefreshing ? styles.spinning : ''}`}></i>
                    {isRefreshing ? '갱신 중...' : '새로고침'}
                </button>
            </div>

            {/* 에러 배너 */}
            {hasAnyError && (
                <div className={styles.errorBanner}>
                    <i className="bx bx-error-circle" style={{ fontSize: 20 }}></i>
                    <span>일부 통계 데이터를 불러오지 못했습니다. 해당 섹션에 오류가 표시됩니다.</span>
                </div>
            )}

            {/* ====== 1. 실시간 대시보드 - 현재 접속자 수 ====== */}
            <div className={styles.section}>
                {errors.online ? (
                    <SectionError message={errors.online} />
                ) : (
                    <div className={styles.liveBanner}>
                        <div className={styles.liveBannerLeft}>
                            <div className={styles.liveBannerIcon}>
                                <i className="bx bx-pulse"></i>
                            </div>
                            <div>
                                <div className={styles.liveBannerLabel}>현재 접속자 수</div>
                                <div className={styles.liveBannerValue}>
                                    {fmt(typeof onlineUsers === 'object' ? onlineUsers.count : onlineUsers)}명
                                </div>
                            </div>
                        </div>
                        <div className={styles.liveBannerRight}>
                            <div className={styles.pulseDot}></div>
                            <span>실시간</span>
                        </div>
                    </div>
                )}
            </div>

            {/* ====== 2. 사용자(User) 관련 통계 ====== */}
            <div className={styles.section}>
                <div className={styles.sectionTitle}>
                    <i className="bx bx-group"></i>
                    사용자 통계
                </div>
                {errors.user ? (
                    <SectionError message={errors.user} />
                ) : (
                    <div className={styles.statsGrid}>
                        <StatCard
                            icon="bx bx-user-check"
                            iconStyle={styles.iconGreen}
                            label="전체 가입자"
                            value={`${fmt(userStats?.totalUsers)}명`}
                        />
                        <StatCard
                            icon="bx bx-user-plus"
                            iconStyle={styles.iconBlue}
                            label="오늘 신규 가입"
                            value={`${fmt(userStats?.dailyNewUsers)}명`}
                            sub="일간"
                        />
                        <StatCard
                            icon="bx bx-calendar-plus"
                            iconStyle={styles.iconPurple}
                            label="이번 달 신규 가입"
                            value={`${fmt(userStats?.monthlyNewUsers)}명`}
                            sub="월간"
                        />
                    </div>
                )}
            </div>

            {/* ====== 3. 거래(Transactions) 통계 ====== */}
            <div className={styles.section}>
                <div className={styles.sectionTitle}>
                    <i className="bx bx-transfer"></i>
                    거래 통계
                </div>
                {errors.tx ? (
                    <SectionError message={errors.tx} />
                ) : (
                    <div className={styles.statsGrid}>
                        <StatCard
                            icon="bx bx-receipt"
                            iconStyle={styles.iconTeal}
                            label="총 거래 수"
                            value={`${fmt(txStats?.totalTransactions)}건`}
                        />
                        <StatCard
                            icon="bx bx-won"
                            iconStyle={styles.iconOrange}
                            label="거래 금액 총합 (GMV)"
                            value={fmtWon(txStats?.totalGMV)}
                        />
                        <StatCard
                            icon="bx bx-line-chart"
                            iconStyle={styles.iconBlue}
                            label="오늘 거래 수"
                            value={`${fmt(txStats?.dailyTransactions)}건`}
                            sub="일간"
                        />
                        <StatCard
                            icon="bx bx-bar-chart-alt-2"
                            iconStyle={styles.iconPurple}
                            label="이번 달 거래 수"
                            value={`${fmt(txStats?.monthlyTransactions)}건`}
                            sub="월간"
                        />
                    </div>
                )}
            </div>

            {/* ====== 4. 상품(Listings) 통계 ====== */}
            <div className={styles.section}>
                <div className={styles.sectionTitle}>
                    <i className="bx bx-package"></i>
                    상품 통계
                </div>
                {errors.product ? (
                    <SectionError message={errors.product} />
                ) : (
                    <>
                        {/* 상품 등록 수 (일/주/월) */}
                        <div className={styles.statsGrid} style={{ marginBottom: 20 }}>
                            <StatCard
                                icon="bx bx-calendar-check"
                                iconStyle={styles.iconGreen}
                                label="오늘 등록"
                                value={`${fmt(productStats?.dailyListings)}개`}
                                sub="일간"
                            />
                            <StatCard
                                icon="bx bx-calendar-week"
                                iconStyle={styles.iconBlue}
                                label="이번 주 등록"
                                value={`${fmt(productStats?.weeklyListings)}개`}
                                sub="주간"
                            />
                            <StatCard
                                icon="bx bx-calendar"
                                iconStyle={styles.iconPurple}
                                label="이번 달 등록"
                                value={`${fmt(productStats?.monthlyListings)}개`}
                                sub="월간"
                            />
                            <StatCard
                                icon="bx bx-box"
                                iconStyle={styles.iconOrange}
                                label="전체 등록 상품"
                                value={`${fmt(productStats?.totalListings)}개`}
                            />
                        </div>

                        <div className={styles.twoColGrid}>
                            {/* 카테고리별 상품 분포 */}
                            <div className={styles.panel}>
                                <div className={styles.panelTitle}>
                                    <i className="bx bx-category"></i>
                                    카테고리별 상품 분포
                                </div>
                                {categories.length > 0 ? (
                                    <ul className={styles.barChartList}>
                                        {categories.map((cat, i) => (
                                            <li key={cat.name} className={styles.barChartItem}>
                                                <div className={styles.barChartLabel}>
                                                    <span className={styles.barChartLabelName}>{cat.name}</span>
                                                    <span className={styles.barChartLabelValue}>{fmt(cat.count)}개</span>
                                                </div>
                                                <div className={styles.barChartTrack}>
                                                    <div
                                                        className={`${styles.barChartFill} ${barFills[i % barFills.length]}`}
                                                        style={{ width: `${(cat.count / maxCategoryCount) * 100}%` }}
                                                    ></div>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <EmptyState text="카테고리 데이터가 없습니다." />
                                )}
                            </div>

                            {/* 가격 분포 */}
                            <div className={styles.panel}>
                                <div className={styles.panelTitle}>
                                    <i className="bx bx-won"></i>
                                    가격대별 분포
                                </div>
                                {priceRanges.length > 0 ? (
                                    <div className={styles.priceDistribution}>
                                        <div className={styles.donutChart} style={donutStyle}>
                                            <div className={styles.donutHole}></div>
                                        </div>
                                        <div className={styles.donutLegend}>
                                            {priceRanges.map((range, i) => (
                                                <div key={range.label} className={styles.legendItem}>
                                                    <span
                                                        className={styles.legendDot}
                                                        style={{ background: priceColors[i] || '#ccc' }}
                                                    ></span>
                                                    <span>{range.label}</span>
                                                    <span className={styles.legendValue}>
                                                        {fmt(range.count)}개 ({Math.round((range.count / totalPriceCount) * 100)}%)
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <EmptyState text="가격 분포 데이터가 없습니다." />
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* ====== 5. 검색 & 탐색 행동 ====== */}
            <div className={styles.section}>
                <div className={styles.sectionTitle}>
                    <i className="bx bx-search-alt-2"></i>
                    검색 & 탐색 행동
                </div>
                {errors.search ? (
                    <SectionError message={errors.search} />
                ) : (
                    <div className={styles.twoColGrid}>
                        {/* 인기 검색어 */}
                        <div className={styles.panel}>
                            <div className={styles.panelTitle}>
                                <i className="bx bx-trending-up"></i>
                                인기 검색어 TOP 10
                            </div>
                            {keywords.length > 0 ? (
                                <ul className={styles.keywordList}>
                                    {keywords.slice(0, 10).map((kw, i) => (
                                        <li key={kw.keyword} className={styles.keywordItem}>
                                            <span className={`${styles.keywordRank} ${i >= 3 ? styles.sub : ''}`}>
                                                {i + 1}
                                            </span>
                                            <span className={styles.keywordText}>{kw.keyword}</span>
                                            <span className={styles.keywordCount}>{fmt(kw.count)}회</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <EmptyState text="검색어 데이터가 없습니다." />
                            )}
                        </div>

                        {/* 찜(관심등록) 수 */}
                        <div className={styles.panel}>
                            <div className={styles.panelTitle}>
                                <i className="bx bx-heart"></i>
                                찜(관심등록) 통계
                            </div>
                            <div className={styles.statsGrid}>
                                <StatCard
                                    icon="bx bxs-heart"
                                    iconStyle={styles.iconPink}
                                    label="전체 찜 수"
                                    value={`${fmt(searchStats?.totalWishlist)}건`}
                                />
                                <StatCard
                                    icon="bx bx-heart-circle"
                                    iconStyle={styles.iconRed}
                                    label="오늘 찜"
                                    value={`${fmt(searchStats?.dailyWishlist)}건`}
                                    sub="일간"
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ====== 6. 사기/신고/신뢰 관련 ====== */}
            <div className={styles.section}>
                <div className={styles.sectionTitle}>
                    <i className="bx bx-shield-quarter"></i>
                    신고 & 신뢰 관리
                </div>
                {errors.report ? (
                    <SectionError message={errors.report} />
                ) : (
                    <div className={styles.reportGrid}>
                        <ReportCard
                            icon="bx bx-flag"
                            iconColor="#ef4444"
                            label="총 신고 건수"
                            value={fmt(reportStats?.totalReports)}
                        />
                        <ReportCard
                            icon="bx bx-time-five"
                            iconColor="#f97316"
                            label="미처리 신고"
                            value={fmt(reportStats?.pendingReports)}
                        />
                        <ReportCard
                            icon="bx bx-check-double"
                            iconColor="#00d68f"
                            label="처리 완료"
                            value={fmt(reportStats?.resolvedReports)}
                        />
                        <ReportCard
                            icon="bx bx-block"
                            iconColor="#8b5cf6"
                            label="차단된 사용자"
                            value={`${fmt(reportStats?.blockedUsers)}명`}
                        />
                        <ReportCard
                            icon="bx bx-user-x"
                            iconColor="#ec4899"
                            label="정지된 사용자"
                            value={`${fmt(reportStats?.suspendedUsers)}명`}
                        />
                    </div>
                )}
            </div>

            {/* 타임스탬프 */}
            {lastUpdated && (
                <div className={styles.timestamp}>
                    <i className="bx bx-time-five"></i>
                    마지막 갱신: {lastUpdated.toLocaleTimeString('ko-KR')} (60초 주기 자동 갱신)
                </div>
            )}
        </div>
    );
}

/* === 서브 컴포넌트 === */

function StatCard({ icon, iconStyle, label, value, sub }) {
    return (
        <div className={styles.statCard}>
            <div className={styles.statCardHeader}>
                <div className={`${styles.statCardIcon} ${iconStyle}`}>
                    <i className={icon}></i>
                </div>
                <span className={styles.statCardLabel}>{label}</span>
            </div>
            <div className={styles.statCardValue}>{value}</div>
            {sub && <div className={styles.statCardSub}>{sub}</div>}
        </div>
    );
}

function ReportCard({ icon, iconColor, label, value }) {
    return (
        <div className={styles.reportCard}>
            <div className={styles.reportCardIcon} style={{ color: iconColor }}>
                <i className={icon}></i>
            </div>
            <div className={styles.reportCardValue}>{value}</div>
            <div className={styles.reportCardLabel}>{label}</div>
        </div>
    );
}

function SectionError({ message }) {
    return (
        <div className={styles.errorBanner}>
            <i className="bx bx-error-circle" style={{ fontSize: 18 }}></i>
            <span>{message}</span>
        </div>
    );
}

function EmptyState({ text }) {
    return (
        <div className={styles.emptyState}>
            <i className="bx bx-data"></i>
            <span>{text}</span>
        </div>
    );
}

export default AdminStatistics;
