import {
  IsEnum,
  IsOptional,
  IsString,
  IsInt,
  Min,
  Max,
  IsArray,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

// 排行榜类型
export enum RankingType {
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  TOTAL = 'total',
}

// 排行榜范围
export enum RankingScope {
  GLOBAL = 'global', // 全局排行
  SECTION = 'section', // 小节排行
  WORDBANK = 'wordbank', // 词库排行
  FRIENDS = 'friends', // 好友排行
}

// 查询排行榜 DTO
export class GetRankingDto {
  @ApiProperty({ description: '排行榜类型', enum: RankingType })
  @IsEnum(RankingType)
  type: RankingType;

  @ApiPropertyOptional({ description: '排行榜范围', enum: RankingScope, default: RankingScope.GLOBAL })
  @IsOptional()
  @IsEnum(RankingScope)
  scope?: RankingScope = RankingScope.GLOBAL;

  @ApiPropertyOptional({ description: '小节ID（scope为section时必填）' })
  @IsOptional()
  @IsString()
  sectionId?: string;

  @ApiPropertyOptional({ description: '词库ID（scope为wordbank时必填）' })
  @IsOptional()
  @IsString()
  wordBankId?: string;

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

// 获取附近排名 DTO
export class GetNearbyRankingDto {
  @ApiProperty({ description: '排行榜类型', enum: RankingType })
  @IsEnum(RankingType)
  type: RankingType;

  @ApiPropertyOptional({ description: '排行榜范围', enum: RankingScope, default: RankingScope.GLOBAL })
  @IsOptional()
  @IsEnum(RankingScope)
  scope?: RankingScope = RankingScope.GLOBAL;

  @ApiPropertyOptional({ description: '小节ID' })
  @IsOptional()
  @IsString()
  sectionId?: string;

  @ApiPropertyOptional({ description: '词库ID' })
  @IsOptional()
  @IsString()
  wordBankId?: string;

  @ApiPropertyOptional({ description: '前后各取多少名', default: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  range?: number = 5;
}

// 关卡排行榜查询 DTO
export class GetSectionRankingDto {
  @ApiProperty({ description: '小节ID' })
  @IsString()
  sectionId: string;

  @ApiPropertyOptional({ description: '游戏模式', enum: ['practice', 'challenge', 'speed'] })
  @IsOptional()
  @IsString()
  mode?: 'practice' | 'challenge' | 'speed';

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

// 排行榜项目
export class RankingItemDto {
  @ApiProperty({ description: '排名' })
  rank: number;

  @ApiProperty({ description: '用户ID' })
  userId: string;

  @ApiProperty({ description: '昵称' })
  nickname: string;

  @ApiProperty({ description: '头像URL', nullable: true })
  avatarUrl: string | null;

  @ApiProperty({ description: '等级' })
  level: number;

  @ApiProperty({ description: '称号', nullable: true })
  title: string | null;

  @ApiProperty({ description: '分数' })
  score: number;

  @ApiProperty({ description: '是否为当前用户' })
  isCurrentUser: boolean;
}

// 排行榜响应
export class RankingResponseDto {
  @ApiProperty({ description: '排行榜类型', enum: RankingType })
  type: RankingType;

  @ApiProperty({ description: '排行榜范围', enum: RankingScope })
  scope: RankingScope;

  @ApiProperty({ description: '排行榜列表', type: [RankingItemDto] })
  items: RankingItemDto[];

  @ApiProperty({ description: '分页信息' })
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };

  @ApiPropertyOptional({ description: '我的排名信息' })
  myRank?: {
    rank: number | null;
    score: number;
  };
}

// 我的排名响应
export class MyRankResponseDto {
  @ApiProperty({ description: '周排行' })
  weekly: {
    rank: number | null;
    score: number;
    percentile?: number; // 超过了百分之多少的用户
  };

  @ApiProperty({ description: '月排行' })
  monthly: {
    rank: number | null;
    score: number;
    percentile?: number;
  };

  @ApiProperty({ description: '总排行' })
  total: {
    rank: number | null;
    score: number;
    percentile?: number;
  };
}

// Top N 排行榜响应（用于缓存）
export class TopRankingResponseDto {
  @ApiProperty({ description: '排行榜类型', enum: RankingType })
  type: RankingType;

  @ApiProperty({ description: 'Top N 列表', type: [RankingItemDto] })
  items: RankingItemDto[];

  @ApiProperty({ description: '更新时间' })
  updatedAt: Date;
}

// 好友排行榜响应
export class FriendsRankingResponseDto {
  @ApiProperty({ description: '排行榜类型', enum: RankingType })
  type: RankingType;

  @ApiProperty({ description: '好友排行列表', type: [RankingItemDto] })
  items: RankingItemDto[];

  @ApiProperty({ description: '我的排名（在好友中）' })
  myRankAmongFriends: number | null;

  @ApiProperty({ description: '好友总数' })
  totalFriends: number;
}
