import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import ChargePay from '../ChargePay'; // 🌟 이전에 만든 결제 팝업 컴포넌트
import './MyPage.css'; // 아래에서 만들 예쁜 디자인 파일

const MyPage = () => {
  const navigate = useNavigate();
  
  // 1. 상태(State) 저장소 만들기
  const [userInfo, setUserInfo] = useState({ username: '', email: '', contact: '' });
  const [isEditing, setIsEditing] = useState(false); // 연필 들기(수정 모드) 스위치!
  const [isPayModalOpen, setIsPayModalOpen] = useState(false); // 충전 팝업 스위치

  // 2. 화면이 처음 켜질 때 딱 한 번 실행 (다이어리 읽어오기)
  useEffect(() => {
    const fetchUserInfo = async () => {
      const token = localStorage.getItem('accessToken');
      
      // 출입증(토큰)이 없으면 로그인 페이지로 쫓아냅니다.
      if (!token) {
        alert("로그인이 필요한 서비스입니다.");
        navigate('/login');
        return;
      }

      try {
        // 🌟 백엔드의 UserRestController에 맞춰 POST로 정보 조회!
        const response = await axios.post('/api/v1/user', {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUserInfo(response.data); // 서버가 준 진짜 내 정보를 화면 상태에 저장
      } catch (error) {
        console.error("정보를 불러오지 못했습니다.", error);
        alert("내 정보를 불러오는 중 오류가 발생했습니다.");
      }
    };

    fetchUserInfo();
  }, [navigate]);

  // 3. <input> 칸에 글씨를 칠 때마다 실시간으로 정보 업데이트
  const handleChange = (e) => {
    const { name, value } = e.target;
    // 기존 정보(...userInfo)는 놔두고, 방금 친 글자만 바꿔치기 합니다.
    setUserInfo({ ...userInfo, [name]: value });
  };

  // 4. 수정한 정보 서버에 저장하기 (덮어쓰기)
  const handleSave = async () => {
    const token = localStorage.getItem('accessToken');
    try {
      // 🌟 백엔드의 UserRestController에 맞춰 PUT으로 정보 수정 요청!
      await axios.put('/api/v1/user', userInfo, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("성공적으로 정보가 수정되었습니다! 🎉");
      setIsEditing(false); // 연필 내려놓기 (다시 읽기 모드로 변신)
    } catch (error) {
      console.error("수정 실패:", error);
      alert("정보 수정에 실패했습니다. 다시 시도해 주세요.");
    }
  };

  return (
    <div className="mypage-container">
      <div className="mypage-header">
        <h2>내 정보 보기</h2>
        <p>환승마켓에서의 내 프로필과 결제 정보를 관리하세요.</p>
      </div>

      <div className="mypage-card">
        <div className="profile-section">
          <div className="profile-avatar">
            <i className="far fa-user"></i>
          </div>
          
          <div className="info-list">
            {/* 이름 영역 */}
            <div className="info-item">
              <label>이름</label>
              {isEditing ? (
                <input type="text" name="name" value={userInfo.username || ''} onChange={handleChange} className="edit-input" />
              ) : (
                <span className="info-value">{userInfo.username}</span>
              )}
            </div>

            {/* 이메일 영역 (보통 이메일은 아이디 역할이라 수정 불가하게 막아두는 경우가 많습니다) */}
            <div className="info-item">
              <label>이메일</label>
              <span className="info-value email-value">{userInfo.email}</span>
            </div>

            {/* 전화번호 영역 */}
            <div className="info-item">
              <label>전화번호</label>
              {isEditing ? (
                <input type="text" name="tel" value={userInfo.contact || ''} onChange={handleChange} className="edit-input" />
              ) : (
                <span className="info-value">{userInfo.contact}</span>
              )}
            </div>
          </div>
        </div>

        {/* 🌟 버튼 영역: isEditing 상태에 따라 버튼이 바뀝니다! */}
        <div className="mypage-actions">
          {isEditing ? (
            <>
              <button className="btn-save" onClick={handleSave}><i className="fas fa-check"></i> 저장하기</button>
              <button className="btn-cancel" onClick={() => setIsEditing(false)}>취소</button>
            </>
          ) : (
            <button className="btn-edit" onClick={() => setIsEditing(true)}><i className="fas fa-pen"></i> 수정하기</button>
          )}
        </div>
      </div>

      {/* 🌟 환승페이 충전 구역 */}
      <div className="mypage-pay-section">
        <div className="pay-banner">
          <div className="pay-text">
            <h3>환승Pay 충전</h3>
            <p>안전한 중고 거래의 시작, 환승Pay를 충전해보세요.</p>
          </div>
          <button className="btn-charge" onClick={() => setIsPayModalOpen(true)}>
            <i className="fas fa-wallet"></i> 충전하기
          </button>
        </div>
      </div>

      {/* 충전하기 버튼을 누르면 우리가 만들었던 ChargePay 팝업이 짠! 하고 나타납니다. */}
      {isPayModalOpen && (
        <ChargePay onClose={() => setIsPayModalOpen(false)} />
      )}
    </div>
  );
};

export default MyPage;