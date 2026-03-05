import api from './api';

export interface LoginParams {
  email?: string;
  phone?: string;
  password: string;
}

export interface RegisterParams {
  nickname: string;
  email?: string;
  phone?: string;
  password: string;
  code?: string;
}

export interface AuthResponse {
  user: {
    id: string;
    nickname: string;
    email?: string;
    phone?: string;
    avatar?: string;
    level: number;
    experience: number;
    dailyGoal: number;
  };
  accessToken: string;
  refreshToken: string;
}

// 后端返回的原始格式
interface BackendAuthResponse {
  user: AuthResponse['user'];
  token: string;
  refreshToken: string;
}

// 转换后端响应为前端格式
const transformAuthResponse = (data: BackendAuthResponse): AuthResponse => ({
  user: data.user,
  accessToken: data.token,
  refreshToken: data.refreshToken,
});

export const authService = {
  // 登录
  login: async (params: LoginParams): Promise<AuthResponse> => {
    const data: BackendAuthResponse = await api.post('/auth/login', params);
    return transformAuthResponse(data);
  },

  // 注册
  register: async (params: RegisterParams): Promise<AuthResponse> => {
    const data: BackendAuthResponse = await api.post('/auth/register', params);
    return transformAuthResponse(data);
  },

  // 发送验证码
  sendCode: (target: string, type: 'email' | 'phone'): Promise<void> => {
    return api.post('/auth/send-code', { target, type });
  },

  // 刷新token
  refreshToken: (refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> => {
    return api.post('/auth/refresh', { refreshToken });
  },

  // 退出登录
  logout: (): Promise<void> => {
    return api.post('/auth/logout');
  },
};
