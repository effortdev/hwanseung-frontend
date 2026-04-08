import { useEffect, useState, useCallback } from 'react';
import styles from './AdminCategories.module.css';
import {
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    updateCategoryOrder,
    toggleCategoryActive,
} from '../../api/CategoriesAPI';

// 이모지 프리셋 (카테고리용)
const EMOJI_PRESETS = [
    '📱', '💻', '👕', '👗', '🛋️', '🪑', '🍳', '🏠',
    '📚', '🎨', '⚽', '🏃', '🎫', '🎟️', '🎮', '🎵',
    '🚗', '✈️', '🐶', '🌱', '💄', '⌚', '📷', '🔧',
    '🍔', '☕', '👶', '💼', '🎒', '💍', '🧸', '✨',
];

function AdminCategories() {
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // 모달 상태
    const [modalMode, setModalMode] = useState(null); // 'add' | 'edit' | 'delete'
    const [editTarget, setEditTarget] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // 폼
    const [form, setForm] = useState({ key: '', displayName: '', emoji: '📱', description: '' });
    const [formError, setFormError] = useState('');

    // 데이터 로드
    const loadCategories = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await fetchCategories();
            setCategories(Array.isArray(data) ? data : data.content || []);
        } catch (err) {
            console.error('카테고리 로드 실패:', err);
            setError('카테고리 목록을 불러오는 데 실패했습니다.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadCategories();
    }, [loadCategories]);

    // 모달 열기
    const openAddModal = () => {
        setModalMode('add');
        setEditTarget(null);
        setForm({ key: '', displayName: '', emoji: '📱', description: '' });
        setFormError('');
    };

    const openEditModal = (cat) => {
        setModalMode('edit');
        setEditTarget(cat);
        setForm({
            key: cat.key || cat.categoryKey || '',
            displayName: cat.displayName || cat.name || '',
            emoji: cat.emoji || cat.icon || '📱',
            description: cat.description || '',
        });
        setFormError('');
    };

    const openDeleteModal = (cat) => {
        setModalMode('delete');
        setEditTarget(cat);
    };

    const closeModal = () => {
        setModalMode(null);
        setEditTarget(null);
        setFormError('');
    };

    // 폼 입력 핸들러
    const handleFormChange = (field, value) => {
        setForm(prev => ({ ...prev, [field]: value }));
        setFormError('');
    };

    // 카테고리 키 자동 생성 (영문소문자만)
    const handleKeyInput = (value) => {
        const sanitized = value.toLowerCase().replace(/[^a-z0-9_]/g, '');
        handleFormChange('key', sanitized);
    };

    // 폼 검증
    const validateForm = () => {
        if (!form.key.trim()) return '카테고리 키를 입력하세요.';
        if (form.key.length < 2) return '카테고리 키는 2자 이상이어야 합니다.';
        if (!form.displayName.trim()) return '표시 이름을 입력하세요.';

        // 추가 모드에서 키 중복 검사
        if (modalMode === 'add') {
            const exists = categories.some(c => (c.key || c.categoryKey) === form.key);
            if (exists) return '이미 존재하는 카테고리 키입니다.';
        }
        return '';
    };

    // 저장 (추가/수정)
    const handleSave = async () => {
        const validationError = validateForm();
        if (validationError) {
            setFormError(validationError);
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                key: form.key,
                displayName: form.displayName,
                emoji: form.emoji,
                description: form.description,
            };

            if (modalMode === 'edit' && editTarget) {
                await updateCategory(editTarget.id, payload);
            } else {
                await createCategory(payload);
            }

            closeModal();
            loadCategories();
        } catch (err) {
            console.error('카테고리 저장 실패:', err);
            const msg = err.response?.data?.message || '저장 중 오류가 발생했습니다.';
            setFormError(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    // 삭제
    const handleDelete = async () => {
        if (!editTarget) return;
        setIsSubmitting(true);
        try {
            await deleteCategory(editTarget.id);
            closeModal();
            loadCategories();
        } catch (err) {
            console.error('카테고리 삭제 실패:', err);
            alert(err.response?.data?.message || '삭제 중 오류가 발생했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // 활성/비활성 토글
    const handleToggle = async (cat) => {
        try {
            await toggleCategoryActive(cat.id);
            // 로컬 상태 즉시 업데이트
            setCategories(prev =>
                prev.map(c => c.id === cat.id ? { ...c, active: !c.active } : c)
            );
        } catch (err) {
            console.error('상태 토글 실패:', err);
            alert('상태 변경 중 오류가 발생했습니다.');
        }
    };

    // 순서 이동
    const moveCategory = async (index, direction) => {
        const newList = [...categories];
        const targetIndex = index + direction;
        if (targetIndex < 0 || targetIndex >= newList.length) return;

        [newList[index], newList[targetIndex]] = [newList[targetIndex], newList[index]];
        setCategories(newList);

        try {
            await updateCategoryOrder(newList.map(c => c.id));
        } catch (err) {
            console.error('순서 변경 실패:', err);
            loadCategories(); // 실패 시 원래 순서 복원
        }
    };

    // ESC 키로 모달 닫기
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') closeModal();
        };
        if (modalMode) {
            window.addEventListener('keydown', handleKeyDown);
            return () => window.removeEventListener('keydown', handleKeyDown);
        }
    }, [modalMode]);

    // 요약 통계
    const activeCount = categories.filter(c => c.active !== false).length;
    const inactiveCount = categories.filter(c => c.active === false).length;
    const totalProducts = categories.reduce((sum, c) => sum + (c.productCount || 0), 0);

    // 로딩
    if (isLoading) {
        return (
            <div className={styles.container}>
                <div className={styles.loadingWrap}>
                    <i className="bx bx-loader-alt"></i>
                    <span>카테고리를 불러오는 중...</span>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {/* 헤더 */}
            <div className={styles.pageHeader}>
                <h2 className={styles.pageTitle}>카테고리 관리</h2>
                <button className={styles.addBtn} onClick={openAddModal}>
                    <i className="bx bx-plus"></i>
                    카테고리 추가
                </button>
            </div>

            {/* 에러 배너 */}
            {error && (
                <div className={styles.errorBanner}>
                    <i className="bx bx-error-circle"></i>
                    <span>{error}</span>
                </div>
            )}

            {/* 요약 바 */}
            <div className={styles.summaryBar}>
                <div className={styles.summaryItem}>
                    <i className="bx bx-category"></i>
                    전체 <strong>{categories.length}</strong>개
                </div>
                <div className={styles.summaryItem}>
                    <i className="bx bx-check-circle"></i>
                    활성 <strong>{activeCount}</strong>개
                </div>
                {inactiveCount > 0 && (
                    <div className={styles.summaryItem}>
                        <i className="bx bx-hide"></i>
                        비활성 <strong>{inactiveCount}</strong>개
                    </div>
                )}
                <div className={styles.summaryItem}>
                    <i className="bx bx-package"></i>
                    등록 상품 <strong>{totalProducts.toLocaleString()}</strong>개
                </div>
            </div>

            {/* 테이블 */}
            <div className={styles.tableWrap}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th style={{ width: 80 }}>순서</th>
                            <th>카테고리</th>
                            <th style={{ width: 200 }}>설명</th>
                            <th style={{ width: 100 }}>상품 수</th>
                            <th style={{ width: 110 }}>상태</th>
                            <th style={{ width: 100 }}>관리</th>
                        </tr>
                    </thead>
                    <tbody>
                        {categories.length === 0 ? (
                            <tr>
                                <td colSpan="6" className={styles.emptyRow}>
                                    <i className="bx bx-category"></i>
                                    등록된 카테고리가 없습니다.
                                </td>
                            </tr>
                        ) : (
                            categories.map((cat, index) => (
                                <tr key={cat.id} style={{ opacity: cat.active === false ? 0.5 : 1 }}>
                                    {/* 순서 */}
                                    <td>
                                        <div className={styles.orderHandle}>
                                            <div className={styles.orderBtns}>
                                                <button
                                                    className={styles.orderBtn}
                                                    disabled={index === 0}
                                                    onClick={() => moveCategory(index, -1)}
                                                    title="위로 이동"
                                                >
                                                    <i className="bx bx-chevron-up"></i>
                                                </button>
                                                <button
                                                    className={styles.orderBtn}
                                                    disabled={index === categories.length - 1}
                                                    onClick={() => moveCategory(index, 1)}
                                                    title="아래로 이동"
                                                >
                                                    <i className="bx bx-chevron-down"></i>
                                                </button>
                                            </div>
                                            <span className={styles.orderNum}>{index + 1}</span>
                                        </div>
                                    </td>

                                    {/* 카테고리 이름 */}
                                    <td>
                                        <div className={styles.categoryNameCell}>
                                            <div className={styles.categoryEmoji}>
                                                {cat.emoji || cat.icon || '📦'}
                                            </div>
                                            <div className={styles.categoryNames}>
                                                <span className={styles.categoryDisplayName}>
                                                    {cat.displayName || cat.name}
                                                </span>
                                                <span className={styles.categoryKey}>
                                                    {cat.key || cat.categoryKey}
                                                </span>
                                            </div>
                                        </div>
                                    </td>

                                    {/* 설명 */}
                                    <td style={{ fontSize: 13, opacity: 0.65 }}>
                                        {cat.description || '-'}
                                    </td>

                                    {/* 상품 수 */}
                                    <td>
                                        <span className={styles.countBadge}>
                                            <i className="bx bx-package"></i>
                                            {(cat.productCount || 0).toLocaleString()}
                                        </span>
                                    </td>

                                    {/* 활성 상태 */}
                                    <td>
                                        <div className={styles.toggleWrap}>
                                            <button
                                                className={`${styles.toggle} ${cat.active !== false ? styles.active : ''}`}
                                                onClick={() => handleToggle(cat)}
                                                title={cat.active !== false ? '비활성화' : '활성화'}
                                            >
                                                <div className={styles.toggleDot}></div>
                                            </button>
                                            <span className={styles.toggleLabel}>
                                                {cat.active !== false ? '활성' : '비활성'}
                                            </span>
                                        </div>
                                    </td>

                                    {/* 관리 */}
                                    <td>
                                        <div className={styles.actionBtns}>
                                            <button
                                                className={styles.actionBtn}
                                                onClick={() => openEditModal(cat)}
                                                title="수정"
                                            >
                                                <i className="bx bx-edit-alt"></i>
                                            </button>
                                            <button
                                                className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                                                onClick={() => openDeleteModal(cat)}
                                                title="삭제"
                                            >
                                                <i className="bx bx-trash"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* ====== 추가/수정 모달 ====== */}
            {(modalMode === 'add' || modalMode === 'edit') && (
                <div className={styles.modalOverlay} onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
                    <div className={styles.modal}>
                        <div className={styles.modalHeader}>
                            <h3 className={styles.modalTitle}>
                                <i className={modalMode === 'add' ? 'bx bx-plus-circle' : 'bx bx-edit'}></i>
                                {modalMode === 'add' ? '카테고리 추가' : '카테고리 수정'}
                            </h3>
                            <button className={styles.closeBtn} onClick={closeModal}>
                                <i className="bx bx-x"></i>
                            </button>
                        </div>

                        <div className={styles.modalBody}>
                            {/* 에러 메시지 */}
                            {formError && (
                                <div className={styles.errorBanner} style={{ marginBottom: 18 }}>
                                    <i className="bx bx-error-circle"></i>
                                    <span>{formError}</span>
                                </div>
                            )}

                            {/* 카테고리 키 */}
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>
                                    카테고리 키 <span className={styles.required}>*</span>
                                </label>
                                <input
                                    className={styles.formInput}
                                    type="text"
                                    placeholder="예: digital, fashion"
                                    value={form.key}
                                    onChange={(e) => handleKeyInput(e.target.value)}
                                    disabled={modalMode === 'edit'}
                                    style={modalMode === 'edit' ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                                />
                                <div className={styles.formHint}>
                                    영문 소문자, 숫자, 밑줄(_)만 사용 가능 · 등록 후 변경 불가
                                </div>
                            </div>

                            {/* 표시 이름 */}
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>
                                    표시 이름 <span className={styles.required}>*</span>
                                </label>
                                <input
                                    className={styles.formInput}
                                    type="text"
                                    placeholder="예: 디지털기기"
                                    value={form.displayName}
                                    onChange={(e) => handleFormChange('displayName', e.target.value)}
                                />
                            </div>

                            {/* 아이콘(이모지) 선택 */}
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>아이콘</label>
                                <div className={styles.emojiPickerGrid}>
                                    {EMOJI_PRESETS.map((emoji) => (
                                        <button
                                            key={emoji}
                                            type="button"
                                            className={`${styles.emojiOption} ${form.emoji === emoji ? styles.emojiOptionSelected : ''}`}
                                            onClick={() => handleFormChange('emoji', emoji)}
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* 설명 */}
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>설명</label>
                                <input
                                    className={styles.formInput}
                                    type="text"
                                    placeholder="이 카테고리에 대한 간단한 설명"
                                    value={form.description}
                                    onChange={(e) => handleFormChange('description', e.target.value)}
                                />
                            </div>

                            {/* 미리보기 */}
                            <div style={{
                                background: 'var(--body-color)',
                                borderRadius: 10,
                                padding: '14px 18px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12,
                                marginBottom: 4,
                            }}>
                                <div className={styles.categoryEmoji}>{form.emoji}</div>
                                <div className={styles.categoryNames}>
                                    <span className={styles.categoryDisplayName}>
                                        {form.displayName || '표시 이름'}
                                    </span>
                                    <span className={styles.categoryKey}>
                                        {form.key || 'category_key'}
                                    </span>
                                </div>
                            </div>

                            {/* 액션 */}
                            <div className={styles.modalActions}>
                                <button className={styles.btnSecondary} onClick={closeModal}>취소</button>
                                <button
                                    className={styles.btnPrimary}
                                    onClick={handleSave}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <><i className="bx bx-loader-alt bx-spin"></i> 처리 중...</>
                                    ) : (
                                        <><i className="bx bx-check"></i> {modalMode === 'add' ? '추가' : '저장'}</>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ====== 삭제 확인 모달 ====== */}
            {modalMode === 'delete' && editTarget && (
                <div className={styles.modalOverlay} onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
                    <div className={styles.modal}>
                        <div className={styles.modalHeader}>
                            <h3 className={styles.modalTitle} style={{ color: '#ef4444' }}>
                                <i className="bx bx-error-circle"></i>
                                카테고리 삭제
                            </h3>
                            <button className={styles.closeBtn} onClick={closeModal}>
                                <i className="bx bx-x"></i>
                            </button>
                        </div>

                        <div className={styles.modalBody}>
                            <div className={styles.deleteWarning}>
                                <i className="bx bx-error-triangle"></i>
                                <div>
                                    <strong>"{editTarget.displayName || editTarget.name}"</strong> 카테고리를 삭제하시겠습니까?
                                    {(editTarget.productCount || 0) > 0 && (
                                        <div style={{ marginTop: 6 }}>
                                            이 카테고리에 <strong>{editTarget.productCount}개</strong>의 상품이 등록되어 있습니다.
                                            삭제 시 해당 상품의 카테고리가 초기화됩니다.
                                        </div>
                                    )}
                                    <div style={{ marginTop: 6 }}>이 작업은 되돌릴 수 없습니다.</div>
                                </div>
                            </div>

                            <div className={styles.modalActions}>
                                <button className={styles.btnSecondary} onClick={closeModal}>취소</button>
                                <button
                                    className={styles.btnDanger}
                                    onClick={handleDelete}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <><i className="bx bx-loader-alt bx-spin"></i> 삭제 중...</>
                                    ) : (
                                        <><i className="bx bx-trash"></i> 삭제</>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminCategories;
