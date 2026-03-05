# 学习统计与错词本详细设计

## 1. 功能清单

| 功能模块 | 功能点 | 优先级 | 版本 |
|----------|--------|--------|------|
| 学习总览 | 累计学习数据展示 | P0 | v1.0 |
| 学习总览 | 连续学习天数 | P0 | v1.0 |
| 学习曲线 | 每日学习曲线图 | P0 | v1.0 |
| 学习曲线 | 每周学习热力图 | P1 | v1.5 |
| 掌握度统计 | 单词掌握度分布 | P0 | v1.0 |
| 掌握度统计 | 词库学习进度 | P0 | v1.0 |
| 错词本 | 自动收录错词 | P0 | v1.0 |
| 错词本 | 手动添加错词 | P0 | v1.0 |
| 错词本 | 错词列表查看 | P0 | v1.0 |
| 错词本 | 错词详情查看 | P0 | v1.0 |
| 错词本 | 移除错词 | P0 | v1.0 |
| 错词练习 | 错词专项练习 | P0 | v1.0 |
| 复习提醒 | 智能复习提醒 | P2 | v2.0 |
| 数据导出 | 学习报告导出 | P2 | v2.0 |

---

## 2. 用户故事

### 2.1 学习统计

#### US-LS-001: 查看学习总览
```
作为一个用户
我想要查看我的学习总览数据
以便了解我的整体学习情况

验收标准:
1. 显示累计学习天数
2. 显示累计学习时长
3. 显示累计学习单词数
4. 显示整体正确率
5. 显示当前连续学习天数
```

#### US-LS-002: 查看学习曲线
```
作为一个用户
我想要查看每日学习曲线
以便了解我的学习趋势

验收标准:
1. 显示最近7天/30天学习数据
2. 可切换查看学习时长/单词数/正确率
3. 图表支持点击查看详情
4. 显示与上一周期对比
```

#### US-LS-003: 查看单词掌握度
```
作为一个用户
我想要了解我对单词的掌握情况
以便调整学习重点

验收标准:
1. 显示掌握度分布饼图
2. 分类显示：未学习、学习中、已掌握、需复习
3. 可以点击查看各分类单词列表
4. 显示需要复习的单词数量
```

### 2.2 错词本

#### US-LS-004: 查看错词本
```
作为一个用户
我想要查看我的错词本
以便针对性复习错词

验收标准:
1. 按时间倒序显示错词列表
2. 显示每个错词的错误次数
3. 显示最近一次错误输入
4. 支持搜索和筛选
5. 支持按词库筛选
```

#### US-LS-005: 手动添加错词
```
作为一个用户
我想要手动将单词添加到错词本
以便标记需要重点学习的单词

验收标准:
1. 在单词详情页可以添加到错词本
2. 添加时可以添加备注
3. 添加成功显示提示
4. 已在错词本的单词显示已添加状态
```

#### US-LS-006: 进行错词练习
```
作为一个用户
我想要专门练习错词本中的单词
以便强化薄弱环节

验收标准:
1. 从错词本生成练习关卡
2. 可以选择练习数量（10/20/全部）
3. 练习模式与普通关卡相同
4. 练习后正确的单词可选择移出错词本
5. 显示错词练习的统计数据
```

#### US-LS-007: 移除错词
```
作为一个用户
我想要将已掌握的单词从错词本移除
以便保持错词本的针对性

验收标准:
1. 可以单个移除
2. 可以批量移除
3. 练习正确后自动提示移除
4. 移除后可以重新添加
```

---

## 3. 业务规则

### 3.1 学习数据统计规则

| 规则编号 | 规则描述 |
|----------|----------|
| STATS-001 | 学习天数：有学习记录的日期计为1天 |
| STATS-002 | 学习时长：游戏开始到结束的时间，暂停时间不计入 |
| STATS-003 | 学习单词数：所有正确回答过的不重复单词数 |
| STATS-004 | 正确率：正确次数 / 总回答次数 × 100% |
| STATS-005 | 连续学习：每日00:00-23:59有学习记录视为当日学习 |

### 3.2 单词掌握度规则

| 掌握度 | 条件 | 标识 | 下一状态转换 |
|--------|------|------|--------------|
| 未学习 | 从未输入过 | ⚪ | 首次输入→学习中 |
| 学习中 | 正确次数 < 3 | 🟡 | 连续正确≥3→已掌握 |
| 已掌握 | 连续正确 ≥ 3 次 | 🟢 | 超过7天未练习→需复习 |
| 需复习 | 已掌握但超7天未练习 | 🔴 | 复习后正确→已掌握 |

### 3.3 错词本规则

| 规则编号 | 规则描述 |
|----------|----------|
| WRONG-001 | 游戏中输入错误的单词自动添加到错词本 |
| WRONG-002 | 同一单词重复错误只更新错误次数 |
| WRONG-003 | 手动添加的单词标记来源为"手动添加" |
| WRONG-004 | 错词本单词数量无上限 |
| WRONG-005 | 移除的单词再次错误会重新添加 |

### 3.4 错词练习规则

| 规则编号 | 规则描述 |
|----------|----------|
| PRAC-001 | 错词练习默认使用练习模式 |
| PRAC-002 | 每次练习随机抽取指定数量单词 |
| PRAC-003 | 练习正确的单词更新掌握度 |
| PRAC-004 | 练习完成后提示移除已掌握单词 |
| PRAC-005 | 错词练习获得正常经验值 |

### 3.5 复习提醒规则

| 规则编号 | 规则描述 |
|----------|----------|
| REVIEW-001 | 已掌握单词7天未练习标记为需复习 |
| REVIEW-002 | 需复习单词超过10个时推送提醒 |
| REVIEW-003 | 每日最多推送一次复习提醒 |
| REVIEW-004 | 用户可关闭复习提醒 |

---

## 4. 状态流转图

### 4.1 单词掌握度状态

```
┌──────────────┐
│   未学习     │
│   NOT_LEARNED│
│      ⚪      │
└──────────────┘
       │
       │ 首次输入（无论正误）
       ▼
┌──────────────┐
│   学习中     │◄─────────────────────────────┐
│   LEARNING   │                              │
│      🟡      │                              │
└──────────────┘                              │
       │                                      │
       │ 连续正确 ≥ 3次                        │
       ▼                                      │
┌──────────────┐     超过7天未练习     ┌──────────────┐
│   已掌握     │─────────────────────▶│   需复习     │
│   MASTERED   │                      │ NEED_REVIEW  │
│      🟢      │◀─────────────────────│      🔴      │
└──────────────┘   复习后连续正确≥2    └──────────────┘
       │                                      │
       │ 输入错误                              │ 复习时输入错误
       └──────────────────────────────────────┘
                  回退到学习中
```

### 4.2 错词本条目状态

```
┌──────────────┐
│   已添加     │ (自动或手动添加)
│    ADDED     │
└──────────────┘
       │
       │ 错词练习
       ▼
┌──────────────┐
│   练习中     │
│  PRACTICING  │
└──────────────┘
       │
       ├─── 练习正确 ───▶ ┌──────────────┐
       │                 │  待移除确认   │
       │                 │ PENDING_REMOVE│
       │                 └──────────────┘
       │                        │
       │                        ├── 确认移除 ──▶ ┌──────────────┐
       │                        │               │   已移除     │
       │                        │               │   REMOVED    │
       │                        │               └──────────────┘
       │                        │
       │                        └── 保留 ──────▶ 返回已添加
       │
       └─── 练习错误 ───▶ 更新错误次数，返回已添加
```

---

## 5. 数据模型

### 5.1 用户学习统计总览

```json
{
  "user_id": "usr_001",
  "total_stats": {
    "total_learning_days": 45,
    "total_learning_time_seconds": 54000,
    "total_words_learned": 520,
    "total_words_mastered": 380,
    "total_games_played": 200,
    "total_correct_count": 1800,
    "total_wrong_count": 200,
    "overall_accuracy": 90.0
  },
  "streak": {
    "current_streak_days": 7,
    "longest_streak_days": 21,
    "last_study_date": "2026-02-27"
  },
  "today_stats": {
    "learning_time_seconds": 1800,
    "words_learned": 20,
    "games_played": 5,
    "correct_count": 45,
    "wrong_count": 5,
    "accuracy": 90.0
  },
  "updated_at": "2026-02-27T15:30:00Z"
}
```

### 5.2 每日学习记录

```json
{
  "id": "daily_001",
  "user_id": "usr_001",
  "date": "2026-02-27",
  "stats": {
    "learning_time_seconds": 1800,
    "words_practiced": 50,
    "new_words_learned": 20,
    "games_played": 5,
    "correct_count": 45,
    "wrong_count": 5,
    "accuracy": 90.0,
    "exp_earned": 150,
    "max_combo": 15
  },
  "word_banks_practiced": [
    {
      "word_bank_id": "wb_001",
      "word_bank_name": "四级核心词汇",
      "words_practiced": 30
    }
  ],
  "created_at": "2026-02-27T08:00:00Z",
  "updated_at": "2026-02-27T15:30:00Z"
}
```

### 5.3 用户单词学习详情

```json
{
  "id": "uword_001",
  "user_id": "usr_001",
  "word_id": "word_001",
  "english": "apple",
  "chinese": "苹果",
  "mastery_level": "mastered",
  "stats": {
    "total_practice_count": 10,
    "correct_count": 9,
    "wrong_count": 1,
    "consecutive_correct": 5,
    "avg_response_time_ms": 2500
  },
  "history": {
    "first_learned_at": "2026-02-20T10:00:00Z",
    "last_practiced_at": "2026-02-27T15:30:00Z",
    "mastered_at": "2026-02-25T10:00:00Z",
    "next_review_at": "2026-03-04T10:00:00Z"
  },
  "wrong_book": {
    "is_in_wrong_book": false,
    "added_at": null,
    "source": null,
    "wrong_inputs": []
  }
}
```

### 5.4 错词本条目

```json
{
  "id": "wb_entry_001",
  "user_id": "usr_001",
  "word_id": "word_005",
  "word": {
    "english": "beautiful",
    "chinese": "美丽的",
    "phonetic": "/ˈbjuː.tɪ.fəl/",
    "difficulty": 4
  },
  "source": {
    "type": "auto",
    "word_bank_id": "wb_001",
    "word_bank_name": "四级核心词汇",
    "section_id": "sec_001",
    "section_name": "1-1"
  },
  "stats": {
    "wrong_count": 3,
    "correct_count_after_added": 1,
    "practice_count": 2
  },
  "wrong_inputs": [
    {
      "input": "beautful",
      "timestamp": "2026-02-27T15:30:00Z"
    },
    {
      "input": "beutiful",
      "timestamp": "2026-02-26T10:00:00Z"
    }
  ],
  "note": "",
  "added_at": "2026-02-26T10:00:00Z",
  "last_wrong_at": "2026-02-27T15:30:00Z",
  "removed_at": null,
  "status": "added"
}
```

### 5.5 错词练习记录

```json
{
  "id": "wp_001",
  "user_id": "usr_001",
  "practice_type": "wrong_book",
  "word_count": 10,
  "results": {
    "correct_count": 8,
    "wrong_count": 2,
    "accuracy": 80,
    "time_used_seconds": 120
  },
  "words": [
    {
      "word_id": "word_005",
      "english": "beautiful",
      "is_correct": true,
      "removed_from_wrong_book": true
    },
    {
      "word_id": "word_008",
      "english": "important",
      "is_correct": false,
      "removed_from_wrong_book": false
    }
  ],
  "exp_earned": 15,
  "practiced_at": "2026-02-27T16:00:00Z"
}
```

### 5.6 学习热力图数据

```json
{
  "user_id": "usr_001",
  "year": 2026,
  "weeks": [
    {
      "week_number": 9,
      "start_date": "2026-02-24",
      "days": [
        {
          "date": "2026-02-24",
          "day_of_week": 1,
          "learning_time_minutes": 30,
          "intensity_level": 2
        },
        {
          "date": "2026-02-25",
          "day_of_week": 2,
          "learning_time_minutes": 60,
          "intensity_level": 4
        }
      ]
    }
  ]
}
```

---

## 6. 接口定义

### 6.1 获取学习统计总览

**请求**
```
GET /api/v1/stats/overview
Authorization: Bearer {access_token}
```

**响应成功**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "total_stats": {
      "total_learning_days": 45,
      "total_learning_time": {
        "seconds": 54000,
        "formatted": "15小时"
      },
      "total_words_learned": 520,
      "total_words_mastered": 380,
      "total_games_played": 200,
      "overall_accuracy": 90.0
    },
    "streak": {
      "current_streak_days": 7,
      "longest_streak_days": 21,
      "last_study_date": "2026-02-27"
    },
    "today_stats": {
      "learning_time_minutes": 30,
      "words_learned": 20,
      "games_played": 5,
      "accuracy": 90.0
    },
    "mastery_distribution": {
      "not_learned": 1480,
      "learning": 140,
      "mastered": 350,
      "need_review": 30
    }
  }
}
```

### 6.2 获取学习曲线数据

**请求**
```
GET /api/v1/stats/curve
Authorization: Bearer {access_token}

Query Parameters:
- period: string (可选) - 7d/30d/90d，默认7d
- metric: string (可选) - time/words/accuracy/games，默认time
```

**响应成功**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "period": "7d",
    "metric": "time",
    "start_date": "2026-02-21",
    "end_date": "2026-02-27",
    "data_points": [
      {
        "date": "2026-02-21",
        "value": 45,
        "unit": "minutes"
      },
      {
        "date": "2026-02-22",
        "value": 30,
        "unit": "minutes"
      },
      {
        "date": "2026-02-23",
        "value": 0,
        "unit": "minutes"
      },
      {
        "date": "2026-02-24",
        "value": 60,
        "unit": "minutes"
      },
      {
        "date": "2026-02-25",
        "value": 45,
        "unit": "minutes"
      },
      {
        "date": "2026-02-26",
        "value": 30,
        "unit": "minutes"
      },
      {
        "date": "2026-02-27",
        "value": 30,
        "unit": "minutes"
      }
    ],
    "summary": {
      "total": 240,
      "average": 34.3,
      "max": 60,
      "min": 0
    },
    "comparison": {
      "previous_period_total": 180,
      "change_percent": 33.3,
      "trend": "up"
    }
  }
}
```

### 6.3 获取学习热力图

**请求**
```
GET /api/v1/stats/heatmap
Authorization: Bearer {access_token}

Query Parameters:
- year: number (可选) - 年份，默认当前年
```

**响应成功**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "year": 2026,
    "total_active_days": 45,
    "longest_streak": 21,
    "weeks": [
      {
        "week_number": 9,
        "days": [
          {
            "date": "2026-02-24",
            "learning_minutes": 30,
            "level": 2
          },
          {
            "date": "2026-02-25",
            "learning_minutes": 60,
            "level": 4
          },
          {
            "date": "2026-02-26",
            "learning_minutes": 0,
            "level": 0
          },
          {
            "date": "2026-02-27",
            "learning_minutes": 30,
            "level": 2
          }
        ]
      }
    ],
    "level_legend": {
      "0": "无学习",
      "1": "1-15分钟",
      "2": "16-30分钟",
      "3": "31-60分钟",
      "4": "60分钟以上"
    }
  }
}
```

### 6.4 获取单词掌握度列表

**请求**
```
GET /api/v1/stats/words
Authorization: Bearer {access_token}

Query Parameters:
- word_bank_id: string (可选) - 词库ID
- mastery_level: string (可选) - not_learned/learning/mastered/need_review
- sort_by: string (可选) - last_practiced_at/correct_count/wrong_count
- page: number (可选) - 页码，默认1
- page_size: number (可选) - 每页数量，默认50
```

**响应成功**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "words": [
      {
        "word_id": "word_001",
        "english": "apple",
        "chinese": "苹果",
        "mastery_level": "mastered",
        "correct_count": 9,
        "wrong_count": 1,
        "last_practiced_at": "2026-02-27T15:30:00Z",
        "is_in_wrong_book": false
      }
    ],
    "statistics": {
      "not_learned": 1480,
      "learning": 140,
      "mastered": 350,
      "need_review": 30
    },
    "pagination": {
      "page": 1,
      "page_size": 50,
      "total": 2000,
      "total_pages": 40
    }
  }
}
```

### 6.5 获取错词本列表

**请求**
```
GET /api/v1/wrong-book
Authorization: Bearer {access_token}

Query Parameters:
- word_bank_id: string (可选) - 词库ID筛选
- keyword: string (可选) - 搜索关键词
- sort_by: string (可选) - added_at/wrong_count/last_wrong_at
- page: number (可选) - 页码，默认1
- page_size: number (可选) - 每页数量，默认20
```

**响应成功**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "words": [
      {
        "id": "wb_entry_001",
        "word_id": "word_005",
        "english": "beautiful",
        "chinese": "美丽的",
        "phonetic": "/ˈbjuː.tɪ.fəl/",
        "difficulty": 4,
        "wrong_count": 3,
        "last_wrong_input": "beautful",
        "source": {
          "word_bank_name": "四级核心词汇",
          "type": "auto"
        },
        "added_at": "2026-02-26T10:00:00Z",
        "last_wrong_at": "2026-02-27T15:30:00Z"
      }
    ],
    "statistics": {
      "total_count": 25,
      "auto_added": 20,
      "manual_added": 5,
      "avg_wrong_count": 2.5
    },
    "pagination": {
      "page": 1,
      "page_size": 20,
      "total": 25,
      "total_pages": 2
    }
  }
}
```

### 6.6 获取错词详情

**请求**
```
GET /api/v1/wrong-book/{entry_id}
Authorization: Bearer {access_token}
```

**响应成功**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": "wb_entry_001",
    "word": {
      "id": "word_005",
      "english": "beautiful",
      "chinese": "美丽的",
      "phonetic": "/ˈbjuː.tɪ.fəl/",
      "audio_url": "https://cdn.boomword.com/audio/beautiful.mp3",
      "difficulty": 4,
      "example_sentence": "She is a beautiful girl.",
      "example_chinese": "她是一个漂亮的女孩。"
    },
    "source": {
      "type": "auto",
      "word_bank_id": "wb_001",
      "word_bank_name": "四级核心词汇",
      "section_name": "1-1"
    },
    "stats": {
      "wrong_count": 3,
      "correct_count_after_added": 1,
      "practice_count": 2
    },
    "wrong_history": [
      {
        "input": "beautful",
        "timestamp": "2026-02-27T15:30:00Z",
        "game_mode": "challenge"
      },
      {
        "input": "beutiful",
        "timestamp": "2026-02-26T10:00:00Z",
        "game_mode": "practice"
      }
    ],
    "note": "注意双字母u",
    "added_at": "2026-02-26T10:00:00Z"
  }
}
```

### 6.7 手动添加到错词本

**请求**
```
POST /api/v1/wrong-book
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "word_id": "word_010",
  "note": "容易和其他词混淆"
}
```

**响应成功**
```json
{
  "code": 200,
  "message": "已添加到错词本",
  "data": {
    "id": "wb_entry_002",
    "word_id": "word_010",
    "english": "important",
    "chinese": "重要的",
    "added_at": "2026-02-27T16:00:00Z"
  }
}
```

### 6.8 从错词本移除

**请求**
```
DELETE /api/v1/wrong-book/{entry_id}
Authorization: Bearer {access_token}
```

**响应成功**
```json
{
  "code": 200,
  "message": "已从错词本移除"
}
```

### 6.9 批量移除错词

**请求**
```
POST /api/v1/wrong-book/batch-remove
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "entry_ids": ["wb_entry_001", "wb_entry_002", "wb_entry_003"]
}
```

**响应成功**
```json
{
  "code": 200,
  "message": "已移除3个单词",
  "data": {
    "removed_count": 3,
    "remaining_count": 22
  }
}
```

### 6.10 开始错词练习

**请求**
```
POST /api/v1/wrong-book/practice/start
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "word_count": 10,
  "word_bank_id": null
}
```

**参数说明**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| word_count | number | 是 | 练习单词数量 10/20/0(全部) |
| word_bank_id | string | 否 | 指定词库，不传则全部错词 |

**响应成功**
```json
{
  "code": 200,
  "message": "错词练习开始",
  "data": {
    "practice_id": "wp_001",
    "word_count": 10,
    "words": [
      {
        "word_id": "word_005",
        "english": "beautiful",
        "chinese": "美丽的",
        "phonetic": "/ˈbjuː.tɪ.fəl/",
        "audio_url": "https://cdn.boomword.com/audio/beautiful.mp3",
        "difficulty": 4,
        "wrong_count": 3
      }
    ],
    "config": {
      "show_english": true,
      "show_chinese": true,
      "time_limit": null
    }
  }
}
```

### 6.11 提交错词练习结果

**请求**
```
POST /api/v1/wrong-book/practice/{practice_id}/submit
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "results": [
    {
      "word_id": "word_005",
      "input": "beautiful",
      "is_correct": true,
      "response_time_ms": 3000
    },
    {
      "word_id": "word_008",
      "input": "importent",
      "is_correct": false,
      "response_time_ms": 4500
    }
  ],
  "time_used_seconds": 120
}
```

**响应成功**
```json
{
  "code": 200,
  "message": "练习完成",
  "data": {
    "practice_id": "wp_001",
    "summary": {
      "total_words": 10,
      "correct_count": 8,
      "wrong_count": 2,
      "accuracy": 80,
      "time_used_seconds": 120
    },
    "rewards": {
      "exp_earned": 15
    },
    "correct_words": [
      {
        "word_id": "word_005",
        "english": "beautiful",
        "suggest_remove": true
      }
    ],
    "wrong_words": [
      {
        "word_id": "word_008",
        "english": "important",
        "user_input": "importent",
        "wrong_count_updated": 4
      }
    ]
  }
}
```

### 6.12 确认移除练习正确的单词

**请求**
```
POST /api/v1/wrong-book/practice/{practice_id}/remove-correct
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "word_ids": ["word_005", "word_006"]
}
```

**响应成功**
```json
{
  "code": 200,
  "message": "已移除2个单词",
  "data": {
    "removed_count": 2,
    "remaining_in_wrong_book": 23
  }
}
```

### 6.13 更新错词备注

**请求**
```
PUT /api/v1/wrong-book/{entry_id}/note
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "note": "注意双字母u"
}
```

**响应成功**
```json
{
  "code": 200,
  "message": "备注已更新",
  "data": {
    "entry_id": "wb_entry_001",
    "note": "注意双字母u",
    "updated_at": "2026-02-27T16:30:00Z"
  }
}
```

### 6.14 获取需要复习的单词

**请求**
```
GET /api/v1/stats/need-review
Authorization: Bearer {access_token}

Query Parameters:
- word_bank_id: string (可选) - 词库ID筛选
- page: number (可选) - 页码
- page_size: number (可选) - 每页数量
```

**响应成功**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "words": [
      {
        "word_id": "word_100",
        "english": "environment",
        "chinese": "环境",
        "last_practiced_at": "2026-02-15T10:00:00Z",
        "days_since_practice": 12,
        "previous_mastery": "mastered"
      }
    ],
    "total_count": 30,
    "pagination": {
      "page": 1,
      "page_size": 20,
      "total": 30,
      "total_pages": 2
    }
  }
}
```

---

## 7. 异常处理

### 7.1 错误码定义

| 错误码 | 错误标识 | 说明 | HTTP状态码 |
|--------|----------|------|------------|
| 60001 | WRONG_BOOK_ENTRY_NOT_FOUND | 错词条目不存在 | 404 |
| 60002 | WORD_ALREADY_IN_WRONG_BOOK | 单词已在错词本中 | 400 |
| 60003 | WORD_NOT_IN_WRONG_BOOK | 单词不在错词本中 | 400 |
| 60004 | PRACTICE_NOT_FOUND | 练习记录不存在 | 404 |
| 60005 | PRACTICE_ALREADY_SUBMITTED | 练习已提交 | 400 |
| 60006 | EMPTY_WRONG_BOOK | 错词本为空 | 400 |
| 60007 | INVALID_DATE_RANGE | 无效的日期范围 | 400 |
| 60008 | STATS_NOT_AVAILABLE | 统计数据不可用 | 500 |

---

## 8. 边界条件

### 8.1 统计边界

| 场景 | 处理方式 |
|------|----------|
| 跨时区学习 | 按用户设置的时区计算日期 |
| 连续学习中断 | 只要当日有学习记录即算连续 |
| 数据修正 | 重新计算受影响的统计数据 |
| 账号迁移 | 统计数据随账号迁移 |

### 8.2 错词本边界

| 场景 | 处理方式 |
|------|----------|
| 错词本为空开始练习 | 提示"错词本为空" |
| 练习数量大于错词数 | 取全部错词 |
| 练习中网络断开 | 本地缓存，恢复后提交 |
| 单词被删除 | 自动从错词本移除 |
| 同时添加和移除同一单词 | 以最后操作为准 |

### 8.3 掌握度边界

| 场景 | 处理方式 |
|------|----------|
| 首次就正确 | 仍然进入学习中状态 |
| 掌握后长期未登录 | 登录时更新需复习状态 |
| 掌握后在其他词库错误 | 状态回退到学习中 |
| 强制复习 | 不改变掌握度状态 |

---

## 9. 性能要求

| 接口 | 响应时间要求 | 并发要求 |
|------|--------------|----------|
| 获取学习总览 | < 150ms | 300/s |
| 获取学习曲线 | < 200ms | 200/s |
| 获取热力图 | < 300ms | 100/s |
| 获取错词本列表 | < 200ms | 200/s |
| 开始错词练习 | < 300ms | 100/s |
| 提交练习结果 | < 300ms | 100/s |

### 9.1 缓存策略

| 数据类型 | 缓存时间 | 缓存位置 |
|----------|----------|----------|
| 学习总览 | 5分钟 | Redis |
| 学习曲线 | 10分钟 | Redis |
| 热力图 | 1小时 | Redis |
| 错词本列表 | 实时 | - |
| 掌握度分布 | 5分钟 | Redis |

---

## 10. 枚举定义

### 10.1 掌握度级别

```json
{
  "mastery_levels": [
    {"code": "not_learned", "name": "未学习", "icon": "⚪", "color": "#9E9E9E"},
    {"code": "learning", "name": "学习中", "icon": "🟡", "color": "#FFC107"},
    {"code": "mastered", "name": "已掌握", "icon": "🟢", "color": "#4CAF50"},
    {"code": "need_review", "name": "需复习", "icon": "🔴", "color": "#F44336"}
  ]
}
```

### 10.2 错词来源类型

```json
{
  "wrong_word_source_types": [
    {"code": "auto", "name": "自动添加"},
    {"code": "manual", "name": "手动添加"}
  ]
}
```

### 10.3 统计指标类型

```json
{
  "stat_metrics": [
    {"code": "time", "name": "学习时长", "unit": "分钟"},
    {"code": "words", "name": "学习单词数", "unit": "个"},
    {"code": "accuracy", "name": "正确率", "unit": "%"},
    {"code": "games", "name": "游戏次数", "unit": "次"}
  ]
}
```

### 10.4 统计周期

```json
{
  "stat_periods": [
    {"code": "7d", "name": "最近7天"},
    {"code": "30d", "name": "最近30天"},
    {"code": "90d", "name": "最近90天"},
    {"code": "year", "name": "本年度"}
  ]
}
```

### 10.5 热力图强度级别

```json
{
  "heatmap_levels": [
    {"level": 0, "name": "无学习", "minutes_range": "0", "color": "#EBEDF0"},
    {"level": 1, "name": "轻度", "minutes_range": "1-15", "color": "#9BE9A8"},
    {"level": 2, "name": "中度", "minutes_range": "16-30", "color": "#40C463"},
    {"level": 3, "name": "高度", "minutes_range": "31-60", "color": "#30A14E"},
    {"level": 4, "name": "极高", "minutes_range": "60+", "color": "#216E39"}
  ]
}
```
