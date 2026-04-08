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

/** 카테고리 전체 목록 조회 */
export const fetchCategories = async () => {
    const response = await axios.get('/api/admin/categories', getHeader());
    return response.data;
};

/** 카테고리 등록 */
export const createCategory = async (categoryData) => {
    const response = await axios.post('/api/admin/categories', categoryData, getHeader());
    return response.data;
};

/** 카테고리 수정 */
export const updateCategory = async (categoryId, categoryData) => {
    const response = await axios.put(`/api/admin/categories/${categoryId}`, categoryData, getHeader());
    return response.data;
};

/** 카테고리 삭제 */
export const deleteCategory = async (categoryId) => {
    const response = await axios.delete(`/api/admin/categories/${categoryId}`, getHeader());
    return response.data;
};

/** 카테고리 순서 변경 */
export const updateCategoryOrder = async (orderedIds) => {
    const response = await axios.patch('/api/admin/categories/order', { orderedIds }, getHeader());
    return response.data;
};

/** 카테고리 활성/비활성 토글 */
export const toggleCategoryActive = async (categoryId) => {
    const response = await axios.patch(`/api/admin/categories/${categoryId}/toggle`, {}, getHeader());
    return response.data;
};
