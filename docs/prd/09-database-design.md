# 数据库设计

## 1. 概述

### 1.1 数据库选型

| 类型 | 选型 | 用途 |
|------|------|------|
| 主数据库 | PostgreSQL 15+ | 核心业务数据存储 |
| 缓存 | Redis 7+ | 缓存、会话、排行榜 |
| 搜索 | Elasticsearch 8+ | 单词搜索（可选） |
| 文件存储 | 阿里云OSS | 音频、图片文件 |

### 1.2 设计原则

1. 使用UUID作为主键
2. 所有表包含created_at和updated_at字段
3. 软删除使用deleted_at字段
4. 使用下划线命名法(snake_case)
5. 外键字段命名为{table}_id
6. 索引命名为idx_{table}_{columns}

### 1.3 字符集与排序

- 字符集: UTF-8 (utf8mb4)
- 排序规则: utf8mb4_unicode_ci

---

## 2. ER图概览

```
┌─────────────────────────────────────────────────────────────────┐
│                         用户模块                                 │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │  users   │──│ user_levels  │  │ user_tokens  │              │
│  └──────────┘  └──────────────┘  └──────────────┘              │
│       │                                                         │
└───────┼─────────────────────────────────────────────────────────┘
        │
        │
┌───────┼─────────────────────────────────────────────────────────┐
│       │                  词库模块                                │
│       │    ┌─────────────┐  ┌────────┐  ┌──────────┐           │
│       │    │ categories  │──│ word   │──│ words    │           │
│       │    └─────────────┘  │ banks  │  └──────────┘           │
│       │                     └────────┘       │                  │
│       │                         │            │                  │
│       │                    ┌────────┐  ┌──────────┐            │
│       │                    │chapters│──│ sections │            │
│       │                    └────────┘  └──────────┘            │
│       │                                      │                  │
└───────┼──────────────────────────────────────┼──────────────────┘
        │                                      │
        │                                      │
┌───────┼──────────────────────────────────────┼──────────────────┐
│       │              学习进度模块             │                  │
│       │  ┌─────────────────┐  ┌─────────────────┐              │
│       └──│ user_word_banks │  │ user_sections   │              │
│          └─────────────────┘  └─────────────────┘              │
│                                      │                          │
│          ┌─────────────────┐  ┌─────────────────┐              │
│          │  user_words     │  │  game_records   │              │
│          └─────────────────┘  └─────────────────┘              │
│                    │                                            │
│          ┌─────────────────┐                                   │
│          │  wrong_book     │                                   │
│          └─────────────────┘                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. 用户模块表设计

### 3.1 users (用户表)

```sql
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    phone VARCHAR(20) UNIQUE,
    email VARCHAR(100) UNIQUE,
    password_hash VARCHAR(100),
    nickname VARCHAR(50) NOT NULL,
    avatar_url VARCHAR(500),
    gender VARCHAR(10) DEFAULT 'unknown',
    grade VARCHAR(20),
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    is_guest BOOLEAN NOT NULL DEFAULT FALSE,
    device_id VARCHAR(100),
    last_login_at TIMESTAMP,
    last_login_ip VARCHAR(50),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- 索引
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_users_is_guest ON users(is_guest);
```

**字段说明**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | VARCHAR(36) | 是 | 用户ID，格式: usr_{timestamp}{random} |
| phone | VARCHAR(20) | 否 | 手机号，唯一 |
| email | VARCHAR(100) | 否 | 邮箱，唯一 |
| password_hash | VARCHAR(100) | 否 | 密码哈希 |
| nickname | VARCHAR(50) | 是 | 昵称 |
| avatar_url | VARCHAR(500) | 否 | 头像URL |
| gender | VARCHAR(10) | 否 | 性别: male/female/unknown |
| grade | VARCHAR(20) | 否 | 年级 |
| status | VARCHAR(20) | 是 | 状态: pending/active/locked/banned/deleted |
| is_guest | BOOLEAN | 是 | 是否游客 |
| device_id | VARCHAR(100) | 否 | 游客设备ID |

### 3.2 user_levels (用户等级表)

```sql
CREATE TABLE user_levels (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL UNIQUE,
    level INTEGER NOT NULL DEFAULT 1,
    current_exp INTEGER NOT NULL DEFAULT 0,
    total_exp INTEGER NOT NULL DEFAULT 0,
    title VARCHAR(50),
    consecutive_days INTEGER NOT NULL DEFAULT 0,
    longest_streak INTEGER NOT NULL DEFAULT 0,
    last_sign_date DATE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 索引
CREATE INDEX idx_user_levels_user_id ON user_levels(user_id);
CREATE INDEX idx_user_levels_level ON user_levels(level);
```

### 3.3 user_tokens (用户Token表)

```sql
CREATE TABLE user_tokens (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    device_id VARCHAR(100),
    device_type VARCHAR(20),
    device_info JSONB,
    ip_address VARCHAR(50),
    expires_at TIMESTAMP NOT NULL,
    refresh_expires_at TIMESTAMP NOT NULL,
    is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 索引
CREATE INDEX idx_user_tokens_user_id ON user_tokens(user_id);
CREATE INDEX idx_user_tokens_access_token ON user_tokens(access_token);
CREATE INDEX idx_user_tokens_expires_at ON user_tokens(expires_at);
```

### 3.4 verification_codes (验证码表)

```sql
CREATE TABLE verification_codes (
    id VARCHAR(36) PRIMARY KEY,
    target VARCHAR(100) NOT NULL,
    target_type VARCHAR(10) NOT NULL,
    code VARCHAR(10) NOT NULL,
    purpose VARCHAR(20) NOT NULL,
    is_used BOOLEAN NOT NULL DEFAULT FALSE,
    attempts INTEGER NOT NULL DEFAULT 0,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX idx_verification_codes_target ON verification_codes(target, target_type);
CREATE INDEX idx_verification_codes_expires_at ON verification_codes(expires_at);
```

---

## 4. 词库模块表设计

### 4.1 categories (分类表)

```sql
CREATE TABLE categories (
    id VARCHAR(36) PRIMARY KEY,
    parent_id VARCHAR(36),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    type VARCHAR(20) NOT NULL,
    level INTEGER NOT NULL DEFAULT 1,
    sort_order INTEGER NOT NULL DEFAULT 0,
    icon_url VARCHAR(500),
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (parent_id) REFERENCES categories(id)
);

-- 索引
CREATE INDEX idx_categories_parent_id ON categories(parent_id);
CREATE INDEX idx_categories_type ON categories(type);
CREATE INDEX idx_categories_code ON categories(code);
CREATE INDEX idx_categories_sort_order ON categories(sort_order);
```

### 4.2 word_banks (词库表)

```sql
CREATE TABLE word_banks (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    code VARCHAR(50) UNIQUE,
    description TEXT,
    category_id VARCHAR(36) NOT NULL,
    category_path VARCHAR(500),
    tags JSONB,
    cover_url VARCHAR(500),
    word_count INTEGER NOT NULL DEFAULT 0,
    chapter_count INTEGER NOT NULL DEFAULT 0,
    section_count INTEGER NOT NULL DEFAULT 0,
    difficulty_avg DECIMAL(3,2) NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'draft',
    is_free BOOLEAN NOT NULL DEFAULT TRUE,
    price DECIMAL(10,2),
    sort_order INTEGER NOT NULL DEFAULT 0,
    study_count INTEGER NOT NULL DEFAULT 0,
    created_by VARCHAR(36),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMP,
    deleted_at TIMESTAMP,
    
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- 索引
CREATE INDEX idx_word_banks_category_id ON word_banks(category_id);
CREATE INDEX idx_word_banks_status ON word_banks(status);
CREATE INDEX idx_word_banks_sort_order ON word_banks(sort_order);
CREATE INDEX idx_word_banks_study_count ON word_banks(study_count);
CREATE INDEX idx_word_banks_tags ON word_banks USING GIN(tags);
```

### 4.3 words (单词表)

```sql
CREATE TABLE words (
    id VARCHAR(36) PRIMARY KEY,
    english VARCHAR(100) NOT NULL,
    chinese TEXT NOT NULL,
    phonetic_uk VARCHAR(100),
    phonetic_us VARCHAR(100),
    audio_uk_url VARCHAR(500),
    audio_us_url VARCHAR(500),
    difficulty INTEGER NOT NULL DEFAULT 1,
    letter_count INTEGER NOT NULL,
    base_score INTEGER NOT NULL DEFAULT 10,
    part_of_speech VARCHAR(20),
    example_sentence TEXT,
    example_chinese TEXT,
    example_audio_url VARCHAR(500),
    tags JSONB,
    synonyms JSONB,
    memory_tip TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- 索引
CREATE INDEX idx_words_english ON words(english);
CREATE INDEX idx_words_difficulty ON words(difficulty);
CREATE INDEX idx_words_tags ON words USING GIN(tags);

-- 全文搜索索引
CREATE INDEX idx_words_english_trgm ON words USING gin(english gin_trgm_ops);
CREATE INDEX idx_words_chinese_trgm ON words USING gin(chinese gin_trgm_ops);
```

### 4.4 word_bank_words (词库-单词关联表)

```sql
CREATE TABLE word_bank_words (
    id VARCHAR(36) PRIMARY KEY,
    word_bank_id VARCHAR(36) NOT NULL,
    word_id VARCHAR(36) NOT NULL,
    chapter_id VARCHAR(36),
    section_id VARCHAR(36),
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_key_word BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (word_bank_id) REFERENCES word_banks(id),
    FOREIGN KEY (word_id) REFERENCES words(id),
    
    UNIQUE(word_bank_id, word_id)
);

-- 索引
CREATE INDEX idx_word_bank_words_word_bank_id ON word_bank_words(word_bank_id);
CREATE INDEX idx_word_bank_words_word_id ON word_bank_words(word_id);
CREATE INDEX idx_word_bank_words_section_id ON word_bank_words(section_id);
```

### 4.5 chapters (章节表)

```sql
CREATE TABLE chapters (
    id VARCHAR(36) PRIMARY KEY,
    word_bank_id VARCHAR(36) NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    chapter_number INTEGER NOT NULL,
    word_count INTEGER NOT NULL DEFAULT 0,
    section_count INTEGER NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (word_bank_id) REFERENCES word_banks(id)
);

-- 索引
CREATE INDEX idx_chapters_word_bank_id ON chapters(word_bank_id);
CREATE INDEX idx_chapters_sort_order ON chapters(sort_order);
```

### 4.6 sections (小节表)

```sql
CREATE TABLE sections (
    id VARCHAR(36) PRIMARY KEY,
    chapter_id VARCHAR(36) NOT NULL,
    word_bank_id VARCHAR(36) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    section_number INTEGER NOT NULL,
    word_count INTEGER NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 0,
    practice_time_limit INTEGER,
    challenge_time_limit INTEGER NOT NULL DEFAULT 100,
    speed_time_limit INTEGER NOT NULL DEFAULT 50,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (chapter_id) REFERENCES chapters(id),
    FOREIGN KEY (word_bank_id) REFERENCES word_banks(id)
);

-- 索引
CREATE INDEX idx_sections_chapter_id ON sections(chapter_id);
CREATE INDEX idx_sections_word_bank_id ON sections(word_bank_id);
CREATE INDEX idx_sections_sort_order ON sections(sort_order);
```

---

## 5. 学习进度模块表设计

### 5.1 user_word_banks (用户词库进度表)

```sql
CREATE TABLE user_word_banks (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    word_bank_id VARCHAR(36) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'not_started',
    total_words INTEGER NOT NULL DEFAULT 0,
    learned_words INTEGER NOT NULL DEFAULT 0,
    mastered_words INTEGER NOT NULL DEFAULT 0,
    progress_percent DECIMAL(5,2) NOT NULL DEFAULT 0,
    total_chapters INTEGER NOT NULL DEFAULT 0,
    completed_chapters INTEGER NOT NULL DEFAULT 0,
    total_sections INTEGER NOT NULL DEFAULT 0,
    completed_sections INTEGER NOT NULL DEFAULT 0,
    total_stars INTEGER NOT NULL DEFAULT 0,
    earned_stars INTEGER NOT NULL DEFAULT 0,
    last_section_id VARCHAR(36),
    started_at TIMESTAMP,
    last_study_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (word_bank_id) REFERENCES word_banks(id),
    
    UNIQUE(user_id, word_bank_id)
);

-- 索引
CREATE INDEX idx_user_word_banks_user_id ON user_word_banks(user_id);
CREATE INDEX idx_user_word_banks_word_bank_id ON user_word_banks(word_bank_id);
CREATE INDEX idx_user_word_banks_status ON user_word_banks(status);
```

### 5.2 user_sections (用户小节进度表)

```sql
CREATE TABLE user_sections (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    section_id VARCHAR(36) NOT NULL,
    word_bank_id VARCHAR(36) NOT NULL,
    unlock_status VARCHAR(20) NOT NULL DEFAULT 'locked',
    
    -- 练习模式
    practice_unlocked BOOLEAN NOT NULL DEFAULT FALSE,
    practice_best_stars INTEGER NOT NULL DEFAULT 0,
    practice_best_score INTEGER NOT NULL DEFAULT 0,
    practice_best_accuracy DECIMAL(5,2) NOT NULL DEFAULT 0,
    practice_best_time INTEGER,
    practice_play_count INTEGER NOT NULL DEFAULT 0,
    practice_first_completed_at TIMESTAMP,
    practice_last_played_at TIMESTAMP,
    
    -- 挑战模式
    challenge_unlocked BOOLEAN NOT NULL DEFAULT FALSE,
    challenge_best_stars INTEGER NOT NULL DEFAULT 0,
    challenge_best_score INTEGER NOT NULL DEFAULT 0,
    challenge_best_accuracy DECIMAL(5,2) NOT NULL DEFAULT 0,
    challenge_best_time_remaining INTEGER NOT NULL DEFAULT 0,
    challenge_play_count INTEGER NOT NULL DEFAULT 0,
    challenge_first_completed_at TIMESTAMP,
    challenge_last_played_at TIMESTAMP,
    
    -- 速度挑战
    speed_unlocked BOOLEAN NOT NULL DEFAULT FALSE,
    speed_best_stars INTEGER NOT NULL DEFAULT 0,
    speed_best_score INTEGER NOT NULL DEFAULT 0,
    speed_best_accuracy DECIMAL(5,2) NOT NULL DEFAULT 0,
    speed_best_time_remaining INTEGER NOT NULL DEFAULT 0,
    speed_play_count INTEGER NOT NULL DEFAULT 0,
    speed_first_completed_at TIMESTAMP,
    speed_last_played_at TIMESTAMP,
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (section_id) REFERENCES sections(id),
    FOREIGN KEY (word_bank_id) REFERENCES word_banks(id),
    
    UNIQUE(user_id, section_id)
);

-- 索引
CREATE INDEX idx_user_sections_user_id ON user_sections(user_id);
CREATE INDEX idx_user_sections_section_id ON user_sections(section_id);
CREATE INDEX idx_user_sections_word_bank_id ON user_sections(word_bank_id);
```

### 5.3 user_words (用户单词学习记录表)

```sql
CREATE TABLE user_words (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    word_id VARCHAR(36) NOT NULL,
    mastery_level VARCHAR(20) NOT NULL DEFAULT 'not_learned',
    correct_count INTEGER NOT NULL DEFAULT 0,
    wrong_count INTEGER NOT NULL DEFAULT 0,
    consecutive_correct INTEGER NOT NULL DEFAULT 0,
    total_practice_count INTEGER NOT NULL DEFAULT 0,
    avg_response_time_ms INTEGER NOT NULL DEFAULT 0,
    first_learned_at TIMESTAMP,
    last_practiced_at TIMESTAMP,
    mastered_at TIMESTAMP,
    next_review_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (word_id) REFERENCES words(id),
    
    UNIQUE(user_id, word_id)
);

-- 索引
CREATE INDEX idx_user_words_user_id ON user_words(user_id);
CREATE INDEX idx_user_words_word_id ON user_words(word_id);
CREATE INDEX idx_user_words_mastery_level ON user_words(mastery_level);
CREATE INDEX idx_user_words_next_review_at ON user_words(next_review_at);
```

### 5.4 game_records (游戏记录表)

```sql
CREATE TABLE game_records (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    section_id VARCHAR(36) NOT NULL,
    word_bank_id VARCHAR(36) NOT NULL,
    game_mode VARCHAR(20) NOT NULL,
    
    -- 结果统计
    total_words INTEGER NOT NULL,
    correct_count INTEGER NOT NULL,
    wrong_count INTEGER NOT NULL,
    accuracy DECIMAL(5,2) NOT NULL,
    
    -- 分数
    base_score INTEGER NOT NULL DEFAULT 0,
    time_bonus INTEGER NOT NULL DEFAULT 0,
    combo_bonus INTEGER NOT NULL DEFAULT 0,
    deduction INTEGER NOT NULL DEFAULT 0,
    total_score INTEGER NOT NULL,
    stars_earned INTEGER NOT NULL DEFAULT 0,
    
    -- 时间
    time_limit INTEGER,
    time_used INTEGER NOT NULL,
    time_remaining INTEGER NOT NULL DEFAULT 0,
    
    -- 连击
    max_combo INTEGER NOT NULL DEFAULT 0,
    
    -- 详情
    word_details JSONB,
    
    started_at TIMESTAMP NOT NULL,
    finished_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (section_id) REFERENCES sections(id),
    FOREIGN KEY (word_bank_id) REFERENCES word_banks(id)
);

-- 索引
CREATE INDEX idx_game_records_user_id ON game_records(user_id);
CREATE INDEX idx_game_records_section_id ON game_records(section_id);
CREATE INDEX idx_game_records_word_bank_id ON game_records(word_bank_id);
CREATE INDEX idx_game_records_game_mode ON game_records(game_mode);
CREATE INDEX idx_game_records_total_score ON game_records(total_score);
CREATE INDEX idx_game_records_created_at ON game_records(created_at);
```

### 5.5 wrong_book_entries (错词本条目表)

```sql
CREATE TABLE wrong_book_entries (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    word_id VARCHAR(36) NOT NULL,
    source_type VARCHAR(20) NOT NULL DEFAULT 'auto',
    source_word_bank_id VARCHAR(36),
    source_section_id VARCHAR(36),
    wrong_count INTEGER NOT NULL DEFAULT 1,
    correct_count_after_added INTEGER NOT NULL DEFAULT 0,
    practice_count INTEGER NOT NULL DEFAULT 0,
    wrong_inputs JSONB,
    note TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'added',
    added_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_wrong_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    removed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (word_id) REFERENCES words(id),
    
    UNIQUE(user_id, word_id)
);

-- 索引
CREATE INDEX idx_wrong_book_entries_user_id ON wrong_book_entries(user_id);
CREATE INDEX idx_wrong_book_entries_word_id ON wrong_book_entries(word_id);
CREATE INDEX idx_wrong_book_entries_status ON wrong_book_entries(status);
CREATE INDEX idx_wrong_book_entries_added_at ON wrong_book_entries(added_at);
```

---

## 6. 统计模块表设计

### 6.1 user_daily_stats (用户每日统计表)

```sql
CREATE TABLE user_daily_stats (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    stat_date DATE NOT NULL,
    learning_time_seconds INTEGER NOT NULL DEFAULT 0,
    words_practiced INTEGER NOT NULL DEFAULT 0,
    new_words_learned INTEGER NOT NULL DEFAULT 0,
    games_played INTEGER NOT NULL DEFAULT 0,
    correct_count INTEGER NOT NULL DEFAULT 0,
    wrong_count INTEGER NOT NULL DEFAULT 0,
    accuracy DECIMAL(5,2) NOT NULL DEFAULT 0,
    exp_earned INTEGER NOT NULL DEFAULT 0,
    max_combo INTEGER NOT NULL DEFAULT 0,
    word_banks_practiced JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id),
    
    UNIQUE(user_id, stat_date)
);

-- 索引
CREATE INDEX idx_user_daily_stats_user_id ON user_daily_stats(user_id);
CREATE INDEX idx_user_daily_stats_stat_date ON user_daily_stats(stat_date);
CREATE INDEX idx_user_daily_stats_user_date ON user_daily_stats(user_id, stat_date);
```

### 6.2 user_total_stats (用户总计统计表)

```sql
CREATE TABLE user_total_stats (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL UNIQUE,
    total_learning_days INTEGER NOT NULL DEFAULT 0,
    total_learning_time_seconds INTEGER NOT NULL DEFAULT 0,
    total_words_learned INTEGER NOT NULL DEFAULT 0,
    total_words_mastered INTEGER NOT NULL DEFAULT 0,
    total_games_played INTEGER NOT NULL DEFAULT 0,
    total_correct_count INTEGER NOT NULL DEFAULT 0,
    total_wrong_count INTEGER NOT NULL DEFAULT 0,
    overall_accuracy DECIMAL(5,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 索引
CREATE INDEX idx_user_total_stats_user_id ON user_total_stats(user_id);
```

---

## 7. 社交模块表设计

### 7.1 rankings (排行榜表)

```sql
CREATE TABLE rankings (
    id VARCHAR(36) PRIMARY KEY,
    ranking_type VARCHAR(20) NOT NULL,
    period VARCHAR(20) NOT NULL,
    rank INTEGER NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    score BIGINT NOT NULL,
    games_played INTEGER NOT NULL DEFAULT 0,
    accuracy_avg DECIMAL(5,2) NOT NULL DEFAULT 0,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id),
    
    UNIQUE(ranking_type, period, user_id)
);

-- 索引
CREATE INDEX idx_rankings_type_period ON rankings(ranking_type, period);
CREATE INDEX idx_rankings_rank ON rankings(rank);
CREATE INDEX idx_rankings_user_id ON rankings(user_id);
CREATE INDEX idx_rankings_score ON rankings(score DESC);
```

### 7.2 section_rankings (关卡排行榜表)

```sql
CREATE TABLE section_rankings (
    id VARCHAR(36) PRIMARY KEY,
    section_id VARCHAR(36) NOT NULL,
    ranking_type VARCHAR(20) NOT NULL,
    rank INTEGER NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    score INTEGER NOT NULL,
    accuracy DECIMAL(5,2) NOT NULL,
    time_used INTEGER NOT NULL,
    combo_max INTEGER NOT NULL DEFAULT 0,
    achieved_at TIMESTAMP NOT NULL,
    
    FOREIGN KEY (section_id) REFERENCES sections(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    
    UNIQUE(section_id, ranking_type, user_id)
);

-- 索引
CREATE INDEX idx_section_rankings_section_id ON section_rankings(section_id);
CREATE INDEX idx_section_rankings_type ON section_rankings(ranking_type);
CREATE INDEX idx_section_rankings_rank ON section_rankings(rank);
```

### 7.3 achievements (成就定义表)

```sql
CREATE TABLE achievements (
    id VARCHAR(36) PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(20) NOT NULL,
    icon_url VARCHAR(500),
    icon_locked_url VARCHAR(500),
    exp_reward INTEGER NOT NULL DEFAULT 0,
    is_hidden BOOLEAN NOT NULL DEFAULT FALSE,
    condition_type VARCHAR(50) NOT NULL,
    condition_value JSONB NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX idx_achievements_category ON achievements(category);
CREATE INDEX idx_achievements_code ON achievements(code);
CREATE INDEX idx_achievements_sort_order ON achievements(sort_order);
```

### 7.4 user_achievements (用户成就记录表)

```sql
CREATE TABLE user_achievements (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    achievement_id VARCHAR(36) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'locked',
    progress_current INTEGER NOT NULL DEFAULT 0,
    progress_target INTEGER NOT NULL,
    progress_percent DECIMAL(5,2) NOT NULL DEFAULT 0,
    unlocked_at TIMESTAMP,
    claimed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (achievement_id) REFERENCES achievements(id),
    
    UNIQUE(user_id, achievement_id)
);

-- 索引
CREATE INDEX idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX idx_user_achievements_achievement_id ON user_achievements(achievement_id);
CREATE INDEX idx_user_achievements_status ON user_achievements(status);
```

### 7.5 friendships (好友关系表)

```sql
CREATE TABLE friendships (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    friend_id VARCHAR(36) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'accepted',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    accepted_at TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (friend_id) REFERENCES users(id),
    
    UNIQUE(user_id, friend_id)
);

-- 索引
CREATE INDEX idx_friendships_user_id ON friendships(user_id);
CREATE INDEX idx_friendships_friend_id ON friendships(friend_id);
CREATE INDEX idx_friendships_status ON friendships(status);
```

### 7.6 friend_requests (好友请求表)

```sql
CREATE TABLE friend_requests (
    id VARCHAR(36) PRIMARY KEY,
    from_user_id VARCHAR(36) NOT NULL,
    to_user_id VARCHAR(36) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    message TEXT,
    expires_at TIMESTAMP NOT NULL,
    handled_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (from_user_id) REFERENCES users(id),
    FOREIGN KEY (to_user_id) REFERENCES users(id)
);

-- 索引
CREATE INDEX idx_friend_requests_from_user_id ON friend_requests(from_user_id);
CREATE INDEX idx_friend_requests_to_user_id ON friend_requests(to_user_id);
CREATE INDEX idx_friend_requests_status ON friend_requests(status);
CREATE INDEX idx_friend_requests_expires_at ON friend_requests(expires_at);
```

### 7.7 user_activities (用户动态表)

```sql
CREATE TABLE user_activities (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    type VARCHAR(50) NOT NULL,
    content JSONB NOT NULL,
    like_count INTEGER NOT NULL DEFAULT 0,
    comment_count INTEGER NOT NULL DEFAULT 0,
    is_public BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 索引
CREATE INDEX idx_user_activities_user_id ON user_activities(user_id);
CREATE INDEX idx_user_activities_type ON user_activities(type);
CREATE INDEX idx_user_activities_created_at ON user_activities(created_at);
```

### 7.8 activity_likes (动态点赞表)

```sql
CREATE TABLE activity_likes (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    activity_id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (activity_id) REFERENCES user_activities(id),
    
    UNIQUE(user_id, activity_id)
);

-- 索引
CREATE INDEX idx_activity_likes_user_id ON activity_likes(user_id);
CREATE INDEX idx_activity_likes_activity_id ON activity_likes(activity_id);
```

---

## 8. 管理模块表设计

### 8.1 admins (管理员表)

```sql
CREATE TABLE admins (
    id VARCHAR(36) PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(100) NOT NULL,
    name VARCHAR(50) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20),
    avatar_url VARCHAR(500),
    role VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    last_login_at TIMESTAMP,
    last_login_ip VARCHAR(50),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX idx_admins_username ON admins(username);
CREATE INDEX idx_admins_role ON admins(role);
CREATE INDEX idx_admins_status ON admins(status);
```

### 8.2 admin_operation_logs (管理员操作日志表)

```sql
CREATE TABLE admin_operation_logs (
    id VARCHAR(36) PRIMARY KEY,
    admin_id VARCHAR(36) NOT NULL,
    admin_name VARCHAR(50) NOT NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id VARCHAR(36),
    description TEXT,
    request_data JSONB,
    response_data JSONB,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (admin_id) REFERENCES admins(id)
);

-- 索引
CREATE INDEX idx_admin_operation_logs_admin_id ON admin_operation_logs(admin_id);
CREATE INDEX idx_admin_operation_logs_action ON admin_operation_logs(action);
CREATE INDEX idx_admin_operation_logs_resource_type ON admin_operation_logs(resource_type);
CREATE INDEX idx_admin_operation_logs_created_at ON admin_operation_logs(created_at);
```

### 8.3 system_configs (系统配置表)

```sql
CREATE TABLE system_configs (
    id VARCHAR(36) PRIMARY KEY,
    key VARCHAR(100) NOT NULL UNIQUE,
    value JSONB NOT NULL,
    description TEXT,
    version INTEGER NOT NULL DEFAULT 1,
    effective_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(36),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX idx_system_configs_key ON system_configs(key);
CREATE INDEX idx_system_configs_effective_at ON system_configs(effective_at);
```

### 8.4 notices (公告表)

```sql
CREATE TABLE notices (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    type VARCHAR(20) NOT NULL,
    priority VARCHAR(20) NOT NULL DEFAULT 'normal',
    target_users VARCHAR(50) NOT NULL DEFAULT 'all',
    status VARCHAR(20) NOT NULL DEFAULT 'draft',
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    created_by VARCHAR(36) NOT NULL,
    published_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (created_by) REFERENCES admins(id)
);

-- 索引
CREATE INDEX idx_notices_status ON notices(status);
CREATE INDEX idx_notices_type ON notices(type);
CREATE INDEX idx_notices_start_time ON notices(start_time);
CREATE INDEX idx_notices_end_time ON notices(end_time);
```

---

## 9. 索引优化建议

### 9.1 复合索引

```sql
-- 用户词库进度查询
CREATE INDEX idx_uwb_user_status ON user_word_banks(user_id, status);

-- 游戏记录查询
CREATE INDEX idx_game_records_user_section_mode ON game_records(user_id, section_id, game_mode);

-- 排行榜查询
CREATE INDEX idx_rankings_type_period_rank ON rankings(ranking_type, period, rank);

-- 每日统计查询
CREATE INDEX idx_daily_stats_user_date ON user_daily_stats(user_id, stat_date DESC);
```

### 9.2 部分索引

```sql
-- 只索引活跃用户
CREATE INDEX idx_users_active ON users(id) WHERE status = 'active';

-- 只索引未删除的词库
CREATE INDEX idx_word_banks_not_deleted ON word_banks(id) WHERE deleted_at IS NULL;

-- 只索引待处理的好友请求
CREATE INDEX idx_friend_requests_pending ON friend_requests(to_user_id) WHERE status = 'pending';
```

---

## 10. 数据归档策略

### 10.1 归档规则

| 表 | 归档条件 | 保留时间 |
|-----|----------|----------|
| game_records | 180天前的记录 | 归档到历史表 |
| user_activities | 90天前的记录 | 归档到历史表 |
| admin_operation_logs | 365天前的记录 | 归档到历史表 |
| verification_codes | 过期的记录 | 7天后删除 |

### 10.2 归档表命名

```sql
-- 历史游戏记录
CREATE TABLE game_records_archive (LIKE game_records INCLUDING ALL);

-- 历史动态
CREATE TABLE user_activities_archive (LIKE user_activities INCLUDING ALL);
```

---

## 11. Redis数据结构设计

### 11.1 用户Token缓存

```
Key: user:token:{user_id}
Type: String
Value: {access_token}
TTL: 7 days
```

### 11.2 验证码缓存

```
Key: verification:{target_type}:{target}
Type: String
Value: {code}
TTL: 60 seconds
```

### 11.3 排行榜缓存

```
Key: ranking:{type}:{period}
Type: Sorted Set
Score: {score}
Member: {user_id}
```

### 11.4 游戏会话缓存

```
Key: game:session:{session_id}
Type: Hash
Fields: user_id, section_id, game_mode, status, words, score...
TTL: 1 hour
```

### 11.5 用户学习统计缓存

```
Key: user:stats:{user_id}
Type: Hash
Fields: total_days, total_time, total_words...
TTL: 5 minutes
```

### 11.6 频率限制

```
Key: rate_limit:{type}:{identifier}
Type: String (counter)
TTL: 根据限制类型设置
```
