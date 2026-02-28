# API接口规范

## 1. 概述

### 1.1 基本信息

| 项目 | 说明 |
|------|------|
| API风格 | RESTful |
| 数据格式 | JSON |
| 字符编码 | UTF-8 |
| 时间格式 | ISO 8601 (YYYY-MM-DDTHH:mm:ssZ) |
| 版本管理 | URL路径版本 (/api/v1/) |

### 1.2 基础URL

| 环境 | URL |
|------|-----|
| 开发环境 | https://dev-api.boomword.com |
| 测试环境 | https://test-api.boomword.com |
| 生产环境 | https://api.boomword.com |
| 管理后台 | https://admin-api.boomword.com |

---

## 2. 通用规范

### 2.1 请求格式

#### 2.1.1 请求头

| Header | 必填 | 说明 |
|--------|------|------|
| Content-Type | 是 | application/json |
| Authorization | 条件 | Bearer {token}，需要认证的接口必填 |
| Accept-Language | 否 | 语言偏好，默认 zh-CN |
| X-Client-Version | 否 | 客户端版本号 |
| X-Device-Id | 否 | 设备唯一标识 |
| X-Platform | 否 | 平台标识 (web/ios/android) |
| X-Request-Id | 否 | 请求追踪ID |

#### 2.1.2 请求示例

```http
POST /api/v1/auth/login HTTP/1.1
Host: api.boomword.com
Content-Type: application/json
Accept-Language: zh-CN
X-Client-Version: 1.0.0
X-Device-Id: device_abc123
X-Platform: web

{
  "login_type": "phone_code",
  "phone": "13800138000",
  "code": "123456"
}
```

### 2.2 响应格式

#### 2.2.1 成功响应

```json
{
  "code": 200,
  "message": "success",
  "data": {
    // 业务数据
  },
  "timestamp": "2026-02-27T10:00:00Z",
  "request_id": "req_abc123"
}
```

#### 2.2.2 错误响应

```json
{
  "code": 10001,
  "message": "手机号格式不正确",
  "error": "INVALID_PHONE_FORMAT",
  "details": {
    "field": "phone",
    "value": "123456",
    "expected": "11位数字，以1开头"
  },
  "timestamp": "2026-02-27T10:00:00Z",
  "request_id": "req_abc123"
}
```

#### 2.2.3 分页响应

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "items": [],
    "pagination": {
      "page": 1,
      "page_size": 20,
      "total": 100,
      "total_pages": 5,
      "has_next": true,
      "has_prev": false
    }
  }
}
```

### 2.3 HTTP状态码

| 状态码 | 说明 | 使用场景 |
|--------|------|----------|
| 200 | OK | 请求成功 |
| 201 | Created | 创建成功 |
| 204 | No Content | 删除成功 |
| 400 | Bad Request | 请求参数错误 |
| 401 | Unauthorized | 未认证/Token无效 |
| 403 | Forbidden | 无权限 |
| 404 | Not Found | 资源不存在 |
| 409 | Conflict | 资源冲突 |
| 422 | Unprocessable Entity | 业务逻辑错误 |
| 429 | Too Many Requests | 请求频率超限 |
| 500 | Internal Server Error | 服务器内部错误 |

### 2.4 错误码规范

| 错误码范围 | 模块 |
|------------|------|
| 10000-19999 | 用户系统 |
| 20000-29999 | 词库系统 |
| 30000-39999 | 关卡系统 |
| 40000-49999 | 游戏系统 |
| 50000-59999 | 社交系统 |
| 60000-69999 | 学习统计 |
| 70000-79999 | 管理系统 |
| 90000-99999 | 系统通用 |

---

## 3. 认证规范

### 3.1 Token认证

#### 3.1.1 Token结构

```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 604800
}
```

#### 3.1.2 JWT Payload

```json
{
  "sub": "usr_001",
  "type": "access",
  "iat": 1708992000,
  "exp": 1709596800,
  "iss": "boomword",
  "device_id": "device_abc123"
}
```

### 3.2 Token使用

```http
GET /api/v1/users/me HTTP/1.1
Host: api.boomword.com
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3.3 Token刷新

当access_token过期时，使用refresh_token获取新token：

```http
POST /api/v1/auth/refresh HTTP/1.1
Host: api.boomword.com
Content-Type: application/json

{
  "refresh_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## 4. 接口目录

### 4.1 用户认证 (Auth)

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/v1/auth/send-code | 发送验证码 |
| POST | /api/v1/auth/register | 用户注册 |
| POST | /api/v1/auth/login | 用户登录 |
| POST | /api/v1/auth/logout | 退出登录 |
| POST | /api/v1/auth/refresh | 刷新Token |
| POST | /api/v1/auth/upgrade-guest | 游客升级 |

### 4.2 用户信息 (Users)

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/v1/users/me | 获取当前用户信息 |
| PUT | /api/v1/users/me | 更新用户信息 |
| POST | /api/v1/users/me/avatar | 上传头像 |
| PUT | /api/v1/users/me/password | 修改密码 |
| GET | /api/v1/users/{user_id} | 获取用户公开信息 |

### 4.3 词库 (Word Banks)

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/v1/word-banks/categories | 获取词库分类 |
| GET | /api/v1/word-banks | 获取词库列表 |
| GET | /api/v1/word-banks/{id} | 获取词库详情 |
| GET | /api/v1/word-banks/{id}/words | 获取词库单词列表 |
| GET | /api/v1/word-banks/{id}/chapters | 获取词库关卡列表 |
| POST | /api/v1/word-banks/{id}/start | 开始学习词库 |
| POST | /api/v1/word-banks/{id}/favorite | 收藏/取消收藏 |
| GET | /api/v1/word-banks/recommended | 获取推荐词库 |

### 4.4 单词 (Words)

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/v1/words/{id} | 获取单词详情 |
| GET | /api/v1/words/search | 搜索单词 |

### 4.5 关卡 (Sections)

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/v1/sections/{id} | 获取小节详情 |
| POST | /api/v1/sections/{id}/start | 开始游戏 |
| POST | /api/v1/sections/{id}/submit | 提交游戏结果 |
| GET | /api/v1/sections/{id}/history | 获取游戏历史 |
| POST | /api/v1/sections/{id}/reset | 重置进度 |
| GET | /api/v1/sections/{id}/unlock-status | 检查解锁状态 |

### 4.6 游戏会话 (Game Sessions)

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/v1/game/sessions | 创建游戏会话 |
| POST | /api/v1/game/sessions/{id}/start | 开始游戏 |
| POST | /api/v1/game/sessions/{id}/answer | 提交答案 |
| POST | /api/v1/game/sessions/{id}/pause | 暂停游戏 |
| POST | /api/v1/game/sessions/{id}/resume | 继续游戏 |
| POST | /api/v1/game/sessions/{id}/abandon | 放弃游戏 |
| POST | /api/v1/game/sessions/{id}/complete | 完成游戏 |
| GET | /api/v1/game/sessions/{id}/state | 获取游戏状态 |

### 4.7 排行榜 (Rankings)

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/v1/rankings/total | 获取总分排行榜 |
| GET | /api/v1/rankings/friends | 获取好友排行榜 |
| GET | /api/v1/sections/{id}/rankings | 获取关卡排行榜 |

### 4.8 成就 (Achievements)

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/v1/achievements | 获取成就列表 |
| POST | /api/v1/achievements/{id}/claim | 领取成就奖励 |

### 4.9 好友 (Friends)

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/v1/friends | 获取好友列表 |
| POST | /api/v1/friends/requests | 发送好友请求 |
| GET | /api/v1/friends/requests | 获取好友请求列表 |
| POST | /api/v1/friends/requests/{id}/handle | 处理好友请求 |
| DELETE | /api/v1/friends/{id} | 删除好友 |
| GET | /api/v1/friends/activities | 获取好友动态 |
| POST | /api/v1/activities/{id}/like | 点赞动态 |
| DELETE | /api/v1/activities/{id}/like | 取消点赞 |

### 4.10 学习统计 (Stats)

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/v1/stats/overview | 获取学习总览 |
| GET | /api/v1/stats/curve | 获取学习曲线 |
| GET | /api/v1/stats/heatmap | 获取学习热力图 |
| GET | /api/v1/stats/words | 获取单词掌握度列表 |
| GET | /api/v1/stats/need-review | 获取需复习单词 |

### 4.11 错词本 (Wrong Book)

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/v1/wrong-book | 获取错词本列表 |
| GET | /api/v1/wrong-book/{id} | 获取错词详情 |
| POST | /api/v1/wrong-book | 添加到错词本 |
| DELETE | /api/v1/wrong-book/{id} | 移除错词 |
| POST | /api/v1/wrong-book/batch-remove | 批量移除 |
| PUT | /api/v1/wrong-book/{id}/note | 更新备注 |
| POST | /api/v1/wrong-book/practice/start | 开始错词练习 |
| POST | /api/v1/wrong-book/practice/{id}/submit | 提交练习结果 |
| POST | /api/v1/wrong-book/practice/{id}/remove-correct | 移除正确单词 |

### 4.12 分享 (Share)

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/v1/share/card | 生成分享卡片 |

---

## 5. 通用参数

### 5.1 分页参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| page | number | 1 | 页码，从1开始 |
| page_size | number | 20 | 每页数量，最大100 |

### 5.2 排序参数

| 参数 | 类型 | 说明 |
|------|------|------|
| sort_by | string | 排序字段 |
| sort_order | string | asc/desc |

### 5.3 时间范围参数

| 参数 | 类型 | 说明 |
|------|------|------|
| date_from | string | 起始日期 (YYYY-MM-DD) |
| date_to | string | 结束日期 (YYYY-MM-DD) |

---

## 6. 请求限流

### 6.1 限流规则

| 类型 | 限制 | 说明 |
|------|------|------|
| 全局限制 | 1000次/分钟/IP | 所有接口 |
| 用户限制 | 100次/分钟/用户 | 需认证接口 |
| 验证码 | 10次/天/手机号 | 发送验证码 |
| 登录 | 10次/分钟/IP | 登录接口 |
| 游戏答题 | 60次/分钟/用户 | 答题接口 |

### 6.2 限流响应

```json
{
  "code": 429,
  "message": "请求过于频繁，请稍后再试",
  "error": "RATE_LIMIT_EXCEEDED",
  "details": {
    "retry_after": 60
  }
}
```

响应头:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1708992060
Retry-After: 60
```

---

## 7. 数据校验规则

### 7.1 用户相关

| 字段 | 规则 |
|------|------|
| phone | 11位数字，以1开头 |
| email | 标准邮箱格式 |
| password | 8-20位，包含字母和数字 |
| nickname | 2-16字符，不含特殊字符 |
| avatar | jpg/png/gif，最大2MB |

### 7.2 游戏相关

| 字段 | 规则 |
|------|------|
| input | 1-30个英文字母 |
| game_mode | practice/challenge/speed |
| word_count | 1-100 |

### 7.3 通用规则

| 字段 | 规则 |
|------|------|
| id | 非空字符串 |
| page | 正整数，最小1 |
| page_size | 正整数，1-100 |
| date | YYYY-MM-DD格式 |
| datetime | ISO 8601格式 |

---

## 8. WebSocket接口

### 8.1 连接

```
wss://api.boomword.com/ws?token={access_token}
```

### 8.2 消息格式

#### 发送消息

```json
{
  "type": "game_answer",
  "data": {
    "session_id": "gs_001",
    "word_id": "word_001",
    "input": "apple"
  },
  "request_id": "req_001"
}
```

#### 接收消息

```json
{
  "type": "game_result",
  "data": {
    "is_correct": true,
    "score": 23
  },
  "request_id": "req_001",
  "timestamp": "2026-02-27T10:00:00Z"
}
```

### 8.3 消息类型

| 类型 | 方向 | 说明 |
|------|------|------|
| ping | C→S | 心跳请求 |
| pong | S→C | 心跳响应 |
| game_answer | C→S | 提交游戏答案 |
| game_result | S→C | 答案结果 |
| game_state | S→C | 游戏状态更新 |
| notification | S→C | 系统通知 |

### 8.4 心跳机制

- 客户端每30秒发送ping
- 服务端响应pong
- 60秒无心跳断开连接

---

## 9. 版本管理

### 9.1 版本号规则

- 版本号格式: v{major}.{minor}
- 当前版本: v1
- 路径示例: /api/v1/users

### 9.2 版本兼容性

- 小版本更新: 向后兼容
- 大版本更新: 可能不兼容，提前通知
- 旧版本支持: 至少支持1个旧版本

### 9.3 版本废弃通知

响应头:
```
Deprecation: true
Sunset: Sat, 01 Mar 2027 00:00:00 GMT
Link: <https://api.boomword.com/api/v2>; rel="successor-version"
```

---

## 10. 安全规范

### 10.1 HTTPS

- 所有接口必须使用HTTPS
- 支持TLS 1.2及以上版本
- 禁用不安全的加密套件

### 10.2 数据加密

| 数据类型 | 加密方式 |
|----------|----------|
| 密码 | 客户端SHA256预处理，服务端bcrypt存储 |
| Token | RS256签名 |
| 敏感数据 | AES-256加密 |

### 10.3 请求签名（关键接口）

签名算法:
```
signature = HMAC-SHA256(
  secret_key,
  method + path + timestamp + body_hash
)
```

请求头:
```
X-Signature: {signature}
X-Timestamp: {timestamp}
```

### 10.4 防重放攻击

- 检查X-Timestamp，5分钟内有效
- 记录已处理的请求ID
- 重复请求返回409

---

## 11. 错误码汇总

### 11.1 系统通用错误 (90000-99999)

| 错误码 | 标识 | 说明 |
|--------|------|------|
| 90001 | SYSTEM_ERROR | 系统内部错误 |
| 90002 | SERVICE_UNAVAILABLE | 服务暂不可用 |
| 90003 | INVALID_REQUEST | 无效的请求 |
| 90004 | INVALID_PARAMS | 参数校验失败 |
| 90005 | RATE_LIMIT_EXCEEDED | 请求频率超限 |
| 90006 | MAINTENANCE | 系统维护中 |

### 11.2 用户系统错误 (10000-19999)

| 错误码 | 标识 | 说明 |
|--------|------|------|
| 10001 | INVALID_PHONE_FORMAT | 手机号格式不正确 |
| 10002 | INVALID_EMAIL_FORMAT | 邮箱格式不正确 |
| 10003 | INVALID_PASSWORD_FORMAT | 密码格式不符合要求 |
| 10004 | PHONE_ALREADY_REGISTERED | 手机号已注册 |
| 10005 | EMAIL_ALREADY_REGISTERED | 邮箱已注册 |
| 10006 | VERIFICATION_CODE_EXPIRED | 验证码已过期 |
| 10007 | VERIFICATION_CODE_INCORRECT | 验证码错误 |
| 10008 | VERIFICATION_CODE_LIMIT | 验证码发送次数超限 |
| 10009 | USER_NOT_FOUND | 用户不存在 |
| 10010 | PASSWORD_INCORRECT | 密码错误 |
| 10011 | ACCOUNT_LOCKED | 账号已锁定 |
| 10012 | ACCOUNT_BANNED | 账号已封禁 |
| 10013 | TOKEN_EXPIRED | Token已过期 |
| 10014 | TOKEN_INVALID | Token无效 |

### 11.3 词库系统错误 (20000-29999)

| 错误码 | 标识 | 说明 |
|--------|------|------|
| 20001 | WORD_BANK_NOT_FOUND | 词库不存在 |
| 20002 | WORD_NOT_FOUND | 单词不存在 |
| 20003 | CATEGORY_NOT_FOUND | 分类不存在 |
| 20004 | WORD_BANK_NOT_PUBLISHED | 词库未发布 |
| 20005 | WORD_BANK_OFFLINE | 词库已下架 |
| 20006 | SECTION_LOCKED | 小节未解锁 |
| 20007 | CHAPTER_LOCKED | 章节未解锁 |

### 11.4 关卡系统错误 (30000-39999)

| 错误码 | 标识 | 说明 |
|--------|------|------|
| 30001 | SECTION_NOT_FOUND | 小节不存在 |
| 30002 | CHAPTER_NOT_FOUND | 章节不存在 |
| 30003 | SECTION_LOCKED | 小节未解锁 |
| 30004 | MODE_LOCKED | 游戏模式未解锁 |
| 30005 | GAME_SESSION_EXPIRED | 游戏会话已过期 |
| 30006 | GAME_SESSION_INVALID | 游戏会话无效 |
| 30007 | INVALID_GAME_MODE | 无效的游戏模式 |

### 11.5 游戏系统错误 (40000-49999)

| 错误码 | 标识 | 说明 |
|--------|------|------|
| 40001 | SESSION_NOT_FOUND | 游戏会话不存在 |
| 40002 | SESSION_EXPIRED | 游戏会话已过期 |
| 40003 | SESSION_ALREADY_STARTED | 游戏已开始 |
| 40004 | SESSION_NOT_STARTED | 游戏未开始 |
| 40005 | SESSION_ALREADY_FINISHED | 游戏已结束 |
| 40006 | SESSION_PAUSED | 游戏已暂停 |
| 40007 | SESSION_NOT_PAUSED | 游戏未暂停 |
| 40008 | WORD_NOT_IN_SESSION | 单词不在本局游戏中 |
| 40009 | WORD_ALREADY_ANSWERED | 单词已回答 |
| 40010 | TIME_EXCEEDED | 游戏时间已耗尽 |

### 11.6 社交系统错误 (50000-59999)

| 错误码 | 标识 | 说明 |
|--------|------|------|
| 50001 | RANKING_NOT_FOUND | 排行榜不存在 |
| 50002 | ACHIEVEMENT_NOT_FOUND | 成就不存在 |
| 50003 | ACHIEVEMENT_NOT_UNLOCKED | 成就未解锁 |
| 50004 | ACHIEVEMENT_ALREADY_CLAIMED | 成就奖励已领取 |
| 50005 | FRIEND_REQUEST_NOT_FOUND | 好友请求不存在 |
| 50006 | FRIEND_REQUEST_EXPIRED | 好友请求已过期 |
| 50007 | FRIEND_REQUEST_HANDLED | 好友请求已处理 |
| 50008 | ALREADY_FRIENDS | 已经是好友 |
| 50009 | CANNOT_ADD_SELF | 不能添加自己为好友 |
| 50010 | FRIEND_LIMIT_EXCEEDED | 好友数量已达上限 |

### 11.7 学习统计错误 (60000-69999)

| 错误码 | 标识 | 说明 |
|--------|------|------|
| 60001 | WRONG_BOOK_ENTRY_NOT_FOUND | 错词条目不存在 |
| 60002 | WORD_ALREADY_IN_WRONG_BOOK | 单词已在错词本中 |
| 60003 | WORD_NOT_IN_WRONG_BOOK | 单词不在错词本中 |
| 60004 | PRACTICE_NOT_FOUND | 练习记录不存在 |
| 60005 | PRACTICE_ALREADY_SUBMITTED | 练习已提交 |
| 60006 | EMPTY_WRONG_BOOK | 错词本为空 |

---

## 12. SDK示例

### 12.1 JavaScript/TypeScript

```typescript
import { BoomWordClient } from '@boomword/sdk';

const client = new BoomWordClient({
  baseUrl: 'https://api.boomword.com',
  timeout: 10000
});

// 登录
const loginResult = await client.auth.login({
  loginType: 'phone_code',
  phone: '13800138000',
  code: '123456'
});

// 设置Token
client.setToken(loginResult.tokens.access_token);

// 获取词库列表
const wordBanks = await client.wordBanks.list({
  page: 1,
  pageSize: 20
});

// 开始游戏
const session = await client.game.createSession({
  sectionId: 'sec_001',
  gameMode: 'challenge'
});
```

### 12.2 错误处理

```typescript
try {
  await client.auth.login({ ... });
} catch (error) {
  if (error instanceof BoomWordError) {
    switch (error.code) {
      case 10007:
        console.log('验证码错误');
        break;
      case 10011:
        console.log('账号已锁定');
        break;
      default:
        console.log(error.message);
    }
  }
}
```

---

## 13. 更新日志

### v1.0.0 (2026-02-27)

- 初始版本发布
- 包含用户、词库、游戏、排行榜、成就、好友、统计等完整API
