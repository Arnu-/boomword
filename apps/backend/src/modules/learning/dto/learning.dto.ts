import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, IsEnum, IsArray, IsBoolean, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

// 掌握度枚举
export enum MasteryLevel {
  NOT_LEARNED = 'not_learned', // 未学习
  LEARNING = 'learning', // 学习中
  MASTERED = 'mastered', // 已掌握
  NEED_REVIEW = 'need_review', // 需复习
}

// 时间范围枚举
export enum TimeRange {
  TODAY = 'today',
  WEEK = 'week',
  MONTH = 'month',
  YEAR = 'year',
  ALL = 'all',
}

// 学习总览 DTO
export class LearningOverviewDto {
  @ApiProperty({
    description: '用户学习的词库列表',
    type: 'array',
    items: { type: 'object' },
  })
  wordBanks: Array<{
    id: string;
    name: string;
    totalWords: number;
    learnedCount: number;
    masteredCount: number;
    progress: number;
    lastStudyAt: Date | null;
  }>;

  @ApiProperty({ description: '总体统计', type: 'object' })
  statistics: {
    totalWords: number;
    masteredCount: number;
    learningCount: number;
    needReviewCount: number;
    streakDays: number;
    longestStreak: number;
    totalStudyDays: number;
    totalStudyTime: number;
  };

  @ApiProperty({ description: '今日数据', type: 'object' })
  today: {
    wordsLearned: number;
    newWords: number;
    reviewedWords: number;
    score: number;
    duration: number;
    gamesPlayed: number;
    accuracy: number;
  };

  @ApiProperty({ description: '每日目标', type: 'object' })
  dailyGoal: {
    target: number;
    completed: number;
    percentage: number;
    isCompleted: boolean;
  };
}

// 学习统计查询 DTO
export class QueryLearningStatsDto {
  @ApiPropertyOptional({ description: '时间范围', enum: TimeRange })
  @IsOptional()
  @IsEnum(TimeRange)
  range?: TimeRange = TimeRange.WEEK;

  @ApiPropertyOptional({ description: '自定义天数' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(365)
  days?: number;

  @ApiPropertyOptional({ description: '词库ID' })
  @IsOptional()
  @IsString()
  wordBankId?: string;
}

// 每日统计数据
export class DailyStatsDto {
  @ApiProperty({ description: '日期' })
  date: string;

  @ApiProperty({ description: '学习单词数' })
  wordsLearned: number;

  @ApiProperty({ description: '新学单词数' })
  newWords: number;

  @ApiProperty({ description: '复习单词数' })
  reviewedWords: number;

  @ApiProperty({ description: '获得分数' })
  score: number;

  @ApiProperty({ description: '学习时长（秒）' })
  duration: number;

  @ApiProperty({ description: '游戏次数' })
  gamesPlayed: number;

  @ApiProperty({ description: '正确单词数' })
  correctWords: number;

  @ApiProperty({ description: '错误单词数' })
  wrongWords: number;

  @ApiProperty({ description: '正确率' })
  accuracy: number;
}

// 学习热力图数据
export class HeatmapDataDto {
  @ApiProperty({ description: '日期' })
  date: string;

  @ApiProperty({ description: '学习单词数' })
  count: number;

  @ApiProperty({ description: '强度等级 (0-4)' })
  level: number;
}

// 学习趋势数据
export class LearningTrendDto {
  @ApiProperty({ description: '时间段', type: 'object' })
  period: {
    start: string;
    end: string;
    days: number;
  };

  @ApiProperty({ description: '总计', type: 'object' })
  totals: {
    wordsLearned: number;
    newWords: number;
    reviewedWords: number;
    score: number;
    duration: number;
    gamesPlayed: number;
    accuracy: number;
  };

  @ApiProperty({ description: '日均数据', type: 'object' })
  averages: {
    wordsPerDay: number;
    scorePerDay: number;
    durationPerDay: number;
    gamesPerDay: number;
  };

  @ApiProperty({ description: '对比上一周期', type: 'object' })
  comparison: {
    wordsChange: number;
    scoreChange: number;
    durationChange: number;
    trend: 'up' | 'down' | 'stable';
  };

  @ApiProperty({ description: '每日数据', type: [DailyStatsDto] })
  daily: DailyStatsDto[];
}

// 单词掌握度分布
export class MasteryDistributionDto {
  @ApiProperty({ description: '未学习' })
  notLearned: number;

  @ApiProperty({ description: '学习中' })
  learning: number;

  @ApiProperty({ description: '已掌握' })
  mastered: number;

  @ApiProperty({ description: '需复习' })
  needReview: number;

  @ApiProperty({ description: '总计' })
  total: number;

  @ApiProperty({ description: '掌握率' })
  masteryRate: number;
}

// 单词详情
export class WordDetailDto {
  @ApiProperty({ description: '单词ID' })
  id: string;

  @ApiProperty({ description: '英文' })
  english: string;

  @ApiProperty({ description: '中文' })
  chinese: string;

  @ApiProperty({ description: '音标' })
  phonetic: string | null;

  @ApiProperty({ description: '难度' })
  difficulty: number;

  @ApiProperty({ description: '掌握度', enum: MasteryLevel })
  mastery: MasteryLevel;

  @ApiProperty({ description: '正确次数' })
  correctCount: number;

  @ApiProperty({ description: '错误次数' })
  wrongCount: number;

  @ApiProperty({ description: '正确率' })
  accuracy: number;

  @ApiProperty({ description: '上次练习时间' })
  lastPracticeAt: Date | null;

  @ApiProperty({ description: '下次复习时间' })
  nextReviewAt: Date | null;

  @ApiPropertyOptional({ description: '是否在错词本中' })
  inWrongBook?: boolean;
}

// 薄弱单词分析
export class WeakWordsAnalysisDto {
  @ApiProperty({
    description: '薄弱单词列表',
    type: 'array',
    items: { type: 'object' },
  })
  words: Array<{
    id: string;
    english: string;
    chinese: string;
    wrongCount: number;
    accuracy: number;
    lastWrongAt: Date;
  }>;

  @ApiProperty({
    description: '错误模式分析',
    type: 'object',
  })
  patterns: {
    commonMistakes: Array<{
      pattern: string;
      count: number;
      examples: string[];
    }>;
    weakCategories: Array<{
      category: string;
      accuracy: number;
    }>;
  };

  @ApiProperty({ description: '建议', type: [String] })
  suggestions: string[];
}

// 复习提醒
export class ReviewReminderDto {
  @ApiProperty({ description: '今日需复习单词数' })
  todayReviewCount: number;

  @ApiProperty({ description: '过期未复习单词数' })
  overdueCount: number;

  @ApiProperty({ description: '即将需要复习单词数（未来3天）' })
  upcomingCount: number;

  @ApiProperty({
    description: '需复习的单词列表',
    type: 'array',
    items: { type: 'object' },
  })
  words: Array<{
    id: string;
    english: string;
    chinese: string;
    dueDate: Date;
    daysOverdue: number;
  }>;
}

// 学习报告
export class LearningReportDto {
  @ApiProperty({ description: '报告周期', type: 'object' })
  period: {
    type: 'weekly' | 'monthly';
    start: string;
    end: string;
  };

  @ApiProperty({ description: '学习概览', type: 'object' })
  summary: {
    totalWords: number;
    newWords: number;
    reviewedWords: number;
    masteredWords: number;
    totalTime: number;
    totalGames: number;
    avgAccuracy: number;
    streakDays: number;
  };

  @ApiProperty({ description: '成长对比', type: 'object' })
  growth: {
    wordsGrowth: number;
    accuracyGrowth: number;
    timeGrowth: number;
  };

  @ApiProperty({
    description: '亮点成就',
    type: 'array',
    items: { type: 'object' },
  })
  highlights: Array<{
    type: string;
    title: string;
    value: string;
    icon: string;
  }>;

  @ApiProperty({ description: '改进建议', type: [String] })
  suggestions: string[];

  @ApiProperty({
    description: '词库进度',
    type: 'array',
    items: { type: 'object' },
  })
  wordBankProgress: Array<{
    name: string;
    progress: number;
    change: number;
  }>;
}

// 错词本查询 DTO
export class QueryWrongBookDto {
  @ApiPropertyOptional({ description: '词库ID' })
  @IsOptional()
  @IsString()
  wordBankId?: string;

  @ApiPropertyOptional({ description: '排序方式', enum: ['wrongCount', 'recent', 'difficulty'] })
  @IsOptional()
  @IsString()
  sortBy?: 'wrongCount' | 'recent' | 'difficulty';

  @ApiPropertyOptional({ description: '最小错误次数' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  minWrongCount?: number;

  @ApiPropertyOptional({ description: '页码' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: '每页数量' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

// 错词练习选项 DTO
export class WrongBookPracticeDto {
  @ApiPropertyOptional({ description: '指定单词ID列表' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  wordIds?: string[];

  @ApiPropertyOptional({ description: '练习数量' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(5)
  @Max(50)
  limit?: number = 20;

  @ApiPropertyOptional({ description: '只练习高频错词' })
  @IsOptional()
  @IsBoolean()
  frequentOnly?: boolean;

  @ApiPropertyOptional({ description: '是否随机顺序' })
  @IsOptional()
  @IsBoolean()
  shuffle?: boolean = true;
}

// 每日目标设置 DTO
export class SetDailyGoalDto {
  @ApiProperty({ description: '每日目标单词数' })
  @Type(() => Number)
  @IsInt()
  @Min(10)
  @Max(500)
  wordsTarget: number;

  @ApiPropertyOptional({ description: '每日目标时长（分钟）' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(5)
  @Max(240)
  durationTarget?: number;
}
