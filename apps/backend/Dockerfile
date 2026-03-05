# 构建阶段
FROM node:18-alpine AS builder

# 安装 pnpm
RUN npm install -g pnpm

WORKDIR /app

# 复制 monorepo 配置文件
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY turbo.json ./

# 复制 packages
COPY packages/ ./packages/

# 复制后端应用
COPY apps/backend/ ./apps/backend/

# 安装依赖
RUN pnpm install --frozen-lockfile

# 构建 packages
RUN pnpm --filter @boomword/types build
RUN pnpm --filter @boomword/utils build

# 生成 Prisma Client
RUN cd apps/backend && pnpm prisma generate

# 构建后端
RUN pnpm --filter @boomword/backend build

# 生产阶段
FROM node:18-alpine AS runner

RUN npm install -g pnpm

WORKDIR /app

# 复制构建产物
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-workspace.yaml ./
COPY --from=builder /app/pnpm-lock.yaml* ./

COPY --from=builder /app/packages/types/package.json ./packages/types/
COPY --from=builder /app/packages/types/dist ./packages/types/dist

COPY --from=builder /app/packages/utils/package.json ./packages/utils/
COPY --from=builder /app/packages/utils/dist ./packages/utils/dist

COPY --from=builder /app/apps/backend/package.json ./apps/backend/
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/apps/backend/prisma ./apps/backend/prisma
COPY --from=builder /app/apps/backend/node_modules/.prisma ./apps/backend/node_modules/.prisma

# 仅安装生产依赖
RUN pnpm install --prod --frozen-lockfile

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

WORKDIR /app/apps/backend

# 启动命令：先运行数据库迁移，再启动服务
CMD ["sh", "-c", "pnpm prisma migrate deploy && node dist/main.js"]
