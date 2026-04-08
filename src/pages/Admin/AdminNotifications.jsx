import styles from './AdminContent.module.css';

function AdminNotifications() {
    return (
        <div className={styles.container}>
            <h2 className={styles.title}>알림</h2>
            <div className={styles.placeholder}>
                <i className="bx bx-bell"></i>
                <p>시스템 알림 및 공지사항 알림이 표시될 예정입니다.</p>
            </div>
        </div>
    );
}

export default AdminNotifications;
