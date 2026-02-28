# API 架构设计

## 1. API 设计规范

### 1.1 RESTful 设计原则

| 原则 | 说明 |
|------|------|
| 资源导向 | URL表示资源，不包含动词 |
| HTTP方法语义 | GET读取、POST创建、PUT更新、DELETE删除 |
| 状态码规范 | 使用标准HTTP状态码 |
| 版本控制 | URL路径包含版本号 |
| 分页标准 | 统一分页参数和响应格式 |

### 1.2 URL 设计规范

```
# 基础格式
https://api.boomword.com/api/v1/{resource}

# 示例
GET    /api/v1/wordbanks              # 获取词库列表
GET    /api/v1/wordbanks/:id          # 获取词库详情
POST   /api/v1/wordbanks              # 创建词库
PUT    /api/v1/wordbanks/:id          # 更新词库
DELETE /api/v1/wordbanks/:id          # 删除词库

# 子资源
GET    /api/v1/wordbanks/:id/chapters # 获取词库的关卡列表
GET    /api/v1/chapters/:id/sections  # 获取关卡的小节列表

# 操作型接口（动词后缀）
POST   /api/v1/game/start             # 开始游戏
POST   /api/v1/game/submit            # 提交结果
POST   /api/v1/auth/login             # 登录
POST   /api/v1/auth/logout            # 登出
```

---

## 2. 统一响应格式

### 2.1 成功响应

```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "操作成功",
  "data": {
    // 具体数据
  },
  "timestamp": "2026-02-27T10:00:00.000Z"
}
```

### 2.2 分页响应

```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "操作成功",
  "data": {
    "list": [],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 100,
      "totalPages": 5
    }
  },
  "timestamp": "2026-02-27T10:00:00.000Z"
}
```

### 2.3 错误响应

```json
{
  "success": false,
  "code": "E40001",
  "message": "参数验证失败",
  "errors": [
    {
      "field": "email",
      "message": "邮箱格式不正确"
    }
  ],
  "timestamp": "2026-02-27T10:00:00.000Z",
  "path": "/api/v1/auth/register"
}
```

---

## 3. HTTP 状态码

### 3.1 状态码定义

| 状态码 | 说明 | 使用场景 |
|--------|------|----------|
| 200 | OK | 请求成功 |
| 201 | Created | 资源创建成功 |
| 204 | No Content | 删除成功 |
| 400 | Bad Request | 请求参数错误 |
| 401 | Unauthorized | 未认证/Token过期 |
| 403 | Forbidden | 无权限访问 |
| 404 | Not Found | 资源不存在 |
| 409 | Conflict | 资源冲突 |
| 422 | Unprocessable Entity | 验证失败 |
| 429 | Too Many Requests | 请求频率超限 |
| 500 | Internal Server Error | 服务器错误 |

### 3.2 业务错误码

```typescript
// common/constants/error-codes.ts
export const ErrorCodes = {
  // 通用错误 E1xxxx
  SUCCESS: 'SUCCESS',
  UNKNOWN_ERROR: 'E10000',
  VALIDATION_ERROR: 'E10001',
  NOT_FOUND: 'E10002',
  ALREADY_EXISTS: 'E10003',

  // 认证错误 E2xxxx
  UNAUTHORIZED: 'E20001',
  TOKEN_EXPIRED: 'E20002',
  TOKEN_INVALID: 'E20003',
  REFRESH_TOKEN_EXPIRED: 'E20004',
  ACCOUNT_LOCKED: 'E20005',
  ACCOUNT_BANNED: 'E20006',
  WRONG_PASSWORD: 'E20007',
  CODE_INVALID: 'E20008',
  CODE_EXPIRED: 'E20009',

  // 用户错误 E3xxxx
  USER_NOT_FOUND: 'E30001',
  USER_ALREADY_EXISTS: 'E30002',
  NICKNAME_TAKEN: 'E30003',

  // 词库错误 E4xxxx
  WORDBANK_NOT_FOUND: 'E40001',
  CHAPTER_NOT_FOUND: 'E40002',
  SECTION_NOT_FOUND: 'E40003',
  WORD_NOT_FOUND: 'E40004',

  // 游戏错误 E5xxxx
  GAME_SESSION_EXPIRED: 'E50001',
  GAME_SESSION_INVALID: 'E50002',
  SECTION_LOCKED: 'E50003',
  MODE_LOCKED: 'E50004',

  // 限流错误 E6xxxx
  RATE_LIMIT_EXCEEDED: 'E60001',
};

export const ErrorMessages: Record<string, string> = {
  [ErrorCodes.SUCCESS]: '操作成功',
  [ErrorCodes.UNKNOWN_ERROR]: '未知错误',
  [ErrorCodes.VALIDATION_ERROR]: '参数验证失败',
  [ErrorCodes.NOT_FOUND]: '资源不存在',
  [ErrorCodes.ALREADY_EXISTS]: '资源已存在',
  [ErrorCodes.UNAUTHORIZED]: '未授权访问',
  [ErrorCodes.TOKEN_EXPIRED]: 'Token已过期',
  [ErrorCodes.TOKEN_INVALID]: 'Token无效',
  [ErrorCodes.REFRESH_TOKEN_EXPIRED]: 'RefreshToken已过期',
  [ErrorCodes.ACCOUNT_LOCKED]: '账号已锁定',
  [ErrorCodes.ACCOUNT_BANNED]: '账号已封禁',
  [ErrorCodes.WRONG_PASSWORD]: '密码错误',
  [ErrorCodes.CODE_INVALID]: '验证码错误',
  [ErrorCodes.CODE_EXPIRED]: '验证码已过期',
  [ErrorCodes.USER_NOT_FOUND]: '用户不存在',
  [ErrorCodes.USER_ALREADY_EXISTS]: '用户已存在',
  [ErrorCodes.GAME_SESSION_EXPIRED]: '游戏会话已过期',
  [ErrorCodes.SECTION_LOCKED]: '该小节尚未解锁',
  [ErrorCodes.RATE_LIMIT_EXCEEDED]: '请求过于频繁',
};
```

---

## 4. 认证授权

### 4.1 JWT 认证流程

```
┌──────────┐                              ┌──────────┐
│  Client  │                              │  Server  │
└────┬─────┘                              └────┬─────┘
     │                                         │
     │  POST /auth/login                       │
     │  {phone, password}                      │
     │────────────────────────────────────────→│
     │                                         │
     │  200 OK                                 │
     │  {token, refreshToken, user}            │
     │←────────────────────────────────────────│
     │                                         │
     │  GET /wordbanks                         │
     │  Authorization: Bearer {token}          │
     │────────────────────────────────────────→│
     │                                         │
     │  200 OK                                 │
     │  {data: [...]}                          │
     │←────────────────────────────────────────│
     │                                         │
     │  Token过期...                           │
     │                                         │
     │  POST /auth/refresh                     │
     │  {refreshToken}                         │
     │────────────────────────────────────────→│
     │                                         │
     │  200 OK                                 │
     │  {token, refreshToken}                  │
     │←────────────────────────────────────────│
```

### 4.2 请求头格式

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
X-Request-ID: uuid-request-id
X-Device-Info: web/1.0.0
```

### 4.3 JWT 实现

```typescript
// modules/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('jwt.secret'),
        signOptions: {
          expiresIn: config.get('jwt.expiresIn'),
        },
      }),
    }),
  ],
  // ...
})
export class AuthModule {}
```

```typescript
// JWT Payload 结构
interface JwtPayload {
  sub: string;      // 用户ID
  iat: number;      // 签发时间
  exp: number;      // 过期时间
}

// JWT 配置
const jwtConfig = {
  secret: process.env.JWT_SECRET,
  expiresIn: '24h',              // AccessToken 24小时
  refreshSecret: process.env.JWT_REFRESH_SECRET,
  refreshExpiresIn: '7d',        // RefreshToken 7天
};
```

---

## 5. 接口限流

### 5.1 限流策略

| 场景 | 限制 | 说明 |
|------|------|------|
| 全局限流 | 100次/分钟/IP | 防止恶意请求 |
| 登录接口 | 5次/分钟/IP | 防止暴力破解 |
| 验证码接口 | 1次/60秒/手机号 | 防止短信轰炸 |
| 游戏提交 | 10次/分钟/用户 | 防止刷分 |

### 5.2 限流实现

```typescript
// 全局限流配置
@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,     // 1秒
        limit: 10,     // 10次
      },
      {
        name: 'medium',
        ttl: 60000,    // 1分钟
        limit: 100,    // 100次
      },
      {
        name: 'long',
        ttl: 3600000,  // 1小时
        limit: 1000,   // 1000次
      },
    ]),
  ],
})
export class AppModule {}

// 接口级别限流
@Controller('auth')
export class AuthController {
  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async login(@Body() dto: LoginDto) {
    // ...
  }

  @Post('send-code')
  @Throttle({ default: { limit: 1, ttl: 60000 } })
  async sendCode(@Body() dto: SendCodeDto) {
    // ...
  }
}
```

---

## 6. API 接口定义

### 6.1 认证接口

```typescript
// POST /api/v1/auth/register
// 用户注册
Request:
{
  "phone": "13800138000",       // 手机号（二选一）
  "email": "user@example.com", // 邮箱（二选一）
  "password": "Password123",   // 密码 8-20位
  "nickname": "玩家001",        // 昵称 2-20字符
  "code": "123456"             // 验证码
}

Response:
{
  "success": true,
  "data": {
    "user": {
      "id": "usr_abc123",
      "nickname": "玩家001",
      "avatar": "",
      "level": 1,
      "exp": 0
    },
    "token": "eyJhbGci...",
    "refreshToken": "eyJhbGci..."
  }
}

// POST /api/v1/auth/login
// 用户登录
Request:
{
  "phone": "13800138000",
  "password": "Password123"
}

Response:
{
  "success": true,
  "data": {
    "user": {...},
    "token": "eyJhbGci...",
    "refreshToken": "eyJhbGci..."
  }
}

// POST /api/v1/auth/refresh
// 刷新Token
Request:
{
  "refreshToken": "eyJhbGci..."
}

Response:
{
  "success": true,
  "data": {
    "token": "eyJhbGci...",
    "refreshToken": "eyJhbGci..."
  }
}

// POST /api/v1/auth/send-code
// 发送验证码
Request:
{
  "phone": "13800138000",
  "type": "register"  // register | login | reset
}

Response:
{
  "success": true,
  "message": "验证码已发送"
}
```

### 6.2 词库接口

```typescript
// GET /api/v1/categories
// 获取分类列表
Response:
{
  "success": true,
  "data": [
    {
      "id": "cat_001",
      "name": "小学英语",
      "code": "primary",
      "icon": "/icons/primary.png",
      "children": [
        {
          "id": "cat_002",
          "name": "人教版",
          "code": "primary_pep"
        }
      ]
    }
  ]
}

// GET /api/v1/wordbanks
// 获取词库列表
Query:
  categoryId?: string   // 分类ID
  page?: number         // 页码，默认1
  pageSize?: number     // 每页数量，默认20

Response:
{
  "success": true,
  "data": {
    "list": [
      {
        "id": "bank_001",
        "name": "四级核心词汇",
        "description": "大学英语四级考试核心词汇",
        "coverImage": "/covers/cet4.png",
        "wordCount": 2000,
        "chapterCount": 20,
        "difficulty": 3,
        "progress": 0.15,  // 当前用户进度
        "isUnlocked": true
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 50,
      "totalPages": 3
    }
  }
}

// GET /api/v1/wordbanks/:id
// 获取词库详情
Response:
{
  "success": true,
  "data": {
    "id": "bank_001",
    "name": "四级核心词汇",
    "description": "...",
    "wordCount": 2000,
    "chapters": [
      {
        "id": "chap_001",
        "name": "第一章",
        "order": 1,
        "wordCount": 100,
        "sections": [
          {
            "id": "sec_001",
            "name": "1-1",
            "order": 1,
            "wordCount": 10,
            "unlocked": true,
            "practiceStars": 3,
            "challengeStars": 2
          }
        ]
      }
    ],
    "userProgress": {
      "learnedCount": 300,
      "masteredCount": 150,
      "progress": 0.15
    }
  }
}
```

### 6.3 游戏接口

```typescript
// POST /api/v1/game/start
// 开始游戏
Request:
{
  "sectionId": "sec_001",
  "mode": "practice"  // practice | challenge | speed
}

Response:
{
  "success": true,
  "data": {
    "sessionId": "gs_abc123",
    "words": [
      {
        "id": "word_001",
        "english": "apple",
        "chinese": "苹果",
        "difficulty": 1
      }
    ],
    "timeLimit": 100  // 秒，0表示无限制
  }
}

// POST /api/v1/game/submit
// 提交游戏结果
Request:
{
  "sessionId": "gs_abc123",
  "score": 1250,
  "correctCount": 9,
  "wrongCount": 1,
  "maxCombo": 8,
  "timeUsed": 65,
  "wordResults": [
    {
      "wordId": "word_001",
      "correct": true,
      "inputTime": 3200
    }
  ]
}

Response:
{
  "success": true,
  "data": {
    "recordId": "rec_abc123",
    "stars": 2,
    "score": 1250,
    "expGained": 35,
    "isNewRecord": true,
    "achievements": [
      {
        "id": "ach_001",
        "name": "初出茅庐",
        "icon": "/icons/ach_001.png"
      }
    ]
  }
}

// GET /api/v1/game/records/:id
// 获取游戏记录详情
Response:
{
  "success": true,
  "data": {
    "id": "rec_abc123",
    "sectionId": "sec_001",
    "sectionName": "1-1",
    "mode": "challenge",
    "score": 1250,
    "stars": 2,
    "correctCount": 9,
    "wrongCount": 1,
    "accuracy": 0.9,
    "maxCombo": 8,
    "timeUsed": 65,
    "createdAt": "2026-02-27T10:00:00.000Z"
  }
}
```

### 6.4 排行榜接口

```typescript
// GET /api/v1/rankings
// 获取排行榜
Query:
  type: 'weekly' | 'monthly' | 'total'
  page?: number
  pageSize?: number

Response:
{
  "success": true,
  "data": {
    "list": [
      {
        "rank": 1,
        "userId": "usr_001",
        "nickname": "单词王者",
        "avatar": "/avatars/001.png",
        "score": 99999,
        "level": 45
      }
    ],
    "myRank": {
      "rank": 128,
      "score": 12500
    },
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 1000
    }
  }
}

// GET /api/v1/rankings/sections/:sectionId
// 获取关卡排行榜
Response:
{
  "success": true,
  "data": {
    "list": [...],
    "myRank": {...}
  }
}
```

### 6.5 学习统计接口

```typescript
// GET /api/v1/learning/stats
// 获取学习统计
Response:
{
  "success": true,
  "data": {
    "overview": {
      "totalDays": 30,
      "totalMinutes": 1500,
      "totalWords": 500,
      "masteredWords": 300,
      "streakDays": 7,
      "longestStreak": 15
    },
    "today": {
      "studyMinutes": 25,
      "wordsLearned": 30,
      "gamesPlayed": 5
    },
    "weeklyChart": [
      { "date": "2026-02-21", "minutes": 30, "words": 50 },
      { "date": "2026-02-22", "minutes": 45, "words": 60 }
    ]
  }
}

// GET /api/v1/learning/wrongbook
// 获取错词本
Query:
  page?: number
  pageSize?: number

Response:
{
  "success": true,
  "data": {
    "list": [
      {
        "id": "wb_001",
        "word": {
          "id": "word_001",
          "english": "beautiful",
          "chinese": "美丽的",
          "phonetic": "/ˈbjuː.tɪ.fəl/"
        },
        "wrongCount": 3,
        "lastWrongAt": "2026-02-27T10:00:00.000Z"
      }
    ],
    "pagination": {...}
  }
}

// POST /api/v1/learning/wrongbook/practice
// 开始错词练习
Request:
{
  "count": 10  // 练习单词数量
}

Response:
{
  "success": true,
  "data": {
    "sessionId": "gs_wrong_001",
    "words": [...],
    "timeLimit": 0
  }
}
```

---

## 7. Swagger 文档配置

```typescript
// main.ts
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

const config = new DocumentBuilder()
  .setTitle('BoomWord API')
  .setDescription('BoomWord 单词泡泡消消乐 API文档')
  .setVersion('1.0')
  .addBearerAuth(
    {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      name: 'Authorization',
      description: 'Enter JWT token',
      in: 'header',
    },
    'JWT',
  )
  .addTag('auth', '认证相关')
  .addTag('user', '用户相关')
  .addTag('wordbank', '词库相关')
  .addTag('game', '游戏相关')
  .addTag('ranking', '排行榜')
  .addTag('learning', '学习统计')
  .addTag('admin', '管理后台')
  .build();

const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('docs', app, document, {
  swaggerOptions: {
    persistAuthorization: true,
  },
});
```

### 7.2 Controller 装饰器示例

```typescript
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  @Post('login')
  @ApiOperation({ summary: '用户登录' })
  @ApiResponse({ status: 200, description: '登录成功' })
  @ApiResponse({ status: 401, description: '用户名或密码错误' })
  async login(@Body() dto: LoginDto) {
    // ...
  }
}

// DTO装饰器
export class LoginDto {
  @ApiProperty({ example: '13800138000', description: '手机号' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'user@example.com', description: '邮箱' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: 'Password123', description: '密码' })
  @IsString()
  @MinLength(8)
  @MaxLength(20)
  password: string;
}
```

---

**文档版本**: v1.0  
**最后更新**: 2026-02-27
