# BoomWord - 单词泡泡消消乐

一款游戏化英语单词学习 Web 应用。通过"打字消泡泡"的玩法，让背单词变得有趣高效。

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 18 + TypeScript + Vite 5 |
| UI | Ant Design 5 + TailwindCSS 3 |
| 状态管理 | Zustand 4 |
| 游戏渲染 | PixiJS 7 + Web Audio API 音效合成 + Canvas 粒子系统 |
| 后端 | NestJS 10 + TypeScript |
| 数据库 | PostgreSQL（Prisma ORM） |
| 缓存 | Redis（ioredis） |
| 认证 | Passport.js + JWT |
| Monorepo | pnpm Workspace + Turborepo |

## 项目结构

```
boomword/
├── apps/
│   ├── frontend/          # React 前端应用
│   │   ├── src/
│   │   │   ├── pages/     # 页面组件
│   │   │   ├── components/# 公共组件
│   │   │   ├── services/  # API 服务
│   │   │   ├── stores/    # Zustand 状态管理
│   │   │   ├── utils/     # 工具（音效引擎、粒子系统等）
│   │   │   └── styles/    # 全局样式
│   │   └── package.json
│   └── backend/           # NestJS 后端应用
│       ├── src/
│       │   ├── modules/   # 业务模块
│       │   ├── common/    # 公共层（装饰器、过滤器、拦截器）
│       │   ├── config/    # 配置
│       │   └── shared/    # 共享服务（Prisma、Redis）
│       ├── prisma/        # 数据库 Schema 与迁移
│       └── package.json
├── turbo.json             # Turborepo 配置
├── pnpm-workspace.yaml    # pnpm 工作空间配置
└── package.json
```

## 功能模块

- **词库管理** — 词库分类浏览、词库详情（章节/关卡）
- **游戏核心** — 打字消泡泡，支持练习、挑战、极速三种模式
- **泡泡特效** — 玻璃质感泡泡、Canvas 粒子爆破、Web Audio API 合成音效
- **学习统计** — 学习进度追踪、掌握度分级
- **错词本** — 自动收录错误单词，支持复习
- **排行榜** — 用户分数排名
- **成就系统** — 学习类/游戏类/社交类成就解锁
- **用户系统** — 注册登录、个人中心
- **管理后台** — 单词 Excel 批量导入

## 快速开始

### 环境要求

- Node.js >= 20.0.0
- pnpm >= 8.15.0
- PostgreSQL
- Redis

### 安装依赖

```bash
pnpm install
```

### 数据库配置

在 `apps/backend` 目录下创建 `.env` 文件，配置数据库连接：

```env
DATABASE_URL="postgresql://用户名:密码@localhost:5432/boomword"
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your-jwt-secret
```

### 初始化数据库

```bash
# 生成 Prisma Client
pnpm db:generate

# 执行数据库迁移
pnpm db:migrate

# （可选）填充种子数据
pnpm db:seed
```

### 启动开发服务

```bash
# 同时启动前后端开发服务
pnpm dev
```

前端默认运行在 `http://localhost:5173`，后端 API 运行在 `http://localhost:3000/api/v1/`。

### 构建生产版本

```bash
pnpm build
pnpm start
```

## API 文档

启动后端后访问 `http://localhost:3000/docs` 查看 Swagger 自动生成的 API 文档。

## 常用命令

| 命令 | 说明 |
|------|------|
| `pnpm dev` | 启动前后端开发服务 |
| `pnpm build` | 构建所有应用 |
| `pnpm lint` | 代码检查 |
| `pnpm test` | 运行测试 |
| `pnpm db:studio` | 打开 Prisma Studio 数据库可视化 |
