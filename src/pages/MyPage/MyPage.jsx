import React, { useState, useEffect, useRef } from 'react';
import DaumPostcode from 'react-daum-postcode';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import ChargePay from '../../ChargePay';
import '../../chargepay.css';
import '../../pages/MyPage.css';
import { useUser } from '../../UserContext';

axios.defaults.baseURL = "http://localhost:8080";

const MyPage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const IMG_BASE_URL = "http://localhost:8080";

  const { userInfo, isLoading, fetchUser } = useUser();

  const [editData, setEditData] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);

  const [imagePreview, setImagePreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isPostcodeOpen, setIsPostcodeOpen] = useState(false);

  // 닉네임 관련 상태
  const [isNicknameChecked, setIsNicknameChecked] = useState(true);
  const [nicknameMessage, setNicknameMessage] = useState('');
  const [nicknameError, setNicknameError] = useState('');

  // 🌟 SMS 인증 관련 상태 관리
  const [isSmsSent, setIsSmsSent] = useState(false);
  const [smsCode, setSmsCode] = useState("");
  const [isContactVerified, setIsContactVerified] = useState(true);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);

  // 🌟 비밀번호 재확인 팝업 상태 관리
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [verifyPassword, setVerifyPassword] = useState('');
  const [verifyError, setVerifyError] = useState('');

  useEffect(() => {
    if (userInfo) {
      setEditData(userInfo);
      if (userInfo.profileImagePath) {
        setImagePreview(`${IMG_BASE_URL}${userInfo.profileImagePath}`);
      }
      setIsContactVerified(true);
    }
  }, [userInfo]);

  useEffect(() => {
    if (!isLoading && !userInfo) {
      alert("로그인이 필요한 서비스입니다.");
      navigate('/login');
    }
  }, [isLoading, userInfo, navigate]);

  // 🌟 SMS 타이머 로직
  useEffect(() => {
    let timer;
    if (isTimerActive && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0) {
      setIsTimerActive(false);
      clearInterval(timer);
    }
    return () => clearInterval(timer);
  }, [isTimerActive, timeLeft]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditData({ ...editData, [name]: value });

    if (name === "contact") {
      if (value !== userInfo.contact) {
        setIsContactVerified(false);
        setIsSmsSent(false);
        setSmsCode("");
        setIsTimerActive(false);
      } else {
        setIsContactVerified(true);
      }
    }
  };

  // 🌟 비밀번호 검증 함수 (수정 모드 진입 전)
  const handleVerifyPassword = async () => {
    if (!verifyPassword) {
      setVerifyError('비밀번호를 입력해주세요.');
      return;
    }

    try {
      const token = sessionStorage.getItem('accessToken');
      
      // 백엔드 API (주소는 실제 백엔드 설정에 맞게 변경하세요)
      await axios.post('/api/user/verify-password', 
        { password: verifyPassword }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // 비밀번호가 맞다면 수정 모드 진입
      setIsPasswordModalOpen(false);
      setIsEditing(true);
      setIsNicknameChecked(true);
      setNicknameMessage('');
      setVerifyPassword('');
      setVerifyError('');

    } catch (error) {
      // 비밀번호가 틀렸다면 에러 메시지
      setVerifyError('비밀번호가 일치하지 않습니다.');
    }
  };

  const handleSendSms = async () => {
    if (!editData.contact || !/^[0-9]{11}$/.test(editData.contact)) {
      alert("올바른 연락처 11자리를 입력해주세요.");
      return;
    }
    try {
      await axios.post('/api/auth/sms/send-code', { phoneNumber: editData.contact });
      setIsSmsSent(true);
      setTimeLeft(180);
      setIsTimerActive(true);
      alert("인증번호가 발송되었습니다.");
    } catch (error) {
      alert("발송 실패. 잠시 후 다시 시도해주세요.");
    }
  };

  const handleVerifySms = async () => {
    try {
      await axios.post('/api/auth/verify-code', {
        key: editData.contact,
        code: smsCode
      });
      setIsContactVerified(true);
      setIsTimerActive(false);
      alert("휴대폰 인증이 완료되었습니다.");
    } catch (error) {
      alert("인증번호가 일치하지 않습니다.");
    }
  };

  const validateNickname = (nickname) => {
    if (!nickname) {
      setNicknameError("닉네임을 입력해주세요.");
      return false;
    }
    const regExp = /^[가-힣a-zA-Z0-9_]{2,8}$/;
    const isIncompleteKorean = /[ㄱ-ㅎㅏ-ㅣ]/.test(nickname);

    if (!regExp.test(nickname) || isIncompleteKorean) {
      setNicknameError("닉네임 형식이 올바르지 않습니다. (2~8자, 언더바 허용, 자음/모음 불가)");
      return false;
    }
    setNicknameError("");
    return true;
  };

  const handleNicknameChange = (e) => {
    const value = e.target.value;
    setEditData({ ...editData, nickname: value });
    validateNickname(value);

    if (value === userInfo.nickname) {
      setIsNicknameChecked(true);
      setNicknameMessage('');
    } else {
      setIsNicknameChecked(false);
      setNicknameMessage('중복 확인이 필요합니다.');
    }
  };

  const checkNicknameDuplicate = async () => {
    if (!validateNickname(editData.nickname)) return;
    if (editData.nickname === userInfo.nickname) {
      setIsNicknameChecked(true);
      setNicknameMessage('현재 사용 중인 닉네임입니다.');
      return;
    }
    try {
      const response = await axios.get(`/api/auth/check-nickname`, {
        params: { nickname: editData.nickname }
      });
      if (!response.data.isDuplicate) {
        setIsNicknameChecked(true);
        setNicknameMessage('사용 가능한 닉네임입니다.');
      } else {
        setIsNicknameChecked(false);
        setNicknameMessage('이미 사용 중인 닉네임입니다.');
      }
    } catch (error) {
      setNicknameMessage('서버 통신 중 오류가 발생했습니다.');
    }
  };

  const handleNeighborhoodAuth = () => {
    if (!navigator.geolocation) {
      alert("이 브라우저에서는 위치 정보를 지원하지 않습니다.");
      return;
    }
    alert("현재 위치를 확인 중입니다. 잠시만 기다려주세요...");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        window.kakao.maps.load(() => {
          const geocoder = new window.kakao.maps.services.Geocoder();
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          geocoder.coord2RegionCode(lng, lat, async (result, status) => {
            if (status === window.kakao.maps.services.Status.OK) {
              const myNeighborhood = result[0].region_3depth_name;
              try {
                const token = sessionStorage.getItem('accessToken');
                const updatedInfo = {
                  ...userInfo,
                  neighborhood: myNeighborhood,
                  isNeighborhoodAuthenticated: true
                };

                const formData = new FormData();
                formData.append('userData', new Blob([JSON.stringify(updatedInfo)], { type: 'application/json' }));

                await axios.put(`/api/user`, formData, {
                  headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                  }
                });

                alert(`🎉 성공! [${myNeighborhood}] 동네 인증이 완료되었습니다.`);
                if (fetchUser) fetchUser();
              } catch (error) {
                alert("인증 정보를 서버에 저장하는데 실패했습니다.");
              }
            }
          });
        });
      },
      (error) => alert("위치 권한을 허용해주셔야 동네 인증이 가능합니다."),
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };

  const validateBeforeSave = () => {
    if (!validateNickname(editData.nickname)) return false;
    if (!isNicknameChecked) {
      alert("닉네임 중복 확인을 해주세요.");
      return false;
    }
    if (!isContactVerified) {
      alert("연락처 본인인증을 완료해주세요.");
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateBeforeSave()) return;

    const token = sessionStorage.getItem('accessToken');
    const formData = new FormData();

    formData.append('userData', new Blob([JSON.stringify(editData)], { type: 'application/json' }));
    if (selectedFile) {
      formData.append('profileImage', selectedFile);
    }

    try {
      await axios.put('/api/user', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      alert("성공적으로 정보가 수정되었습니다! 🎉");
      await fetchUser();
      setIsEditing(false);
      setSelectedFile(null);
      setNicknameMessage('');
    } catch (error) {
      alert("정보 수정에 실패했습니다.");
    }
  };

  const handleComplete = (data) => {
    let fullAddress = data.address;
    let extraAddress = '';
    if (data.addressType === 'R') {
      if (data.bname !== '') extraAddress += data.bname;
      if (data.buildingName !== '') extraAddress += extraAddress !== '' ? `, ${data.buildingName}` : data.buildingName;
      fullAddress += extraAddress !== '' ? ` (${extraAddress})` : '';
    }
    setEditData({ ...editData, zipCode: data.zonecode, address: fullAddress });
    setIsPostcodeOpen(false);
  };

  if (isLoading) return <div className="mypage-container" style={{ padding: '50px', textAlign: 'center' }}>정보를 불러오는 중입니다...</div>;
  if (!userInfo) return null;

  return (
    <div className="mypage-container">
      <div className="mypage-header">
        <h2>내 정보 보기</h2>
        <p>환승마켓에서의 내 프로필과 결제 정보를 관리하세요.</p>
      </div>

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

      {isPayModalOpen && (
        <ChargePay onClose={() => setIsPayModalOpen(false)} userInfo={userInfo} />
      )}
      <br/>
      <div className="mypage-card">
        <div className="profile-section">
          <div className="profile-avatar-container" style={{ textAlign: 'center', marginBottom: '20px' }}>
            <div className="profile-avatar" onClick={() => isEditing && fileInputRef.current.click()}
              style={{ cursor: isEditing ? 'pointer' : 'default', overflow: 'hidden' }}>
              {imagePreview ? (
                <img src={imagePreview} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <i className="far fa-user"></i>
              )}
            </div>
            <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleFileChange} />
          </div>

          <div className="info-list">
            <div className="info-item">
              <label>아이디</label>
              <span className="info-value" >{userInfo.username}</span>
            </div>

            <div className="info-item">
              <label>이메일</label>
              <span className="info-value email-value">{userInfo.email}</span>
            </div>

            <div className="info-item">
              <label>이름</label>
              <span className="info-value" >{userInfo.name}</span>
            </div>

            <div className="info-item">
              <label>닉네임</label>
              {isEditing ? (
                <div className="nickname-edit-container">
                  <div className="input-group" style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      name="nickname"
                      value={editData.nickname || ''}
                      onChange={handleNicknameChange}
                      className={`edit-input nickname-input ${nicknameError ? 'input-error' : ''}`}
                      placeholder="닉네임을 입력하세요"
                    />
                    <button
                      type="button"
                      className={`btn small-btn ${isNicknameChecked ? '' : 'outline-btn'}`}
                      onClick={checkNicknameDuplicate}
                      style={{
                        whiteSpace: 'nowrap',
                        backgroundColor: isNicknameChecked ? '#00d26a' : '',
                        color: isNicknameChecked ? 'white' : '',
                        borderColor: isNicknameChecked ? '#00d26a' : ''
                      }}
                    >
                      {isNicknameChecked ? "확인됨" : "중복확인"}
                    </button>
                  </div>
                  {nicknameError ? (
                    <p className="message error" style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>{nicknameError}</p>
                  ) : (
                    nicknameMessage && (
                      <p className={`message ${isNicknameChecked ? 'success' : 'error'}`} style={{ color: isNicknameChecked ? 'green' : 'orange', fontSize: '12px', marginTop: '4px' }}>
                        {nicknameMessage}
                      </p>
                    )
                  )}
                </div>
              ) : (
                <span className="info-value">{userInfo.nickname}</span>
              )}
            </div>

            <div className="info-item">
              <label>연락처</label>
              {isEditing ? (
                <div className="contact-edit-wrapper" style={{ width: '100%' }}>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <input
                      type="text"
                      name="contact"
                      value={editData.contact || ''}
                      onChange={handleChange}
                      className="edit-input"
                      placeholder="숫자만 입력"
                      disabled={isSmsSent && !isContactVerified}
                    />

                    <button
                      type="button"
                      className={`btn small-btn ${isContactVerified ? '' : 'outline-btn'}`}
                      style={{
                        backgroundColor: isContactVerified ? '#00d26a' : '',
                        color: isContactVerified ? 'white' : '',
                        borderColor: isContactVerified ? '#00d26a' : '',
                        whiteSpace: 'nowrap'
                      }}
                      onClick={handleSendSms}
                      disabled={isContactVerified}
                    >
                      {isContactVerified ? "인증완료" : (isSmsSent ? "재발송" : "인증요청")}
                    </button>
                  </div>

                  {isSmsSent && !isContactVerified && (
                    <div className="sms-verify-row" style={{ display: 'flex', gap: '8px' }}>
                      <div style={{ position: 'relative', flex: 1 }}>
                        <input
                          type="text"
                          placeholder="인증번호"
                          value={smsCode}
                          onChange={(e) => setSmsCode(e.target.value)}
                          className="edit-input"
                        />
                        <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#ff6f0f', fontSize: '12px' }}>
                          {formatTime(timeLeft)}
                        </span>
                      </div>
                      <button type="button" onClick={handleVerifySms} className="btn small-btn">확인</button>

                      <button type="button" onClick={() => {
                        setIsSmsSent(false);
                        setIsTimerActive(false);
                      }} className="btn small-btn outline-btn">취소</button>
                    </div>
                  )}
                </div>
              ) : (
                <span className="info-value">{userInfo.contact}</span>
              )}
            </div>

            <div className="info-item">
              <label>주소</label>
              {isEditing ? (
                <div className="address-section">
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <input type="text" value={editData.zipCode || ''} readOnly placeholder="우편번호" className="edit-input" style={{ width: '120px' }} />
                    <button type="button" className="btn-address-search" onClick={() => setIsPostcodeOpen(true)}>주소 검색</button>
                  </div>
                  <input type="text" value={editData.address || ''} readOnly className="edit-input" style={{ marginBottom: '8px' }} placeholder="주소를 검색해주세요" />
                  <input type="text" name="detailAddress" value={editData.detailAddress || ''} onChange={handleChange} className="edit-input" placeholder="상세주소를 입력해주세요" />

                  {isPostcodeOpen && (
                    <>
                      <div className="postcode-overlay" onClick={() => setIsPostcodeOpen(false)} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', zIndex: 1000 }} />
                      <div className="postcode-modal" style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '400px', background: '#fff', zIndex: 1001, padding: '20px', borderRadius: '8px' }}>
                        <div className="postcode-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                          <span>주소 검색</span>
                          <button type="button" onClick={() => setIsPostcodeOpen(false)}>&times;</button>
                        </div>
                        <DaumPostcode onComplete={handleComplete} style={{ width: '100%', height: '400px' }} />
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <span className="info-value">
                  {userInfo.zipCode ? `(${userInfo.zipCode}) ` : ''}
                  {userInfo.address} {userInfo.detailAddress}
                </span>
              )}
            </div>

            <div className="info-item">
              <label>동네 인증</label>
              <div className="auth-badge-area">
                {userInfo.isNeighborhoodAuthenticated ? (
                  <span className="auth-badge success" style={{ padding: '6px 10px', background: '#00d26a', color: 'white', borderRadius: '12px', fontSize: '13px', display: 'inline-block' }}>
                    <i className="fas fa-check-circle"></i> {userInfo.neighborhood} 인증됨
                  </span>
                ) : (
                  <button
                    onClick={handleNeighborhoodAuth}
                    className="auth-btn"
                    style={{ padding: '6px 12px', background: '#00D27A', color: 'white', border: 'none', borderRadius: '12px', fontSize: '15px', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    <i className="fas fa-map-marker-alt"></i> 내 동네 인증하기
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mypage-actions">
          {isEditing ? (
            <>
              <button
                className="btn-save"
                onClick={handleSave}
                disabled={!isNicknameChecked || !isContactVerified}
                style={{ opacity: (!isNicknameChecked || !isContactVerified) ? 0.6 : 1 }}
              >
                저장하기
              </button>
              <button className="btn-cancel" onClick={() => {
                setIsEditing(false);
                setEditData(userInfo);
                setNicknameError('');
                setNicknameMessage('');
                setIsNicknameChecked(true); 
                setIsContactVerified(true);
                setIsSmsSent(false);
              }}>
                취소
              </button>
            </>
          ) : (
            // 🌟 [변경점] 클릭 시 바로 수정모드로 가지 않고 비밀번호 팝업창을 엽니다!
            <button className="btn-edit" onClick={() => setIsPasswordModalOpen(true)}>
              <i className="fas fa-pen"></i> 수정하기
            </button>
          )}
        </div>
      </div>

      {/* 🌟 [추가] 비밀번호 확인 팝업창 (CSS 클래스만 사용) */}
      {isPasswordModalOpen && (
        <>
          <div className="pw-modal-overlay" onClick={() => setIsPasswordModalOpen(false)} />
          <div className="pw-modal">
            <h3 className="pw-modal-header">비밀번호 확인</h3>
            <p className="pw-modal-desc">
              안전한 정보 수정을 위해 비밀번호를 다시 한번 입력해주세요.
            </p>
            
            <input 
              type="password" 
              placeholder="비밀번호 입력" 
              className="edit-input pw-modal-input" 
              value={verifyPassword}
              onChange={(e) => {
                setVerifyPassword(e.target.value);
                setVerifyError(''); 
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') handleVerifyPassword(); 
              }}
            />
            
            {verifyError && <p className="pw-modal-error">{verifyError}</p>}
            
            <div className={`pw-modal-actions ${verifyError ? 'has-error' : ''}`}>
              <button onClick={() => setIsPasswordModalOpen(false)} className="btn-pw-cancel">
                취소
              </button>
              <button onClick={handleVerifyPassword} className="btn-pw-confirm">
                확인
              </button>
            </div>
          </div>
        </>
      )}

    </div>
  );
};

export default MyPage;