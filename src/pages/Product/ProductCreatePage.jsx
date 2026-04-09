import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import DaumPostcode from "react-daum-postcode";
import "./ProductCreatePage.css";
import { useUser } from "../../UserContext";

export default function ProductCreatePage() {
    const navigate = useNavigate();
    const { userInfo } = useUser();
    const mapRef = useRef(null);

    const mapInstance = useRef(null);
    const markerInstance = useRef(null);
    const geocoderInstance = useRef(null);

    const [form, setForm] = useState({
        title: "",
        category: "",
        price: "",
        location: "",
        content: "",
    });

    const [isPostcodeOpen, setIsPostcodeOpen] = useState(false);
    const [imageFiles, setImageFiles] = useState([]);
    const [previewUrls, setPreviewUrls] = useState([]);

    const formatPriceWithComma = (value) => {
        if (!value) return "";
        return Number(value).toLocaleString("ko-KR");
    };

    const formatPriceToKorean = (value) => {
        const num = Number(value);
        if (!num) return "";

        const units = [
            { value: 100000000, label: "억" },
            { value: 10000, label: "만" },
        ];

        let result = "";
        let remain = num;

        for (const unit of units) {
            const unitValue = Math.floor(remain / unit.value);
            if (unitValue > 0) {
                result += `${unitValue}${unit.label} `;
                remain %= unit.value;
            }
        }

        if (remain > 0) result += remain.toLocaleString("ko-KR");
        return result.trim() + "원";
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: name === "price" ? value.replace(/[^0-9]/g, "") : value,
        }));
    };

    // ✅ 수정: 이미지 누적 추가
    const handleImageChange = (e) => {
        const files = Array.from(e.target.files || []);

        setImageFiles((prev) => {
            const newFiles = [...prev, ...files];

            if (newFiles.length > 5) {
                alert("이미지는 최대 5장까지 가능합니다.");
                return prev;
            }

            return newFiles;
        });

        setPreviewUrls((prev) => {
            const newUrls = files.map((file) => URL.createObjectURL(file));

            if (prev.length + newUrls.length > 5) {
                newUrls.forEach((url) => URL.revokeObjectURL(url));
                return prev;
            }

            return [...prev, ...newUrls];
        });

        e.target.value = "";
    };

    // ✅ 추가: 등록 페이지용 이미지 바로 삭제
    const handleRemoveImage = (index) => {
        setImageFiles((prev) => prev.filter((_, i) => i !== index));

        setPreviewUrls((prev) => {
            const targetUrl = prev[index];
            if (targetUrl) {
                URL.revokeObjectURL(targetUrl);
            }
            return prev.filter((_, i) => i !== index);
        });
    };

    const handleComplete = (data) => {
        let fullAddress = data.address;
        let extraAddress = "";

        if (data.addressType === "R") {
            if (data.bname !== "") extraAddress += data.bname;
            if (data.buildingName !== "") {
                extraAddress += extraAddress !== ""
                    ? `, ${data.buildingName}`
                    : data.buildingName;
            }
            fullAddress += extraAddress !== "" ? ` (${extraAddress})` : "";
        }

        setIsPostcodeOpen(false);
        setForm((prev) => ({ ...prev, location: fullAddress }));

        const geocoder = geocoderInstance.current;
        const map = mapInstance.current;
        const marker = markerInstance.current;

        if (geocoder && map && marker) {
            geocoder.addressSearch(fullAddress, (result, status) => {
                if (status === window.kakao.maps.services.Status.OK) {
                    const coords = new window.kakao.maps.LatLng(result[0].y, result[0].x);
                    map.setCenter(coords);
                    marker.setPosition(coords);
                }
            });
        }
    };

    useEffect(() => {
        if (!window.kakao || !window.kakao.maps || !userInfo) return;

        window.kakao.maps.load(() => {
            const mapContainer = mapRef.current;
            if (!mapContainer) return;

            const geocoder = new window.kakao.maps.services.Geocoder();
            geocoderInstance.current = geocoder;

            const initialAddress = userInfo?.address || "경기도 안양시";

            geocoder.addressSearch(initialAddress, (result, status) => {
                let coords;
                if (status === window.kakao.maps.services.Status.OK) {
                    coords = new window.kakao.maps.LatLng(result[0].y, result[0].x);
                } else {
                    coords = new window.kakao.maps.LatLng(37.3943, 126.9568);
                }

                const map = new window.kakao.maps.Map(mapContainer, {
                    center: coords,
                    level: 4,
                });
                mapInstance.current = map;

                const marker = new window.kakao.maps.Marker({
                    position: coords,
                    map: map,
                });
                markerInstance.current = marker;

                setForm((prev) => ({ ...prev, location: initialAddress }));

                window.kakao.maps.event.addListener(map, "click", function (mouseEvent) {
                    const clickedLatLng = mouseEvent.latLng;
                    marker.setPosition(clickedLatLng);

                    geocoder.coord2RegionCode(
                        clickedLatLng.getLng(),
                        clickedLatLng.getLat(),
                        (regionResult, regionStatus) => {
                            if (regionStatus === window.kakao.maps.services.Status.OK) {
                                const addressName = regionResult[0].address_name;
                                setForm((prev) => ({ ...prev, location: addressName }));
                            }
                        }
                    );
                });
            });
        });
    }, [userInfo]);

    // ✅ 추가: 미리보기 URL 메모리 정리
    useEffect(() => {
        return () => {
            previewUrls.forEach((url) => URL.revokeObjectURL(url));
        };
    }, [previewUrls]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const accessToken = sessionStorage.getItem("accessToken");
            const formData = new FormData();

            formData.append("title", form.title);
            formData.append("category", form.category);
            formData.append("price", Number(form.price));
            formData.append("location", form.location);
            formData.append("content", form.content);

            imageFiles.forEach((file) => formData.append("images", file));

            const response = await fetch("/api/products", {
                method: "POST",
                headers: {
                    Authorization: accessToken ? `Bearer ${accessToken}` : "",
                },
                body: formData,
            });

            if (!response.ok) {
                const text = await response.text();
                const result = text ? JSON.parse(text) : {};
                alert(result.message || "상품 등록 실패");
                return;
            }

            alert("상품이 등록되었습니다.");
            navigate("/");
        } catch (error) {
            console.error(error);
            alert("서버 오류가 발생했습니다.");
        }
    };

    return (
        <main className="product-create-page">
            {isPostcodeOpen && (
                <>
                    <div
                        className="postcode-overlay"
                        onClick={() => setIsPostcodeOpen(false)}
                        style={{
                            position: "fixed",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: "rgba(0,0,0,0.5)",
                            zIndex: 999,
                        }}
                    />
                    <div
                        className="postcode-modal"
                        style={{
                            position: "fixed",
                            top: "50%",
                            left: "50%",
                            transform: "translate(-50%, -50%)",
                            width: "400px",
                            maxWidth: "90%",
                            background: "#fff",
                            zIndex: 1000,
                            borderRadius: "8px",
                            overflow: "hidden",
                            boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                        }}
                    >
                        <div
                            className="postcode-header"
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                padding: "15px",
                                background: "#f8f9fa",
                                borderBottom: "1px solid #ddd",
                                fontWeight: "bold",
                            }}
                        >
                            <span>거래 장소 검색</span>
                            <button
                                type="button"
                                onClick={() => setIsPostcodeOpen(false)}
                                style={{
                                    background: "none",
                                    border: "none",
                                    fontSize: "20px",
                                    cursor: "pointer",
                                }}
                            >
                                &times;
                            </button>
                        </div>
                        <DaumPostcode onComplete={handleComplete} style={{ width: "100%", height: "400px" }} />
                    </div>
                </>
            )}

            <div className="product-create-inner">
                <section className="product-create-hero">
                    <span className="product-create-badge">판매 등록</span>
                    <h1>새 상품 등록</h1>
                    <p>환승마켓에 판매할 상품 정보를 입력해주세요.</p>
                </section>

                <form className="product-create-form" onSubmit={handleSubmit}>
                    <div className="product-create-top">
                        <section className="product-create-card image-card">
                            <div className="section-head">
                                <div>
                                    <h2>상품 이미지</h2>
                                    <p>최대 5장까지 업로드 가능</p>
                                </div>
                            </div>

                            <label className="image-upload-box">
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handleImageChange}
                                />
                                <div className="image-upload-content">
                                    <div className="image-upload-plus">+</div>
                                    <strong>이미지 업로드</strong>
                                    <span>여러 번 나눠서 추가할 수 있어요.</span>

                                    {previewUrls.length > 0 && (
                                        <div className="image-preview-list">
                                            {previewUrls.map((url, index) => (
                                                <div className="image-preview" key={index}>
                                                    <img src={url} alt={`미리보기 ${index + 1}`} />

                                                    <button
                                                        type="button"
                                                        className="image-remove-btn"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            handleRemoveImage(index);
                                                        }}
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </label>
                        </section>

                        <section className="product-create-card info-card">
                            <div className="section-head">
                                <h2>기본 정보</h2>
                            </div>

                            <div className="form-group">
                                <label htmlFor="title">상품명</label>
                                <input
                                    id="title"
                                    name="title"
                                    type="text"
                                    value={form.title}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="category">카테고리</label>
                                    <select
                                        id="category"
                                        name="category"
                                        value={form.category}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="">카테고리 선택</option>
                                        <option value="digital">디지털기기</option>
                                        <option value="fashion">의류/잡화</option>
                                        <option value="furniture">가구/인테리어</option>
                                        <option value="life">생활/가전</option>
                                        <option value="hobby">취미/도서</option>
                                        <option value="sports">스포츠/레저</option>
                                        <option value="ticket">티켓/교환권</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="price">가격</label>
                                    <div className="price-input-wrap">
                                        <input
                                            id="price"
                                            name="price"
                                            type="text"
                                            value={formatPriceWithComma(form.price)}
                                            onChange={handleChange}
                                            required
                                        />
                                        <span>원</span>
                                    </div>
                                    {form.price && (
                                        <p className="price-help-text">
                                            입력 금액: {formatPriceToKorean(form.price)}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                                <label htmlFor="location">거래 희망 장소</label>

                                <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
                                    <input
                                        type="text"
                                        value={form.location}
                                        readOnly
                                        style={{ flex: 1, backgroundColor: "#f9f9f9", cursor: "default" }}
                                        placeholder="주소 검색 버튼을 눌러 거래 장소를 선택하세요."
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setIsPostcodeOpen(true)}
                                        style={{
                                            padding: "0 15px",
                                            background: "#ff6f0f",
                                            color: "white",
                                            border: "none",
                                            borderRadius: "8px",
                                            cursor: "pointer",
                                            whiteSpace: "nowrap",
                                        }}
                                    >
                                        주소 찾기
                                    </button>
                                </div>

                                <div
                                    ref={mapRef}
                                    style={{
                                        width: "100%",
                                        height: "250px",
                                        borderRadius: "12px",
                                        marginBottom: "10px",
                                        border: "1px solid #ddd",
                                    }}
                                />
                                <p style={{ fontSize: "13px", color: "#888", marginTop: "5px" }}>
                                    💡 주소를 검색한 후 지도를 클릭하여 미세하게 위치를 조정할 수 있습니다.
                                </p>
                            </div>
                        </section>
                    </div>

                    <section className="product-create-card detail-card">
                        <div className="section-head">
                            <h2>상품 설명</h2>
                        </div>
                        <div className="form-group">
                            <textarea
                                id="content"
                                name="content"
                                value={form.content}
                                onChange={handleChange}
                                rows="8"
                                required
                            />
                        </div>
                    </section>

                    <div className="product-create-submit">
                        <div className="submit-buttons">
                            <button
                                type="button"
                                className="cancel-btn"
                                onClick={() => navigate("/")}
                            >
                                취소
                            </button>
                            <button type="submit" className="submit-btn">
                                상품 등록하기
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </main>
    );
}