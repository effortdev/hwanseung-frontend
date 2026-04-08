import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import "./ProductDetailPage.css";
import { FiHeart } from "react-icons/fi";
import { FaHeart } from "react-icons/fa";
import { Client } from '@stomp/stompjs'; 
import SockJS from 'sockjs-client';

function formatPrice(price) {
    return Number(price || 0).toLocaleString();
}

const categoryMap = {
    digital: "디지털기기",
    fashion: "의류/잡화",
    furniture: "가구/인테리어",
    life: "생활/가전",
    hobby: "취미/도서",
    sports: "스포츠/레저",
    ticket: "티켓/교환권",
};

export default function ProductDetailPage() {
    const { productId } = useParams();
    const navigate = useNavigate();

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);

    // ✅ [추가] 찜 상태
    const [likeInfo, setLikeInfo] = useState({
        liked: false,
        likeCount: 0,
    });

    // 토큰에서 로그인한 사용자 정보 꺼내기
    function getUserInfoFromToken() {
        const token = sessionStorage.getItem("accessToken");
        if (!token) return null;

        try {
            const payload = JSON.parse(atob(token.split(".")[1]));

            return {
                userId: payload.sub,
                role: payload.role,
            };
        } catch (e) {
            console.error("토큰 파싱 실패", e);
            return null;
        }
    }

    const userInfo = getUserInfoFromToken();

    const loginUserId = userInfo?.userId;
    const loginUserRole = userInfo?.role;

    // 사용자 비교
    const isSeller = loginUserId && product?.sellerId === loginUserId;
    const isAdmin = loginUserRole === "ROLE_ADMIN";
    const canManageProduct = isSeller || isAdmin;

    // ✅ [추가] 찜 상태 조회
    const fetchLikeStatus = async () => {
        try {
            const token = sessionStorage.getItem("accessToken");

            const response = await fetch(`/api/products/${productId}/like`, {
                method: "GET",
                headers: token
                    ? {
                        Authorization: `Bearer ${token}`,
                    }
                    : {},
            });

            if (!response.ok) {
                throw new Error("찜 상태 조회 실패");
            }

            const data = await response.json();

            setLikeInfo({
                liked: data.liked,
                likeCount: data.likeCount,
            });
        } catch (err) {
            console.error("찜 상태 조회 실패:", err);
        }
    };

    // 상품 조회
    useEffect(() => {
        const fetchProductDetail = async () => {
            try {
                const response = await fetch(`/api/products/${productId}`);

                if (!response.ok) {
                    throw new Error("삭제되었거나 존재하지 않는 상품입니다.");
                }

                const data = await response.json();
                setProduct(data);

                // ✅ [추가] 상품 상세 조회 성공 후 찜 상태도 조회
                await fetchLikeStatus();
            } catch (error) {
                console.error("상품 상세 조회 실패:", error);

                alert("삭제되었거나 존재하지 않는 상품입니다.");
                navigate("/products", { replace: true });
            } finally {
                setLoading(false);
            }
        };

        fetchProductDetail();
    }, [productId, navigate]);

    const currentUser = sessionStorage.getItem("username");

    // 🚀 채팅방 생성 및 열기 함수
    const startChat = async () => {
        // 1. 내 물건에 내가 채팅 거는 것 방지!
        if (currentUser === product.sellerId) {
            alert("본인이 등록한 상품에는 채팅을 걸 수 없습니다.");
            return;
        }

        const currentToken = sessionStorage.getItem("accessToken");

        console.log("🔥 채팅할 때 쏘는 토큰:", currentToken);

        try {
            // 2. 백엔드에 중고거래 방 생성 (또는 기존 방 조회) 요청
            const res = await axios.post(
                "/api/chat/room/trade",
                {
                    itemId: product.productId,
                    sellerId: product.sellerId,
                },
                {
                    headers: { Authorization: `Bearer ${currentToken}` },
                }
            );

            const realRoomId = res.data.roomId;

            // ========================================================
            // 🚨 [추가] "채팅하기" 누르는 즉시 상대방에게 STOMP 알림 발사!
            // ========================================================
            const tempClient = new Client({
                webSocketFactory: () => new SockJS('http://localhost/ws-chat'),
                connectHeaders: { Authorization: `Bearer ${currentToken}` },
                onConnect: () => {
                    const messageData = { 
                        roomId: realRoomId, 
                        sender: currentUser, 
                        senderId: currentUser, 
                        content: `${currentUser}님이 [${product.title}] 상품에 대해 채팅을 시작했습니다!`, // 알림 내용
                        receiverId: product.sellerId 
                    };
                    
                    // 메시지를 쏘고!
                    tempClient.publish({ destination: '/pub/chat/message', body: JSON.stringify(messageData) });
                    
                    // 목적을 달성했으니 0.5초 뒤에 쿨하게 연결 끊기!
                    setTimeout(() => tempClient.deactivate(), 500); 
                }
            });
            tempClient.activate();
            // ========================================================

            // 3. 플로팅 채팅창(FloatingChat)에게 "방 열어!" 하고 이벤트 발송!
            window.dispatchEvent(
                new CustomEvent("openTradeChat", {
                    detail: {
                        roomId: realRoomId,
                        buyerId: currentUser,
                        sellerId: product.sellerId,
                        itemName: product.title,
                    },
                })
            );
        } catch (error) {
            console.error("채팅방 생성/입장 실패:", error);
            alert("채팅방을 여는 데 실패했습니다. 다시 시도해주세요.");
        }
    };

    // ✅ [추가] 찜 토글 함수
    const handleLikeToggle = async () => {
        const token = sessionStorage.getItem("accessToken");

        if (!token) {
            alert("로그인 후 이용 가능합니다.");
            navigate("/login");
            return;
        }

        try {
            const response = await fetch(`/api/products/${productId}/like`, {
                method: likeInfo.liked ? "DELETE" : "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const text = await response.text();
            let result = {};

            if (text) {
                result = JSON.parse(text);
            }

            if (!response.ok) {
                throw new Error(result.message || "찜 처리 실패");
            }

            setLikeInfo({
                liked: result.liked,
                likeCount: result.likeCount,
            });

            alert(result.message);
        } catch (err) {
            console.error("찜 처리 실패:", err);
            alert(err.message || "찜 처리 중 오류 발생");
        }
    };

    // 삭제 함수
    const handleDelete = async () => {
        const confirmed = window.confirm("정말 삭제하시겠습니까?");
        if (!confirmed) return;

        try {
            const token = sessionStorage.getItem("accessToken");

            const response = await fetch(`/api/products/${productId}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const text = await response.text();
            let result = {};

            if (text) {
                result = JSON.parse(text);
            }

            if (!response.ok) {
                throw new Error(result.message || "상품 삭제 실패");
            }

            alert("상품이 삭제되었습니다.");
            navigate("/products");
        } catch (err) {
            console.error("삭제 실패:", err);
            alert(err.message || "삭제 중 오류 발생");
        }
    };

    // 판매완료 함수
    const handleSoldOut = async () => {
        const confirmed = window.confirm("판매완료 처리하시겠습니까?");
        if (!confirmed) return;

        try {
            const token = sessionStorage.getItem("accessToken");

            const response = await fetch(`/api/products/${productId}/sold-out`, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const text = await response.text();
            let result = {};

            if (text) {
                result = JSON.parse(text);
            }

            if (!response.ok) {
                throw new Error(result.message || "판매완료 처리 실패");
            }

            alert(result.message || "판매완료 처리되었습니다.");

            setProduct((prev) => ({
                ...prev,
                saleStatus: "SOLD_OUT",
            }));
        } catch (err) {
            console.error("판매완료 처리 실패:", err);
            alert(err.message || "판매완료 처리 중 오류 발생");
        }
    };

    const productImages = product?.productImages || [];
    const hasImages = productImages.length > 0;
    const selectedImage =
        hasImages && productImages[selectedImageIndex]
            ? productImages[selectedImageIndex].imagePath
            : null;

            console.log("받은 상품사진", product);
            console.log("이미지 데이터들?", productImages);
    if (loading) {
        return (
            <div className="product-detail-page">
                <div className="product-detail-inner">
                    <div className="product-detail-state">상품 정보를 불러오는 중...</div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="product-detail-page">
                <div className="product-detail-inner">
                    <div className="product-detail-state error">{error}</div>
                </div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="product-detail-page">
                <div className="product-detail-inner">
                    <div className="product-detail-state">상품 정보가 없습니다.</div>
                </div>
            </div>
        );
    }

    return (
        <div className="product-detail-page">
            <div className="product-detail-inner">
                <div className="detail-top-bar">
                    <button className="back-btn" onClick={() => navigate(-1)}>
                        ← 목록으로 돌아가기
                    </button>
                </div>

                <section className="product-detail-main">
                    <div className="product-detail-image-section">
                        <div className="product-detail-image-wrap">
                            {selectedImage ? (
                                <img
                                    src={selectedImage}
                                    alt={product.title}
                                    className="product-detail-image"
                                />
                            ) : (
                                <div className="product-detail-image-empty">
                                    <span>환승마켓</span>
                                </div>
                            )}

                            {product.saleStatus === "SOLD_OUT" && (
                                <div className="product-soldout-overlay">판매완료</div>
                            )}
                        </div>

                        {hasImages && (
                            <div className="product-thumbnail-list">
                                {productImages.map((image, index) => (
                                    <button
                                        type="button"
                                        key={image.productImageId ?? index}
                                        className={
                                            selectedImageIndex === index
                                                ? "product-thumbnail-btn active"
                                                : "product-thumbnail-btn"
                                        }
                                        onClick={() => setSelectedImageIndex(index)}
                                    >
                                        <img
                                            src={image.imagePath}
                                            alt={`${product.title} 썸네일 ${index + 1}`}
                                            className="product-thumbnail-image"
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="product-detail-info-card">
                        <div className="detail-chip-row">
                            <span className="detail-chip">
                                {categoryMap[product.category] || product.category}
                            </span>

                            <span className="detail-chip outline">{product.location}</span>

                            {product.saleStatus === "SOLD_OUT" && (
                                <span className="detail-chip soldout">판매완료</span>
                            )}
                        </div>

                        <h1 className="detail-title">{product.title}</h1>

                        <div className="detail-price">{formatPrice(product.price)}원</div>

                        <div className="detail-info-list">
                            <div className="detail-info-item">
                                <span className="label">판매자</span>
                                <span style={{ display: "none" }} className="value">
                                    {product.sellerId}
                                </span>
                                <span className="value">{product.sellerNickname}</span>
                            </div>

                            <div className="detail-info-item">
                                <span className="label">거래지역</span>
                                <span className="value">{product.location}</span>
                            </div>

                            <div className="detail-info-item">
                                <span className="label">카테고리</span>
                                <span className="value">
                                    {categoryMap[product.category] || product.category}
                                </span>
                            </div>
                        </div>

                        <div className="detail-action-buttons">
                            <button
                                type="button"
                                className={`btn-like ${likeInfo.liked ? "active" : ""}`}
                                onClick={handleLikeToggle}
                                disabled={isSeller}
                            >
                                {likeInfo.liked ? (
                                    <FaHeart className="like-icon active" />
                                ) : (
                                    <FiHeart className="like-icon" />
                                )}
                                <span className="like-text">찜 {likeInfo.likeCount}</span>
                            </button>

                            <button
                                type="button"
                                className="btn-chat"
                                onClick={startChat}
                                disabled={product.saleStatus === "SOLD_OUT"}
                            >
                                {product.saleStatus === "SOLD_OUT" ? "판매완료" : "채팅하기"}
                            </button>
                        </div>

                        <div className="detail-sub-buttons">
                            <Link to="/products" className="btn-list-link">
                                목록 보기
                            </Link>
                        </div>

                        {canManageProduct && (
                            <div className="detail-owner-buttons">
                                {isSeller && product.saleStatus === "SALE" && (
                                    <button
                                        type="button"
                                        className="btn-soldout"
                                        onClick={handleSoldOut}
                                    >
                                        판매완료
                                    </button>
                                )}

                                <button
                                    type="button"
                                    className="btn-edit"
                                    onClick={() =>
                                        navigate(`/products/${product.productId}/edit`)
                                    }
                                >
                                    수정
                                </button>

                                <button
                                    type="button"
                                    className="btn-delete"
                                    onClick={handleDelete}
                                >
                                    삭제
                                </button>
                            </div>
                        )}
                    </div>
                </section>

                <section className="product-detail-description-card">
                    <div className="section-title-wrap">
                        <h2>상품 설명</h2>
                        <p>판매자가 작성한 상품 상세 설명이에요.</p>
                    </div>

                    <div className="detail-description">
                        {product.content ? product.content : "등록된 설명이 없습니다."}
                    </div>
                </section>
            </div>
        </div>
    );
}