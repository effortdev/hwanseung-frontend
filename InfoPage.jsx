import React, { useEffect } from 'react';
import './InfoPage.css'; // 새로 만든 CSS 파일 연결

const InfoPage = () => {
  // 🌟 페이지 이동 시 무조건 스크롤을 맨 위로 올려주는 센스!
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="info-page-wrapper">
      {/* 🚀 상단 히어로 배너 영역 */}
      <div className="info-hero">
        <h1>환승마켓 서비스 안내</h1>
        <p>쓰던 물건을 가치 있게, 새로운 주인에게 안전하게 환승하세요.</p>
      </div>

      <div className="info-container">
        {/* 🌱 섹션 1: 소개 */}
        <section className="info-section">
          <h2 className="info-section-title"><i className="fas fa-seedling"></i> 환승마켓이란?</h2>
          <p className="info-text">
            환승마켓은 믿을 수 있는 이웃과 함께하는 중고 거래 플랫폼입니다.
            내 주변의 이웃들과 따뜻한 거래를 통해 안 쓰는 물건에 새로운 가치를 부여해보세요.
            우리의 일상 속 작은 자원 순환이 지구를 지키는 큰 발걸음이 됩니다.
          </p>
        </section>

        {/* ⭐ 섹션 2: 핵심 기능 (카드 그리드 형태) */}
        <section className="info-section">
          <h2 className="info-section-title"><i className="fas fa-star"></i> 핵심 기능</h2>
          <div className="info-card-grid">
            <div className="info-card">
              <div className="info-icon"><i className="fas fa-map-marker-alt"></i></div>
              <h3>동네 인증 시스템</h3>
              <p>GPS 기반의 확실한 동네 인증으로 진짜 우리 동네 이웃과만 안전하고 가깝게 거래할 수 있습니다.</p>
            </div>
            <div className="info-card">
              <div className="info-icon"><i className="fas fa-shield-alt"></i></div>
              <h3>환승Pay 안심결제</h3>
              <p>구매 확정 전까지 결제 대금을 환승마켓이 안전하게 보관하여 사기 피해를 100% 차단합니다.</p>
            </div>
            <div className="info-card">
              <div className="info-icon"><i className="fas fa-heart"></i></div>
              <h3>따뜻한 매너 지수</h3>
              <p>서로의 거래 매너를 평가하고, 매너 온도를 통해 신뢰할 수 있는 거래 파트너를 미리 확인하세요.</p>
            </div>
          </div>
        </section>

        {/* 🛡️ 섹션 3: 안전 거래 가이드 */}
        <section className="info-section">
          <h2 className="info-section-title"><i className="fas fa-clipboard-check"></i> 안전 거래 가이드</h2>
          <ul className="info-list">
            <li>
              <i className="fas fa-check"></i> 
              <span><strong>안전한 직거래:</strong> 직거래 시에는 인적이 드물지 않은 밝고 공개된 장소(지하철역, 카페 앞 등)에서 만나세요.</span>
            </li>
            <li>
              <i className="fas fa-check"></i> 
              <span><strong>외부 메신저 주의:</strong> 카카오톡, 라인 등 외부 메신저로 대화를 유도하는 경우 사기일 확률이 매우 높으니 주의하세요.</span>
            </li>
            <li>
              <i className="fas fa-check"></i> 
              <span><strong>택배 거래 필수 수칙:</strong> 직접 만나기 힘든 택배 거래 시에는 반드시 사기를 방지하는 <strong>'환승Pay'</strong> 안심결제를 이용해 주세요.</span>
            </li>
            <li>
              <i className="fas fa-check"></i> 
              <span><strong>개인정보 보호:</strong> 채팅창에 계좌번호, 전화번호 등 민감한 개인정보를 함부로 남기지 마세요.</span>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
};

export default InfoPage;