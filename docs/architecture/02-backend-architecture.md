# 后端架构设计

## 1. 技术栈总览

### 1.1 核心技术栈

```
┌─────────────────────────────────────────────────────────────┐
│                      后端技术栈                              │
├─────────────────────────────────────────────────────────────┤
│  运行时:     Node.js 20 LTS                                 │
│  框架:       NestJS 10                                      │
│  语言:       TypeScript 5                                   │
│  ORM:        Prisma 5                                       │
│  验证:       class-validator + class-transformer           │
│  认证:       Passport + JWT                                 │
│  文档:       Swagger (OpenAPI 3.0)                         │
│  日志:       Winston + morgan                               │
│  缓存:       Redis (ioredis)                               │
│  队列:       Bull (基于Redis)                               │
│  测试:       Jest + Supertest                              │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 依赖版本

```json
{
  "dependencies": {
    "@nestjs/common": "^10.3.0",
    "@nestjs/core": "^10.3.0",
    "@nestjs/platform-express": "^10.3.0",
    "@nestjs/config": "^3.2.0",
    "@nestjs/jwt": "^10.2.0",
    "@nestjs/passport": "^10.0.3",
    "@nestjs/swagger": "^7.3.0",
    "@nestjs/throttler": "^5.1.0",
    "@nestjs/bull": "^10.1.0",
    "@prisma/client": "^5.10.0",
    "passport": "^0.7.0",
    "passport-jwt": "^4.0.1",
    "passport-local": "^1.0.0",
    "bcrypt": "^5.1.1",
    "class-validator": "^0.14.1",
    "class-transformer": "^0.5.1",
    "ioredis": "^5.3.2",
    "bull": "^4.12.0",
    "winston": "^3.11.0",
    "helmet": "^7.1.0",
    "compression": "^1.7.4",
    "dayjs": "^1.11.10",
    "uuid": "^9.0.1"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.3.0",
    "@nestjs/testing": "^10.3.0",
    "@types/node": "^20.11.0",
    "typescript": "^5.3.3",
    "prisma": "^5.10.0",
    "jest": "^29.7.0",
    "@types/jest": "^29.5.12",
    "supertest": "^6.3.4",
    "eslint": "^8.56.0",
    "prettier": "^3.2.0"
  }
}
```

---

## 2. 项目结构

### 2.1 目录结构

```
src/
├── main.ts                       # 应用入口
├── app.module.ts                 # 根模块
│
├── common/                       # 公共模块
│   ├── decorators/               # 自定义装饰器
│   │   ├── current-user.decorator.ts
│   │   ├── roles.decorator.ts
│   │   └── api-response.decorator.ts
│   ├── filters/                  # 异常过滤器
│   │   ├── http-exception.filter.ts
│   │   └── all-exception.filter.ts
│   ├── guards/                   # 守卫
│   │   ├── jwt-auth.guard.ts
│   │   ├── roles.guard.ts
│   │   └── throttler.guard.ts
│   ├── interceptors/             # 拦截器
│   │   ├── transform.interceptor.ts
│   │   ├── logging.interceptor.ts
│   │   └── timeout.interceptor.ts
│   ├── pipes/                    # 管道
│   │   └── validation.pipe.ts
│   ├── middlewares/              # 中间件
│   │   └── logger.middleware.ts
│   ├── interfaces/               # 公共接口
│   │   └── response.interface.ts
│   ├── constants/                # 常量
│   │   ├── error-codes.ts
│   │   └── cache-keys.ts
│   └── utils/                    # 工具函数
│       ├── hash.util.ts
│       ├── id-generator.util.ts
│       └── pagination.util.ts
│
├── config/                       # 配置模块
│   ├── config.module.ts
│   ├── database.config.ts
│   ├── redis.config.ts
│   ├── jwt.config.ts
│   └── app.config.ts
│
├── modules/                      # 业务模块
│   ├── auth/                     # 认证模块
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── strategies/
│   │   │   ├── jwt.strategy.ts
│   │   │   └── local.strategy.ts
│   │   ├── dto/
│   │   │   ├── login.dto.ts
│   │   │   ├── register.dto.ts
│   │   │   └── refresh-token.dto.ts
│   │   └── guards/
│   │       └── jwt-auth.guard.ts
│   │
│   ├── user/                     # 用户模块
│   │   ├── user.module.ts
│   │   ├── user.controller.ts
│   │   ├── user.service.ts
│   │   ├── user.repository.ts
│   │   ├── dto/
│   │   │   ├── create-user.dto.ts
│   │   │   ├── update-user.dto.ts
│   │   │   └── user-response.dto.ts
│   │   └── entities/
│   │       └── user.entity.ts
│   │
│   ├── wordbank/                 # 词库模块
│   │   ├── wordbank.module.ts
│   │   ├── controllers/
│   │   │   ├── category.controller.ts
│   │   │   ├── wordbank.controller.ts
│   │   │   └── word.controller.ts
│   │   ├── services/
│   │   │   ├── category.service.ts
│   │   │   ├── wordbank.service.ts
│   │   │   └── word.service.ts
│   │   ├── repositories/
│   │   │   ├── category.repository.ts
│   │   │   ├── wordbank.repository.ts
│   │   │   └── word.repository.ts
│   │   └── dto/
│   │       ├── create-wordbank.dto.ts
│   │       └── import-words.dto.ts
│   │
│   ├── level/                    # 关卡模块
│   │   ├── level.module.ts
│   │   ├── controllers/
│   │   │   ├── chapter.controller.ts
│   │   │   └── section.controller.ts
│   │   ├── services/
│   │   │   ├── chapter.service.ts
│   │   │   ├── section.service.ts
│   │   │   └── progress.service.ts
│   │   └── dto/
│   │
│   ├── game/                     # 游戏模块
│   │   ├── game.module.ts
│   │   ├── game.controller.ts
│   │   ├── game.service.ts
│   │   ├── game.gateway.ts       # WebSocket网关(可选)
│   │   ├── dto/
│   │   │   ├── start-game.dto.ts
│   │   │   └── submit-result.dto.ts
│   │   └── processors/
│   │       └── game-result.processor.ts
│   │
│   ├── learning/                 # 学习模块
│   │   ├── learning.module.ts
│   │   ├── controllers/
│   │   │   ├── stats.controller.ts
│   │   │   └── wrongbook.controller.ts
│   │   ├── services/
│   │   │   ├── stats.service.ts
│   │   │   ├── wrongbook.service.ts
│   │   │   └── mastery.service.ts
│   │   └── dto/
│   │
│   ├── ranking/                  # 排行榜模块
│   │   ├── ranking.module.ts
│   │   ├── ranking.controller.ts
│   │   ├── ranking.service.ts
│   │   └── dto/
│   │
│   ├── achievement/              # 成就模块
│   │   ├── achievement.module.ts
│   │   ├── achievement.controller.ts
│   │   ├── achievement.service.ts
│   │   └── dto/
│   │
│   └── admin/                    # 管理后台模块
│       ├── admin.module.ts
│       ├── controllers/
│       │   ├── admin-user.controller.ts
│       │   ├── admin-wordbank.controller.ts
│       │   └── admin-stats.controller.ts
│       └── services/
│
├── shared/                       # 共享模块
│   ├── prisma/                   # Prisma模块
│   │   ├── prisma.module.ts
│   │   └── prisma.service.ts
│   ├── redis/                    # Redis模块
│   │   ├── redis.module.ts
│   │   └── redis.service.ts
│   ├── cache/                    # 缓存模块
│   │   ├── cache.module.ts
│   │   └── cache.service.ts
│   ├── queue/                    # 队列模块
│   │   ├── queue.module.ts
│   │   └── queue.service.ts
│   └── logger/                   # 日志模块
│       ├── logger.module.ts
│       └── logger.service.ts
│
└── prisma/                       # Prisma配置
    ├── schema.prisma
    ├── migrations/
    └── seed.ts
```

---

## 3. 分层架构

### 3.1 架构分层图

```
┌─────────────────────────────────────────────────────────────┐
│                     表现层 (Presentation)                    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                   Controllers                        │   │
│  │  - 处理HTTP请求/响应                                  │   │
│  │  - 参数验证 (DTO + ValidationPipe)                   │   │
│  │  - 路由定义                                          │   │
│  │  - Swagger文档                                       │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     业务层 (Business)                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                    Services                          │   │
│  │  - 业务逻辑实现                                       │   │
│  │  - 事务管理                                           │   │
│  │  - 缓存策略                                           │   │
│  │  - 跨模块调用协调                                     │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   数据访问层 (Data Access)                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Repositories + Prisma Client            │   │
│  │  - 数据库CRUD操作                                     │   │
│  │  - 复杂查询封装                                       │   │
│  │  - 数据映射                                           │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    基础设施层 (Infrastructure)               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │PostgreSQL│  │  Redis   │  │   OSS    │  │  Queue   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 请求处理流程

```
HTTP Request
     │
     ▼
┌──────────────┐
│  Middleware  │  → Logger, CORS, Compression
└──────────────┘
     │
     ▼
┌──────────────┐
│    Guards    │  → JWT验证, 角色验证, 限流
└──────────────┘
     │
     ▼
┌──────────────┐
│ Interceptors │  → Before: 日志, 超时
└──────────────┘
     │
     ▼
┌──────────────┐
│    Pipes     │  → 参数验证, 数据转换
└──────────────┘
     │
     ▼
┌──────────────┐
│  Controller  │  → 路由处理
└──────────────┘
     │
     ▼
┌──────────────┐
│   Service    │  → 业务逻辑
└──────────────┘
     │
     ▼
┌──────────────┐
│ Repository   │  → 数据访问
└──────────────┘
     │
     ▼
┌──────────────┐
│ Interceptors │  → After: 响应转换
└──────────────┘
     │
     ▼
┌──────────────┐
│   Filters    │  → 异常处理
└──────────────┘
     │
     ▼
HTTP Response
```

---

## 4. 核心模块实现

### 4.1 应用入口

```typescript
// main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import helmet from 'helmet';
import compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 安全中间件
  app.use(helmet());
  app.use(compression());

  // CORS配置
  app.enableCors({
    origin: process.env.CORS_ORIGINS?.split(',') || '*',
    credentials: true,
  });

  // API版本控制
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // 全局前缀
  app.setGlobalPrefix('api');

  // 全局管道
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // 全局过滤器
  app.useGlobalFilters(new HttpExceptionFilter());

  // 全局拦截器
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new TransformInterceptor(),
  );

  // Swagger文档
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('BoomWord API')
      .setDescription('BoomWord 单词泡泡消消乐 API文档')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);
  }

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}

bootstrap();
```

### 4.2 根模块

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

// 配置
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import redisConfig from './config/redis.config';
import jwtConfig from './config/jwt.config';

// 共享模块
import { PrismaModule } from './shared/prisma/prisma.module';
import { RedisModule } from './shared/redis/redis.module';
import { CacheModule } from './shared/cache/cache.module';
import { LoggerModule } from './shared/logger/logger.module';

// 业务模块
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { WordbankModule } from './modules/wordbank/wordbank.module';
import { LevelModule } from './modules/level/level.module';
import { GameModule } from './modules/game/game.module';
import { LearningModule } from './modules/learning/learning.module';
import { RankingModule } from './modules/ranking/ranking.module';
import { AchievementModule } from './modules/achievement/achievement.module';
import { AdminModule } from './modules/admin/admin.module';

// Guards
import { ThrottlerGuard } from '@nestjs/throttler';

@Module({
  imports: [
    // 配置模块
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, redisConfig, jwtConfig],
    }),

    // 限流模块
    ThrottlerModule.forRoot([
      {
        ttl: 60000,  // 1分钟
        limit: 100,  // 100次请求
      },
    ]),

    // 共享模块
    PrismaModule,
    RedisModule,
    CacheModule,
    LoggerModule,

    // 业务模块
    AuthModule,
    UserModule,
    WordbankModule,
    LevelModule,
    GameModule,
    LearningModule,
    RankingModule,
    AchievementModule,
    AdminModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
```

### 4.3 Prisma 服务

```typescript
// shared/prisma/prisma.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'stdout', level: 'info' },
        { emit: 'stdout', level: 'warn' },
        { emit: 'stdout', level: 'error' },
      ],
    });
  }

  async onModuleInit() {
    await this.$connect();

    // 查询日志（开发环境）
    if (process.env.NODE_ENV === 'development') {
      // @ts-ignore
      this.$on('query', (e: any) => {
        console.log('Query: ' + e.query);
        console.log('Duration: ' + e.duration + 'ms');
      });
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  // 软删除扩展
  async softDelete(model: string, id: string) {
    return (this as any)[model].update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // 事务封装
  async executeInTransaction<T>(
    fn: (prisma: PrismaService) => Promise<T>,
  ): Promise<T> {
    return this.$transaction(async (prisma) => {
      return fn(prisma as PrismaService);
    });
  }
}
```

### 4.4 Redis 服务

```typescript
// shared/redis/redis.service.ts
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly client: Redis;

  constructor(private configService: ConfigService) {
    this.client = new Redis({
      host: this.configService.get('redis.host'),
      port: this.configService.get('redis.port'),
      password: this.configService.get('redis.password'),
      db: this.configService.get('redis.db'),
    });
  }

  async onModuleDestroy() {
    await this.client.quit();
  }

  getClient(): Redis {
    return this.client;
  }

  // 基础操作
  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl) {
      await this.client.setex(key, ttl, value);
    } else {
      await this.client.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async exists(key: string): Promise<boolean> {
    return (await this.client.exists(key)) === 1;
  }

  // JSON操作
  async getJson<T>(key: string): Promise<T | null> {
    const data = await this.get(key);
    return data ? JSON.parse(data) : null;
  }

  async setJson<T>(key: string, value: T, ttl?: number): Promise<void> {
    await this.set(key, JSON.stringify(value), ttl);
  }

  // 排行榜操作
  async zadd(key: string, score: number, member: string): Promise<void> {
    await this.client.zadd(key, score, member);
  }

  async zrevrange(
    key: string,
    start: number,
    stop: number,
  ): Promise<string[]> {
    return this.client.zrevrange(key, start, stop);
  }

  async zrevrangeWithScores(
    key: string,
    start: number,
    stop: number,
  ): Promise<Array<{ member: string; score: number }>> {
    const result = await this.client.zrevrange(key, start, stop, 'WITHSCORES');
    const parsed: Array<{ member: string; score: number }> = [];
    for (let i = 0; i < result.length; i += 2) {
      parsed.push({
        member: result[i],
        score: parseFloat(result[i + 1]),
      });
    }
    return parsed;
  }

  async zrank(key: string, member: string): Promise<number | null> {
    return this.client.zrevrank(key, member);
  }

  async zscore(key: string, member: string): Promise<number | null> {
    const score = await this.client.zscore(key, member);
    return score ? parseFloat(score) : null;
  }

  // 分布式锁
  async acquireLock(
    key: string,
    ttl: number = 10,
  ): Promise<string | null> {
    const lockKey = `lock:${key}`;
    const lockValue = Date.now().toString();
    const result = await this.client.set(lockKey, lockValue, 'EX', ttl, 'NX');
    return result === 'OK' ? lockValue : null;
  }

  async releaseLock(key: string, lockValue: string): Promise<boolean> {
    const lockKey = `lock:${key}`;
    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;
    const result = await this.client.eval(script, 1, lockKey, lockValue);
    return result === 1;
  }

  // 计数器
  async incr(key: string): Promise<number> {
    return this.client.incr(key);
  }

  async incrBy(key: string, increment: number): Promise<number> {
    return this.client.incrby(key, increment);
  }
}
```

---

## 5. 认证模块实现

### 5.1 认证服务

```typescript
// modules/auth/auth.service.ts
import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '@/shared/prisma/prisma.service';
import { RedisService } from '@/shared/redis/redis.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { IdGenerator } from '@/common/utils/id-generator.util';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private redis: RedisService,
  ) {}

  // 登录
  async login(dto: LoginDto) {
    const { phone, email, password } = dto;

    // 查找用户
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { phone: phone || undefined },
          { email: email || undefined },
        ],
        deletedAt: null,
      },
      include: {
        level: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('密码错误');
    }

    // 检查账号状态
    if (user.status === 'locked') {
      throw new UnauthorizedException('账号已被锁定');
    }

    if (user.status === 'banned') {
      throw new UnauthorizedException('账号已被封禁');
    }

    // 生成Token
    const tokens = await this.generateTokens(user.id);

    // 更新最后登录时间
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
      },
    });

    return {
      user: {
        id: user.id,
        nickname: user.nickname,
        avatar: user.avatarUrl,
        level: user.level?.level || 1,
        exp: user.level?.currentExp || 0,
      },
      ...tokens,
    };
  }

  // 注册
  async register(dto: RegisterDto) {
    const { phone, email, password, nickname, code } = dto;

    // 验证验证码
    await this.verifyCode(phone || email!, code);

    // 检查用户是否存在
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { phone: phone || undefined },
          { email: email || undefined },
        ],
      },
    });

    if (existingUser) {
      throw new ConflictException('用户已存在');
    }

    // 密码加密
    const passwordHash = await bcrypt.hash(password, 10);

    // 创建用户
    const user = await this.prisma.$transaction(async (tx) => {
      // 创建用户
      const newUser = await tx.user.create({
        data: {
          id: IdGenerator.userId(),
          phone,
          email,
          passwordHash,
          nickname,
          status: 'active',
        },
      });

      // 初始化用户等级
      await tx.userLevel.create({
        data: {
          id: IdGenerator.uuid(),
          userId: newUser.id,
          level: 1,
          currentExp: 0,
          totalExp: 0,
          title: '初学者',
        },
      });

      return newUser;
    });

    // 生成Token
    const tokens = await this.generateTokens(user.id);

    return {
      user: {
        id: user.id,
        nickname: user.nickname,
        avatar: user.avatarUrl,
        level: 1,
        exp: 0,
      },
      ...tokens,
    };
  }

  // 发送验证码
  async sendCode(target: string, type: 'phone' | 'email') {
    // 生成6位验证码
    const code = Math.random().toString().slice(2, 8);

    // 存储验证码（5分钟有效）
    const key = `verify_code:${target}`;
    await this.redis.set(key, code, 300);

    // 发送验证码（实际需要调用短信/邮件服务）
    if (type === 'phone') {
      // TODO: 调用短信服务
      console.log(`Send SMS code ${code} to ${target}`);
    } else {
      // TODO: 调用邮件服务
      console.log(`Send Email code ${code} to ${target}`);
    }

    return { message: '验证码已发送' };
  }

  // 验证验证码
  private async verifyCode(target: string, code: string) {
    const key = `verify_code:${target}`;
    const storedCode = await this.redis.get(key);

    if (!storedCode || storedCode !== code) {
      throw new UnauthorizedException('验证码错误或已过期');
    }

    // 验证成功后删除
    await this.redis.del(key);
  }

  // 生成Token对
  private async generateTokens(userId: string) {
    const payload = { sub: userId };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('jwt.secret'),
        expiresIn: this.configService.get('jwt.expiresIn'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('jwt.refreshSecret'),
        expiresIn: this.configService.get('jwt.refreshExpiresIn'),
      }),
    ]);

    // 存储RefreshToken
    await this.redis.set(
      `refresh_token:${userId}`,
      refreshToken,
      7 * 24 * 60 * 60, // 7天
    );

    return {
      token: accessToken,
      refreshToken,
    };
  }

  // 刷新Token
  async refreshToken(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get('jwt.refreshSecret'),
      });

      const userId = payload.sub;

      // 验证RefreshToken
      const storedToken = await this.redis.get(`refresh_token:${userId}`);
      if (storedToken !== refreshToken) {
        throw new UnauthorizedException('RefreshToken无效');
      }

      // 生成新Token
      return this.generateTokens(userId);
    } catch {
      throw new UnauthorizedException('RefreshToken无效或已过期');
    }
  }

  // 登出
  async logout(userId: string) {
    await this.redis.del(`refresh_token:${userId}`);
    return { message: '登出成功' };
  }
}
```

### 5.2 JWT 策略

```typescript
// modules/auth/strategies/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/shared/prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('jwt.secret'),
    });
  }

  async validate(payload: { sub: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { level: true },
    });

    if (!user || user.deletedAt) {
      throw new UnauthorizedException('用户不存在');
    }

    if (user.status !== 'active') {
      throw new UnauthorizedException('账号状态异常');
    }

    return {
      id: user.id,
      nickname: user.nickname,
      avatar: user.avatarUrl,
      level: user.level?.level || 1,
      role: user.role,
    };
  }
}
```

---

## 6. 游戏模块实现

### 6.1 游戏服务

```typescript
// modules/game/game.service.ts
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/shared/prisma/prisma.service';
import { RedisService } from '@/shared/redis/redis.service';
import { CacheService } from '@/shared/cache/cache.service';
import { StartGameDto } from './dto/start-game.dto';
import { SubmitResultDto } from './dto/submit-result.dto';
import { IdGenerator } from '@/common/utils/id-generator.util';
import { AchievementService } from '../achievement/achievement.service';
import { RankingService } from '../ranking/ranking.service';

@Injectable()
export class GameService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private cache: CacheService,
    private achievementService: AchievementService,
    private rankingService: RankingService,
  ) {}

  // 开始游戏
  async startGame(userId: string, dto: StartGameDto) {
    const { sectionId, mode } = dto;

    // 获取小节信息
    const section = await this.prisma.section.findUnique({
      where: { id: sectionId },
      include: {
        chapter: {
          include: {
            wordBank: true,
          },
        },
        sectionWords: {
          include: {
            word: true,
          },
        },
      },
    });

    if (!section) {
      throw new NotFoundException('小节不存在');
    }

    // 检查解锁状态
    const userSection = await this.prisma.userSection.findUnique({
      where: {
        userId_sectionId: {
          userId,
          sectionId,
        },
      },
    });

    if (!userSection?.unlocked) {
      throw new BadRequestException('该小节尚未解锁');
    }

    // 挑战模式需要练习模式先通过
    if (mode === 'challenge') {
      if (!userSection.practiceCompleted) {
        throw new BadRequestException('请先完成练习模式');
      }
    }

    // 速度挑战需要挑战模式2星以上
    if (mode === 'speed') {
      if (userSection.challengeStars < 2) {
        throw new BadRequestException('挑战模式需达到2星才能解锁速度挑战');
      }
    }

    // 生成游戏会话
    const sessionId = IdGenerator.gameSession();

    // 准备单词数据
    const words = section.sectionWords.map((sw) => ({
      id: sw.word.id,
      english: sw.word.english,
      chinese: sw.word.chinese,
      difficulty: sw.word.difficulty,
    }));

    // 计算时间限制
    const timeLimit = this.calculateTimeLimit(mode, words.length);

    // 缓存游戏会话（30分钟有效）
    await this.redis.setJson(
      `game_session:${sessionId}`,
      {
        userId,
        sectionId,
        mode,
        words,
        timeLimit,
        startTime: Date.now(),
      },
      1800,
    );

    return {
      sessionId,
      words,
      timeLimit,
    };
  }

  // 提交游戏结果
  async submitResult(userId: string, dto: SubmitResultDto) {
    const { sessionId, score, correctCount, wrongCount, maxCombo, timeUsed, wordResults } = dto;

    // 获取游戏会话
    const session = await this.redis.getJson<{
      userId: string;
      sectionId: string;
      mode: string;
      words: any[];
      timeLimit: number;
      startTime: number;
    }>(`game_session:${sessionId}`);

    if (!session) {
      throw new BadRequestException('游戏会话已过期');
    }

    if (session.userId !== userId) {
      throw new BadRequestException('无效的游戏会话');
    }

    // 计算星级
    const totalWords = session.words.length;
    const accuracy = correctCount / totalWords;
    const timeRatio = session.timeLimit > 0 
      ? (session.timeLimit - timeUsed) / session.timeLimit 
      : 1;

    const stars = this.calculateStars(session.mode, accuracy, timeRatio);

    // 保存游戏记录
    const record = await this.prisma.$transaction(async (tx) => {
      // 创建游戏记录
      const gameRecord = await tx.gameRecord.create({
        data: {
          id: IdGenerator.gameRecord(),
          userId,
          sectionId: session.sectionId,
          mode: session.mode,
          score,
          stars,
          correctCount,
          wrongCount,
          totalCount: totalWords,
          maxCombo,
          timeUsed,
          accuracy,
        },
      });

      // 更新小节进度
      const userSection = await tx.userSection.findUnique({
        where: {
          userId_sectionId: {
            userId,
            sectionId: session.sectionId,
          },
        },
      });

      const updateData: any = {};
      if (session.mode === 'practice') {
        updateData.practiceCompleted = true;
        updateData.practiceStars = Math.max(userSection?.practiceStars || 0, stars);
        updateData.practiceBestScore = Math.max(userSection?.practiceBestScore || 0, score);
      } else if (session.mode === 'challenge') {
        updateData.challengeCompleted = true;
        updateData.challengeStars = Math.max(userSection?.challengeStars || 0, stars);
        updateData.challengeBestScore = Math.max(userSection?.challengeBestScore || 0, score);
      } else if (session.mode === 'speed') {
        updateData.speedCompleted = true;
        updateData.speedStars = Math.max(userSection?.speedStars || 0, stars);
        updateData.speedBestScore = Math.max(userSection?.speedBestScore || 0, score);
      }

      await tx.userSection.update({
        where: {
          userId_sectionId: {
            userId,
            sectionId: session.sectionId,
          },
        },
        data: updateData,
      });

      // 更新单词掌握度
      for (const result of wordResults) {
        await tx.userWord.upsert({
          where: {
            userId_wordId: {
              userId,
              wordId: result.wordId,
            },
          },
          create: {
            id: IdGenerator.uuid(),
            userId,
            wordId: result.wordId,
            correctCount: result.correct ? 1 : 0,
            wrongCount: result.correct ? 0 : 1,
            lastPracticeAt: new Date(),
          },
          update: {
            correctCount: result.correct ? { increment: 1 } : undefined,
            wrongCount: result.correct ? undefined : { increment: 1 },
            lastPracticeAt: new Date(),
          },
        });

        // 错词记录
        if (!result.correct) {
          await tx.wrongBook.upsert({
            where: {
              userId_wordId: {
                userId,
                wordId: result.wordId,
              },
            },
            create: {
              id: IdGenerator.uuid(),
              userId,
              wordId: result.wordId,
              wrongCount: 1,
            },
            update: {
              wrongCount: { increment: 1 },
            },
          });
        }
      }

      // 解锁下一小节
      await this.unlockNextSection(tx, userId, session.sectionId);

      // 计算获得的经验值
      const expGained = this.calculateExp(session.mode, stars, score);

      // 更新用户经验
      await tx.userLevel.update({
        where: { userId },
        data: {
          currentExp: { increment: expGained },
          totalExp: { increment: expGained },
        },
      });

      return { gameRecord, expGained };
    });

    // 删除游戏会话
    await this.redis.del(`game_session:${sessionId}`);

    // 更新排行榜
    await this.rankingService.updateScore(userId, score);

    // 检查成就
    const achievements = await this.achievementService.checkAndUnlock(userId, {
      type: 'game',
      score,
      stars,
      combo: maxCombo,
      accuracy,
    });

    // 判断是否新纪录
    const isNewRecord = session.mode === 'challenge' &&
      score > (await this.getPreviousBestScore(userId, session.sectionId, session.mode));

    return {
      recordId: record.gameRecord.id,
      stars,
      score,
      expGained: record.expGained,
      isNewRecord,
      achievements,
    };
  }

  // 计算时间限制
  private calculateTimeLimit(mode: string, wordCount: number): number {
    switch (mode) {
      case 'practice':
        return 0; // 无限制
      case 'challenge':
        return wordCount * 10; // 每词10秒
      case 'speed':
        return wordCount * 5; // 每词5秒
      default:
        return 0;
    }
  }

  // 计算星级
  private calculateStars(mode: string, accuracy: number, timeRatio: number): number {
    if (mode === 'practice') {
      if (accuracy >= 1) return 3;
      if (accuracy >= 0.8) return 2;
      if (accuracy >= 0.6) return 1;
      return 0;
    } else {
      if (accuracy >= 1 && timeRatio >= 0.5) return 3;
      if (accuracy >= 0.8 && timeRatio >= 0.3) return 2;
      if (accuracy >= 0.6 && timeRatio > 0) return 1;
      return 0;
    }
  }

  // 计算经验值
  private calculateExp(mode: string, stars: number, score: number): number {
    let baseExp = 10;
    
    if (mode === 'challenge') baseExp = 20;
    if (mode === 'speed') baseExp = 30;
    
    const starBonus = stars * 5;
    const scoreBonus = Math.floor(score / 100);
    
    return baseExp + starBonus + scoreBonus;
  }

  // 解锁下一小节
  private async unlockNextSection(tx: any, userId: string, currentSectionId: string) {
    // 获取当前小节信息
    const currentSection = await tx.section.findUnique({
      where: { id: currentSectionId },
      include: { chapter: true },
    });

    // 查找下一小节
    const nextSection = await tx.section.findFirst({
      where: {
        chapterId: currentSection.chapterId,
        order: currentSection.order + 1,
      },
    });

    if (nextSection) {
      // 解锁同一关卡的下一小节
      await tx.userSection.upsert({
        where: {
          userId_sectionId: {
            userId,
            sectionId: nextSection.id,
          },
        },
        create: {
          id: IdGenerator.uuid(),
          userId,
          sectionId: nextSection.id,
          unlocked: true,
        },
        update: {
          unlocked: true,
        },
      });
    } else {
      // 当前关卡完成，检查是否解锁下一关卡
      const nextChapter = await tx.chapter.findFirst({
        where: {
          wordBankId: currentSection.chapter.wordBankId,
          order: currentSection.chapter.order + 1,
        },
        include: {
          sections: {
            orderBy: { order: 'asc' },
            take: 1,
          },
        },
      });

      if (nextChapter && nextChapter.sections.length > 0) {
        // 解锁下一关卡的第一小节
        await tx.userSection.upsert({
          where: {
            userId_sectionId: {
              userId,
              sectionId: nextChapter.sections[0].id,
            },
          },
          create: {
            id: IdGenerator.uuid(),
            userId,
            sectionId: nextChapter.sections[0].id,
            unlocked: true,
          },
          update: {
            unlocked: true,
          },
        });
      }
    }
  }

  // 获取之前最高分
  private async getPreviousBestScore(
    userId: string,
    sectionId: string,
    mode: string,
  ): Promise<number> {
    const userSection = await this.prisma.userSection.findUnique({
      where: {
        userId_sectionId: { userId, sectionId },
      },
    });

    if (!userSection) return 0;

    switch (mode) {
      case 'practice':
        return userSection.practiceBestScore || 0;
      case 'challenge':
        return userSection.challengeBestScore || 0;
      case 'speed':
        return userSection.speedBestScore || 0;
      default:
        return 0;
    }
  }
}
```

---

## 7. 异常处理

### 7.1 HTTP异常过滤器

```typescript
// common/filters/http-exception.filter.ts
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status: number;
    let message: string;
    let code: string;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'object') {
        message = (exceptionResponse as any).message || exception.message;
        code = (exceptionResponse as any).code || `E${status}`;
      } else {
        message = exceptionResponse as string;
        code = `E${status}`;
      }
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = '服务器内部错误';
      code = 'E500';
      
      // 记录未知错误
      this.logger.error(
        `Unhandled exception: ${exception}`,
        exception instanceof Error ? exception.stack : '',
      );
    }

    const errorResponse = {
      success: false,
      code,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(status).json(errorResponse);
  }
}
```

### 7.2 响应转换拦截器

```typescript
// common/interceptors/transform.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T> {
  success: boolean;
  code: string;
  message: string;
  data: T;
  timestamp: string;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data) => ({
        success: true,
        code: 'SUCCESS',
        message: '操作成功',
        data,
        timestamp: new Date().toISOString(),
      })),
    );
  }
}
```

---

## 8. 日志系统

### 8.1 Winston 配置

```typescript
// shared/logger/logger.service.ts
import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import * as winston from 'winston';
import 'winston-daily-rotate-file';

@Injectable()
export class LoggerService implements NestLoggerService {
  private logger: winston.Logger;

  constructor() {
    const logFormat = winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.errors({ stack: true }),
      winston.format.printf(({ timestamp, level, message, context, stack }) => {
        return `${timestamp} [${level.toUpperCase()}] [${context || 'Application'}]: ${message}${stack ? '\n' + stack : ''}`;
      }),
    );

    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: logFormat,
      transports: [
        // 控制台输出
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            logFormat,
          ),
        }),
        // 文件输出 - 信息日志
        new winston.transports.DailyRotateFile({
          filename: 'logs/app-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '14d',
          level: 'info',
        }),
        // 文件输出 - 错误日志
        new winston.transports.DailyRotateFile({
          filename: 'logs/error-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '30d',
          level: 'error',
        }),
      ],
    });
  }

  log(message: string, context?: string) {
    this.logger.info(message, { context });
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.error(message, { context, stack: trace });
  }

  warn(message: string, context?: string) {
    this.logger.warn(message, { context });
  }

  debug(message: string, context?: string) {
    this.logger.debug(message, { context });
  }

  verbose(message: string, context?: string) {
    this.logger.verbose(message, { context });
  }
}
```

---

## 9. Dockerfile

```dockerfile
# Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# 安装依赖
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci

# 生成Prisma Client
RUN npx prisma generate

# 构建
COPY . .
RUN npm run build

# 生产镜像
FROM node:20-alpine

WORKDIR /app

# 复制构建产物
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package*.json ./

# 设置环境变量
ENV NODE_ENV=production

EXPOSE 3000

# 启动命令
CMD ["node", "dist/main.js"]
```

---

**文档版本**: v1.0  
**最后更新**: 2026-02-27
