# 可扩展性架构设计

## 1. 扩展性规划

### 1.1 阶段性架构演进

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          架构演进路线                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Phase 1: MVP单体架构                                                   │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  单服务器 + PostgreSQL + Redis                                   │   │
│  │  目标: 1000 DAU, 100 QPS                                        │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                   │                                     │
│                                   ▼                                     │
│  Phase 2: 水平扩展                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  多实例 + 负载均衡 + 读写分离                                     │   │
│  │  目标: 10000 DAU, 1000 QPS                                      │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                   │                                     │
│                                   ▼                                     │
│  Phase 3: 微服务架构                                                    │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  服务拆分 + API网关 + 服务发现 + 消息队列                         │   │
│  │  目标: 100000 DAU, 10000 QPS                                    │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. 水平扩展方案

### 2.1 应用层扩展

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          负载均衡架构                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│                         ┌──────────────┐                               │
│                         │     SLB      │                               │
│                         │  (负载均衡)   │                               │
│                         └──────┬───────┘                               │
│                                │                                        │
│           ┌────────────────────┼────────────────────┐                  │
│           │                    │                    │                   │
│           ▼                    ▼                    ▼                   │
│    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐           │
│    │   API-01     │    │   API-02     │    │   API-03     │           │
│    │  (NestJS)    │    │  (NestJS)    │    │  (NestJS)    │           │
│    └──────────────┘    └──────────────┘    └──────────────┘           │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 无状态设计

```typescript
// 所有会话数据存储在Redis
// 应用实例无状态，可随时扩缩容

// 1. 会话存储在Redis
const sessionConfig = {
  store: new RedisStore({
    client: redis,
    prefix: 'session:',
    ttl: 86400,
  }),
};

// 2. 文件存储使用OSS
const fileStorage = {
  type: 'oss',
  config: {
    bucket: 'boomword-assets',
    region: 'oss-cn-hangzhou',
  },
};

// 3. 定时任务使用分布式锁
async function scheduledTask() {
  const lock = await redis.acquireLock('task:daily-stats', 60);
  if (!lock) return; // 其他实例已在执行
  
  try {
    await processTask();
  } finally {
    await redis.releaseLock('task:daily-stats', lock);
  }
}
```

### 2.3 自动扩缩容

```yaml
# Kubernetes HPA 配置
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: boomword-backend-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: boomword-backend
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
        - type: Pods
          value: 2
          periodSeconds: 60
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
        - type: Pods
          value: 1
          periodSeconds: 120
```

---

## 3. 数据库扩展

### 3.1 读写分离

```typescript
// Prisma 读写分离配置
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  // 读副本
  // relationMode = "prisma"
}

// 服务中使用读写分离
@Injectable()
export class DatabaseService {
  constructor(
    @InjectPrismaClient('write') private writeClient: PrismaClient,
    @InjectPrismaClient('read') private readClient: PrismaClient,
  ) {}

  // 写操作使用主库
  async create(data: any) {
    return this.writeClient.user.create({ data });
  }

  // 读操作使用从库
  async findMany(where: any) {
    return this.readClient.user.findMany({ where });
  }
}
```

### 3.2 分库分表策略

```typescript
// 按用户ID分片
// 游戏记录表按月分区 + 用户ID分片

// 分片规则
const getShardId = (userId: string): number => {
  const hash = crypto.createHash('md5').update(userId).digest('hex');
  return parseInt(hash.substring(0, 8), 16) % 4;  // 4个分片
};

// 分片路由
const getGameRecordTable = (userId: string, date: Date): string => {
  const shardId = getShardId(userId);
  const month = dayjs(date).format('YYYY_MM');
  return `game_records_${shardId}_${month}`;
};

// 分片查询封装
async function queryGameRecords(userId: string, startDate: Date, endDate: Date) {
  const shardId = getShardId(userId);
  const months = getMonthRange(startDate, endDate);
  
  const results = await Promise.all(
    months.map(month => 
      prisma.$queryRaw`
        SELECT * FROM game_records_${shardId}_${month}
        WHERE user_id = ${userId}
        ORDER BY created_at DESC
      `
    )
  );
  
  return results.flat().sort((a, b) => b.createdAt - a.createdAt);
}
```

### 3.3 连接池优化

```typescript
// Prisma 连接池配置
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL + '?connection_limit=20&pool_timeout=20',
    },
  },
});

// PgBouncer 连接池
// pgbouncer.ini
[databases]
boomword = host=postgres port=5432 dbname=boomword

[pgbouncer]
listen_port = 6432
listen_addr = *
auth_type = md5
auth_file = /etc/pgbouncer/userlist.txt
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 20
min_pool_size = 5
reserve_pool_size = 5
reserve_pool_timeout = 3
```

---

## 4. 缓存扩展

### 4.1 Redis Cluster

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        Redis Cluster 架构                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐            │
│   │   Master 1   │    │   Master 2   │    │   Master 3   │            │
│   │  Slot 0-5460 │    │ Slot 5461-   │    │ Slot 10923-  │            │
│   │              │    │    10922     │    │    16383     │            │
│   └──────┬───────┘    └──────┬───────┘    └──────┬───────┘            │
│          │                   │                   │                     │
│          ▼                   ▼                   ▼                     │
│   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐            │
│   │   Slave 1    │    │   Slave 2    │    │   Slave 3    │            │
│   │   (副本)     │    │   (副本)     │    │   (副本)     │            │
│   └──────────────┘    └──────────────┘    └──────────────┘            │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

```typescript
// Redis Cluster 客户端配置
import Redis from 'ioredis';

const redis = new Redis.Cluster([
  { host: 'redis-1', port: 6379 },
  { host: 'redis-2', port: 6379 },
  { host: 'redis-3', port: 6379 },
], {
  scaleReads: 'slave',  // 读操作路由到从节点
  redisOptions: {
    password: process.env.REDIS_PASSWORD,
  },
});
```

### 4.2 多级缓存

```typescript
// 多级缓存策略
// L1: 本地内存缓存 (最快，但有限)
// L2: Redis缓存 (较快，分布式)
// L3: 数据库 (最慢，数据源)

import NodeCache from 'node-cache';

@Injectable()
export class MultiLevelCacheService {
  private localCache = new NodeCache({ stdTTL: 60, checkperiod: 120 });

  constructor(private redis: RedisService) {}

  async get<T>(key: string, fetchFn: () => Promise<T>): Promise<T> {
    // L1: 本地缓存
    const local = this.localCache.get<T>(key);
    if (local !== undefined) {
      return local;
    }

    // L2: Redis缓存
    const remote = await this.redis.getJson<T>(key);
    if (remote !== null) {
      this.localCache.set(key, remote);
      return remote;
    }

    // L3: 数据库
    const data = await fetchFn();
    
    // 回写缓存
    await this.redis.setJson(key, data, 300);
    this.localCache.set(key, data);
    
    return data;
  }

  async invalidate(key: string): Promise<void> {
    this.localCache.del(key);
    await this.redis.del(key);
    
    // 广播缓存失效事件（集群环境）
    await this.redis.getClient().publish('cache:invalidate', key);
  }
}

// 监听缓存失效事件
redis.subscribe('cache:invalidate');
redis.on('message', (channel, key) => {
  if (channel === 'cache:invalidate') {
    localCache.del(key);
  }
});
```

---

## 5. 微服务拆分规划

### 5.1 服务拆分方案

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        微服务架构规划                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│                         ┌──────────────┐                               │
│                         │  API Gateway │                               │
│                         │    (Kong)    │                               │
│                         └──────┬───────┘                               │
│                                │                                        │
│     ┌──────────────────────────┼──────────────────────────┐            │
│     │              │           │           │              │             │
│     ▼              ▼           ▼           ▼              ▼             │
│ ┌────────┐   ┌────────┐   ┌────────┐  ┌────────┐   ┌────────┐         │
│ │  用户  │   │  词库  │   │  游戏  │  │  排行  │   │  学习  │         │
│ │  服务  │   │  服务  │   │  服务  │  │  服务  │   │  服务  │         │
│ └────────┘   └────────┘   └────────┘  └────────┘   └────────┘         │
│     │              │           │           │              │             │
│     └──────────────┴───────────┴───────────┴──────────────┘            │
│                                │                                        │
│                         ┌──────┴───────┐                               │
│                         │  Message Bus │                               │
│                         │  (RabbitMQ)  │                               │
│                         └──────────────┘                               │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 5.2 服务边界定义

| 服务 | 职责 | 数据 |
|------|------|------|
| 用户服务 | 注册登录、用户信息、等级经验 | users, user_levels |
| 词库服务 | 词库管理、单词管理、分类 | categories, word_banks, words |
| 游戏服务 | 游戏流程、计分、会话管理 | game_records |
| 排行服务 | 排行榜、成就系统 | Redis ZSet |
| 学习服务 | 学习统计、错词本、掌握度 | user_words, wrong_books |

### 5.3 服务通信

```typescript
// 同步通信: gRPC
// proto/user.proto
syntax = "proto3";

package user;

service UserService {
  rpc GetUser (GetUserRequest) returns (User);
  rpc UpdateExp (UpdateExpRequest) returns (UpdateExpResponse);
}

message GetUserRequest {
  string user_id = 1;
}

message User {
  string id = 1;
  string nickname = 2;
  int32 level = 3;
  int32 exp = 4;
}

// 异步通信: RabbitMQ
// 游戏结束事件
interface GameFinishedEvent {
  userId: string;
  sectionId: string;
  score: number;
  stars: number;
  timestamp: Date;
}

// 发布事件
async function publishGameFinished(event: GameFinishedEvent) {
  await rabbitMQ.publish('game.finished', event);
}

// 消费事件 (排行服务)
@RabbitSubscribe({
  exchange: 'boomword',
  routingKey: 'game.finished',
  queue: 'ranking.game-finished',
})
async handleGameFinished(event: GameFinishedEvent) {
  await this.rankingService.updateScore(event.userId, event.score);
}

// 消费事件 (学习服务)
@RabbitSubscribe({
  exchange: 'boomword',
  routingKey: 'game.finished',
  queue: 'learning.game-finished',
})
async handleGameFinished(event: GameFinishedEvent) {
  await this.learningService.updateStats(event.userId, event);
}
```

---

## 6. 消息队列应用

### 6.1 队列架构

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        消息队列架构                                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ┌──────────────┐                              ┌──────────────┐       │
│   │    游戏服务   │ ── game.finished ──────────→│  排行服务    │       │
│   └──────────────┘         │                    └──────────────┘       │
│                            │                                            │
│                            │                    ┌──────────────┐       │
│                            └───────────────────→│  学习服务    │       │
│                                                 └──────────────┘       │
│                                                                         │
│   ┌──────────────┐                              ┌──────────────┐       │
│   │    用户服务   │ ── user.level_up ─────────→│  通知服务    │       │
│   └──────────────┘                              └──────────────┘       │
│                                                                         │
│   ┌──────────────┐                              ┌──────────────┐       │
│   │    管理后台   │ ── wordbank.import ───────→│  词库服务    │       │
│   └──────────────┘                              └──────────────┘       │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Bull 队列实现

```typescript
// shared/queue/queue.module.ts
import { BullModule } from '@nestjs/bull';

@Module({
  imports: [
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT),
        password: process.env.REDIS_PASSWORD,
      },
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: false,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
      },
    }),
    BullModule.registerQueue(
      { name: 'game-result' },
      { name: 'word-import' },
      { name: 'notification' },
      { name: 'stats-update' },
    ),
  ],
})
export class QueueModule {}

// 游戏结果处理队列
@Processor('game-result')
export class GameResultProcessor {
  constructor(
    private rankingService: RankingService,
    private learningService: LearningService,
    private achievementService: AchievementService,
  ) {}

  @Process('process')
  async handleGameResult(job: Job<GameResultData>) {
    const { userId, sectionId, score, stars, wordResults } = job.data;

    // 并行处理多个任务
    await Promise.all([
      this.rankingService.updateScore(userId, score),
      this.learningService.updateWordMastery(userId, wordResults),
      this.achievementService.checkAndUnlock(userId, { score, stars }),
    ]);
  }
}

// 添加任务到队列
@Injectable()
export class GameService {
  constructor(
    @InjectQueue('game-result') private gameResultQueue: Queue,
  ) {}

  async submitResult(userId: string, dto: SubmitResultDto) {
    // 快速响应
    const result = await this.quickProcess(userId, dto);

    // 异步处理耗时任务
    await this.gameResultQueue.add('process', {
      userId,
      ...dto,
    }, {
      priority: 1,
      delay: 0,
    });

    return result;
  }
}
```

---

## 7. 性能优化策略

### 7.1 数据库优化

```typescript
// 1. 查询优化
// 使用索引
const user = await prisma.user.findFirst({
  where: { email }, // email 有索引
});

// 2. 批量操作
// 批量插入
await prisma.userWord.createMany({
  data: words.map(w => ({
    userId,
    wordId: w.id,
    correctCount: 0,
  })),
  skipDuplicates: true,
});

// 3. 分页查询
const records = await prisma.gameRecord.findMany({
  where: { userId },
  orderBy: { createdAt: 'desc' },
  take: 20,
  skip: (page - 1) * 20,
  // 使用cursor分页更高效
  // cursor: { id: lastId },
});

// 4. 选择性查询
const user = await prisma.user.findUnique({
  where: { id: userId },
  select: {
    id: true,
    nickname: true,
    // 只选需要的字段
  },
});
```

### 7.2 API优化

```typescript
// 1. 响应压缩
app.use(compression());

// 2. 数据分页
@Get()
async list(@Query() query: PaginationDto) {
  return this.service.findMany({
    page: query.page,
    pageSize: Math.min(query.pageSize, 100), // 限制最大页数
  });
}

// 3. 字段裁剪
@Get(':id')
async getOne(
  @Param('id') id: string,
  @Query('fields') fields?: string,
) {
  const select = fields?.split(',').reduce((acc, f) => {
    acc[f] = true;
    return acc;
  }, {});
  
  return this.service.findOne(id, { select });
}

// 4. 条件缓存
@Get(':id')
@CacheKey('wordbank')
@CacheTTL(3600)
async getWordBank(@Param('id') id: string) {
  return this.service.findOne(id);
}
```

---

## 8. 容量规划

### 8.1 资源预估

| 阶段 | DAU | QPS | 服务器配置 | 数据库 | Redis |
|------|-----|-----|------------|--------|-------|
| MVP | 1K | 100 | 2C4G x 1 | 2C4G | 1G |
| 成长期 | 10K | 1K | 4C8G x 3 | 4C16G主从 | 4G集群 |
| 规模期 | 100K | 10K | 8C16G x 10 | 8C32G分片 | 16G集群 |

### 8.2 数据增长预估

```
每日新增数据预估 (10K DAU):
- 用户数据: ~100条/天 (新注册)
- 游戏记录: ~50000条/天 (人均5局)
- 学习记录: ~100000条/天
- 日志数据: ~1GB/天

存储需求 (1年):
- 数据库: ~100GB
- Redis: ~4GB
- 日志: ~365GB
- 文件: ~50GB (音频/图片)
```

---

**文档版本**: v1.0  
**最后更新**: 2026-02-27
