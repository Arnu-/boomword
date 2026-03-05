# 词库系统详细设计

## 1. 功能清单

| 功能模块 | 功能点 | 优先级 | 版本 |
|----------|--------|--------|------|
| 词库分类 | 按教育体系分类浏览 | P0 | v1.0 |
| 词库分类 | 按主题分类浏览 | P0 | v1.0 |
| 词库分类 | 按考试类型分类浏览 | P0 | v1.0 |
| 词库选择 | 选择学习词库 | P0 | v1.0 |
| 词库选择 | 词库收藏/取消收藏 | P1 | v1.5 |
| 词汇浏览 | 查看词库单词列表 | P0 | v1.0 |
| 词汇详情 | 查看单词详细信息 | P0 | v1.0 |
| 词汇发音 | 播放单词发音 | P0 | v1.0 |
| 自定义词库 | 用户创建私人词库 | P2 | v2.0 |
| 词库分享 | 分享词库给好友 | P2 | v2.0 |

---

## 2. 用户故事

### 2.1 词库浏览

#### US-WB-001: 按教育体系浏览词库
```
作为一个学生用户
我想要按照教育体系（年级/教材版本）浏览词库
以便找到与我课程匹配的单词学习

验收标准:
1. 显示教育体系分类树（小学→初中→高中→大学）
2. 每个年级显示可选的教材版本
3. 选择教材后显示对应的单元列表
4. 显示每个词库的单词数量和学习进度
5. 支持搜索词库名称
```

#### US-WB-002: 按主题浏览词库
```
作为一个英语学习爱好者
我想要按照主题分类浏览词库
以便根据兴趣选择学习内容

验收标准:
1. 显示主题分类列表（日常生活、职场商务等）
2. 每个主题下显示子分类
3. 显示每个词库的难度标识
4. 支持按难度筛选
```

#### US-WB-003: 按考试类型浏览词库
```
作为一个备考用户
我想要快速找到对应考试的词库
以便有针对性地备考

验收标准:
1. 显示考试类型列表（四级、六级、考研等）
2. 每个考试类型显示核心词汇和高频词汇
3. 显示词库总词数和用户掌握情况
4. 推荐用户最适合的词库
```

### 2.2 词库学习

#### US-WB-004: 选择词库开始学习
```
作为一个用户
我想要选择一个词库开始学习
以便开始我的单词学习旅程

验收标准:
1. 点击词库进入词库详情页
2. 显示词库基本信息和学习进度
3. 显示关卡列表和完成情况
4. 可以选择继续上次学习或从头开始
5. 首次选择词库记录为当前学习词库
```

#### US-WB-005: 预览词库单词
```
作为一个用户
我想要在学习前预览词库中的单词
以便了解词库难度是否适合自己

验收标准:
1. 显示词库所有单词列表
2. 每个单词显示英文、中文、音标
3. 点击单词可以播放发音
4. 显示单词难度等级
5. 支持搜索单词
```

### 2.3 单词详情

#### US-WB-006: 查看单词详情
```
作为一个用户
我想要查看单词的详细信息
以便深入学习这个单词

验收标准:
1. 显示单词英文和中文释义
2. 显示音标和发音按钮
3. 显示例句（中英对照）
4. 显示单词难度等级
5. 显示个人学习记录（正确/错误次数）
6. 可以添加到/移除出错词本
```

---

## 3. 业务规则

### 3.1 词库分类规则

| 规则编号 | 规则描述 |
|----------|----------|
| WB-001 | 一个词库只能属于一个教育体系分类 |
| WB-002 | 一个词库可以有多个主题标签 |
| WB-003 | 词库必须包含至少10个单词才能发布 |
| WB-004 | 词库分类层级最多支持4层 |
| WB-005 | 系统词库默认对所有用户可见 |

### 3.2 词汇管理规则

| 规则编号 | 规则描述 |
|----------|----------|
| WORD-001 | 每个单词必须有英文和中文释义 |
| WORD-002 | 音标和发音为可选，但推荐提供 |
| WORD-003 | 单词难度根据字母数自动计算 |
| WORD-004 | 一个单词可以出现在多个词库中 |
| WORD-005 | 同一词库中单词不可重复 |

### 3.3 难度分级规则

| 难度等级 | 字母数范围 | 基础分值 | 颜色标识 |
|----------|------------|----------|----------|
| 1星 | 1-4字母 | 10分 | 绿色 #4CAF50 |
| 2星 | 5-6字母 | 20分 | 蓝色 #2196F3 |
| 3星 | 7-8字母 | 30分 | 黄色 #FFC107 |
| 4星 | 9-10字母 | 40分 | 橙色 #FF9800 |
| 5星 | 11+字母 | 50分 | 红色 #F44336 |

### 3.4 词库推荐规则

| 规则编号 | 规则描述 |
|----------|----------|
| REC-001 | 根据用户年级推荐对应教材词库 |
| REC-002 | 根据用户完成词库推荐下一级词库 |
| REC-003 | 优先推荐用户收藏的词库 |
| REC-004 | 推荐热门词库（按使用人数排序） |

---

## 4. 状态流转图

### 4.1 词库状态

```
┌──────────────┐
│    草稿      │ (管理员创建，未发布)
└──────────────┘
       │
       │ 审核通过
       ▼
┌──────────────┐     ┌──────────────┐
│    已发布    │────▶│    已下架    │
│              │◀────│              │
└──────────────┘     └──────────────┘
       │
       │ 标记删除
       ▼
┌──────────────┐
│    已删除    │ (软删除，可恢复)
└──────────────┘
```

### 4.2 用户词库学习状态

```
┌──────────────┐
│   未开始     │ (用户未选择该词库)
└──────────────┘
       │
       │ 选择词库
       ▼
┌──────────────┐
│   学习中     │ (正在学习)
└──────────────┘
       │
       │ 完成所有关卡
       ▼
┌──────────────┐
│   已完成     │ (全部通关)
└──────────────┘
       │
       │ 重置进度
       ▼
┌──────────────┐
│   重新学习   │
└──────────────┘
```

### 4.3 单词掌握状态

```
┌──────────────┐
│   未学习     │ (从未输入过)
│      ⚪      │
└──────────────┘
       │
       │ 首次输入
       ▼
┌──────────────┐
│   学习中     │ (正确次数 < 3)
│      🟡      │
└──────────────┘
       │
       │ 连续正确 ≥ 3次
       ▼
┌──────────────┐     ┌──────────────┐
│   已掌握     │────▶│   需复习     │
│      🟢      │     │      🔴      │
└──────────────┘     └──────────────┘
       ▲               │
       │               │ 复习后正确
       └───────────────┘
```

---

## 5. 数据模型

### 5.1 词库分类

```json
{
  "id": "cat_001",
  "parent_id": null,
  "name": "小学英语",
  "code": "elementary",
  "type": "education",
  "level": 1,
  "sort_order": 1,
  "icon_url": "https://cdn.boomword.com/icons/elementary.png",
  "description": "小学1-6年级英语词汇",
  "is_active": true,
  "created_at": "2026-02-27T10:00:00Z",
  "updated_at": "2026-02-27T10:00:00Z"
}
```

### 5.2 词库信息

```json
{
  "id": "wb_001",
  "name": "人教版三年级上册",
  "code": "pep_grade3_1",
  "description": "人民教育出版社三年级上册英语单词",
  "category_id": "cat_003",
  "category_path": "elementary/pep/grade3",
  "tags": ["elementary", "pep", "grade3"],
  "cover_url": "https://cdn.boomword.com/covers/wb_001.png",
  "word_count": 120,
  "chapter_count": 4,
  "section_count": 12,
  "difficulty_avg": 1.5,
  "status": "published",
  "is_free": true,
  "sort_order": 1,
  "study_count": 15000,
  "created_by": "admin_001",
  "created_at": "2026-02-27T10:00:00Z",
  "updated_at": "2026-02-27T10:00:00Z"
}
```

### 5.3 单词信息

```json
{
  "id": "word_001",
  "english": "apple",
  "chinese": "苹果；苹果树",
  "phonetic_uk": "/ˈæp.əl/",
  "phonetic_us": "/ˈæp.əl/",
  "audio_uk_url": "https://cdn.boomword.com/audio/uk/apple.mp3",
  "audio_us_url": "https://cdn.boomword.com/audio/us/apple.mp3",
  "difficulty": 1,
  "letter_count": 5,
  "base_score": 10,
  "part_of_speech": "n.",
  "example_sentence": "I eat an apple every day.",
  "example_chinese": "我每天吃一个苹果。",
  "example_audio_url": "https://cdn.boomword.com/audio/sentences/apple_example.mp3",
  "tags": ["food", "fruit", "noun"],
  "synonyms": ["fruit"],
  "memory_tip": "一个(a) + 普普通通的(pp) + 乐(le) = apple 苹果",
  "created_at": "2026-02-27T10:00:00Z",
  "updated_at": "2026-02-27T10:00:00Z"
}
```

### 5.4 词库-单词关联

```json
{
  "id": "wb_word_001",
  "word_bank_id": "wb_001",
  "word_id": "word_001",
  "chapter_id": "chap_001",
  "section_id": "sec_001",
  "sort_order": 1,
  "is_key_word": true,
  "created_at": "2026-02-27T10:00:00Z"
}
```

### 5.5 用户词库学习进度

```json
{
  "id": "uwb_001",
  "user_id": "usr_001",
  "word_bank_id": "wb_001",
  "status": "learning",
  "total_words": 120,
  "learned_words": 45,
  "mastered_words": 30,
  "progress_percent": 37.5,
  "total_chapters": 4,
  "completed_chapters": 1,
  "total_sections": 12,
  "completed_sections": 4,
  "total_stars": 36,
  "earned_stars": 10,
  "last_section_id": "sec_005",
  "started_at": "2026-02-27T10:00:00Z",
  "last_study_at": "2026-02-27T15:30:00Z",
  "completed_at": null
}
```

### 5.6 用户单词学习记录

```json
{
  "id": "uword_001",
  "user_id": "usr_001",
  "word_id": "word_001",
  "word_bank_id": "wb_001",
  "mastery_level": "mastered",
  "correct_count": 5,
  "wrong_count": 1,
  "consecutive_correct": 3,
  "total_practice_count": 6,
  "avg_response_time_ms": 2500,
  "first_learned_at": "2026-02-27T10:00:00Z",
  "last_practiced_at": "2026-02-27T15:30:00Z",
  "next_review_at": "2026-03-06T10:00:00Z",
  "is_in_wrong_book": false
}
```

---

## 6. 接口定义

### 6.1 获取词库分类树

**请求**
```
GET /api/v1/word-banks/categories
Authorization: Bearer {access_token}

Query Parameters:
- type: string (可选) - education/topic/exam
```

**响应成功**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "categories": [
      {
        "id": "cat_001",
        "name": "小学英语",
        "code": "elementary",
        "icon_url": "https://cdn.boomword.com/icons/elementary.png",
        "word_bank_count": 48,
        "children": [
          {
            "id": "cat_002",
            "name": "人教版 (PEP)",
            "code": "pep",
            "word_bank_count": 12,
            "children": [
              {
                "id": "cat_003",
                "name": "三年级上册",
                "code": "grade3_1",
                "word_bank_count": 1,
                "children": []
              }
            ]
          }
        ]
      }
    ]
  }
}
```

### 6.2 获取词库列表

**请求**
```
GET /api/v1/word-banks
Authorization: Bearer {access_token}

Query Parameters:
- category_id: string (可选) - 分类ID
- tag: string (可选) - 标签
- difficulty_min: number (可选) - 最小难度 1-5
- difficulty_max: number (可选) - 最大难度 1-5
- keyword: string (可选) - 搜索关键词
- sort_by: string (可选) - study_count/created_at/name
- sort_order: string (可选) - asc/desc
- page: number (可选) - 页码，默认1
- page_size: number (可选) - 每页数量，默认20
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
        "name": "人教版三年级上册",
        "description": "人民教育出版社三年级上册英语单词",
        "cover_url": "https://cdn.boomword.com/covers/wb_001.png",
        "word_count": 120,
        "chapter_count": 4,
        "difficulty_avg": 1.5,
        "study_count": 15000,
        "is_free": true,
        "user_progress": {
          "status": "learning",
          "progress_percent": 37.5,
          "earned_stars": 10,
          "total_stars": 36
        }
      }
    ],
    "pagination": {
      "page": 1,
      "page_size": 20,
      "total": 48,
      "total_pages": 3
    }
  }
}
```

### 6.3 获取词库详情

**请求**
```
GET /api/v1/word-banks/{word_bank_id}
Authorization: Bearer {access_token}
```

**响应成功**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": "wb_001",
    "name": "人教版三年级上册",
    "description": "人民教育出版社三年级上册英语单词",
    "cover_url": "https://cdn.boomword.com/covers/wb_001.png",
    "category": {
      "id": "cat_003",
      "name": "三年级上册",
      "path": "小学英语 > 人教版 > 三年级上册"
    },
    "tags": ["elementary", "pep", "grade3"],
    "word_count": 120,
    "chapter_count": 4,
    "section_count": 12,
    "difficulty_avg": 1.5,
    "difficulty_distribution": {
      "1": 40,
      "2": 50,
      "3": 25,
      "4": 4,
      "5": 1
    },
    "study_count": 15000,
    "is_free": true,
    "chapters": [
      {
        "id": "chap_001",
        "name": "Unit 1 Hello",
        "word_count": 30,
        "section_count": 3,
        "sections": [
          {
            "id": "sec_001",
            "name": "1-1",
            "word_count": 10,
            "user_progress": {
              "is_unlocked": true,
              "practice_stars": 3,
              "challenge_stars": 2,
              "speed_stars": 0,
              "best_score": 850,
              "play_count": 5
            }
          }
        ],
        "user_progress": {
          "completed_sections": 2,
          "total_stars": 6,
          "earned_stars": 5
        }
      }
    ],
    "user_progress": {
      "status": "learning",
      "learned_words": 45,
      "mastered_words": 30,
      "progress_percent": 37.5,
      "completed_chapters": 1,
      "completed_sections": 4,
      "total_stars": 36,
      "earned_stars": 10,
      "started_at": "2026-02-27T10:00:00Z",
      "last_study_at": "2026-02-27T15:30:00Z"
    }
  }
}
```

### 6.4 获取词库单词列表

**请求**
```
GET /api/v1/word-banks/{word_bank_id}/words
Authorization: Bearer {access_token}

Query Parameters:
- chapter_id: string (可选) - 章节ID
- section_id: string (可选) - 小节ID
- mastery_level: string (可选) - not_learned/learning/mastered/need_review
- keyword: string (可选) - 搜索关键词
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
        "id": "word_001",
        "english": "apple",
        "chinese": "苹果",
        "phonetic_uk": "/ˈæp.əl/",
        "audio_uk_url": "https://cdn.boomword.com/audio/uk/apple.mp3",
        "difficulty": 1,
        "chapter_name": "Unit 1 Hello",
        "section_name": "1-1",
        "user_progress": {
          "mastery_level": "mastered",
          "correct_count": 5,
          "wrong_count": 1
        }
      }
    ],
    "statistics": {
      "total": 120,
      "not_learned": 40,
      "learning": 35,
      "mastered": 30,
      "need_review": 15
    },
    "pagination": {
      "page": 1,
      "page_size": 50,
      "total": 120,
      "total_pages": 3
    }
  }
}
```

### 6.5 获取单词详情

**请求**
```
GET /api/v1/words/{word_id}
Authorization: Bearer {access_token}
```

**响应成功**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": "word_001",
    "english": "apple",
    "chinese": "苹果；苹果树",
    "phonetic_uk": "/ˈæp.əl/",
    "phonetic_us": "/ˈæp.əl/",
    "audio_uk_url": "https://cdn.boomword.com/audio/uk/apple.mp3",
    "audio_us_url": "https://cdn.boomword.com/audio/us/apple.mp3",
    "difficulty": 1,
    "base_score": 10,
    "part_of_speech": "n.",
    "example_sentence": "I eat an apple every day.",
    "example_chinese": "我每天吃一个苹果。",
    "example_audio_url": "https://cdn.boomword.com/audio/sentences/apple_example.mp3",
    "synonyms": ["fruit"],
    "memory_tip": "一个(a) + 普普通通的(pp) + 乐(le) = apple 苹果",
    "user_progress": {
      "mastery_level": "mastered",
      "correct_count": 5,
      "wrong_count": 1,
      "consecutive_correct": 3,
      "total_practice_count": 6,
      "avg_response_time_ms": 2500,
      "first_learned_at": "2026-02-27T10:00:00Z",
      "last_practiced_at": "2026-02-27T15:30:00Z",
      "is_in_wrong_book": false
    },
    "word_banks": [
      {
        "id": "wb_001",
        "name": "人教版三年级上册"
      },
      {
        "id": "wb_050",
        "name": "水果词汇"
      }
    ]
  }
}
```

### 6.6 开始学习词库

**请求**
```
POST /api/v1/word-banks/{word_bank_id}/start
Authorization: Bearer {access_token}
```

**响应成功**
```json
{
  "code": 200,
  "message": "开始学习",
  "data": {
    "word_bank_id": "wb_001",
    "first_section": {
      "id": "sec_001",
      "name": "1-1",
      "chapter_name": "Unit 1 Hello",
      "word_count": 10
    },
    "user_progress": {
      "status": "learning",
      "started_at": "2026-02-27T10:00:00Z"
    }
  }
}
```

### 6.7 收藏/取消收藏词库

**请求**
```
POST /api/v1/word-banks/{word_bank_id}/favorite
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "is_favorite": true
}
```

**响应成功**
```json
{
  "code": 200,
  "message": "收藏成功",
  "data": {
    "word_bank_id": "wb_001",
    "is_favorite": true,
    "favorited_at": "2026-02-27T10:00:00Z"
  }
}
```

### 6.8 获取用户收藏词库列表

**请求**
```
GET /api/v1/users/me/favorite-word-banks
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
    "word_banks": [
      {
        "id": "wb_001",
        "name": "人教版三年级上册",
        "cover_url": "https://cdn.boomword.com/covers/wb_001.png",
        "word_count": 120,
        "favorited_at": "2026-02-27T10:00:00Z",
        "user_progress": {
          "progress_percent": 37.5
        }
      }
    ],
    "pagination": {
      "page": 1,
      "page_size": 20,
      "total": 5,
      "total_pages": 1
    }
  }
}
```

### 6.9 搜索单词

**请求**
```
GET /api/v1/words/search
Authorization: Bearer {access_token}

Query Parameters:
- keyword: string (必填) - 搜索关键词（英文或中文）
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
        "id": "word_001",
        "english": "apple",
        "chinese": "苹果",
        "phonetic_uk": "/ˈæp.əl/",
        "difficulty": 1,
        "word_banks": ["人教版三年级上册", "水果词汇"]
      }
    ],
    "pagination": {
      "page": 1,
      "page_size": 20,
      "total": 1,
      "total_pages": 1
    }
  }
}
```

### 6.10 获取推荐词库

**请求**
```
GET /api/v1/word-banks/recommended
Authorization: Bearer {access_token}

Query Parameters:
- limit: number (可选) - 推荐数量，默认5
```

**响应成功**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "recommendations": [
      {
        "type": "continue_learning",
        "title": "继续学习",
        "word_bank": {
          "id": "wb_001",
          "name": "人教版三年级上册",
          "progress_percent": 37.5,
          "last_study_at": "2026-02-27T15:30:00Z"
        }
      },
      {
        "type": "based_on_grade",
        "title": "适合你的年级",
        "word_banks": [
          {
            "id": "wb_002",
            "name": "人教版三年级下册",
            "word_count": 130
          }
        ]
      },
      {
        "type": "popular",
        "title": "热门词库",
        "word_banks": [
          {
            "id": "wb_100",
            "name": "四级核心词汇",
            "study_count": 50000
          }
        ]
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
| 20001 | WORD_BANK_NOT_FOUND | 词库不存在 | 404 |
| 20002 | WORD_NOT_FOUND | 单词不存在 | 404 |
| 20003 | CATEGORY_NOT_FOUND | 分类不存在 | 404 |
| 20004 | WORD_BANK_NOT_PUBLISHED | 词库未发布 | 403 |
| 20005 | WORD_BANK_OFFLINE | 词库已下架 | 403 |
| 20006 | SECTION_LOCKED | 小节未解锁 | 403 |
| 20007 | CHAPTER_LOCKED | 章节未解锁 | 403 |
| 20008 | WORD_BANK_PREMIUM | 词库需要付费 | 402 |
| 20009 | SEARCH_KEYWORD_TOO_SHORT | 搜索关键词太短 | 400 |
| 20010 | FAVORITE_LIMIT_EXCEEDED | 收藏数量超限 | 400 |

### 7.2 异常响应格式

```json
{
  "code": 20001,
  "message": "词库不存在",
  "error": "WORD_BANK_NOT_FOUND",
  "details": {
    "word_bank_id": "wb_999"
  },
  "timestamp": "2026-02-27T10:00:00Z",
  "request_id": "req_abc123"
}
```

---

## 8. 边界条件

### 8.1 词库浏览边界

| 场景 | 处理方式 |
|------|----------|
| 分类下没有词库 | 显示空状态，提示"暂无词库" |
| 词库已下架 | 已学习用户可继续访问，新用户无法看到 |
| 词库单词数量变化 | 重新计算用户进度百分比 |
| 搜索无结果 | 显示空状态，推荐相关词库 |

### 8.2 学习进度边界

| 场景 | 处理方式 |
|------|----------|
| 用户首次访问词库 | 创建学习进度记录，状态为not_started |
| 用户切换词库 | 保留所有词库进度，可随时切换 |
| 词库增加新单词 | 用户进度百分比重新计算 |
| 词库删除单词 | 用户该单词学习记录保留 |
| 重置词库进度 | 关卡星级清零，单词记录保留 |

### 8.3 单词学习边界

| 场景 | 处理方式 |
|------|----------|
| 同一单词在多个词库 | 学习记录全局共享 |
| 单词掌握后超过7天未练 | 状态变为need_review |
| 复习后正确 | 状态恢复为mastered |
| 单词被添加到错词本 | 记录来源词库 |

### 8.4 收藏边界

| 场景 | 处理方式 |
|------|----------|
| 收藏数量超过100个 | 提示达到上限，需取消部分收藏 |
| 收藏的词库被下架 | 保留收藏记录，标记已下架 |
| 重复收藏 | 幂等处理，返回成功 |

---

## 9. 安全要求

### 9.1 数据访问控制

| 数据类型 | 访问规则 |
|----------|----------|
| 系统词库 | 所有已发布词库对所有用户可见 |
| 用户学习记录 | 仅本人可查看和修改 |
| 词库统计数据 | 公开可查（学习人数等） |
| 音频文件 | 需要登录才能访问 |

### 9.2 接口安全

| 安全项 | 要求 |
|--------|------|
| 音频防盗链 | CDN配置Referer白名单 |
| 批量请求 | 限制单次查询最多100条 |
| 搜索防滥用 | 关键词最少2个字符 |

---

## 10. 性能要求

| 接口 | 响应时间要求 | 并发要求 |
|------|--------------|----------|
| 获取分类树 | < 100ms | 500/s |
| 获取词库列表 | < 200ms | 300/s |
| 获取词库详情 | < 150ms | 300/s |
| 获取单词列表 | < 200ms | 200/s |
| 搜索单词 | < 300ms | 100/s |
| 音频文件加载 | < 500ms | 200/s |

### 10.1 缓存策略

| 数据类型 | 缓存时间 | 缓存位置 |
|----------|----------|----------|
| 分类树 | 1小时 | Redis |
| 词库列表 | 10分钟 | Redis |
| 词库详情 | 5分钟 | Redis |
| 单词详情 | 1小时 | Redis |
| 用户进度 | 实时 | 不缓存 |
| 音频文件 | 7天 | CDN |

---

## 11. 枚举定义

### 11.1 词库分类类型

```json
{
  "category_types": [
    {"code": "education", "name": "教育体系"},
    {"code": "topic", "name": "主题分类"},
    {"code": "exam", "name": "考试类型"}
  ]
}
```

### 11.2 词库状态

```json
{
  "word_bank_status": [
    {"code": "draft", "name": "草稿"},
    {"code": "published", "name": "已发布"},
    {"code": "offline", "name": "已下架"},
    {"code": "deleted", "name": "已删除"}
  ]
}
```

### 11.3 单词掌握度

```json
{
  "mastery_levels": [
    {"code": "not_learned", "name": "未学习", "icon": "⚪"},
    {"code": "learning", "name": "学习中", "icon": "🟡"},
    {"code": "mastered", "name": "已掌握", "icon": "🟢"},
    {"code": "need_review", "name": "需复习", "icon": "🔴"}
  ]
}
```

### 11.4 词性枚举

```json
{
  "parts_of_speech": [
    {"code": "n.", "name": "名词"},
    {"code": "v.", "name": "动词"},
    {"code": "adj.", "name": "形容词"},
    {"code": "adv.", "name": "副词"},
    {"code": "prep.", "name": "介词"},
    {"code": "conj.", "name": "连词"},
    {"code": "pron.", "name": "代词"},
    {"code": "num.", "name": "数词"},
    {"code": "art.", "name": "冠词"},
    {"code": "int.", "name": "感叹词"}
  ]
}
```

### 11.5 难度等级

```json
{
  "difficulty_levels": [
    {"level": 1, "name": "入门", "letter_range": "1-4", "base_score": 10, "color": "#4CAF50"},
    {"level": 2, "name": "简单", "letter_range": "5-6", "base_score": 20, "color": "#2196F3"},
    {"level": 3, "name": "中等", "letter_range": "7-8", "base_score": 30, "color": "#FFC107"},
    {"level": 4, "name": "困难", "letter_range": "9-10", "base_score": 40, "color": "#FF9800"},
    {"level": 5, "name": "专家", "letter_range": "11+", "base_score": 50, "color": "#F44336"}
  ]
}
```
