# 后台管理系统详细设计

## 1. 功能清单

| 功能模块 | 功能点 | 优先级 | 版本 |
|----------|--------|--------|------|
| 词库管理 | 词库分类管理 | P0 | v1.0 |
| 词库管理 | 词库CRUD | P0 | v1.0 |
| 词库管理 | 批量导入/导出 | P0 | v1.0 |
| 词库管理 | 词库审核 | P1 | v1.5 |
| 单词管理 | 单词CRUD | P0 | v1.0 |
| 单词管理 | 批量导入单词 | P0 | v1.0 |
| 单词管理 | 音频管理 | P0 | v1.0 |
| 关卡管理 | 关卡创建编辑 | P0 | v1.0 |
| 关卡管理 | 关卡排序分组 | P0 | v1.0 |
| 关卡管理 | 关卡配置 | P0 | v1.0 |
| 用户管理 | 用户列表查询 | P0 | v1.0 |
| 用户管理 | 用户详情查看 | P0 | v1.0 |
| 用户管理 | 用户封禁/解封 | P0 | v1.0 |
| 用户管理 | 用户反馈管理 | P1 | v1.5 |
| 数据统计 | DAU/MAU统计 | P0 | v1.0 |
| 数据统计 | 学习数据总览 | P0 | v1.0 |
| 数据统计 | 关卡完成率分析 | P1 | v1.5 |
| 数据统计 | 用户留存分析 | P1 | v1.5 |
| 系统配置 | 游戏参数配置 | P0 | v1.0 |
| 系统配置 | 版本管理 | P1 | v1.5 |
| 系统配置 | 公告管理 | P1 | v1.5 |
| 权限管理 | 管理员账号 | P0 | v1.0 |
| 权限管理 | 角色权限 | P0 | v1.0 |
| 操作日志 | 操作记录查询 | P0 | v1.0 |

---

## 2. 用户故事

### 2.1 词库管理

#### US-ADM-001: 创建词库
```
作为一个管理员
我想要创建新的词库
以便为用户提供学习内容

验收标准:
1. 填写词库基本信息（名称、描述、分类）
2. 上传词库封面图
3. 设置词库状态（草稿/发布）
4. 保存后可在词库列表查看
```

#### US-ADM-002: 批量导入单词
```
作为一个管理员
我想要通过Excel批量导入单词
以便快速添加词库内容

验收标准:
1. 下载导入模板
2. 按模板填写单词数据
3. 上传Excel文件
4. 系统校验数据格式
5. 显示导入预览和错误提示
6. 确认后执行导入
7. 显示导入结果统计
```

### 2.2 用户管理

#### US-ADM-003: 查询用户
```
作为一个管理员
我想要查询用户信息
以便了解用户情况

验收标准:
1. 支持按用户ID、昵称、手机号搜索
2. 支持按注册时间、活跃度筛选
3. 显示用户列表（分页）
4. 点击查看用户详情
```

#### US-ADM-004: 封禁用户
```
作为一个管理员
我想要封禁违规用户
以便维护平台秩序

验收标准:
1. 选择封禁类型（临时/永久）
2. 填写封禁原因
3. 设置封禁时长（临时封禁）
4. 确认后生效
5. 用户端显示封禁提示
6. 记录操作日志
```

### 2.3 数据统计

#### US-ADM-005: 查看数据看板
```
作为一个管理员
我想要查看平台数据看板
以便了解运营情况

验收标准:
1. 显示今日/本周/本月核心指标
2. 显示DAU/MAU趋势图
3. 显示用户增长曲线
4. 显示学习数据统计
5. 支持自定义时间范围
```

### 2.4 系统配置

#### US-ADM-006: 配置游戏参数
```
作为一个管理员
我想要配置游戏参数
以便调整游戏难度和体验

验收标准:
1. 配置各模式时间参数
2. 配置计分规则参数
3. 配置评星标准参数
4. 支持预览和回滚
5. 配置生效时间
```

---

## 3. 业务规则

### 3.1 管理员权限规则

| 角色 | 权限说明 |
|------|----------|
| 超级管理员 | 所有权限，包括管理员账号管理 |
| 内容管理员 | 词库、单词、关卡的增删改查 |
| 运营管理员 | 用户管理、数据统计、公告管理 |
| 只读管理员 | 仅查看权限，无修改权限 |

### 3.2 词库管理规则

| 规则编号 | 规则描述 |
|----------|----------|
| WB-ADM-001 | 词库发布前必须包含至少10个单词 |
| WB-ADM-002 | 词库下架后用户仍可访问已学习内容 |
| WB-ADM-003 | 词库删除为软删除，可恢复 |
| WB-ADM-004 | 词库分类修改需要二次确认 |

### 3.3 单词导入规则

| 规则编号 | 规则描述 |
|----------|----------|
| IMPORT-001 | 必填字段：英文、中文释义 |
| IMPORT-002 | 单次导入最大5000条 |
| IMPORT-003 | 重复单词自动跳过或更新（可配置） |
| IMPORT-004 | 导入失败的记录生成错误报告 |

### 3.4 用户管理规则

| 规则编号 | 规则描述 |
|----------|----------|
| USER-ADM-001 | 封禁操作需要填写原因 |
| USER-ADM-002 | 永久封禁需要超级管理员确认 |
| USER-ADM-003 | 解封后用户数据保留 |
| USER-ADM-004 | 删除用户数据需保留30天 |

### 3.5 操作日志规则

| 规则编号 | 规则描述 |
|----------|----------|
| LOG-001 | 所有增删改操作必须记录日志 |
| LOG-002 | 日志包含操作人、时间、内容、IP |
| LOG-003 | 日志保留期限为1年 |
| LOG-004 | 敏感操作需要二次确认 |

---

## 4. 数据模型

### 4.1 管理员账号

```json
{
  "id": "admin_001",
  "username": "admin",
  "password_hash": "$2b$10$xxxxx",
  "name": "张管理",
  "email": "admin@boomword.com",
  "phone": "13800138000",
  "avatar_url": "https://cdn.boomword.com/admin/avatar/001.png",
  "role": "super_admin",
  "status": "active",
  "last_login_at": "2026-02-27T10:00:00Z",
  "last_login_ip": "192.168.1.1",
  "created_at": "2026-01-01T00:00:00Z",
  "updated_at": "2026-02-27T10:00:00Z"
}
```

### 4.2 角色权限

```json
{
  "id": "role_001",
  "code": "content_admin",
  "name": "内容管理员",
  "description": "负责词库和单词内容管理",
  "permissions": [
    "word_bank:read",
    "word_bank:create",
    "word_bank:update",
    "word_bank:delete",
    "word:read",
    "word:create",
    "word:update",
    "word:delete",
    "chapter:read",
    "chapter:create",
    "chapter:update",
    "section:read",
    "section:create",
    "section:update"
  ],
  "created_at": "2026-01-01T00:00:00Z",
  "updated_at": "2026-01-01T00:00:00Z"
}
```

### 4.3 操作日志

```json
{
  "id": "log_001",
  "admin_id": "admin_001",
  "admin_name": "张管理",
  "action": "word_bank:create",
  "resource_type": "word_bank",
  "resource_id": "wb_001",
  "description": "创建词库: 四级核心词汇",
  "request_data": {
    "name": "四级核心词汇",
    "category_id": "cat_001"
  },
  "response_data": {
    "id": "wb_001",
    "status": "draft"
  },
  "ip_address": "192.168.1.1",
  "user_agent": "Mozilla/5.0...",
  "created_at": "2026-02-27T10:00:00Z"
}
```

### 4.4 系统配置

```json
{
  "id": "config_001",
  "key": "game_settings",
  "value": {
    "practice_mode": {
      "time_limit_enabled": false,
      "time_limit_seconds": 300
    },
    "challenge_mode": {
      "time_per_word_seconds": 10,
      "error_deduction": 5
    },
    "speed_mode": {
      "time_per_word_seconds": 5,
      "error_deduction": 10
    },
    "scoring": {
      "time_bonus_factor": 0.5,
      "combo_bonus_factor": 0.1,
      "combo_bonus_max": 2
    }
  },
  "description": "游戏参数配置",
  "version": 3,
  "effective_at": "2026-02-27T00:00:00Z",
  "created_by": "admin_001",
  "created_at": "2026-02-27T10:00:00Z",
  "updated_at": "2026-02-27T10:00:00Z"
}
```

### 4.5 公告

```json
{
  "id": "notice_001",
  "title": "系统升级公告",
  "content": "尊敬的用户，系统将于2026年3月1日进行升级维护...",
  "type": "system",
  "priority": "high",
  "target_users": "all",
  "status": "published",
  "start_time": "2026-02-27T00:00:00Z",
  "end_time": "2026-03-01T00:00:00Z",
  "created_by": "admin_001",
  "created_at": "2026-02-27T10:00:00Z",
  "published_at": "2026-02-27T10:00:00Z"
}
```

### 4.6 用户反馈

```json
{
  "id": "feedback_001",
  "user_id": "usr_001",
  "user_info": {
    "nickname": "单词小达人",
    "phone": "138****8000"
  },
  "type": "bug",
  "title": "游戏闪退问题",
  "content": "在挑战模式中，游戏偶尔会闪退...",
  "screenshots": [
    "https://cdn.boomword.com/feedback/001_1.png"
  ],
  "device_info": {
    "platform": "iOS",
    "version": "15.0",
    "app_version": "1.0.0"
  },
  "status": "pending",
  "handler_id": null,
  "handler_name": null,
  "reply": null,
  "replied_at": null,
  "created_at": "2026-02-27T10:00:00Z"
}
```

### 4.7 导入任务

```json
{
  "id": "import_001",
  "type": "word_import",
  "file_name": "四级词汇.xlsx",
  "file_url": "https://cdn.boomword.com/imports/001.xlsx",
  "target_word_bank_id": "wb_001",
  "status": "completed",
  "progress": {
    "total": 500,
    "processed": 500,
    "success": 485,
    "failed": 15,
    "skipped": 0
  },
  "error_report_url": "https://cdn.boomword.com/imports/001_errors.xlsx",
  "created_by": "admin_001",
  "started_at": "2026-02-27T10:00:00Z",
  "completed_at": "2026-02-27T10:05:00Z"
}
```

---

## 5. 接口定义

### 5.1 管理员登录

**请求**
```
POST /api/admin/v1/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "password123",
  "captcha_code": "abc123",
  "captcha_key": "cap_001"
}
```

**响应成功**
```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "admin": {
      "id": "admin_001",
      "username": "admin",
      "name": "张管理",
      "role": "super_admin",
      "permissions": ["*"]
    },
    "token": {
      "access_token": "eyJhbGciOiJIUzI1NiIs...",
      "expires_in": 86400
    }
  }
}
```

### 5.2 获取词库列表

**请求**
```
GET /api/admin/v1/word-banks
Authorization: Bearer {admin_token}

Query Parameters:
- category_id: string (可选)
- status: string (可选) - draft/published/offline
- keyword: string (可选)
- page: number
- page_size: number
```

**响应成功**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "word_banks": [
      {
        "id": "wb_001",
        "name": "四级核心词汇",
        "category_path": "大学英语 > 四级",
        "word_count": 2000,
        "chapter_count": 20,
        "status": "published",
        "study_count": 15000,
        "created_by": "admin_001",
        "created_at": "2026-02-01T00:00:00Z",
        "updated_at": "2026-02-27T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "page_size": 20,
      "total": 50,
      "total_pages": 3
    }
  }
}
```

### 5.3 创建词库

**请求**
```
POST /api/admin/v1/word-banks
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "name": "四级核心词汇",
  "description": "大学英语四级考试核心词汇2000词",
  "category_id": "cat_college_cet4",
  "cover_url": "https://cdn.boomword.com/covers/cet4.png",
  "tags": ["college", "cet4", "exam"],
  "is_free": true,
  "status": "draft"
}
```

**响应成功**
```json
{
  "code": 200,
  "message": "创建成功",
  "data": {
    "id": "wb_001",
    "name": "四级核心词汇",
    "status": "draft",
    "created_at": "2026-02-27T10:00:00Z"
  }
}
```

### 5.4 批量导入单词

**请求**
```
POST /api/admin/v1/word-banks/{word_bank_id}/import
Authorization: Bearer {admin_token}
Content-Type: multipart/form-data

file: [Excel文件]
options: {
  "duplicate_action": "skip",
  "auto_generate_chapters": true,
  "words_per_section": 10
}
```

**响应成功**
```json
{
  "code": 200,
  "message": "导入任务已创建",
  "data": {
    "import_id": "import_001",
    "status": "processing",
    "preview": {
      "total_rows": 500,
      "valid_rows": 485,
      "invalid_rows": 15,
      "invalid_samples": [
        {
          "row": 10,
          "english": "",
          "error": "英文单词不能为空"
        }
      ]
    }
  }
}
```

### 5.5 获取导入进度

**请求**
```
GET /api/admin/v1/imports/{import_id}
Authorization: Bearer {admin_token}
```

**响应成功**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": "import_001",
    "status": "completed",
    "progress": {
      "total": 500,
      "processed": 500,
      "success": 485,
      "failed": 15
    },
    "error_report_url": "https://cdn.boomword.com/imports/001_errors.xlsx",
    "completed_at": "2026-02-27T10:05:00Z"
  }
}
```

### 5.6 获取用户列表

**请求**
```
GET /api/admin/v1/users
Authorization: Bearer {admin_token}

Query Parameters:
- keyword: string (可选) - 搜索昵称/手机号/邮箱
- status: string (可选) - active/banned/deleted
- registered_from: string (可选) - 注册起始日期
- registered_to: string (可选) - 注册结束日期
- sort_by: string (可选) - created_at/last_login_at/level
- page: number
- page_size: number
```

**响应成功**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "users": [
      {
        "id": "usr_001",
        "nickname": "单词小达人",
        "phone": "138****8000",
        "email": "u***@example.com",
        "level": 15,
        "status": "active",
        "is_guest": false,
        "total_learning_days": 45,
        "total_words_learned": 520,
        "last_login_at": "2026-02-27T15:30:00Z",
        "created_at": "2026-01-15T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "page_size": 20,
      "total": 10000,
      "total_pages": 500
    }
  }
}
```

### 5.7 获取用户详情

**请求**
```
GET /api/admin/v1/users/{user_id}
Authorization: Bearer {admin_token}
```

**响应成功**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": "usr_001",
    "nickname": "单词小达人",
    "phone": "13800138000",
    "email": "user@example.com",
    "avatar_url": "https://cdn.boomword.com/avatar/usr_001.png",
    "gender": "male",
    "grade": "college_2",
    "level": 15,
    "exp": 1250,
    "title": "入门学徒",
    "status": "active",
    "is_guest": false,
    "registration": {
      "method": "phone",
      "created_at": "2026-01-15T10:00:00Z",
      "ip": "192.168.1.1"
    },
    "learning_stats": {
      "total_learning_days": 45,
      "total_learning_time_hours": 15,
      "total_words_learned": 520,
      "total_words_mastered": 380,
      "total_games_played": 200,
      "overall_accuracy": 90
    },
    "current_word_banks": [
      {
        "id": "wb_001",
        "name": "四级核心词汇",
        "progress_percent": 35
      }
    ],
    "login_history": [
      {
        "time": "2026-02-27T15:30:00Z",
        "ip": "192.168.1.1",
        "device": "Chrome/Windows"
      }
    ],
    "ban_history": []
  }
}
```

### 5.8 封禁用户

**请求**
```
POST /api/admin/v1/users/{user_id}/ban
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "ban_type": "temporary",
  "duration_days": 7,
  "reason": "发布违规内容",
  "notify_user": true
}
```

**响应成功**
```json
{
  "code": 200,
  "message": "用户已封禁",
  "data": {
    "user_id": "usr_001",
    "ban_type": "temporary",
    "banned_until": "2026-03-06T15:30:00Z",
    "reason": "发布违规内容"
  }
}
```

### 5.9 解封用户

**请求**
```
POST /api/admin/v1/users/{user_id}/unban
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "reason": "申诉通过"
}
```

**响应成功**
```json
{
  "code": 200,
  "message": "用户已解封",
  "data": {
    "user_id": "usr_001",
    "unbanned_at": "2026-02-27T16:00:00Z"
  }
}
```

### 5.10 获取数据看板

**请求**
```
GET /api/admin/v1/dashboard
Authorization: Bearer {admin_token}

Query Parameters:
- date_from: string (可选)
- date_to: string (可选)
```

**响应成功**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "overview": {
      "total_users": 50000,
      "total_users_change": 5.2,
      "active_users_today": 3500,
      "active_users_change": 3.1,
      "new_users_today": 150,
      "new_users_change": -2.5,
      "total_word_banks": 100,
      "total_words": 50000
    },
    "user_trend": {
      "period": "7d",
      "data": [
        {"date": "2026-02-21", "dau": 3200, "new_users": 120},
        {"date": "2026-02-22", "dau": 3300, "new_users": 130},
        {"date": "2026-02-23", "dau": 3100, "new_users": 110},
        {"date": "2026-02-24", "dau": 3400, "new_users": 140},
        {"date": "2026-02-25", "dau": 3500, "new_users": 155},
        {"date": "2026-02-26", "dau": 3450, "new_users": 145},
        {"date": "2026-02-27", "dau": 3500, "new_users": 150}
      ]
    },
    "learning_stats": {
      "total_games_today": 12000,
      "total_words_practiced_today": 45000,
      "avg_learning_time_minutes": 25,
      "avg_accuracy": 88.5
    },
    "top_word_banks": [
      {
        "id": "wb_001",
        "name": "四级核心词汇",
        "study_count": 15000,
        "completion_rate": 12.5
      }
    ]
  }
}
```

### 5.11 获取系统配置

**请求**
```
GET /api/admin/v1/configs/{config_key}
Authorization: Bearer {admin_token}
```

**响应成功**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "key": "game_settings",
    "value": {
      "practice_mode": {
        "time_limit_enabled": false,
        "time_limit_seconds": 300
      },
      "challenge_mode": {
        "time_per_word_seconds": 10,
        "error_deduction": 5
      },
      "speed_mode": {
        "time_per_word_seconds": 5,
        "error_deduction": 10
      }
    },
    "version": 3,
    "effective_at": "2026-02-27T00:00:00Z",
    "updated_at": "2026-02-27T10:00:00Z"
  }
}
```

### 5.12 更新系统配置

**请求**
```
PUT /api/admin/v1/configs/{config_key}
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "value": {
    "practice_mode": {
      "time_limit_enabled": false,
      "time_limit_seconds": 300
    },
    "challenge_mode": {
      "time_per_word_seconds": 12,
      "error_deduction": 5
    }
  },
  "effective_at": "2026-03-01T00:00:00Z",
  "reason": "调整挑战模式时间"
}
```

**响应成功**
```json
{
  "code": 200,
  "message": "配置已更新",
  "data": {
    "key": "game_settings",
    "version": 4,
    "effective_at": "2026-03-01T00:00:00Z"
  }
}
```

### 5.13 获取操作日志

**请求**
```
GET /api/admin/v1/logs
Authorization: Bearer {admin_token}

Query Parameters:
- admin_id: string (可选)
- action: string (可选)
- resource_type: string (可选)
- date_from: string (可选)
- date_to: string (可选)
- page: number
- page_size: number
```

**响应成功**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "logs": [
      {
        "id": "log_001",
        "admin_name": "张管理",
        "action": "word_bank:create",
        "description": "创建词库: 四级核心词汇",
        "resource_type": "word_bank",
        "resource_id": "wb_001",
        "ip_address": "192.168.1.1",
        "created_at": "2026-02-27T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "page_size": 20,
      "total": 1000,
      "total_pages": 50
    }
  }
}
```

### 5.14 发布公告

**请求**
```
POST /api/admin/v1/notices
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "title": "系统升级公告",
  "content": "尊敬的用户，系统将于2026年3月1日进行升级维护...",
  "type": "system",
  "priority": "high",
  "target_users": "all",
  "start_time": "2026-02-27T00:00:00Z",
  "end_time": "2026-03-01T00:00:00Z"
}
```

**响应成功**
```json
{
  "code": 200,
  "message": "公告已发布",
  "data": {
    "id": "notice_001",
    "title": "系统升级公告",
    "status": "published",
    "published_at": "2026-02-27T10:00:00Z"
  }
}
```

### 5.15 处理用户反馈

**请求**
```
POST /api/admin/v1/feedbacks/{feedback_id}/reply
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "reply": "您好，该问题已收到，我们会尽快修复。",
  "status": "resolved"
}
```

**响应成功**
```json
{
  "code": 200,
  "message": "已回复",
  "data": {
    "feedback_id": "feedback_001",
    "status": "resolved",
    "replied_at": "2026-02-27T16:00:00Z"
  }
}
```

---

## 6. 异常处理

### 6.1 错误码定义

| 错误码 | 错误标识 | 说明 | HTTP状态码 |
|--------|----------|------|------------|
| 70001 | ADMIN_NOT_FOUND | 管理员不存在 | 404 |
| 70002 | ADMIN_PASSWORD_INCORRECT | 密码错误 | 401 |
| 70003 | ADMIN_DISABLED | 管理员账号已禁用 | 403 |
| 70004 | PERMISSION_DENIED | 无权限执行此操作 | 403 |
| 70005 | TOKEN_EXPIRED | Token已过期 | 401 |
| 70006 | IMPORT_FILE_INVALID | 导入文件格式无效 | 400 |
| 70007 | IMPORT_FAILED | 导入失败 | 500 |
| 70008 | CONFIG_UPDATE_FAILED | 配置更新失败 | 500 |
| 70009 | USER_ALREADY_BANNED | 用户已被封禁 | 400 |
| 70010 | USER_NOT_BANNED | 用户未被封禁 | 400 |
| 70011 | WORD_BANK_NOT_EMPTY | 词库不为空，无法删除 | 400 |
| 70012 | CAPTCHA_INVALID | 验证码错误 | 400 |

---

## 7. 安全要求

### 7.1 访问控制

| 安全项 | 要求 |
|--------|------|
| 登录验证 | 用户名+密码+图形验证码 |
| 会话管理 | Token有效期24小时 |
| 权限验证 | 每次请求验证权限 |
| IP白名单 | 可配置允许访问的IP范围 |

### 7.2 操作安全

| 安全项 | 要求 |
|--------|------|
| 敏感操作 | 需要二次密码确认 |
| 批量操作 | 限制单次操作数量 |
| 数据导出 | 记录导出日志 |
| 删除操作 | 软删除，保留30天 |

### 7.3 审计要求

| 安全项 | 要求 |
|--------|------|
| 操作日志 | 记录所有增删改操作 |
| 登录日志 | 记录所有登录尝试 |
| 日志保留 | 至少保留1年 |
| 日志查询 | 支持按条件查询 |

---

## 8. 性能要求

| 接口 | 响应时间要求 | 并发要求 |
|------|--------------|----------|
| 管理员登录 | < 500ms | 10/s |
| 列表查询 | < 300ms | 50/s |
| 数据导出 | < 30s | 5/s |
| 批量导入 | < 5分钟 | 3/s |
| 数据看板 | < 1s | 20/s |

---

## 9. 枚举定义

### 9.1 管理员角色

```json
{
  "admin_roles": [
    {"code": "super_admin", "name": "超级管理员"},
    {"code": "content_admin", "name": "内容管理员"},
    {"code": "operation_admin", "name": "运营管理员"},
    {"code": "readonly_admin", "name": "只读管理员"}
  ]
}
```

### 9.2 管理员状态

```json
{
  "admin_status": [
    {"code": "active", "name": "正常"},
    {"code": "disabled", "name": "禁用"}
  ]
}
```

### 9.3 公告类型

```json
{
  "notice_types": [
    {"code": "system", "name": "系统公告"},
    {"code": "activity", "name": "活动公告"},
    {"code": "update", "name": "更新公告"},
    {"code": "maintenance", "name": "维护公告"}
  ]
}
```

### 9.4 反馈类型

```json
{
  "feedback_types": [
    {"code": "bug", "name": "Bug反馈"},
    {"code": "suggestion", "name": "功能建议"},
    {"code": "complaint", "name": "投诉"},
    {"code": "other", "name": "其他"}
  ]
}
```

### 9.5 反馈状态

```json
{
  "feedback_status": [
    {"code": "pending", "name": "待处理"},
    {"code": "processing", "name": "处理中"},
    {"code": "resolved", "name": "已解决"},
    {"code": "closed", "name": "已关闭"}
  ]
}
```

### 9.6 导入状态

```json
{
  "import_status": [
    {"code": "pending", "name": "等待中"},
    {"code": "processing", "name": "处理中"},
    {"code": "completed", "name": "已完成"},
    {"code": "failed", "name": "失败"}
  ]
}
```

---

## 10. 导入模板

### 10.1 单词导入Excel模板

| english | chinese | phonetic | difficulty | part_of_speech | example_sentence | example_chinese | tags |
|---------|---------|----------|------------|----------------|------------------|-----------------|------|
| apple | 苹果 | /ˈæp.əl/ | 1 | n. | I eat an apple every day. | 我每天吃一个苹果。 | food,fruit |
| beautiful | 美丽的 | /ˈbjuː.tɪ.fəl/ | 4 | adj. | She is beautiful. | 她很美丽。 | adjective |

### 10.2 字段说明

| 字段 | 必填 | 说明 |
|------|------|------|
| english | 是 | 英文单词 |
| chinese | 是 | 中文释义 |
| phonetic | 否 | 音标 |
| difficulty | 否 | 难度1-5，不填自动计算 |
| part_of_speech | 否 | 词性 |
| example_sentence | 否 | 例句 |
| example_chinese | 否 | 例句翻译 |
| tags | 否 | 标签，逗号分隔 |
