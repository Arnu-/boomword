# 数据库架构设计

## 1. 概述

### 1.1 数据库选型

| 类型 | 选型 | 版本 | 用途 |
|------|------|------|------|
| 主数据库 | PostgreSQL | 15+ | 核心业务数据 |
| 缓存数据库 | Redis | 7+ | 缓存/会话/排行榜 |
| 文件存储 | 阿里云OSS | - | 音频/图片文件 |

### 1.2 设计原则

1. **UUID主键** - 分布式友好，避免自增ID冲突
2. **软删除** - 使用 `deleted_at` 字段标记删除
3. **时间戳** - 所有表包含 `created_at` 和 `updated_at`
4. **命名规范** - 使用 snake_case 命名
5. **索引优化** - 根据查询模式建立合适索引

---

## 2. Prisma Schema

### 2.1 完整 Schema 定义

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================
// 用户模块
// ============================================

model User {
  id           String    @id @default(uuid())
  phone        String?   @unique
  email        String?   @unique
  passwordHash String?   @map("password_hash")
  nickname     String    @db.VarChar(50)
  avatarUrl    String?   @map("avatar_url") @db.VarChar(500)
  gender       Gender    @default(unknown)
  grade        String?   @db.VarChar(20)
  role         Role      @default(user)
  status       UserStatus @default(active)
  isGuest      Boolean   @default(false) @map("is_guest")
  deviceId     String?   @map("device_id") @db.VarChar(100)
  lastLoginAt  DateTime? @map("last_login_at")
  lastLoginIp  String?   @map("last_login_ip") @db.VarChar(50)
  createdAt    DateTime  @default(now()) @map("created_at")
  updatedAt    DateTime  @updatedAt @map("updated_at")
  deletedAt    DateTime? @map("deleted_at")

  // 关联
  level         UserLevel?
  tokens        UserToken[]
  userWordBanks UserWordBank[]
  userSections  UserSection[]
  userWords     UserWord[]
  wrongBooks    WrongBook[]
  gameRecords   GameRecord[]
  achievements  UserAchievement[]
  friends       Friend[]         @relation("UserFriends")
  friendOf      Friend[]         @relation("FriendOf")

  @@index([phone])
  @@index([email])
  @@index([status])
  @@index([createdAt])
  @@map("users")
}

enum Gender {
  male
  female
  unknown
}

enum Role {
  user
  admin
  super_admin
}

enum UserStatus {
  pending
  active
  locked
  banned
  deleted
}

model UserLevel {
  id              String   @id @default(uuid())
  userId          String   @unique @map("user_id")
  level           Int      @default(1)
  currentExp      Int      @default(0) @map("current_exp")
  totalExp        Int      @default(0) @map("total_exp")
  title           String?  @db.VarChar(50)
  consecutiveDays Int      @default(0) @map("consecutive_days")
  longestStreak   Int      @default(0) @map("longest_streak")
  lastSignDate    DateTime? @map("last_sign_date") @db.Date
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([level])
  @@map("user_levels")
}

model UserToken {
  id           String   @id @default(uuid())
  userId       String   @map("user_id")
  token        String   @db.VarChar(500)
  refreshToken String   @map("refresh_token") @db.VarChar(500)
  deviceInfo   String?  @map("device_info") @db.VarChar(200)
  expiresAt    DateTime @map("expires_at")
  createdAt    DateTime @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([token])
  @@map("user_tokens")
}

// ============================================
// 词库模块
// ============================================

model Category {
  id          String     @id @default(uuid())
  parentId    String?    @map("parent_id")
  name        String     @db.VarChar(100)
  code        String     @unique @db.VarChar(50)
  description String?    @db.VarChar(500)
  icon        String?    @db.VarChar(200)
  sort        Int        @default(0)
  isActive    Boolean    @default(true) @map("is_active")
  createdAt   DateTime   @default(now()) @map("created_at")
  updatedAt   DateTime   @updatedAt @map("updated_at")

  parent    Category?   @relation("CategoryTree", fields: [parentId], references: [id])
  children  Category[]  @relation("CategoryTree")
  wordBanks WordBank[]

  @@index([parentId])
  @@index([code])
  @@index([sort])
  @@map("categories")
}

model WordBank {
  id           String   @id @default(uuid())
  categoryId   String   @map("category_id")
  name         String   @db.VarChar(100)
  code         String   @unique @db.VarChar(50)
  description  String?  @db.VarChar(500)
  coverImage   String?  @map("cover_image") @db.VarChar(500)
  wordCount    Int      @default(0) @map("word_count")
  chapterCount Int      @default(0) @map("chapter_count")
  difficulty   Int      @default(1)
  sort         Int      @default(0)
  isActive     Boolean  @default(true) @map("is_active")
  isFree       Boolean  @default(true) @map("is_free")
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  category      Category       @relation(fields: [categoryId], references: [id])
  chapters      Chapter[]
  userWordBanks UserWordBank[]

  @@index([categoryId])
  @@index([code])
  @@index([sort])
  @@map("word_banks")
}

model Word {
  id              String   @id @default(uuid())
  english         String   @db.VarChar(100)
  chinese         String   @db.VarChar(200)
  phonetic        String?  @db.VarChar(100)
  audioUrl        String?  @map("audio_url") @db.VarChar(500)
  difficulty      Int      @default(1)
  exampleSentence String?  @map("example_sentence") @db.VarChar(500)
  exampleChinese  String?  @map("example_chinese") @db.VarChar(500)
  tags            String[] @default([])
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  sectionWords SectionWord[]
  userWords    UserWord[]
  wrongBooks   WrongBook[]

  @@unique([english, chinese])
  @@index([english])
  @@index([difficulty])
  @@map("words")
}

// ============================================
// 关卡模块
// ============================================

model Chapter {
  id          String   @id @default(uuid())
  wordBankId  String   @map("word_bank_id")
  name        String   @db.VarChar(100)
  description String?  @db.VarChar(500)
  order       Int      @default(0)
  wordCount   Int      @default(0) @map("word_count")
  isActive    Boolean  @default(true) @map("is_active")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  wordBank WordBank  @relation(fields: [wordBankId], references: [id], onDelete: Cascade)
  sections Section[]

  @@unique([wordBankId, order])
  @@index([wordBankId])
  @@map("chapters")
}

model Section {
  id          String   @id @default(uuid())
  chapterId   String   @map("chapter_id")
  name        String   @db.VarChar(100)
  order       Int      @default(0)
  wordCount   Int      @default(0) @map("word_count")
  timeLimit   Int      @default(0) @map("time_limit")
  isActive    Boolean  @default(true) @map("is_active")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  chapter      Chapter       @relation(fields: [chapterId], references: [id], onDelete: Cascade)
  sectionWords SectionWord[]
  userSections UserSection[]
  gameRecords  GameRecord[]

  @@unique([chapterId, order])
  @@index([chapterId])
  @@map("sections")
}

model SectionWord {
  id        String   @id @default(uuid())
  sectionId String   @map("section_id")
  wordId    String   @map("word_id")
  order     Int      @default(0)
  createdAt DateTime @default(now()) @map("created_at")

  section Section @relation(fields: [sectionId], references: [id], onDelete: Cascade)
  word    Word    @relation(fields: [wordId], references: [id], onDelete: Cascade)

  @@unique([sectionId, wordId])
  @@index([sectionId])
  @@index([wordId])
  @@map("section_words")
}

// ============================================
// 用户进度模块
// ============================================

model UserWordBank {
  id           String   @id @default(uuid())
  userId       String   @map("user_id")
  wordBankId   String   @map("word_bank_id")
  learnedCount Int      @default(0) @map("learned_count")
  masteredCount Int     @default(0) @map("mastered_count")
  progress     Float    @default(0)
  lastStudyAt  DateTime? @map("last_study_at")
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  user     User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  wordBank WordBank @relation(fields: [wordBankId], references: [id], onDelete: Cascade)

  @@unique([userId, wordBankId])
  @@index([userId])
  @@index([wordBankId])
  @@map("user_word_banks")
}

model UserSection {
  id                 String   @id @default(uuid())
  userId             String   @map("user_id")
  sectionId          String   @map("section_id")
  unlocked           Boolean  @default(false)
  practiceCompleted  Boolean  @default(false) @map("practice_completed")
  practiceStars      Int      @default(0) @map("practice_stars")
  practiceBestScore  Int      @default(0) @map("practice_best_score")
  challengeCompleted Boolean  @default(false) @map("challenge_completed")
  challengeStars     Int      @default(0) @map("challenge_stars")
  challengeBestScore Int      @default(0) @map("challenge_best_score")
  speedCompleted     Boolean  @default(false) @map("speed_completed")
  speedStars         Int      @default(0) @map("speed_stars")
  speedBestScore     Int      @default(0) @map("speed_best_score")
  playCount          Int      @default(0) @map("play_count")
  createdAt          DateTime @default(now()) @map("created_at")
  updatedAt          DateTime @updatedAt @map("updated_at")

  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  section Section @relation(fields: [sectionId], references: [id], onDelete: Cascade)

  @@unique([userId, sectionId])
  @@index([userId])
  @@index([sectionId])
  @@map("user_sections")
}

model UserWord {
  id             String    @id @default(uuid())
  userId         String    @map("user_id")
  wordId         String    @map("word_id")
  mastery        Mastery   @default(not_learned)
  correctCount   Int       @default(0) @map("correct_count")
  wrongCount     Int       @default(0) @map("wrong_count")
  lastPracticeAt DateTime? @map("last_practice_at")
  nextReviewAt   DateTime? @map("next_review_at")
  createdAt      DateTime  @default(now()) @map("created_at")
  updatedAt      DateTime  @updatedAt @map("updated_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  word Word @relation(fields: [wordId], references: [id], onDelete: Cascade)

  @@unique([userId, wordId])
  @@index([userId])
  @@index([wordId])
  @@index([mastery])
  @@map("user_words")
}

enum Mastery {
  not_learned
  learning
  mastered
  need_review
}

// ============================================
// 游戏记录模块
// ============================================

model GameRecord {
  id           String   @id @default(uuid())
  userId       String   @map("user_id")
  sectionId    String   @map("section_id")
  mode         GameMode
  score        Int      @default(0)
  stars        Int      @default(0)
  correctCount Int      @default(0) @map("correct_count")
  wrongCount   Int      @default(0) @map("wrong_count")
  totalCount   Int      @default(0) @map("total_count")
  maxCombo     Int      @default(0) @map("max_combo")
  accuracy     Float    @default(0)
  timeUsed     Int      @default(0) @map("time_used")
  createdAt    DateTime @default(now()) @map("created_at")

  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  section Section @relation(fields: [sectionId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([sectionId])
  @@index([createdAt])
  @@index([mode])
  @@map("game_records")
}

enum GameMode {
  practice
  challenge
  speed
}

// ============================================
// 错词本模块
// ============================================

model WrongBook {
  id         String   @id @default(uuid())
  userId     String   @map("user_id")
  wordId     String   @map("word_id")
  wrongCount Int      @default(1) @map("wrong_count")
  isRemoved  Boolean  @default(false) @map("is_removed")
  createdAt  DateTime @default(now()) @map("created_at")
  updatedAt  DateTime @updatedAt @map("updated_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  word Word @relation(fields: [wordId], references: [id], onDelete: Cascade)

  @@unique([userId, wordId])
  @@index([userId])
  @@index([wordId])
  @@map("wrong_books")
}

// ============================================
// 成就模块
// ============================================

model Achievement {
  id          String          @id @default(uuid())
  code        String          @unique @db.VarChar(50)
  name        String          @db.VarChar(100)
  description String          @db.VarChar(500)
  icon        String          @db.VarChar(200)
  type        AchievementType
  condition   Json
  expReward   Int             @default(0) @map("exp_reward")
  sort        Int             @default(0)
  isActive    Boolean         @default(true) @map("is_active")
  createdAt   DateTime        @default(now()) @map("created_at")
  updatedAt   DateTime        @updatedAt @map("updated_at")

  userAchievements UserAchievement[]

  @@index([type])
  @@index([code])
  @@map("achievements")
}

enum AchievementType {
  learning
  game
  social
}

model UserAchievement {
  id            String   @id @default(uuid())
  userId        String   @map("user_id")
  achievementId String   @map("achievement_id")
  unlockedAt    DateTime @default(now()) @map("unlocked_at")

  user        User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  achievement Achievement @relation(fields: [achievementId], references: [id], onDelete: Cascade)

  @@unique([userId, achievementId])
  @@index([userId])
  @@index([achievementId])
  @@map("user_achievements")
}

// ============================================
// 好友模块
// ============================================

model Friend {
  id        String       @id @default(uuid())
  userId    String       @map("user_id")
  friendId  String       @map("friend_id")
  status    FriendStatus @default(pending)
  createdAt DateTime     @default(now()) @map("created_at")
  updatedAt DateTime     @updatedAt @map("updated_at")

  user   User @relation("UserFriends", fields: [userId], references: [id], onDelete: Cascade)
  friend User @relation("FriendOf", fields: [friendId], references: [id], onDelete: Cascade)

  @@unique([userId, friendId])
  @@index([userId])
  @@index([friendId])
  @@map("friends")
}

enum FriendStatus {
  pending
  accepted
  rejected
  blocked
}

// ============================================
// 系统配置模块
// ============================================

model SystemConfig {
  id        String   @id @default(uuid())
  key       String   @unique @db.VarChar(100)
  value     Json
  remark    String?  @db.VarChar(500)
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@map("system_configs")
}
```

---

## 3. 索引策略

### 3.1 索引设计原则

| 原则 | 说明 |
|------|------|
| 查询优先 | 根据常用查询建立索引 |
| 避免过多 | 每表索引不超过5-6个 |
| 复合索引 | 多条件查询使用复合索引 |
| 覆盖索引 | 高频查询尽量使用覆盖索引 |

### 3.2 核心表索引

```sql
-- users 表索引
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_created_at ON users(created_at);

-- game_records 表索引
CREATE INDEX idx_game_records_user_id ON game_records(user_id);
CREATE INDEX idx_game_records_section_id ON game_records(section_id);
CREATE INDEX idx_game_records_created_at ON game_records(created_at);
CREATE INDEX idx_game_records_user_mode ON game_records(user_id, mode);
CREATE INDEX idx_game_records_user_score ON game_records(user_id, score DESC);

-- user_sections 表索引
CREATE INDEX idx_user_sections_user_id ON user_sections(user_id);
CREATE INDEX idx_user_sections_section_id ON user_sections(section_id);

-- words 表索引
CREATE INDEX idx_words_english ON words(english);
CREATE INDEX idx_words_difficulty ON words(difficulty);
```

---

## 4. 数据分区策略

### 4.1 游戏记录表分区（按月）

```sql
-- 创建分区表
CREATE TABLE game_records (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    section_id VARCHAR(36) NOT NULL,
    mode VARCHAR(20) NOT NULL,
    score INTEGER DEFAULT 0,
    stars INTEGER DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) PARTITION BY RANGE (created_at);

-- 创建分区
CREATE TABLE game_records_2026_01 PARTITION OF game_records
    FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
    
CREATE TABLE game_records_2026_02 PARTITION OF game_records
    FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');

-- 自动创建分区的函数
CREATE OR REPLACE FUNCTION create_partition_if_not_exists(
    partition_date DATE
) RETURNS VOID AS $$
DECLARE
    partition_name TEXT;
    start_date DATE;
    end_date DATE;
BEGIN
    partition_name := 'game_records_' || TO_CHAR(partition_date, 'YYYY_MM');
    start_date := DATE_TRUNC('month', partition_date);
    end_date := start_date + INTERVAL '1 month';
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_class WHERE relname = partition_name
    ) THEN
        EXECUTE FORMAT(
            'CREATE TABLE %I PARTITION OF game_records FOR VALUES FROM (%L) TO (%L)',
            partition_name, start_date, end_date
        );
    END IF;
END;
$$ LANGUAGE plpgsql;
```

---

## 5. 读写分离方案

### 5.1 架构图

```
┌──────────────┐
│  Application │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   Prisma     │
│   Client     │
└──────┬───────┘
       │
       ├────────────────┐
       │                │
       ▼                ▼
┌──────────────┐  ┌──────────────┐
│    Master    │  │    Slave     │
│    (写)      │─→│    (读)      │
│  PostgreSQL  │  │  PostgreSQL  │
└──────────────┘  └──────────────┘
```

### 5.2 Prisma 读写分离配置

```typescript
// prisma/prisma.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService {
  private writeClient: PrismaClient;
  private readClient: PrismaClient;

  constructor() {
    // 写库连接
    this.writeClient = new PrismaClient({
      datasources: {
        db: { url: process.env.DATABASE_URL_WRITE },
      },
    });

    // 读库连接
    this.readClient = new PrismaClient({
      datasources: {
        db: { url: process.env.DATABASE_URL_READ },
      },
    });
  }

  // 获取写客户端
  get write(): PrismaClient {
    return this.writeClient;
  }

  // 获取读客户端
  get read(): PrismaClient {
    return this.readClient;
  }
}
```

---

## 6. 数据备份策略

### 6.1 备份方案

| 类型 | 频率 | 保留时间 | 存储位置 |
|------|------|----------|----------|
| 全量备份 | 每日 | 30天 | OSS |
| 增量备份 | 每小时 | 7天 | OSS |
| WAL归档 | 实时 | 7天 | OSS |

### 6.2 备份脚本

```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backup/postgresql"
DB_NAME="boomword"
S3_BUCKET="s3://boomword-backup"

# 全量备份
pg_dump -h localhost -U postgres -d $DB_NAME -F c -f "$BACKUP_DIR/full_$DATE.dump"

# 压缩
gzip "$BACKUP_DIR/full_$DATE.dump"

# 上传到OSS
aws s3 cp "$BACKUP_DIR/full_$DATE.dump.gz" "$S3_BUCKET/daily/"

# 清理30天前的备份
find $BACKUP_DIR -name "full_*.dump.gz" -mtime +30 -delete

echo "Backup completed: full_$DATE.dump.gz"
```

---

## 7. 数据迁移方案

### 7.1 Prisma 迁移命令

```bash
# 创建迁移
npx prisma migrate dev --name init

# 生产环境部署迁移
npx prisma migrate deploy

# 重置数据库（开发环境）
npx prisma migrate reset

# 生成 Prisma Client
npx prisma generate
```

### 7.2 迁移最佳实践

```typescript
// prisma/migrations/20260227000000_init/migration.sql

-- CreateTable
CREATE TABLE "users" (
    "id" VARCHAR(36) NOT NULL,
    "phone" VARCHAR(20),
    "email" VARCHAR(100),
    -- ...
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE INDEX "idx_users_status" ON "users"("status");
```

---

## 8. 数据种子

```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // 创建管理员用户
  const adminPassword = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@boomword.com' },
    update: {},
    create: {
      id: 'usr_admin_001',
      email: 'admin@boomword.com',
      passwordHash: adminPassword,
      nickname: '管理员',
      role: 'admin',
      status: 'active',
    },
  });

  // 创建词库分类
  const categories = [
    { code: 'primary', name: '小学英语', sort: 1 },
    { code: 'junior', name: '初中英语', sort: 2 },
    { code: 'senior', name: '高中英语', sort: 3 },
    { code: 'cet', name: '大学英语', sort: 4 },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { code: cat.code },
      update: {},
      create: {
        id: `cat_${cat.code}`,
        ...cat,
        isActive: true,
      },
    });
  }

  // 创建成就
  const achievements = [
    {
      code: 'first_game',
      name: '初出茅庐',
      description: '完成第一个小节',
      type: 'learning',
      condition: { type: 'section_complete', count: 1 },
      expReward: 10,
    },
    {
      code: 'streak_7',
      name: '持之以恒',
      description: '连续学习7天',
      type: 'learning',
      condition: { type: 'streak', days: 7 },
      expReward: 50,
    },
    {
      code: 'combo_50',
      name: '连击大师',
      description: '单局达成50连击',
      type: 'game',
      condition: { type: 'combo', count: 50 },
      expReward: 50,
    },
  ];

  for (const ach of achievements) {
    await prisma.achievement.upsert({
      where: { code: ach.code },
      update: {},
      create: {
        id: `ach_${ach.code}`,
        ...ach,
        icon: `/icons/achievements/${ach.code}.png`,
        isActive: true,
      },
    });
  }

  console.log('Seed completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

---

**文档版本**: v1.0  
**最后更新**: 2026-02-27
