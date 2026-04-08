import styles from './AdminContent.module.css';

function AdminTransactions() {
    return (
        <div className={styles.container}>
            <h2 className={styles.title}>거래 관리</h2>
            <div className={styles.placeholder}>
                <i className="bx bx-transfer"></i>
                <p>거래 현황, 분쟁 중재, 거래 내역이 표시될 예정입니다.</p>
            </div>
        </div>
    );
}

export default AdminTransactions;
