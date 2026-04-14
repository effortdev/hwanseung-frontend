import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './chargePay.css'; // 🌟 방금 만든 결제창 전용 CSS 불러오기

const ChargePay = ({ onClose }) => {
    const [balance, setBalance] = useState(0);
    const [selectedAmount, setSelectedAmount] = useState(0);
    const [userInfo, setUserInfo] = useState({ name: '', email: '', tel: '' });

    const fetchInitData = () => {
        setBalance(0); 
        setUserInfo({
            name: '테스트유저',
            email: 'test@hwanseung.com',
            tel: '010-1234-5678'
        });
    };

    useEffect(() => {
        fetchInitData();
        const { IMP } = window;
        if (IMP) {
            IMP.init('imp23534614'); // 포트원 가맹점 식별코드
        }
    }, []);

    // 💡 학생 꿀팁: 예시로 10000이 들어오면 기존 금액(prev)에 10000을 더해주는 함수입니다.
    const handleAmountClick = (amountToAdd) => {
        setSelectedAmount((prev) => prev + amountToAdd);
    };
    
    // 직접 입력 시 숫자만 골라내는 마법의 로직
    const handleCustomAmountChange = (e) => {
        const rawValue = e.target.value.replace(/[^0-9]/g, '');
        if (rawValue === '') {
            setSelectedAmount(0);
            return;
        }
        const val = parseInt(rawValue, 10);
        if (!isNaN(val) && val >= 0) setSelectedAmount(val);
    };
    
    const handleResetAmount = () => setSelectedAmount(0);

    const handleCharge = () => {
       if (selectedAmount <= 0) {
            alert("충전할 금액을 입력해주세요.");
            return;
        }
        const { IMP } = window;
        const merchant_uid = `charge-${Date.now()}`;

        IMP.request_pay({
            channelKey: 'channel-key-dace96a4-f4cc-4537-ba3d-ce418f53a3cd',
            pay_method: "card",
            merchant_uid: merchant_uid,
            name: "환승페이 충전",
            amount: selectedAmount,
            buyer_email: userInfo.email,
            buyer_name: userInfo.name,
            buyer_tel: userInfo.tel
        }, async (response) => {
            if (response.error_code != null) {
                alert(`결제 실패: ${response.error_msg}`);
                return;
            }
            verifyAndCharge(response.imp_uid, response.merchant_uid, selectedAmount);
        });
    };

    const verifyAndCharge = async (imp_uid, merchant_uid, requestedAmount) => {
        try {
            const res = await axios.post('/api/verifyCharge', {
                imp_uid: imp_uid, merchant_uid: merchant_uid, amount: requestedAmount
            });
            if (res.data === "success") {
                alert("환승페이가 성공적으로 충전되었습니다! (검증 통과)");
                setSelectedAmount(0); 
                if(onClose) onClose(); // 팝업 닫기
            } else {
                alert("결제 검증 실패 (비정상적인 결제입니다)");
            }
        } catch (error) {
            console.error("결제 검증 통신 오류:", error);
            alert("백엔드 서버(스프링부트)가 꺼져있어서 검증을 완료할 수 없습니다.");
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                
                {/* 닫기 (X) 버튼 */}
                <button className="modal-close-btn" onClick={onClose}>&times;</button>

                <div className="charge-container">
                    
                    <div className="charge-card-header">
                        <h2>환승Pay 충전</h2>
                        <span className="secure-badge">FIN-TECH SECURE</span>
                    </div>

                    {/* 잔액 블랙박스 */}
                    <div className="balance-box">
                        <p className="balance-label">현재 잔액</p>
                        <div className="balance-amount-wrap">
                            <span className="balance-amount">{balance.toLocaleString()}</span>
                            <span className="balance-currency">KRW</span>
                        </div>
                    </div>

                    {/* 금액 입력 영역 */}
                    <div className="input-section">
                        <span className="input-label">충전 금액</span>
                        <div className="custom-input-wrap">
                            <input
                                type="text"
                                value={selectedAmount === 0 ? '' : selectedAmount.toLocaleString()}
                                onChange={handleCustomAmountChange}
                                placeholder="0"
                                className="amount-input"
                            />
                            <span className="input-unit">원</span>
                        </div>

                        {/* 퀵 버튼 그룹 */}
                        <div className="quick-btn-group">
                            <button onClick={() => handleAmountClick(10000)} className="quick-btn">+1만</button>
                            <button onClick={() => handleAmountClick(50000)} className="quick-btn">+5만</button>
                            <button onClick={() => handleAmountClick(100000)} className="quick-btn">+10만</button>
                            <button onClick={() => handleAmountClick(500000)} className="quick-btn">+50만</button>
                            <button onClick={handleResetAmount} className="quick-btn reset-btn">초기화</button>
                        </div>
                    </div>

                    {/* 연결 계좌 영역 완전히 삭제됨 */}

                    {/* 충전 버튼 */}
                    <button onClick={handleCharge} className="final-charge-btn">
                        충전하기
                    </button>

                    <p className="charge-notice">
                        <span className="notice-icon">!</span>
                        충전 시 비밀번호 또는 생체인증이 필요합니다.
                    </p>

                </div>
            </div>
        </div>
    );
};

export default ChargePay;