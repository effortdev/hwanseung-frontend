import { useEffect, useState, useCallback } from 'react';
import styles from './AdminReports.module.css';
import {
    fetchReports,
    fetchReportDetail,
    warnReportedUser,
    suspendReportedUser,
    dismissReport,
    deleteReportedContent,
    fetchSuspendedUsers,
    unsuspendUser,
} from '../../api/ReportsAPI';

// 신고 처리 상태 매핑
const STATUS_MAP = {
    PENDING: { label: '미처리', style: styles.badgePending },
    WARNED: { label: '경고', style: styles.badgeWarned },
    SUSPENDED: { label: '정지', style: styles.badgeSuspended },
    DISMISSED: { label: '기각', style: styles.badgeDismissed },
    RESOLVED: { label: '처리완료', style: styles.badgeResolved },
};

// 신고 유형 매핑
const TYPE_MAP = {
    USER: { label: '사용자', icon: 'bx bx-user', style: styles.typeUser },
    PRODUCT: { label: '상품', icon: 'bx bx-package', style: styles.typeProduct },
    CHAT: { label: '채팅', icon: 'bx bx-message-dots', style: styles.typeChat },
};

// 신고 사유 카테고리
const REASON_CATEGORIES = {
    FRAUD: '사기 의심',
    INAPPROPRIATE: '부적절한 콘텐츠',
    ABUSIVE: '욕설/비방',
    SPAM: '스팸/광고',
    COUNTERFEIT: '위조품/가품',
    OTHER: '기타',
};

// 정지 기간 옵션
const SUSPEND_DAYS_OPTIONS = [
    { value: 3, label: '3일' },
    { value: 7, label: '7일' },
    { value: 14, label: '14일' },
    { value: 30, label: '30일' },
    { value: 90, label: '90일' },
    { value: 0, label: '영구 정지' },
];

// 날짜 포맷
const fmtDate = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

function AdminReports() {
    // 탭 ('reports' | 'suspended')
    const [activeTab, setActiveTab] = useState('reports');

    // ========== 신고 목록 ==========
    const [reports, setReports] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const [searchInput, setSearchInput] = useState('');
    const [searchKeyword, setSearchKeyword] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterType, setFilterType] = useState('');

    const [summary, setSummary] = useState({ total: 0, pending: 0, warned: 0, suspended: 0, dismissed: 0 });

    // 상세 모달
    const [detail, setDetail] = useState(null);
    const [isDetailLoading, setIsDetailLoading] = useState(false);
    const [detailError, setDetailError] = useState(null);

    // 처리 액션
    const [actionMode, setActionMode] = useState(null); // 'warn' | 'suspend' | 'dismiss'
    const [actionMemo, setActionMemo] = useState('');
    const [suspendDays, setSuspendDays] = useState(7);
    const [isActioning, setIsActioning] = useState(false);

    // ========== 정지 사용자 ==========
    const [suspendedUsers, setSuspendedUsers] = useState([]);
    const [suIsLoading, setSuIsLoading] = useState(false);
    const [suError, setSuError] = useState(null);
    const [suPage, setSuPage] = useState(1);
    const [suTotalPages, setSuTotalPages] = useState(1);
    const [suSearchInput, setSuSearchInput] = useState('');
    const [suSearchKeyword, setSuSearchKeyword] = useState('');
    const [suspendedCount, setSuspendedCount] = useState(0);

    // 신고 목록 조회
    const loadReports = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await fetchReports({
                page: page - 1,
                size: 10,
                keyword: searchKeyword,
                status: filterStatus,
                type: filterType,
            });
            setReports(data.content || []);
            setTotalPages(data.totalPages || 1);
            if (data.summary) setSummary(data.summary);
        } catch (err) {
            console.error('신고 목록 로드 실패:', err);
            setError('신고 목록을 불러오는 데 실패했습니다.');
        } finally {
            setIsLoading(false);
        }
    }, [page, searchKeyword, filterStatus, filterType]);

    // 정지 사용자 목록 조회
    const loadSuspendedUsers = useCallback(async () => {
        setSuIsLoading(true);
        setSuError(null);
        try {
            const data = await fetchSuspendedUsers({
                page: suPage - 1,
                size: 10,
                keyword: suSearchKeyword,
            });
            setSuspendedUsers(data.content || []);
            setSuTotalPages(data.totalPages || 1);
            setSuspendedCount(data.totalElements || 0);
        } catch (err) {
            console.error('정지 사용자 로드 실패:', err);
            setSuError('정지 사용자 목록을 불러오는 데 실패했습니다.');
        } finally {
            setSuIsLoading(false);
        }
    }, [suPage, suSearchKeyword]);

    useEffect(() => {
        if (activeTab === 'reports') loadReports();
        else loadSuspendedUsers();
    }, [activeTab, loadReports, loadSuspendedUsers]);

    // 검색
    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1);
        setSearchKeyword(searchInput);
    };

    const handleSuSearch = (e) => {
        e.preventDefault();
        setSuPage(1);
        setSuSearchKeyword(suSearchInput);
    };

    // 상태 필터 클릭
    const handleStatusFilter = (status) => {
        setPage(1);
        setFilterStatus((prev) => (prev === status ? '' : status));
    };

    // 상세 조회
    const openDetail = async (reportId) => {
        setDetail(null);
        setDetailError(null);
        setIsDetailLoading(true);
        setActionMode(null);
        setActionMemo('');
        setSuspendDays(7);

        try {
            const data = await fetchReportDetail(reportId);
            setDetail(data);
        } catch (err) {
            console.error('신고 상세 로드 실패:', err);
            setDetailError('신고 상세 정보를 불러올 수 없습니다.');
        } finally {
            setIsDetailLoading(false);
        }
    };

    const closeDetail = () => {
        setDetail(null);
        setDetailError(null);
        setIsDetailLoading(false);
        setActionMode(null);
    };

    // 처리 액션 실행
    const executeAction = async () => {
        if (!detail) return;
        setIsActioning(true);
        try {
            if (actionMode === 'warn') {
                await warnReportedUser(detail.id, actionMemo);
            } else if (actionMode === 'suspend') {
                await suspendReportedUser(detail.id, { days: suspendDays, memo: actionMemo });
            } else if (actionMode === 'dismiss') {
                await dismissReport(detail.id, actionMemo);
            }

            const updated = await fetchReportDetail(detail.id);
            setDetail(updated);
            setActionMode(null);
            setActionMemo('');
            loadReports();
        } catch (err) {
            console.error('처리 실패:', err);
            alert('처리 중 오류가 발생했습니다.');
        } finally {
            setIsActioning(false);
        }
    };

    // 콘텐츠 삭제
    const handleDeleteContent = async () => {
        if (!detail) return;
        if (!window.confirm('신고된 콘텐츠를 삭제하시겠습니까?')) return;
        try {
            await deleteReportedContent(detail.id);
            const updated = await fetchReportDetail(detail.id);
            setDetail(updated);
            loadReports();
        } catch (err) {
            alert('콘텐츠 삭제 중 오류가 발생했습니다.');
        }
    };

    // 정지 해제
    const handleUnsuspend = async (userId, nickname) => {
        if (!window.confirm(`"${nickname}" 사용자의 정지를 해제하시겠습니까?`)) return;
        try {
            await unsuspendUser(userId);
            loadSuspendedUsers();
        } catch (err) {
            alert('정지 해제 중 오류가 발생했습니다.');
        }
    };

    // ESC 키
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') closeDetail();
        };
        if (detail || isDetailLoading) {
            window.addEventListener('keydown', handleKeyDown);
            return () => window.removeEventListener('keydown', handleKeyDown);
        }
    }, [detail, isDetailLoading]);

    return (
        <div className={styles.container}>
            {/* 헤더 */}
            <div className={styles.pageHeader}>
                <h2 className={styles.pageTitle}>신고/정지</h2>
            </div>

            {/* 탭 */}
            <div className={styles.tabBar}>
                <button
                    className={`${styles.tab} ${activeTab === 'reports' ? styles.tabActive : ''}`}
                    onClick={() => setActiveTab('reports')}
                >
                    <i className="bx bx-flag"></i>
                    신고 관리
                    {summary.pending > 0 && (
                        <span className={styles.tabCount}>{summary.pending}</span>
                    )}
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'suspended' ? styles.tabActive : ''}`}
                    onClick={() => setActiveTab('suspended')}
                >
                    <i className="bx bx-user-x"></i>
                    정지 사용자
                    {suspendedCount > 0 && (
                        <span className={styles.tabCount}>{suspendedCount}</span>
                    )}
                </button>
            </div>

            {/* ====== 신고 관리 탭 ====== */}
            {activeTab === 'reports' && (
                <>
                    {/* 요약 카드 */}
                    <div className={styles.summaryGrid}>
                        <SummaryCard
                            icon="bx bx-flag" iconBg="rgba(59,130,246,0.12)" iconColor="#3b82f6"
                            label="전체 신고" value={summary.total}
                            active={filterStatus === ''} onClick={() => handleStatusFilter('')}
                        />
                        <SummaryCard
                            icon="bx bx-time-five" iconBg="rgba(234,179,8,0.12)" iconColor="#eab308"
                            label="미처리" value={summary.pending}
                            active={filterStatus === 'PENDING'} onClick={() => handleStatusFilter('PENDING')}
                        />
                        <SummaryCard
                            icon="bx bx-error" iconBg="rgba(249,115,22,0.12)" iconColor="#f97316"
                            label="경고 처리" value={summary.warned}
                            active={filterStatus === 'WARNED'} onClick={() => handleStatusFilter('WARNED')}
                        />
                        <SummaryCard
                            icon="bx bx-user-x" iconBg="rgba(239,68,68,0.12)" iconColor="#ef4444"
                            label="정지 처리" value={summary.suspended}
                            active={filterStatus === 'SUSPENDED'} onClick={() => handleStatusFilter('SUSPENDED')}
                        />
                    </div>

                    {/* 툴바 */}
                    <div className={styles.toolbar}>
                        <form className={styles.searchForm} onSubmit={handleSearch}>
                            <div className={styles.searchInputWrap}>
                                <i className="bx bx-search"></i>
                                <input
                                    type="text"
                                    className={styles.searchInput}
                                    placeholder="신고자, 피신고자, 사유 검색"
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                />
                            </div>
                            <button type="submit" className={styles.searchBtn}>검색</button>
                        </form>
                        <div className={styles.selectWrap}>
                            <select
                                className={styles.filterSelect}
                                value={filterType}
                                onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
                            >
                                <option value="">전체 유형</option>
                                <option value="USER">사용자 신고</option>
                                <option value="PRODUCT">상품 신고</option>
                                <option value="CHAT">채팅 신고</option>
                            </select>
                        </div>
                    </div>

                    {/* 에러 */}
                    {error && (
                        <div className={styles.errorBanner}>
                            <i className="bx bx-error-circle"></i>
                            <span>{error}</span>
                        </div>
                    )}

                    {/* 신고 테이블 */}
                    <div className={styles.tableWrap}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th style={{ width: 60 }}>번호</th>
                                    <th style={{ width: 80 }}>유형</th>
                                    <th style={{ width: 120 }}>신고자</th>
                                    <th style={{ width: 120 }}>피신고자</th>
                                    <th>신고 사유</th>
                                    <th style={{ width: 85 }}>상태</th>
                                    <th style={{ width: 140 }}>신고일</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr>
                                        <td colSpan="7" className={styles.loadingRow}>
                                            <i className="bx bx-loader-alt bx-spin"></i>
                                            불러오는 중...
                                        </td>
                                    </tr>
                                ) : reports.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className={styles.emptyRow}>
                                            <i className="bx bx-flag"></i>
                                            {searchKeyword || filterStatus || filterType
                                                ? '검색 결과가 없습니다.'
                                                : '등록된 신고가 없습니다.'}
                                        </td>
                                    </tr>
                                ) : (
                                    reports.map((r) => {
                                        const statusInfo = STATUS_MAP[r.status] || STATUS_MAP.PENDING;
                                        const typeInfo = TYPE_MAP[r.type] || TYPE_MAP.USER;
                                        return (
                                            <tr key={r.id} onClick={() => openDetail(r.id)}>
                                                <td style={{ fontSize: 12.5, opacity: 0.5 }}>{r.id}</td>
                                                <td>
                                                    <span className={`${styles.typeTag} ${typeInfo.style}`}>
                                                        <i className={typeInfo.icon}></i>
                                                        {typeInfo.label}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className={styles.userCell}>
                                                        <div className={styles.userAvatar}>
                                                            <i className="bx bx-user"></i>
                                                        </div>
                                                        <span className={styles.userName}>{r.reporterNickname || '-'}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className={styles.userCell}>
                                                        <div className={styles.userAvatar}>
                                                            <i className="bx bx-user"></i>
                                                        </div>
                                                        <span className={styles.userName}>{r.reportedNickname || '-'}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className={styles.reasonEllipsis}>
                                                        {REASON_CATEGORIES[r.reasonCategory] || r.reason || '-'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={`${styles.badge} ${statusInfo.style}`}>
                                                        {statusInfo.label}
                                                    </span>
                                                </td>
                                                <td style={{ fontSize: 12.5, opacity: 0.6 }}>{fmtDate(r.createdAt)}</td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* 페이지네이션 */}
                    {!isLoading && reports.length > 0 && (
                        <Pagination page={page} totalPages={totalPages} setPage={setPage} />
                    )}
                </>
            )}

            {/* ====== 정지 사용자 탭 ====== */}
            {activeTab === 'suspended' && (
                <>
                    {/* 검색 */}
                    <div className={styles.toolbar}>
                        <form className={styles.searchForm} onSubmit={handleSuSearch}>
                            <div className={styles.searchInputWrap}>
                                <i className="bx bx-search"></i>
                                <input
                                    type="text"
                                    className={styles.searchInput}
                                    placeholder="이메일 또는 닉네임 검색"
                                    value={suSearchInput}
                                    onChange={(e) => setSuSearchInput(e.target.value)}
                                />
                            </div>
                            <button type="submit" className={styles.searchBtn}>검색</button>
                        </form>
                    </div>

                    {suError && (
                        <div className={styles.errorBanner}>
                            <i className="bx bx-error-circle"></i>
                            <span>{suError}</span>
                        </div>
                    )}

                    <div className={styles.tableWrap}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th style={{ width: 60 }}>ID</th>
                                    <th>사용자</th>
                                    <th style={{ width: 180 }}>이메일</th>
                                    <th style={{ width: 80 }}>신뢰도</th>
                                    <th style={{ width: 80 }}>누적 신고</th>
                                    <th style={{ width: 130 }}>정지일</th>
                                    <th style={{ width: 130 }}>해제 예정일</th>
                                    <th style={{ width: 100 }}>관리</th>
                                </tr>
                            </thead>
                            <tbody>
                                {suIsLoading ? (
                                    <tr>
                                        <td colSpan="8" className={styles.loadingRow}>
                                            <i className="bx bx-loader-alt bx-spin"></i>
                                            불러오는 중...
                                        </td>
                                    </tr>
                                ) : suspendedUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className={styles.emptyRow}>
                                            <i className="bx bx-user-check"></i>
                                            정지된 사용자가 없습니다.
                                        </td>
                                    </tr>
                                ) : (
                                    suspendedUsers.map((u) => (
                                        <tr key={u.id} style={{ cursor: 'default' }}>
                                            <td style={{ fontSize: 12.5, opacity: 0.5 }}>{u.id}</td>
                                            <td>
                                                <div className={styles.userCell}>
                                                    <div className={styles.userAvatar}>
                                                        <i className="bx bx-user"></i>
                                                    </div>
                                                    <span className={styles.userName}>{u.nickname || '-'}</span>
                                                </div>
                                            </td>
                                            <td style={{ fontSize: 13 }}>{u.email || '-'}</td>
                                            <td>
                                                <span className={`${styles.trustScore} ${(u.trustScore || 0) < 30 ? styles.trustScoreLow : ''}`}>
                                                    {u.trustScore != null ? `${u.trustScore}℃` : '-'}
                                                </span>
                                            </td>
                                            <td style={{ fontWeight: 600, color: (u.reportCount || 0) > 0 ? '#ef4444' : 'inherit' }}>
                                                {u.reportCount || 0}건
                                            </td>
                                            <td style={{ fontSize: 12.5, opacity: 0.6 }}>{fmtDate(u.suspendedAt)}</td>
                                            <td style={{ fontSize: 12.5 }}>
                                                {u.suspendUntil ? (
                                                    <span className={styles.suspendBadge}>
                                                        <i className="bx bx-calendar"></i>
                                                        {fmtDate(u.suspendUntil)}
                                                    </span>
                                                ) : (
                                                    <span className={styles.suspendBadge}>
                                                        <i className="bx bx-block"></i>
                                                        영구 정지
                                                    </span>
                                                )}
                                            </td>
                                            <td>
                                                <button
                                                    className={styles.unsuspendBtn}
                                                    onClick={() => handleUnsuspend(u.id, u.nickname)}
                                                >
                                                    정지 해제
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {!suIsLoading && suspendedUsers.length > 0 && (
                        <Pagination page={suPage} totalPages={suTotalPages} setPage={setSuPage} />
                    )}
                </>
            )}

            {/* ====== 신고 상세 모달 ====== */}
            {(detail || isDetailLoading || detailError) && (
                <div className={styles.modalOverlay} onClick={(e) => { if (e.target === e.currentTarget) closeDetail(); }}>
                    <div className={styles.modal}>
                        {isDetailLoading ? (
                            <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-color)', opacity: 0.5 }}>
                                <i className="bx bx-loader-alt bx-spin" style={{ fontSize: 32, display: 'block', marginBottom: 12 }}></i>
                                불러오는 중...
                            </div>
                        ) : detailError ? (
                            <div style={{ padding: 40 }}>
                                <div className={styles.errorBanner}>
                                    <i className="bx bx-error-circle"></i>
                                    <span>{detailError}</span>
                                </div>
                                <div className={styles.modalActions}>
                                    <button className={styles.btnSecondary} onClick={closeDetail}>닫기</button>
                                </div>
                            </div>
                        ) : detail && (
                            <>
                                {/* 모달 헤더 */}
                                <div className={styles.modalHeader}>
                                    <div className={styles.modalTitleWrap}>
                                        <h3 className={styles.modalTitle}>
                                            신고 상세 #{detail.id}
                                        </h3>
                                        <div className={styles.modalMeta}>
                                            <span className={`${styles.typeTag} ${(TYPE_MAP[detail.type] || TYPE_MAP.USER).style}`}>
                                                <i className={(TYPE_MAP[detail.type] || TYPE_MAP.USER).icon}></i>
                                                {(TYPE_MAP[detail.type] || TYPE_MAP.USER).label} 신고
                                            </span>
                                            <span className={`${styles.badge} ${(STATUS_MAP[detail.status] || STATUS_MAP.PENDING).style}`}>
                                                {(STATUS_MAP[detail.status] || STATUS_MAP.PENDING).label}
                                            </span>
                                            <span>
                                                <i className="bx bx-time-five"></i>
                                                {fmtDate(detail.createdAt)}
                                            </span>
                                        </div>
                                    </div>
                                    <button className={styles.closeBtn} onClick={closeDetail}>
                                        <i className="bx bx-x"></i>
                                    </button>
                                </div>

                                <div className={styles.modalBody}>
                                    {/* 신고자 / 피신고자 정보 */}
                                    <div className={styles.infoCardRow}>
                                        <div className={styles.infoCard}>
                                            <div className={styles.infoCardLabel}>
                                                <i className="bx bx-user-voice"></i> 신고자
                                            </div>
                                            <div className={styles.infoCardValue}>
                                                {detail.reporterNickname || '-'}
                                            </div>
                                            <div className={styles.infoCardSub}>
                                                {detail.reporterEmail || ''}
                                            </div>
                                        </div>
                                        <div className={styles.infoCard}>
                                            <div className={styles.infoCardLabel}>
                                                <i className="bx bx-user-x"></i> 피신고자
                                            </div>
                                            <div className={styles.infoCardValue}>
                                                {detail.reportedNickname || '-'}
                                            </div>
                                            <div className={styles.infoCardSub}>
                                                {detail.reportedEmail || ''}
                                                {detail.reportedReportCount != null && (
                                                    <span style={{ marginLeft: 8, color: '#ef4444', fontWeight: 600 }}>
                                                        누적 신고 {detail.reportedReportCount}건
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* 신고 대상 (상품인 경우) */}
                                    {detail.type === 'PRODUCT' && detail.targetProduct && (
                                        <div className={styles.infoCardRow}>
                                            <div className={styles.infoCard} style={{ gridColumn: '1 / -1' }}>
                                                <div className={styles.infoCardLabel}>
                                                    <i className="bx bx-package"></i> 신고 대상 상품
                                                </div>
                                                <div className={styles.infoCardValue}>
                                                    {detail.targetProduct.title}
                                                </div>
                                                <div className={styles.infoCardSub}>
                                                    {detail.targetProduct.price != null
                                                        ? `${detail.targetProduct.price.toLocaleString()}원`
                                                        : ''}
                                                    {detail.targetProduct.productId && ` (ID: ${detail.targetProduct.productId})`}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* 신고 내용 */}
                                    <div className={styles.reportContentBox}>
                                        <div className={styles.reportContentLabel}>
                                            <i className="bx bx-flag"></i>
                                            신고 사유: {REASON_CATEGORIES[detail.reasonCategory] || detail.reasonCategory || '기타'}
                                        </div>
                                        <div className={styles.reportContentText}>
                                            {detail.reason || detail.content || '상세 사유가 없습니다.'}
                                        </div>
                                    </div>

                                    {/* 처리 이력 */}
                                    {detail.history && detail.history.length > 0 && (
                                        <div className={styles.historySection}>
                                            <div className={styles.historyTitle}>
                                                <i className="bx bx-history"></i>
                                                처리 이력
                                            </div>
                                            <div className={styles.historyList}>
                                                {detail.history.map((h, i) => (
                                                    <div key={i} className={styles.historyItem}>
                                                        <i className={
                                                            h.action === 'WARNED' ? 'bx bx-error' :
                                                            h.action === 'SUSPENDED' ? 'bx bx-user-x' :
                                                            h.action === 'DISMISSED' ? 'bx bx-x-circle' :
                                                            'bx bx-check-circle'
                                                        } style={{
                                                            color: h.action === 'WARNED' ? '#f97316' :
                                                                   h.action === 'SUSPENDED' ? '#ef4444' :
                                                                   h.action === 'DISMISSED' ? '#6b7280' :
                                                                   'var(--primary-color)'
                                                        }}></i>
                                                        <div className={styles.historyItemContent}>
                                                            <strong>{(STATUS_MAP[h.action] || {}).label || h.action}</strong>
                                                            {h.memo && ` - ${h.memo}`}
                                                            {h.adminNickname && (
                                                                <span style={{ opacity: 0.5 }}> ({h.adminNickname})</span>
                                                            )}
                                                        </div>
                                                        <span className={styles.historyItemDate}>{fmtDate(h.createdAt)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* 처리 폼 */}
                                    {actionMode && (
                                        <div className={styles.actionForm}>
                                            <div className={styles.actionFormTitle}>
                                                {actionMode === 'warn' && '경고 처리'}
                                                {actionMode === 'suspend' && '계정 정지 처리'}
                                                {actionMode === 'dismiss' && '신고 기각'}
                                            </div>

                                            {actionMode === 'suspend' && (
                                                <div className={styles.formGroup}>
                                                    <label className={styles.formLabel}>정지 기간</label>
                                                    <select
                                                        className={styles.formSelect}
                                                        value={suspendDays}
                                                        onChange={(e) => setSuspendDays(Number(e.target.value))}
                                                    >
                                                        {SUSPEND_DAYS_OPTIONS.map((opt) => (
                                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}

                                            <div className={styles.formGroup}>
                                                <label className={styles.formLabel}>처리 메모</label>
                                                <textarea
                                                    className={styles.formTextarea}
                                                    placeholder="처리 사유를 입력하세요..."
                                                    value={actionMemo}
                                                    onChange={(e) => setActionMemo(e.target.value)}
                                                />
                                            </div>

                                            <div className={styles.modalActions}>
                                                <button className={styles.btnSecondary} onClick={() => setActionMode(null)}>
                                                    취소
                                                </button>
                                                {actionMode === 'warn' && (
                                                    <button className={styles.btnWarning} onClick={executeAction} disabled={isActioning}>
                                                        {isActioning
                                                            ? <><i className="bx bx-loader-alt bx-spin"></i> 처리 중</>
                                                            : <><i className="bx bx-error"></i> 경고 처리</>
                                                        }
                                                    </button>
                                                )}
                                                {actionMode === 'suspend' && (
                                                    <button className={styles.btnDanger} onClick={executeAction} disabled={isActioning}>
                                                        {isActioning
                                                            ? <><i className="bx bx-loader-alt bx-spin"></i> 처리 중</>
                                                            : <><i className="bx bx-user-x"></i> 정지 처리</>
                                                        }
                                                    </button>
                                                )}
                                                {actionMode === 'dismiss' && (
                                                    <button className={styles.btnSecondary} onClick={executeAction} disabled={isActioning} style={{ fontWeight: 600 }}>
                                                        {isActioning
                                                            ? <><i className="bx bx-loader-alt bx-spin"></i> 처리 중</>
                                                            : <><i className="bx bx-x-circle"></i> 기각 확인</>
                                                        }
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* 하단 액션 (미처리 상태일 때만) */}
                                    {!actionMode && (
                                        <div className={styles.modalActions}>
                                            {detail.type === 'PRODUCT' && detail.targetProduct && (
                                                <button className={styles.btnDanger} onClick={handleDeleteContent}>
                                                    <i className="bx bx-trash"></i> 콘텐츠 삭제
                                                </button>
                                            )}

                                            <div style={{ flex: 1 }}></div>

                                            {detail.status === 'PENDING' && (
                                                <>
                                                    <button className={styles.btnOutline} onClick={() => setActionMode('dismiss')}>
                                                        <i className="bx bx-x-circle"></i> 기각
                                                    </button>
                                                    <button className={styles.btnWarning} onClick={() => setActionMode('warn')}>
                                                        <i className="bx bx-error"></i> 경고
                                                    </button>
                                                    <button className={styles.btnDanger} onClick={() => setActionMode('suspend')}>
                                                        <i className="bx bx-user-x"></i> 계정 정지
                                                    </button>
                                                </>
                                            )}

                                            <button className={styles.btnSecondary} onClick={closeDetail}>닫기</button>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

/* === 서브 컴포넌트 === */

function SummaryCard({ icon, iconBg, iconColor, label, value, active, onClick }) {
    return (
        <div className={`${styles.summaryCard} ${active ? styles.summaryCardActive : ''}`} onClick={onClick}>
            <div className={styles.summaryIcon} style={{ background: iconBg, color: iconColor }}>
                <i className={icon}></i>
            </div>
            <div className={styles.summaryInfo}>
                <span className={styles.summaryLabel}>{label}</span>
                <span className={styles.summaryValue}>{(value || 0).toLocaleString()}</span>
            </div>
        </div>
    );
}

function Pagination({ page, totalPages, setPage }) {
    return (
        <div className={styles.pagination}>
            <button className={styles.pageBtn} disabled={page <= 1} onClick={() => setPage(1)}>
                <i className="bx bx-chevrons-left"></i>
            </button>
            <button className={styles.pageBtn} disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                이전
            </button>
            <span className={styles.pageInfo}>{page} / {totalPages}</span>
            <button className={styles.pageBtn} disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                다음
            </button>
            <button className={styles.pageBtn} disabled={page >= totalPages} onClick={() => setPage(totalPages)}>
                <i className="bx bx-chevrons-right"></i>
            </button>
        </div>
    );
}

export default AdminReports;
