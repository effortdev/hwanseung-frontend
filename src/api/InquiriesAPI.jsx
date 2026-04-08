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

/** 문의 목록 조회 (페이지네이션, 검색, 필터) */
export const fetchInquiries = async ({ page = 0, size = 10, keyword = '', status = '', category = '' }) => {
    const params = new URLSearchParams({ page, size });
    if (keyword) params.append('keyword', keyword);
    if (status) params.append('status', status);
    if (category) params.append('category', category);

    const response = await axios.get(`/api/admin/inquiries?${params.toString()}`, getHeader());
    return response.data;
};

/** 문의 상세 조회 */
export const fetchInquiryDetail = async (inquiryId) => {
    const response = await axios.get(`/api/admin/inquiries/${inquiryId}`, getHeader());
    return response.data;
};

/** 답변 등록 */
export const submitAnswer = async (inquiryId, answerContent) => {
    const response = await axios.post(`/api/admin/inquiries/${inquiryId}/answer`, { content: answerContent }, getHeader());
    return response.data;
};

/** 답변 수정 */
export const updateAnswer = async (inquiryId, answerId, answerContent) => {
    const response = await axios.put(`/api/admin/inquiries/${inquiryId}/answer/${answerId}`, { content: answerContent }, getHeader());
    return response.data;
};

/** 문의 상태 변경 */
export const updateInquiryStatus = async (inquiryId, status) => {
    const response = await axios.patch(`/api/admin/inquiries/${inquiryId}/status`, { status }, getHeader());
    return response.data;
};

/** 문의 삭제 */
export const deleteInquiry = async (inquiryId) => {
    const response = await axios.delete(`/api/admin/inquiries/${inquiryId}`, getHeader());
    return response.data;
};
