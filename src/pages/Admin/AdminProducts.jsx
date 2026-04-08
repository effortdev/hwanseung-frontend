import { useEffect, useState, useCallback } from 'react';
import styles from './AdminProducts.module.css';
import {
    fetchAdminProducts,
    fetchAdminProductDetail,
    approveProduct,
    rejectProduct,
    hideProduct,
    unhideProduct,
    deleteAdminProduct,
    bulkApprove,
    bulkDelete,
} from '../../api/AdminProductsAPI';

// 카테고리 매핑
const CATEGORY_MAP = {
    digital: '디지털기기',
    fashion: '의류/잡화',
    furniture: '가구/인테리어',
    life: '생활/가전',
    hobby: '취미/도서',
    sports: '스포츠/레저',
    ticket: '티켓/교환권',
};

// 상태 매핑
const STATUS_MAP = {
    SALE: { label: '판매중', style: styles.badgeSale },
    SOLD_OUT: { label: '판매완료', style: styles.badgeSoldOut },
    PENDING: { label: '승인대기', style: styles.badgePending },
    REJECTED: { label: '반려', style: styles.badgeRejected },
    HIDDEN: { label: '숨김', style: styles.badgeHidden },
};

// 정렬 옵션
const SORT_OPTIONS = [
    { value: 'latest', label: '최신순' },
    { value: 'oldest', label: '오래된순' },
    { value: 'priceAsc', label: '가격 낮은순' },
    { value: 'priceDesc', label: '가격 높은순' },
    { value: 'reportDesc', label: '신고 많은순' },
];

// 날짜 포맷
const fmtDate = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

// 가격 포맷
const fmtPrice = (v) => (v != null ? `${v.toLocaleString()}원` : '-');

function AdminProducts() {
    // 목록 상태
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // 필터/검색/정렬
    const [searchInput, setSearchInput] = useState('');
    const [searchKeyword, setSearchKeyword] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [sortBy, setSortBy] = useState('latest');

    // 요약
    const [summary, setSummary] = useState({ total: 0, sale: 0, soldOut: 0, pending: 0, hidden: 0 });

    // 체크박스 (일괄 처리)
    const [selectedIds, setSelectedIds] = useState(new Set());

    // 상세 모달
    const [detail, setDetail] = useState(null);
    const [isDetailLoading, setIsDetailLoading] = useState(false);
    const [detailError, setDetailError] = useState(null);
    const [actionReason, setActionReason] = useState('');
    const [isActioning, setIsActioning] = useState(false);
    const [showReasonFor, setShowReasonFor] = useState(null); // 'reject' | 'hide'

    // 목록 조회
    const loadProducts = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await fetchAdminProducts({
                page: page - 1,
                size: 10,
                keyword: searchKeyword,
                status: filterStatus,
                category: filterCategory,
                sort: sortBy,
            });

            setProducts(data.content || []);
            setTotalPages(data.totalPages || 1);
            if (data.summary) setSummary(data.summary);
        } catch (err) {
            console.error('상품 목록 로드 실패:', err);
            setError('상품 목록을 불러오는 데 실패했습니다.');
        } finally {
            setIsLoading(false);
        }
    }, [page, searchKeyword, filterStatus, filterCategory, sortBy]);

    useEffect(() => {
        loadProducts();
    }, [loadProducts]);

    // 필터 변경 시 선택 초기화
    useEffect(() => {
        setSelectedIds(new Set());
    }, [page, searchKeyword, filterStatus, filterCategory, sortBy]);

    // 검색
    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1);
        setSearchKeyword(searchInput);
    };

    // 상태 필터 (요약 카드 클릭)
    const handleStatusFilter = (status) => {
        setPage(1);
        setFilterStatus(prev => prev === status ? '' : status);
    };

    // 체크박스
    const toggleSelect = (id) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === products.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(products.map(p => p.productId)));
        }
    };

    // 일괄 승인
    const handleBulkApprove = async () => {
        if (!window.confirm(`선택한 ${selectedIds.size}개 상품을 승인하시겠습니까?`)) return;
        try {
            await bulkApprove([...selectedIds]);
            setSelectedIds(new Set());
            loadProducts();
        } catch (err) {
            console.error('일괄 승인 실패:', err);
            alert('일괄 승인 중 오류가 발생했습니다.');
        }
    };

    // 일괄 삭제
    const handleBulkDelete = async () => {
        if (!window.confirm(`선택한 ${selectedIds.size}개 상품을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) return;
        try {
            await bulkDelete([...selectedIds]);
            setSelectedIds(new Set());
            loadProducts();
        } catch (err) {
            console.error('일괄 삭제 실패:', err);
            alert('일괄 삭제 오류가 발생했습니다.');
        }
    };

    // 상세 조회
    const openDetail = async (productId) => {
        setDetail(null);
        setDetailError(null);
        setIsDetailLoading(true);
        setActionReason('');
        setShowReasonFor(null);

        try {
            const data = await fetchAdminProductDetail(productId);
            setDetail(data);
        } catch (err) {
            console.error('상품 상세 로드 실패:', err);
            setDetailError('상품 상세 정보를 불러올 수 없습니다.');
        } finally {
            setIsDetailLoading(false);
        }
    };

    const closeDetail = () => {
        setDetail(null);
        setDetailError(null);
        setIsDetailLoading(false);
        setShowReasonFor(null);
    };

    // 개별 액션 (모달 내)
    const handleApprove = async () => {
        if (!detail) return;
        setIsActioning(true);
        try {
            await approveProduct(detail.productId);
            const updated = await fetchAdminProductDetail(detail.productId);
            setDetail(updated);
            loadProducts();
        } catch (err) {
            alert('승인 처리 중 오류가 발생했습니다.');
        } finally {
            setIsActioning(false);
        }
    };

    const handleReject = async () => {
        if (!detail || !actionReason.trim()) return;
        setIsActioning(true);
        try {
            await rejectProduct(detail.productId, actionReason);
            const updated = await fetchAdminProductDetail(detail.productId);
            setDetail(updated);
            setShowReasonFor(null);
            setActionReason('');
            loadProducts();
        } catch (err) {
            alert('반려 처리 중 오류가 발생했습니다.');
        } finally {
            setIsActioning(false);
        }
    };

    const handleHide = async () => {
        if (!detail || !actionReason.trim()) return;
        setIsActioning(true);
        try {
            await hideProduct(detail.productId, actionReason);
            const updated = await fetchAdminProductDetail(detail.productId);
            setDetail(updated);
            setShowReasonFor(null);
            setActionReason('');
            loadProducts();
        } catch (err) {
            alert('숨김 처리 중 오류가 발생했습니다.');
        } finally {
            setIsActioning(false);
        }
    };

    const handleUnhide = async () => {
        if (!detail) return;
        setIsActioning(true);
        try {
            await unhideProduct(detail.productId);
            const updated = await fetchAdminProductDetail(detail.productId);
            setDetail(updated);
            loadProducts();
        } catch (err) {
            alert('숨김 해제 중 오류가 발생했습니다.');
        } finally {
            setIsActioning(false);
        }
    };

    const handleDelete = async () => {
        if (!detail) return;
        if (!window.confirm('이 상품을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;
        setIsActioning(true);
        try {
            await deleteAdminProduct(detail.productId);
            closeDetail();
            loadProducts();
        } catch (err) {
            alert('삭제 중 오류가 발생했습니다.');
        } finally {
            setIsActioning(false);
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

    // 로딩
    if (isLoading && products.length === 0) {
        return (
            <div className={styles.container}>
                <div className={styles.loadingWrap}>
                    <i className="bx bx-loader-alt"></i>
                    <span>상품 목록을 불러오는 중...</span>
                </div>
            </div>
        );
    }

    const allChecked = products.length > 0 && selectedIds.size === products.length;

    return (
        <div className={styles.container}>
            {/* 헤더 */}
            <div className={styles.pageHeader}>
                <h2 className={styles.pageTitle}>상품 관리</h2>
            </div>

            {/* 요약 카드 */}
            <div className={styles.summaryGrid}>
                <SummaryCard
                    icon="bx bx-package" iconBg="rgba(59,130,246,0.12)" iconColor="#3b82f6"
                    label="전체 상품" value={summary.total}
                    active={filterStatus === ''} onClick={() => handleStatusFilter('')}
                />
                <SummaryCard
                    icon="bx bx-check-circle" iconBg="rgba(0,214,143,0.12)" iconColor="#00d68f"
                    label="판매중" value={summary.sale}
                    active={filterStatus === 'SALE'} onClick={() => handleStatusFilter('SALE')}
                />
                <SummaryCard
                    icon="bx bx-time-five" iconBg="rgba(234,179,8,0.12)" iconColor="#eab308"
                    label="승인대기" value={summary.pending}
                    active={filterStatus === 'PENDING'} onClick={() => handleStatusFilter('PENDING')}
                />
                <SummaryCard
                    icon="bx bx-check-double" iconBg="rgba(107,114,128,0.12)" iconColor="#6b7280"
                    label="판매완료" value={summary.soldOut}
                    active={filterStatus === 'SOLD_OUT'} onClick={() => handleStatusFilter('SOLD_OUT')}
                />
                <SummaryCard
                    icon="bx bx-hide" iconBg="rgba(139,92,246,0.12)" iconColor="#8b5cf6"
                    label="숨김/반려" value={summary.hidden}
                    active={filterStatus === 'HIDDEN'} onClick={() => handleStatusFilter('HIDDEN')}
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
                            placeholder="상품명, 판매자, 지역 검색"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                        />
                    </div>
                    <button type="submit" className={styles.searchBtn}>검색</button>
                </form>
                <div className={styles.selectWrap}>
                    <select
                        className={styles.filterSelect}
                        value={filterCategory}
                        onChange={(e) => { setFilterCategory(e.target.value); setPage(1); }}
                    >
                        <option value="">전체 카테고리</option>
                        {Object.entries(CATEGORY_MAP).map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                        ))}
                    </select>
                </div>
                <div className={styles.selectWrap}>
                    <select
                        className={styles.filterSelect}
                        value={sortBy}
                        onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
                    >
                        {SORT_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* 일괄 처리 바 */}
            {selectedIds.size > 0 && (
                <div className={styles.bulkBar}>
                    <span className={styles.bulkBarText}>
                        <strong>{selectedIds.size}</strong>개 상품 선택됨
                    </span>
                    <button className={`${styles.bulkBtn} ${styles.bulkBtnApprove}`} onClick={handleBulkApprove}>
                        <i className="bx bx-check"></i> 일괄 승인
                    </button>
                    <button className={`${styles.bulkBtn} ${styles.bulkBtnDelete}`} onClick={handleBulkDelete}>
                        <i className="bx bx-trash"></i> 일괄 삭제
                    </button>
                    <button className={`${styles.bulkBtn} ${styles.bulkBtnCancel}`} onClick={() => setSelectedIds(new Set())}>
                        선택 해제
                    </button>
                </div>
            )}

            {/* 에러 배너 */}
            {error && (
                <div className={styles.errorBanner}>
                    <i className="bx bx-error-circle"></i>
                    <span>{error}</span>
                </div>
            )}

            {/* 테이블 */}
            <div className={styles.tableWrap}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th style={{ width: 40 }}>
                                <input
                                    type="checkbox"
                                    className={styles.checkbox}
                                    checked={allChecked}
                                    onChange={toggleSelectAll}
                                />
                            </th>
                            <th style={{ width: 60 }}>ID</th>
                            <th>상품</th>
                            <th style={{ width: 100 }}>카테고리</th>
                            <th style={{ width: 110 }}>가격</th>
                            <th style={{ width: 100 }}>판매자</th>
                            <th style={{ width: 80 }}>상태</th>
                            <th style={{ width: 80 }}>신고</th>
                            <th style={{ width: 130 }}>등록일</th>
                            <th style={{ width: 90 }}>관리</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr>
                                <td colSpan="10" className={styles.loadingRow}>
                                    <i className="bx bx-loader-alt bx-spin"></i>
                                    불러오는 중...
                                </td>
                            </tr>
                        ) : products.length === 0 ? (
                            <tr>
                                <td colSpan="10" className={styles.emptyRow}>
                                    <i className="bx bx-package"></i>
                                    {searchKeyword || filterStatus || filterCategory
                                        ? '검색 결과가 없습니다.'
                                        : '등록된 상품이 없습니다.'}
                                </td>
                            </tr>
                        ) : (
                            products.map((p) => {
                                const statusInfo = STATUS_MAP[p.saleStatus] || STATUS_MAP[p.status] || STATUS_MAP.SALE;
                                const currentStatus = p.saleStatus || p.status;
                                return (
                                    <tr key={p.productId} style={{ opacity: currentStatus === 'HIDDEN' || currentStatus === 'REJECTED' ? 0.6 : 1 }}>
                                        <td>
                                            <input
                                                type="checkbox"
                                                className={styles.checkbox}
                                                checked={selectedIds.has(p.productId)}
                                                onChange={() => toggleSelect(p.productId)}
                                            />
                                        </td>
                                        <td style={{ fontSize: 12.5, opacity: 0.5 }}>{p.productId}</td>
                                        <td>
                                            <div className={styles.productCell} onClick={() => openDetail(p.productId)}>
                                                {p.thumbnailUrl ? (
                                                    <img src={p.thumbnailUrl} alt="" className={styles.productThumb} />
                                                ) : (
                                                    <div className={styles.productThumbEmpty}>
                                                        <i className="bx bx-image"></i>
                                                    </div>
                                                )}
                                                <div className={styles.productInfo}>
                                                    <span className={styles.productTitle}>{p.title}</span>
                                                    {p.location && (
                                                        <span className={styles.productLocation}>
                                                            <i className="bx bx-map"></i>{p.location}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={styles.categoryTag}>
                                                {CATEGORY_MAP[p.category] || p.category || '-'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={styles.price}>{fmtPrice(p.price)}</span>
                                        </td>
                                        <td style={{ fontSize: 13 }}>{p.sellerNickname || '-'}</td>
                                        <td>
                                            <span className={`${styles.badge} ${statusInfo.style}`}>
                                                {statusInfo.label}
                                            </span>
                                        </td>
                                        <td>
                                            {(p.reportCount || 0) > 0 ? (
                                                <span style={{ color: '#ef4444', fontWeight: 600, fontSize: 13 }}>
                                                    {p.reportCount}건
                                                </span>
                                            ) : (
                                                <span style={{ opacity: 0.35, fontSize: 13 }}>0건</span>
                                            )}
                                        </td>
                                        <td style={{ fontSize: 12.5, opacity: 0.6 }}>{fmtDate(p.createdAt)}</td>
                                        <td>
                                            <div className={styles.actionBtns}>
                                                <button
                                                    className={styles.actionBtn}
                                                    onClick={() => openDetail(p.productId)}
                                                    title="상세 보기"
                                                >
                                                    <i className="bx bx-show"></i>
                                                </button>
                                                <button
                                                    className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                                                    onClick={async () => {
                                                        if (!window.confirm(`"${p.title}" 상품을 삭제하시겠습니까?`)) return;
                                                        try {
                                                            await deleteAdminProduct(p.productId);
                                                            loadProducts();
                                                        } catch { alert('삭제 실패'); }
                                                    }}
                                                    title="삭제"
                                                >
                                                    <i className="bx bx-trash"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* 페이지네이션 */}
            {!isLoading && products.length > 0 && (
                <div className={styles.pagination}>
                    <button className={styles.pageBtn} disabled={page <= 1} onClick={() => setPage(1)}>
                        <i className="bx bx-chevrons-left"></i>
                    </button>
                    <button className={styles.pageBtn} disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                        이전
                    </button>
                    <span className={styles.pageInfo}>{page} / {totalPages}</span>
                    <button className={styles.pageBtn} disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                        다음
                    </button>
                    <button className={styles.pageBtn} disabled={page >= totalPages} onClick={() => setPage(totalPages)}>
                        <i className="bx bx-chevrons-right"></i>
                    </button>
                </div>
            )}

            {/* ====== 상세 모달 ====== */}
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
                                    <i className="bx bx-error-circle"></i><span>{detailError}</span>
                                </div>
                                <div className={styles.modalActions}>
                                    <button className={styles.btnSecondary} onClick={closeDetail}>닫기</button>
                                </div>
                            </div>
                        ) : detail && (
                            <DetailContent
                                detail={detail}
                                closeDetail={closeDetail}
                                showReasonFor={showReasonFor}
                                setShowReasonFor={setShowReasonFor}
                                actionReason={actionReason}
                                setActionReason={setActionReason}
                                isActioning={isActioning}
                                onApprove={handleApprove}
                                onReject={handleReject}
                                onHide={handleHide}
                                onUnhide={handleUnhide}
                                onDelete={handleDelete}
                            />
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

function DetailContent({
    detail, closeDetail, showReasonFor, setShowReasonFor,
    actionReason, setActionReason, isActioning,
    onApprove, onReject, onHide, onUnhide, onDelete,
}) {
    const currentStatus = detail.saleStatus || detail.status;
    const statusInfo = STATUS_MAP[currentStatus] || STATUS_MAP.SALE;
    const images = detail.productImages || [];
    const reports = detail.reports || [];

    return (
        <>
            {/* 헤더 */}
            <div className={styles.modalHeader}>
                <div className={styles.modalTitleWrap}>
                    <h3 className={styles.modalTitle}>{detail.title}</h3>
                    <div className={styles.modalMeta}>
                        <span><i className="bx bx-hash"></i>ID: {detail.productId}</span>
                        <span><i className="bx bx-user"></i>{detail.sellerNickname || detail.sellerId || '-'}</span>
                        <span><i className="bx bx-time-five"></i>{fmtDate(detail.createdAt)}</span>
                        <span className={`${styles.badge} ${statusInfo.style}`}>{statusInfo.label}</span>
                    </div>
                </div>
                <button className={styles.closeBtn} onClick={closeDetail}>
                    <i className="bx bx-x"></i>
                </button>
            </div>

            <div className={styles.modalBody}>
                {/* 이미지 갤러리 */}
                <div className={styles.imageGallery}>
                    {images.length > 0 ? images.map((img, i) => (
                        <img
                            key={img.productImageId || i}
                            src={img.imagePath}
                            alt={`상품 이미지 ${i + 1}`}
                            className={styles.galleryImg}
                        />
                    )) : detail.thumbnailUrl ? (
                        <img src={detail.thumbnailUrl} alt="상품 썸네일" className={styles.galleryImg} />
                    ) : (
                        <div className={styles.noImage}>
                            <i className="bx bx-image"></i>
                            <span>이미지 없음</span>
                        </div>
                    )}
                </div>

                {/* 상세 정보 */}
                <div className={styles.detailGrid}>
                    <div className={styles.detailItem}>
                        <div className={styles.detailItemLabel}>카테고리</div>
                        <div className={styles.detailItemValue}>
                            {CATEGORY_MAP[detail.category] || detail.category || '-'}
                        </div>
                    </div>
                    <div className={styles.detailItem}>
                        <div className={styles.detailItemLabel}>가격</div>
                        <div className={styles.detailItemValue}>{fmtPrice(detail.price)}</div>
                    </div>
                    <div className={styles.detailItem}>
                        <div className={styles.detailItemLabel}>거래 지역</div>
                        <div className={styles.detailItemValue}>{detail.location || '-'}</div>
                    </div>
                    <div className={styles.detailItem}>
                        <div className={styles.detailItemLabel}>신고 건수</div>
                        <div className={styles.detailItemValue} style={{ color: (detail.reportCount || 0) > 0 ? '#ef4444' : 'inherit' }}>
                            {detail.reportCount || 0}건
                        </div>
                    </div>
                </div>

                {/* 상품 설명 */}
                <div className={styles.descriptionBox}>{detail.content || '설명 없음'}</div>

                {/* 반려/숨김 사유 (기존) */}
                {detail.rejectReason && (
                    <div className={styles.reportHistory}>
                        <div className={styles.reportHistoryTitle}>
                            <i className="bx bx-x-circle"></i> 반려 사유
                        </div>
                        <div className={styles.reportItem}>
                            <i className="bx bx-info-circle"></i>
                            <span>{detail.rejectReason}</span>
                        </div>
                    </div>
                )}

                {detail.hideReason && (
                    <div className={styles.reportHistory}>
                        <div className={styles.reportHistoryTitle}>
                            <i className="bx bx-hide"></i> 숨김 사유
                        </div>
                        <div className={styles.reportItem} style={{ background: 'rgba(139,92,246,0.06)', color: '#8b5cf6', borderColor: 'rgba(139,92,246,0.15)' }}>
                            <i className="bx bx-info-circle"></i>
                            <span>{detail.hideReason}</span>
                        </div>
                    </div>
                )}

                {/* 신고 이력 */}
                {reports.length > 0 && (
                    <div className={styles.reportHistory}>
                        <div className={styles.reportHistoryTitle}>
                            <i className="bx bx-flag"></i> 신고 이력 ({reports.length}건)
                        </div>
                        {reports.map((r, i) => (
                            <div key={i} className={styles.reportItem}>
                                <i className="bx bx-flag"></i>
                                <span>{r.reason || r.content}</span>
                                <span className={styles.reportItemDate}>{fmtDate(r.createdAt)}</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* 사유 입력 (반려/숨김) */}
                {showReasonFor && (
                    <div className={styles.reasonSection}>
                        <label className={styles.reasonLabel}>
                            {showReasonFor === 'reject' ? '반려 사유' : '숨김 사유'}
                        </label>
                        <textarea
                            className={styles.reasonTextarea}
                            placeholder={showReasonFor === 'reject' ? '반려 사유를 입력하세요...' : '숨김 처리 사유를 입력하세요...'}
                            value={actionReason}
                            onChange={(e) => setActionReason(e.target.value)}
                        />
                    </div>
                )}

                {/* 액션 버튼 */}
                <div className={styles.modalActions}>
                    {/* 삭제 (항상) */}
                    <button className={styles.btnDanger} onClick={onDelete} disabled={isActioning}>
                        <i className="bx bx-trash"></i> 삭제
                    </button>

                    <div style={{ flex: 1 }}></div>

                    {/* 승인대기 상태: 승인 + 반려 */}
                    {currentStatus === 'PENDING' && !showReasonFor && (
                        <>
                            <button
                                className={styles.btnWarning}
                                onClick={() => { setShowReasonFor('reject'); setActionReason(''); }}
                                disabled={isActioning}
                            >
                                <i className="bx bx-x-circle"></i> 반려
                            </button>
                            <button className={styles.btnPrimary} onClick={onApprove} disabled={isActioning}>
                                {isActioning ? <><i className="bx bx-loader-alt bx-spin"></i> 처리 중</> : <><i className="bx bx-check"></i> 승인</>}
                            </button>
                        </>
                    )}

                    {/* 판매중/판매완료: 숨김 처리 */}
                    {(currentStatus === 'SALE' || currentStatus === 'SOLD_OUT') && !showReasonFor && (
                        <button
                            className={styles.btnOutlinePurple}
                            onClick={() => { setShowReasonFor('hide'); setActionReason(''); }}
                            disabled={isActioning}
                        >
                            <i className="bx bx-hide"></i> 숨김 처리
                        </button>
                    )}

                    {/* 숨김 상태: 숨김 해제 */}
                    {currentStatus === 'HIDDEN' && !showReasonFor && (
                        <button className={styles.btnPrimary} onClick={onUnhide} disabled={isActioning}>
                            {isActioning ? <><i className="bx bx-loader-alt bx-spin"></i> 처리 중</> : <><i className="bx bx-show"></i> 숨김 해제</>}
                        </button>
                    )}

                    {/* 반려 상태: 재승인 */}
                    {currentStatus === 'REJECTED' && !showReasonFor && (
                        <button className={styles.btnPrimary} onClick={onApprove} disabled={isActioning}>
                            {isActioning ? <><i className="bx bx-loader-alt bx-spin"></i> 처리 중</> : <><i className="bx bx-check"></i> 재승인</>}
                        </button>
                    )}

                    {/* 사유 입력 모드 버튼 */}
                    {showReasonFor === 'reject' && (
                        <>
                            <button className={styles.btnSecondary} onClick={() => setShowReasonFor(null)}>취소</button>
                            <button
                                className={styles.btnWarning}
                                onClick={onReject}
                                disabled={isActioning || !actionReason.trim()}
                            >
                                {isActioning ? <><i className="bx bx-loader-alt bx-spin"></i> 처리 중</> : <><i className="bx bx-x-circle"></i> 반려 확인</>}
                            </button>
                        </>
                    )}

                    {showReasonFor === 'hide' && (
                        <>
                            <button className={styles.btnSecondary} onClick={() => setShowReasonFor(null)}>취소</button>
                            <button
                                className={styles.btnOutlinePurple}
                                onClick={onHide}
                                disabled={isActioning || !actionReason.trim()}
                                style={!actionReason.trim() ? { opacity: 0.5 } : {}}
                            >
                                {isActioning ? <><i className="bx bx-loader-alt bx-spin"></i> 처리 중</> : <><i className="bx bx-hide"></i> 숨김 확인</>}
                            </button>
                        </>
                    )}

                    <button className={styles.btnSecondary} onClick={closeDetail}>닫기</button>
                </div>
            </div>
        </>
    );
}

export default AdminProducts;
