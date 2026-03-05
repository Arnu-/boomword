# 关卡系统详细设计

## 1. 功能清单

| 功能模块 | 功能点 | 优先级 | 版本 |
|----------|--------|--------|------|
| 关卡结构 | 章节-小节层级展示 | P0 | v1.0 |
| 关卡浏览 | 选关界面展示 | P0 | v1.0 |
| 关卡详情 | 关卡详情弹窗 | P0 | v1.0 |
| 解锁机制 | 小节解锁逻辑 | P0 | v1.0 |
| 解锁机制 | 章节解锁逻辑 | P0 | v1.0 |
| 解锁机制 | 模式解锁逻辑 | P0 | v1.0 |
| 评星系统 | 练习模式评星 | P0 | v1.0 |
| 评星系统 | 挑战模式评星 | P0 | v1.0 |
| 评星系统 | 速度挑战评星 | P1 | v1.5 |
| 进度显示 | 词库整体进度 | P0 | v1.0 |
| 进度显示 | 章节完成进度 | P0 | v1.0 |

---

## 2. 用户故事

### 2.1 关卡浏览

#### US-LV-001: 查看选关界面
```
作为一个用户
我想要查看词库的所有关卡
以便选择我要学习的内容

验收标准:
1. 显示词库整体学习进度条
2. 显示所有章节和小节
3. 已完成小节显示星级
4. 未解锁小节显示锁定状态
5. 当前可学习小节高亮显示
```

#### US-LV-002: 查看关卡详情
```
作为一个用户
我想要查看某个小节的详细信息
以便了解该小节的难度和我的历史成绩

验收标准:
1. 显示小节名称和所属章节
2. 显示单词数量
3. 显示建议完成时间
4. 显示历史最高分和最佳星级
5. 显示各模式的完成情况
6. 显示可选的游戏模式按钮
```

### 2.2 关卡解锁

#### US-LV-003: 解锁下一小节
```
作为一个用户
我想要通过完成当前小节解锁下一小节
以便继续学习

验收标准:
1. 完成当前小节（任意星级）后解锁下一小节
2. 显示解锁动画
3. 显示新解锁的小节
4. 可以立即进入新小节
```

#### US-LV-004: 解锁挑战模式
```
作为一个用户
我想要解锁小节的挑战模式
以便测试我的学习成果

验收标准:
1. 练习模式1星以上通关后解锁
2. 挑战模式按钮变为可点击
3. 显示解锁提示信息
```

#### US-LV-005: 解锁速度挑战
```
作为一个用户
我想要解锁小节的速度挑战模式
以便挑战更高难度

验收标准:
1. 挑战模式2星以上通关后解锁
2. 速度挑战按钮变为可点击
3. 显示解锁提示信息
```

### 2.3 评星系统

#### US-LV-006: 获得关卡评星
```
作为一个用户
我想要在完成关卡后获得星级评价
以便了解我的学习效果

验收标准:
1. 根据正确率和时间计算星级
2. 显示星级获得动画
3. 保存最佳星级记录
4. 首次获得3星有额外奖励
```

---

## 3. 业务规则

### 3.1 关卡结构规则

| 规则编号 | 规则描述 |
|----------|----------|
| LV-001 | 每个词库包含多个章节（Chapter） |
| LV-002 | 每个章节包含3个小节（Section） |
| LV-003 | 每个小节包含10个单词 |
| LV-004 | 章节按顺序排列，编号从1开始 |
| LV-005 | 小节按"章节号-序号"命名，如1-1, 1-2 |

### 3.2 解锁规则

| 规则编号 | 规则描述 |
|----------|----------|
| UNLOCK-001 | 第一关第一节 (1-1) 默认解锁 |
| UNLOCK-002 | 完成当前小节（任意星级）解锁下一小节 |
| UNLOCK-003 | 完成章节所有小节解锁下一章节 |
| UNLOCK-004 | 练习模式1星以上解锁挑战模式 |
| UNLOCK-005 | 挑战模式2星以上解锁速度挑战 |
| UNLOCK-006 | 切换词库时解锁状态独立计算 |

### 3.3 评星规则 - 练习模式

| 星级 | 正确率要求 | 时间要求 |
|------|------------|----------|
| 1星 | ≥ 60% | 无 |
| 2星 | ≥ 80% | 无 |
| 3星 | = 100% | 无 |

### 3.4 评星规则 - 挑战模式

| 星级 | 正确率要求 | 时间要求 |
|------|------------|----------|
| 1星 | ≥ 60% | 剩余时间 > 0 |
| 2星 | ≥ 80% | 剩余时间 ≥ 30% |
| 3星 | = 100% | 剩余时间 ≥ 50% |

### 3.5 评星规则 - 速度挑战

| 星级 | 正确率要求 | 时间要求 |
|------|------------|----------|
| 1星 | ≥ 70% | 剩余时间 > 0 |
| 2星 | ≥ 85% | 剩余时间 ≥ 20% |
| 3星 | = 100% | 剩余时间 ≥ 30% |

### 3.6 时间配置规则

| 模式 | 时间计算 | 示例（10词） |
|------|----------|--------------|
| 练习模式 | 无限制 / 可选5分钟 | 无限 / 300秒 |
| 挑战模式 | 每词10秒 | 100秒 |
| 速度挑战 | 每词5秒 | 50秒 |

### 3.7 进度计算规则

| 规则编号 | 规则描述 |
|----------|----------|
| PROG-001 | 章节完成 = 所有小节至少1星通关 |
| PROG-002 | 词库进度 = 已完成小节数 / 总小节数 × 100% |
| PROG-003 | 总星数 = 所有小节可获得星数之和（每小节3颗星） |
| PROG-004 | 只记录最高星级，不累加 |

---

## 4. 状态流转图

### 4.1 小节解锁状态

```
┌──────────────┐
│    锁定      │ (默认状态，除1-1外)
│   🔒 LOCKED  │
└──────────────┘
       │
       │ 前置小节完成
       ▼
┌──────────────┐
│   已解锁     │
│  🔓 UNLOCKED │
└──────────────┘
       │
       │ 首次通关
       ▼
┌──────────────┐
│   已完成     │ (至少1星)
│  ✅ COMPLETED│
└──────────────┘
       │
       │ 继续挑战获得更高星级
       ▼
┌──────────────┐
│   已精通     │ (3星)
│  ⭐ MASTERED │
└──────────────┘
```

### 4.2 游戏模式解锁状态

```
练习模式解锁状态:
┌──────────────┐
│   默认解锁   │ ─────────────────────────────┐
│   (小节解锁) │                              │
└──────────────┘                              │
                                              ▼
                                    ┌──────────────┐
                                    │   可游玩     │
                                    └──────────────┘

挑战模式解锁状态:
┌──────────────┐     练习1星+     ┌──────────────┐
│    锁定      │ ───────────────▶│   已解锁     │
└──────────────┘                 └──────────────┘

速度挑战解锁状态:
┌──────────────┐     挑战2星+     ┌──────────────┐
│    锁定      │ ───────────────▶│   已解锁     │
└──────────────┘                 └──────────────┘
```

### 4.3 章节状态流转

```
┌──────────────┐
│    锁定      │
│   (第2章起)  │
└──────────────┘
       │
       │ 前一章节所有小节完成
       ▼
┌──────────────┐
│   已解锁     │
│ (可开始学习) │
└──────────────┘
       │
       │ 部分小节完成
       ▼
┌──────────────┐
│   进行中     │
│ (显示完成度) │
└──────────────┘
       │
       │ 所有小节至少1星
       ▼
┌──────────────┐
│   已完成     │
└──────────────┘
       │
       │ 所有小节全3星
       ▼
┌──────────────┐
│   全星完成   │
│   ⭐⭐⭐     │
└──────────────┘
```

---

## 5. 数据模型

### 5.1 章节信息

```json
{
  "id": "chap_001",
  "word_bank_id": "wb_001",
  "name": "Unit 1 Hello",
  "description": "打招呼和自我介绍相关词汇",
  "chapter_number": 1,
  "word_count": 30,
  "section_count": 3,
  "sort_order": 1,
  "is_active": true,
  "created_at": "2026-02-27T10:00:00Z",
  "updated_at": "2026-02-27T10:00:00Z"
}
```

### 5.2 小节信息

```json
{
  "id": "sec_001",
  "chapter_id": "chap_001",
  "word_bank_id": "wb_001",
  "name": "1-1",
  "description": "第一组词汇：基础问候语",
  "section_number": 1,
  "word_count": 10,
  "sort_order": 1,
  "practice_time_limit": null,
  "challenge_time_limit": 100,
  "speed_time_limit": 50,
  "is_active": true,
  "created_at": "2026-02-27T10:00:00Z",
  "updated_at": "2026-02-27T10:00:00Z"
}
```

### 5.3 用户小节进度

```json
{
  "id": "usec_001",
  "user_id": "usr_001",
  "section_id": "sec_001",
  "word_bank_id": "wb_001",
  "unlock_status": "unlocked",
  "practice_mode": {
    "is_unlocked": true,
    "best_stars": 3,
    "best_score": 1000,
    "best_accuracy": 100,
    "best_time_used": 85,
    "play_count": 5,
    "first_completed_at": "2026-02-27T10:30:00Z",
    "last_played_at": "2026-02-27T15:30:00Z"
  },
  "challenge_mode": {
    "is_unlocked": true,
    "best_stars": 2,
    "best_score": 850,
    "best_accuracy": 90,
    "best_time_remaining": 35,
    "play_count": 3,
    "first_completed_at": "2026-02-27T11:00:00Z",
    "last_played_at": "2026-02-27T16:00:00Z"
  },
  "speed_mode": {
    "is_unlocked": false,
    "best_stars": 0,
    "best_score": 0,
    "best_accuracy": 0,
    "best_time_remaining": 0,
    "play_count": 0,
    "first_completed_at": null,
    "last_played_at": null
  },
  "created_at": "2026-02-27T10:00:00Z",
  "updated_at": "2026-02-27T16:00:00Z"
}
```

### 5.4 用户章节进度

```json
{
  "id": "uchap_001",
  "user_id": "usr_001",
  "chapter_id": "chap_001",
  "word_bank_id": "wb_001",
  "unlock_status": "unlocked",
  "total_sections": 3,
  "completed_sections": 2,
  "total_stars": 9,
  "earned_stars": 5,
  "is_completed": false,
  "is_all_stars": false,
  "first_completed_at": null,
  "created_at": "2026-02-27T10:00:00Z",
  "updated_at": "2026-02-27T16:00:00Z"
}
```

### 5.5 游戏记录

```json
{
  "id": "game_001",
  "user_id": "usr_001",
  "section_id": "sec_001",
  "word_bank_id": "wb_001",
  "game_mode": "challenge",
  "total_words": 10,
  "correct_count": 9,
  "wrong_count": 1,
  "accuracy": 90,
  "score": 850,
  "stars_earned": 2,
  "time_limit": 100,
  "time_used": 65,
  "time_remaining": 35,
  "max_combo": 6,
  "word_details": [
    {
      "word_id": "word_001",
      "english": "apple",
      "is_correct": true,
      "input": "apple",
      "response_time_ms": 2500,
      "score_earned": 95
    },
    {
      "word_id": "word_002",
      "english": "beautiful",
      "is_correct": false,
      "input": "beautful",
      "response_time_ms": 4500,
      "score_earned": 0
    }
  ],
  "started_at": "2026-02-27T15:30:00Z",
  "finished_at": "2026-02-27T15:31:05Z",
  "created_at": "2026-02-27T15:31:05Z"
}
```

---

## 6. 接口定义

### 6.1 获取词库关卡列表

**请求**
```
GET /api/v1/word-banks/{word_bank_id}/chapters
Authorization: Bearer {access_token}
```

**响应成功**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "word_bank": {
      "id": "wb_001",
      "name": "人教版三年级上册",
      "total_words": 120,
      "learned_words": 45,
      "progress_percent": 37.5
    },
    "chapters": [
      {
        "id": "chap_001",
        "name": "Unit 1 Hello",
        "chapter_number": 1,
        "word_count": 30,
        "unlock_status": "unlocked",
        "completed_sections": 2,
        "total_sections": 3,
        "earned_stars": 5,
        "total_stars": 9,
        "is_completed": false,
        "sections": [
          {
            "id": "sec_001",
            "name": "1-1",
            "word_count": 10,
            "unlock_status": "unlocked",
            "practice_stars": 3,
            "challenge_stars": 2,
            "speed_stars": 0,
            "best_score": 850,
            "is_challenge_unlocked": true,
            "is_speed_unlocked": false
          },
          {
            "id": "sec_002",
            "name": "1-2",
            "word_count": 10,
            "unlock_status": "unlocked",
            "practice_stars": 2,
            "challenge_stars": 0,
            "speed_stars": 0,
            "best_score": 720,
            "is_challenge_unlocked": true,
            "is_speed_unlocked": false
          },
          {
            "id": "sec_003",
            "name": "1-3",
            "word_count": 10,
            "unlock_status": "locked",
            "practice_stars": 0,
            "challenge_stars": 0,
            "speed_stars": 0,
            "best_score": 0,
            "is_challenge_unlocked": false,
            "is_speed_unlocked": false
          }
        ]
      },
      {
        "id": "chap_002",
        "name": "Unit 2 Colors",
        "chapter_number": 2,
        "word_count": 30,
        "unlock_status": "locked",
        "completed_sections": 0,
        "total_sections": 3,
        "earned_stars": 0,
        "total_stars": 9,
        "is_completed": false,
        "sections": []
      }
    ],
    "overall_progress": {
      "total_chapters": 4,
      "completed_chapters": 0,
      "total_sections": 12,
      "completed_sections": 2,
      "total_stars": 36,
      "earned_stars": 5
    }
  }
}
```

### 6.2 获取小节详情

**请求**
```
GET /api/v1/sections/{section_id}
Authorization: Bearer {access_token}
```

**响应成功**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": "sec_001",
    "name": "1-1",
    "chapter": {
      "id": "chap_001",
      "name": "Unit 1 Hello"
    },
    "word_bank": {
      "id": "wb_001",
      "name": "人教版三年级上册"
    },
    "word_count": 10,
    "description": "第一组词汇：基础问候语",
    "unlock_status": "unlocked",
    "modes": {
      "practice": {
        "is_unlocked": true,
        "time_limit": null,
        "time_limit_optional": 300,
        "best_stars": 3,
        "best_score": 1000,
        "best_accuracy": 100,
        "play_count": 5
      },
      "challenge": {
        "is_unlocked": true,
        "time_limit": 100,
        "best_stars": 2,
        "best_score": 850,
        "best_accuracy": 90,
        "best_time_remaining": 35,
        "play_count": 3,
        "unlock_requirement": "练习模式1星以上"
      },
      "speed": {
        "is_unlocked": false,
        "time_limit": 50,
        "best_stars": 0,
        "best_score": 0,
        "best_accuracy": 0,
        "best_time_remaining": 0,
        "play_count": 0,
        "unlock_requirement": "挑战模式2星以上"
      }
    },
    "word_preview": [
      {"english": "hello", "chinese": "你好"},
      {"english": "hi", "chinese": "嗨"},
      {"english": "goodbye", "chinese": "再见"}
    ],
    "history": {
      "total_play_count": 8,
      "first_played_at": "2026-02-27T10:00:00Z",
      "last_played_at": "2026-02-27T16:00:00Z"
    }
  }
}
```

### 6.3 开始游戏

**请求**
```
POST /api/v1/sections/{section_id}/start
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "game_mode": "challenge"
}
```

**参数说明**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| game_mode | string | 是 | practice/challenge/speed |

**响应成功**
```json
{
  "code": 200,
  "message": "游戏开始",
  "data": {
    "game_session_id": "gs_001",
    "section": {
      "id": "sec_001",
      "name": "1-1"
    },
    "game_mode": "challenge",
    "time_limit": 100,
    "word_count": 10,
    "words": [
      {
        "id": "word_001",
        "english": "hello",
        "chinese": "你好",
        "phonetic": "/həˈləʊ/",
        "audio_url": "https://cdn.boomword.com/audio/hello.mp3",
        "difficulty": 1,
        "base_score": 10
      },
      {
        "id": "word_002",
        "english": "goodbye",
        "chinese": "再见",
        "phonetic": "/ˌɡʊdˈbaɪ/",
        "audio_url": "https://cdn.boomword.com/audio/goodbye.mp3",
        "difficulty": 2,
        "base_score": 20
      }
    ],
    "display_config": {
      "show_english": false,
      "show_chinese": true,
      "show_phonetic": false
    },
    "started_at": "2026-02-27T15:30:00Z"
  }
}
```

### 6.4 提交游戏结果

**请求**
```
POST /api/v1/sections/{section_id}/submit
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "game_session_id": "gs_001",
  "game_mode": "challenge",
  "results": [
    {
      "word_id": "word_001",
      "input": "hello",
      "is_correct": true,
      "response_time_ms": 2500
    },
    {
      "word_id": "word_002",
      "input": "goodby",
      "is_correct": false,
      "response_time_ms": 4500
    }
  ],
  "time_used": 65,
  "max_combo": 6,
  "finished_at": "2026-02-27T15:31:05Z"
}
```

**响应成功**
```json
{
  "code": 200,
  "message": "游戏结束",
  "data": {
    "game_record_id": "game_001",
    "summary": {
      "total_words": 10,
      "correct_count": 9,
      "wrong_count": 1,
      "accuracy": 90,
      "time_used": 65,
      "time_remaining": 35,
      "max_combo": 6
    },
    "score": {
      "base_score": 180,
      "time_bonus": 63,
      "combo_bonus": 54,
      "total_score": 297,
      "best_score": 850,
      "is_new_best": false
    },
    "stars": {
      "earned": 2,
      "previous_best": 2,
      "is_new_best": false,
      "requirements": {
        "star_1": {"accuracy": 60, "achieved": true},
        "star_2": {"accuracy": 80, "time_remaining_percent": 30, "achieved": true},
        "star_3": {"accuracy": 100, "time_remaining_percent": 50, "achieved": false}
      }
    },
    "rewards": {
      "exp_earned": 10,
      "achievements_unlocked": []
    },
    "unlock_progress": {
      "next_section_unlocked": false,
      "challenge_mode_unlocked": false,
      "speed_mode_unlocked": false
    },
    "wrong_words": [
      {
        "word_id": "word_002",
        "english": "goodbye",
        "chinese": "再见",
        "user_input": "goodby",
        "added_to_wrong_book": true
      }
    ]
  }
}
```

### 6.5 获取游戏历史记录

**请求**
```
GET /api/v1/sections/{section_id}/history
Authorization: Bearer {access_token}

Query Parameters:
- game_mode: string (可选) - practice/challenge/speed
- page: number (可选) - 页码，默认1
- page_size: number (可选) - 每页数量，默认10
```

**响应成功**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "records": [
      {
        "id": "game_001",
        "game_mode": "challenge",
        "score": 850,
        "stars": 2,
        "accuracy": 90,
        "time_used": 65,
        "max_combo": 6,
        "played_at": "2026-02-27T15:31:05Z"
      },
      {
        "id": "game_002",
        "game_mode": "practice",
        "score": 1000,
        "stars": 3,
        "accuracy": 100,
        "time_used": 120,
        "max_combo": 10,
        "played_at": "2026-02-27T10:30:00Z"
      }
    ],
    "statistics": {
      "total_plays": 8,
      "best_score": 850,
      "best_stars": 3,
      "avg_accuracy": 92,
      "avg_time_used": 85
    },
    "pagination": {
      "page": 1,
      "page_size": 10,
      "total": 8,
      "total_pages": 1
    }
  }
}
```

### 6.6 重置小节进度

**请求**
```
POST /api/v1/sections/{section_id}/reset
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "game_mode": "all"
}
```

**参数说明**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| game_mode | string | 是 | practice/challenge/speed/all |

**响应成功**
```json
{
  "code": 200,
  "message": "进度已重置",
  "data": {
    "section_id": "sec_001",
    "reset_mode": "all",
    "previous_progress": {
      "practice_stars": 3,
      "challenge_stars": 2,
      "speed_stars": 0
    },
    "current_progress": {
      "practice_stars": 0,
      "challenge_stars": 0,
      "speed_stars": 0
    }
  }
}
```

### 6.7 检查解锁状态

**请求**
```
GET /api/v1/sections/{section_id}/unlock-status
Authorization: Bearer {access_token}
```

**响应成功**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "section_id": "sec_001",
    "section_unlock": {
      "is_unlocked": true,
      "unlocked_at": "2026-02-27T10:00:00Z"
    },
    "modes": {
      "practice": {
        "is_unlocked": true,
        "requirement": "小节解锁后自动解锁",
        "current_status": "已完成"
      },
      "challenge": {
        "is_unlocked": true,
        "requirement": "练习模式获得1星以上",
        "current_status": "练习模式已获得3星",
        "unlocked_at": "2026-02-27T10:30:00Z"
      },
      "speed": {
        "is_unlocked": false,
        "requirement": "挑战模式获得2星以上",
        "current_status": "挑战模式当前2星",
        "progress": {
          "current_stars": 2,
          "required_stars": 2,
          "can_unlock": true
        }
      }
    },
    "next_section": {
      "id": "sec_002",
      "name": "1-2",
      "is_unlocked": true,
      "requirement": "完成当前小节"
    }
  }
}
```

---

## 7. 异常处理

### 7.1 错误码定义

| 错误码 | 错误标识 | 说明 | HTTP状态码 |
|--------|----------|------|------------|
| 30001 | SECTION_NOT_FOUND | 小节不存在 | 404 |
| 30002 | CHAPTER_NOT_FOUND | 章节不存在 | 404 |
| 30003 | SECTION_LOCKED | 小节未解锁 | 403 |
| 30004 | MODE_LOCKED | 游戏模式未解锁 | 403 |
| 30005 | GAME_SESSION_EXPIRED | 游戏会话已过期 | 400 |
| 30006 | GAME_SESSION_INVALID | 游戏会话无效 | 400 |
| 30007 | INVALID_GAME_MODE | 无效的游戏模式 | 400 |
| 30008 | RESULT_ALREADY_SUBMITTED | 结果已提交 | 400 |
| 30009 | WORD_COUNT_MISMATCH | 单词数量不匹配 | 400 |
| 30010 | TIME_EXCEEDED | 超出时间限制 | 400 |

### 7.2 异常响应格式

```json
{
  "code": 30003,
  "message": "小节未解锁",
  "error": "SECTION_LOCKED",
  "details": {
    "section_id": "sec_003",
    "required": "完成 1-2 小节",
    "current_progress": "1-2 未完成"
  },
  "timestamp": "2026-02-27T10:00:00Z",
  "request_id": "req_abc123"
}
```

---

## 8. 边界条件

### 8.1 解锁边界

| 场景 | 处理方式 |
|------|----------|
| 同时完成多个解锁条件 | 按优先级依次触发解锁动画 |
| 词库新增章节 | 按原有逻辑判断是否解锁 |
| 词库删除章节 | 已完成记录保留，进度重算 |
| 小节单词数量变化 | 重新计算星级要求 |

### 8.2 游戏边界

| 场景 | 处理方式 |
|------|----------|
| 游戏中网络中断 | 本地缓存答题记录，恢复后继续 |
| 游戏中退出应用 | 保存当前进度，可恢复继续 |
| 提交结果时网络失败 | 本地缓存，自动重试3次 |
| 重复提交游戏结果 | 幂等处理，返回首次提交结果 |
| 时间作弊（本地修改时间） | 服务端校验时间戳 |

### 8.3 进度边界

| 场景 | 处理方式 |
|------|----------|
| 重置进度后重新完成 | 可再次获得首次通关奖励 |
| 多设备同时游戏 | 以最后提交的结果为准 |
| 星级降低 | 不可能，只保留最高记录 |
| 切换词库 | 各词库进度独立 |

### 8.4 评星边界

| 场景 | 处理方式 |
|------|----------|
| 正好达到临界值 | 获得对应星级 |
| 全部单词超时 | 按完成的单词计算星级 |
| 主动放弃游戏 | 不记录本次成绩 |
| 练习模式开启限时后超时 | 按已完成内容计算 |

---

## 9. 安全要求

### 9.1 防作弊措施

| 安全项 | 实现方式 |
|--------|----------|
| 时间校验 | 服务端记录开始时间，校验总用时 |
| 答案校验 | 服务端验证答案，不信任客户端结果 |
| 连击校验 | 服务端计算连击数 |
| 分数校验 | 服务端计算最终分数 |
| 会话校验 | 使用一次性 game_session_id |

### 9.2 数据完整性

| 安全项 | 实现方式 |
|--------|----------|
| 游戏记录签名 | 关键数据签名防篡改 |
| 排行榜校验 | 异常分数人工审核 |
| 进度同步 | 服务端为准，客户端缓存 |

---

## 10. 性能要求

| 接口 | 响应时间要求 | 并发要求 |
|------|--------------|----------|
| 获取关卡列表 | < 200ms | 300/s |
| 获取小节详情 | < 150ms | 300/s |
| 开始游戏 | < 300ms | 200/s |
| 提交结果 | < 500ms | 200/s |
| 获取历史记录 | < 200ms | 100/s |

### 10.1 游戏体验要求

| 指标 | 要求 |
|------|------|
| 单词加载 | 游戏开始前全部加载完成 |
| 音频预加载 | 提前加载所有单词音频 |
| 结果计算 | 客户端实时计算，服务端校验 |
| 动画帧率 | ≥ 60 FPS |

---

## 11. 枚举定义

### 11.1 解锁状态

```json
{
  "unlock_status": [
    {"code": "locked", "name": "锁定"},
    {"code": "unlocked", "name": "已解锁"},
    {"code": "completed", "name": "已完成"},
    {"code": "mastered", "name": "已精通"}
  ]
}
```

### 11.2 游戏模式

```json
{
  "game_modes": [
    {
      "code": "practice",
      "name": "练习模式",
      "description": "同时显示英文和中文，无时间限制",
      "display": {"english": true, "chinese": true, "phonetic": false}
    },
    {
      "code": "challenge",
      "name": "挑战模式",
      "description": "仅显示中文，有时间限制",
      "display": {"english": false, "chinese": true, "phonetic": false}
    },
    {
      "code": "speed",
      "name": "速度挑战",
      "description": "仅显示英文，快速输入",
      "display": {"english": true, "chinese": false, "phonetic": false}
    }
  ]
}
```

### 11.3 星级要求配置

```json
{
  "star_requirements": {
    "practice": {
      "star_1": {"accuracy_min": 60},
      "star_2": {"accuracy_min": 80},
      "star_3": {"accuracy_min": 100}
    },
    "challenge": {
      "star_1": {"accuracy_min": 60, "time_remaining_percent": 0},
      "star_2": {"accuracy_min": 80, "time_remaining_percent": 30},
      "star_3": {"accuracy_min": 100, "time_remaining_percent": 50}
    },
    "speed": {
      "star_1": {"accuracy_min": 70, "time_remaining_percent": 0},
      "star_2": {"accuracy_min": 85, "time_remaining_percent": 20},
      "star_3": {"accuracy_min": 100, "time_remaining_percent": 30}
    }
  }
}
```
