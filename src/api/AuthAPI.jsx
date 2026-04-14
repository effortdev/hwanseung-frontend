import axios from "axios";

/** * 필요할 때마다 최신 헤더를 가져오는 함수
 * (회원가입 등 토큰이 필요 없는 곳에서는 안 써도 됩니다)
 */
const getHeader = () => {
    return {
        withCredentials: true,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `${localStorage.getItem("tokenType")} ${localStorage.getItem("accessToken")}`,
        }
    };
};

/** LOGIN API */
export const login = async ({ userid, password }) => {
    // 백엔드 DTO가 userid를 사용하므로 키값을 맞췄습니다.
    const data = { userid, password }; 
    const response = await axios.post(`/api/v1/auth/login`, data);
    return response;
}

/** SIGNUP API */
export const signUp = async (values) => {
    // 🚩 여기 세 번째 인자에 getHeader() 같은 게 들어가 있지 않은지 확인!
    // 회원가입은 헤더 없이 깔끔하게 데이터만 보내야 합니다.
    const response = await axios.post(`/api/v1/auth/signup`, values); 
    return response.data;
}