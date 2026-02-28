import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

// 成就类型
export enum AchievementType {
  LEARNING = 'learning', // 学习类
  GAME = 'game', // 游戏类
  SOCIAL = 'social', // 社交类
  SPECIAL = 'special', // 特殊成就
}

// 成就稀有度
export enum AchievementRarity {
  COMMON = 'common', // 普通
  UNCOMMON = 'uncommon', // 不常见
  RARE = 'rare', // 稀有
  EPIC = 'epic', // 史诗
  LEGENDARY = 'legendary', // 传说
}

// 成就触发事件类型
export enum AchievementTrigger {
  GAME_END = 'game_end', // 游戏结束
  WORD_MASTERED = 'word_mastered', // 单词掌握
  LOGIN = 'login', // 登录
  LEVEL_UP = 'level_up', // 升级
  RANKING_CHANGE = 'ranking_change', // 排名变化
  FRIEND_ADD = 'friend_add', // 添加好友
  MANUAL = 'manual', // 手动检查
}

// 成就进度
export class AchievementProgressDto {
  @ApiProperty({ description: '当前进度值' })
  current: number;

  @ApiProperty({ description: '目标值' })
  target: number;

  @ApiProperty({ description: '完成百分比' })
  percentage: number;
}

// 成就详情
export class AchievementDetailDto {
  @ApiProperty({ description: '成就代码' })
  code: string;

  @ApiProperty({ description: '成就类型', enum: AchievementType })
  type: AchievementType;

  @ApiProperty({ description: '成就名称' })
  name: string;

  @ApiProperty({ description: '成就描述' })
  description: string;

  @ApiProperty({ description: '成就图标' })
  icon: string;

  @ApiProperty({ description: '稀有度', enum: AchievementRarity })
  rarity: AchievementRarity;

  @ApiProperty({ description: '经验值奖励' })
  expReward: number;

  @ApiProperty({ description: '是否已解锁' })
  isUnlocked: boolean;

  @ApiPropertyOptional({ description: '解锁时间' })
  unlockedAt?: Date;

  @ApiProperty({ description: '进度信息', type: AchievementProgressDto })
  progress: AchievementProgressDto;

  @ApiPropertyOptional({ description: '解锁百分比（有多少用户解锁了）' })
  unlockRate?: number;

  @ApiProperty({ description: '是否隐藏成就（未解锁时隐藏详情）' })
  isHidden: boolean;

  @ApiProperty({ description: '排序权重' })
  sort: number;
}

// 解锁通知
export class AchievementUnlockNotificationDto {
  @ApiProperty({ description: '成就代码' })
  code: string;

  @ApiProperty({ description: '成就名称' })
  name: string;

  @ApiProperty({ description: '成就描述' })
  description: string;

  @ApiProperty({ description: '成就图标' })
  icon: string;

  @ApiProperty({ description: '稀有度', enum: AchievementRarity })
  rarity: AchievementRarity;

  @ApiProperty({ description: '获得的经验值' })
  expReward: number;

  @ApiProperty({ description: '解锁时间' })
  unlockedAt: Date;

  @ApiPropertyOptional({ description: '是否是稀有成就' })
  isRare?: boolean;

  @ApiPropertyOptional({ description: '解锁语音提示文本' })
  announceText?: string;
}

// 成就统计
export class AchievementStatsDto {
  @ApiProperty({ description: '总成就数' })
  totalAchievements: number;

  @ApiProperty({ description: '已解锁成就数' })
  unlockedCount: number;

  @ApiProperty({ description: '完成百分比' })
  completionRate: number;

  @ApiProperty({ description: '总获得经验值' })
  totalExpEarned: number;

  @ApiProperty({ description: '按类型统计' })
  byType: Record<
    AchievementType,
    {
      total: number;
      unlocked: number;
      percentage: number;
    }
  >;

  @ApiProperty({ description: '按稀有度统计' })
  byRarity: Record<
    AchievementRarity,
    {
      total: number;
      unlocked: number;
      percentage: number;
    }
  >;

  @ApiProperty({ description: '最近解锁的成就' })
  recentUnlocks: AchievementUnlockNotificationDto[];
}

// 成就排行榜项
export class AchievementRankingItemDto {
  @ApiProperty({ description: '排名' })
  rank: number;

  @ApiProperty({ description: '用户ID' })
  userId: string;

  @ApiProperty({ description: '昵称' })
  nickname: string;

  @ApiProperty({ description: '头像URL' })
  avatarUrl: string | null;

  @ApiProperty({ description: '解锁成就数' })
  achievementCount: number;

  @ApiProperty({ description: '成就总经验' })
  totalExp: number;

  @ApiProperty({ description: '是否是当前用户' })
  isCurrentUser: boolean;

  @ApiPropertyOptional({ description: '最稀有的成就' })
  rarestAchievement?: {
    code: string;
    name: string;
    icon: string;
    rarity: AchievementRarity;
  };
}

// 查询成就列表 DTO
export class QueryAchievementsDto {
  @ApiPropertyOptional({ description: '成就类型', enum: AchievementType })
  @IsOptional()
  @IsEnum(AchievementType)
  type?: AchievementType;

  @ApiPropertyOptional({ description: '稀有度', enum: AchievementRarity })
  @IsOptional()
  @IsEnum(AchievementRarity)
  rarity?: AchievementRarity;

  @ApiPropertyOptional({ description: '是否只显示已解锁' })
  @IsOptional()
  unlockedOnly?: boolean;

  @ApiPropertyOptional({ description: '是否只显示未解锁' })
  @IsOptional()
  lockedOnly?: boolean;

  @ApiPropertyOptional({ description: '页码', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: '每页数量', default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 50;
}

// 成就检查结果
export class AchievementCheckResultDto {
  @ApiProperty({ description: '新解锁的成就列表' })
  newUnlocks: AchievementUnlockNotificationDto[];

  @ApiProperty({ description: '获得的总经验值' })
  totalExpEarned: number;

  @ApiProperty({ description: '接近解锁的成就（进度 > 80%）' })
  nearCompletion: Array<{
    code: string;
    name: string;
    icon: string;
    progress: AchievementProgressDto;
  }>;
}
