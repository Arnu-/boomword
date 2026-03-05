# 项目目录结构

## 1. Monorepo 项目结构

### 1.1 整体目录结构

```
boomword/
├── apps/                           # 应用目录
│   ├── frontend/                   # 前端应用
│   ├── backend/                    # 后端应用
│   └── admin/                      # 管理后台(可选)
│
├── packages/                       # 共享包
│   ├── shared/                     # 共享代码
│   │   ├── types/                  # 类型定义
│   │   ├── utils/                  # 工具函数
│   │   └── constants/              # 常量
│   └── ui/                         # UI组件库(可选)
│
├── docs/                           # 文档
│   ├── requirements.md             # 需求文档
│   ├── prd/                        # PRD文档
│   └── architecture/               # 架构文档
│
├── scripts/                        # 脚本
│   ├── deploy.sh                   # 部署脚本
│   ├── backup.sh                   # 备份脚本
│   └── seed.sh                     # 数据初始化
│
├── docker/                         # Docker配置
│   ├── nginx/                      # Nginx配置
│   ├── postgres/                   # PostgreSQL配置
│   └── redis/                      # Redis配置
│
├── .github/                        # GitHub配置
│   └── workflows/                  # CI/CD工作流
│
├── docker-compose.yml              # Docker Compose配置
├── docker-compose.dev.yml          # 开发环境配置
├── docker-compose.prod.yml         # 生产环境配置
├── package.json                    # 根package.json
├── pnpm-workspace.yaml             # pnpm工作区配置
├── turbo.json                      # Turborepo配置
├── .env.example                    # 环境变量示例
├── .gitignore
└── README.md
```

---

## 2. 前端项目结构

### 2.1 详细目录

```
apps/frontend/
├── public/                         # 静态资源
│   ├── favicon.ico
│   └── robots.txt
│
├── src/
│   ├── app/                        # 应用入口
│   │   ├── App.tsx                 # 根组件
│   │   ├── router.tsx              # 路由配置
│   │   └── providers.tsx           # Provider组合
│   │
│   ├── assets/                     # 静态资源
│   │   ├── images/                 # 图片
│   │   │   ├── logo.svg
│   │   │   ├── icons/
│   │   │   └── backgrounds/
│   │   ├── sounds/                 # 音效
│   │   │   ├── correct.mp3
│   │   │   ├── wrong.mp3
│   │   │   ├── type.mp3
│   │   │   └── combo.mp3
│   │   └── fonts/                  # 字体
│   │
│   ├── components/                 # 组件
│   │   ├── ui/                     # 基础UI组件
│   │   │   ├── Button/
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Button.test.tsx
│   │   │   │   └── index.ts
│   │   │   ├── Modal/
│   │   │   ├── Input/
│   │   │   ├── Card/
│   │   │   └── index.ts
│   │   ├── layout/                 # 布局组件
│   │   │   ├── Header/
│   │   │   ├── Footer/
│   │   │   ├── Sidebar/
│   │   │   ├── MainLayout/
│   │   │   └── AdminLayout/
│   │   └── common/                 # 通用业务组件
│   │       ├── StarRating/
│   │       ├── ProgressBar/
│   │       ├── Avatar/
│   │       ├── Loading/
│   │       ├── Empty/
│   │       └── ErrorBoundary/
│   │
│   ├── features/                   # 功能模块
│   │   ├── auth/                   # 认证模块
│   │   │   ├── components/
│   │   │   │   ├── LoginForm.tsx
│   │   │   │   └── RegisterForm.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useAuth.ts
│   │   │   ├── services/
│   │   │   │   └── auth.service.ts
│   │   │   ├── store/
│   │   │   │   └── authStore.ts
│   │   │   └── types/
│   │   │       └── index.ts
│   │   │
│   │   ├── game/                   # 游戏模块
│   │   │   ├── components/
│   │   │   │   ├── GameCanvas/
│   │   │   │   │   ├── GameCanvas.tsx
│   │   │   │   │   └── index.ts
│   │   │   │   ├── Bubble/
│   │   │   │   │   ├── Bubble.tsx
│   │   │   │   │   └── index.ts
│   │   │   │   ├── InputBox/
│   │   │   │   ├── ScoreBoard/
│   │   │   │   ├── Timer/
│   │   │   │   ├── ComboDisplay/
│   │   │   │   ├── PauseModal/
│   │   │   │   └── ResultModal/
│   │   │   ├── hooks/
│   │   │   │   ├── useGameLoop.ts
│   │   │   │   ├── useKeyboard.ts
│   │   │   │   ├── useBubbles.ts
│   │   │   │   └── useAudio.ts
│   │   │   ├── engine/
│   │   │   │   ├── GameEngine.ts
│   │   │   │   ├── BubbleManager.ts
│   │   │   │   ├── ScoreCalculator.ts
│   │   │   │   └── index.ts
│   │   │   ├── store/
│   │   │   │   └── gameStore.ts
│   │   │   ├── types/
│   │   │   │   └── index.ts
│   │   │   └── constants/
│   │   │       └── index.ts
│   │   │
│   │   ├── wordbank/               # 词库模块
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── services/
│   │   │   └── types/
│   │   │
│   │   ├── level/                  # 关卡模块
│   │   ├── ranking/                # 排行榜模块
│   │   ├── achievement/            # 成就模块
│   │   ├── learning/               # 学习统计模块
│   │   ├── profile/                # 个人中心模块
│   │   └── settings/               # 设置模块
│   │
│   ├── pages/                      # 页面组件
│   │   ├── HomePage/
│   │   │   ├── HomePage.tsx
│   │   │   └── index.ts
│   │   ├── LoginPage/
│   │   ├── RegisterPage/
│   │   ├── WordBankPage/
│   │   ├── LevelSelectPage/
│   │   ├── GamePage/
│   │   ├── ResultPage/
│   │   ├── RankingPage/
│   │   ├── ProfilePage/
│   │   ├── WrongBookPage/
│   │   ├── AchievementPage/
│   │   ├── SettingsPage/
│   │   └── NotFoundPage/
│   │
│   ├── hooks/                      # 全局Hooks
│   │   ├── useAuth.ts
│   │   ├── useLocalStorage.ts
│   │   ├── useDebounce.ts
│   │   ├── useMediaQuery.ts
│   │   └── index.ts
│   │
│   ├── services/                   # API服务
│   │   ├── api/
│   │   │   ├── client.ts           # Axios实例
│   │   │   ├── auth.ts
│   │   │   ├── user.ts
│   │   │   ├── wordbank.ts
│   │   │   ├── level.ts
│   │   │   ├── game.ts
│   │   │   ├── ranking.ts
│   │   │   └── learning.ts
│   │   └── index.ts
│   │
│   ├── stores/                     # 全局状态
│   │   ├── authStore.ts
│   │   ├── userStore.ts
│   │   ├── gameStore.ts
│   │   ├── settingsStore.ts
│   │   └── index.ts
│   │
│   ├── styles/                     # 样式
│   │   ├── globals.css
│   │   ├── tailwind.css
│   │   └── variables.css
│   │
│   ├── types/                      # 类型定义
│   │   ├── api.d.ts
│   │   ├── user.d.ts
│   │   ├── game.d.ts
│   │   ├── word.d.ts
│   │   └── index.ts
│   │
│   ├── utils/                      # 工具函数
│   │   ├── format.ts
│   │   ├── validation.ts
│   │   ├── storage.ts
│   │   ├── classnames.ts
│   │   └── index.ts
│   │
│   ├── config/                     # 配置
│   │   ├── env.ts
│   │   ├── routes.ts
│   │   └── game.ts
│   │
│   ├── main.tsx                    # 入口文件
│   └── vite-env.d.ts
│
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── postcss.config.js
├── tsconfig.json
├── tsconfig.node.json
├── package.json
├── .eslintrc.cjs
├── .prettierrc
└── nginx.conf
```

---

## 3. 后端项目结构

### 3.1 详细目录

```
apps/backend/
├── src/
│   ├── main.ts                     # 应用入口
│   ├── app.module.ts               # 根模块
│   │
│   ├── common/                     # 公共模块
│   │   ├── decorators/             # 自定义装饰器
│   │   │   ├── current-user.decorator.ts
│   │   │   ├── roles.decorator.ts
│   │   │   ├── public.decorator.ts
│   │   │   └── index.ts
│   │   ├── filters/                # 异常过滤器
│   │   │   ├── http-exception.filter.ts
│   │   │   ├── all-exception.filter.ts
│   │   │   └── index.ts
│   │   ├── guards/                 # 守卫
│   │   │   ├── jwt-auth.guard.ts
│   │   │   ├── roles.guard.ts
│   │   │   ├── throttler.guard.ts
│   │   │   └── index.ts
│   │   ├── interceptors/           # 拦截器
│   │   │   ├── transform.interceptor.ts
│   │   │   ├── logging.interceptor.ts
│   │   │   ├── timeout.interceptor.ts
│   │   │   └── index.ts
│   │   ├── pipes/                  # 管道
│   │   │   ├── validation.pipe.ts
│   │   │   └── index.ts
│   │   ├── middlewares/            # 中间件
│   │   │   ├── logger.middleware.ts
│   │   │   └── index.ts
│   │   ├── interfaces/             # 公共接口
│   │   │   ├── response.interface.ts
│   │   │   ├── pagination.interface.ts
│   │   │   └── index.ts
│   │   ├── constants/              # 常量
│   │   │   ├── error-codes.ts
│   │   │   ├── cache-keys.ts
│   │   │   └── index.ts
│   │   ├── enums/                  # 枚举
│   │   │   ├── role.enum.ts
│   │   │   ├── status.enum.ts
│   │   │   └── index.ts
│   │   └── utils/                  # 工具函数
│   │       ├── hash.util.ts
│   │       ├── id-generator.util.ts
│   │       ├── pagination.util.ts
│   │       └── index.ts
│   │
│   ├── config/                     # 配置
│   │   ├── config.module.ts
│   │   ├── app.config.ts
│   │   ├── database.config.ts
│   │   ├── redis.config.ts
│   │   ├── jwt.config.ts
│   │   └── index.ts
│   │
│   ├── modules/                    # 业务模块
│   │   ├── auth/                   # 认证模块
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── strategies/
│   │   │   │   ├── jwt.strategy.ts
│   │   │   │   ├── local.strategy.ts
│   │   │   │   └── index.ts
│   │   │   ├── dto/
│   │   │   │   ├── login.dto.ts
│   │   │   │   ├── register.dto.ts
│   │   │   │   ├── refresh-token.dto.ts
│   │   │   │   └── index.ts
│   │   │   └── guards/
│   │   │       └── jwt-auth.guard.ts
│   │   │
│   │   ├── user/                   # 用户模块
│   │   │   ├── user.module.ts
│   │   │   ├── user.controller.ts
│   │   │   ├── user.service.ts
│   │   │   ├── user.repository.ts
│   │   │   ├── dto/
│   │   │   │   ├── create-user.dto.ts
│   │   │   │   ├── update-user.dto.ts
│   │   │   │   └── index.ts
│   │   │   └── entities/
│   │   │       └── user.entity.ts
│   │   │
│   │   ├── wordbank/               # 词库模块
│   │   │   ├── wordbank.module.ts
│   │   │   ├── controllers/
│   │   │   │   ├── category.controller.ts
│   │   │   │   ├── wordbank.controller.ts
│   │   │   │   └── word.controller.ts
│   │   │   ├── services/
│   │   │   │   ├── category.service.ts
│   │   │   │   ├── wordbank.service.ts
│   │   │   │   └── word.service.ts
│   │   │   ├── repositories/
│   │   │   │   ├── category.repository.ts
│   │   │   │   ├── wordbank.repository.ts
│   │   │   │   └── word.repository.ts
│   │   │   └── dto/
│   │   │
│   │   ├── level/                  # 关卡模块
│   │   │   ├── level.module.ts
│   │   │   ├── controllers/
│   │   │   ├── services/
│   │   │   └── dto/
│   │   │
│   │   ├── game/                   # 游戏模块
│   │   │   ├── game.module.ts
│   │   │   ├── game.controller.ts
│   │   │   ├── game.service.ts
│   │   │   ├── dto/
│   │   │   │   ├── start-game.dto.ts
│   │   │   │   └── submit-result.dto.ts
│   │   │   └── processors/
│   │   │       └── game-result.processor.ts
│   │   │
│   │   ├── learning/               # 学习模块
│   │   │   ├── learning.module.ts
│   │   │   ├── controllers/
│   │   │   ├── services/
│   │   │   └── dto/
│   │   │
│   │   ├── ranking/                # 排行榜模块
│   │   │   ├── ranking.module.ts
│   │   │   ├── ranking.controller.ts
│   │   │   ├── ranking.service.ts
│   │   │   └── dto/
│   │   │
│   │   ├── achievement/            # 成就模块
│   │   │   ├── achievement.module.ts
│   │   │   ├── achievement.controller.ts
│   │   │   ├── achievement.service.ts
│   │   │   └── dto/
│   │   │
│   │   └── admin/                  # 管理后台模块
│   │       ├── admin.module.ts
│   │       ├── controllers/
│   │       └── services/
│   │
│   └── shared/                     # 共享模块
│       ├── prisma/                 # Prisma模块
│       │   ├── prisma.module.ts
│       │   └── prisma.service.ts
│       ├── redis/                  # Redis模块
│       │   ├── redis.module.ts
│       │   └── redis.service.ts
│       ├── cache/                  # 缓存模块
│       │   ├── cache.module.ts
│       │   └── cache.service.ts
│       ├── queue/                  # 队列模块
│       │   ├── queue.module.ts
│       │   └── queue.service.ts
│       └── logger/                 # 日志模块
│           ├── logger.module.ts
│           └── logger.service.ts
│
├── prisma/                         # Prisma配置
│   ├── schema.prisma               # 数据模型
│   ├── migrations/                 # 迁移文件
│   └── seed.ts                     # 种子数据
│
├── test/                           # 测试
│   ├── app.e2e-spec.ts
│   └── jest-e2e.json
│
├── nest-cli.json
├── tsconfig.json
├── tsconfig.build.json
├── package.json
├── .eslintrc.js
├── .prettierrc
└── Dockerfile
```

---

## 4. 共享包结构

```
packages/shared/
├── src/
│   ├── types/                      # 共享类型
│   │   ├── user.ts
│   │   ├── game.ts
│   │   ├── word.ts
│   │   ├── api.ts
│   │   └── index.ts
│   │
│   ├── utils/                      # 共享工具
│   │   ├── format.ts
│   │   ├── validation.ts
│   │   └── index.ts
│   │
│   ├── constants/                  # 共享常量
│   │   ├── game.ts
│   │   ├── score.ts
│   │   └── index.ts
│   │
│   └── index.ts
│
├── package.json
└── tsconfig.json
```

---

## 5. 配置文件规范

### 5.1 根目录 package.json

```json
{
  "name": "boomword",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "test": "turbo run test",
    "format": "prettier --write \"**/*.{ts,tsx,js,json}\"",
    "prepare": "husky install"
  },
  "devDependencies": {
    "turbo": "^1.12.0",
    "prettier": "^3.2.0",
    "husky": "^9.0.0",
    "lint-staged": "^15.2.0"
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md}": [
      "prettier --write"
    ]
  }
}
```

### 5.2 Turborepo 配置

```json
// turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": [".env"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "outputs": []
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"]
    }
  }
}
```

### 5.3 ESLint 配置

```javascript
// .eslintrc.js (后端)
module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint/eslint-plugin'],
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: ['.eslintrc.js'],
  rules: {
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
  },
};
```

### 5.4 Prettier 配置

```json
// .prettierrc
{
  "semi": true,
  "trailingComma": "all",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

### 5.5 环境变量示例

```bash
# .env.example

# 应用配置
NODE_ENV=development
PORT=3000

# 数据库配置
DATABASE_URL=postgresql://postgres:password@localhost:5432/boomword

# Redis配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT配置
JWT_SECRET=your-super-secret-key-min-32-chars
JWT_REFRESH_SECRET=another-super-secret-key-min-32
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# 阿里云OSS配置
OSS_ACCESS_KEY_ID=
OSS_ACCESS_KEY_SECRET=
OSS_BUCKET=
OSS_REGION=

# 短信服务配置
SMS_ACCESS_KEY_ID=
SMS_ACCESS_KEY_SECRET=
SMS_SIGN_NAME=
SMS_TEMPLATE_CODE=

# 前端配置
VITE_API_BASE_URL=/api
VITE_CDN_URL=
```

---

## 6. Git 配置

### 6.1 .gitignore

```gitignore
# Dependencies
node_modules/
.pnpm-store/

# Build outputs
dist/
build/
.next/
out/

# Environment files
.env
.env.local
.env.*.local

# IDE
.idea/
.vscode/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
logs/
*.log
npm-debug.log*
pnpm-debug.log*

# Testing
coverage/
.nyc_output/

# Prisma
prisma/migrations/*_migration_lock.toml

# Temporary files
tmp/
temp/
*.tmp

# Cache
.cache/
.turbo/
```

### 6.2 提交规范

```
# 提交类型
feat:     新功能
fix:      Bug修复
docs:     文档更新
style:    代码格式(不影响代码运行的变动)
refactor: 重构(既不是新增功能，也不是修改bug的代码变动)
perf:     性能优化
test:     增加测试
chore:    构建过程或辅助工具的变动

# 示例
feat(game): 添加连击奖励动画效果
fix(auth): 修复Token刷新失败问题
docs(readme): 更新安装说明
```

---

**文档版本**: v1.0  
**最后更新**: 2026-02-27
