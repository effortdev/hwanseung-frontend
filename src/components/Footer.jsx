import './Footer.css';

const Footer = () => {
  return (
    <footer className="site-footer">
      <div className="footer-main">
        <div className="footer-container">
          {/* 상단: 로고 + 소셜 */}
          <div className="footer-top">
            <div className="footer-logo">
              <div className="footer-logo-icon">
                <i className="fas fa-exchange-alt"></i>
              </div>
              <span className="footer-logo-text">환승마켓</span>
            </div>
            <div className="footer-social">
              <a href="#" className="social-icon" aria-label="Facebook">
                <i className="fab fa-facebook-f"></i>
              </a>
              <a href="#" className="social-icon" aria-label="Twitter">
                <i className="fab fa-twitter"></i>
              </a>
              <a href="#" className="social-icon" aria-label="Instagram">
                <i className="fab fa-instagram"></i>
              </a>
              <a href="#" className="social-icon" aria-label="YouTube">
                <i className="fab fa-youtube"></i>
              </a>
            </div>
          </div>

          {/* 링크 그리드 */}
          <div className="footer-links">
            <div className="footer-link-group">
              <h4 className="footer-link-title">환승마켓</h4>
              <ul>
                <li><a href="#">회사소개</a></li>
                <li><a href="#">인재채용</a></li>
                <li><a href="#">제휴제안</a></li>
                <li><a href="#">이용약관</a></li>
              </ul>
            </div>
            <div className="footer-link-group">
              <h4 className="footer-link-title">고객센터</h4>
              <ul>
                <li><a href="#">공지사항</a></li>
                <li><a href="#">자주하는 질문</a></li>
                <li><a href="#">1:1 문의</a></li>
                <li><a href="#">신고안내</a></li>
              </ul>
            </div>
            <div className="footer-link-group">
              <h4 className="footer-link-title">주요 서비스</h4>
              <ul>
                <li><a href="#">중고거래</a></li>
                <li><a href="#">동네정보</a></li>
                <li><a href="#">환승페이</a></li>
                <li><a href="#">비즈니스</a></li>
              </ul>
            </div>
            <div className="footer-link-group">
              <h4 className="footer-link-title">정책</h4>
              <ul>
                <li><a href="#">운영정책</a></li>
                <li><a href="#"><strong>개인정보처리방침</strong></a></li>
                <li><a href="#">청소년보호정책</a></li>
                <li><a href="#">가이드라인</a></li>
              </ul>
            </div>
            <div className="footer-link-group footer-newsletter">
              <h4 className="footer-link-title">뉴스레터 구독</h4>
              <p className="newsletter-desc">환승마켓의 소식을 이메일로 받아보세요.</p>
              <div className="newsletter-form">
                <input type="email" placeholder="이메일 주소 입력" />
                <button type="button">
                  <i className="fas fa-paper-plane"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 하단 저작권 */}
      <div className="footer-bottom">
        <div className="footer-container">
          <span className="copyright">
            &copy; 2026 환승마켓. All rights reserved.
          </span>
          <div className="footer-bottom-links">
            <a href="#">개인정보처리방침</a>
            <a href="#">이용약관</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
