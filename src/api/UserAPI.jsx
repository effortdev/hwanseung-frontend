import axios from "axios";

/** * 최신 토큰을 포함한 헤더를 반환하는 함수
 * 호출될 때마다 sessionStorage에서 최신 값을 읽어옵니다.
 */
const getHeader = () => {
    const accessToken = sessionStorage.getItem("accessToken");
    const refreshToken = sessionStorage.getItem("refreshToken");

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
    const response = await axios.get(`/api/auth/refresh`, getHeader());
    const newAccessToken = response.data;
    sessionStorage.setItem('accessToken', newAccessToken);
    return newAccessToken;
};

/** 회원조회 API */
export const fetchUser = async () => {
    const config = getHeader(); // 실행 시점의 최신 헤더 가져오기
    
    console.log("보내는 헤더 정보:", config.headers.Authorization); 
    
    const response = await axios.get(`/api/user`, config);
    console.log('fetchUser response: ', response);
    return response;
};

/** 회원수정 API */
export const updateUser = async (data) => {
    const response = await axios.put(`/api/user`, data, getHeader());
    return response.data;
};

/** 회원탈퇴 API */
export const deleteUser = async () => {
    await axios.delete(`/api/user`, getHeader());
};

// --- Axios 인터셉터 (자동 토큰 갱신 마법사) ---
axios.interceptors.response.use(
    (response) => {
        // 1. 정상적인 응답은 그냥 통과시킵니다.
        return response;
    },
    async (error) => {
        // 방금 실패한 원래의 API 요청 정보를 가져옵니다.
        const originalRequest = error.config;

        // 2. 만약 에러가 401(토큰 만료)이고, 아직 재시도를 안 한 요청이라면?
        if (error.response && error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true; // 무한 루프 방지용 꼬리표 붙이기

            try {
                console.log("토큰이 만료되었습니다. 자동 갱신을 시도합니다...");
                
                // 3. 서랍(SessionStorage)에서 Refresh Token을 꺼내서 새 토큰을 받아옵니다.
                const newAccessToken = await refreshAccessToken();
                
                // 4. 실패했던 원래 요청의 헤더에 '새로 발급받은 삐까뻔쩍한 출입증'을 달아줍니다.
                originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
                
                // 5. 아무 일 없었다는 듯이 원래 하려던 요청(예: fetchUser)을 다시 보냅니다!
                return axios(originalRequest);
                
            } catch (refreshError) {
                // 6. 만약 Refresh Token마저도 기간이 끝나서 갱신에 실패했다면?
                console.log("리프레시 토큰도 만료되었습니다. 다시 로그인해야 합니다.");
                sessionStorage.clear(); // 낡은 토큰들 싹 갖다 버리고
                window.location.href = "/"; // 로그인 페이지로 쫓아냅니다.
                return Promise.reject(refreshError);
            }
        }
        
        // 401 에러가 아니면 그냥 에러를 발생시킵니다.
        return Promise.reject(error);
    }
);