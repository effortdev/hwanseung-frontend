import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './wishlist.css'; // 전용 CSS 임포트
import MyPageSidebar from './MyPageSidebar'; 
import { useUser } from '../../UserContext';

export default function Wishlist() {
    const { userInfo } = useUser();
    const navigate = useNavigate();
    const [wishProducts, setWishProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchWishlist = async () => {
            const token = sessionStorage.getItem("accessToken");
            if (!token) {
                alert("로그인이 필요합니다.");
                navigate('/login');
                return;
            }

            try {
                // 🚀 새로 만든 찜 목록 API 호출!
                const response = await axios.get('/api/products/wishlist', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setWishProducts(response.data);
            } catch (error) {
                console.error("찜 목록을 불러오지 못했습니다.", error);
            } finally {
                setLoading(false);
            }
        };
        fetchWishlist();
    }, [navigate]);

    return (
        <div className="main-viewport">
            <div className="content-view">
                <h2 className="wish-title">
                    <i className="fas fa-heart"></i> 관심 목록
                </h2>

                {loading && <p style={{ textAlign: 'center', padding: '50px' }}>목록을 불러오는 중...</p>}

                {!loading && wishProducts.length === 0 && (
                    <div className="wish-empty-state">
                        <i className="far fa-heart"></i>
                        <p>아직 관심 목록에 담은 상품이 없어요.</p>
                        <button className="wish-go-btn" onClick={() => navigate('/')}>
                            인기 매물 보러가기
                        </button>
                    </div>
                )}

                {!loading && wishProducts.length > 0 && (
                    <div className="wish-list-container">
                        {wishProducts.map((product) => (
                            <div key={product.productId} className="wish-list-item" onClick={() => navigate(`/products/${product.productId}`)}>
                                <div className="wish-item-thumb">
                                    {product.thumbnailUrl ? <img src={product.thumbnailUrl} alt="상품" /> : <span>No Image</span>}
                                </div>
                                <div className="wish-item-info">
                                    <div className="wish-item-category">{product.category}</div>
                                    <div className="wish-item-title">{product.title}</div>
                                    <div className="wish-item-price">{product.price.toLocaleString()}원</div>
                                </div>
                                <div className="wish-status">
                                    <span className={`wish-status-badge ${product.saleStatus === 'SOLD_OUT' ? 'sold-out' : 'selling'}`}>
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