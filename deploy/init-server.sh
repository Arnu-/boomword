#!/bin/bash
# BoomWord 服务器首次初始化脚本
# 用法: bash deploy/init-server.sh

set -e

echo "========================================="
echo "  BoomWord Server Initialization"
echo "========================================="

# 创建项目目录
mkdir -p /opt/boomword
cd /opt/boomword

# 克隆代码
if [ ! -d ".git" ]; then
  echo "[1/4] Cloning repository..."
  git clone https://github.com/Arnu-/boomword.git .
else
  echo "[1/4] Repository already exists, pulling latest..."
  git pull origin master
fi

# 创建生产环境配置
if [ ! -f ".env.production" ]; then
  echo "[2/4] Creating .env.production..."
  cat > .env.production << 'EOF'
# 数据库配置
DB_USER=boomword
DB_PASSWORD=BoomWord_DB_2026!
DB_NAME=boomword
DB_PORT=5432
DATABASE_URL=postgresql://boomword:BoomWord_DB_2026!@postgres:5432/boomword

# Redis 配置
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=BoomWord_Redis_2026!

# JWT 配置
JWT_SECRET=BoomWord_JWT_SuperSecret_2026_Production!
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# 应用配置
NODE_ENV=production
BACKEND_PORT=3001
FRONTEND_PORT=3000

# Nginx 配置
NGINX_PORT=80
NGINX_SSL_PORT=443
EOF
  echo "  .env.production created!"
else
  echo "[2/4] .env.production already exists, skipping..."
fi

# 配置 Docker 镜像加速（腾讯云）
echo "[3/4] Configuring Docker mirror..."
mkdir -p /etc/docker
cat > /etc/docker/daemon.json << 'EOF'
{
  "registry-mirrors": [
    "https://mirror.ccs.tencentyun.com",
    "https://hub-mirror.c.163.com"
  ],
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
EOF
systemctl daemon-reload
systemctl restart docker
echo "  Docker mirror configured!"

# 首次构建并启动
echo "[4/4] Building and starting services..."
docker compose -f docker-compose.yml -f docker-compose.prod.yml --env-file .env.production up -d --build

echo ""
echo "========================================="
echo "  Initialization completed!"
echo "  Access: http://$(curl -s ifconfig.me)"
echo "========================================="
