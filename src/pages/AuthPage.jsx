import { useState } from "react";
import { login, signUp } from "../api/AuthAPI";
import { useNavigate } from "react-router-dom";
import "./AuthPage.css"; // 기존 CSS 파일 임포트

export default function AuthPage() {
    const navigate = useNavigate();
    const [isSignUpActive, setIsSignUpActive] = useState(false);

    // 1. 상태 관리 (회원가입 & 로그인 데이터 통합)
    const [signUpValues, setSignUpValues] = useState({
        userid: "", username: "", password: "", nickname: "",
        email: "", contact: "", zipCode: "", address: "",
        detailAddress: "", birthday: "", gender: "MALE",
    });

    const [signInValues, setSignInValues] = useState({
        userid: "",
        password: "",
    });

    // 2. 핸들러 함수
    const handleSignUpChange = (e) => {
        const { id, value, name, type } = e.target;
        // 라디오 버튼(성별) 처리 포함
        const targetId = id || name;
        setSignUpValues({ ...signUpValues, [targetId]: value });
    };

    const handleSignInChange = (e) => {
        setSignInValues({ ...signInValues, [e.target.id]: e.target.value });
    };

    const onSignUpSubmit = async (e) => {
        e.preventDefault();
        signUp(signUpValues).then(() => {
            alert("회원가입이 완료되었습니다!");
            setIsSignUpActive(false); // 가입 후 로그인 화면으로 전환
        }).catch((error) => {
            console.log("회원가입 에러: ", error);
            alert("가입 중 오류가 발생했습니다.");
        });
    };

    const onSignInSubmit = async (e) => {
        e.preventDefault();
        login(signInValues).then((response) => {
            localStorage.setItem('tokenType', response.data.tokenType);
            localStorage.setItem('accessToken', response.data.accessToken);
            localStorage.setItem('refreshToken', response.data.refreshToken);
            navigate("/", { replace: true });
        }).catch((error) => {
            console.log('Login Error: ', error);
            alert("로그인 정보가 올바르지 않습니다.");
        });
    };

    return (
        <div className="auth-page-wrapper"> {/* 감싸는 태그 추가 */}
            <div className={`container ${isSignUpActive ? "right-panel-active" : ""}`} id="container">
                {/* 회원가입 영역 */}
                <div className="form-container sign-up-container">
                    <form onSubmit={onSignUpSubmit} className="scrollable-form">
                        <h2>회원가입</h2>
                        <div className="social-login">
                            <a href="#" className="social-btn"><i className="fab fa-google"></i></a>
                            <a href="#" className="social-btn"><span style={{ fontWeight: "bold" }}>K</span></a>
                            <a href="#" className="social-btn"><i className="fab fa-apple"></i></a>
                        </div>
                        <span className="sub-text">기본 정보 입력</span>
                        
                        <div className="input-group">
                            <input type="text" id="userid" placeholder="아이디" onChange={handleSignUpChange} value={signUpValues.userid} required />
                            <i className="fas fa-id-badge"></i>
                        </div>
                        <div className="input-group">
                            <input type="text" id="username" placeholder="이름(실명)" onChange={handleSignUpChange} value={signUpValues.username} required />
                            <i className="fas fa-user"></i>
                        </div>
                        <div className="input-group">
                            <input type="password" id="password" placeholder="비밀번호" onChange={handleSignUpChange} value={signUpValues.password} required />
                            <i className="fas fa-lock"></i>
                        </div>
                        <div className="input-group">
                            <input type="text" id="nickname" placeholder="별명/닉네임" onChange={handleSignUpChange} value={signUpValues.nickname} required />
                            <i className="fas fa-smile"></i>
                        </div>
                        <div className="input-group">
                            <input type="email" id="email" placeholder="이메일" onChange={handleSignUpChange} value={signUpValues.email} required />
                            <i className="fas fa-envelope"></i>
                        </div>
                        
                        <div className="input-group with-btn">
                            <div className="input-wrapper">
                                <input type="tel" id="contact" placeholder="연락처 (숫자만)" onChange={handleSignUpChange} value={signUpValues.contact} required />
                                <i className="fas fa-phone"></i>
                            </div>
                            <button type="button" className="btn small-btn outline-btn">본인인증</button>
                        </div>

                        <div className="address-group">
                            <div className="input-group with-btn">
                                <div className="input-wrapper">
                                    <input type="text" id="zipCode" placeholder="우편번호" value={signUpValues.zipCode} readOnly required />
                                    <i className="fas fa-map-marker-alt"></i>
                                </div>
                                <button type="button" className="btn small-btn">주소검색</button>
                            </div>
                            <div className="input-group">
                                <input type="text" id="address" placeholder="주소" value={signUpValues.address} readOnly required />
                                <i className="fas fa-home"></i>
                            </div>
                            <div className="input-group">
                                <input type="text" id="detailAddress" placeholder="상세주소" onChange={handleSignUpChange} value={signUpValues.detailAddress} required />
                                <i className="fas fa-building"></i>
                            </div>
                        </div>

                        <div className="input-group">
                            <input type="date" id="birthday" onChange={handleSignUpChange} value={signUpValues.birthday} required style={{ fontFamily: 'Noto Sans KR' }} />
                        </div>

                        <div className="gender-group">
                            <label className="gender-radio">
                                <input type="radio" name="gender" value="MALE" checked={signUpValues.gender === "MALE"} onChange={handleSignUpChange} /> 남성
                            </label>
                            <label className="gender-radio">
                                <input type="radio" name="gender" value="FEMALE" checked={signUpValues.gender === "FEMALE"} onChange={handleSignUpChange} /> 여성
                            </label>
                        </div>

                        <button type="submit" className="btn primary-btn">가입하기</button>
                    </form>
                </div>

                {/* 로그인 영역 */}
                <div className="form-container sign-in-container">
                    <form onSubmit={onSignInSubmit}>
                        <div className="logo"><i className="fas fa-sync-alt"></i></div>
                        <h2>로그인</h2>
                        <div className="social-login">
                            <a href="#" className="social-btn"><i className="fab fa-google"></i></a>
                            <a href="#" className="social-btn">K</a>
                            <a href="#" className="social-btn"><i className="fab fa-apple"></i></a>
                        </div>
                        <span className="sub-text">또는 이메일 계정으로 로그인하세요</span>
                        
                        <div className="input-group">
                            <input type="text" id="userid" placeholder="아이디" onChange={handleSignInChange} value={signInValues.userid} required />
                            <i className="fas fa-id-badge"></i>
                        </div>
                        <div className="input-group">
                            <input type="password" id="password" placeholder="비밀번호" onChange={handleSignInChange} value={signInValues.password} required />
                            <i className="fas fa-lock"></i>
                        </div>
                        
                        <a href="#" className="footer-link">비밀번호를 잊으셨나요?</a>
                        <button type="submit" className="btn primary-btn" style={{ marginTop: "20px" }}>로그인</button>
                    </form>
                </div>

                {/* 오버레이 (전환 애니메이션) */}
                <div className="overlay-container">
                    <div className="overlay">
                        <div className="overlay-panel overlay-left">
                            <h1>다시 찾아주셔서 <br/>감사합니다!</h1>
                            <p>쓰던 물건을 가치 있게,<br/>새로운 주인에게 환승하세요.</p>
                            <button className="btn ghost" onClick={() => setIsSignUpActive(false)}>로그인</button>
                        </div>
                        <div className="overlay-panel overlay-right">
                            <h1>처음이신가요?</h1>
                            <p>안전하고 빠른 중고거래 플랫폼,<br/>환승마켓에 가입해보세요.</p>
                            <button className="btn ghost" onClick={() => setIsSignUpActive(true)}>회원가입</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}