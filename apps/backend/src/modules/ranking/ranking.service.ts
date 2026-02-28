import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { RedisService } from '../../shared/redis/redis.service';
import {
  RankingType,
  RankingScope,
  RankingItemDto,
  RankingResponseDto,
  MyRankResponseDto,
  TopRankingResponseDto,
  FriendsRankingResponseDto,
} from './dto';

// Redis Key 前缀常量
const RANKING_KEYS = {
  GLOBAL_WEEKLY: (week: string) => `ranking:global:weekly:${week}`,
  GLOBAL_MONTHLY: (year: number, month: number) => `ranking:global:monthly:${year}:${month}`,
  GLOBAL_TOTAL: 'ranking:global:total',
  SECTION: (sectionId: string, mode: string) => `ranking:section:${sectionId}:${mode}`,
  WORDBANK: (wordBankId: string) => `ranking:wordbank:${wordBankId}`,
  TOP_CACHE: (type: RankingType) => `ranking:cache:top:${type}`,
  USER_INFO_CACHE: (userId: string) => `ranking:cache:user:${userId}`,
};

// 缓存过期时间（秒）
const CACHE_TTL = {
  TOP_RANKING: 60, // Top排行榜缓存1分钟
  USER_INFO: 300, // 用户信息缓存5分钟
  WEEKLY: 7 * 24 * 60 * 60, // 周榜7天
  MONTHLY: 35 * 24 * 60 * 60, // 月榜35天
};

// 用户排行信息接口
interface UserRankInfo {
  id: string;
  nickname: string;
  avatarUrl: string | null;
  level: number;
  title: string | null;
}

@Injectable()
export class RankingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  // ==================== 全局排行榜 ====================

  /**
   * 获取全局排行榜
   */
  async getGlobalRanking(
    type: RankingType,
    currentUserId: string,
    page: number = 1,
    limit: number = 50,
  ): Promise<RankingResponseDto> {
    const key = this.getGlobalRankingKey(type);
    const start = (page - 1) * limit;
    const end = start + limit - 1;

    const client = this.redis.getClient();

    // 获取排行数据
    const rankings = await client.zrevrange(key, start, end, 'WITHSCORES');

    // 解析排行数据
    const { userIds, scoreMap } = this.parseRankingData(rankings);

    // 批量获取用户信息
    const userInfoMap = await this.batchGetUserInfo(userIds);

    // 构建排行榜项目
    const items = this.buildRankingItems(userIds, scoreMap, userInfoMap, start, currentUserId);

    // 获取总人数
    const total = await client.zcard(key);

    // 获取当前用户排名
    const myRank = await this.getUserRankAndScore(key, currentUserId);

    return {
      type,
      scope: RankingScope.GLOBAL,
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      myRank,
    };
  }

  /**
   * 获取 Top N 排行榜（带缓存）
   */
  async getTopRanking(type: RankingType, topN: number = 10): Promise<TopRankingResponseDto> {
    const cacheKey = `${RANKING_KEYS.TOP_CACHE(type)}:${topN}`;

    // 尝试从缓存获取
    const cached = await this.redis.getJson<TopRankingResponseDto>(cacheKey);
    if (cached) {
      return cached;
    }

    const key = this.getGlobalRankingKey(type);
    const client = this.redis.getClient();

    // 获取 Top N
    const rankings = await client.zrevrange(key, 0, topN - 1, 'WITHSCORES');
    const { userIds, scoreMap } = this.parseRankingData(rankings);
    const userInfoMap = await this.batchGetUserInfo(userIds);
    const items = this.buildRankingItems(userIds, scoreMap, userInfoMap, 0, '');

    const result: TopRankingResponseDto = {
      type,
      items,
      updatedAt: new Date(),
    };

    // 缓存结果
    await this.redis.setJson(cacheKey, result, CACHE_TTL.TOP_RANKING);

    return result;
  }

  /**
   * 获取用户在各排行榜的排名
   */
  async getMyRanking(userId: string): Promise<MyRankResponseDto> {
    const client = this.redis.getClient();

    const weeklyKey = this.getGlobalRankingKey(RankingType.WEEKLY);
    const monthlyKey = this.getGlobalRankingKey(RankingType.MONTHLY);
    const totalKey = this.getGlobalRankingKey(RankingType.TOTAL);

    // 并行获取所有排名
    const [weeklyData, monthlyData, totalData, weeklyTotal, monthlyTotal, allTotal] =
      await Promise.all([
        this.getUserRankAndScore(weeklyKey, userId),
        this.getUserRankAndScore(monthlyKey, userId),
        this.getUserRankAndScore(totalKey, userId),
        client.zcard(weeklyKey),
        client.zcard(monthlyKey),
        client.zcard(totalKey),
      ]);

    // 计算百分位
    const calculatePercentile = (rank: number | null, total: number): number | undefined => {
      if (rank === null || total === 0) return undefined;
      return Math.round(((total - rank) / total) * 100);
    };

    return {
      weekly: {
        ...weeklyData,
        percentile: calculatePercentile(weeklyData.rank, weeklyTotal),
      },
      monthly: {
        ...monthlyData,
        percentile: calculatePercentile(monthlyData.rank, monthlyTotal),
      },
      total: {
        ...totalData,
        percentile: calculatePercentile(totalData.rank, allTotal),
      },
    };
  }

  /**
   * 获取用户附近的排名
   */
  async getNearbyRanking(
    type: RankingType,
    userId: string,
    range: number = 5,
  ): Promise<RankingResponseDto> {
    const key = this.getGlobalRankingKey(type);
    const client = this.redis.getClient();

    // 获取用户排名
    const rank = await client.zrevrank(key, userId);
    if (rank === null) {
      return {
        type,
        scope: RankingScope.GLOBAL,
        items: [],
        pagination: { page: 1, limit: range * 2 + 1, total: 0, totalPages: 0 },
        myRank: { rank: null, score: 0 },
      };
    }

    // 计算范围
    const start = Math.max(0, rank - range);
    const end = rank + range;

    // 获取附近排名
    const rankings = await client.zrevrange(key, start, end, 'WITHSCORES');
    const { userIds, scoreMap } = this.parseRankingData(rankings);
    const userInfoMap = await this.batchGetUserInfo(userIds);
    const items = this.buildRankingItems(userIds, scoreMap, userInfoMap, start, userId);

    const total = await client.zcard(key);
    const myScore = await client.zscore(key, userId);

    return {
      type,
      scope: RankingScope.GLOBAL,
      items,
      pagination: {
        page: 1,
        limit: items.length,
        total,
        totalPages: 1,
      },
      myRank: {
        rank: rank + 1,
        score: myScore ? parseInt(myScore, 10) : 0,
      },
    };
  }

  // ==================== 关卡排行榜 ====================

  /**
   * 获取小节排行榜
   */
  async getSectionRanking(
    sectionId: string,
    currentUserId: string,
    mode: 'practice' | 'challenge' | 'speed' = 'challenge',
    page: number = 1,
    limit: number = 50,
  ): Promise<RankingResponseDto> {
    // 验证小节存在
    const section = await this.prisma.section.findUnique({
      where: { id: sectionId },
      select: { id: true, name: true },
    });

    if (!section) {
      throw new NotFoundException('小节不存在');
    }

    const key = RANKING_KEYS.SECTION(sectionId, mode);
    const start = (page - 1) * limit;
    const end = start + limit - 1;

    const client = this.redis.getClient();

    // 获取排行数据
    const rankings = await client.zrevrange(key, start, end, 'WITHSCORES');
    const { userIds, scoreMap } = this.parseRankingData(rankings);
    const userInfoMap = await this.batchGetUserInfo(userIds);
    const items = this.buildRankingItems(userIds, scoreMap, userInfoMap, start, currentUserId);

    const total = await client.zcard(key);
    const myRank = await this.getUserRankAndScore(key, currentUserId);

    return {
      type: RankingType.TOTAL, // 关卡排行榜使用总榜
      scope: RankingScope.SECTION,
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      myRank,
    };
  }

  /**
   * 更新小节排行榜分数
   */
  async updateSectionRankingScore(
    userId: string,
    sectionId: string,
    mode: string,
    score: number,
  ): Promise<void> {
    const key = RANKING_KEYS.SECTION(sectionId, mode);
    const client = this.redis.getClient();

    // 获取当前最高分
    const currentScore = await client.zscore(key, userId);
    const current = currentScore ? parseInt(currentScore, 10) : 0;

    // 只有新分数更高时才更新（最高分排行）
    if (score > current) {
      await client.zadd(key, score, userId);
    }
  }

  /**
   * 获取词库排行榜
   */
  async getWordBankRanking(
    wordBankId: string,
    currentUserId: string,
    page: number = 1,
    limit: number = 50,
  ): Promise<RankingResponseDto> {
    // 验证词库存在
    const wordBank = await this.prisma.wordBank.findUnique({
      where: { id: wordBankId },
      select: { id: true, name: true },
    });

    if (!wordBank) {
      throw new NotFoundException('词库不存在');
    }

    const key = RANKING_KEYS.WORDBANK(wordBankId);
    const start = (page - 1) * limit;
    const end = start + limit - 1;

    const client = this.redis.getClient();

    const rankings = await client.zrevrange(key, start, end, 'WITHSCORES');
    const { userIds, scoreMap } = this.parseRankingData(rankings);
    const userInfoMap = await this.batchGetUserInfo(userIds);
    const items = this.buildRankingItems(userIds, scoreMap, userInfoMap, start, currentUserId);

    const total = await client.zcard(key);
    const myRank = await this.getUserRankAndScore(key, currentUserId);

    return {
      type: RankingType.TOTAL,
      scope: RankingScope.WORDBANK,
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      myRank,
    };
  }

  /**
   * 更新词库排行榜分数（累计分数）
   */
  async updateWordBankRankingScore(
    userId: string,
    wordBankId: string,
    score: number,
  ): Promise<void> {
    const key = RANKING_KEYS.WORDBANK(wordBankId);
    await this.redis.zincrby(key, score, userId);
  }

  // ==================== 好友排行榜 ====================

  /**
   * 获取好友排行榜
   */
  async getFriendsRanking(
    userId: string,
    type: RankingType,
  ): Promise<FriendsRankingResponseDto> {
    // 获取用户的好友列表
    const friendships = await this.prisma.friendship.findMany({
      where: {
        OR: [
          { userId, status: 'accepted' },
          { friendId: userId, status: 'accepted' },
        ],
      },
      select: {
        userId: true,
        friendId: true,
      },
    });

    // 提取好友ID列表（包括自己）
    const friendIds = new Set<string>();
    friendIds.add(userId); // 包含自己
    friendships.forEach((f) => {
      friendIds.add(f.userId === userId ? f.friendId : f.userId);
    });

    const friendIdList = Array.from(friendIds);

    if (friendIdList.length === 0) {
      return {
        type,
        items: [],
        myRankAmongFriends: null,
        totalFriends: 0,
      };
    }

    const key = this.getGlobalRankingKey(type);
    const client = this.redis.getClient();

    // 获取所有好友的分数
    const scores: Array<{ id: string; score: number }> = [];
    for (const friendId of friendIdList) {
      const score = await client.zscore(key, friendId);
      scores.push({
        id: friendId,
        score: score ? parseInt(score, 10) : 0,
      });
    }

    // 按分数排序
    scores.sort((a, b) => b.score - a.score);

    // 获取用户信息
    const userInfoMap = await this.batchGetUserInfo(friendIdList);

    // 构建排行榜项目
    const items: RankingItemDto[] = scores.map((item, index) => {
      const userInfo = userInfoMap.get(item.id);
      return {
        rank: index + 1,
        userId: item.id,
        nickname: userInfo?.nickname || '未知用户',
        avatarUrl: userInfo?.avatarUrl || null,
        level: userInfo?.level || 1,
        title: userInfo?.title || null,
        score: item.score,
        isCurrentUser: item.id === userId,
      };
    });

    // 找出当前用户在好友中的排名
    const myRankAmongFriends = items.findIndex((item) => item.userId === userId) + 1;

    return {
      type,
      items,
      myRankAmongFriends: myRankAmongFriends || null,
      totalFriends: friendIdList.length - 1, // 不包括自己
    };
  }

  // ==================== 分数更新 ====================

  /**
   * 更新用户全局排行榜分数
   */
  async updateGlobalScore(userId: string, score: number): Promise<void> {
    const now = new Date();
    const client = this.redis.getClient();

    const weeklyKey = this.getGlobalRankingKey(RankingType.WEEKLY);
    const monthlyKey = this.getGlobalRankingKey(RankingType.MONTHLY);
    const totalKey = this.getGlobalRankingKey(RankingType.TOTAL);

    // 更新分数（累加）
    await Promise.all([
      client.zincrby(weeklyKey, score, userId),
      client.zincrby(monthlyKey, score, userId),
      client.zincrby(totalKey, score, userId),
    ]);

    // 设置过期时间
    await Promise.all([
      client.expire(weeklyKey, CACHE_TTL.WEEKLY),
      client.expire(monthlyKey, CACHE_TTL.MONTHLY),
    ]);

    // 清除 Top 排行榜缓存（因为排名可能变化）
    await this.clearTopRankingCache();
  }

  /**
   * 综合更新分数（全局 + 小节 + 词库）
   */
  async updateAllRankingScores(
    userId: string,
    sectionId: string,
    mode: string,
    score: number,
  ): Promise<void> {
    // 获取小节对应的词库ID
    const section = await this.prisma.section.findUnique({
      where: { id: sectionId },
      include: {
        chapter: {
          select: { wordBankId: true },
        },
      },
    });

    if (!section) return;

    await Promise.all([
      this.updateGlobalScore(userId, score),
      this.updateSectionRankingScore(userId, sectionId, mode, score),
      this.updateWordBankRankingScore(userId, section.chapter.wordBankId, score),
    ]);
  }

  // ==================== 排行榜统计 ====================

  /**
   * 获取排行榜统计信息
   */
  async getRankingStats(type: RankingType): Promise<{
    type: RankingType;
    totalUsers: number;
    totalScore: number;
    averageScore: number;
    topScore: number;
  }> {
    const key = this.getGlobalRankingKey(type);
    const client = this.redis.getClient();

    const totalUsers = await client.zcard(key);

    if (totalUsers === 0) {
      return {
        type,
        totalUsers: 0,
        totalScore: 0,
        averageScore: 0,
        topScore: 0,
      };
    }

    // 获取最高分
    const topEntry = await client.zrevrange(key, 0, 0, 'WITHSCORES');
    const topScore = topEntry.length >= 2 ? parseInt(topEntry[1], 10) : 0;

    // 计算总分（使用 Lua 脚本更高效，这里简化处理）
    // 实际生产环境可以用定时任务预计算
    const allScores = await client.zrange(key, 0, -1, 'WITHSCORES');
    let totalScore = 0;
    for (let i = 1; i < allScores.length; i += 2) {
      totalScore += parseInt(allScores[i], 10);
    }

    return {
      type,
      totalUsers,
      totalScore,
      averageScore: Math.round(totalScore / totalUsers),
      topScore,
    };
  }

  /**
   * 获取用户历史最佳排名
   */
  async getUserBestRank(userId: string): Promise<{
    weekly: { bestRank: number | null; achievedAt: Date | null };
    monthly: { bestRank: number | null; achievedAt: Date | null };
  }> {
    // 这个功能需要额外的数据存储来跟踪历史排名
    // 这里返回一个简化版本，实际可以用定时任务记录每日排名
    const cacheKey = `ranking:history:best:${userId}`;
    const cached = await this.redis.getJson<{
      weekly: { bestRank: number | null; achievedAt: string | null };
      monthly: { bestRank: number | null; achievedAt: string | null };
    }>(cacheKey);

    if (cached) {
      return {
        weekly: {
          bestRank: cached.weekly.bestRank,
          achievedAt: cached.weekly.achievedAt ? new Date(cached.weekly.achievedAt) : null,
        },
        monthly: {
          bestRank: cached.monthly.bestRank,
          achievedAt: cached.monthly.achievedAt ? new Date(cached.monthly.achievedAt) : null,
        },
      };
    }

    return {
      weekly: { bestRank: null, achievedAt: null },
      monthly: { bestRank: null, achievedAt: null },
    };
  }

  /**
   * 记录用户当前排名（用于历史追踪，由定时任务调用）
   */
  async recordUserRankHistory(userId: string): Promise<void> {
    const currentRanks = await this.getMyRanking(userId);
    const cacheKey = `ranking:history:best:${userId}`;

    const existing = await this.redis.getJson<{
      weekly: { bestRank: number | null; achievedAt: string | null };
      monthly: { bestRank: number | null; achievedAt: string | null };
    }>(cacheKey);

    const now = new Date().toISOString();
    const newData = {
      weekly: {
        bestRank: existing?.weekly.bestRank || currentRanks.weekly.rank,
        achievedAt: existing?.weekly.achievedAt || now,
      },
      monthly: {
        bestRank: existing?.monthly.bestRank || currentRanks.monthly.rank,
        achievedAt: existing?.monthly.achievedAt || now,
      },
    };

    // 更新最佳排名
    if (currentRanks.weekly.rank !== null) {
      if (newData.weekly.bestRank === null || currentRanks.weekly.rank < newData.weekly.bestRank) {
        newData.weekly.bestRank = currentRanks.weekly.rank;
        newData.weekly.achievedAt = now;
      }
    }

    if (currentRanks.monthly.rank !== null) {
      if (newData.monthly.bestRank === null || currentRanks.monthly.rank < newData.monthly.bestRank) {
        newData.monthly.bestRank = currentRanks.monthly.rank;
        newData.monthly.achievedAt = now;
      }
    }

    await this.redis.setJson(cacheKey, newData, 90 * 24 * 60 * 60); // 保存90天
  }

  // ==================== 私有方法 ====================

  /**
   * 获取全局排行榜 Redis Key
   */
  private getGlobalRankingKey(type: RankingType): string {
    const now = new Date();

    switch (type) {
      case RankingType.WEEKLY:
        return RANKING_KEYS.GLOBAL_WEEKLY(this.getWeekNumber(now));
      case RankingType.MONTHLY:
        return RANKING_KEYS.GLOBAL_MONTHLY(now.getFullYear(), now.getMonth() + 1);
      case RankingType.TOTAL:
        return RANKING_KEYS.GLOBAL_TOTAL;
    }
  }

  /**
   * 解析 Redis 排行榜数据
   */
  private parseRankingData(rankings: string[]): {
    userIds: string[];
    scoreMap: Map<string, number>;
  } {
    const userIds: string[] = [];
    const scoreMap = new Map<string, number>();

    for (let i = 0; i < rankings.length; i += 2) {
      const userId = rankings[i];
      const score = parseInt(rankings[i + 1], 10);
      userIds.push(userId);
      scoreMap.set(userId, score);
    }

    return { userIds, scoreMap };
  }

  /**
   * 批量获取用户信息（带缓存）
   */
  private async batchGetUserInfo(userIds: string[]): Promise<Map<string, UserRankInfo>> {
    if (userIds.length === 0) {
      return new Map();
    }

    const result = new Map<string, UserRankInfo>();
    const uncachedIds: string[] = [];

    // 先从缓存获取
    for (const userId of userIds) {
      const cached = await this.redis.getJson<UserRankInfo>(RANKING_KEYS.USER_INFO_CACHE(userId));
      if (cached) {
        result.set(userId, cached);
      } else {
        uncachedIds.push(userId);
      }
    }

    // 从数据库获取未缓存的用户信息
    if (uncachedIds.length > 0) {
      const users = await this.prisma.user.findMany({
        where: { id: { in: uncachedIds } },
        select: {
          id: true,
          nickname: true,
          avatarUrl: true,
          level: {
            select: {
              level: true,
              title: true,
            },
          },
        },
      });

      // 缓存并添加到结果
      for (const user of users) {
        const userInfo: UserRankInfo = {
          id: user.id,
          nickname: user.nickname,
          avatarUrl: user.avatarUrl,
          level: user.level?.level || 1,
          title: user.level?.title || null,
        };
        result.set(user.id, userInfo);

        // 缓存用户信息
        await this.redis.setJson(
          RANKING_KEYS.USER_INFO_CACHE(user.id),
          userInfo,
          CACHE_TTL.USER_INFO,
        );
      }
    }

    return result;
  }

  /**
   * 构建排行榜项目列表
   */
  private buildRankingItems(
    userIds: string[],
    scoreMap: Map<string, number>,
    userInfoMap: Map<string, UserRankInfo>,
    startRank: number,
    currentUserId: string,
  ): RankingItemDto[] {
    return userIds.map((userId, index) => {
      const userInfo = userInfoMap.get(userId);
      return {
        rank: startRank + index + 1,
        userId,
        nickname: userInfo?.nickname || '未知用户',
        avatarUrl: userInfo?.avatarUrl || null,
        level: userInfo?.level || 1,
        title: userInfo?.title || null,
        score: scoreMap.get(userId) || 0,
        isCurrentUser: userId === currentUserId,
      };
    });
  }

  /**
   * 获取用户排名和分数
   */
  private async getUserRankAndScore(
    key: string,
    userId: string,
  ): Promise<{ rank: number | null; score: number }> {
    const client = this.redis.getClient();
    const [rank, score] = await Promise.all([
      client.zrevrank(key, userId),
      client.zscore(key, userId),
    ]);

    return {
      rank: rank !== null ? rank + 1 : null,
      score: score ? parseInt(score, 10) : 0,
    };
  }

  /**
   * 清除 Top 排行榜缓存
   */
  private async clearTopRankingCache(): Promise<void> {
    await Promise.all([
      this.redis.del(`${RANKING_KEYS.TOP_CACHE(RankingType.WEEKLY)}:10`),
      this.redis.del(`${RANKING_KEYS.TOP_CACHE(RankingType.WEEKLY)}:50`),
      this.redis.del(`${RANKING_KEYS.TOP_CACHE(RankingType.MONTHLY)}:10`),
      this.redis.del(`${RANKING_KEYS.TOP_CACHE(RankingType.MONTHLY)}:50`),
      this.redis.del(`${RANKING_KEYS.TOP_CACHE(RankingType.TOTAL)}:10`),
      this.redis.del(`${RANKING_KEYS.TOP_CACHE(RankingType.TOTAL)}:50`),
    ]);
  }

  /**
   * 获取周数
   */
  private getWeekNumber(date: Date): string {
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const days = Math.floor(
      (date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000),
    );
    const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
    return `${date.getFullYear()}:${weekNumber}`;
  }
}
