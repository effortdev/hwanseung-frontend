import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import styles from './Sidebar.module.css';

function AdminLayout() {
    return (
        <>
            <Sidebar />
            <section className={styles.home}>
                <Outlet />
            </section>
        </>
    );
}

export default AdminLayout;
