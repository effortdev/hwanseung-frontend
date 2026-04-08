import styles from './AdminContent.module.css';

function AdminChatManage() {
    return (
        <div className={styles.container}>
            <h2 className={styles.title}>채팅 관리</h2>
            <div className={styles.placeholder}>
                <i className="bx bx-message-dots"></i>
                <p>사용자 간 채팅 모니터링 및 부적절한 메시지 관리가 표시될 예정입니다.</p>
            </div>
        </div>
    );
}

export default AdminChatManage;
