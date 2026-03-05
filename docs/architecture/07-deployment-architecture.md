# 部署架构设计

## 1. 部署架构总览

### 1.1 MVP阶段部署架构

```
┌─────────────────────────────────────────────────────────────┐
│                      单服务器部署                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                    ┌──────────────┐                        │
│                    │    Nginx     │                        │
│                    │   (端口80)   │                        │
│                    └──────┬───────┘                        │
│                           │                                 │
│              ┌────────────┼────────────┐                   │
│              │            │            │                    │
│              ▼            ▼            ▼                    │
│     ┌──────────────┐ ┌─────────┐ ┌──────────┐             │
│     │   Frontend   │ │ Backend │ │  Static  │             │
│     │   (React)    │ │(NestJS) │ │  Files   │             │
│     │   /app/*     │ │ /api/*  │ │ /assets  │             │
│     └──────────────┘ └────┬────┘ └──────────┘             │
│                           │                                 │
│              ┌────────────┼────────────┐                   │
│              │            │            │                    │
│              ▼            ▼            ▼                    │
│     ┌──────────────┐ ┌─────────┐ ┌──────────┐             │
│     │  PostgreSQL  │ │  Redis  │ │   OSS    │             │
│     │  (容器)      │ │ (容器)  │ │ (云服务) │             │
│     └──────────────┘ └─────────┘ └──────────┘             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 生产环境部署架构

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           生产环境部署                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                           CDN                                    │   │
│  │                    (静态资源/音频文件)                            │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                   │                                     │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                      负载均衡 (SLB)                              │   │
│  │                     (SSL终结/流量分发)                           │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                   │                                     │
│         ┌─────────────────────────┼─────────────────────────┐          │
│         │                         │                         │           │
│         ▼                         ▼                         ▼           │
│  ┌─────────────┐          ┌─────────────┐          ┌─────────────┐    │
│  │   Web-01    │          │   Web-02    │          │   Web-03    │    │
│  │   Nginx     │          │   Nginx     │          │   Nginx     │    │
│  │  Frontend   │          │  Frontend   │          │  Frontend   │    │
│  └─────────────┘          └─────────────┘          └─────────────┘    │
│         │                         │                         │           │
│         └─────────────────────────┼─────────────────────────┘          │
│                                   │                                     │
│         ┌─────────────────────────┼─────────────────────────┐          │
│         │                         │                         │           │
│         ▼                         ▼                         ▼           │
│  ┌─────────────┐          ┌─────────────┐          ┌─────────────┐    │
│  │   API-01    │          │   API-02    │          │   API-03    │    │
│  │   NestJS    │          │   NestJS    │          │   NestJS    │    │
│  └─────────────┘          └─────────────┘          └─────────────┘    │
│         │                         │                         │           │
│         └─────────────────────────┼─────────────────────────┘          │
│                                   │                                     │
│         ┌─────────────────────────┼─────────────────────────┐          │
│         │                         │                         │           │
│         ▼                         ▼                         ▼           │
│  ┌─────────────┐          ┌─────────────┐          ┌─────────────┐    │
│  │  PG Master  │────────→ │  PG Slave   │          │   Redis     │    │
│  │   (写)      │  复制    │   (读)      │          │  Cluster    │    │
│  └─────────────┘          └─────────────┘          └─────────────┘    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Docker 容器化

### 2.1 前端 Dockerfile

```dockerfile
# apps/frontend/Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# 安装依赖
COPY package*.json ./
RUN npm ci

# 构建应用
COPY . .
ARG VITE_API_BASE_URL
ARG VITE_CDN_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_CDN_URL=$VITE_CDN_URL
RUN npm run build

# 生产镜像
FROM nginx:1.25-alpine

# 复制构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制nginx配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/health || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### 2.2 后端 Dockerfile

```dockerfile
# apps/backend/Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# 安装依赖
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci

# 生成Prisma Client
RUN npx prisma generate

# 构建应用
COPY . .
RUN npm run build

# 生产镜像
FROM node:20-alpine

WORKDIR /app

# 只复制生产依赖
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci --only=production

# 复制构建产物
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# 创建非root用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001
USER nestjs

# 环境变量
ENV NODE_ENV=production
ENV PORT=3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000/health || exit 1

EXPOSE 3000

CMD ["node", "dist/main.js"]
```

### 2.3 Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  # PostgreSQL
  postgres:
    image: postgres:15-alpine
    container_name: boomword-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${DB_USER:-postgres}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME:-boomword}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql:ro
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - boomword-network

  # Redis
  redis:
    image: redis:7-alpine
    container_name: boomword-redis
    restart: unless-stopped
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - boomword-network

  # Backend API
  backend:
    build:
      context: ./apps/backend
      dockerfile: Dockerfile
    container_name: boomword-backend
    restart: unless-stopped
    environment:
      NODE_ENV: production
      PORT: 3000
      DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/${DB_NAME}
      REDIS_HOST: redis
      REDIS_PORT: 6379
      REDIS_PASSWORD: ${REDIS_PASSWORD}
      JWT_SECRET: ${JWT_SECRET}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    ports:
      - "3000:3000"
    networks:
      - boomword-network

  # Frontend
  frontend:
    build:
      context: ./apps/frontend
      dockerfile: Dockerfile
      args:
        VITE_API_BASE_URL: /api
    container_name: boomword-frontend
    restart: unless-stopped
    ports:
      - "80:80"
    depends_on:
      - backend
    networks:
      - boomword-network

  # Nginx (反向代理)
  nginx:
    image: nginx:1.25-alpine
    container_name: boomword-nginx
    restart: unless-stopped
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - frontend
      - backend
    networks:
      - boomword-network

volumes:
  postgres_data:
  redis_data:

networks:
  boomword-network:
    driver: bridge
```

### 2.4 Nginx 配置

```nginx
# nginx/nginx.conf
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
    use epoll;
    multi_accept on;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for" '
                    'rt=$request_time uct="$upstream_connect_time" '
                    'uht="$upstream_header_time" urt="$upstream_response_time"';

    access_log /var/log/nginx/access.log main;

    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    # Gzip压缩
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript 
               application/xml application/xml+rss text/javascript;

    # 限流配置
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    limit_conn_zone $binary_remote_addr zone=conn_limit:10m;

    # 上游服务
    upstream backend {
        server backend:3000;
        keepalive 32;
    }

    upstream frontend {
        server frontend:80;
        keepalive 32;
    }

    # HTTP -> HTTPS 重定向
    server {
        listen 80;
        server_name boomword.com www.boomword.com;
        return 301 https://$server_name$request_uri;
    }

    # HTTPS 配置
    server {
        listen 443 ssl http2;
        server_name boomword.com www.boomword.com;

        # SSL证书
        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;
        ssl_session_timeout 1d;
        ssl_session_cache shared:SSL:50m;
        ssl_session_tickets off;

        # SSL协议
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
        ssl_prefer_server_ciphers off;

        # HSTS
        add_header Strict-Transport-Security "max-age=63072000" always;

        # 安全头
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;

        # 健康检查
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }

        # API代理
        location /api {
            limit_req zone=api_limit burst=20 nodelay;
            limit_conn conn_limit 10;

            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_set_header Connection "";

            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;

            # 缓存API响应（可选）
            proxy_cache_bypass $http_cache_control;
        }

        # 静态资源
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            proxy_pass http://frontend;
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # 前端SPA
        location / {
            proxy_pass http://frontend;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;

            # SPA路由支持
            try_files $uri $uri/ /index.html;
        }
    }
}
```

---

## 3. CI/CD 流程

### 3.1 GitHub Actions 配置

```yaml
# .github/workflows/deploy.yml
name: Build and Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_PREFIX: ${{ github.repository }}

jobs:
  # 代码检查
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linting
        run: npm run lint
      
      - name: Run type check
        run: npm run type-check

  # 单元测试
  test:
    runs-on: ubuntu-latest
    needs: lint
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
          POSTGRES_DB: boomword_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
      
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/boomword_test
          REDIS_HOST: localhost
          REDIS_PORT: 6379

  # 构建镜像
  build:
    runs-on: ubuntu-latest
    needs: test
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Login to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Build and push backend
        uses: docker/build-push-action@v5
        with:
          context: ./apps/backend
          push: true
          tags: |
            ${{ env.REGISTRY }}/${{ env.IMAGE_PREFIX }}/backend:latest
            ${{ env.REGISTRY }}/${{ env.IMAGE_PREFIX }}/backend:${{ github.sha }}
      
      - name: Build and push frontend
        uses: docker/build-push-action@v5
        with:
          context: ./apps/frontend
          push: true
          tags: |
            ${{ env.REGISTRY }}/${{ env.IMAGE_PREFIX }}/frontend:latest
            ${{ env.REGISTRY }}/${{ env.IMAGE_PREFIX }}/frontend:${{ github.sha }}
          build-args: |
            VITE_API_BASE_URL=${{ secrets.VITE_API_BASE_URL }}

  # 部署到服务器
  deploy:
    runs-on: ubuntu-latest
    needs: build
    environment: production
    
    steps:
      - name: Deploy to server
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SERVER_SSH_KEY }}
          script: |
            cd /opt/boomword
            
            # 拉取最新镜像
            docker-compose pull
            
            # 数据库迁移
            docker-compose run --rm backend npx prisma migrate deploy
            
            # 重启服务（零停机）
            docker-compose up -d --no-deps --scale backend=2 backend
            sleep 10
            docker-compose up -d --no-deps --scale backend=1 backend
            
            # 清理旧镜像
            docker image prune -f
```

### 3.2 部署脚本

```bash
#!/bin/bash
# scripts/deploy.sh

set -e

# 配置
APP_DIR="/opt/boomword"
BACKUP_DIR="/opt/backups"
COMPOSE_FILE="docker-compose.yml"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# 检查服务健康状态
health_check() {
    local service=$1
    local max_retries=30
    local retry=0
    
    while [ $retry -lt $max_retries ]; do
        if docker-compose exec -T $service wget -q --spider http://localhost:3000/health 2>/dev/null; then
            return 0
        fi
        retry=$((retry + 1))
        sleep 2
    done
    
    return 1
}

# 主部署流程
main() {
    cd $APP_DIR
    
    log "开始部署..."
    
    # 1. 备份数据库
    log "备份数据库..."
    docker-compose exec -T postgres pg_dump -U postgres boomword > \
        $BACKUP_DIR/db_$(date +%Y%m%d_%H%M%S).sql
    
    # 2. 拉取最新镜像
    log "拉取最新镜像..."
    docker-compose pull
    
    # 3. 数据库迁移
    log "执行数据库迁移..."
    docker-compose run --rm backend npx prisma migrate deploy
    
    # 4. 滚动更新
    log "滚动更新服务..."
    
    # 启动新实例
    docker-compose up -d --no-deps --scale backend=2 backend
    
    # 等待新实例健康
    log "等待新实例启动..."
    sleep 10
    
    if ! health_check backend; then
        error "新实例启动失败，回滚..."
        docker-compose up -d --no-deps --scale backend=1 backend
        exit 1
    fi
    
    # 停止旧实例
    docker-compose up -d --no-deps --scale backend=1 backend
    
    # 5. 更新前端
    log "更新前端..."
    docker-compose up -d --no-deps frontend
    
    # 6. 清理
    log "清理旧镜像..."
    docker image prune -f
    
    log "部署完成!"
}

main "$@"
```

---

## 4. 监控告警

### 4.1 Prometheus 配置

```yaml
# prometheus/prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

alerting:
  alertmanagers:
    - static_configs:
        - targets:
            - alertmanager:9093

rule_files:
  - /etc/prometheus/rules/*.yml

scrape_configs:
  # Prometheus自身
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  # Node Exporter
  - job_name: 'node'
    static_configs:
      - targets: ['node-exporter:9100']

  # Backend API
  - job_name: 'backend'
    static_configs:
      - targets: ['backend:3000']
    metrics_path: /metrics

  # PostgreSQL
  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres-exporter:9187']

  # Redis
  - job_name: 'redis'
    static_configs:
      - targets: ['redis-exporter:9121']

  # Nginx
  - job_name: 'nginx'
    static_configs:
      - targets: ['nginx-exporter:9113']
```

### 4.2 告警规则

```yaml
# prometheus/rules/alerts.yml
groups:
  - name: boomword-alerts
    rules:
      # 服务不可用
      - alert: ServiceDown
        expr: up == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "服务 {{ $labels.job }} 不可用"
          description: "服务 {{ $labels.job }} 已停止超过1分钟"

      # API响应时间过长
      - alert: HighResponseTime
        expr: histogram_quantile(0.95, http_request_duration_seconds_bucket) > 1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "API响应时间过长"
          description: "95%的请求响应时间超过1秒"

      # 错误率过高
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "API错误率过高"
          description: "5xx错误率超过5%"

      # 数据库连接数过高
      - alert: HighDBConnections
        expr: pg_stat_activity_count > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "数据库连接数过高"
          description: "PostgreSQL连接数已达 {{ $value }}"

      # Redis内存使用过高
      - alert: HighRedisMemory
        expr: redis_memory_used_bytes / redis_memory_max_bytes > 0.8
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Redis内存使用过高"
          description: "Redis内存使用率已达 {{ $value | humanizePercentage }}"

      # 磁盘空间不足
      - alert: LowDiskSpace
        expr: (node_filesystem_avail_bytes / node_filesystem_size_bytes) < 0.1
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "磁盘空间不足"
          description: "磁盘剩余空间不足10%"
```

### 4.3 Grafana Dashboard

```json
{
  "dashboard": {
    "title": "BoomWord Overview",
    "panels": [
      {
        "title": "请求总量",
        "type": "stat",
        "targets": [
          {
            "expr": "sum(rate(http_requests_total[5m]))"
          }
        ]
      },
      {
        "title": "平均响应时间",
        "type": "gauge",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))"
          }
        ]
      },
      {
        "title": "错误率",
        "type": "stat",
        "targets": [
          {
            "expr": "sum(rate(http_requests_total{status=~\"5..\"}[5m])) / sum(rate(http_requests_total[5m])) * 100"
          }
        ]
      },
      {
        "title": "活跃用户",
        "type": "stat",
        "targets": [
          {
            "expr": "boomword_active_users"
          }
        ]
      }
    ]
  }
}
```

---

## 5. 灰度发布

### 5.1 Nginx 灰度配置

```nginx
# 灰度发布配置
map $cookie_canary $backend_pool {
    "true"  backend_canary;
    default backend_stable;
}

# 按用户ID灰度
map $http_x_user_id $backend_pool_by_user {
    ~^[0-9]*[0-3]$ backend_canary;  # 40%用户
    default        backend_stable;
}

upstream backend_stable {
    server backend-stable:3000;
}

upstream backend_canary {
    server backend-canary:3000;
}

server {
    location /api {
        proxy_pass http://$backend_pool;
    }
}
```

### 5.2 灰度发布流程

```bash
#!/bin/bash
# scripts/canary-deploy.sh

# 1. 部署金丝雀版本
docker-compose -f docker-compose.canary.yml up -d backend-canary

# 2. 等待健康检查
sleep 30

# 3. 检查金丝雀版本健康
if ! curl -s http://localhost:3001/health | grep -q "healthy"; then
    echo "金丝雀版本不健康，回滚"
    docker-compose -f docker-compose.canary.yml down
    exit 1
fi

# 4. 逐步增加流量
for percent in 10 25 50 75 100; do
    echo "金丝雀流量: ${percent}%"
    # 更新Nginx配置
    sed -i "s/weight=[0-9]*/weight=${percent}/" /etc/nginx/conf.d/canary.conf
    nginx -s reload
    sleep 300  # 观察5分钟
    
    # 检查错误率
    error_rate=$(curl -s http://prometheus:9090/api/v1/query?query=... | jq '.data.result[0].value[1]')
    if (( $(echo "$error_rate > 0.05" | bc -l) )); then
        echo "错误率过高，回滚"
        # 回滚逻辑
        exit 1
    fi
done

# 5. 全量发布
docker-compose down backend-stable
docker-compose up -d --no-deps backend
```

---

**文档版本**: v1.0  
**最后更新**: 2026-02-27
