# 游戏核心玩法详细设计

## 1. 功能清单

| 功能模块 | 功能点 | 优先级 | 版本 |
|----------|--------|--------|------|
| 泡泡系统 | 泡泡生成与显示 | P0 | v1.0 |
| 泡泡系统 | 泡泡移动动画 | P0 | v1.0 |
| 泡泡系统 | 泡泡爆炸效果 | P0 | v1.0 |
| 泡泡系统 | 难度颜色区分 | P0 | v1.0 |
| 输入系统 | 键盘输入监听 | P0 | v1.0 |
| 输入系统 | 实时输入匹配 | P0 | v1.0 |
| 输入系统 | 输入反馈动画 | P0 | v1.0 |
| 计分系统 | 基础分数计算 | P0 | v1.0 |
| 计分系统 | 时间奖励计算 | P0 | v1.0 |
| 计分系统 | 连击奖励计算 | P0 | v1.0 |
| 计分系统 | 扣分机制 | P0 | v1.0 |
| 连击系统 | 连击计数 | P0 | v1.0 |
| 连击系统 | 连击里程碑 | P1 | v1.5 |
| 计时系统 | 倒计时显示 | P0 | v1.0 |
| 计时系统 | 时间警告 | P0 | v1.0 |
| 结算系统 | 结算界面 | P0 | v1.0 |
| 结算系统 | 评星动画 | P0 | v1.0 |
| 音效系统 | 正确/错误音效 | P0 | v1.0 |
| 音效系统 | 背景音乐 | P1 | v1.5 |
| 暂停系统 | 游戏暂停/继续 | P0 | v1.0 |

---

## 2. 用户故事

### 2.1 游戏开始

#### US-GC-001: 开始游戏
```
作为一个用户
我想要开始一局游戏
以便学习单词

验收标准:
1. 点击开始后显示3秒倒计时
2. 倒计时结束后泡泡开始出现
3. 计时器开始计时（有时限模式）
4. 输入框获得焦点，可以开始输入
5. 显示当前分数、连击数
```

### 2.2 泡泡交互

#### US-GC-002: 输入正确单词
```
作为一个用户
我想要输入正确的单词消除泡泡
以便获得分数

验收标准:
1. 输入字母时显示在输入框
2. 按回车提交答案
3. 匹配成功时泡泡爆炸消失
4. 显示得分动画
5. 播放正确音效
6. 连击数+1
```

#### US-GC-003: 输入错误单词
```
作为一个用户
当我输入错误的单词
我希望得到反馈以便纠正

验收标准:
1. 按回车提交后判断错误
2. 输入框显示错误抖动动画
3. 播放错误音效
4. 连击数归零
5. 根据模式决定是否扣分
6. 显示正确答案提示（可配置）
```

#### US-GC-004: 实时匹配高亮
```
作为一个用户
我想要在输入时看到匹配的泡泡高亮
以便确认我要消除的目标

验收标准:
1. 输入字母时检查是否有匹配的泡泡
2. 匹配的泡泡显示高亮边框
3. 多个匹配时只高亮第一个
4. 输入清空时取消高亮
5. 可在设置中关闭此功能
```

### 2.3 计分与连击

#### US-GC-005: 获得连击奖励
```
作为一个用户
我想要通过连续正确获得额外奖励
以便获得更高分数

验收标准:
1. 连续正确时连击数累加
2. 连击数显示在屏幕上
3. 连击数影响得分倍率
4. 达到里程碑时显示特效
5. 输入错误后连击归零
```

#### US-GC-006: 获得时间奖励
```
作为一个用户
我想要在快速完成时获得时间奖励
以便鼓励我提高速度

验收标准:
1. 在有时限模式下生效
2. 剩余时间越多奖励越高
3. 结算时显示时间奖励明细
```

### 2.4 游戏控制

#### US-GC-007: 暂停游戏
```
作为一个用户
我想要在游戏中暂停
以便处理临时事务

验收标准:
1. 点击暂停按钮或按ESC暂停
2. 显示暂停遮罩
3. 计时器暂停
4. 泡泡停止移动
5. 可以选择继续或退出
```

#### US-GC-008: 退出游戏
```
作为一个用户
我想要中途退出游戏
以便放弃当前局

验收标准:
1. 暂停后可选择退出
2. 确认退出前二次确认
3. 退出后不记录本局成绩
4. 返回关卡选择页面
```

### 2.5 游戏结算

#### US-GC-009: 查看结算结果
```
作为一个用户
我想要在游戏结束后查看详细结果
以便了解我的表现

验收标准:
1. 显示总分和各项明细
2. 显示正确率和用时
3. 显示获得的星级
4. 显示错误的单词列表
5. 可以选择重玩或返回
```

---

## 3. 业务规则

### 3.1 泡泡规则

| 规则编号 | 规则描述 |
|----------|----------|
| BUBBLE-001 | 屏幕同时显示5-10个泡泡 |
| BUBBLE-002 | 新泡泡从屏幕边缘生成 |
| BUBBLE-003 | 泡泡缓慢漂浮移动 |
| BUBBLE-004 | 泡泡不会移出屏幕 |
| BUBBLE-005 | 泡泡大小与难度正相关 |
| BUBBLE-006 | 泡泡颜色与难度对应 |
| BUBBLE-007 | 泡泡之间不会重叠 |

### 3.2 泡泡颜色规则

| 难度 | 颜色 | 色值 | 大小系数 |
|------|------|------|----------|
| 1星 | 绿色 | #4CAF50 | 0.8 |
| 2星 | 蓝色 | #2196F3 | 0.9 |
| 3星 | 黄色 | #FFC107 | 1.0 |
| 4星 | 橙色 | #FF9800 | 1.1 |
| 5星 | 红色 | #F44336 | 1.2 |

### 3.3 输入规则

| 规则编号 | 规则描述 |
|----------|----------|
| INPUT-001 | 只接受英文字母输入 |
| INPUT-002 | 自动转换为小写 |
| INPUT-003 | 回车键提交答案 |
| INPUT-004 | Backspace删除最后一个字符 |
| INPUT-005 | ESC清空输入内容 |
| INPUT-006 | 输入长度最大30字符 |

### 3.4 计分规则

#### 3.4.1 基础得分
```
基础分 = 单词难度基础分值

难度1: 10分
难度2: 20分
难度3: 30分
难度4: 40分
难度5: 50分
```

#### 3.4.2 时间奖励（有时限模式）
```
时间奖励 = 基础分 × (剩余时间比例 × 0.5)

示例：
- 基础分30，剩余时间50%
- 时间奖励 = 30 × (0.5 × 0.5) = 7.5 → 取整 8分
```

#### 3.4.3 连击奖励
```
连击奖励 = 基础分 × (连击数 × 0.1)，最高 ×2

连击奖励上限 = 基础分 × 2

示例：
- 基础分30，连击数5
- 连击奖励 = 30 × (5 × 0.1) = 15分
- 基础分30，连击数25
- 连击奖励 = min(30 × 2.5, 30 × 2) = 60分
```

#### 3.4.4 总分计算
```
单词得分 = 基础分 + 时间奖励 + 连击奖励
关卡总分 = Σ 所有正确单词得分 - 扣分
```

### 3.5 扣分规则

| 模式 | 错误扣分 | 说明 |
|------|----------|------|
| 练习模式 | 0分 | 不扣分，鼓励学习 |
| 挑战模式 | 5分/次 | 适度惩罚 |
| 速度挑战 | 10分/次 | 较高惩罚 |

### 3.6 连击里程碑

| 连击数 | 效果 | 额外奖励 |
|--------|------|----------|
| 5 | 显示"Great!" | 无 |
| 10 | 显示"Excellent!" | 无 |
| 20 | 显示"Amazing!" | 10 EXP |
| 50 | 显示"Incredible!" | 30 EXP |
| 100 | 显示"Legendary!" | 100 EXP |

### 3.7 时间配置

| 模式 | 时间设置 | 每词时间 |
|------|----------|----------|
| 练习模式 | 无限制（可选5分钟） | - |
| 挑战模式 | 单词数×10秒 | 10秒/词 |
| 速度挑战 | 单词数×5秒 | 5秒/词 |

---

## 4. 状态流转图

### 4.1 游戏主状态

```
┌──────────────┐
│   准备中     │ (加载资源)
│  PREPARING   │
└──────────────┘
       │
       │ 资源加载完成
       ▼
┌──────────────┐
│   倒计时     │ (3, 2, 1, GO!)
│  COUNTDOWN   │
└──────────────┘
       │
       │ 倒计时结束
       ▼
┌──────────────┐
│   进行中     │◄──────────────┐
│   PLAYING    │               │
└──────────────┘               │
       │                       │
       ├─── 暂停 ──▶ ┌──────────────┐
       │            │   已暂停     │
       │            │   PAUSED     │ ─── 继续 ───┘
       │            └──────────────┘
       │                   │
       │                   │ 退出
       │                   ▼
       │            ┌──────────────┐
       │            │   已放弃     │
       │            │  ABANDONED   │
       │            └──────────────┘
       │
       │ 全部完成/时间耗尽
       ▼
┌──────────────┐
│   已结束     │
│   FINISHED   │
└──────────────┘
       │
       │ 显示结算
       ▼
┌──────────────┐
│   结算中     │
│  SETTLEMENT  │
└──────────────┘
```

### 4.2 泡泡状态

```
┌──────────────┐
│   等待生成   │
│   PENDING    │
└──────────────┘
       │
       │ 生成
       ▼
┌──────────────┐
│   进入动画   │
│   ENTERING   │
└──────────────┘
       │
       │ 动画完成
       ▼
┌──────────────┐
│   漂浮中     │◄──────────────┐
│   FLOATING   │               │
└──────────────┘               │
       │                       │
       ├─── 输入匹配 ──▶ ┌──────────────┐
       │                │   高亮中     │
       │                │ HIGHLIGHTED  │ ─── 取消匹配 ───┘
       │                └──────────────┘
       │                       │
       │                       │ 确认正确
       │                       ▼
       │                ┌──────────────┐
       │                │   爆炸中     │
       │                │  EXPLODING   │
       │                └──────────────┘
       │                       │
       │                       ▼
       │                ┌──────────────┐
       │                │   已消除     │
       │                │   REMOVED    │
       │                └──────────────┘
       │
       │ 输入错误（该泡泡）
       ▼
┌──────────────┐
│   抖动中     │
│   SHAKING    │
└──────────────┘
       │
       │ 动画完成
       ▼
    返回漂浮
```

### 4.3 输入状态

```
┌──────────────┐
│    空闲      │
│    IDLE      │
└──────────────┘
       │
       │ 开始输入
       ▼
┌──────────────┐
│   输入中     │◄──────────────┐
│   TYPING     │               │
└──────────────┘               │
       │                       │
       ├─── 继续输入 ──────────┘
       │
       ├─── 按回车 ──▶ ┌──────────────┐
       │              │   验证中     │
       │              │  VALIDATING  │
       │              └──────────────┘
       │                     │
       │         ┌───────────┴───────────┐
       │         ▼                       ▼
       │  ┌──────────────┐       ┌──────────────┐
       │  │   正确       │       │   错误       │
       │  │   CORRECT    │       │   WRONG      │
       │  └──────────────┘       └──────────────┘
       │         │                       │
       │         └───────────┬───────────┘
       │                     │
       │                     ▼ 清空输入
       │              ┌──────────────┐
       │              │    空闲      │
       └── 按ESC ────▶│    IDLE      │
                      └──────────────┘
```

---

## 5. 数据模型

### 5.1 游戏会话

```json
{
  "session_id": "gs_001",
  "user_id": "usr_001",
  "section_id": "sec_001",
  "game_mode": "challenge",
  "status": "playing",
  "config": {
    "word_count": 10,
    "time_limit": 100,
    "show_english": false,
    "show_chinese": true,
    "deduct_on_error": true,
    "error_deduction": 5,
    "highlight_matching": true
  },
  "words": [
    {
      "word_id": "word_001",
      "english": "apple",
      "chinese": "苹果",
      "difficulty": 1,
      "base_score": 10,
      "status": "floating",
      "bubble_config": {
        "position": {"x": 200, "y": 150},
        "velocity": {"vx": 0.5, "vy": 0.3},
        "size": 80,
        "color": "#4CAF50"
      }
    }
  ],
  "started_at": "2026-02-27T15:30:00Z",
  "paused_at": null,
  "total_paused_time": 0
}
```

### 5.2 实时游戏状态

```json
{
  "session_id": "gs_001",
  "current_input": "appl",
  "matching_word_id": "word_001",
  "score": {
    "current": 450,
    "base_total": 350,
    "time_bonus_total": 50,
    "combo_bonus_total": 50,
    "deduction_total": 0
  },
  "combo": {
    "current": 5,
    "max": 8
  },
  "progress": {
    "total_words": 10,
    "correct_count": 5,
    "wrong_count": 0,
    "remaining_count": 5
  },
  "time": {
    "limit": 100,
    "elapsed": 35,
    "remaining": 65
  },
  "last_action": {
    "type": "correct",
    "word": "beautiful",
    "score_earned": 95,
    "timestamp": "2026-02-27T15:30:35Z"
  }
}
```

### 5.3 泡泡配置

```json
{
  "bubble_id": "bubble_001",
  "word_id": "word_001",
  "display": {
    "english": "apple",
    "chinese": "苹果",
    "phonetic": "/ˈæp.əl/"
  },
  "style": {
    "size": 80,
    "color": "#4CAF50",
    "border_color": "#388E3C",
    "text_color": "#FFFFFF",
    "highlight_color": "#FFD700"
  },
  "position": {
    "x": 200,
    "y": 150
  },
  "velocity": {
    "vx": 0.5,
    "vy": 0.3
  },
  "status": "floating",
  "spawn_time": "2026-02-27T15:30:00Z"
}
```

### 5.4 单词答题记录

```json
{
  "record_id": "wr_001",
  "session_id": "gs_001",
  "word_id": "word_001",
  "english": "apple",
  "user_input": "apple",
  "is_correct": true,
  "attempt_count": 1,
  "score_earned": 95,
  "score_breakdown": {
    "base": 10,
    "time_bonus": 5,
    "combo_bonus": 80
  },
  "combo_at_answer": 8,
  "time_remaining_at_answer": 65,
  "response_time_ms": 2500,
  "answered_at": "2026-02-27T15:30:35Z"
}
```

### 5.5 游戏结算数据

```json
{
  "settlement_id": "stl_001",
  "session_id": "gs_001",
  "user_id": "usr_001",
  "section_id": "sec_001",
  "game_mode": "challenge",
  "summary": {
    "total_words": 10,
    "correct_count": 9,
    "wrong_count": 1,
    "accuracy": 90,
    "time_used": 65,
    "time_remaining": 35,
    "max_combo": 8
  },
  "score": {
    "base_total": 270,
    "time_bonus_total": 95,
    "combo_bonus_total": 135,
    "deduction_total": 5,
    "final_total": 495
  },
  "stars": {
    "earned": 2,
    "requirements_met": {
      "star_1": true,
      "star_2": true,
      "star_3": false
    }
  },
  "comparison": {
    "previous_best_score": 450,
    "is_new_high_score": true,
    "previous_best_stars": 1,
    "is_new_best_stars": true
  },
  "rewards": {
    "exp_earned": 30,
    "combo_milestone_bonus": 0,
    "first_clear_bonus": 0
  },
  "wrong_words": [
    {
      "word_id": "word_005",
      "english": "beautiful",
      "chinese": "美丽的",
      "user_inputs": ["beautful", "beutiful"],
      "attempt_count": 2
    }
  ],
  "created_at": "2026-02-27T15:31:05Z"
}
```

---

## 6. 接口定义

### 6.1 创建游戏会话

**请求**
```
POST /api/v1/game/sessions
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "section_id": "sec_001",
  "game_mode": "challenge",
  "settings": {
    "highlight_matching": true,
    "show_hint_on_error": false
  }
}
```

**响应成功**
```json
{
  "code": 200,
  "message": "游戏会话已创建",
  "data": {
    "session_id": "gs_001",
    "section": {
      "id": "sec_001",
      "name": "1-1"
    },
    "game_mode": "challenge",
    "config": {
      "word_count": 10,
      "time_limit": 100,
      "display": {
        "show_english": false,
        "show_chinese": true,
        "show_phonetic": false
      },
      "scoring": {
        "deduct_on_error": true,
        "error_deduction": 5
      },
      "settings": {
        "highlight_matching": true,
        "show_hint_on_error": false
      }
    },
    "words": [
      {
        "word_id": "word_001",
        "english": "apple",
        "chinese": "苹果",
        "phonetic": "/ˈæp.əl/",
        "audio_url": "https://cdn.boomword.com/audio/apple.mp3",
        "difficulty": 1,
        "base_score": 10
      }
    ],
    "created_at": "2026-02-27T15:30:00Z"
  }
}
```

### 6.2 开始游戏

**请求**
```
POST /api/v1/game/sessions/{session_id}/start
Authorization: Bearer {access_token}
```

**响应成功**
```json
{
  "code": 200,
  "message": "游戏开始",
  "data": {
    "session_id": "gs_001",
    "status": "playing",
    "started_at": "2026-02-27T15:30:03Z",
    "ends_at": "2026-02-27T15:31:43Z"
  }
}
```

### 6.3 提交单词答案

**请求**
```
POST /api/v1/game/sessions/{session_id}/answer
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "word_id": "word_001",
  "input": "apple",
  "client_timestamp": "2026-02-27T15:30:35Z"
}
```

**响应成功（正确）**
```json
{
  "code": 200,
  "message": "回答正确",
  "data": {
    "is_correct": true,
    "word": {
      "word_id": "word_001",
      "english": "apple"
    },
    "score": {
      "base": 10,
      "time_bonus": 5,
      "combo_bonus": 8,
      "total_earned": 23
    },
    "combo": {
      "current": 9,
      "is_milestone": false
    },
    "progress": {
      "correct_count": 6,
      "remaining_count": 4
    },
    "current_total_score": 473
  }
}
```

**响应成功（错误）**
```json
{
  "code": 200,
  "message": "回答错误",
  "data": {
    "is_correct": false,
    "word": {
      "word_id": "word_005",
      "english": "beautiful",
      "user_input": "beautful"
    },
    "deduction": 5,
    "combo": {
      "previous": 8,
      "current": 0
    },
    "hint": null,
    "current_total_score": 468
  }
}
```

### 6.4 暂停游戏

**请求**
```
POST /api/v1/game/sessions/{session_id}/pause
Authorization: Bearer {access_token}
```

**响应成功**
```json
{
  "code": 200,
  "message": "游戏已暂停",
  "data": {
    "session_id": "gs_001",
    "status": "paused",
    "paused_at": "2026-02-27T15:30:45Z",
    "time_remaining": 58
  }
}
```

### 6.5 继续游戏

**请求**
```
POST /api/v1/game/sessions/{session_id}/resume
Authorization: Bearer {access_token}
```

**响应成功**
```json
{
  "code": 200,
  "message": "游戏继续",
  "data": {
    "session_id": "gs_001",
    "status": "playing",
    "resumed_at": "2026-02-27T15:31:00Z",
    "time_remaining": 58,
    "ends_at": "2026-02-27T15:31:58Z"
  }
}
```

### 6.6 放弃游戏

**请求**
```
POST /api/v1/game/sessions/{session_id}/abandon
Authorization: Bearer {access_token}
```

**响应成功**
```json
{
  "code": 200,
  "message": "游戏已放弃",
  "data": {
    "session_id": "gs_001",
    "status": "abandoned",
    "abandoned_at": "2026-02-27T15:30:50Z",
    "progress_at_abandon": {
      "correct_count": 3,
      "total_words": 10
    }
  }
}
```

### 6.7 完成游戏

**请求**
```
POST /api/v1/game/sessions/{session_id}/complete
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "finished_at": "2026-02-27T15:31:05Z"
}
```

**响应成功**
```json
{
  "code": 200,
  "message": "游戏完成",
  "data": {
    "session_id": "gs_001",
    "status": "finished",
    "settlement": {
      "summary": {
        "total_words": 10,
        "correct_count": 9,
        "wrong_count": 1,
        "accuracy": 90,
        "time_used": 65,
        "time_remaining": 35,
        "max_combo": 8
      },
      "score": {
        "base_total": 270,
        "time_bonus_total": 95,
        "combo_bonus_total": 135,
        "deduction_total": 5,
        "final_total": 495
      },
      "stars": {
        "earned": 2,
        "previous_best": 1,
        "is_new_best": true
      },
      "rewards": {
        "exp_earned": 30,
        "achievements": []
      },
      "unlocks": {
        "next_section": false,
        "challenge_mode": false,
        "speed_mode": true
      },
      "wrong_words": [
        {
          "word_id": "word_005",
          "english": "beautiful",
          "chinese": "美丽的",
          "added_to_wrong_book": true
        }
      ]
    }
  }
}
```

### 6.8 获取游戏状态

**请求**
```
GET /api/v1/game/sessions/{session_id}/state
Authorization: Bearer {access_token}
```

**响应成功**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "session_id": "gs_001",
    "status": "playing",
    "progress": {
      "total_words": 10,
      "correct_count": 5,
      "wrong_count": 1,
      "remaining_count": 4
    },
    "score": {
      "current_total": 468
    },
    "combo": {
      "current": 0,
      "max": 8
    },
    "time": {
      "remaining": 58,
      "elapsed": 42
    },
    "remaining_words": [
      {
        "word_id": "word_006",
        "chinese": "重要的",
        "difficulty": 4
      }
    ]
  }
}
```

---

## 7. 异常处理

### 7.1 错误码定义

| 错误码 | 错误标识 | 说明 | HTTP状态码 |
|--------|----------|------|------------|
| 40001 | SESSION_NOT_FOUND | 游戏会话不存在 | 404 |
| 40002 | SESSION_EXPIRED | 游戏会话已过期 | 400 |
| 40003 | SESSION_ALREADY_STARTED | 游戏已开始 | 400 |
| 40004 | SESSION_NOT_STARTED | 游戏未开始 | 400 |
| 40005 | SESSION_ALREADY_FINISHED | 游戏已结束 | 400 |
| 40006 | SESSION_PAUSED | 游戏已暂停 | 400 |
| 40007 | SESSION_NOT_PAUSED | 游戏未暂停 | 400 |
| 40008 | WORD_NOT_IN_SESSION | 单词不在本局游戏中 | 400 |
| 40009 | WORD_ALREADY_ANSWERED | 单词已回答 | 400 |
| 40010 | TIME_EXCEEDED | 游戏时间已耗尽 | 400 |
| 40011 | INVALID_INPUT | 无效的输入 | 400 |
| 40012 | CONCURRENT_SESSION | 已有进行中的游戏 | 409 |

### 7.2 异常响应格式

```json
{
  "code": 40005,
  "message": "游戏已结束",
  "error": "SESSION_ALREADY_FINISHED",
  "details": {
    "session_id": "gs_001",
    "finished_at": "2026-02-27T15:31:05Z"
  },
  "timestamp": "2026-02-27T15:32:00Z",
  "request_id": "req_abc123"
}
```

---

## 8. 边界条件

### 8.1 游戏进行边界

| 场景 | 处理方式 |
|------|----------|
| 网络断开 | 本地继续游戏，恢复后同步结果 |
| 页面刷新 | 尝试恢复游戏会话，超时则作废 |
| 切换标签页 | 自动暂停游戏 |
| 浏览器关闭 | 游戏作废，不记录成绩 |
| 设备休眠 | 自动暂停，唤醒后可继续 |

### 8.2 输入边界

| 场景 | 处理方式 |
|------|----------|
| 输入空字符串 | 不处理 |
| 输入非英文字符 | 过滤忽略 |
| 输入超长字符串 | 截断至30字符 |
| 快速连续回车 | 防抖处理，200ms内忽略重复 |
| 同时匹配多个单词 | 匹配最早出现的泡泡 |

### 8.3 计分边界

| 场景 | 处理方式 |
|------|----------|
| 分数溢出 | 使用BigInt处理 |
| 连击数溢出 | 上限9999 |
| 负分 | 最低为0分 |
| 时间奖励为负 | 时间耗尽时为0 |

### 8.4 时间边界

| 场景 | 处理方式 |
|------|----------|
| 最后1秒提交答案 | 以服务端时间为准 |
| 客户端时间不准 | 使用服务端时间校验 |
| 暂停时间过长（>30分钟） | 游戏作废 |
| 暂停次数过多（>10次） | 不允许再次暂停 |

---

## 9. 安全要求

### 9.1 防作弊措施

| 安全项 | 实现方式 |
|--------|----------|
| 时间校验 | 服务端记录开始时间，校验总用时 |
| 答案校验 | 服务端验证每个答案 |
| 分数校验 | 服务端重新计算分数 |
| 会话校验 | 一次性session_id，不可重用 |
| 请求签名 | 关键请求添加签名 |
| 频率限制 | 每秒最多10次答题请求 |

### 9.2 数据完整性

| 安全项 | 实现方式 |
|--------|----------|
| 结果签名 | 游戏结果添加签名防篡改 |
| 时序校验 | 答题时间必须递增 |
| 异常检测 | 检测异常高分/速度 |

---

## 10. 性能要求

### 10.1 接口性能

| 接口 | 响应时间要求 | 并发要求 |
|------|--------------|----------|
| 创建会话 | < 300ms | 100/s |
| 开始游戏 | < 100ms | 200/s |
| 提交答案 | < 100ms | 500/s |
| 暂停/继续 | < 100ms | 100/s |
| 完成游戏 | < 500ms | 200/s |

### 10.2 前端性能

| 指标 | 要求 |
|------|------|
| 游戏帧率 | ≥ 60 FPS |
| 泡泡动画 | 流畅无卡顿 |
| 输入延迟 | < 50ms |
| 音效延迟 | < 100ms |
| 资源加载 | 游戏开始前完成 |

### 10.3 资源预加载

| 资源类型 | 预加载时机 |
|----------|------------|
| 单词音频 | 创建会话时 |
| 音效文件 | 应用启动时 |
| 泡泡贴图 | 应用启动时 |
| 动画资源 | 应用启动时 |

---

## 11. 配置项

### 11.1 游戏配置

```json
{
  "game_config": {
    "countdown_seconds": 3,
    "max_bubbles_on_screen": 10,
    "min_bubbles_on_screen": 5,
    "bubble_spawn_interval_ms": 2000,
    "bubble_base_speed": 0.5,
    "bubble_speed_variation": 0.3,
    "input_debounce_ms": 200,
    "max_pause_count": 10,
    "max_pause_duration_minutes": 30,
    "session_expire_minutes": 60
  }
}
```

### 11.2 计分配置

```json
{
  "scoring_config": {
    "base_scores": {
      "difficulty_1": 10,
      "difficulty_2": 20,
      "difficulty_3": 30,
      "difficulty_4": 40,
      "difficulty_5": 50
    },
    "time_bonus_factor": 0.5,
    "combo_bonus_factor": 0.1,
    "combo_bonus_max_multiplier": 2,
    "error_deductions": {
      "practice": 0,
      "challenge": 5,
      "speed": 10
    }
  }
}
```

### 11.3 泡泡样式配置

```json
{
  "bubble_style_config": {
    "difficulty_colors": {
      "1": {"fill": "#4CAF50", "border": "#388E3C"},
      "2": {"fill": "#2196F3", "border": "#1976D2"},
      "3": {"fill": "#FFC107", "border": "#FFA000"},
      "4": {"fill": "#FF9800", "border": "#F57C00"},
      "5": {"fill": "#F44336", "border": "#D32F2F"}
    },
    "size_factors": {
      "1": 0.8,
      "2": 0.9,
      "3": 1.0,
      "4": 1.1,
      "5": 1.2
    },
    "base_size": 80,
    "highlight_color": "#FFD700",
    "text_color": "#FFFFFF"
  }
}
```

### 11.4 音效配置

```json
{
  "audio_config": {
    "sound_effects": {
      "correct": "/audio/sfx/correct.mp3",
      "wrong": "/audio/sfx/wrong.mp3",
      "combo_5": "/audio/sfx/combo_5.mp3",
      "combo_10": "/audio/sfx/combo_10.mp3",
      "combo_20": "/audio/sfx/combo_20.mp3",
      "combo_50": "/audio/sfx/combo_50.mp3",
      "time_warning": "/audio/sfx/time_warning.mp3",
      "game_complete": "/audio/sfx/complete.mp3",
      "star_1": "/audio/sfx/star_1.mp3",
      "star_2": "/audio/sfx/star_2.mp3",
      "star_3": "/audio/sfx/star_3.mp3"
    },
    "volume": {
      "sfx": 0.7,
      "bgm": 0.5,
      "voice": 0.8
    }
  }
}
```
