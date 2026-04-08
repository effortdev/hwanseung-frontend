import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FiHeart, FiMessageCircle } from "react-icons/fi";
import { FaHeart } from "react-icons/fa";
import "./ProductListPage.css";

const categoryMap = {
    all: "전체",
    digital: "디지털기기",
    fashion: "의류/잡화",
    furniture: "가구/인테리어",
    life: "생활/가전",
    hobby: "취미/도서",
    sports: "스포츠/레저",
    ticket: "티켓/교환권",
};

const categoryOptions = [
    { key: "all", label: "전체" },
    { key: "digital", label: "디지털기기" },
    { key: "fashion", label: "의류/잡화" },
    { key: "furniture", label: "가구/인테리어" },
    { key: "life", label: "생활/가전" },
    { key: "hobby", label: "취미/도서" },
    { key: "sports", label: "스포츠/레저" },
    { key: "ticket", label: "티켓/교환권" },
];

function formatPrice(price) {
    return Number(price || 0).toLocaleString();
}

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

export default function ProductListPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const [products, setProducts] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [keyword, setKeyword] = useState("");
    const [sortType, setSortType] = useState("latest");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const userInfo = getUserInfoFromToken();
    const loginUserId = userInfo?.userId;

    useEffect(() => {
        const category = searchParams.get("category");

        if (
            category &&
            ["digital", "fashion", "furniture", "life", "hobby", "sports", "ticket"].includes(category)
        ) {
            setSelectedCategory(category);
        } else {
            setSelectedCategory("all");
        }
    }, [searchParams]);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setLoading(true);
                setError("");

                const token = sessionStorage.getItem("accessToken");

                const response = await fetch("/api/products", {
                    method: "GET",
                    headers: token
                        ? {
                            Authorization: `Bearer ${token}`,
                        }
                        : {},
                });

                if (!response.ok) {
                    throw new Error("상품 목록을 불러오지 못했습니다.");
                }

                const data = await response.json();
                setProducts(data);
            } catch (err) {
                console.error("상품 목록 조회 실패:", err);
                setError("상품 목록을 불러오는 중 오류가 발생했습니다.");
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, []);

    const handleLikeToggle = async (e, product) => {
        e.stopPropagation();

        const token = sessionStorage.getItem("accessToken");

        if (!token) {
            alert("로그인 후 이용 가능합니다.");
            navigate("/login");
            return;
        }

        try {
            const response = await fetch(`/api/products/${product.productId}/like`, {
                method: product.liked ? "DELETE" : "POST",
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

            setProducts((prev) =>
                prev.map((item) =>
                    item.productId === product.productId
                        ? {
                            ...item,
                            liked: result.liked,
                            likeCount: result.likeCount,
                        }
                        : item
                )
            );
        } catch (err) {
            console.error("목록 찜 처리 실패:", err);
            alert(err.message || "찜 처리 중 오류 발생");
        }
    };

    const handleCategoryClick = (categoryKey) => {
        if (categoryKey === "all") {
            navigate("/products");
            return;
        }

        navigate(`/products?category=${categoryKey}`);
    };

    const filteredProducts = useMemo(() => {
        const lowerKeyword = keyword.trim().toLowerCase();

        let result = products.filter((product) => {
            const matchCategory =
                selectedCategory === "all" || product.category === selectedCategory;

            const matchKeyword =
                lowerKeyword === "" ||
                (product.title && product.title.toLowerCase().includes(lowerKeyword)) ||
                (product.location &&
                    product.location.toLowerCase().includes(lowerKeyword));

            return matchCategory && matchKeyword;
        });

        result.sort((a, b) => {
            const aSoldOut = a.saleStatus === "SOLD_OUT" ? 1 : 0;
            const bSoldOut = b.saleStatus === "SOLD_OUT" ? 1 : 0;

            // 1. 판매중 먼저, 판매완료 나중
            if (aSoldOut !== bSoldOut) {
                return aSoldOut - bSoldOut;
            }

            // 2. 같은 상태끼리만 선택 정렬 적용
            if (sortType === "priceAsc") {
                return a.price - b.price;
            }

            if (sortType === "priceDesc") {
                return b.price - a.price;
            }

            // latest
            return b.productId - a.productId;
        });

        return result;
    }, [products, selectedCategory, keyword, sortType]);

    return (
        <div className="product-list-page">
            <div className="product-list-inner">
                <section className="product-list-hero">
                    <div className="product-list-badge">환승마켓 상품 둘러보기</div>
                    <h1>지금 올라온 상품을 한눈에 확인해보세요</h1>
                    <p>
                        최신 등록순으로 상품을 보고, 카테고리와 검색으로 원하는 물건을
                        빠르게 찾을 수 있어요.
                    </p>
                </section>

                <section className="product-list-toolbar">
                    <div className="toolbar-left">
                        <input
                            type="search"
                            placeholder="상품명이나 지역으로 검색"
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            className="product-search-input"
                        />
                    </div>

                    <div className="toolbar-right sort-button-group">
                        <button
                            type="button"
                            className={sortType === "latest" ? "sort-btn active" : "sort-btn"}
                            onClick={() => setSortType("latest")}
                        >
                            최신순
                        </button>

                        <button
                            type="button"
                            className={sortType === "priceAsc" ? "sort-btn active" : "sort-btn"}
                            onClick={() => setSortType("priceAsc")}
                        >
                            낮은가격
                        </button>

                        <button
                            type="button"
                            className={sortType === "priceDesc" ? "sort-btn active" : "sort-btn"}
                            onClick={() => setSortType("priceDesc")}
                        >
                            높은가격
                        </button>
                    </div>
                </section>

                <section className="product-category-tabs">
                    {categoryOptions.map((category) => (
                        <button
                            key={category.key}
                            type="button"
                            className={
                                selectedCategory === category.key
                                    ? "category-tab active"
                                    : "category-tab"
                            }
                            onClick={() => handleCategoryClick(category.key)}
                        >
                            {category.label}
                        </button>
                    ))}
                </section>

                <section className="product-list-summary">
                    <strong>{filteredProducts.length}</strong>개의 상품이 있어요
                </section>

                {loading && (
                    <div className="product-list-state">
                        <p>상품 목록 불러오는 중...</p>
                    </div>
                )}

                {!loading && error && (
                    <div className="product-list-state error">
                        <p>{error}</p>
                    </div>
                )}

                {!loading && !error && filteredProducts.length === 0 && (
                    <div className="product-list-state empty">
                        <p>조건에 맞는 상품이 아직 없어요.</p>
                    </div>
                )}

                {!loading && !error && filteredProducts.length > 0 && (
                    <section className="product-grid">
                        {filteredProducts.map((product) => {
                            const isSoldOut = product.saleStatus === "SOLD_OUT";
                            const isMyProduct = loginUserId && product.sellerId === loginUserId;
                            const disableLike = isSoldOut || isMyProduct;

                            return (
                                <article
                                    key={product.productId}
                                    className={`product-card ${isSoldOut ? "soldout" : ""}`}
                                    onClick={() => navigate(`/products/${product.productId}`)}
                                >
                                    <div className="product-thumb">
                                        {product.thumbnailUrl ? (
                                            <img src={`http://localhost:8080${product.thumbnailUrl}`} alt={product.title} />
                                        ) : (
                                            <div className="product-thumb-empty">
                                                <span>환승마켓</span>
                                            </div>
                                        )}

                                        {isSoldOut && (
                                            <div className="product-soldout-overlay">
                                                판매완료
                                            </div>
                                        )}
                                    </div>

                                    <div className="product-card-body">
                                        <div className="product-card-top">
                                            <span className="product-category-chip">
                                                {categoryMap[product.category] || product.category}
                                            </span>
                                        </div>

                                        <h3 className="product-title">{product.title}</h3>

                                        <p className="product-price">
                                            {formatPrice(product.price)}원
                                        </p>

                                        <div className="product-meta">
                                            <span>{product.location}</span>
                                            <span className="dot">•</span>
                                            <span style={{ display: "none" }}>
                                                {product.sellerId}
                                            </span>
                                            <span>{product.sellerNickname}</span>
                                        </div>

                                        <div className="product-card-bottom">
                                            <div className="product-sale-status-text">
                                                {isSoldOut ? "판매완료" : "판매중"}
                                            </div>

                                            <div className="product-count-group">
                                                <button
                                                    type="button"
                                                    className={`product-like-btn ${product.liked ? "active" : ""}`}
                                                    disabled={disableLike}
                                                    onClick={(e) => handleLikeToggle(e, product)}
                                                >
                                                    {product.liked ? (
                                                        <FaHeart className="product-like-icon active" />
                                                    ) : (
                                                        <FiHeart className="product-like-icon" />
                                                    )}
                                                    <span className="product-like-count">{product.likeCount}</span>
                                                </button>

                                                <span className="product-chat-count">
                                                    <FiMessageCircle className="product-chat-icon" />
                                                    <span className="product-chat-value">{product.chatCount ?? 0}</span>
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </article>
                            );
                        })}
                    </section>
                )}
            </div>
        </div>
    );
}