# 用户系统详细设计

## 1. 功能清单

| 功能模块 | 功能点 | 优先级 | 版本 |
|----------|--------|--------|------|
| 用户注册 | 手机号注册 | P0 | v1.0 |
| 用户注册 | 邮箱注册 | P0 | v1.0 |
| 用户注册 | 第三方登录（微信/QQ/Google） | P2 | v2.0 |
| 用户登录 | 手机号+验证码登录 | P0 | v1.0 |
| 用户登录 | 邮箱+密码登录 | P0 | v1.0 |
| 用户登录 | 游客模式 | P0 | v1.0 |
| 个人信息 | 基础信息管理 | P0 | v1.0 |
| 个人信息 | 头像上传 | P0 | v1.0 |
| 等级系统 | 经验值获取 | P0 | v1.0 |
| 等级系统 | 等级升级 | P0 | v1.0 |
| 账号安全 | 密码修改 | P0 | v1.0 |
| 账号安全 | 手机号绑定/换绑 | P1 | v1.5 |
| 账号安全 | 注销账号 | P1 | v1.5 |

---

## 2. 用户故事

### 2.1 用户注册

#### US-001: 手机号注册
```
作为一个新用户
我想要通过手机号注册账号
以便我可以保存学习进度并在多设备同步

验收标准:
1. 用户输入手机号，点击获取验证码
2. 系统发送6位数字验证码到用户手机
3. 验证码60秒内有效，可重新获取
4. 用户输入验证码和密码完成注册
5. 注册成功后自动登录并跳转首页
```

#### US-002: 邮箱注册
```
作为一个新用户
我想要通过邮箱注册账号
以便我可以在没有手机的情况下使用服务

验收标准:
1. 用户输入邮箱和密码
2. 系统发送验证邮件到用户邮箱
3. 用户点击邮件中的验证链接
4. 验证成功后账号激活
5. 用户可以使用邮箱+密码登录
```

#### US-003: 游客模式
```
作为一个不想注册的用户
我想要以游客身份体验游戏
以便我可以先了解产品再决定是否注册

验收标准:
1. 用户点击"游客体验"按钮
2. 系统创建临时游客账号
3. 游客可以体验所有基础游戏功能
4. 游客数据仅存储在本地
5. 提示用户注册可同步数据
6. 游客可随时升级为正式账号
```

### 2.2 用户登录

#### US-004: 手机号验证码登录
```
作为一个已注册用户
我想要通过手机验证码快速登录
以便我不需要记住密码

验收标准:
1. 用户输入已注册手机号
2. 点击获取验证码
3. 输入收到的验证码
4. 验证通过后登录成功
5. 生成登录Token
```

#### US-005: 邮箱密码登录
```
作为一个已注册用户
我想要通过邮箱和密码登录
以便我可以使用传统方式登录

验收标准:
1. 用户输入邮箱和密码
2. 系统验证邮箱和密码匹配
3. 验证通过后登录成功
4. 登录失败显示错误提示
5. 连续失败5次锁定账号30分钟
```

### 2.3 个人信息管理

#### US-006: 编辑个人资料
```
作为一个已登录用户
我想要编辑我的个人资料
以便其他用户可以了解我

验收标准:
1. 用户可以修改昵称（2-16字符）
2. 用户可以上传/更换头像
3. 用户可以设置性别（可选）
4. 用户可以选择当前年级
5. 保存成功后立即生效
```

### 2.4 等级系统

#### US-007: 获取经验值
```
作为一个活跃用户
我想要通过各种行为获取经验值
以便我可以提升等级

验收标准:
1. 完成小节获得对应经验值
2. 每日首次登录获得经验值
3. 连续登录获得额外奖励
4. 经验值实时更新显示
5. 达到升级条件自动升级
```

---

## 3. 业务规则

### 3.1 注册规则

| 规则编号 | 规则描述 |
|----------|----------|
| REG-001 | 手机号必须是中国大陆有效手机号（11位，1开头） |
| REG-002 | 邮箱必须符合标准邮箱格式 |
| REG-003 | 密码长度8-20位，必须包含字母和数字 |
| REG-004 | 同一手机号/邮箱只能注册一个账号 |
| REG-005 | 验证码有效期60秒，每日同一手机号最多发送10次 |
| REG-006 | 昵称默认为"用户"+随机6位数字 |

### 3.2 登录规则

| 规则编号 | 规则描述 |
|----------|----------|
| LOGIN-001 | 登录Token有效期7天 |
| LOGIN-002 | 同一账号最多5个设备同时登录 |
| LOGIN-003 | 新设备登录需要短信/邮件验证（可配置） |
| LOGIN-004 | 连续登录失败5次，锁定账号30分钟 |
| LOGIN-005 | 游客账号7天内未登录自动清理 |

### 3.3 等级规则

| 规则编号 | 规则描述 |
|----------|----------|
| LEVEL-001 | 等级上限为100级 |
| LEVEL-002 | 经验值不可为负数 |
| LEVEL-003 | 升级时触发升级动画和通知 |
| LEVEL-004 | 等级称号根据等级范围自动获取 |

### 3.4 经验值获取规则

| 行为 | 经验值 | 限制条件 |
|------|--------|----------|
| 完成一个小节 | 10 EXP | 无限制 |
| 关卡三星通关 | 额外 20 EXP | 首次三星时获得 |
| 每日首次登录 | 5 EXP | 每日仅一次 |
| 连续登录第2天 | 5 EXP | - |
| 连续登录第3天 | 10 EXP | - |
| 连续登录第7天 | 20 EXP | - |
| 连续登录第14天 | 30 EXP | - |
| 连续登录第30天 | 50 EXP | - |
| 挑战模式通关 | 30 EXP | 无限制 |

### 3.5 等级经验值对照表

| 等级范围 | 所需累计经验 | 称号 |
|----------|--------------|------|
| 1-10 | 0-500 | 初学者 |
| 11-20 | 501-2000 | 入门学徒 |
| 21-30 | 2001-5000 | 词汇达人 |
| 31-40 | 5001-10000 | 单词高手 |
| 41-50 | 10001-20000 | 英语大师 |
| 51+ | 20001+ | 词汇王者 |

---

## 4. 状态流转图

### 4.1 用户账号状态

```
                    ┌──────────────┐
                    │   未注册     │
                    └──────────────┘
                           │
           ┌───────────────┼───────────────┐
           ▼               ▼               ▼
    ┌──────────────┐┌──────────────┐┌──────────────┐
    │  待验证      ││   游客       ││   已激活     │
    │  (邮箱注册)  ││              ││   (手机注册) │
    └──────────────┘└──────────────┘└──────────────┘
           │               │               │
           │ 验证成功      │ 升级账号      │
           ▼               ▼               │
    ┌──────────────────────────────────────┘
    │
    ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   正常       │────▶│   锁定       │────▶│   注销       │
│              │◀────│   (临时)     │     │   (永久)     │
└──────────────┘     └──────────────┘     └──────────────┘
       │                                         
       │ 违规封禁                                
       ▼                                         
┌──────────────┐                                 
│   封禁       │                                 
│   (管理员)   │                                 
└──────────────┘                                 
```

### 4.2 登录Token状态

```
┌──────────────┐
│   生成       │
└──────────────┘
       │
       ▼
┌──────────────┐     ┌──────────────┐
│   有效       │────▶│   即将过期   │
│              │     │   (剩余1天)  │
└──────────────┘     └──────────────┘
       │                    │
       │                    │ 续签
       │                    ▼
       │             ┌──────────────┐
       │             │   已续签     │
       │             └──────────────┘
       │
       ▼
┌──────────────┐
│   已过期     │
└──────────────┘
       │
       ▼
┌──────────────┐
│   已失效     │
│   (登出/踢出)│
└──────────────┘
```

---

## 5. 数据模型

### 5.1 用户基础信息

```json
{
  "id": "usr_20260227001",
  "phone": "13800138000",
  "email": "user@example.com",
  "password_hash": "$2b$10$xxxxx",
  "nickname": "单词小达人",
  "avatar_url": "https://cdn.boomword.com/avatar/usr_20260227001.png",
  "gender": "male",
  "grade": "grade_7",
  "status": "active",
  "is_guest": false,
  "created_at": "2026-02-27T10:00:00Z",
  "updated_at": "2026-02-27T15:30:00Z",
  "last_login_at": "2026-02-27T15:30:00Z"
}
```

### 5.2 用户等级信息

```json
{
  "user_id": "usr_20260227001",
  "level": 15,
  "current_exp": 1250,
  "total_exp": 1250,
  "title": "入门学徒",
  "consecutive_days": 7,
  "last_sign_date": "2026-02-27",
  "updated_at": "2026-02-27T15:30:00Z"
}
```

### 5.3 登录Token

```json
{
  "token_id": "tok_abc123xyz",
  "user_id": "usr_20260227001",
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "device_info": {
    "device_id": "dev_001",
    "device_type": "web",
    "browser": "Chrome 120",
    "os": "Windows 11",
    "ip": "192.168.1.1"
  },
  "expires_at": "2026-03-06T10:00:00Z",
  "created_at": "2026-02-27T10:00:00Z"
}
```

### 5.4 验证码记录

```json
{
  "id": "vcode_001",
  "target": "13800138000",
  "target_type": "phone",
  "code": "123456",
  "purpose": "register",
  "is_used": false,
  "expires_at": "2026-02-27T10:01:00Z",
  "created_at": "2026-02-27T10:00:00Z"
}
```

---

## 6. 接口定义

### 6.1 发送验证码

**请求**
```
POST /api/v1/auth/send-code
Content-Type: application/json

{
  "target": "13800138000",
  "target_type": "phone",
  "purpose": "register"
}
```

**参数说明**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| target | string | 是 | 手机号或邮箱 |
| target_type | string | 是 | phone/email |
| purpose | string | 是 | register/login/reset_password |

**响应成功**
```json
{
  "code": 200,
  "message": "验证码已发送",
  "data": {
    "expires_in": 60,
    "resend_after": 60
  }
}
```

**响应失败**
```json
{
  "code": 400,
  "message": "手机号格式不正确",
  "error": "INVALID_PHONE_FORMAT"
}
```

### 6.2 用户注册

**请求**
```
POST /api/v1/auth/register
Content-Type: application/json

{
  "phone": "13800138000",
  "code": "123456",
  "password": "Password123",
  "nickname": "单词小达人"
}
```

**参数说明**
| 参数 | 类型 | 必填 | 说明 | 校验规则 |
|------|------|------|------|----------|
| phone | string | 否* | 手机号 | 11位数字，1开头 |
| email | string | 否* | 邮箱 | 标准邮箱格式 |
| code | string | 是 | 验证码 | 6位数字 |
| password | string | 是 | 密码 | 8-20位，含字母和数字 |
| nickname | string | 否 | 昵称 | 2-16字符 |

*phone和email二选一

**响应成功**
```json
{
  "code": 200,
  "message": "注册成功",
  "data": {
    "user": {
      "id": "usr_20260227001",
      "nickname": "单词小达人",
      "avatar_url": null,
      "level": 1,
      "title": "初学者"
    },
    "tokens": {
      "access_token": "eyJhbGciOiJIUzI1NiIs...",
      "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
      "expires_in": 604800
    }
  }
}
```

### 6.3 用户登录

**请求**
```
POST /api/v1/auth/login
Content-Type: application/json

{
  "login_type": "phone_code",
  "phone": "13800138000",
  "code": "123456"
}
```

**登录类型**
| login_type | 说明 | 必填参数 |
|------------|------|----------|
| phone_code | 手机验证码登录 | phone, code |
| email_password | 邮箱密码登录 | email, password |
| guest | 游客登录 | device_id |

**响应成功**
```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "user": {
      "id": "usr_20260227001",
      "nickname": "单词小达人",
      "avatar_url": "https://cdn.boomword.com/avatar/usr_20260227001.png",
      "level": 15,
      "title": "入门学徒",
      "is_guest": false
    },
    "tokens": {
      "access_token": "eyJhbGciOiJIUzI1NiIs...",
      "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
      "expires_in": 604800
    }
  }
}
```

### 6.4 获取用户信息

**请求**
```
GET /api/v1/users/me
Authorization: Bearer {access_token}
```

**响应成功**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": "usr_20260227001",
    "phone": "138****8000",
    "email": "u***@example.com",
    "nickname": "单词小达人",
    "avatar_url": "https://cdn.boomword.com/avatar/usr_20260227001.png",
    "gender": "male",
    "grade": "grade_7",
    "level": 15,
    "current_exp": 1250,
    "exp_to_next_level": 750,
    "title": "入门学徒",
    "consecutive_days": 7,
    "is_guest": false,
    "created_at": "2026-02-27T10:00:00Z"
  }
}
```

### 6.5 更新用户信息

**请求**
```
PUT /api/v1/users/me
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "nickname": "新昵称",
  "gender": "female",
  "grade": "grade_8"
}
```

**参数说明**
| 参数 | 类型 | 必填 | 说明 | 校验规则 |
|------|------|------|------|----------|
| nickname | string | 否 | 昵称 | 2-16字符，不含特殊字符 |
| gender | string | 否 | 性别 | male/female/unknown |
| grade | string | 否 | 年级 | 见年级枚举 |

**响应成功**
```json
{
  "code": 200,
  "message": "更新成功",
  "data": {
    "id": "usr_20260227001",
    "nickname": "新昵称",
    "gender": "female",
    "grade": "grade_8",
    "updated_at": "2026-02-27T16:00:00Z"
  }
}
```

### 6.6 上传头像

**请求**
```
POST /api/v1/users/me/avatar
Authorization: Bearer {access_token}
Content-Type: multipart/form-data

file: [binary data]
```

**参数说明**
| 参数 | 类型 | 必填 | 说明 | 校验规则 |
|------|------|------|------|----------|
| file | file | 是 | 头像文件 | jpg/png/gif，最大2MB |

**响应成功**
```json
{
  "code": 200,
  "message": "上传成功",
  "data": {
    "avatar_url": "https://cdn.boomword.com/avatar/usr_20260227001.png"
  }
}
```

### 6.7 刷新Token

**请求**
```
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**响应成功**
```json
{
  "code": 200,
  "message": "刷新成功",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
    "expires_in": 604800
  }
}
```

### 6.8 退出登录

**请求**
```
POST /api/v1/auth/logout
Authorization: Bearer {access_token}
```

**响应成功**
```json
{
  "code": 200,
  "message": "退出成功"
}
```

### 6.9 游客升级正式账号

**请求**
```
POST /api/v1/auth/upgrade-guest
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "phone": "13800138000",
  "code": "123456",
  "password": "Password123"
}
```

**响应成功**
```json
{
  "code": 200,
  "message": "升级成功",
  "data": {
    "user": {
      "id": "usr_20260227001",
      "is_guest": false
    },
    "tokens": {
      "access_token": "eyJhbGciOiJIUzI1NiIs...",
      "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
      "expires_in": 604800
    }
  }
}
```

---

## 7. 异常处理

### 7.1 错误码定义

| 错误码 | 错误标识 | 说明 | HTTP状态码 |
|--------|----------|------|------------|
| 10001 | INVALID_PHONE_FORMAT | 手机号格式不正确 | 400 |
| 10002 | INVALID_EMAIL_FORMAT | 邮箱格式不正确 | 400 |
| 10003 | INVALID_PASSWORD_FORMAT | 密码格式不符合要求 | 400 |
| 10004 | PHONE_ALREADY_REGISTERED | 手机号已注册 | 400 |
| 10005 | EMAIL_ALREADY_REGISTERED | 邮箱已注册 | 400 |
| 10006 | VERIFICATION_CODE_EXPIRED | 验证码已过期 | 400 |
| 10007 | VERIFICATION_CODE_INCORRECT | 验证码错误 | 400 |
| 10008 | VERIFICATION_CODE_LIMIT | 验证码发送次数超限 | 429 |
| 10009 | USER_NOT_FOUND | 用户不存在 | 404 |
| 10010 | PASSWORD_INCORRECT | 密码错误 | 401 |
| 10011 | ACCOUNT_LOCKED | 账号已锁定 | 403 |
| 10012 | ACCOUNT_BANNED | 账号已封禁 | 403 |
| 10013 | TOKEN_EXPIRED | Token已过期 | 401 |
| 10014 | TOKEN_INVALID | Token无效 | 401 |
| 10015 | NICKNAME_INVALID | 昵称包含违禁词 | 400 |
| 10016 | AVATAR_TOO_LARGE | 头像文件过大 | 400 |
| 10017 | AVATAR_FORMAT_INVALID | 头像格式不支持 | 400 |
| 10018 | GUEST_UPGRADE_FAILED | 游客升级失败 | 500 |

### 7.2 异常响应格式

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

---

## 8. 边界条件

### 8.1 注册边界

| 场景 | 处理方式 |
|------|----------|
| 手机号已被注册 | 提示"该手机号已注册，请直接登录" |
| 验证码已过期 | 提示"验证码已过期，请重新获取" |
| 验证码错误3次 | 该验证码作废，需重新获取 |
| 同一手机号当日发送超过10次 | 提示"今日验证码发送次数已达上限" |
| 网络超时导致注册请求重复 | 幂等处理，返回同一结果 |

### 8.2 登录边界

| 场景 | 处理方式 |
|------|----------|
| 用户不存在 | 统一提示"账号或密码错误"，防止枚举 |
| 密码连续错误5次 | 锁定账号30分钟，提示锁定时间 |
| Token过期 | 返回401，客户端使用refresh_token刷新 |
| refresh_token也过期 | 返回401，需重新登录 |
| 被挤下线 | 提示"账号在其他设备登录" |
| 账号被封禁 | 提示封禁原因和申诉方式 |

### 8.3 游客模式边界

| 场景 | 处理方式 |
|------|----------|
| 游客清除浏览器数据 | 数据丢失，提示注册保存进度 |
| 游客7天未登录 | 清理游客数据 |
| 游客升级时手机号已存在 | 提示合并账号或使用其他手机号 |
| 游客升级失败 | 数据回滚，保持游客状态 |

### 8.4 信息更新边界

| 场景 | 处理方式 |
|------|----------|
| 昵称包含敏感词 | 拒绝更新，提示原因 |
| 昵称重复 | 允许，昵称不要求唯一 |
| 头像文件损坏 | 提示"文件已损坏，请重新选择" |
| 头像上传中断 | 保留原头像，提示重试 |
| 并发更新个人信息 | 以最后一次为准（Last Write Wins） |

---

## 9. 安全要求

### 9.1 密码安全

- 使用bcrypt算法加密存储密码，cost factor = 10
- 禁止明文传输密码，前端需预处理
- 密码强度要求：8-20位，必须包含字母和数字
- 支持密码复杂度配置：可选要求特殊字符

### 9.2 验证码安全

- 验证码有效期60秒
- 同一验证码最多验证3次
- 同一手机号每日最多发送10次
- 验证码使用后立即作废
- 使用随机数生成器生成验证码

### 9.3 Token安全

- 使用RS256算法签名JWT
- access_token有效期7天
- refresh_token有效期30天
- Token中不存储敏感信息
- 支持Token黑名单机制

### 9.4 接口安全

- 所有接口使用HTTPS
- 敏感操作需要二次验证
- 登录接口添加图形验证码（可配置）
- 记录所有安全相关操作日志

---

## 10. 性能要求

| 接口 | 响应时间要求 | 并发要求 |
|------|--------------|----------|
| 发送验证码 | < 500ms | 100/s |
| 用户注册 | < 300ms | 50/s |
| 用户登录 | < 200ms | 200/s |
| 获取用户信息 | < 100ms | 500/s |
| 更新用户信息 | < 200ms | 100/s |
| 上传头像 | < 3s | 20/s |

---

## 11. 枚举定义

### 11.1 年级枚举

```json
{
  "grades": [
    {"code": "grade_1", "name": "一年级"},
    {"code": "grade_2", "name": "二年级"},
    {"code": "grade_3", "name": "三年级"},
    {"code": "grade_4", "name": "四年级"},
    {"code": "grade_5", "name": "五年级"},
    {"code": "grade_6", "name": "六年级"},
    {"code": "grade_7", "name": "初一"},
    {"code": "grade_8", "name": "初二"},
    {"code": "grade_9", "name": "初三"},
    {"code": "grade_10", "name": "高一"},
    {"code": "grade_11", "name": "高二"},
    {"code": "grade_12", "name": "高三"},
    {"code": "college_1", "name": "大一"},
    {"code": "college_2", "name": "大二"},
    {"code": "college_3", "name": "大三"},
    {"code": "college_4", "name": "大四"},
    {"code": "graduate", "name": "研究生"},
    {"code": "other", "name": "其他"}
  ]
}
```

### 11.2 用户状态枚举

```json
{
  "user_status": [
    {"code": "pending", "name": "待验证"},
    {"code": "active", "name": "正常"},
    {"code": "locked", "name": "锁定"},
    {"code": "banned", "name": "封禁"},
    {"code": "deleted", "name": "注销"}
  ]
}
```

### 11.3 等级称号枚举

```json
{
  "titles": [
    {"level_range": [1, 10], "title": "初学者"},
    {"level_range": [11, 20], "title": "入门学徒"},
    {"level_range": [21, 30], "title": "词汇达人"},
    {"level_range": [31, 40], "title": "单词高手"},
    {"level_range": [41, 50], "title": "英语大师"},
    {"level_range": [51, 100], "title": "词汇王者"}
  ]
}
```
