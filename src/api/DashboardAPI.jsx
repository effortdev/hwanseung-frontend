import axios from "axios";

const getHeader = () => {
  const accessToken = sessionStorage.getItem("accessToken");
  const refreshToken = sessionStorage.getItem("refreshToken");
  return {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "X-Refresh-Token": refreshToken,
    },
  };
};

/** 주간 거래 및 가입 추이 (최근 7일) */
export const fetchWeeklyTrend = async () => {
  const response = await axios.get(
    "/api/admin/dashboard/weekly-trend",
    getHeader()
  );
  return response.data;
};

/** 대시보드 요약 카드 (진행 중 거래, 거래 완료, 미처리 신고) */
export const fetchDashboardSummary = async () => {
  const response = await axios.get(
    "/api/admin/dashboard/summary",
    getHeader()
  );
  return response.data;
};
