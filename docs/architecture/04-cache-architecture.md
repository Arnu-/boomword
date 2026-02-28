# 缓存架构设计

## 1. 概述

### 1.1 缓存策略

```
┌─────────────────────────────────────────────────────────────┐
│                      缓存架构                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌───────────┐    Miss     ┌───────────┐                  │
│   │  Client   │ ──────────→ │  Database │                  │
│   │  Request  │             │           │                  │
│   └─────┬─────┘             └─────┬─────┘                  │
│         │                         │                        │
│         │ Query                   │ Read                   │
│         ▼                         ▼                        │
│   ┌───────────┐             ┌───────────┐                  │
│   │   Redis   │ ←───────────│  Service  │                  │
│   │   Cache   │    Write    │   Layer   │                  │
│   └─────┬─────┘             └───────────┘                  │
│         │                                                   │
│         │ Hit                                               │
│         ▼                                                   │
│   ┌───────────┐                                            │
│   │  Response │                                            │
│   └───────────┘                                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 缓存分类

| 类型 | 用途 | TTL | 更新策略 |
|------|------|-----|----------|
| 热点数据 | 词库/关卡配置 | 1小时 | 主动更新 |
| 用户数据 | 用户信息/进度 | 10分钟 | 写时更新 |
| 排行榜 | 周榜/月榜/总榜 | 实时 | 实时更新 |
| 会话数据 | JWT/RefreshToken | 7天 | 主动更新 |
| 临时数据 | 验证码/游戏会话 | 5-30分钟 | 到期删除 |

---

## 2. Key 命名规范

### 2.1 命名规则

```
{业务域}:{数据类型}:{标识符}[:子项]
```

### 2.2 Key 定义表

| Key 模式 | 说明 | 示例 | TTL |
|----------|------|------|-----|
| `user:info:{userId}` | 用户基本信息 | `user:info:usr_123` | 600s |
| `user:level:{userId}` | 用户等级信息 | `user:level:usr_123` | 600s |
| `user:progress:{userId}:{bankId}` | 词库学习进度 | `user:progress:usr_123:bank_456` | 300s |
| `wordbank:list:{categoryId}` | 词库列表 | `wordbank:list:cat_primary` | 3600s |
| `wordbank:detail:{bankId}` | 词库详情 | `wordbank:detail:bank_123` | 3600s |
| `chapter:list:{bankId}` | 关卡列表 | `chapter:list:bank_123` | 3600s |
| `section:words:{sectionId}` | 小节单词 | `section:words:sec_123` | 3600s |
| `game:session:{sessionId}` | 游戏会话 | `game:session:gs_abc123` | 1800s |
| `ranking:weekly` | 周排行榜 | - | 永久 |
| `ranking:monthly` | 月排行榜 | - | 永久 |
| `ranking:total` | 总排行榜 | - | 永久 |
| `ranking:section:{sectionId}` | 关卡排行榜 | `ranking:section:sec_123` | 永久 |
| `auth:token:{userId}` | 用户Token | `auth:token:usr_123` | 604800s |
| `auth:refresh:{userId}` | RefreshToken | `auth:refresh:usr_123` | 604800s |
| `verify:code:{target}` | 验证码 | `verify:code:138xxxx` | 300s |
| `lock:{resource}` | 分布式锁 | `lock:user_score_update` | 10s |
| `rate:limit:{ip}` | 限流计数 | `rate:limit:192.168.1.1` | 60s |

### 2.3 常量定义

```typescript
// common/constants/cache-keys.ts
export const CacheKeys = {
  // 用户相关
  USER_INFO: (userId: string) => `user:info:${userId}`,
  USER_LEVEL: (userId: string) => `user:level:${userId}`,
  USER_PROGRESS: (userId: string, bankId: string) => 
    `user:progress:${userId}:${bankId}`,
  USER_SECTIONS: (userId: string, bankId: string) => 
    `user:sections:${userId}:${bankId}`,

  // 词库相关
  WORDBANK_LIST: (categoryId?: string) => 
    `wordbank:list:${categoryId || 'all'}`,
  WORDBANK_DETAIL: (bankId: string) => `wordbank:detail:${bankId}`,
  CHAPTER_LIST: (bankId: string) => `chapter:list:${bankId}`,
  SECTION_WORDS: (sectionId: string) => `section:words:${sectionId}`,

  // 游戏相关
  GAME_SESSION: (sessionId: string) => `game:session:${sessionId}`,

  // 排行榜
  RANKING_WEEKLY: 'ranking:weekly',
  RANKING_MONTHLY: 'ranking:monthly',
  RANKING_TOTAL: 'ranking:total',
  RANKING_SECTION: (sectionId: string) => `ranking:section:${sectionId}`,

  // 认证相关
  AUTH_TOKEN: (userId: string) => `auth:token:${userId}`,
  AUTH_REFRESH: (userId: string) => `auth:refresh:${userId}`,
  VERIFY_CODE: (target: string) => `verify:code:${target}`,

  // 分布式锁
  LOCK: (resource: string) => `lock:${resource}`,

  // 限流
  RATE_LIMIT: (ip: string) => `rate:limit:${ip}`,
};

export const CacheTTL = {
  USER_INFO: 600,         // 10分钟
  USER_LEVEL: 600,        // 10分钟
  USER_PROGRESS: 300,     // 5分钟
  WORDBANK_LIST: 3600,    // 1小时
  WORDBANK_DETAIL: 3600,  // 1小时
  CHAPTER_LIST: 3600,     // 1小时
  SECTION_WORDS: 3600,    // 1小时
  GAME_SESSION: 1800,     // 30分钟
  AUTH_TOKEN: 604800,     // 7天
  AUTH_REFRESH: 604800,   // 7天
  VERIFY_CODE: 300,       // 5分钟
  LOCK_DEFAULT: 10,       // 10秒
  RATE_LIMIT: 60,         // 1分钟
};
```

---

## 3. 缓存服务实现

### 3.1 通用缓存服务

```typescript
// shared/cache/cache.service.ts
import { Injectable } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { CacheTTL } from '@/common/constants/cache-keys';

@Injectable()
export class CacheService {
  constructor(private redis: RedisService) {}

  /**
   * 获取缓存，不存在则执行回调并缓存结果
   */
  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl: number = CacheTTL.USER_INFO,
  ): Promise<T> {
    // 尝试从缓存获取
    const cached = await this.redis.getJson<T>(key);
    if (cached !== null) {
      return cached;
    }

    // 缓存未命中，执行查询
    const data = await fetchFn();
    
    // 写入缓存
    if (data !== null && data !== undefined) {
      await this.redis.setJson(key, data, ttl);
    }

    return data;
  }

  /**
   * 批量获取缓存
   */
  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    const client = this.redis.getClient();
    const values = await client.mget(keys);
    return values.map((v) => (v ? JSON.parse(v) : null));
  }

  /**
   * 批量设置缓存
   */
  async mset<T>(
    items: Array<{ key: string; value: T; ttl?: number }>,
  ): Promise<void> {
    const client = this.redis.getClient();
    const pipeline = client.pipeline();

    for (const { key, value, ttl } of items) {
      if (ttl) {
        pipeline.setex(key, ttl, JSON.stringify(value));
      } else {
        pipeline.set(key, JSON.stringify(value));
      }
    }

    await pipeline.exec();
  }

  /**
   * 删除缓存
   */
  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }

  /**
   * 批量删除缓存（支持通配符）
   */
  async delPattern(pattern: string): Promise<void> {
    const client = this.redis.getClient();
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(...keys);
    }
  }

  /**
   * 清除用户相关缓存
   */
  async clearUserCache(userId: string): Promise<void> {
    await this.delPattern(`user:*:${userId}*`);
  }

  /**
   * 清除词库相关缓存
   */
  async clearWordBankCache(bankId?: string): Promise<void> {
    if (bankId) {
      await this.delPattern(`wordbank:*:${bankId}*`);
      await this.delPattern(`chapter:*:${bankId}*`);
    } else {
      await this.delPattern('wordbank:*');
      await this.delPattern('chapter:*');
    }
  }
}
```

### 3.2 使用示例

```typescript
// modules/wordbank/wordbank.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/shared/prisma/prisma.service';
import { CacheService } from '@/shared/cache/cache.service';
import { CacheKeys, CacheTTL } from '@/common/constants/cache-keys';

@Injectable()
export class WordBankService {
  constructor(
    private prisma: PrismaService,
    private cache: CacheService,
  ) {}

  async getList(categoryId?: string) {
    const cacheKey = CacheKeys.WORDBANK_LIST(categoryId);
    
    return this.cache.getOrSet(
      cacheKey,
      async () => {
        return this.prisma.wordBank.findMany({
          where: {
            categoryId: categoryId || undefined,
            isActive: true,
          },
          include: {
            category: true,
          },
          orderBy: { sort: 'asc' },
        });
      },
      CacheTTL.WORDBANK_LIST,
    );
  }

  async getDetail(bankId: string) {
    const cacheKey = CacheKeys.WORDBANK_DETAIL(bankId);
    
    return this.cache.getOrSet(
      cacheKey,
      async () => {
        return this.prisma.wordBank.findUnique({
          where: { id: bankId },
          include: {
            category: true,
            chapters: {
              where: { isActive: true },
              orderBy: { order: 'asc' },
              include: {
                sections: {
                  where: { isActive: true },
                  orderBy: { order: 'asc' },
                },
              },
            },
          },
        });
      },
      CacheTTL.WORDBANK_DETAIL,
    );
  }

  // 更新词库时清除缓存
  async update(bankId: string, data: any) {
    const result = await this.prisma.wordBank.update({
      where: { id: bankId },
      data,
    });

    // 清除相关缓存
    await this.cache.clearWordBankCache(bankId);

    return result;
  }
}
```

---

## 4. 排行榜实现

### 4.1 排行榜服务

```typescript
// modules/ranking/ranking.service.ts
import { Injectable } from '@nestjs/common';
import { RedisService } from '@/shared/redis/redis.service';
import { PrismaService } from '@/shared/prisma/prisma.service';
import { CacheKeys } from '@/common/constants/cache-keys';
import * as dayjs from 'dayjs';

export interface RankingItem {
  rank: number;
  userId: string;
  nickname: string;
  avatar: string;
  score: number;
  level: number;
}

@Injectable()
export class RankingService {
  constructor(
    private redis: RedisService,
    private prisma: PrismaService,
  ) {}

  /**
   * 更新用户分数
   */
  async updateScore(userId: string, score: number): Promise<void> {
    const now = dayjs();
    
    // 更新总榜（累加）
    await this.redis.getClient().zincrby(
      CacheKeys.RANKING_TOTAL,
      score,
      userId,
    );

    // 更新周榜
    const weekKey = this.getWeeklyKey(now);
    await this.redis.getClient().zincrby(weekKey, score, userId);

    // 更新月榜
    const monthKey = this.getMonthlyKey(now);
    await this.redis.getClient().zincrby(monthKey, score, userId);
  }

  /**
   * 获取排行榜
   */
  async getRanking(
    type: 'weekly' | 'monthly' | 'total',
    page: number = 1,
    pageSize: number = 20,
  ): Promise<{ list: RankingItem[]; total: number }> {
    const key = this.getRankingKey(type);
    const start = (page - 1) * pageSize;
    const end = start + pageSize - 1;

    // 获取排行数据
    const rankData = await this.redis.zrevrangeWithScores(key, start, end);
    const total = await this.redis.getClient().zcard(key);

    if (rankData.length === 0) {
      return { list: [], total };
    }

    // 获取用户信息
    const userIds = rankData.map((item) => item.member);
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        nickname: true,
        avatarUrl: true,
        level: { select: { level: true } },
      },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    // 组装结果
    const list: RankingItem[] = rankData.map((item, index) => {
      const user = userMap.get(item.member);
      return {
        rank: start + index + 1,
        userId: item.member,
        nickname: user?.nickname || '未知用户',
        avatar: user?.avatarUrl || '',
        score: item.score,
        level: user?.level?.level || 1,
      };
    });

    return { list, total };
  }

  /**
   * 获取用户排名
   */
  async getUserRank(
    userId: string,
    type: 'weekly' | 'monthly' | 'total',
  ): Promise<{ rank: number | null; score: number }> {
    const key = this.getRankingKey(type);
    
    const [rank, score] = await Promise.all([
      this.redis.zrank(key, userId),
      this.redis.zscore(key, userId),
    ]);

    return {
      rank: rank !== null ? rank + 1 : null,
      score: score || 0,
    };
  }

  /**
   * 获取关卡排行榜
   */
  async getSectionRanking(
    sectionId: string,
    page: number = 1,
    pageSize: number = 20,
  ): Promise<{ list: RankingItem[]; total: number }> {
    const key = CacheKeys.RANKING_SECTION(sectionId);
    // 实现同 getRanking
    return this.getRankingByKey(key, page, pageSize);
  }

  /**
   * 更新关卡排行榜
   */
  async updateSectionScore(
    sectionId: string,
    userId: string,
    score: number,
  ): Promise<void> {
    const key = CacheKeys.RANKING_SECTION(sectionId);
    
    // 只保留最高分
    const currentScore = await this.redis.zscore(key, userId);
    if (currentScore === null || score > currentScore) {
      await this.redis.zadd(key, score, userId);
    }
  }

  /**
   * 重置周榜（定时任务调用）
   */
  async resetWeeklyRanking(): Promise<void> {
    const now = dayjs();
    const prevWeekKey = this.getWeeklyKey(now.subtract(1, 'week'));
    
    // 删除上周的排行榜
    await this.redis.del(prevWeekKey);
  }

  /**
   * 重置月榜（定时任务调用）
   */
  async resetMonthlyRanking(): Promise<void> {
    const now = dayjs();
    const prevMonthKey = this.getMonthlyKey(now.subtract(1, 'month'));
    
    // 删除上月的排行榜
    await this.redis.del(prevMonthKey);
  }

  // 私有方法
  private getRankingKey(type: 'weekly' | 'monthly' | 'total'): string {
    const now = dayjs();
    switch (type) {
      case 'weekly':
        return this.getWeeklyKey(now);
      case 'monthly':
        return this.getMonthlyKey(now);
      case 'total':
        return CacheKeys.RANKING_TOTAL;
    }
  }

  private getWeeklyKey(date: dayjs.Dayjs): string {
    const weekStart = date.startOf('week').format('YYYYMMDD');
    return `${CacheKeys.RANKING_WEEKLY}:${weekStart}`;
  }

  private getMonthlyKey(date: dayjs.Dayjs): string {
    const month = date.format('YYYYMM');
    return `${CacheKeys.RANKING_MONTHLY}:${month}`;
  }

  private async getRankingByKey(
    key: string,
    page: number,
    pageSize: number,
  ): Promise<{ list: RankingItem[]; total: number }> {
    const start = (page - 1) * pageSize;
    const end = start + pageSize - 1;

    const rankData = await this.redis.zrevrangeWithScores(key, start, end);
    const total = await this.redis.getClient().zcard(key);

    if (rankData.length === 0) {
      return { list: [], total };
    }

    const userIds = rankData.map((item) => item.member);
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        nickname: true,
        avatarUrl: true,
        level: { select: { level: true } },
      },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    const list: RankingItem[] = rankData.map((item, index) => {
      const user = userMap.get(item.member);
      return {
        rank: start + index + 1,
        userId: item.member,
        nickname: user?.nickname || '未知用户',
        avatar: user?.avatarUrl || '',
        score: item.score,
        level: user?.level?.level || 1,
      };
    });

    return { list, total };
  }
}
```

---

## 5. 分布式锁

### 5.1 锁服务实现

```typescript
// shared/redis/lock.service.ts
import { Injectable } from '@nestjs/common';
import { RedisService } from './redis.service';
import { CacheKeys, CacheTTL } from '@/common/constants/cache-keys';

@Injectable()
export class LockService {
  constructor(private redis: RedisService) {}

  /**
   * 获取锁
   */
  async acquire(
    resource: string,
    ttl: number = CacheTTL.LOCK_DEFAULT,
  ): Promise<string | null> {
    return this.redis.acquireLock(resource, ttl);
  }

  /**
   * 释放锁
   */
  async release(resource: string, lockValue: string): Promise<boolean> {
    return this.redis.releaseLock(resource, lockValue);
  }

  /**
   * 使用锁执行操作
   */
  async withLock<T>(
    resource: string,
    fn: () => Promise<T>,
    options?: { ttl?: number; retries?: number; retryDelay?: number },
  ): Promise<T> {
    const { ttl = 10, retries = 3, retryDelay = 100 } = options || {};

    let lockValue: string | null = null;
    let attempts = 0;

    // 尝试获取锁
    while (attempts < retries) {
      lockValue = await this.acquire(resource, ttl);
      if (lockValue) break;
      
      attempts++;
      if (attempts < retries) {
        await this.sleep(retryDelay);
      }
    }

    if (!lockValue) {
      throw new Error(`Failed to acquire lock for resource: ${resource}`);
    }

    try {
      return await fn();
    } finally {
      await this.release(resource, lockValue);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
```

### 5.2 使用示例

```typescript
// 防止用户重复提交游戏结果
async submitResult(userId: string, dto: SubmitResultDto) {
  const lockResource = `game_submit:${userId}:${dto.sessionId}`;
  
  return this.lockService.withLock(lockResource, async () => {
    // 提交游戏结果的逻辑
    return this.processGameResult(userId, dto);
  });
}
```

---

## 6. 会话管理

### 6.1 会话存储

```typescript
// modules/auth/session.service.ts
import { Injectable } from '@nestjs/common';
import { RedisService } from '@/shared/redis/redis.service';
import { CacheKeys, CacheTTL } from '@/common/constants/cache-keys';

export interface UserSession {
  userId: string;
  deviceInfo?: string;
  loginAt: number;
  lastActiveAt: number;
}

@Injectable()
export class SessionService {
  constructor(private redis: RedisService) {}

  /**
   * 创建会话
   */
  async createSession(
    userId: string,
    token: string,
    refreshToken: string,
    deviceInfo?: string,
  ): Promise<void> {
    const session: UserSession = {
      userId,
      deviceInfo,
      loginAt: Date.now(),
      lastActiveAt: Date.now(),
    };

    await Promise.all([
      this.redis.set(
        CacheKeys.AUTH_TOKEN(userId),
        token,
        CacheTTL.AUTH_TOKEN,
      ),
      this.redis.set(
        CacheKeys.AUTH_REFRESH(userId),
        refreshToken,
        CacheTTL.AUTH_REFRESH,
      ),
      this.redis.setJson(
        `session:${userId}`,
        session,
        CacheTTL.AUTH_TOKEN,
      ),
    ]);
  }

  /**
   * 验证Token
   */
  async validateToken(userId: string, token: string): Promise<boolean> {
    const storedToken = await this.redis.get(CacheKeys.AUTH_TOKEN(userId));
    return storedToken === token;
  }

  /**
   * 刷新会话
   */
  async refreshSession(userId: string): Promise<void> {
    const session = await this.redis.getJson<UserSession>(`session:${userId}`);
    if (session) {
      session.lastActiveAt = Date.now();
      await this.redis.setJson(
        `session:${userId}`,
        session,
        CacheTTL.AUTH_TOKEN,
      );
    }
  }

  /**
   * 销毁会话
   */
  async destroySession(userId: string): Promise<void> {
    await Promise.all([
      this.redis.del(CacheKeys.AUTH_TOKEN(userId)),
      this.redis.del(CacheKeys.AUTH_REFRESH(userId)),
      this.redis.del(`session:${userId}`),
    ]);
  }

  /**
   * 获取会话信息
   */
  async getSession(userId: string): Promise<UserSession | null> {
    return this.redis.getJson<UserSession>(`session:${userId}`);
  }
}
```

---

## 7. 缓存预热

### 7.1 预热服务

```typescript
// shared/cache/cache-warmup.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '@/shared/prisma/prisma.service';
import { CacheService } from './cache.service';
import { CacheKeys, CacheTTL } from '@/common/constants/cache-keys';

@Injectable()
export class CacheWarmupService implements OnModuleInit {
  constructor(
    private prisma: PrismaService,
    private cache: CacheService,
  ) {}

  async onModuleInit() {
    // 应用启动时预热缓存
    if (process.env.CACHE_WARMUP === 'true') {
      await this.warmup();
    }
  }

  async warmup(): Promise<void> {
    console.log('Starting cache warmup...');

    await Promise.all([
      this.warmupCategories(),
      this.warmupWordBanks(),
      this.warmupAchievements(),
    ]);

    console.log('Cache warmup completed');
  }

  private async warmupCategories(): Promise<void> {
    const categories = await this.prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sort: 'asc' },
    });

    await this.cache.mset([
      {
        key: 'categories:all',
        value: categories,
        ttl: CacheTTL.WORDBANK_LIST,
      },
    ]);
  }

  private async warmupWordBanks(): Promise<void> {
    const wordBanks = await this.prisma.wordBank.findMany({
      where: { isActive: true },
      include: { category: true },
      orderBy: { sort: 'asc' },
    });

    // 按分类分组缓存
    const byCategory = wordBanks.reduce((acc, bank) => {
      const catId = bank.categoryId;
      if (!acc[catId]) acc[catId] = [];
      acc[catId].push(bank);
      return acc;
    }, {} as Record<string, typeof wordBanks>);

    const cacheItems = [
      {
        key: CacheKeys.WORDBANK_LIST(),
        value: wordBanks,
        ttl: CacheTTL.WORDBANK_LIST,
      },
      ...Object.entries(byCategory).map(([catId, banks]) => ({
        key: CacheKeys.WORDBANK_LIST(catId),
        value: banks,
        ttl: CacheTTL.WORDBANK_LIST,
      })),
    ];

    await this.cache.mset(cacheItems);
  }

  private async warmupAchievements(): Promise<void> {
    const achievements = await this.prisma.achievement.findMany({
      where: { isActive: true },
      orderBy: { sort: 'asc' },
    });

    await this.cache.mset([
      {
        key: 'achievements:all',
        value: achievements,
        ttl: CacheTTL.WORDBANK_LIST,
      },
    ]);
  }
}
```

---

## 8. 缓存监控

### 8.1 监控指标

```typescript
// shared/cache/cache-metrics.service.ts
import { Injectable } from '@nestjs/common';
import { RedisService } from '@/shared/redis/redis.service';

@Injectable()
export class CacheMetricsService {
  private hitCount = 0;
  private missCount = 0;

  constructor(private redis: RedisService) {}

  recordHit(): void {
    this.hitCount++;
  }

  recordMiss(): void {
    this.missCount++;
  }

  getHitRate(): number {
    const total = this.hitCount + this.missCount;
    return total > 0 ? this.hitCount / total : 0;
  }

  async getRedisInfo(): Promise<Record<string, string>> {
    const client = this.redis.getClient();
    const info = await client.info();
    
    const result: Record<string, string> = {};
    info.split('\r\n').forEach((line) => {
      const [key, value] = line.split(':');
      if (key && value) {
        result[key] = value;
      }
    });

    return result;
  }

  async getKeyCount(): Promise<number> {
    const client = this.redis.getClient();
    return client.dbsize();
  }

  async getMemoryUsage(): Promise<string> {
    const info = await this.getRedisInfo();
    return info['used_memory_human'] || 'N/A';
  }

  getStats() {
    return {
      hitCount: this.hitCount,
      missCount: this.missCount,
      hitRate: this.getHitRate(),
    };
  }

  resetStats(): void {
    this.hitCount = 0;
    this.missCount = 0;
  }
}
```

---

**文档版本**: v1.0  
**最后更新**: 2026-02-27
