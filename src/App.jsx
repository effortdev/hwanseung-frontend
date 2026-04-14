import { Routes, Route,useLocation } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import MainPage from './pages/MainPage';
import AuthPage from './pages/AuthPage.jsx';
import './index.css';
import MyPage from './pages/MyPage.jsx';

function App() {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login';
  return (
    // 전체 레이아웃을 flex로 잡아서 컨텐츠가 적어도 Footer가 항상 바닥에 붙어있게 만듭니다.
    <div className="app-wrapper" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      
      {!isAuthPage && <Header />}
      <main style={{ flexGrow: 1 }}>
        <Routes>
          <Route path="/" element={<MainPage />} />
          <Route path="/login" element={<AuthPage />} />
          <Route path={"/mypage"} element={<MyPage />} /> {/* 🌟 추가! */}
        </Routes>
      </main>

      {!isAuthPage && <Footer />}
      
    </div>
  );
}

export default App;