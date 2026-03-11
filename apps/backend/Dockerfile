# 构建阶段
FROM node:20-alpine AS builder

# 安装编译依赖
RUN apk add --no-cache python3 make g++ openssl-dev

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

# 安装全部依赖 (包含 devDependencies 如 prisma CLI)
RUN pnpm install --frozen-lockfile

# 构建 packages
RUN pnpm --filter @boomword/types build
RUN pnpm --filter @boomword/utils build

# 生成 Prisma Client (使用 lockfile 中锁定的 prisma@5.x)
RUN cd apps/backend && pnpm prisma generate

# 构建后端
RUN pnpm --filter @boomword/backend build

# 生产阶段 - 直接复制 builder 的 node_modules，确保 prisma 版本一致
FROM node:20-alpine AS runner

RUN apk add --no-cache openssl

WORKDIR /app

# 复制 monorepo 配置
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-workspace.yaml ./

# 复制 packages 构建产物
COPY --from=builder /app/packages/types/package.json ./packages/types/
COPY --from=builder /app/packages/types/dist ./packages/types/dist

COPY --from=builder /app/packages/utils/package.json ./packages/utils/
COPY --from=builder /app/packages/utils/dist ./packages/utils/dist

# 复制后端应用 (dist + prisma schema + 完整 node_modules)
COPY --from=builder /app/apps/backend/package.json ./apps/backend/
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/apps/backend/prisma ./apps/backend/prisma
COPY --from=builder /app/apps/backend/node_modules ./apps/backend/node_modules

# 复制根 node_modules (包含 hoisted 的依赖)
COPY --from=builder /app/node_modules ./node_modules

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

WORKDIR /app/apps/backend

# 启动命令：先运行数据库迁移，再启动服务
CMD ["sh", "-c", "pnpm prisma migrate deploy && node dist/main.js"]
