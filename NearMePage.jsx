import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import './near-me.css'; // 🌟 css 파일 임포트

const NearMePage = () => {
    const [searchParams] = useSearchParams();
    const mapRef = useRef(null);

    const [products, setProducts] = useState([]);

    // 🌟 1. URL에서 넘어온 좌표는 '가입 시 등록한 집 주소'로 취급합니다!
    const homeLat = parseFloat(searchParams.get('lat'));
    const homeLng = parseFloat(searchParams.get('lng'));

    // 🌟 2. 실제 스마트폰/PC의 '현재 GPS 위치'를 담을 State
    const [currentLoc, setCurrentLoc] = useState({ lat: null, lng: null });
    const [isLoadingLoc, setIsLoadingLoc] = useState(true); // GPS 추적 로딩 상태

    // 1️⃣ [백엔드 통신] 매물 데이터 가져오기
    useEffect(() => {
        const fetchNearbyProducts = async () => {
            try {
                const response = await axios.get(`/api/products`);
                console.log("📦 서버에서 받은 매물 목록:", response.data);
                setProducts(response.data);
            } catch (error) {
                console.error("매물 가져오기 실패:", error);
            }
        };
        fetchNearbyProducts();
    }, []);

    // 🌟 3️⃣ [GPS 추적] 브라우저 GPS를 이용해 진짜 "현재 위치" 찾기!
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    // GPS 찾기 성공! (실제 현재 위치)
                    setCurrentLoc({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                    setIsLoadingLoc(false);
                },
                (error) => {
                    console.error("GPS 권한 거부 또는 오류:", error);
                    // 🚨 GPS를 못 찾거나 거부당하면, URL로 넘어온 '집 주소'를 현재 위치 대신 씁니다.
                    if (homeLat && homeLng) {
                        setCurrentLoc({ lat: homeLat, lng: homeLng });
                    } else {
                        // 로그인도 안했고 GPS도 없으면 '서울 시청'을 기본값으로 둡니다.
                        setCurrentLoc({ lat: 37.5665, lng: 126.9780 });
                    }
                    setIsLoadingLoc(false);
                },
                { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
            );
        } else {
            // 브라우저가 GPS를 지원하지 않을 때의 예외 처리
            if (homeLat && homeLng) setCurrentLoc({ lat: homeLat, lng: homeLng });
            else setCurrentLoc({ lat: 37.5665, lng: 126.9780 });
            setIsLoadingLoc(false);
        }
    }, [homeLat, homeLng]);

  // 2️⃣ [지도 그리기] 지도를 띄우고 매물 핀 꽂기
    useEffect(() => {
        const { kakao } = window;
        
        if (!kakao || !kakao.maps || isLoadingLoc || !currentLoc.lat) return;

        kakao.maps.load(() => {
            if (!mapRef.current) return;

            const mapOptions = {
                center: new kakao.maps.LatLng(currentLoc.lat, currentLoc.lng),
                level: 5 
            };
            const map = new kakao.maps.Map(mapRef.current, mapOptions);

            // =================================================================
            // 🌟 1. '현재 내 위치' 마커를 눈에 띄는 "커스텀 오버레이"로 변경!
            // =================================================================
            const currentOverlayContent = `
                <div style="background-color: #ff6f0f; color: white; padding: 6px 12px; border-radius: 20px; font-weight: bold; font-size: 13px; box-shadow: 0 4px 10px rgba(0,0,0,0.2); border: 2px solid white; transform: translateY(-50%);">
                    📍 현재 내 위치
                </div>
            `;
            const currentOverlay = new kakao.maps.CustomOverlay({
                position: new kakao.maps.LatLng(currentLoc.lat, currentLoc.lng),
                content: currentOverlayContent,
                map: map // 생성과 동시에 지도에 붙입니다.
            });

            // =================================================================
            // 🌟 2. '우리 집' 마커도 "커스텀 오버레이"로 예쁘게 변경!
            // =================================================================
            if (homeLat && homeLng && (homeLat !== currentLoc.lat || homeLng !== currentLoc.lng)) {
                const homeOverlayContent = `
                    <div style="background-color: #00d26a; color: white; padding: 6px 12px; border-radius: 20px; font-weight: bold; font-size: 13px; box-shadow: 0 4px 10px rgba(0,0,0,0.2); border: 2px solid white; transform: translateY(-50%);">
                        🏠 우리 집
                    </div>
                `;
                const homeOverlay = new kakao.maps.CustomOverlay({
                    position: new kakao.maps.LatLng(homeLat, homeLng),
                    content: homeOverlayContent,
                    map: map
                });
            }

            const geocoder = new kakao.maps.services.Geocoder();

            // 🌟 매물 마커는 기존 파란색 핀을 그대로 유지합니다.
            products.forEach((product) => {
                if (!product.location) return;

                geocoder.addressSearch(product.location, (result, status) => {
                    if (status === kakao.maps.services.Status.OK) {
                        const coords = new kakao.maps.LatLng(result[0].y, result[0].x);

                        const marker = new kakao.maps.Marker({
                            map: map,
                            position: coords
                        });

                        const hoverWindow = new kakao.maps.InfoWindow({
                            content: `<div class="hover-info-window">🛍️ ${product.title}</div>`
                        });

                        const detailWindow = new kakao.maps.InfoWindow({
                            content: `
                                <div class="info-window-wrap">
                                    <div class="info-title">🛍️ ${product.title}</div>
                                    <div class="info-address">
                                        📍 ${product.location} <br/> 
                                        <span>(정확한 위치는 채팅으로 문의하세요)</span>
                                    </div>
                                    <div class="info-bottom">
                                        <span class="info-price">${product.price ? product.price.toLocaleString() : 0}원</span>
                                        <a href="/products/${product.productId || product.id}" class="info-link">상세보기 ></a>
                                    </div>
                                </div>
                            `,
                            removable: true 
                        });

                        kakao.maps.event.addListener(marker, 'mouseover', () => {
                            if (!detailWindow.getMap()) {
                                hoverWindow.open(map, marker);
                            }
                        });

                        kakao.maps.event.addListener(marker, 'mouseout', () => {
                            hoverWindow.close();
                        });

                        kakao.maps.event.addListener(marker, 'click', () => {
                            hoverWindow.close(); 

                            if (detailWindow.getMap()) {
                                detailWindow.close(); 
                            } else {
                                detailWindow.open(map, marker); 
                            }
                        });
                    }
                });
            });
        }); 
    }, [currentLoc, isLoadingLoc, homeLat, homeLng, products]);
    return (
        <div className="near-me-container">
            <h2 className="near-me-title">📍 내 주변 매물</h2>
            <p className="near-me-desc">
                현재 위치를 중심으로 환승 가능한 물건들을 확인해보세요.
            </p>
            
            {/* 🌟 GPS 로딩 중일 때 사용자에게 보여줄 안내 문구 */}
            {isLoadingLoc && (
                <div style={{ textAlign: 'center', padding: '50px', color: '#888', fontWeight: 'bold' }}>
                    현재 접속하신 위치의 GPS를 찾고 있습니다... 🛰️
                </div>
            )}

            {/* GPS 로딩이 끝나면 지도를 짠! 하고 보여줍니다 */}
            <div 
                ref={mapRef} 
                className="near-me-map" 
                style={{ display: isLoadingLoc ? 'none' : 'block' }} 
            />
        </div>
    );
};

export default NearMePage;