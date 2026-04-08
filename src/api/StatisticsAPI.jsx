import axios from "axios";

const getHeader = () => {
    const accessToken = sessionStorage.getItem("accessToken");
    const refreshToken = sessionStorage.getItem("refreshToken");

    return {
        withCredentials: true,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': accessToken ? `Bearer ${accessToken}` : null,
            'REFRESH_TOKEN': refreshToken,
        }
    };
};

/** 실시간 접속자 수 */
export const fetchOnlineUsers = async () => {
    const response = await axios.get('/api/admin/statistics/online-users', getHeader());
    return response.data;
};

/** 사용자 통계 (전체 가입자, 일간/월간 신규) */
export const fetchUserStats = async () => {
    const response = await axios.get('/api/admin/statistics/users', getHeader());
    return response.data;
};

/** 거래 통계 (총 거래 수, GMV) */
export const fetchTransactionStats = async () => {
    const response = await axios.get('/api/admin/statistics/transactions', getHeader());
    return response.data;
};

/** 상품 통계 (등록 수, 카테고리별 분포, 가격 분포) */
export const fetchProductStats = async () => {
    const response = await axios.get('/api/admin/statistics/products', getHeader());
    return response.data;
};

/** 검색 & 탐색 행동 (인기 검색어, 찜 수) */
export const fetchSearchStats = async () => {
    const response = await axios.get('/api/admin/statistics/search', getHeader());
    return response.data;
};

/** 신고/신뢰 관련 (신고 건수, 차단/정지 사용자 수) */
export const fetchReportStats = async () => {
    const response = await axios.get('/api/admin/statistics/reports', getHeader());
    return response.data;
};
