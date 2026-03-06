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
    role?: string;
    level: number;
    experience: number;
    dailyGoal: number;
  };
  accessToken: string;
  refreshToken: string;
}

// 后端返回的原始格式
interface BackendAuthResponse {
  user: {
    id: string;
    nickname: string;
    email?: string;
    phone?: string;
    avatar?: string;
    role?: string;
    level: number;
    exp: number;
  };
  token: string;
  refreshToken: string;
}

// 转换后端响应为前端格式
const transformAuthResponse = (data: BackendAuthResponse): AuthResponse => ({
  user: {
    id: data.user.id,
    nickname: data.user.nickname,
    email: data.user.email,
    phone: data.user.phone,
    avatar: data.user.avatar,
    role: data.user.role,
    level: data.user.level,
    experience: data.user.exp || 0,
    dailyGoal: 20,
  },
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