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

/** 관리자 상품 목록 조회 (페이지네이션, 필터, 검색) */
export const fetchAdminProducts = async ({ page = 0, size = 10, keyword = '', status = '', category = '', sort = 'latest' }) => {
    const params = new URLSearchParams({ page, size, sort });
    if (keyword) params.append('keyword', keyword);
    if (status) params.append('status', status);
    if (category) params.append('category', category);

    const response = await axios.get(`/api/admin/products?${params.toString()}`, getHeader());
    return response.data;
};

/** 관리자 상품 상세 조회 */
export const fetchAdminProductDetail = async (productId) => {
    const response = await axios.get(`/api/admin/products/${productId}`, getHeader());
    return response.data;
};

/** 상품 승인 */
export const approveProduct = async (productId) => {
    const response = await axios.patch(`/api/admin/products/${productId}/approve`, {}, getHeader());
    return response.data;
};

/** 상품 반려 */
export const rejectProduct = async (productId, reason) => {
    const response = await axios.patch(`/api/admin/products/${productId}/reject`, { reason }, getHeader());
    return response.data;
};

/** 상품 숨김 처리 */
export const hideProduct = async (productId, reason) => {
    const response = await axios.patch(`/api/admin/products/${productId}/hide`, { reason }, getHeader());
    return response.data;
};

/** 상품 숨김 해제 */
export const unhideProduct = async (productId) => {
    const response = await axios.patch(`/api/admin/products/${productId}/unhide`, {}, getHeader());
    return response.data;
};

/** 상품 삭제 */
export const deleteAdminProduct = async (productId) => {
    const response = await axios.delete(`/api/admin/products/${productId}`, getHeader());
    return response.data;
};

/** 상품 일괄 승인 */
export const bulkApprove = async (productIds) => {
    const response = await axios.patch('/api/admin/products/bulk/approve', { productIds }, getHeader());
    return response.data;
};

/** 상품 일괄 삭제 */
export const bulkDelete = async (productIds) => {
    const response = await axios.delete('/api/admin/products/bulk', { ...getHeader(), data: { productIds } });
    return response.data;
};
