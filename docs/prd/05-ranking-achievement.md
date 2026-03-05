# 排行榜与成就系统详细设计

## 1. 功能清单

| 功能模块 | 功能点 | 优先级 | 版本 |
|----------|--------|--------|------|
| 总分排行榜 | 周榜 | P1 | v1.5 |
| 总分排行榜 | 月榜 | P1 | v1.5 |
| 总分排行榜 | 总榜 | P1 | v1.5 |
| 关卡排行榜 | 小节排行榜 | P1 | v1.5 |
| 关卡排行榜 | 最高分排行 | P1 | v1.5 |
| 关卡排行榜 | 最短用时排行 | P1 | v1.5 |
| 好友排行榜 | 好友分数排行 | P1 | v1.5 |
| 成就系统 | 学习成就 | P1 | v1.5 |
| 成就系统 | 游戏成就 | P1 | v1.5 |
| 成就系统 | 社交成就 | P1 | v1.5 |
| 成就系统 | 成就展示 | P1 | v1.5 |
| 好友系统 | 添加好友 | P1 | v1.5 |
| 好友系统 | 好友列表 | P1 | v1.5 |
| 好友系统 | 好友动态 | P2 | v2.0 |
| 分享功能 | 成绩分享 | P1 | v1.5 |
| 分享功能 | 学习海报 | P2 | v2.0 |

---

## 2. 用户故事

### 2.1 排行榜

#### US-RK-001: 查看总分排行榜
```
作为一个用户
我想要查看总分排行榜
以便了解自己在全体用户中的排名

验收标准:
1. 可切换查看周榜、月榜、总榜
2. 显示排名、昵称、头像、等级、分数
3. 前三名使用特殊样式（金银铜）
4. 显示自己当前排名
5. 可以查看任意排名用户的主页
```

#### US-RK-002: 查看关卡排行榜
```
作为一个用户
我想要查看某个小节的排行榜
以便与其他玩家比较成绩

验收标准:
1. 在小节详情页可查看排行榜
2. 显示最高分排行
3. 显示最短用时排行
4. 仅挑战模式成绩计入
5. 显示自己的排名和成绩
```

#### US-RK-003: 查看好友排行榜
```
作为一个用户
我想要查看好友排行榜
以便与好友竞争

验收标准:
1. 仅显示好友的排名
2. 显示本周学习分数排名
3. 可以快速跳转到好友主页
4. 支持给好友点赞
```

### 2.2 成就系统

#### US-RK-004: 获得成就
```
作为一个用户
我想要通过完成特定目标获得成就
以便获得成就感和奖励

验收标准:
1. 达成条件时自动解锁成就
2. 显示成就解锁通知
3. 获得对应经验值奖励
4. 成就记录到个人主页
```

#### US-RK-005: 查看成就列表
```
作为一个用户
我想要查看所有成就和完成进度
以便了解还有哪些成就可以达成

验收标准:
1. 分类显示所有成就
2. 已完成成就显示完成时间
3. 未完成成就显示进度
4. 隐藏成就在解锁前显示"???"
```

### 2.3 好友系统

#### US-RK-006: 添加好友
```
作为一个用户
我想要添加其他用户为好友
以便与他们互动和竞争

验收标准:
1. 可以通过用户ID搜索添加
2. 可以扫描二维码添加
3. 发送好友请求需对方确认
4. 显示好友数量（有上限）
```

#### US-RK-007: 查看好友动态
```
作为一个用户
我想要查看好友的学习动态
以便了解好友的学习情况

验收标准:
1. 显示好友最近的学习记录
2. 显示好友获得的成就
3. 可以给动态点赞
4. 可以评论（简单表情）
```

### 2.4 分享功能

#### US-RK-008: 分享学习成绩
```
作为一个用户
我想要分享我的学习成绩
以便展示给朋友看

验收标准:
1. 游戏结束后可以选择分享
2. 生成精美的分享卡片
3. 支持分享到微信、QQ等
4. 分享卡片包含二维码
```

---

## 3. 业务规则

### 3.1 排行榜规则

| 规则编号 | 规则描述 |
|----------|----------|
| RANK-001 | 周榜每周一00:00自动重置 |
| RANK-002 | 月榜每月1日00:00自动重置 |
| RANK-003 | 总榜永久累计，不重置 |
| RANK-004 | 仅挑战模式成绩计入关卡排行榜 |
| RANK-005 | 同分按达成时间排序（早者优先） |
| RANK-006 | 排行榜最多显示前10000名 |
| RANK-007 | 游客账号不计入排行榜 |
| RANK-008 | 封禁用户从排行榜移除 |

### 3.2 排行榜分数计算

```
周榜分数 = 本周内所有游戏获得分数总和
月榜分数 = 本月内所有游戏获得分数总和
总榜分数 = 账号创建以来所有游戏获得分数总和
```

### 3.3 成就分类

#### 3.3.1 学习成就

| 成就ID | 成就名称 | 达成条件 | 奖励 |
|--------|----------|----------|------|
| ACH_L001 | 初出茅庐 | 完成第一个小节 | 10 EXP |
| ACH_L002 | 持之以恒 | 连续学习7天 | 50 EXP |
| ACH_L003 | 学霸之路 | 连续学习30天 | 200 EXP |
| ACH_L004 | 学习狂人 | 连续学习100天 | 500 EXP |
| ACH_L005 | 词汇百人斩 | 累计学习100词 | 100 EXP |
| ACH_L006 | 词汇千人斩 | 累计学习1000词 | 500 EXP |
| ACH_L007 | 词汇万人斩 | 累计学习10000词 | 2000 EXP |
| ACH_L008 | 勤奋学习 | 累计学习时长10小时 | 100 EXP |
| ACH_L009 | 刻苦钻研 | 累计学习时长100小时 | 500 EXP |
| ACH_L010 | 词库征服者 | 完成一个词库全部关卡 | 300 EXP |

#### 3.3.2 游戏成就

| 成就ID | 成就名称 | 达成条件 | 奖励 |
|--------|----------|----------|------|
| ACH_G001 | 完美主义 | 单局100%正确率 | 30 EXP |
| ACH_G002 | 零失误大师 | 累计10次100%正确率 | 100 EXP |
| ACH_G003 | 连击新手 | 单局达成10连击 | 20 EXP |
| ACH_G004 | 连击高手 | 单局达成50连击 | 50 EXP |
| ACH_G005 | 连击大师 | 单局达成100连击 | 100 EXP |
| ACH_G006 | 速度之星 | 速度挑战三星通关 | 80 EXP |
| ACH_G007 | 闪电手指 | 速度挑战剩余时间≥80% | 100 EXP |
| ACH_G008 | 全星收集 | 单词库全三星 | 500 EXP |
| ACH_G009 | 首次登顶 | 进入任意排行榜前10 | 200 EXP |
| ACH_G010 | 霸榜之王 | 周榜第一名 | 500 EXP |

#### 3.3.3 社交成就

| 成就ID | 成就名称 | 达成条件 | 奖励 |
|--------|----------|----------|------|
| ACH_S001 | 交友达人 | 添加10个好友 | 30 EXP |
| ACH_S002 | 社交明星 | 添加50个好友 | 100 EXP |
| ACH_S003 | 人气之星 | 获得100个点赞 | 50 EXP |
| ACH_S004 | 万人迷 | 获得1000个点赞 | 200 EXP |
| ACH_S005 | 排行新秀 | 进入周榜前100 | 100 EXP |
| ACH_S006 | 排行精英 | 进入周榜前10 | 300 EXP |
| ACH_S007 | 分享达人 | 分享成绩10次 | 50 EXP |
| ACH_S008 | 邀请大使 | 邀请10个好友注册 | 200 EXP |

### 3.4 好友规则

| 规则编号 | 规则描述 |
|----------|----------|
| FRIEND-001 | 每个用户最多500个好友 |
| FRIEND-002 | 好友请求7天内未处理自动过期 |
| FRIEND-003 | 可以设置拒绝陌生人添加 |
| FRIEND-004 | 删除好友为单向操作 |
| FRIEND-005 | 被封禁用户无法添加好友 |

### 3.5 点赞规则

| 规则编号 | 规则描述 |
|----------|----------|
| LIKE-001 | 每人每天最多给好友点赞10次 |
| LIKE-002 | 同一动态只能点赞一次 |
| LIKE-003 | 可以取消点赞 |
| LIKE-004 | 点赞数实时更新 |

---

## 4. 状态流转图

### 4.1 好友请求状态

```
┌──────────────┐
│   已发送     │
│   PENDING    │
└──────────────┘
       │
       ├─── 对方同意 ───▶ ┌──────────────┐
       │                 │   已接受     │
       │                 │  ACCEPTED    │
       │                 └──────────────┘
       │
       ├─── 对方拒绝 ───▶ ┌──────────────┐
       │                 │   已拒绝     │
       │                 │  REJECTED    │
       │                 └──────────────┘
       │
       └─── 超时未处理 ──▶ ┌──────────────┐
                         │   已过期     │
                         │   EXPIRED    │
                         └──────────────┘
```

### 4.2 成就解锁状态

```
┌──────────────┐
│   未解锁     │
│   LOCKED     │
└──────────────┘
       │
       │ 达成条件
       ▼
┌──────────────┐
│   解锁中     │ (显示解锁动画)
│  UNLOCKING   │
└──────────────┘
       │
       │ 动画完成
       ▼
┌──────────────┐
│   已解锁     │
│  UNLOCKED    │
└──────────────┘
       │
       │ 领取奖励
       ▼
┌──────────────┐
│   已领取     │
│   CLAIMED    │
└──────────────┘
```

---

## 5. 数据模型

### 5.1 排行榜条目

```json
{
  "id": "rank_001",
  "ranking_type": "weekly",
  "period": "2026-W09",
  "rank": 1,
  "user_id": "usr_001",
  "score": 99999,
  "games_played": 150,
  "accuracy_avg": 95.5,
  "updated_at": "2026-02-27T15:30:00Z"
}
```

### 5.2 关卡排行榜条目

```json
{
  "id": "sec_rank_001",
  "section_id": "sec_001",
  "ranking_type": "high_score",
  "rank": 1,
  "user_id": "usr_001",
  "score": 1250,
  "accuracy": 100,
  "time_used": 45,
  "combo_max": 10,
  "achieved_at": "2026-02-27T15:30:00Z"
}
```

### 5.3 用户排行榜快照

```json
{
  "user_id": "usr_001",
  "rankings": {
    "weekly": {
      "rank": 128,
      "score": 12500,
      "percentile": 5.2
    },
    "monthly": {
      "rank": 256,
      "score": 45000,
      "percentile": 8.5
    },
    "all_time": {
      "rank": 1024,
      "score": 150000,
      "percentile": 12.3
    }
  },
  "updated_at": "2026-02-27T15:30:00Z"
}
```

### 5.4 成就定义

```json
{
  "id": "ACH_L001",
  "code": "first_section",
  "name": "初出茅庐",
  "description": "完成第一个小节",
  "category": "learning",
  "icon_url": "https://cdn.boomword.com/achievements/first_section.png",
  "icon_locked_url": "https://cdn.boomword.com/achievements/first_section_locked.png",
  "exp_reward": 10,
  "is_hidden": false,
  "condition": {
    "type": "section_complete",
    "count": 1
  },
  "sort_order": 1,
  "created_at": "2026-02-27T10:00:00Z"
}
```

### 5.5 用户成就记录

```json
{
  "id": "ua_001",
  "user_id": "usr_001",
  "achievement_id": "ACH_L001",
  "status": "claimed",
  "progress": {
    "current": 1,
    "target": 1,
    "percent": 100
  },
  "unlocked_at": "2026-02-27T10:30:00Z",
  "claimed_at": "2026-02-27T10:30:05Z"
}
```

### 5.6 好友关系

```json
{
  "id": "fr_001",
  "user_id": "usr_001",
  "friend_id": "usr_002",
  "status": "accepted",
  "created_at": "2026-02-27T10:00:00Z",
  "accepted_at": "2026-02-27T10:05:00Z"
}
```

### 5.7 好友请求

```json
{
  "id": "freq_001",
  "from_user_id": "usr_001",
  "to_user_id": "usr_002",
  "status": "pending",
  "message": "一起来学习吧！",
  "created_at": "2026-02-27T10:00:00Z",
  "expires_at": "2026-03-06T10:00:00Z",
  "handled_at": null
}
```

### 5.8 用户动态

```json
{
  "id": "activity_001",
  "user_id": "usr_001",
  "type": "game_complete",
  "content": {
    "section_name": "1-1",
    "word_bank_name": "四级核心词汇",
    "score": 1250,
    "stars": 3
  },
  "like_count": 15,
  "comment_count": 3,
  "is_public": true,
  "created_at": "2026-02-27T15:30:00Z"
}
```

### 5.9 点赞记录

```json
{
  "id": "like_001",
  "user_id": "usr_002",
  "target_type": "activity",
  "target_id": "activity_001",
  "created_at": "2026-02-27T15:35:00Z"
}
```

---

## 6. 接口定义

### 6.1 获取总分排行榜

**请求**
```
GET /api/v1/rankings/total
Authorization: Bearer {access_token}

Query Parameters:
- type: string (必填) - weekly/monthly/all_time
- page: number (可选) - 页码，默认1
- page_size: number (可选) - 每页数量，默认50
```

**响应成功**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "ranking_type": "weekly",
    "period": "2026-W09",
    "period_start": "2026-02-24T00:00:00Z",
    "period_end": "2026-03-02T23:59:59Z",
    "rankings": [
      {
        "rank": 1,
        "user": {
          "id": "usr_001",
          "nickname": "单词王者",
          "avatar_url": "https://cdn.boomword.com/avatar/usr_001.png",
          "level": 45,
          "title": "英语大师"
        },
        "score": 99999,
        "games_played": 150
      },
      {
        "rank": 2,
        "user": {
          "id": "usr_002",
          "nickname": "英语达人",
          "avatar_url": "https://cdn.boomword.com/avatar/usr_002.png",
          "level": 42,
          "title": "英语大师"
        },
        "score": 95432,
        "games_played": 142
      }
    ],
    "my_ranking": {
      "rank": 128,
      "score": 12500,
      "percentile": 5.2
    },
    "pagination": {
      "page": 1,
      "page_size": 50,
      "total": 10000,
      "total_pages": 200
    }
  }
}
```

### 6.2 获取关卡排行榜

**请求**
```
GET /api/v1/sections/{section_id}/rankings
Authorization: Bearer {access_token}

Query Parameters:
- type: string (必填) - high_score/fastest_time
- page: number (可选) - 页码，默认1
- page_size: number (可选) - 每页数量，默认20
```

**响应成功**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "section": {
      "id": "sec_001",
      "name": "1-1",
      "chapter_name": "Unit 1 Hello"
    },
    "ranking_type": "high_score",
    "rankings": [
      {
        "rank": 1,
        "user": {
          "id": "usr_001",
          "nickname": "单词王者",
          "avatar_url": "https://cdn.boomword.com/avatar/usr_001.png",
          "level": 45
        },
        "score": 1250,
        "accuracy": 100,
        "time_used": 45,
        "achieved_at": "2026-02-27T15:30:00Z"
      }
    ],
    "my_ranking": {
      "rank": 15,
      "score": 850,
      "accuracy": 90,
      "time_used": 65
    },
    "pagination": {
      "page": 1,
      "page_size": 20,
      "total": 1500,
      "total_pages": 75
    }
  }
}
```

### 6.3 获取好友排行榜

**请求**
```
GET /api/v1/rankings/friends
Authorization: Bearer {access_token}

Query Parameters:
- type: string (可选) - weekly/monthly，默认weekly
```

**响应成功**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "ranking_type": "weekly",
    "rankings": [
      {
        "rank": 1,
        "user": {
          "id": "usr_003",
          "nickname": "学习小能手",
          "avatar_url": "https://cdn.boomword.com/avatar/usr_003.png",
          "level": 38
        },
        "score": 15000,
        "is_liked_today": false
      }
    ],
    "my_ranking": {
      "rank": 5,
      "score": 8500
    },
    "total_friends": 25
  }
}
```

### 6.4 获取成就列表

**请求**
```
GET /api/v1/achievements
Authorization: Bearer {access_token}

Query Parameters:
- category: string (可选) - learning/game/social
- status: string (可选) - locked/unlocked/claimed
```

**响应成功**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "categories": [
      {
        "code": "learning",
        "name": "学习成就",
        "achievements": [
          {
            "id": "ACH_L001",
            "code": "first_section",
            "name": "初出茅庐",
            "description": "完成第一个小节",
            "icon_url": "https://cdn.boomword.com/achievements/first_section.png",
            "exp_reward": 10,
            "status": "claimed",
            "progress": {
              "current": 1,
              "target": 1,
              "percent": 100
            },
            "unlocked_at": "2026-02-27T10:30:00Z"
          },
          {
            "id": "ACH_L002",
            "code": "persistent",
            "name": "持之以恒",
            "description": "连续学习7天",
            "icon_url": "https://cdn.boomword.com/achievements/persistent_locked.png",
            "exp_reward": 50,
            "status": "locked",
            "progress": {
              "current": 3,
              "target": 7,
              "percent": 42.8
            },
            "unlocked_at": null
          }
        ],
        "stats": {
          "total": 10,
          "unlocked": 3,
          "claimed": 2
        }
      }
    ],
    "overall_stats": {
      "total_achievements": 28,
      "unlocked": 8,
      "claimed": 7,
      "total_exp_earned": 310
    }
  }
}
```

### 6.5 领取成就奖励

**请求**
```
POST /api/v1/achievements/{achievement_id}/claim
Authorization: Bearer {access_token}
```

**响应成功**
```json
{
  "code": 200,
  "message": "奖励已领取",
  "data": {
    "achievement": {
      "id": "ACH_L001",
      "name": "初出茅庐"
    },
    "rewards": {
      "exp": 10
    },
    "user_level": {
      "previous_level": 5,
      "current_level": 5,
      "current_exp": 260,
      "exp_to_next_level": 40
    }
  }
}
```

### 6.6 发送好友请求

**请求**
```
POST /api/v1/friends/requests
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "target_user_id": "usr_002",
  "message": "一起来学习吧！"
}
```

**响应成功**
```json
{
  "code": 200,
  "message": "好友请求已发送",
  "data": {
    "request_id": "freq_001",
    "target_user": {
      "id": "usr_002",
      "nickname": "学习小伙伴"
    },
    "expires_at": "2026-03-06T10:00:00Z"
  }
}
```

### 6.7 处理好友请求

**请求**
```
POST /api/v1/friends/requests/{request_id}/handle
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "action": "accept"
}
```

**参数说明**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| action | string | 是 | accept/reject |

**响应成功**
```json
{
  "code": 200,
  "message": "已添加好友",
  "data": {
    "friend": {
      "id": "usr_001",
      "nickname": "单词王者",
      "avatar_url": "https://cdn.boomword.com/avatar/usr_001.png",
      "level": 45
    }
  }
}
```

### 6.8 获取好友列表

**请求**
```
GET /api/v1/friends
Authorization: Bearer {access_token}

Query Parameters:
- page: number (可选) - 页码，默认1
- page_size: number (可选) - 每页数量，默认50
- keyword: string (可选) - 搜索关键词
```

**响应成功**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "friends": [
      {
        "id": "usr_002",
        "nickname": "学习小伙伴",
        "avatar_url": "https://cdn.boomword.com/avatar/usr_002.png",
        "level": 32,
        "title": "词汇达人",
        "is_online": true,
        "last_active_at": "2026-02-27T15:30:00Z",
        "weekly_score": 8500,
        "added_at": "2026-02-20T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "page_size": 50,
      "total": 25,
      "total_pages": 1
    },
    "friend_limit": 500
  }
}
```

### 6.9 删除好友

**请求**
```
DELETE /api/v1/friends/{friend_id}
Authorization: Bearer {access_token}
```

**响应成功**
```json
{
  "code": 200,
  "message": "已删除好友"
}
```

### 6.10 获取好友动态

**请求**
```
GET /api/v1/friends/activities
Authorization: Bearer {access_token}

Query Parameters:
- page: number (可选) - 页码，默认1
- page_size: number (可选) - 每页数量，默认20
```

**响应成功**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "activities": [
      {
        "id": "activity_001",
        "user": {
          "id": "usr_002",
          "nickname": "学习小伙伴",
          "avatar_url": "https://cdn.boomword.com/avatar/usr_002.png"
        },
        "type": "game_complete",
        "content": {
          "section_name": "1-1",
          "word_bank_name": "四级核心词汇",
          "score": 1250,
          "stars": 3
        },
        "like_count": 15,
        "is_liked": false,
        "created_at": "2026-02-27T15:30:00Z"
      },
      {
        "id": "activity_002",
        "user": {
          "id": "usr_003",
          "nickname": "学习小能手",
          "avatar_url": "https://cdn.boomword.com/avatar/usr_003.png"
        },
        "type": "achievement_unlocked",
        "content": {
          "achievement_name": "词汇千人斩",
          "achievement_icon": "https://cdn.boomword.com/achievements/word_1000.png"
        },
        "like_count": 8,
        "is_liked": true,
        "created_at": "2026-02-27T14:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "page_size": 20,
      "total": 100,
      "total_pages": 5
    }
  }
}
```

### 6.11 点赞动态

**请求**
```
POST /api/v1/activities/{activity_id}/like
Authorization: Bearer {access_token}
```

**响应成功**
```json
{
  "code": 200,
  "message": "点赞成功",
  "data": {
    "activity_id": "activity_001",
    "like_count": 16,
    "is_liked": true
  }
}
```

### 6.12 取消点赞

**请求**
```
DELETE /api/v1/activities/{activity_id}/like
Authorization: Bearer {access_token}
```

**响应成功**
```json
{
  "code": 200,
  "message": "已取消点赞",
  "data": {
    "activity_id": "activity_001",
    "like_count": 15,
    "is_liked": false
  }
}
```

### 6.13 生成分享卡片

**请求**
```
POST /api/v1/share/card
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "type": "game_result",
  "data": {
    "game_record_id": "game_001"
  }
}
```

**响应成功**
```json
{
  "code": 200,
  "message": "分享卡片已生成",
  "data": {
    "card_url": "https://cdn.boomword.com/share/card_001.png",
    "card_id": "card_001",
    "qr_code_url": "https://cdn.boomword.com/share/qr_001.png",
    "share_text": "我在BoomWord完成了「四级核心词汇」1-1关卡，获得了1250分和3颗星！快来和我一起学习吧！",
    "expires_at": "2026-03-06T10:00:00Z"
  }
}
```

---

## 7. 异常处理

### 7.1 错误码定义

| 错误码 | 错误标识 | 说明 | HTTP状态码 |
|--------|----------|------|------------|
| 50001 | RANKING_NOT_FOUND | 排行榜不存在 | 404 |
| 50002 | ACHIEVEMENT_NOT_FOUND | 成就不存在 | 404 |
| 50003 | ACHIEVEMENT_NOT_UNLOCKED | 成就未解锁 | 400 |
| 50004 | ACHIEVEMENT_ALREADY_CLAIMED | 成就奖励已领取 | 400 |
| 50005 | FRIEND_REQUEST_NOT_FOUND | 好友请求不存在 | 404 |
| 50006 | FRIEND_REQUEST_EXPIRED | 好友请求已过期 | 400 |
| 50007 | FRIEND_REQUEST_HANDLED | 好友请求已处理 | 400 |
| 50008 | ALREADY_FRIENDS | 已经是好友 | 400 |
| 50009 | CANNOT_ADD_SELF | 不能添加自己为好友 | 400 |
| 50010 | FRIEND_LIMIT_EXCEEDED | 好友数量已达上限 | 400 |
| 50011 | LIKE_LIMIT_EXCEEDED | 今日点赞次数已达上限 | 429 |
| 50012 | ALREADY_LIKED | 已经点赞过 | 400 |
| 50013 | NOT_LIKED | 未点赞 | 400 |
| 50014 | USER_NOT_FOUND | 用户不存在 | 404 |
| 50015 | USER_REJECTED_REQUEST | 用户拒绝添加好友 | 403 |

---

## 8. 边界条件

### 8.1 排行榜边界

| 场景 | 处理方式 |
|------|----------|
| 排行榜重置时有用户正在游戏 | 游戏结束后分数计入新周期 |
| 同分用户排名 | 按达成时间排序 |
| 排名超过10000 | 显示"10000+" |
| 用户注销账号 | 从排行榜移除 |
| 用户被封禁 | 从排行榜移除，解封后不恢复 |

### 8.2 成就边界

| 场景 | 处理方式 |
|------|----------|
| 同时达成多个成就 | 依次显示解锁动画 |
| 数据回滚导致条件不满足 | 已解锁成就不撤销 |
| 成就奖励变更 | 已领取按旧奖励，未领取按新奖励 |
| 成就条件变更 | 已解锁保持，未解锁按新条件 |

### 8.3 好友边界

| 场景 | 处理方式 |
|------|----------|
| 双方同时发送好友请求 | 自动建立好友关系 |
| 删除后重新添加 | 允许，需重新发送请求 |
| 好友被封禁 | 保持好友关系，但不显示动态 |
| 好友注销账号 | 自动解除好友关系 |

---

## 9. 性能要求

| 接口 | 响应时间要求 | 并发要求 |
|------|--------------|----------|
| 获取总分排行榜 | < 200ms | 300/s |
| 获取关卡排行榜 | < 200ms | 200/s |
| 获取好友排行榜 | < 150ms | 200/s |
| 获取成就列表 | < 150ms | 200/s |
| 领取成就 | < 200ms | 100/s |
| 获取好友列表 | < 150ms | 200/s |
| 获取好友动态 | < 200ms | 200/s |
| 点赞 | < 100ms | 500/s |

### 9.1 缓存策略

| 数据类型 | 缓存时间 | 缓存位置 |
|----------|----------|----------|
| 总分排行榜 | 5分钟 | Redis |
| 关卡排行榜 | 10分钟 | Redis |
| 用户排名 | 实时计算 | - |
| 成就列表 | 1小时 | Redis |
| 用户成就 | 实时 | - |
| 好友列表 | 1分钟 | Redis |

---

## 10. 枚举定义

### 10.1 排行榜类型

```json
{
  "ranking_types": [
    {"code": "weekly", "name": "周榜"},
    {"code": "monthly", "name": "月榜"},
    {"code": "all_time", "name": "总榜"}
  ]
}
```

### 10.2 关卡排行榜类型

```json
{
  "section_ranking_types": [
    {"code": "high_score", "name": "最高分"},
    {"code": "fastest_time", "name": "最快用时"}
  ]
}
```

### 10.3 成就分类

```json
{
  "achievement_categories": [
    {"code": "learning", "name": "学习成就"},
    {"code": "game", "name": "游戏成就"},
    {"code": "social", "name": "社交成就"}
  ]
}
```

### 10.4 成就状态

```json
{
  "achievement_status": [
    {"code": "locked", "name": "未解锁"},
    {"code": "unlocked", "name": "已解锁"},
    {"code": "claimed", "name": "已领取"}
  ]
}
```

### 10.5 好友请求状态

```json
{
  "friend_request_status": [
    {"code": "pending", "name": "待处理"},
    {"code": "accepted", "name": "已接受"},
    {"code": "rejected", "name": "已拒绝"},
    {"code": "expired", "name": "已过期"}
  ]
}
```

### 10.6 动态类型

```json
{
  "activity_types": [
    {"code": "game_complete", "name": "完成游戏"},
    {"code": "achievement_unlocked", "name": "解锁成就"},
    {"code": "level_up", "name": "等级提升"},
    {"code": "word_bank_complete", "name": "完成词库"},
    {"code": "ranking_achieved", "name": "排名成就"}
  ]
}
```
