# 构建阶段
FROM node:20-alpine AS builder

# 安装 pnpm
RUN npm install -g pnpm

WORKDIR /app

# 复制 monorepo 配置文件
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY turbo.json ./

# 复制 packages
COPY packages/ ./packages/

# 复制前端应用
COPY apps/frontend/ ./apps/frontend/

# 安装依赖
RUN pnpm install --frozen-lockfile

# 构建 packages
RUN pnpm --filter @boomword/types build
RUN pnpm --filter @boomword/utils build

# 构建前端
RUN pnpm --filter @boomword/frontend build

# 生产阶段 - 使用 Nginx 托管静态文件
FROM nginx:alpine AS runner

# 复制 Nginx 配置
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf

# 复制构建产物
COPY --from=builder /app/apps/frontend/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
