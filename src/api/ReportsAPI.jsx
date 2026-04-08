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

/** 신고 목록 조회 */
export const fetchReports = async ({ page = 0, size = 10, keyword = '', status = '', type = '' }) => {
    const params = new URLSearchParams({ page, size });
    if (keyword) params.append('keyword', keyword);
    if (status) params.append('status', status);
    if (type) params.append('type', type);

    const response = await axios.get(`/api/admin/reports?${params.toString()}`, getHeader());
    return response.data;
};

/** 신고 상세 조회 */
export const fetchReportDetail = async (reportId) => {
    const response = await axios.get(`/api/admin/reports/${reportId}`, getHeader());
    return response.data;
};

/** 신고 처리 (경고) */
export const warnReportedUser = async (reportId, memo) => {
    const response = await axios.patch(`/api/admin/reports/${reportId}/warn`, { memo }, getHeader());
    return response.data;
};

/** 신고 처리 (계정 정지) */
export const suspendReportedUser = async (reportId, { days, memo }) => {
    const response = await axios.patch(`/api/admin/reports/${reportId}/suspend`, { days, memo }, getHeader());
    return response.data;
};

/** 신고 기각 */
export const dismissReport = async (reportId, memo) => {
    const response = await axios.patch(`/api/admin/reports/${reportId}/dismiss`, { memo }, getHeader());
    return response.data;
};

/** 신고된 콘텐츠 삭제 */
export const deleteReportedContent = async (reportId) => {
    const response = await axios.delete(`/api/admin/reports/${reportId}/content`, getHeader());
    return response.data;
};

/** 정지 사용자 목록 조회 */
export const fetchSuspendedUsers = async ({ page = 0, size = 10, keyword = '' }) => {
    const params = new URLSearchParams({ page, size });
    if (keyword) params.append('keyword', keyword);

    const response = await axios.get(`/api/admin/reports/suspended-users?${params.toString()}`, getHeader());
    return response.data;
};

/** 정지 해제 */
export const unsuspendUser = async (userId) => {
    const response = await axios.patch(`/api/admin/users/${userId}/status`, { status: 'ACTIVE' }, getHeader());
    return response.data;
};
