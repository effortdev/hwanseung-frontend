import axios from "axios";

/** * 최신 토큰을 포함한 헤더를 반환하는 함수
 * 호출될 때마다 localStorage에서 최신 값을 읽어옵니다.
 */
const getHeader = () => {
    const accessToken = localStorage.getItem("accessToken");
    const refreshToken = localStorage.getItem("refreshToken");

    return {
        withCredentials: true,
        headers: {
            'Content-Type': 'application/json',
            // 🚩 tokenType 변수 대신 직접 "Bearer"라고 쓰고 한 칸 띄워주세요!
            'Authorization': accessToken ? `Bearer ${accessToken}` : null,
            'REFRESH_TOKEN': refreshToken,
        }
    };
};

/** 토큰 갱신 API */
export const refreshAccessToken = async () => {
    // getHeader()를 호출하여 최신 리프레시 토큰을 실어 보냄
    const response = await axios.get(`/api/v1/auth/refresh`, getHeader());
    const newAccessToken = response.data;
    localStorage.setItem('accessToken', newAccessToken);
    return newAccessToken;
};

/** 회원조회 API */
export const fetchUser = async () => {
    const config = getHeader(); // 실행 시점의 최신 헤더 가져오기
    
    console.log("보내는 헤더 정보:", config.headers.Authorization); 
    
    const response = await axios.get(`/api/v1/user`, config);
    console.log('fetchUser response: ', response);
    return response;
};

/** 회원수정 API */
export const updateUser = async (data) => {
    const response = await axios.put(`/api/v1/user`, data, getHeader());
    return response.data;
};

/** 회원탈퇴 API */
export const deleteUser = async () => {
    await axios.delete(`/api/v1/user`, getHeader());
};