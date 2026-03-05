import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

interface User {
  id: string;
  nickname: string;
  email?: string;
  phone?: string;
  avatar?: string;
  role?: string;
  level: number;
  experience: number;
  dailyGoal: number;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthActions {
  setUser: (user: User) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  login: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    immer((set) => ({
      // 状态
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,

      // 操作
      setUser: (user) =>
        set((state) => {
          state.user = user;
        }),

      setTokens: (accessToken, refreshToken) =>
        set((state) => {
          state.accessToken = accessToken;
          state.refreshToken = refreshToken;
        }),

      login: (user, accessToken, refreshToken) =>
        set((state) => {
          state.user = user;
          state.accessToken = accessToken;
          state.refreshToken = refreshToken;
          state.isAuthenticated = true;
        }),

      logout: () =>
        set((state) => {
          state.user = null;
          state.accessToken = null;
          state.refreshToken = null;
          state.isAuthenticated = false;
        }),

      updateUser: (updates) =>
        set((state) => {
          if (state.user) {
            Object.assign(state.user, updates);
          }
        }),

      setLoading: (loading) =>
        set((state) => {
          state.isLoading = loading;
        }),
    })),
    {
      name: 'boomword-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);