// src/services/api.ts
import axios from "axios";
import {
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
} from "./token.service";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

// Request interceptor: Đính kèm access token vào mỗi request
api.interceptors.request.use(
  (config) => {
    const accessToken = getAccessToken();
    if (accessToken) {
      config.headers["Authorization"] = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Biến để quản lý trạng thái refresh token
let isRefreshing = false;
// Hàng đợi chứa các request bị tạm dừng
let failedQueue: Array<{
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
}> = [];

// Hàm để xử lý tất cả các request trong hàng đợi
const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response interceptor: Xử lý lỗi, đặc biệt là lỗi 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Chỉ xử lý lỗi 401 và đảm bảo không lặp lại vô hạn
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Nếu đang có một tiến trình refresh token khác chạy,
      // hãy đưa request này vào hàng đợi
      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers["Authorization"] = "Bearer " + token;
            return api(originalRequest); // Thực thi lại request với token mới
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      // Đánh dấu request này đã được thử lại
      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        isRefreshing = false;
        // Nếu không có refresh token, không thể làm gì hơn
        clearTokens();
        // Có thể thêm logic redirect về trang login ở đây
        return Promise.reject(error);
      }

      try {
        // Gửi request để lấy token mới.
        // Dùng axios gốc để tránh interceptor của instance `api` gây lặp vô hạn
        const { data } = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh-token`,
          {
            refreshToken: refreshToken,
          }
        );

        const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
          data;

        // Lưu lại token mới
        setTokens(newAccessToken, newRefreshToken || refreshToken);

        // Cập nhật header cho request gốc
        originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;

        // Xử lý hàng đợi: thực thi lại tất cả các request đã bị tạm dừng
        processQueue(null, newAccessToken);

        // Thực thi lại request gốc
        return api(originalRequest);
      } catch (refreshError: any) {
        // Nếu refresh token thất bại, từ chối tất cả request trong hàng đợi
        processQueue(refreshError, null);

        // Xóa token hỏng và đăng xuất người dùng
        clearTokens();

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
