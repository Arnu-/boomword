# 前端架构设计

## 1. 技术栈总览

### 1.1 核心技术栈

```
┌─────────────────────────────────────────────────────────────┐
│                      前端技术栈                              │
├─────────────────────────────────────────────────────────────┤
│  框架层:     React 18 + TypeScript 5                        │
│  构建工具:   Vite 5                                         │
│  状态管理:   Zustand 4                                      │
│  路由:      React Router 6                                  │
│  UI组件:    Ant Design 5 + TailwindCSS 3                   │
│  游戏引擎:   PixiJS 7 + @pixi/react                        │
│  HTTP:      Axios + React Query                            │
│  动画:      Framer Motion                                  │
│  音频:      Howler.js                                      │
│  测试:      Vitest + React Testing Library                 │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 依赖版本

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.22.0",
    "zustand": "^4.5.0",
    "@tanstack/react-query": "^5.20.0",
    "axios": "^1.6.0",
    "antd": "^5.14.0",
    "pixi.js": "^7.4.0",
    "@pixi/react": "^7.1.0",
    "framer-motion": "^11.0.0",
    "howler": "^2.2.4",
    "dayjs": "^1.11.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "vite": "^5.1.0",
    "@vitejs/plugin-react": "^4.2.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0",
    "eslint": "^8.56.0",
    "prettier": "^3.2.0",
    "vitest": "^1.2.0",
    "@testing-library/react": "^14.2.0"
  }
}
```

---

## 2. 项目结构

### 2.1 目录结构

```
src/
├── app/                          # 应用入口
│   ├── App.tsx                   # 根组件
│   ├── router.tsx                # 路由配置
│   └── providers.tsx             # Provider组合
│
├── assets/                       # 静态资源
│   ├── images/                   # 图片
│   ├── sounds/                   # 音效
│   └── fonts/                    # 字体
│
├── components/                   # 通用组件
│   ├── ui/                       # 基础UI组件
│   │   ├── Button/
│   │   ├── Modal/
│   │   ├── Input/
│   │   └── index.ts
│   ├── layout/                   # 布局组件
│   │   ├── Header/
│   │   ├── Footer/
│   │   ├── Sidebar/
│   │   └── PageContainer/
│   └── common/                   # 通用业务组件
│       ├── StarRating/
│       ├── ProgressBar/
│       ├── Avatar/
│       └── Loading/
│
├── features/                     # 功能模块
│   ├── auth/                     # 认证模块
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── store/
│   │   └── types/
│   ├── game/                     # 游戏模块
│   │   ├── components/
│   │   │   ├── GameCanvas/
│   │   │   ├── Bubble/
│   │   │   ├── InputBox/
│   │   │   ├── ScoreBoard/
│   │   │   ├── Timer/
│   │   │   └── ComboDisplay/
│   │   ├── hooks/
│   │   │   ├── useGameLoop.ts
│   │   │   ├── useKeyboard.ts
│   │   │   └── useBubbles.ts
│   │   ├── engine/
│   │   │   ├── GameEngine.ts
│   │   │   ├── BubbleManager.ts
│   │   │   └── ScoreCalculator.ts
│   │   ├── store/
│   │   └── types/
│   ├── wordbank/                 # 词库模块
│   ├── level/                    # 关卡模块
│   ├── ranking/                  # 排行榜模块
│   ├── achievement/              # 成就模块
│   ├── learning/                 # 学习统计模块
│   ├── profile/                  # 个人中心模块
│   └── admin/                    # 后台管理模块
│
├── pages/                        # 页面组件
│   ├── HomePage/
│   ├── LoginPage/
│   ├── RegisterPage/
│   ├── WordBankPage/
│   ├── LevelSelectPage/
│   ├── GamePage/
│   ├── ResultPage/
│   ├── RankingPage/
│   ├── ProfilePage/
│   ├── WrongBookPage/
│   └── admin/
│       ├── DashboardPage/
│       ├── WordManagePage/
│       └── UserManagePage/
│
├── hooks/                        # 全局Hooks
│   ├── useAuth.ts
│   ├── useLocalStorage.ts
│   ├── useDebounce.ts
│   └── useMediaQuery.ts
│
├── services/                     # API服务
│   ├── api/
│   │   ├── client.ts             # Axios实例
│   │   ├── auth.ts
│   │   ├── user.ts
│   │   ├── wordbank.ts
│   │   ├── level.ts
│   │   ├── game.ts
│   │   └── ranking.ts
│   └── index.ts
│
├── stores/                       # 全局状态
│   ├── authStore.ts
│   ├── userStore.ts
│   ├── gameStore.ts
│   └── settingsStore.ts
│
├── styles/                       # 样式文件
│   ├── globals.css
│   ├── tailwind.css
│   └── variables.css
│
├── types/                        # 类型定义
│   ├── api.ts
│   ├── user.ts
│   ├── game.ts
│   ├── word.ts
│   └── index.ts
│
├── utils/                        # 工具函数
│   ├── format.ts
│   ├── validation.ts
│   ├── storage.ts
│   └── constants.ts
│
├── config/                       # 配置文件
│   ├── env.ts
│   └── game.ts
│
└── main.tsx                      # 入口文件
```

---

## 3. 状态管理

### 3.1 Zustand Store 设计

```typescript
// stores/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  nickname: string;
  avatar: string;
  level: number;
  exp: number;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  
  // Actions
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setAuth: (user, token) =>
        set({ user, token, isAuthenticated: true }),

      logout: () =>
        set({ user: null, token: null, isAuthenticated: false }),

      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
      }),
    }
  )
);
```

```typescript
// stores/gameStore.ts
import { create } from 'zustand';

interface Bubble {
  id: string;
  word: string;
  chinese: string;
  x: number;
  y: number;
  difficulty: number;
  isMatched: boolean;
}

interface GameState {
  // 游戏状态
  status: 'idle' | 'countdown' | 'playing' | 'paused' | 'finished';
  mode: 'practice' | 'challenge' | 'speed';
  
  // 游戏数据
  bubbles: Bubble[];
  currentInput: string;
  score: number;
  combo: number;
  maxCombo: number;
  correctCount: number;
  wrongCount: number;
  
  // 计时
  timeLimit: number;
  timeRemaining: number;
  
  // Actions
  startGame: (bubbles: Bubble[], mode: string, timeLimit: number) => void;
  pauseGame: () => void;
  resumeGame: () => void;
  finishGame: () => void;
  setInput: (input: string) => void;
  submitAnswer: () => { success: boolean; points: number };
  removeBubble: (id: string) => void;
  updateTime: (time: number) => void;
  resetGame: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  status: 'idle',
  mode: 'practice',
  bubbles: [],
  currentInput: '',
  score: 0,
  combo: 0,
  maxCombo: 0,
  correctCount: 0,
  wrongCount: 0,
  timeLimit: 0,
  timeRemaining: 0,

  startGame: (bubbles, mode, timeLimit) =>
    set({
      status: 'countdown',
      mode,
      bubbles,
      timeLimit,
      timeRemaining: timeLimit,
      currentInput: '',
      score: 0,
      combo: 0,
      maxCombo: 0,
      correctCount: 0,
      wrongCount: 0,
    }),

  pauseGame: () => set({ status: 'paused' }),

  resumeGame: () => set({ status: 'playing' }),

  finishGame: () => set({ status: 'finished' }),

  setInput: (input) => set({ currentInput: input }),

  submitAnswer: () => {
    const state = get();
    const input = state.currentInput.toLowerCase().trim();
    
    // 查找匹配的泡泡
    const matchedBubble = state.bubbles.find(
      (b) => b.word.toLowerCase() === input && !b.isMatched
    );

    if (matchedBubble) {
      // 计算得分
      const baseScore = matchedBubble.difficulty * 10;
      const comboBonus = Math.min(state.combo * 0.1, 1) * baseScore;
      const points = Math.floor(baseScore + comboBonus);
      
      const newCombo = state.combo + 1;
      
      set({
        bubbles: state.bubbles.map((b) =>
          b.id === matchedBubble.id ? { ...b, isMatched: true } : b
        ),
        currentInput: '',
        score: state.score + points,
        combo: newCombo,
        maxCombo: Math.max(state.maxCombo, newCombo),
        correctCount: state.correctCount + 1,
      });
      
      return { success: true, points };
    } else {
      set({
        currentInput: '',
        combo: 0,
        wrongCount: state.wrongCount + 1,
      });
      
      return { success: false, points: 0 };
    }
  },

  removeBubble: (id) =>
    set((state) => ({
      bubbles: state.bubbles.filter((b) => b.id !== id),
    })),

  updateTime: (time) =>
    set({ timeRemaining: time }),

  resetGame: () =>
    set({
      status: 'idle',
      bubbles: [],
      currentInput: '',
      score: 0,
      combo: 0,
      maxCombo: 0,
      correctCount: 0,
      wrongCount: 0,
      timeLimit: 0,
      timeRemaining: 0,
    }),
}));
```

### 3.2 状态管理分层

```
┌─────────────────────────────────────────────────────────────┐
│                      状态管理架构                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐                                       │
│  │   服务端状态    │  React Query                          │
│  │  (Server State) │  - 词库数据                           │
│  │                 │  - 排行榜数据                         │
│  │                 │  - 用户信息                           │
│  └─────────────────┘                                       │
│           │                                                 │
│           ▼                                                 │
│  ┌─────────────────┐                                       │
│  │   客户端状态    │  Zustand                              │
│  │ (Client State)  │  - 认证状态                           │
│  │                 │  - 游戏状态                           │
│  │                 │  - 设置偏好                           │
│  └─────────────────┘                                       │
│           │                                                 │
│           ▼                                                 │
│  ┌─────────────────┐                                       │
│  │    组件状态     │  useState/useReducer                  │
│  │(Component State)│  - UI状态                             │
│  │                 │  - 表单状态                           │
│  │                 │  - 临时状态                           │
│  └─────────────────┘                                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. 路由设计

### 4.1 路由配置

```typescript
// app/router.tsx
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { AuthGuard } from '@/components/guards/AuthGuard';
import { AdminGuard } from '@/components/guards/AdminGuard';
import { Loading } from '@/components/common/Loading';

// 懒加载页面组件
const HomePage = lazy(() => import('@/pages/HomePage'));
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/RegisterPage'));
const WordBankPage = lazy(() => import('@/pages/WordBankPage'));
const LevelSelectPage = lazy(() => import('@/pages/LevelSelectPage'));
const GamePage = lazy(() => import('@/pages/GamePage'));
const ResultPage = lazy(() => import('@/pages/ResultPage'));
const RankingPage = lazy(() => import('@/pages/RankingPage'));
const ProfilePage = lazy(() => import('@/pages/ProfilePage'));
const WrongBookPage = lazy(() => import('@/pages/WrongBookPage'));
const AchievementPage = lazy(() => import('@/pages/AchievementPage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));

// 后台页面
const AdminDashboard = lazy(() => import('@/pages/admin/DashboardPage'));
const AdminWordManage = lazy(() => import('@/pages/admin/WordManagePage'));
const AdminUserManage = lazy(() => import('@/pages/admin/UserManagePage'));

// 懒加载包装
const LazyLoad = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<Loading fullscreen />}>{children}</Suspense>
);

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <LazyLoad><HomePage /></LazyLoad>,
      },
      {
        path: 'login',
        element: <LazyLoad><LoginPage /></LazyLoad>,
      },
      {
        path: 'register',
        element: <LazyLoad><RegisterPage /></LazyLoad>,
      },
      {
        path: 'wordbank',
        element: <AuthGuard><LazyLoad><WordBankPage /></LazyLoad></AuthGuard>,
      },
      {
        path: 'wordbank/:bankId/levels',
        element: <AuthGuard><LazyLoad><LevelSelectPage /></LazyLoad></AuthGuard>,
      },
      {
        path: 'game/:sectionId',
        element: <AuthGuard><LazyLoad><GamePage /></LazyLoad></AuthGuard>,
      },
      {
        path: 'result/:recordId',
        element: <AuthGuard><LazyLoad><ResultPage /></LazyLoad></AuthGuard>,
      },
      {
        path: 'ranking',
        element: <LazyLoad><RankingPage /></LazyLoad>,
      },
      {
        path: 'profile',
        element: <AuthGuard><LazyLoad><ProfilePage /></LazyLoad></AuthGuard>,
      },
      {
        path: 'wrongbook',
        element: <AuthGuard><LazyLoad><WrongBookPage /></LazyLoad></AuthGuard>,
      },
      {
        path: 'achievements',
        element: <AuthGuard><LazyLoad><AchievementPage /></LazyLoad></AuthGuard>,
      },
      {
        path: 'settings',
        element: <AuthGuard><LazyLoad><SettingsPage /></LazyLoad></AuthGuard>,
      },
    ],
  },
  {
    path: '/admin',
    element: <AdminGuard><AdminLayout /></AdminGuard>,
    children: [
      {
        index: true,
        element: <Navigate to="/admin/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <LazyLoad><AdminDashboard /></LazyLoad>,
      },
      {
        path: 'words',
        element: <LazyLoad><AdminWordManage /></LazyLoad>,
      },
      {
        path: 'users',
        element: <LazyLoad><AdminUserManage /></LazyLoad>,
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
```

### 4.2 路由表

| 路径 | 页面 | 权限 | 说明 |
|------|------|------|------|
| `/` | HomePage | 公开 | 首页 |
| `/login` | LoginPage | 公开 | 登录 |
| `/register` | RegisterPage | 公开 | 注册 |
| `/wordbank` | WordBankPage | 登录 | 词库列表 |
| `/wordbank/:id/levels` | LevelSelectPage | 登录 | 关卡选择 |
| `/game/:sectionId` | GamePage | 登录 | 游戏页面 |
| `/result/:recordId` | ResultPage | 登录 | 结算页面 |
| `/ranking` | RankingPage | 公开 | 排行榜 |
| `/profile` | ProfilePage | 登录 | 个人中心 |
| `/wrongbook` | WrongBookPage | 登录 | 错词本 |
| `/achievements` | AchievementPage | 登录 | 成就 |
| `/settings` | SettingsPage | 登录 | 设置 |
| `/admin/*` | AdminPages | 管理员 | 后台管理 |

---

## 5. 游戏引擎设计

### 5.1 PixiJS 集成架构

```
┌─────────────────────────────────────────────────────────────┐
│                      游戏引擎架构                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                  React 组件层                        │   │
│  │  GamePage → GameCanvas → PixiJS Stage              │   │
│  └─────────────────────────────────────────────────────┘   │
│                          │                                  │
│                          ▼                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                  游戏逻辑层                          │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐           │   │
│  │  │GameEngine│ │BubbleMgr │ │ScoreCalc │           │   │
│  │  └──────────┘ └──────────┘ └──────────┘           │   │
│  └─────────────────────────────────────────────────────┘   │
│                          │                                  │
│                          ▼                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                  渲染层 (PixiJS)                     │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐           │   │
│  │  │Container │ │Sprite    │ │Text      │           │   │
│  │  │Graphics  │ │AnimSprite│ │BitmapText│           │   │
│  │  └──────────┘ └──────────┘ └──────────┘           │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 游戏组件实现

```typescript
// features/game/components/GameCanvas/GameCanvas.tsx
import { useRef, useEffect, useCallback } from 'react';
import { Stage, Container, useTick } from '@pixi/react';
import { useGameStore } from '@/stores/gameStore';
import { Bubble } from '../Bubble';
import { Background } from '../Background';
import { useGameLoop } from '../../hooks/useGameLoop';

interface GameCanvasProps {
  width: number;
  height: number;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ width, height }) => {
  const { bubbles, status } = useGameStore();
  
  return (
    <Stage
      width={width}
      height={height}
      options={{
        backgroundColor: 0x1a1a2e,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
      }}
    >
      <Background width={width} height={height} />
      <Container>
        {bubbles.map((bubble) => (
          <Bubble
            key={bubble.id}
            {...bubble}
            isPlaying={status === 'playing'}
          />
        ))}
      </Container>
    </Stage>
  );
};
```

```typescript
// features/game/components/Bubble/Bubble.tsx
import { useState, useEffect, useCallback } from 'react';
import { Container, Graphics, Text } from '@pixi/react';
import { TextStyle } from 'pixi.js';
import { useTick } from '@pixi/react';
import { gsap } from 'gsap';

interface BubbleProps {
  id: string;
  word: string;
  chinese: string;
  x: number;
  y: number;
  difficulty: number;
  isMatched: boolean;
  isHighlighted: boolean;
  isPlaying: boolean;
  showChinese: boolean;
  showEnglish: boolean;
  onExplode: (id: string) => void;
}

// 难度对应颜色
const DIFFICULTY_COLORS: Record<number, number> = {
  1: 0x4ade80, // 绿色
  2: 0x60a5fa, // 蓝色
  3: 0xfbbf24, // 黄色
  4: 0xfb923c, // 橙色
  5: 0xf87171, // 红色
};

// 难度对应大小
const DIFFICULTY_SIZES: Record<number, number> = {
  1: 50,
  2: 60,
  3: 70,
  4: 80,
  5: 90,
};

export const Bubble: React.FC<BubbleProps> = ({
  id,
  word,
  chinese,
  x,
  y,
  difficulty,
  isMatched,
  isHighlighted,
  isPlaying,
  showChinese,
  showEnglish,
  onExplode,
}) => {
  const [position, setPosition] = useState({ x, y });
  const [scale, setScale] = useState(1);
  const [alpha, setAlpha] = useState(1);
  const [isExploding, setIsExploding] = useState(false);

  const radius = DIFFICULTY_SIZES[difficulty] || 60;
  const color = DIFFICULTY_COLORS[difficulty] || 0x60a5fa;

  // 浮动动画
  useTick((delta) => {
    if (!isPlaying || isMatched) return;
    
    // 缓慢上下浮动
    setPosition((prev) => ({
      x: prev.x + Math.sin(Date.now() / 1000 + x) * 0.3,
      y: prev.y + Math.cos(Date.now() / 800 + y) * 0.2,
    }));
  });

  // 匹配成功爆炸动画
  useEffect(() => {
    if (isMatched && !isExploding) {
      setIsExploding(true);
      // 爆炸动画
      gsap.to({ scale: 1, alpha: 1 }, {
        scale: 1.5,
        alpha: 0,
        duration: 0.3,
        onUpdate: function() {
          setScale(this.targets()[0].scale);
          setAlpha(this.targets()[0].alpha);
        },
        onComplete: () => {
          onExplode(id);
        },
      });
    }
  }, [isMatched, isExploding, id, onExplode]);

  const drawBubble = useCallback((g: any) => {
    g.clear();
    
    // 高亮边框
    if (isHighlighted) {
      g.lineStyle(4, 0xffffff, 0.8);
    }
    
    // 泡泡主体
    g.beginFill(color, 0.8);
    g.drawCircle(0, 0, radius);
    g.endFill();
    
    // 高光效果
    g.beginFill(0xffffff, 0.3);
    g.drawEllipse(-radius * 0.3, -radius * 0.3, radius * 0.3, radius * 0.2);
    g.endFill();
  }, [color, radius, isHighlighted]);

  const englishStyle = new TextStyle({
    fontFamily: 'Arial',
    fontSize: Math.min(radius * 0.4, 24),
    fill: '#ffffff',
    fontWeight: 'bold',
  });

  const chineseStyle = new TextStyle({
    fontFamily: 'Microsoft YaHei',
    fontSize: Math.min(radius * 0.3, 16),
    fill: '#ffffff',
  });

  return (
    <Container
      x={position.x}
      y={position.y}
      scale={scale}
      alpha={alpha}
    >
      <Graphics draw={drawBubble} />
      
      {showEnglish && (
        <Text
          text={word}
          style={englishStyle}
          anchor={0.5}
          y={showChinese ? -10 : 0}
        />
      )}
      
      {showChinese && (
        <Text
          text={chinese}
          style={chineseStyle}
          anchor={0.5}
          y={showEnglish ? 15 : 0}
        />
      )}
    </Container>
  );
};
```

### 5.3 游戏循环 Hook

```typescript
// features/game/hooks/useGameLoop.ts
import { useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '@/stores/gameStore';

export const useGameLoop = () => {
  const animationRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);
  
  const {
    status,
    timeRemaining,
    timeLimit,
    updateTime,
    finishGame,
    bubbles,
  } = useGameStore();

  // 游戏主循环
  const gameLoop = useCallback((timestamp: number) => {
    if (status !== 'playing') return;

    const deltaTime = timestamp - lastTimeRef.current;
    
    if (deltaTime >= 1000) {
      lastTimeRef.current = timestamp;
      
      // 更新计时
      if (timeLimit > 0) {
        const newTime = Math.max(0, timeRemaining - 1);
        updateTime(newTime);
        
        // 时间耗尽
        if (newTime <= 0) {
          finishGame();
          return;
        }
      }
    }

    // 检查是否所有泡泡都已消除
    const remainingBubbles = bubbles.filter((b) => !b.isMatched);
    if (remainingBubbles.length === 0) {
      finishGame();
      return;
    }

    animationRef.current = requestAnimationFrame(gameLoop);
  }, [status, timeRemaining, timeLimit, updateTime, finishGame, bubbles]);

  // 启动/停止游戏循环
  useEffect(() => {
    if (status === 'playing') {
      lastTimeRef.current = performance.now();
      animationRef.current = requestAnimationFrame(gameLoop);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [status, gameLoop]);

  return {
    isRunning: status === 'playing',
  };
};
```

### 5.4 键盘输入 Hook

```typescript
// features/game/hooks/useKeyboard.ts
import { useEffect, useCallback } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { useAudio } from '@/hooks/useAudio';

export const useKeyboard = () => {
  const { status, currentInput, setInput, submitAnswer, pauseGame } = useGameStore();
  const { playSound } = useAudio();

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (status !== 'playing') return;

    const { key } = event;

    // ESC 暂停
    if (key === 'Escape') {
      pauseGame();
      return;
    }

    // 回车提交
    if (key === 'Enter') {
      if (currentInput.trim()) {
        const result = submitAnswer();
        if (result.success) {
          playSound('correct');
        } else {
          playSound('wrong');
        }
      }
      return;
    }

    // 退格删除
    if (key === 'Backspace') {
      setInput(currentInput.slice(0, -1));
      playSound('type');
      return;
    }

    // 字母输入
    if (/^[a-zA-Z]$/.test(key)) {
      setInput(currentInput + key.toLowerCase());
      playSound('type');
    }
  }, [status, currentInput, setInput, submitAnswer, pauseGame, playSound]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return {
    currentInput,
    clearInput: () => setInput(''),
  };
};
```

---

## 6. API 服务层

### 6.1 Axios 客户端配置

```typescript
// services/api/client.ts
import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/stores/authStore';
import { message } from 'antd';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response.data;
  },
  (error: AxiosError<{ code: string; message: string }>) => {
    const { response } = error;
    
    if (response) {
      switch (response.status) {
        case 401:
          // Token过期，清除认证状态
          useAuthStore.getState().logout();
          window.location.href = '/login';
          break;
        case 403:
          message.error('没有权限访问');
          break;
        case 404:
          message.error('资源不存在');
          break;
        case 500:
          message.error('服务器错误，请稍后重试');
          break;
        default:
          message.error(response.data?.message || '请求失败');
      }
    } else {
      message.error('网络错误，请检查网络连接');
    }
    
    return Promise.reject(error);
  }
);
```

### 6.2 API 服务示例

```typescript
// services/api/auth.ts
import { apiClient } from './client';

export interface LoginRequest {
  phone?: string;
  email?: string;
  password: string;
}

export interface RegisterRequest {
  phone?: string;
  email?: string;
  password: string;
  nickname: string;
  code: string;
}

export interface AuthResponse {
  user: {
    id: string;
    nickname: string;
    avatar: string;
    level: number;
    exp: number;
  };
  token: string;
  refreshToken: string;
}

export const authApi = {
  // 登录
  login: (data: LoginRequest): Promise<AuthResponse> =>
    apiClient.post('/auth/login', data),

  // 注册
  register: (data: RegisterRequest): Promise<AuthResponse> =>
    apiClient.post('/auth/register', data),

  // 发送验证码
  sendCode: (phone: string): Promise<void> =>
    apiClient.post('/auth/send-code', { phone }),

  // 刷新Token
  refreshToken: (refreshToken: string): Promise<{ token: string }> =>
    apiClient.post('/auth/refresh', { refreshToken }),

  // 登出
  logout: (): Promise<void> =>
    apiClient.post('/auth/logout'),
};
```

```typescript
// services/api/game.ts
import { apiClient } from './client';

export interface GameStartRequest {
  sectionId: string;
  mode: 'practice' | 'challenge' | 'speed';
}

export interface GameStartResponse {
  sessionId: string;
  words: Array<{
    id: string;
    english: string;
    chinese: string;
    difficulty: number;
  }>;
  timeLimit: number;
}

export interface GameSubmitRequest {
  sessionId: string;
  score: number;
  correctCount: number;
  wrongCount: number;
  maxCombo: number;
  timeUsed: number;
  wordResults: Array<{
    wordId: string;
    correct: boolean;
    inputTime: number;
  }>;
}

export interface GameResultResponse {
  recordId: string;
  stars: number;
  score: number;
  expGained: number;
  isNewRecord: boolean;
  achievements: Array<{
    id: string;
    name: string;
    icon: string;
  }>;
}

export const gameApi = {
  // 开始游戏
  start: (data: GameStartRequest): Promise<GameStartResponse> =>
    apiClient.post('/game/start', data),

  // 提交结果
  submit: (data: GameSubmitRequest): Promise<GameResultResponse> =>
    apiClient.post('/game/submit', data),

  // 获取游戏记录
  getRecord: (recordId: string): Promise<any> =>
    apiClient.get(`/game/records/${recordId}`),
};
```

### 6.3 React Query 集成

```typescript
// features/wordbank/hooks/useWordBanks.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { wordBankApi } from '@/services/api/wordbank';

export const useWordBanks = (categoryId?: string) => {
  return useQuery({
    queryKey: ['wordbanks', categoryId],
    queryFn: () => wordBankApi.getList({ categoryId }),
    staleTime: 5 * 60 * 1000, // 5分钟
  });
};

export const useWordBankDetail = (bankId: string) => {
  return useQuery({
    queryKey: ['wordbank', bankId],
    queryFn: () => wordBankApi.getDetail(bankId),
    enabled: !!bankId,
  });
};

export const useWordBankProgress = (bankId: string) => {
  return useQuery({
    queryKey: ['wordbank-progress', bankId],
    queryFn: () => wordBankApi.getProgress(bankId),
    enabled: !!bankId,
  });
};
```

---

## 7. 性能优化

### 7.1 代码分割

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    visualizer({
      open: true,
      filename: 'dist/stats.html',
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // React核心
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // UI组件库
          'antd-vendor': ['antd', '@ant-design/icons'],
          // 游戏引擎
          'pixi-vendor': ['pixi.js', '@pixi/react'],
          // 工具库
          'utils-vendor': ['axios', 'dayjs', 'zustand'],
        },
      },
    },
    chunkSizeWarningLimit: 500,
  },
});
```

### 7.2 资源预加载

```typescript
// hooks/usePreloadAssets.ts
import { useEffect, useState } from 'react';
import { Assets } from 'pixi.js';

const GAME_ASSETS = {
  bubble: '/assets/images/bubble.png',
  explosion: '/assets/images/explosion.png',
  background: '/assets/images/game-bg.png',
};

const SOUND_ASSETS = {
  correct: '/assets/sounds/correct.mp3',
  wrong: '/assets/sounds/wrong.mp3',
  type: '/assets/sounds/type.mp3',
  combo: '/assets/sounds/combo.mp3',
  finish: '/assets/sounds/finish.mp3',
};

export const usePreloadAssets = () => {
  const [loaded, setLoaded] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const loadAssets = async () => {
      try {
        // 预加载图片
        await Assets.load(Object.values(GAME_ASSETS), (p) => {
          setProgress(p * 100);
        });

        // 预加载音频
        const audioPromises = Object.values(SOUND_ASSETS).map((src) => {
          return new Promise((resolve) => {
            const audio = new Audio(src);
            audio.addEventListener('canplaythrough', resolve);
            audio.load();
          });
        });
        await Promise.all(audioPromises);

        setLoaded(true);
      } catch (error) {
        console.error('Failed to load assets:', error);
      }
    };

    loadAssets();
  }, []);

  return { loaded, progress };
};
```

### 7.3 性能监控

```typescript
// utils/performance.ts
export const measurePerformance = () => {
  // FPS监控
  let lastTime = performance.now();
  let frameCount = 0;
  let fps = 0;

  const updateFPS = () => {
    frameCount++;
    const currentTime = performance.now();
    
    if (currentTime - lastTime >= 1000) {
      fps = frameCount;
      frameCount = 0;
      lastTime = currentTime;
      
      // 上报FPS
      if (fps < 30) {
        console.warn('Low FPS detected:', fps);
      }
    }
    
    requestAnimationFrame(updateFPS);
  };

  updateFPS();

  // Web Vitals
  if ('web-vital' in window) {
    // 监控LCP、FID、CLS等指标
  }
};
```

---

## 8. 构建部署

### 8.1 环境配置

```bash
# .env.development
VITE_API_BASE_URL=http://localhost:3000/api
VITE_CDN_URL=
VITE_ENABLE_MOCK=true

# .env.production
VITE_API_BASE_URL=https://api.boomword.com/api
VITE_CDN_URL=https://cdn.boomword.com
VITE_ENABLE_MOCK=false
```

### 8.2 Dockerfile

```dockerfile
# Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# 安装依赖
COPY package*.json ./
RUN npm ci

# 构建
COPY . .
RUN npm run build

# 生产镜像
FROM nginx:alpine

# 复制构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制nginx配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### 8.3 Nginx 配置

```nginx
# nginx.conf
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
    gzip_min_length 1000;

    # 缓存策略
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API代理
    location /api {
        proxy_pass http://backend:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # SPA路由支持
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

**文档版本**: v1.0  
**最后更新**: 2026-02-27
