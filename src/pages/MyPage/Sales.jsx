import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// 🌟 추가: 마이페이지 레이아웃용 CSS와 컴포넌트를 불러옵니다.
import '../MyPage.css'; // (경로가 다르면 파일 위치에 맞게 수정해주세요)
import './my-sales.css'; 
import MyPageSidebar from './MyPageSidebar'; // 사이드바 컴포넌트 임포트
import { useUser } from '../../UserContext'; // 유저 정보 가져오기

export default function Sales() {
    const { userInfo } = useUser(); // 사이드바에 넘겨줄 내 정보
    const navigate = useNavigate();
    
    const [myProducts, setMyProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMySales = async () => {
            const token = sessionStorage.getItem("accessToken");
            
            if (!token) {
                //로그인(토큰이 있는) 상태가 아니면 내보내기 
                alert("로그인이 필요한 서비스입니다.");
                navigate('/login');
                return;
            }

            try {
                const response = await axios.get('/api/products/my-sales', {
                    //controller에서 확인 (my-sales메소드 실행)
                    headers: { Authorization: `Bearer ${token}` }
                });

                    // const activeProducts = response.data.filter(product => product.saleStatus === 'SALE');
                    //  setMyProducts(activeProducts);

                setMyProducts(response.data);
                //response에 담겨온 데이터로 myProducts배열 채우기 
            } catch (error) {
                console.error("판매 내역을 불러오지 못했습니다.", error);
            } finally {
                setLoading(false);
            }
        };

        fetchMySales();
    }, [navigate]);

    return (
        /* 🌟 껍데기(mypage-body, web-sidebar-layout, MyPageSidebar)를 모두 제거하고, 
           오른쪽 하얀색 메인 화면(main-viewport)부터 시작합니다! */
        <div className="main-viewport">
            <div className="content-view">
                
                <h2 className="sales-title">
                    <i className="fas fa-box-open"></i> 내 판매 내역
                </h2>

                {/* 로딩 중 */}
                {loading && <p style={{ textAlign: 'center', padding: '50px' }}>데이터를 불러오는 중입니다...</p>}

                {/* 상품이 없을 때 */}
                {!loading && myProducts.length === 0 && (
                    <div className="sales-empty-state">
                        <i className="fas fa-ghost"></i>
                        <p>아직 판매 등록한 상품이 없습니다.</p>
                        <button className="sales-first-btn" onClick={() => navigate('/products/create')}>
                            첫 상품 판매하기
                        </button>
                    </div>
                )}

                {/* 상품 목록 리스트 */}
                {!loading && myProducts.length > 0 && (
                    <div className="sales-list-container">
                        {myProducts.map((product) => (
                            <div 
                                key={product.productId} 
                                className="sales-list-item"
                                onClick={() => navigate(`/products/${product.productId}`)}
                            >
                                <div className="sales-item-thumb">
                                    {product.thumbnailUrl ? (
                                        <img src={product.thumbnailUrl} alt="상품 썸네일" />
                                    ) : (
                                        <span>No Image</span>
                                    )}
                                </div>

                                <div className="sales-item-info">
                                    <div className="sales-item-category">{product.category}</div>
                                    <div className="sales-item-title">{product.title}</div>
                                    <div className="sales-item-price">{product.price.toLocaleString()}원</div>
                                </div>

                                <div>
                                    <span className={`sales-status-badge ${product.saleStatus === 'SOLD_OUT' ? 'sold-out' : 'selling'}`}>
                                        {product.saleStatus === 'SOLD_OUT' ? '판매완료' : '판매중'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

            </div>
        </div>
    );
}