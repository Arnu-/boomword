import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { Spin } from 'antd';
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';
import { useAuthStore } from './stores/authStore';

// 懒加载页面组件
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const HomePage = lazy(() => import('./pages/home/HomePage'));
const WordBankPage = lazy(() => import('./pages/wordbank/WordBankPage'));
const WordBankDetailPage = lazy(() => import('./pages/wordbank/WordBankDetailPage'));
const GamePage = lazy(() => import('./pages/game/GamePage'));
const GameResultPage = lazy(() => import('./pages/game/GameResultPage'));
const LearningPage = lazy(() => import('./pages/learning/LearningPage'));
const RankingPage = lazy(() => import('./pages/ranking/RankingPage'));
const AchievementPage = lazy(() => import('./pages/achievement/AchievementPage'));
const ProfilePage = lazy(() => import('./pages/profile/ProfilePage'));
const WrongBookPage = lazy(() => import('./pages/learning/WrongBookPage'));
const FriendsPage = lazy(() => import('./pages/friends/FriendsPage'));
const ChallengePage = lazy(() => import('./pages/challenge/ChallengePage'));
const SettingsPage = lazy(() => import('./pages/settings/SettingsPage'));

// 加载组件
const PageLoading = () => (
  <div className="h-screen w-screen flex items-center justify-center">
    <Spin size="large" tip="加载中..." />
  </div>
);

// 路由守卫
const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoading />}>
        <Routes>
          {/* 认证路由 */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>

          {/* 主应用路由 */}
          <Route
            element={
              <PrivateRoute>
                <MainLayout />
              </PrivateRoute>
            }
          >
            <Route path="/" element={<HomePage />} />
            <Route path="/wordbanks" element={<WordBankPage />} />
            <Route path="/wordbanks/:id" element={<WordBankDetailPage />} />
            <Route path="/learning" element={<LearningPage />} />
            <Route path="/wrongbook" element={<WrongBookPage />} />
            <Route path="/ranking" element={<RankingPage />} />
            <Route path="/achievements" element={<AchievementPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/friends" element={<FriendsPage />} />
            <Route path="/challenge" element={<ChallengePage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>

          {/* 游戏路由（全屏） */}
          <Route
            path="/game/:sectionId"
            element={
              <PrivateRoute>
                <GamePage />
              </PrivateRoute>
            }
          />
          <Route
            path="/game/result/:recordId"
            element={
              <PrivateRoute>
                <GameResultPage />
              </PrivateRoute>
            }
          />

          {/* 404 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;