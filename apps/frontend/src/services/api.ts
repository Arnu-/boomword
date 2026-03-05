import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/stores/authStore';

// 创建axios实例
const api = axios.create({
  baseURL: '/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const { accessToken } = useAuthStore.getState();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    // 后端返回格式: { success, code, message, data, ... }
    // 提取 data 字段返回
    return response.data?.data ?? response.data;
  },
  async (error: AxiosError<{ message: string; statusCode: number; errors?: string[] }>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // 401错误处理 - token过期
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const { refreshToken, setTokens, logout } = useAuthStore.getState();

      if (refreshToken) {
        try {
          const response = await axios.post('/api/v1/auth/refresh', {
            refreshToken,
          });

          const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data;
          setTokens(newAccessToken, newRefreshToken);

          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          logout();
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      } else {
        logout();
        window.location.href = '/login';
      }
    }

    // 统一错误处理 - 优先显示详细错误列表
    const responseData = error.response?.data;
    let errorMessage = '网络错误，请稍后重试';
    if (responseData?.errors && responseData.errors.length > 0) {
      errorMessage = responseData.errors.join('；');
    } else if (responseData?.message) {
      errorMessage = responseData.message;
    }
    return Promise.reject(new Error(errorMessage));
  },
);

export default api;
