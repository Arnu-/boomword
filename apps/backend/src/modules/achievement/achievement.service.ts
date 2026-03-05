import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { RedisService } from '../../shared/redis/redis.service';
import { AchievementType as PrismaAchievementType } from '@prisma/client';
import {
  AchievementType,
  AchievementRarity,
  AchievementTrigger,
  AchievementDetailDto,
  AchievementUnlockNotificationDto,
  AchievementStatsDto,
  AchievementCheckResultDto,
  AchievementRankingItemDto,
  QueryAchievementsDto,
} from './dto';

// ==================== 成就定义 ====================

// 成就定义接口
interface AchievementDefinition {
  code: string;
  type: AchievementType;
  name: string;
  description: string;
  icon: string;
  rarity: AchievementRarity;
  expReward: number;
  condition: {
    type: string;
    value: number;
    extra?: Record<string, unknown>;
  };
  isHidden: boolean;
  sort: number;
  triggers: AchievementTrigger[];
}

// 经验奖励倍率（按稀有度）
const RARITY_EXP_MULTIPLIER: Record<AchievementRarity, number> = {
  [AchievementRarity.COMMON]: 1,
  [AchievementRarity.UNCOMMON]: 1.5,
  [AchievementRarity.RARE]: 2,
  [AchievementRarity.EPIC]: 3,
  [AchievementRarity.LEGENDARY]: 5,
};

// 基础经验奖励
const BASE_EXP_REWARD = 10;

// 成就定义列表
const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  // ==================== 学习类成就 ====================
  // 单词掌握
  {
    code: 'words_10',
    type: AchievementType.LEARNING,
    name: '初学乍练',
    description: '掌握10个单词',
    icon: '📚',
    rarity: AchievementRarity.COMMON,
    expReward: 10,
    condition: { type: 'masteredWords', value: 10 },
    isHidden: false,
    sort: 100,
    triggers: [AchievementTrigger.WORD_MASTERED, AchievementTrigger.GAME_END],
  },
  {
    code: 'words_50',
    type: AchievementType.LEARNING,
    name: '小有所成',
    description: '掌握50个单词',
    icon: '📖',
    rarity: AchievementRarity.COMMON,
    expReward: 25,
    condition: { type: 'masteredWords', value: 50 },
    isHidden: false,
    sort: 101,
    triggers: [AchievementTrigger.WORD_MASTERED, AchievementTrigger.GAME_END],
  },
  {
    code: 'words_100',
    type: AchievementType.LEARNING,
    name: '渐入佳境',
    description: '掌握100个单词',
    icon: '📕',
    rarity: AchievementRarity.UNCOMMON,
    expReward: 50,
    condition: { type: 'masteredWords', value: 100 },
    isHidden: false,
    sort: 102,
    triggers: [AchievementTrigger.WORD_MASTERED, AchievementTrigger.GAME_END],
  },
  {
    code: 'words_500',
    type: AchievementType.LEARNING,
    name: '学富五车',
    description: '掌握500个单词',
    icon: '🏆',
    rarity: AchievementRarity.RARE,
    expReward: 150,
    condition: { type: 'masteredWords', value: 500 },
    isHidden: false,
    sort: 103,
    triggers: [AchievementTrigger.WORD_MASTERED, AchievementTrigger.GAME_END],
  },
  {
    code: 'words_1000',
    type: AchievementType.LEARNING,
    name: '博学多才',
    description: '掌握1000个单词',
    icon: '👑',
    rarity: AchievementRarity.EPIC,
    expReward: 300,
    condition: { type: 'masteredWords', value: 1000 },
    isHidden: false,
    sort: 104,
    triggers: [AchievementTrigger.WORD_MASTERED, AchievementTrigger.GAME_END],
  },
  {
    code: 'words_5000',
    type: AchievementType.LEARNING,
    name: '词汇大师',
    description: '掌握5000个单词',
    icon: '💎',
    rarity: AchievementRarity.LEGENDARY,
    expReward: 1000,
    condition: { type: 'masteredWords', value: 5000 },
    isHidden: false,
    sort: 105,
    triggers: [AchievementTrigger.WORD_MASTERED, AchievementTrigger.GAME_END],
  },

  // 连续学习
  {
    code: 'streak_3',
    type: AchievementType.LEARNING,
    name: '持之以恒',
    description: '连续学习3天',
    icon: '🔥',
    rarity: AchievementRarity.COMMON,
    expReward: 15,
    condition: { type: 'streakDays', value: 3 },
    isHidden: false,
    sort: 200,
    triggers: [AchievementTrigger.LOGIN, AchievementTrigger.GAME_END],
  },
  {
    code: 'streak_7',
    type: AchievementType.LEARNING,
    name: '一周达人',
    description: '连续学习7天',
    icon: '⭐',
    rarity: AchievementRarity.UNCOMMON,
    expReward: 35,
    condition: { type: 'streakDays', value: 7 },
    isHidden: false,
    sort: 201,
    triggers: [AchievementTrigger.LOGIN, AchievementTrigger.GAME_END],
  },
  {
    code: 'streak_30',
    type: AchievementType.LEARNING,
    name: '月度冠军',
    description: '连续学习30天',
    icon: '🌟',
    rarity: AchievementRarity.RARE,
    expReward: 150,
    condition: { type: 'streakDays', value: 30 },
    isHidden: false,
    sort: 202,
    triggers: [AchievementTrigger.LOGIN, AchievementTrigger.GAME_END],
  },
  {
    code: 'streak_100',
    type: AchievementType.LEARNING,
    name: '百日坚持',
    description: '连续学习100天',
    icon: '💎',
    rarity: AchievementRarity.EPIC,
    expReward: 500,
    condition: { type: 'streakDays', value: 100 },
    isHidden: false,
    sort: 203,
    triggers: [AchievementTrigger.LOGIN, AchievementTrigger.GAME_END],
  },
  {
    code: 'streak_365',
    type: AchievementType.LEARNING,
    name: '全年无休',
    description: '连续学习365天',
    icon: '🏆',
    rarity: AchievementRarity.LEGENDARY,
    expReward: 2000,
    condition: { type: 'streakDays', value: 365 },
    isHidden: false,
    sort: 204,
    triggers: [AchievementTrigger.LOGIN, AchievementTrigger.GAME_END],
  },

  // ==================== 游戏类成就 ====================
  // 累计分数
  {
    code: 'score_1000',
    type: AchievementType.GAME,
    name: '初露锋芒',
    description: '累计获得1000分',
    icon: '🎯',
    rarity: AchievementRarity.COMMON,
    expReward: 10,
    condition: { type: 'totalScore', value: 1000 },
    isHidden: false,
    sort: 300,
    triggers: [AchievementTrigger.GAME_END],
  },
  {
    code: 'score_10000',
    type: AchievementType.GAME,
    name: '势如破竹',
    description: '累计获得10000分',
    icon: '🎖️',
    rarity: AchievementRarity.UNCOMMON,
    expReward: 50,
    condition: { type: 'totalScore', value: 10000 },
    isHidden: false,
    sort: 301,
    triggers: [AchievementTrigger.GAME_END],
  },
  {
    code: 'score_100000',
    type: AchievementType.GAME,
    name: '登峰造极',
    description: '累计获得100000分',
    icon: '🏅',
    rarity: AchievementRarity.RARE,
    expReward: 200,
    condition: { type: 'totalScore', value: 100000 },
    isHidden: false,
    sort: 302,
    triggers: [AchievementTrigger.GAME_END],
  },
  {
    code: 'score_1000000',
    type: AchievementType.GAME,
    name: '分数王者',
    description: '累计获得1000000分',
    icon: '👑',
    rarity: AchievementRarity.LEGENDARY,
    expReward: 1000,
    condition: { type: 'totalScore', value: 1000000 },
    isHidden: false,
    sort: 303,
    triggers: [AchievementTrigger.GAME_END],
  },

  // 三星成就
  {
    code: 'perfect_1',
    type: AchievementType.GAME,
    name: '完美首秀',
    description: '首次获得三星',
    icon: '⭐',
    rarity: AchievementRarity.COMMON,
    expReward: 15,
    condition: { type: 'perfectGames', value: 1 },
    isHidden: false,
    sort: 400,
    triggers: [AchievementTrigger.GAME_END],
  },
  {
    code: 'perfect_10',
    type: AchievementType.GAME,
    name: '精益求精',
    description: '获得10次三星',
    icon: '🌟',
    rarity: AchievementRarity.UNCOMMON,
    expReward: 50,
    condition: { type: 'perfectGames', value: 10 },
    isHidden: false,
    sort: 401,
    triggers: [AchievementTrigger.GAME_END],
  },
  {
    code: 'perfect_50',
    type: AchievementType.GAME,
    name: '追求卓越',
    description: '获得50次三星',
    icon: '✨',
    rarity: AchievementRarity.RARE,
    expReward: 150,
    condition: { type: 'perfectGames', value: 50 },
    isHidden: false,
    sort: 402,
    triggers: [AchievementTrigger.GAME_END],
  },
  {
    code: 'perfect_100',
    type: AchievementType.GAME,
    name: '完美主义者',
    description: '获得100次三星',
    icon: '💫',
    rarity: AchievementRarity.EPIC,
    expReward: 300,
    condition: { type: 'perfectGames', value: 100 },
    isHidden: false,
    sort: 403,
    triggers: [AchievementTrigger.GAME_END],
  },

  // 游戏次数
  {
    code: 'games_10',
    type: AchievementType.GAME,
    name: '初试身手',
    description: '完成10次游戏',
    icon: '🎮',
    rarity: AchievementRarity.COMMON,
    expReward: 10,
    condition: { type: 'totalGames', value: 10 },
    isHidden: false,
    sort: 500,
    triggers: [AchievementTrigger.GAME_END],
  },
  {
    code: 'games_100',
    type: AchievementType.GAME,
    name: '游戏达人',
    description: '完成100次游戏',
    icon: '🕹️',
    rarity: AchievementRarity.UNCOMMON,
    expReward: 50,
    condition: { type: 'totalGames', value: 100 },
    isHidden: false,
    sort: 501,
    triggers: [AchievementTrigger.GAME_END],
  },
  {
    code: 'games_500',
    type: AchievementType.GAME,
    name: '游戏大师',
    description: '完成500次游戏',
    icon: '🎲',
    rarity: AchievementRarity.RARE,
    expReward: 150,
    condition: { type: 'totalGames', value: 500 },
    isHidden: false,
    sort: 502,
    triggers: [AchievementTrigger.GAME_END],
  },
  {
    code: 'games_1000',
    type: AchievementType.GAME,
    name: '游戏狂人',
    description: '完成1000次游戏',
    icon: '🏆',
    rarity: AchievementRarity.EPIC,
    expReward: 500,
    condition: { type: 'totalGames', value: 1000 },
    isHidden: false,
    sort: 503,
    triggers: [AchievementTrigger.GAME_END],
  },

  // 连击成就
  {
    code: 'combo_10',
    type: AchievementType.GAME,
    name: '小试牛刀',
    description: '单局达到10连击',
    icon: '🔥',
    rarity: AchievementRarity.COMMON,
    expReward: 15,
    condition: { type: 'maxCombo', value: 10 },
    isHidden: false,
    sort: 600,
    triggers: [AchievementTrigger.GAME_END],
  },
  {
    code: 'combo_25',
    type: AchievementType.GAME,
    name: '连击高手',
    description: '单局达到25连击',
    icon: '💥',
    rarity: AchievementRarity.UNCOMMON,
    expReward: 40,
    condition: { type: 'maxCombo', value: 25 },
    isHidden: false,
    sort: 601,
    triggers: [AchievementTrigger.GAME_END],
  },
  {
    code: 'combo_50',
    type: AchievementType.GAME,
    name: '连击大师',
    description: '单局达到50连击',
    icon: '⚡',
    rarity: AchievementRarity.RARE,
    expReward: 100,
    condition: { type: 'maxCombo', value: 50 },
    isHidden: false,
    sort: 602,
    triggers: [AchievementTrigger.GAME_END],
  },
  {
    code: 'combo_100',
    type: AchievementType.GAME,
    name: '连击之王',
    description: '单局达到100连击',
    icon: '👑',
    rarity: AchievementRarity.EPIC,
    expReward: 300,
    condition: { type: 'maxCombo', value: 100 },
    isHidden: false,
    sort: 603,
    triggers: [AchievementTrigger.GAME_END],
  },

  // 速度挑战成就
  {
    code: 'speed_first',
    type: AchievementType.GAME,
    name: '速度新星',
    description: '首次完成速度挑战',
    icon: '🚀',
    rarity: AchievementRarity.COMMON,
    expReward: 20,
    condition: { type: 'speedGames', value: 1 },
    isHidden: false,
    sort: 700,
    triggers: [AchievementTrigger.GAME_END],
  },
  {
    code: 'speed_perfect',
    type: AchievementType.GAME,
    name: '闪电三星',
    description: '速度挑战获得三星',
    icon: '⚡',
    rarity: AchievementRarity.RARE,
    expReward: 100,
    condition: { type: 'speedPerfect', value: 1 },
    isHidden: false,
    sort: 701,
    triggers: [AchievementTrigger.GAME_END],
  },
  {
    code: 'speed_10',
    type: AchievementType.GAME,
    name: '速度达人',
    description: '完成10次速度挑战',
    icon: '🏎️',
    rarity: AchievementRarity.UNCOMMON,
    expReward: 60,
    condition: { type: 'speedGames', value: 10 },
    isHidden: false,
    sort: 702,
    triggers: [AchievementTrigger.GAME_END],
  },

  // 正确率成就
  {
    code: 'accuracy_100',
    type: AchievementType.GAME,
    name: '零失误',
    description: '单局100%正确率',
    icon: '🎯',
    rarity: AchievementRarity.UNCOMMON,
    expReward: 30,
    condition: { type: 'perfectAccuracy', value: 1 },
    isHidden: false,
    sort: 800,
    triggers: [AchievementTrigger.GAME_END],
  },
  {
    code: 'accuracy_100_10',
    type: AchievementType.GAME,
    name: '精准无误',
    description: '10次单局100%正确率',
    icon: '🏹',
    rarity: AchievementRarity.RARE,
    expReward: 100,
    condition: { type: 'perfectAccuracy', value: 10 },
    isHidden: false,
    sort: 801,
    triggers: [AchievementTrigger.GAME_END],
  },

  // ==================== 社交类成就 ====================
  {
    code: 'friend_1',
    type: AchievementType.SOCIAL,
    name: '初识好友',
    description: '添加第一个好友',
    icon: '👋',
    rarity: AchievementRarity.COMMON,
    expReward: 10,
    condition: { type: 'friendsCount', value: 1 },
    isHidden: false,
    sort: 900,
    triggers: [AchievementTrigger.FRIEND_ADD],
  },
  {
    code: 'friend_10',
    type: AchievementType.SOCIAL,
    name: '人缘不错',
    description: '拥有10个好友',
    icon: '👥',
    rarity: AchievementRarity.UNCOMMON,
    expReward: 30,
    condition: { type: 'friendsCount', value: 10 },
    isHidden: false,
    sort: 901,
    triggers: [AchievementTrigger.FRIEND_ADD],
  },
  {
    code: 'friend_50',
    type: AchievementType.SOCIAL,
    name: '社交达人',
    description: '拥有50个好友',
    icon: '🌟',
    rarity: AchievementRarity.RARE,
    expReward: 100,
    condition: { type: 'friendsCount', value: 50 },
    isHidden: false,
    sort: 902,
    triggers: [AchievementTrigger.FRIEND_ADD],
  },

  // 排行榜成就
  {
    code: 'rank_top100',
    type: AchievementType.SOCIAL,
    name: '崭露头角',
    description: '周榜进入前100名',
    icon: '📊',
    rarity: AchievementRarity.UNCOMMON,
    expReward: 50,
    condition: { type: 'weeklyRank', value: 100 },
    isHidden: false,
    sort: 950,
    triggers: [AchievementTrigger.RANKING_CHANGE],
  },
  {
    code: 'rank_top10',
    type: AchievementType.SOCIAL,
    name: '顶尖高手',
    description: '周榜进入前10名',
    icon: '🏆',
    rarity: AchievementRarity.EPIC,
    expReward: 200,
    condition: { type: 'weeklyRank', value: 10 },
    isHidden: false,
    sort: 951,
    triggers: [AchievementTrigger.RANKING_CHANGE],
  },
  {
    code: 'rank_top1',
    type: AchievementType.SOCIAL,
    name: '登顶之王',
    description: '获得周榜第一名',
    icon: '👑',
    rarity: AchievementRarity.LEGENDARY,
    expReward: 500,
    condition: { type: 'weeklyRank', value: 1 },
    isHidden: false,
    sort: 952,
    triggers: [AchievementTrigger.RANKING_CHANGE],
  },

  // ==================== 特殊成就 ====================
  {
    code: 'first_game',
    type: AchievementType.SPECIAL,
    name: '初次冒险',
    description: '完成第一次游戏',
    icon: '🎉',
    rarity: AchievementRarity.COMMON,
    expReward: 20,
    condition: { type: 'totalGames', value: 1 },
    isHidden: false,
    sort: 1000,
    triggers: [AchievementTrigger.GAME_END],
  },
  {
    code: 'night_owl',
    type: AchievementType.SPECIAL,
    name: '夜猫子',
    description: '在凌晨0点至5点完成游戏',
    icon: '🦉',
    rarity: AchievementRarity.UNCOMMON,
    expReward: 25,
    condition: { type: 'nightGame', value: 1 },
    isHidden: true,
    sort: 1001,
    triggers: [AchievementTrigger.GAME_END],
  },
  {
    code: 'early_bird',
    type: AchievementType.SPECIAL,
    name: '早起鸟儿',
    description: '在早上5点至7点完成游戏',
    icon: '🐦',
    rarity: AchievementRarity.UNCOMMON,
    expReward: 25,
    condition: { type: 'earlyGame', value: 1 },
    isHidden: true,
    sort: 1002,
    triggers: [AchievementTrigger.GAME_END],
  },
  {
    code: 'weekend_warrior',
    type: AchievementType.SPECIAL,
    name: '周末战士',
    description: '在周末完成10次游戏',
    icon: '⚔️',
    rarity: AchievementRarity.UNCOMMON,
    expReward: 40,
    condition: { type: 'weekendGames', value: 10 },
    isHidden: true,
    sort: 1003,
    triggers: [AchievementTrigger.GAME_END],
  },
  {
    code: 'wordbank_complete',
    type: AchievementType.SPECIAL,
    name: '词库终结者',
    description: '完成一个完整词库的学习',
    icon: '📚',
    rarity: AchievementRarity.EPIC,
    expReward: 300,
    condition: { type: 'completedWordBanks', value: 1 },
    isHidden: false,
    sort: 1004,
    triggers: [AchievementTrigger.GAME_END],
  },
  {
    code: 'level_10',
    type: AchievementType.SPECIAL,
    name: '初窥门径',
    description: '达到10级',
    icon: '📈',
    rarity: AchievementRarity.COMMON,
    expReward: 20,
    condition: { type: 'userLevel', value: 10 },
    isHidden: false,
    sort: 1100,
    triggers: [AchievementTrigger.LEVEL_UP],
  },
  {
    code: 'level_30',
    type: AchievementType.SPECIAL,
    name: '渐入佳境',
    description: '达到30级',
    icon: '📊',
    rarity: AchievementRarity.RARE,
    expReward: 100,
    condition: { type: 'userLevel', value: 30 },
    isHidden: false,
    sort: 1101,
    triggers: [AchievementTrigger.LEVEL_UP],
  },
  {
    code: 'level_50',
    type: AchievementType.SPECIAL,
    name: '炉火纯青',
    description: '达到50级',
    icon: '🔥',
    rarity: AchievementRarity.EPIC,
    expReward: 300,
    condition: { type: 'userLevel', value: 50 },
    isHidden: false,
    sort: 1102,
    triggers: [AchievementTrigger.LEVEL_UP],
  },
];

// Redis 缓存键
const CACHE_KEYS = {
  USER_PROGRESS: (userId: string) => `achievement:progress:${userId}`,
  ACHIEVEMENT_STATS: 'achievement:stats:global',
  USER_ACHIEVEMENTS: (userId: string) => `achievement:user:${userId}`,
};

// 缓存过期时间（秒）
const CACHE_TTL = {
  USER_PROGRESS: 300, // 5分钟
  ACHIEVEMENT_STATS: 3600, // 1小时
  USER_ACHIEVEMENTS: 600, // 10分钟
};

@Injectable()
export class AchievementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  // ==================== 公共方法 ====================

  /**
   * 获取所有成就（包含解锁状态和进度）
   */
  async getAllAchievements(
    userId: string,
    query?: QueryAchievementsDto,
  ): Promise<AchievementDetailDto[]> {
    // 获取用户已解锁的成就
    const userAchievements = await this.prisma.userAchievement.findMany({
      where: { userId },
      include: { achievement: true },
    });

    const unlockedMap = new Map(
      userAchievements.map((ua) => [ua.achievement.code, ua]),
    );

    // 获取用户当前进度
    const progress = await this.calculateUserProgress(userId);

    // 获取成就解锁率统计
    const unlockRates = await this.getAchievementUnlockRates();

    // 构建成就列表
    let achievements = ACHIEVEMENT_DEFINITIONS.map((def) => {
      const unlocked = unlockedMap.get(def.code);
      const currentProgress = this.getProgressValue(progress, def.condition.type);
      const target = def.condition.value;

      const achievement: AchievementDetailDto = {
        code: def.code,
        type: def.type,
        name: def.isHidden && !unlocked ? '???' : def.name,
        description: def.isHidden && !unlocked ? '隐藏成就，待解锁后揭晓' : def.description,
        icon: def.isHidden && !unlocked ? '❓' : def.icon,
        rarity: def.rarity,
        expReward: Math.round(def.expReward * RARITY_EXP_MULTIPLIER[def.rarity]),
        isUnlocked: !!unlocked,
        unlockedAt: unlocked?.unlockedAt || undefined,
        progress: {
          current: Math.min(currentProgress, target),
          target,
          percentage: Math.min(100, Math.round((currentProgress / target) * 100)),
        },
        unlockRate: unlockRates.get(def.code),
        isHidden: def.isHidden,
        sort: def.sort,
      };

      return achievement;
    });

    // 应用筛选条件
    if (query) {
      if (query.type) {
        achievements = achievements.filter((a) => a.type === query.type);
      }
      if (query.rarity) {
        achievements = achievements.filter((a) => a.rarity === query.rarity);
      }
      if (query.unlockedOnly) {
        achievements = achievements.filter((a) => a.isUnlocked);
      }
      if (query.lockedOnly) {
        achievements = achievements.filter((a) => !a.isUnlocked);
      }
    }

    // 排序：未解锁的按进度降序，已解锁的按解锁时间降序
    achievements.sort((a, b) => {
      if (a.isUnlocked !== b.isUnlocked) {
        return a.isUnlocked ? 1 : -1; // 未解锁的在前
      }
      if (!a.isUnlocked) {
        return b.progress.percentage - a.progress.percentage;
      }
      return (b.unlockedAt?.getTime() || 0) - (a.unlockedAt?.getTime() || 0);
    });

    return achievements;
  }

  /**
   * 获取成就详情
   */
  async getAchievementDetail(
    userId: string,
    code: string,
  ): Promise<AchievementDetailDto> {
    const def = ACHIEVEMENT_DEFINITIONS.find((d) => d.code === code);
    if (!def) {
      throw new NotFoundException('成就不存在');
    }

    const userAchievement = await this.prisma.userAchievement.findFirst({
      where: {
        userId,
        achievement: { code },
      },
      include: { achievement: true },
    });

    const progress = await this.calculateUserProgress(userId);
    const currentProgress = this.getProgressValue(progress, def.condition.type);
    const unlockRates = await this.getAchievementUnlockRates();

    return {
      code: def.code,
      type: def.type,
      name: def.isHidden && !userAchievement ? '???' : def.name,
      description: def.isHidden && !userAchievement ? '隐藏成就，待解锁后揭晓' : def.description,
      icon: def.isHidden && !userAchievement ? '❓' : def.icon,
      rarity: def.rarity,
      expReward: Math.round(def.expReward * RARITY_EXP_MULTIPLIER[def.rarity]),
      isUnlocked: !!userAchievement,
      unlockedAt: userAchievement?.unlockedAt,
      progress: {
        current: Math.min(currentProgress, def.condition.value),
        target: def.condition.value,
        percentage: Math.min(
          100,
          Math.round((currentProgress / def.condition.value) * 100),
        ),
      },
      unlockRate: unlockRates.get(def.code),
      isHidden: def.isHidden,
      sort: def.sort,
    };
  }

  /**
   * 获取已解锁成就
   */
  async getUnlockedAchievements(userId: string): Promise<AchievementUnlockNotificationDto[]> {
    const userAchievements = await this.prisma.userAchievement.findMany({
      where: { userId },
      include: { achievement: true },
      orderBy: { unlockedAt: 'desc' },
    });

    return userAchievements.map((ua) => {
      const def = ACHIEVEMENT_DEFINITIONS.find((d) => d.code === ua.achievement.code);
      return {
        code: ua.achievement.code,
        name: ua.achievement.name,
        description: ua.achievement.description,
        icon: ua.achievement.icon,
        rarity: (def?.rarity || AchievementRarity.COMMON) as AchievementRarity,
        expReward: ua.achievement.expReward,
        unlockedAt: ua.unlockedAt,
        isRare: def ? [AchievementRarity.EPIC, AchievementRarity.LEGENDARY].includes(def.rarity) : false,
      };
    });
  }

  /**
   * 获取成就统计
   */
  async getAchievementStats(userId: string): Promise<AchievementStatsDto> {
    const userAchievements = await this.prisma.userAchievement.findMany({
      where: { userId },
      include: { achievement: true },
      orderBy: { unlockedAt: 'desc' },
    });

    const unlockedCodes = new Set(userAchievements.map((ua) => ua.achievement.code));

    // 按类型统计
    const byType: AchievementStatsDto['byType'] = {
      [AchievementType.LEARNING]: { total: 0, unlocked: 0, percentage: 0 },
      [AchievementType.GAME]: { total: 0, unlocked: 0, percentage: 0 },
      [AchievementType.SOCIAL]: { total: 0, unlocked: 0, percentage: 0 },
      [AchievementType.SPECIAL]: { total: 0, unlocked: 0, percentage: 0 },
    };

    // 按稀有度统计
    const byRarity: AchievementStatsDto['byRarity'] = {
      [AchievementRarity.COMMON]: { total: 0, unlocked: 0, percentage: 0 },
      [AchievementRarity.UNCOMMON]: { total: 0, unlocked: 0, percentage: 0 },
      [AchievementRarity.RARE]: { total: 0, unlocked: 0, percentage: 0 },
      [AchievementRarity.EPIC]: { total: 0, unlocked: 0, percentage: 0 },
      [AchievementRarity.LEGENDARY]: { total: 0, unlocked: 0, percentage: 0 },
    };

    let totalExpEarned = 0;

    for (const def of ACHIEVEMENT_DEFINITIONS) {
      byType[def.type].total++;
      byRarity[def.rarity].total++;

      if (unlockedCodes.has(def.code)) {
        byType[def.type].unlocked++;
        byRarity[def.rarity].unlocked++;
        totalExpEarned += Math.round(def.expReward * RARITY_EXP_MULTIPLIER[def.rarity]);
      }
    }

    // 计算百分比
    for (const type of Object.keys(byType) as AchievementType[]) {
      byType[type].percentage = byType[type].total > 0
        ? Math.round((byType[type].unlocked / byType[type].total) * 100)
        : 0;
    }

    for (const rarity of Object.keys(byRarity) as AchievementRarity[]) {
      byRarity[rarity].percentage = byRarity[rarity].total > 0
        ? Math.round((byRarity[rarity].unlocked / byRarity[rarity].total) * 100)
        : 0;
    }

    // 最近解锁的成就
    const recentUnlocks = userAchievements.slice(0, 5).map((ua) => {
      const def = ACHIEVEMENT_DEFINITIONS.find((d) => d.code === ua.achievement.code);
      return {
        code: ua.achievement.code,
        name: ua.achievement.name,
        description: ua.achievement.description,
        icon: ua.achievement.icon,
        rarity: (def?.rarity || AchievementRarity.COMMON) as AchievementRarity,
        expReward: ua.achievement.expReward,
        unlockedAt: ua.unlockedAt,
      };
    });

    return {
      totalAchievements: ACHIEVEMENT_DEFINITIONS.length,
      unlockedCount: unlockedCodes.size,
      completionRate: Math.round((unlockedCodes.size / ACHIEVEMENT_DEFINITIONS.length) * 100),
      totalExpEarned,
      byType,
      byRarity,
      recentUnlocks,
    };
  }

  /**
   * 获取成就排行榜
   */
  async getAchievementRanking(
    currentUserId: string,
    page: number = 1,
    limit: number = 50,
  ): Promise<{
    items: AchievementRankingItemDto[];
    pagination: { page: number; limit: number; total: number };
    myRank: number | null;
  }> {
    const offset = (page - 1) * limit;

    // 获取成就数量排行
    const rankings = await this.prisma.userAchievement.groupBy({
      by: ['userId'],
      _count: { achievementId: true },
      orderBy: { _count: { achievementId: 'desc' } },
      skip: offset,
      take: limit,
    });

    const userIds = rankings.map((r) => r.userId);

    // 获取用户信息
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        nickname: true,
        avatarUrl: true,
      },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    // 获取每个用户的成就总经验和最稀有成就
    const userAchievementDetails = await Promise.all(
      userIds.map(async (userId) => {
        const achievements = await this.prisma.userAchievement.findMany({
          where: { userId },
          include: { achievement: true },
        });

        let totalExp = 0;
        let rarestAchievement: AchievementRankingItemDto['rarestAchievement'] | undefined;
        let highestRarity = -1;

        const rarityOrder = {
          [AchievementRarity.COMMON]: 0,
          [AchievementRarity.UNCOMMON]: 1,
          [AchievementRarity.RARE]: 2,
          [AchievementRarity.EPIC]: 3,
          [AchievementRarity.LEGENDARY]: 4,
        };

        for (const ua of achievements) {
          const def = ACHIEVEMENT_DEFINITIONS.find((d) => d.code === ua.achievement.code);
          if (def) {
            totalExp += Math.round(def.expReward * RARITY_EXP_MULTIPLIER[def.rarity]);
            const rarityValue = rarityOrder[def.rarity];
            if (rarityValue > highestRarity) {
              highestRarity = rarityValue;
              rarestAchievement = {
                code: def.code,
                name: def.name,
                icon: def.icon,
                rarity: def.rarity,
              };
            }
          }
        }

        return { userId, totalExp, rarestAchievement };
      }),
    );

    const detailsMap = new Map(userAchievementDetails.map((d) => [d.userId, d]));

    // 构建排行榜项目
    const items: AchievementRankingItemDto[] = rankings.map((r, index) => {
      const user = userMap.get(r.userId);
      const details = detailsMap.get(r.userId);
      return {
        rank: offset + index + 1,
        userId: r.userId,
        nickname: user?.nickname || '未知用户',
        avatarUrl: user?.avatarUrl || null,
        achievementCount: r._count.achievementId,
        totalExp: details?.totalExp || 0,
        isCurrentUser: r.userId === currentUserId,
        rarestAchievement: details?.rarestAchievement,
      };
    });

    // 获取总用户数
    const totalUsers = await this.prisma.userAchievement.groupBy({
      by: ['userId'],
      _count: true,
    });

    // 获取当前用户排名
    let myRank: number | null = null;
    const myAchievementCount = await this.prisma.userAchievement.count({
      where: { userId: currentUserId },
    });

    if (myAchievementCount > 0) {
      const usersWithMoreAchievements = await this.prisma.userAchievement.groupBy({
        by: ['userId'],
        _count: { achievementId: true },
        having: {
          achievementId: {
            _count: { gt: myAchievementCount },
          },
        },
      });
      myRank = usersWithMoreAchievements.length + 1;
    }

    return {
      items,
      pagination: {
        page,
        limit,
        total: totalUsers.length,
      },
      myRank,
    };
  }

  /**
   * 检查并解锁成就（核心方法）
   */
  async checkAndUnlockAchievements(
    userId: string,
    trigger: AchievementTrigger,
    context?: Record<string, unknown>,
  ): Promise<AchievementCheckResultDto> {
    const progress = await this.calculateUserProgress(userId, context);
    const newUnlocks: AchievementUnlockNotificationDto[] = [];
    let totalExpEarned = 0;

    // 获取已解锁成就
    const existingAchievements = await this.prisma.userAchievement.findMany({
      where: { userId },
      include: { achievement: true },
    });
    const existingCodes = new Set(existingAchievements.map((ua) => ua.achievement.code));

    // 筛选需要检查的成就（根据触发器）
    const achievementsToCheck = ACHIEVEMENT_DEFINITIONS.filter(
      (def) => def.triggers.includes(trigger) && !existingCodes.has(def.code),
    );

    // 检查每个成就
    for (const def of achievementsToCheck) {
      const currentProgress = this.getProgressValue(progress, def.condition.type);

      if (currentProgress >= def.condition.value) {
        // 解锁成就
        const unlockResult = await this.unlockAchievement(userId, def);
        if (unlockResult) {
          newUnlocks.push(unlockResult);
          totalExpEarned += unlockResult.expReward;
        }
      }
    }

    // 查找接近完成的成就
    const nearCompletion = ACHIEVEMENT_DEFINITIONS
      .filter((def) => !existingCodes.has(def.code))
      .map((def) => {
        const currentProgress = this.getProgressValue(progress, def.condition.type);
        const percentage = Math.round((currentProgress / def.condition.value) * 100);
        return {
          code: def.code,
          name: def.isHidden ? '???' : def.name,
          icon: def.isHidden ? '❓' : def.icon,
          progress: {
            current: currentProgress,
            target: def.condition.value,
            percentage,
          },
        };
      })
      .filter((a) => a.progress.percentage >= 80 && a.progress.percentage < 100)
      .sort((a, b) => b.progress.percentage - a.progress.percentage)
      .slice(0, 3);

    // 清除用户进度缓存
    await this.redis.del(CACHE_KEYS.USER_PROGRESS(userId));

    return {
      newUnlocks,
      totalExpEarned,
      nearCompletion,
    };
  }

  /**
   * 手动检查所有成就
   */
  async checkAllAchievements(userId: string): Promise<AchievementCheckResultDto> {
    return this.checkAndUnlockAchievements(userId, AchievementTrigger.MANUAL);
  }

  // ==================== 私有方法 ====================

  /**
   * 解锁成就
   */
  private async unlockAchievement(
    userId: string,
    def: AchievementDefinition,
  ): Promise<AchievementUnlockNotificationDto | null> {
    try {
      // 查找或创建成就记录
      let achievement = await this.prisma.achievement.findUnique({
        where: { code: def.code },
      });

      if (!achievement) {
        achievement = await this.prisma.achievement.create({
          data: {
            code: def.code,
            name: def.name,
            description: def.description,
            icon: def.icon,
            type: def.type as PrismaAchievementType,
            condition: def.condition as object,
            expReward: Math.round(def.expReward * RARITY_EXP_MULTIPLIER[def.rarity]),
            sort: def.sort,
          },
        });
      }

      // 检查是否已解锁（防止重复）
      const existing = await this.prisma.userAchievement.findUnique({
        where: {
          userId_achievementId: {
            userId,
            achievementId: achievement.id,
          },
        },
      });

      if (existing) {
        return null;
      }

      // 解锁成就
      const unlockedAt = new Date();
      await this.prisma.userAchievement.create({
        data: {
          userId,
          achievementId: achievement.id,
          unlockedAt,
        },
      });

      const expReward = Math.round(def.expReward * RARITY_EXP_MULTIPLIER[def.rarity]);

      // 发放经验值奖励
      await this.grantExpReward(userId, expReward);

      return {
        code: def.code,
        name: def.name,
        description: def.description,
        icon: def.icon,
        rarity: def.rarity,
        expReward,
        unlockedAt,
        isRare: [AchievementRarity.EPIC, AchievementRarity.LEGENDARY].includes(def.rarity),
        announceText: this.getAnnounceText(def),
      };
    } catch (error) {
      console.error(`Failed to unlock achievement ${def.code} for user ${userId}:`, error);
      return null;
    }
  }

  /**
   * 发放经验值奖励
   */
  private async grantExpReward(userId: string, exp: number): Promise<void> {
    const userLevel = await this.prisma.userLevel.findUnique({
      where: { userId },
    });

    if (!userLevel) {
      await this.prisma.userLevel.create({
        data: {
          userId,
          level: 1,
          currentExp: exp,
          totalExp: exp,
          title: '初学者',
        },
      });
      return;
    }

    await this.prisma.userLevel.update({
      where: { userId },
      data: {
        currentExp: { increment: exp },
        totalExp: { increment: exp },
      },
    });
  }

  /**
   * 计算用户当前进度
   */
  private async calculateUserProgress(
    userId: string,
    context?: Record<string, unknown>,
  ): Promise<Record<string, number>> {
    // 尝试从缓存获取
    const cacheKey = CACHE_KEYS.USER_PROGRESS(userId);
    const cached = await this.redis.getJson<Record<string, number>>(cacheKey);
    if (cached && !context) {
      return cached;
    }

    // 并行获取各项数据
    const [
      masteredCount,
      totalScoreResult,
      perfectGames,
      totalGames,
      speedGames,
      speedPerfect,
      perfectAccuracyGames,
      maxComboResult,
      streakDays,
      friendsCount,
      weeklyRank,
      userLevel,
      completedWordBanks,
      nightGames,
      earlyGames,
      weekendGames,
    ] = await Promise.all([
      // 掌握单词数
      this.prisma.userWord.count({
        where: { userId, mastery: 'mastered' },
      }),
      // 总分数
      this.prisma.gameRecord.aggregate({
        where: { userId },
        _sum: { score: true },
      }),
      // 满星游戏次数
      this.prisma.gameRecord.count({
        where: { userId, stars: 3 },
      }),
      // 总游戏次数
      this.prisma.gameRecord.count({
        where: { userId },
      }),
      // 速度挑战次数
      this.prisma.gameRecord.count({
        where: { userId, mode: 'speed' },
      }),
      // 速度挑战满星
      this.prisma.gameRecord.count({
        where: { userId, mode: 'speed', stars: 3 },
      }),
      // 100%正确率游戏次数
      this.prisma.gameRecord.count({
        where: { userId, accuracy: 100 },
      }),
      // 最高连击
      this.prisma.gameRecord.aggregate({
        where: { userId },
        _max: { maxCombo: true },
      }),
      // 连续学习天数
      this.calculateStreakDays(userId),
      // 好友数量
      this.prisma.friendship.count({
        where: {
          OR: [
            { userId, status: 'accepted' },
            { friendId: userId, status: 'accepted' },
          ],
        },
      }),
      // 周榜排名
      this.getWeeklyRank(userId),
      // 用户等级
      this.prisma.userLevel.findUnique({
        where: { userId },
        select: { level: true },
      }),
      // 完成的词库数
      this.getCompletedWordBanksCount(userId),
      // 夜间游戏次数
      this.countNightGames(userId),
      // 早起游戏次数
      this.countEarlyGames(userId),
      // 周末游戏次数
      this.countWeekendGames(userId),
    ]);

    const progress: Record<string, number> = {
      masteredWords: masteredCount,
      totalScore: totalScoreResult._sum?.score || 0,
      perfectGames,
      totalGames,
      speedGames,
      speedPerfect,
      perfectAccuracy: perfectAccuracyGames,
      maxCombo: context?.maxCombo as number || maxComboResult._max?.maxCombo || 0,
      streakDays,
      friendsCount,
      weeklyRank: weeklyRank || 999999,
      userLevel: userLevel?.level || 1,
      completedWordBanks,
      nightGame: nightGames,
      earlyGame: earlyGames,
      weekendGames,
    };

    // 缓存结果
    if (!context) {
      await this.redis.setJson(cacheKey, progress, CACHE_TTL.USER_PROGRESS);
    }

    return progress;
  }

  /**
   * 获取进度值
   */
  private getProgressValue(progress: Record<string, number>, type: string): number {
    return progress[type] || 0;
  }

  /**
   * 计算连续学习天数
   */
  private async calculateStreakDays(userId: string): Promise<number> {
    const userLevel = await this.prisma.userLevel.findUnique({
      where: { userId },
      select: { consecutiveDays: true },
    });

    return userLevel?.consecutiveDays || 0;
  }

  /**
   * 获取周榜排名
   */
  private async getWeeklyRank(userId: string): Promise<number | null> {
    const now = new Date();
    const weekKey = `ranking:global:weekly:${this.getWeekNumber(now)}`;
    const client = this.redis.getClient();
    const rank = await client.zrevrank(weekKey, userId);
    return rank !== null ? rank + 1 : null;
  }

  /**
   * 获取完成的词库数
   */
  private async getCompletedWordBanksCount(userId: string): Promise<number> {
    const completedWordBanks = await this.prisma.userWordBank.count({
      where: {
        userId,
        progress: { gte: 100 },
      },
    });
    return completedWordBanks;
  }

  /**
   * 统计夜间游戏次数
   */
  private async countNightGames(userId: string): Promise<number> {
    const games = await this.prisma.gameRecord.findMany({
      where: { userId },
      select: { createdAt: true },
    });

    return games.filter((g) => {
      const hour = g.createdAt.getHours();
      return hour >= 0 && hour < 5;
    }).length;
  }

  /**
   * 统计早起游戏次数
   */
  private async countEarlyGames(userId: string): Promise<number> {
    const games = await this.prisma.gameRecord.findMany({
      where: { userId },
      select: { createdAt: true },
    });

    return games.filter((g) => {
      const hour = g.createdAt.getHours();
      return hour >= 5 && hour < 7;
    }).length;
  }

  /**
   * 统计周末游戏次数
   */
  private async countWeekendGames(userId: string): Promise<number> {
    const games = await this.prisma.gameRecord.findMany({
      where: { userId },
      select: { createdAt: true },
    });

    return games.filter((g) => {
      const day = g.createdAt.getDay();
      return day === 0 || day === 6;
    }).length;
  }

  /**
   * 获取成就解锁率
   */
  private async getAchievementUnlockRates(): Promise<Map<string, number>> {
    const cacheKey = CACHE_KEYS.ACHIEVEMENT_STATS;
    const cached = await this.redis.getJson<Record<string, number>>(cacheKey);
    if (cached) {
      return new Map(Object.entries(cached));
    }

    // 获取总用户数
    const totalUsers = await this.prisma.user.count({
      where: { status: 'active' },
    });

    if (totalUsers === 0) {
      return new Map();
    }

    // 获取每个成就的解锁数
    const achievements = await this.prisma.achievement.findMany({
      select: {
        code: true,
        _count: {
          select: { userAchievements: true },
        },
      },
    });

    const rates: Record<string, number> = {};
    for (const a of achievements) {
      rates[a.code] = Math.round((a._count.userAchievements / totalUsers) * 100);
    }

    // 缓存结果
    await this.redis.setJson(cacheKey, rates, CACHE_TTL.ACHIEVEMENT_STATS);

    return new Map(Object.entries(rates));
  }

  /**
   * 获取成就解锁播报文本
   */
  private getAnnounceText(def: AchievementDefinition): string {
    const rarityText: Record<AchievementRarity, string> = {
      [AchievementRarity.COMMON]: '',
      [AchievementRarity.UNCOMMON]: '不错！',
      [AchievementRarity.RARE]: '太棒了！',
      [AchievementRarity.EPIC]: '史诗成就！',
      [AchievementRarity.LEGENDARY]: '传说成就解锁！',
    };

    return `${rarityText[def.rarity]}获得成就「${def.name}」`;
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
