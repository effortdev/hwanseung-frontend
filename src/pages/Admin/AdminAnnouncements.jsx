import styles from './AdminContent.module.css';

function AdminAnnouncements() {
    return (
        <div className={styles.container}>
            <h2 className={styles.title}>공지사항 관리</h2>
            <div className={styles.placeholder}>
                <i className="bx bx-news"></i>
                <p>공지사항 작성, 수정, 삭제 관리가 표시될 예정입니다.</p>
            </div>
        </div>
    );
}

export default AdminAnnouncements;
