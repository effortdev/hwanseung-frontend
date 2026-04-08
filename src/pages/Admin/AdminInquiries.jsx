import { useEffect, useState, useCallback } from 'react';
import styles from './AdminInquiries.module.css';
import {
    fetchInquiries,
    fetchInquiryDetail,
    submitAnswer,
    updateAnswer,
    updateInquiryStatus,
    deleteInquiry,
} from '../../api/InquiriesAPI';

// 상태 뱃지 매핑
const STATUS_MAP = {
    WAITING: { label: '대기중', style: styles.badgeWaiting },
    ANSWERED: { label: '답변완료', style: styles.badgeAnswered },
    CLOSED: { label: '종료', style: styles.badgeClosed },
};

// 카테고리 라벨 매핑
const CATEGORY_MAP = {
    GENERAL: '일반 문의',
    TRANSACTION: '거래 문의',
    ACCOUNT: '계정 문의',
    REPORT: '신고 문의',
    BUG: '오류 신고',
    ETC: '기타',
};

// 날짜 포맷
const fmtDate = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

function AdminInquiries() {
    // 목록 상태
    const [inquiries, setInquiries] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalElements, setTotalElements] = useState(0);

    // 필터/검색
    const [searchInput, setSearchInput] = useState('');
    const [searchKeyword, setSearchKeyword] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterCategory, setFilterCategory] = useState('');

    // 요약 카운트
    const [summary, setSummary] = useState({ total: 0, waiting: 0, answered: 0, closed: 0 });

    // 상세 모달
    const [selectedInquiry, setSelectedInquiry] = useState(null);
    const [isDetailLoading, setIsDetailLoading] = useState(false);
    const [detailError, setDetailError] = useState(null);

    // 답변 작성
    const [answerContent, setAnswerContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [isEditingAnswer, setIsEditingAnswer] = useState(false);

    // 목록 조회
    const loadInquiries = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await fetchInquiries({
                page: page - 1,
                size: 10,
                keyword: searchKeyword,
                status: filterStatus,
                category: filterCategory,
            });

            setInquiries(data.content || []);
            setTotalPages(data.totalPages || 1);
            setTotalElements(data.totalElements || 0);

            // 요약 카운트 (API에서 제공하거나 별도 계산)
            if (data.summary) {
                setSummary(data.summary);
            }
        } catch (err) {
            console.error('문의 목록 로드 실패:', err);
            setError('문의 목록을 불러오는 데 실패했습니다.');
        } finally {
            setIsLoading(false);
        }
    }, [page, searchKeyword, filterStatus, filterCategory]);

    useEffect(() => {
        loadInquiries();
    }, [loadInquiries]);

    // 검색 실행
    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1);
        setSearchKeyword(searchInput);
    };

    // 상태 필터 클릭 (요약 카드)
    const handleStatusFilter = (status) => {
        setPage(1);
        setFilterStatus(prev => prev === status ? '' : status);
    };

    // 상세 조회
    const openDetail = async (inquiryId) => {
        setSelectedInquiry(null);
        setDetailError(null);
        setIsDetailLoading(true);
        setAnswerContent('');
        setSubmitSuccess(false);
        setIsEditingAnswer(false);

        try {
            const data = await fetchInquiryDetail(inquiryId);
            setSelectedInquiry(data);
            // 기존 답변이 있으면 수정 모드 대비
        } catch (err) {
            console.error('문의 상세 로드 실패:', err);
            setDetailError('문의 상세 정보를 불러올 수 없습니다.');
        } finally {
            setIsDetailLoading(false);
        }
    };

    const closeDetail = () => {
        setSelectedInquiry(null);
        setDetailError(null);
        setIsDetailLoading(false);
    };

    // 답변 등록/수정
    const handleSubmitAnswer = async () => {
        if (!answerContent.trim()) return;
        setIsSubmitting(true);
        setSubmitSuccess(false);

        try {
            const inquiry = selectedInquiry;

            if (isEditingAnswer && inquiry.answer?.id) {
                // 답변 수정
                await updateAnswer(inquiry.id, inquiry.answer.id, answerContent);
            } else {
                // 새 답변 등록
                await submitAnswer(inquiry.id, answerContent);
            }

            // 상세 데이터 새로고침
            const updated = await fetchInquiryDetail(inquiry.id);
            setSelectedInquiry(updated);
            setSubmitSuccess(true);
            setIsEditingAnswer(false);
            setAnswerContent('');

            // 목록도 갱신 (상태 변경 반영)
            loadInquiries();

            // 성공 메시지 3초 후 자동 제거
            setTimeout(() => setSubmitSuccess(false), 3000);
        } catch (err) {
            console.error('답변 처리 실패:', err);
            alert('답변 처리 중 오류가 발생했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // 답변 수정 모드 전환
    const startEditAnswer = () => {
        setIsEditingAnswer(true);
        setAnswerContent(selectedInquiry.answer?.content || '');
    };

    // 문의 종료 처리
    const handleCloseInquiry = async () => {
        if (!window.confirm('이 문의를 종료 처리하시겠습니까?')) return;
        try {
            await updateInquiryStatus(selectedInquiry.id, 'CLOSED');
            const updated = await fetchInquiryDetail(selectedInquiry.id);
            setSelectedInquiry(updated);
            loadInquiries();
        } catch (err) {
            console.error('상태 변경 실패:', err);
            alert('상태 변경 중 오류가 발생했습니다.');
        }
    };

    // 문의 삭제
    const handleDelete = async () => {
        if (!window.confirm('이 문의를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;
        try {
            await deleteInquiry(selectedInquiry.id);
            closeDetail();
            loadInquiries();
        } catch (err) {
            console.error('삭제 실패:', err);
            alert('삭제 중 오류가 발생했습니다.');
        }
    };

    // ESC 키로 모달 닫기
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') closeDetail();
        };
        if (selectedInquiry || isDetailLoading) {
            window.addEventListener('keydown', handleKeyDown);
            return () => window.removeEventListener('keydown', handleKeyDown);
        }
    }, [selectedInquiry, isDetailLoading]);

    return (
        <div className={styles.container}>
            {/* 헤더 */}
            <div className={styles.pageHeader}>
                <h2 className={styles.pageTitle}>문의 내역</h2>
                <div className={styles.headerRight}>
                    <i className="bx bx-data"></i>
                    총 {totalElements.toLocaleString()}건
                </div>
            </div>

            {/* 요약 카드 */}
            <div className={styles.summaryGrid}>
                <div
                    className={`${styles.summaryCard} ${filterStatus === '' ? styles.summaryCardActive : ''}`}
                    onClick={() => handleStatusFilter('')}
                >
                    <div className={styles.summaryIcon} style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6' }}>
                        <i className="bx bx-conversation"></i>
                    </div>
                    <div className={styles.summaryInfo}>
                        <span className={styles.summaryLabel}>전체 문의</span>
                        <span className={styles.summaryValue}>{summary.total.toLocaleString()}</span>
                    </div>
                </div>
                <div
                    className={`${styles.summaryCard} ${filterStatus === 'WAITING' ? styles.summaryCardActive : ''}`}
                    onClick={() => handleStatusFilter('WAITING')}
                >
                    <div className={styles.summaryIcon} style={{ background: 'rgba(234, 179, 8, 0.12)', color: '#eab308' }}>
                        <i className="bx bx-time-five"></i>
                    </div>
                    <div className={styles.summaryInfo}>
                        <span className={styles.summaryLabel}>대기중</span>
                        <span className={styles.summaryValue}>{summary.waiting.toLocaleString()}</span>
                    </div>
                </div>
                <div
                    className={`${styles.summaryCard} ${filterStatus === 'ANSWERED' ? styles.summaryCardActive : ''}`}
                    onClick={() => handleStatusFilter('ANSWERED')}
                >
                    <div className={styles.summaryIcon} style={{ background: 'rgba(0, 214, 143, 0.12)', color: '#00d68f' }}>
                        <i className="bx bx-check-circle"></i>
                    </div>
                    <div className={styles.summaryInfo}>
                        <span className={styles.summaryLabel}>답변완료</span>
                        <span className={styles.summaryValue}>{summary.answered.toLocaleString()}</span>
                    </div>
                </div>
                <div
                    className={`${styles.summaryCard} ${filterStatus === 'CLOSED' ? styles.summaryCardActive : ''}`}
                    onClick={() => handleStatusFilter('CLOSED')}
                >
                    <div className={styles.summaryIcon} style={{ background: 'rgba(107, 114, 128, 0.12)', color: '#6b7280' }}>
                        <i className="bx bx-lock"></i>
                    </div>
                    <div className={styles.summaryInfo}>
                        <span className={styles.summaryLabel}>종료</span>
                        <span className={styles.summaryValue}>{summary.closed.toLocaleString()}</span>
                    </div>
                </div>
            </div>

            {/* 필터 & 검색 바 */}
            <div className={styles.toolbar}>
                <form className={styles.searchForm} onSubmit={handleSearch}>
                    <div className={styles.searchInputWrap}>
                        <i className="bx bx-search"></i>
                        <input
                            type="text"
                            className={styles.searchInput}
                            placeholder="제목, 작성자, 내용으로 검색"
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
            </div>

            {/* 에러 메시지 */}
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
                            <th style={{ width: 60 }}>번호</th>
                            <th style={{ width: 100 }}>카테고리</th>
                            <th>제목</th>
                            <th style={{ width: 110 }}>작성자</th>
                            <th style={{ width: 90 }}>상태</th>
                            <th style={{ width: 150 }}>등록일</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr>
                                <td colSpan="6" className={styles.loadingRow}>
                                    <i className="bx bx-loader-alt bx-spin"></i>
                                    문의 목록을 불러오는 중...
                                </td>
                            </tr>
                        ) : inquiries.length === 0 ? (
                            <tr>
                                <td colSpan="6" className={styles.emptyRow}>
                                    <i className="bx bx-inbox"></i>
                                    {searchKeyword || filterStatus || filterCategory
                                        ? '검색 결과가 없습니다.'
                                        : '등록된 문의가 없습니다.'
                                    }
                                </td>
                            </tr>
                        ) : (
                            inquiries.map((inq) => {
                                const statusInfo = STATUS_MAP[inq.status] || STATUS_MAP.WAITING;
                                return (
                                    <tr key={inq.id} onClick={() => openDetail(inq.id)}>
                                        <td>{inq.id}</td>
                                        <td>
                                            <span className={styles.categoryTag}>
                                                {CATEGORY_MAP[inq.category] || inq.category || '일반'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={styles.ellipsis}>{inq.title}</span>
                                        </td>
                                        <td>{inq.authorNickname || inq.authorEmail || '-'}</td>
                                        <td>
                                            <span className={`${styles.badge} ${statusInfo.style}`}>
                                                {statusInfo.label}
                                            </span>
                                        </td>
                                        <td>{fmtDate(inq.createdAt)}</td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* 페이지네이션 */}
            {!isLoading && inquiries.length > 0 && (
                <div className={styles.pagination}>
                    <button
                        className={styles.pageBtn}
                        disabled={page <= 1}
                        onClick={() => setPage(1)}
                    >
                        <i className="bx bx-chevrons-left"></i>
                    </button>
                    <button
                        className={styles.pageBtn}
                        disabled={page <= 1}
                        onClick={() => setPage(p => p - 1)}
                    >
                        이전
                    </button>
                    <span className={styles.pageInfo}>
                        {page} / {totalPages}
                    </span>
                    <button
                        className={styles.pageBtn}
                        disabled={page >= totalPages}
                        onClick={() => setPage(p => p + 1)}
                    >
                        다음
                    </button>
                    <button
                        className={styles.pageBtn}
                        disabled={page >= totalPages}
                        onClick={() => setPage(totalPages)}
                    >
                        <i className="bx bx-chevrons-right"></i>
                    </button>
                </div>
            )}

            {/* ====== 상세 모달 ====== */}
            {(selectedInquiry || isDetailLoading || detailError) && (
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
                        ) : selectedInquiry && (
                            <>
                                {/* 모달 헤더 */}
                                <div className={styles.modalHeader}>
                                    <div className={styles.modalTitleWrap}>
                                        <h3 className={styles.modalTitle}>{selectedInquiry.title}</h3>
                                        <div className={styles.modalMeta}>
                                            <span>
                                                <i className="bx bx-user"></i>
                                                {selectedInquiry.authorNickname || selectedInquiry.authorEmail || '-'}
                                            </span>
                                            <span>
                                                <i className="bx bx-time-five"></i>
                                                {fmtDate(selectedInquiry.createdAt)}
                                            </span>
                                            <span className={styles.categoryTag}>
                                                {CATEGORY_MAP[selectedInquiry.category] || selectedInquiry.category || '일반'}
                                            </span>
                                            <span className={`${styles.badge} ${(STATUS_MAP[selectedInquiry.status] || STATUS_MAP.WAITING).style}`}>
                                                {(STATUS_MAP[selectedInquiry.status] || STATUS_MAP.WAITING).label}
                                            </span>
                                        </div>
                                    </div>
                                    <button className={styles.closeBtn} onClick={closeDetail}>
                                        <i className="bx bx-x"></i>
                                    </button>
                                </div>

                                {/* 모달 바디 */}
                                <div className={styles.modalBody}>
                                    {/* 문의 내용 */}
                                    <div className={styles.inquiryContent}>
                                        {selectedInquiry.content}
                                    </div>

                                    {/* 성공 메시지 */}
                                    {submitSuccess && (
                                        <div className={styles.successMsg}>
                                            <i className="bx bx-check-circle"></i>
                                            답변이 성공적으로 {isEditingAnswer ? '수정' : '등록'}되었습니다.
                                        </div>
                                    )}

                                    {/* 답변 섹션 */}
                                    <div className={styles.answerSection}>
                                        <div className={styles.answerTitle}>
                                            <i className="bx bx-message-detail"></i>
                                            관리자 답변
                                        </div>

                                        {/* 기존 답변이 있고 수정 모드가 아닐 때 */}
                                        {selectedInquiry.answer && !isEditingAnswer ? (
                                            <>
                                                <div className={styles.existingAnswer}>
                                                    <div className={styles.existingAnswerMeta}>
                                                        <span>
                                                            <i className="bx bx-user-circle"></i> {selectedInquiry.answer.adminNickname || '관리자'}
                                                            &nbsp;· {fmtDate(selectedInquiry.answer.createdAt)}
                                                        </span>
                                                        {selectedInquiry.status !== 'CLOSED' && (
                                                            <button className={styles.btnEdit} onClick={startEditAnswer}>
                                                                <i className="bx bx-edit-alt"></i> 수정
                                                            </button>
                                                        )}
                                                    </div>
                                                    <div className={styles.existingAnswerContent}>
                                                        {selectedInquiry.answer.content}
                                                    </div>
                                                </div>
                                            </>
                                        ) : selectedInquiry.status !== 'CLOSED' ? (
                                            /* 답변 작성/수정 폼 */
                                            <>
                                                <textarea
                                                    className={styles.answerTextarea}
                                                    placeholder="답변 내용을 입력하세요..."
                                                    value={answerContent}
                                                    onChange={(e) => setAnswerContent(e.target.value)}
                                                />
                                            </>
                                        ) : (
                                            <div style={{ color: 'var(--text-color)', opacity: 0.45, fontSize: 14, padding: '10px 0' }}>
                                                종료된 문의에는 답변을 등록할 수 없습니다.
                                            </div>
                                        )}
                                    </div>

                                    {/* 하단 액션 버튼 */}
                                    <div className={styles.modalActions}>
                                        <button className={styles.btnDanger} onClick={handleDelete}>
                                            <i className="bx bx-trash"></i> 삭제
                                        </button>

                                        <div style={{ flex: 1 }}></div>

                                        {selectedInquiry.status !== 'CLOSED' && selectedInquiry.answer && !isEditingAnswer && (
                                            <button className={styles.btnSecondary} onClick={handleCloseInquiry}>
                                                <i className="bx bx-lock" style={{ marginRight: 4 }}></i>
                                                문의 종료
                                            </button>
                                        )}

                                        {isEditingAnswer && (
                                            <button
                                                className={styles.btnSecondary}
                                                onClick={() => { setIsEditingAnswer(false); setAnswerContent(''); }}
                                            >
                                                취소
                                            </button>
                                        )}

                                        {selectedInquiry.status !== 'CLOSED' && (!selectedInquiry.answer || isEditingAnswer) && (
                                            <button
                                                className={styles.btnPrimary}
                                                onClick={handleSubmitAnswer}
                                                disabled={isSubmitting || !answerContent.trim()}
                                            >
                                                {isSubmitting ? (
                                                    <><i className="bx bx-loader-alt bx-spin"></i> 처리 중...</>
                                                ) : (
                                                    <><i className="bx bx-send"></i> {isEditingAnswer ? '답변 수정' : '답변 등록'}</>
                                                )}
                                            </button>
                                        )}

                                        <button className={styles.btnSecondary} onClick={closeDetail}>닫기</button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminInquiries;
