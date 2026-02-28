import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { RedisService } from '../../shared/redis/redis.service';
import {
  MasteryLevel,
  TimeRange,
  LearningOverviewDto,
  DailyStatsDto,
  HeatmapDataDto,
  LearningTrendDto,
  MasteryDistributionDto,
  WordDetailDto,
  WeakWordsAnalysisDto,
  ReviewReminderDto,
  LearningReportDto,
  QueryLearningStatsDto,
  SetDailyGoalDto,
} from './dto';

// 缓存键
const CACHE_KEYS = {
  USER_OVERVIEW: (userId: string) => `learning:overview:${userId}`,
  USER_STATS: (userId: string, days: number) => `learning:stats:${userId}:${days}`,
  USER_HEATMAP: (userId: string) => `learning:heatmap:${userId}`,
  DAILY_GOAL: (userId: string) => `learning:goal:${userId}`,
};

// 缓存过期时间（秒）
const CACHE_TTL = {
  OVERVIEW: 300, // 5分钟
  STATS: 600, // 10分钟
  HEATMAP: 3600, // 1小时
  DAILY_GOAL: 86400, // 1天
};

// 复习间隔（天）- 基于艾宾浩斯遗忘曲线
const REVIEW_INTERVALS = [1, 2, 4, 7, 15, 30];

// 默认每日目标
const DEFAULT_DAILY_GOAL = {
  wordsTarget: 50,
  durationTarget: 30, // 分钟
};

@Injectable()
export class LearningService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  // ==================== 学习总览 ====================

  /**
   * 获取学习总览
   */
  async getOverview(userId: string): Promise<LearningOverviewDto> {
    // 尝试从缓存获取
    const cacheKey = CACHE_KEYS.USER_OVERVIEW(userId);
    const cached = await this.redis.getJson<LearningOverviewDto>(cacheKey);
    if (cached) {
      // 更新今日数据（不缓存）
      cached.today = await this.getTodayStats(userId);
      cached.dailyGoal = await this.getDailyGoalStatus(userId);
      return cached;
    }

    // 获取用户学习的所有词库
    const userWordBanks = await this.prisma.userWordBank.findMany({
      where: { userId },
      include: {
        wordBank: true,
      },
      orderBy: { lastStudyAt: 'desc' },
    });

    // 获取掌握度统计
    const masteryStats = await this.getMasteryStats(userId);

    // 获取连续学习信息
    const streakInfo = await this.getStreakInfo(userId);

    // 获取累计学习天数和时长
    const learningHistory = await this.getLearningHistory(userId);

    // 获取需要复习的单词数
    const needReviewCount = await this.getNeedReviewCount(userId);

    const result: LearningOverviewDto = {
      wordBanks: userWordBanks.map((uwb) => ({
        id: uwb.wordBank.id,
        name: uwb.wordBank.name,
        totalWords: uwb.wordBank.wordCount,
        learnedCount: uwb.learnedCount,
        masteredCount: uwb.masteredCount,
        progress: uwb.progress,
        lastStudyAt: uwb.lastStudyAt,
      })),
      statistics: {
        totalWords: masteryStats.total,
        masteredCount: masteryStats.mastered,
        learningCount: masteryStats.learning,
        needReviewCount,
        streakDays: streakInfo.currentStreak,
        longestStreak: streakInfo.longestStreak,
        totalStudyDays: learningHistory.totalDays,
        totalStudyTime: learningHistory.totalTime,
      },
      today: await this.getTodayStats(userId),
      dailyGoal: await this.getDailyGoalStatus(userId),
    };

    // 缓存结果（不包含今日数据）
    await this.redis.setJson(cacheKey, result, CACHE_TTL.OVERVIEW);

    return result;
  }

  /**
   * 获取今日学习统计
   */
  private async getTodayStats(userId: string): Promise<LearningOverviewDto['today']> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayRecords = await this.prisma.gameRecord.findMany({
      where: {
        userId,
        createdAt: { gte: today },
      },
    });

    // 今日新学单词
    const todayNewWords = await this.prisma.userWord.count({
      where: {
        userId,
        createdAt: { gte: today },
      },
    });

    const totalWords = todayRecords.reduce((sum, r) => sum + r.totalCount, 0);
    const correctWords = todayRecords.reduce((sum, r) => sum + r.correctCount, 0);
    const wrongWords = todayRecords.reduce((sum, r) => sum + r.wrongCount, 0);

    return {
      wordsLearned: totalWords,
      newWords: todayNewWords,
      reviewedWords: totalWords - todayNewWords,
      score: todayRecords.reduce((sum, r) => sum + r.score, 0),
      duration: todayRecords.reduce((sum, r) => sum + r.timeUsed, 0),
      gamesPlayed: todayRecords.length,
      accuracy:
        correctWords + wrongWords > 0
          ? Math.round((correctWords / (correctWords + wrongWords)) * 100)
          : 0,
    };
  }

  // ==================== 学习统计 ====================

  /**
   * 获取学习趋势数据
   */
  async getLearningTrend(userId: string, query: QueryLearningStatsDto): Promise<LearningTrendDto> {
    const days = this.getDaysFromRange(query.range, query.days);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    // 获取当前周期数据
    const currentPeriodData = await this.getPeriodStats(
      userId,
      startDate,
      new Date(),
      query.wordBankId,
    );

    // 获取上一周期数据（用于对比）
    const prevStartDate = new Date(startDate);
    prevStartDate.setDate(prevStartDate.getDate() - days);
    const prevPeriodData = await this.getPeriodStats(
      userId,
      prevStartDate,
      startDate,
      query.wordBankId,
    );

    // 计算变化
    const wordsChange =
      prevPeriodData.totals.wordsLearned > 0
        ? Math.round(
            ((currentPeriodData.totals.wordsLearned - prevPeriodData.totals.wordsLearned) /
              prevPeriodData.totals.wordsLearned) *
              100,
          )
        : currentPeriodData.totals.wordsLearned > 0
          ? 100
          : 0;

    const scoreChange =
      prevPeriodData.totals.score > 0
        ? Math.round(
            ((currentPeriodData.totals.score - prevPeriodData.totals.score) /
              prevPeriodData.totals.score) *
              100,
          )
        : currentPeriodData.totals.score > 0
          ? 100
          : 0;

    const durationChange =
      prevPeriodData.totals.duration > 0
        ? Math.round(
            ((currentPeriodData.totals.duration - prevPeriodData.totals.duration) /
              prevPeriodData.totals.duration) *
              100,
          )
        : currentPeriodData.totals.duration > 0
          ? 100
          : 0;

    // 判断趋势
    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (wordsChange > 5) trend = 'up';
    else if (wordsChange < -5) trend = 'down';

    return {
      period: {
        start: startDate.toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0],
        days,
      },
      totals: currentPeriodData.totals,
      averages: {
        wordsPerDay: Math.round(currentPeriodData.totals.wordsLearned / days),
        scorePerDay: Math.round(currentPeriodData.totals.score / days),
        durationPerDay: Math.round(currentPeriodData.totals.duration / days),
        gamesPerDay: Math.round((currentPeriodData.totals.gamesPlayed / days) * 10) / 10,
      },
      comparison: {
        wordsChange,
        scoreChange,
        durationChange,
        trend,
      },
      daily: currentPeriodData.daily,
    };
  }

  /**
   * 获取学习热力图数据
   */
  async getHeatmapData(userId: string, year?: number): Promise<HeatmapDataDto[]> {
    const targetYear = year || new Date().getFullYear();
    const startDate = new Date(targetYear, 0, 1);
    const endDate = new Date(targetYear, 11, 31, 23, 59, 59);

    // 获取该年所有游戏记录
    const records = await this.prisma.gameRecord.findMany({
      where: {
        userId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        createdAt: true,
        totalCount: true,
      },
    });

    // 按日期聚合
    const dailyMap = new Map<string, number>();
    records.forEach((r) => {
      const dateStr = r.createdAt.toISOString().split('T')[0];
      dailyMap.set(dateStr, (dailyMap.get(dateStr) || 0) + r.totalCount);
    });

    // 计算强度等级
    const values = Array.from(dailyMap.values());
    const maxCount = Math.max(...values, 1);
    const thresholds = [0, maxCount * 0.25, maxCount * 0.5, maxCount * 0.75, maxCount];

    const getLevel = (count: number): number => {
      if (count === 0) return 0;
      if (count <= thresholds[1]) return 1;
      if (count <= thresholds[2]) return 2;
      if (count <= thresholds[3]) return 3;
      return 4;
    };

    // 生成完整年份数据
    const result: HeatmapDataDto[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const count = dailyMap.get(dateStr) || 0;
      result.push({
        date: dateStr,
        count,
        level: getLevel(count),
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return result;
  }

  /**
   * 获取学习时段分析
   */
  async getTimeDistribution(
    userId: string,
    days: number = 30,
  ): Promise<{
    hourly: Array<{ hour: number; count: number; percentage: number }>;
    weekday: Array<{ day: number; dayName: string; count: number; percentage: number }>;
    bestTime: { hour: number; accuracy: number };
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const records = await this.prisma.gameRecord.findMany({
      where: {
        userId,
        createdAt: { gte: startDate },
      },
      select: {
        createdAt: true,
        totalCount: true,
        correctCount: true,
        wrongCount: true,
      },
    });

    // 按小时统计
    const hourlyMap = new Map<number, { count: number; correct: number; total: number }>();
    for (let i = 0; i < 24; i++) {
      hourlyMap.set(i, { count: 0, correct: 0, total: 0 });
    }

    // 按星期统计
    const weekdayMap = new Map<number, number>();
    for (let i = 0; i < 7; i++) {
      weekdayMap.set(i, 0);
    }

    const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

    records.forEach((r) => {
      const hour = r.createdAt.getHours();
      const day = r.createdAt.getDay();

      const hourData = hourlyMap.get(hour)!;
      hourData.count += r.totalCount;
      hourData.correct += r.correctCount;
      hourData.total += r.correctCount + r.wrongCount;

      weekdayMap.set(day, (weekdayMap.get(day) || 0) + r.totalCount);
    });

    const totalWords = records.reduce((sum, r) => sum + r.totalCount, 0) || 1;

    // 找出最佳学习时间
    let bestHour = 0;
    let bestAccuracy = 0;
    hourlyMap.forEach((data, hour) => {
      if (data.total > 0) {
        const accuracy = data.correct / data.total;
        if (accuracy > bestAccuracy && data.count > 10) {
          bestAccuracy = accuracy;
          bestHour = hour;
        }
      }
    });

    return {
      hourly: Array.from(hourlyMap.entries()).map(([hour, data]) => ({
        hour,
        count: data.count,
        percentage: Math.round((data.count / totalWords) * 100),
      })),
      weekday: Array.from(weekdayMap.entries()).map(([day, count]) => ({
        day,
        dayName: dayNames[day],
        count,
        percentage: Math.round((count / totalWords) * 100),
      })),
      bestTime: {
        hour: bestHour,
        accuracy: Math.round(bestAccuracy * 100),
      },
    };
  }

  // ==================== 单词掌握度 ====================

  /**
   * 获取单词掌握度分布
   */
  async getMasteryDistribution(
    userId: string,
    wordBankId?: string,
  ): Promise<MasteryDistributionDto> {
    const where: Record<string, unknown> = { userId };

    if (wordBankId) {
      // 筛选特定词库的单词
      where.word = {
        sectionWords: {
          some: {
            section: {
              chapter: { wordBankId },
            },
          },
        },
      };
    }

    const [notLearned, learning, mastered, needReview] = await Promise.all([
      this.prisma.userWord.count({ where: { ...where, mastery: 'not_learned' } }),
      this.prisma.userWord.count({ where: { ...where, mastery: 'learning' } }),
      this.prisma.userWord.count({ where: { ...where, mastery: 'mastered' } }),
      this.prisma.userWord.count({ where: { ...where, mastery: 'need_review' } }),
    ]);

    // 如果有词库筛选，还要计算未学习的单词
    let actualNotLearned = notLearned;
    if (wordBankId) {
      const totalWordsInBank = await this.prisma.word.count({
        where: {
          sectionWords: {
            some: {
              section: {
                chapter: { wordBankId },
              },
            },
          },
        },
      });
      const learnedWords = learning + mastered + needReview + notLearned;
      actualNotLearned = Math.max(0, totalWordsInBank - learnedWords);
    }

    const total = actualNotLearned + learning + mastered + needReview;
    const masteryRate = total > 0 ? Math.round((mastered / total) * 100) : 0;

    return {
      notLearned: actualNotLearned,
      learning,
      mastered,
      needReview,
      total,
      masteryRate,
    };
  }

  /**
   * 获取单词列表（按掌握度）
   */
  async getWordsByMastery(
    userId: string,
    mastery: MasteryLevel,
    page: number = 1,
    limit: number = 20,
    wordBankId?: string,
  ): Promise<{
    items: WordDetailDto[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const skip = (page - 1) * limit;
    const where: Record<string, unknown> = { userId, mastery };

    if (wordBankId) {
      where.word = {
        sectionWords: {
          some: {
            section: {
              chapter: { wordBankId },
            },
          },
        },
      };
    }

    const [words, total] = await Promise.all([
      this.prisma.userWord.findMany({
        where,
        include: {
          word: true,
        },
        orderBy: { lastPracticeAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.userWord.count({ where }),
    ]);

    // 检查是否在错词本中
    const wordIds = words.map((w) => w.wordId);
    const wrongBooks = await this.prisma.wrongBook.findMany({
      where: {
        userId,
        wordId: { in: wordIds },
        isRemoved: false,
      },
      select: { wordId: true },
    });
    const wrongBookSet = new Set(wrongBooks.map((wb) => wb.wordId));

    return {
      items: words.map((uw) => {
        const totalAttempts = uw.correctCount + uw.wrongCount;
        return {
          id: uw.word.id,
          english: uw.word.english,
          chinese: uw.word.chinese,
          phonetic: uw.word.phonetic,
          difficulty: uw.word.difficulty,
          mastery: uw.mastery as MasteryLevel,
          correctCount: uw.correctCount,
          wrongCount: uw.wrongCount,
          accuracy: totalAttempts > 0 ? Math.round((uw.correctCount / totalAttempts) * 100) : 0,
          lastPracticeAt: uw.lastPracticeAt,
          nextReviewAt: uw.nextReviewAt,
          inWrongBook: wrongBookSet.has(uw.wordId),
        };
      }),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * 获取需要复习的单词
   */
  async getReviewReminder(userId: string): Promise<ReviewReminderDto> {
    const now = new Date();
    const threeDaysLater = new Date();
    threeDaysLater.setDate(threeDaysLater.getDate() + 3);

    // 今日需复习
    const todayReview = await this.prisma.userWord.findMany({
      where: {
        userId,
        nextReviewAt: { lte: now },
        mastery: { not: 'mastered' },
      },
      include: { word: true },
      orderBy: { nextReviewAt: 'asc' },
      take: 50,
    });

    // 过期未复习（超过7天）
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const overdueCount = await this.prisma.userWord.count({
      where: {
        userId,
        nextReviewAt: { lte: sevenDaysAgo },
        mastery: { not: 'mastered' },
      },
    });

    // 即将需要复习（未来3天）
    const upcomingCount = await this.prisma.userWord.count({
      where: {
        userId,
        nextReviewAt: {
          gt: now,
          lte: threeDaysLater,
        },
        mastery: { not: 'mastered' },
      },
    });

    return {
      todayReviewCount: todayReview.length,
      overdueCount,
      upcomingCount,
      words: todayReview.map((uw) => {
        const daysOverdue = Math.max(
          0,
          Math.floor(
            (now.getTime() - (uw.nextReviewAt?.getTime() || now.getTime())) / (24 * 60 * 60 * 1000),
          ),
        );
        return {
          id: uw.word.id,
          english: uw.word.english,
          chinese: uw.word.chinese,
          dueDate: uw.nextReviewAt || now,
          daysOverdue,
        };
      }),
    };
  }

  /**
   * 获取薄弱单词分析
   */
  async getWeakWordsAnalysis(userId: string): Promise<WeakWordsAnalysisDto> {
    // 获取错误率高的单词
    const weakWords = await this.prisma.userWord.findMany({
      where: {
        userId,
        wrongCount: { gt: 0 },
      },
      include: { word: true },
      orderBy: [{ wrongCount: 'desc' }, { lastPracticeAt: 'desc' }],
      take: 20,
    });

    // 分析错误模式
    const patterns = this.analyzeErrorPatterns(weakWords);

    // 生成建议
    const suggestions = this.generateSuggestions(weakWords, patterns);

    return {
      words: weakWords.map((uw) => ({
        id: uw.word.id,
        english: uw.word.english,
        chinese: uw.word.chinese,
        wrongCount: uw.wrongCount,
        accuracy:
          uw.correctCount + uw.wrongCount > 0
            ? Math.round((uw.correctCount / (uw.correctCount + uw.wrongCount)) * 100)
            : 0,
        lastWrongAt: uw.lastPracticeAt || new Date(),
      })),
      patterns,
      suggestions,
    };
  }

  // ==================== 词库进度 ====================

  /**
   * 获取词库学习进度
   */
  async getWordBankProgress(userId: string, wordBankId: string) {
    const wordBank = await this.prisma.wordBank.findUnique({
      where: { id: wordBankId },
      include: {
        chapters: {
          where: { isActive: true },
          include: {
            sections: {
              where: { isActive: true },
              include: {
                _count: {
                  select: { sectionWords: true },
                },
              },
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!wordBank) {
      throw new NotFoundException('词库不存在');
    }

    // 获取用户在该词库的所有小节进度
    const sectionIds = wordBank.chapters.flatMap((c) => c.sections.map((s) => s.id));
    const userSections = await this.prisma.userSection.findMany({
      where: {
        userId,
        sectionId: { in: sectionIds },
      },
    });

    const userSectionMap = new Map(userSections.map((us) => [us.sectionId, us]));

    // 计算进度
    let completedSections = 0;
    let totalStars = 0;
    let maxStars = 0;

    const chapters = wordBank.chapters.map((chapter) => {
      const sections = chapter.sections.map((section) => {
        const userSection = userSectionMap.get(section.id);
        maxStars += 9; // 3种模式各3星

        const practiceStars = userSection?.practiceStars || 0;
        const challengeStars = userSection?.challengeStars || 0;
        const speedStars = userSection?.speedStars || 0;
        const sectionStars = practiceStars + challengeStars + speedStars;

        const isCompleted =
          userSection?.practiceCompleted || userSection?.challengeCompleted || false;

        if (isCompleted) {
          completedSections++;
          totalStars += sectionStars;
        }

        return {
          id: section.id,
          name: section.name,
          order: section.order,
          wordCount: section._count.sectionWords,
          isUnlocked: userSection?.unlocked || false,
          practice: {
            completed: userSection?.practiceCompleted || false,
            stars: practiceStars,
            bestScore: userSection?.practiceBestScore || 0,
          },
          challenge: {
            completed: userSection?.challengeCompleted || false,
            stars: challengeStars,
            bestScore: userSection?.challengeBestScore || 0,
          },
          speed: {
            completed: userSection?.speedCompleted || false,
            stars: speedStars,
            bestScore: userSection?.speedBestScore || 0,
          },
        };
      });

      const chapterCompleted = sections.filter(
        (s) => s.practice.completed || s.challenge.completed,
      ).length;

      return {
        id: chapter.id,
        name: chapter.name,
        order: chapter.order,
        sections,
        progress: sections.length > 0 ? Math.round((chapterCompleted / sections.length) * 100) : 0,
      };
    });

    const totalSections = chapters.reduce((sum, c) => sum + c.sections.length, 0);

    // 获取词库掌握度统计
    const masteryDist = await this.getMasteryDistribution(userId, wordBankId);

    return {
      wordBank: {
        id: wordBank.id,
        name: wordBank.name,
        description: wordBank.description,
        totalWords: wordBank.wordCount,
        difficulty: wordBank.difficulty,
      },
      progress: {
        completedSections,
        totalSections,
        percentage: totalSections > 0 ? Math.round((completedSections / totalSections) * 100) : 0,
        totalStars,
        maxStars,
        starPercentage: maxStars > 0 ? Math.round((totalStars / maxStars) * 100) : 0,
      },
      mastery: masteryDist,
      chapters,
    };
  }

  // ==================== 学习报告 ====================

  /**
   * 生成学习报告
   */
  async generateLearningReport(
    userId: string,
    type: 'weekly' | 'monthly',
  ): Promise<LearningReportDto> {
    const days = type === 'weekly' ? 7 : 30;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // 当前周期数据
    const currentStats = await this.getPeriodStats(userId, startDate, endDate);

    // 上一周期数据
    const prevStartDate = new Date(startDate);
    prevStartDate.setDate(prevStartDate.getDate() - days);
    const prevStats = await this.getPeriodStats(userId, prevStartDate, startDate);

    // 新掌握单词数
    const newMastered = await this.prisma.userWord.count({
      where: {
        userId,
        mastery: 'mastered',
        updatedAt: { gte: startDate },
      },
    });

    // 词库进度变化
    const wordBankProgress = await this.getWordBankProgressChanges(userId, startDate);

    // 计算成长
    const wordsGrowth =
      prevStats.totals.wordsLearned > 0
        ? Math.round(
            ((currentStats.totals.wordsLearned - prevStats.totals.wordsLearned) /
              prevStats.totals.wordsLearned) *
              100,
          )
        : 0;

    const accuracyGrowth =
      prevStats.totals.accuracy > 0 ? currentStats.totals.accuracy - prevStats.totals.accuracy : 0;

    const timeGrowth =
      prevStats.totals.duration > 0
        ? Math.round(
            ((currentStats.totals.duration - prevStats.totals.duration) /
              prevStats.totals.duration) *
              100,
          )
        : 0;

    // 亮点成就
    const highlights = this.generateHighlights(currentStats, days);

    // 改进建议
    const suggestions = this.generateReportSuggestions(currentStats, prevStats);

    return {
      period: {
        type,
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0],
      },
      summary: {
        totalWords: currentStats.totals.wordsLearned,
        newWords: currentStats.totals.newWords,
        reviewedWords: currentStats.totals.reviewedWords,
        masteredWords: newMastered,
        totalTime: currentStats.totals.duration,
        totalGames: currentStats.totals.gamesPlayed,
        avgAccuracy: currentStats.totals.accuracy,
        streakDays: await this.calculateCurrentStreak(userId),
      },
      growth: {
        wordsGrowth,
        accuracyGrowth,
        timeGrowth,
      },
      highlights,
      suggestions,
      wordBankProgress,
    };
  }

  // ==================== 每日目标 ====================

  /**
   * 获取每日目标状态
   */
  async getDailyGoalStatus(userId: string): Promise<LearningOverviewDto['dailyGoal']> {
    // 获取用户设置的目标
    const goalKey = CACHE_KEYS.DAILY_GOAL(userId);
    const savedGoal = await this.redis.getJson<SetDailyGoalDto>(goalKey);
    const target = savedGoal?.wordsTarget || DEFAULT_DAILY_GOAL.wordsTarget;

    const todayStats = await this.getTodayStats(userId);
    const completed = todayStats.wordsLearned;

    return {
      target,
      completed,
      percentage: Math.min(100, Math.round((completed / target) * 100)),
      isCompleted: completed >= target,
    };
  }

  /**
   * 设置每日目标
   */
  async setDailyGoal(userId: string, dto: SetDailyGoalDto): Promise<void> {
    const goalKey = CACHE_KEYS.DAILY_GOAL(userId);
    await this.redis.setJson(goalKey, dto, CACHE_TTL.DAILY_GOAL);
  }

  /**
   * 签到/更新连续学习天数
   */
  async checkIn(userId: string): Promise<{
    streakDays: number;
    isNewStreak: boolean;
    expBonus: number;
  }> {
    const userLevel = await this.prisma.userLevel.findUnique({
      where: { userId },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    const lastSignDate = userLevel?.lastSignDate;
    const lastSignStr = lastSignDate?.toISOString().split('T')[0];

    if (lastSignStr === todayStr) {
      // 今天已签到
      return {
        streakDays: userLevel?.consecutiveDays || 1,
        isNewStreak: false,
        expBonus: 0,
      };
    }

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    let newStreak = 1;
    if (lastSignStr === yesterdayStr) {
      // 连续签到
      newStreak = (userLevel?.consecutiveDays || 0) + 1;
    }

    // 计算经验奖励
    const baseExp = 5;
    const streakBonus = Math.min(newStreak, 30); // 最多30天加成
    const expBonus = baseExp + streakBonus;

    // 更新用户等级
    await this.prisma.userLevel.upsert({
      where: { userId },
      create: {
        userId,
        level: 1,
        currentExp: expBonus,
        totalExp: expBonus,
        consecutiveDays: newStreak,
        longestStreak: newStreak,
        lastSignDate: today,
      },
      update: {
        consecutiveDays: newStreak,
        longestStreak: Math.max(userLevel?.longestStreak || 0, newStreak),
        lastSignDate: today,
        currentExp: { increment: expBonus },
        totalExp: { increment: expBonus },
      },
    });

    // 清除缓存
    await this.redis.del(CACHE_KEYS.USER_OVERVIEW(userId));

    return {
      streakDays: newStreak,
      isNewStreak: true,
      expBonus,
    };
  }

  // ==================== 私有辅助方法 ====================

  private getDaysFromRange(range?: TimeRange, customDays?: number): number {
    if (customDays) return customDays;

    switch (range) {
      case TimeRange.TODAY:
        return 1;
      case TimeRange.WEEK:
        return 7;
      case TimeRange.MONTH:
        return 30;
      case TimeRange.YEAR:
        return 365;
      case TimeRange.ALL:
        return 3650; // 10年
      default:
        return 7;
    }
  }

  private async getMasteryStats(userId: string): Promise<{
    total: number;
    mastered: number;
    learning: number;
    needReview: number;
  }> {
    const [mastered, learning, needReview, notLearned] = await Promise.all([
      this.prisma.userWord.count({ where: { userId, mastery: 'mastered' } }),
      this.prisma.userWord.count({ where: { userId, mastery: 'learning' } }),
      this.prisma.userWord.count({ where: { userId, mastery: 'need_review' } }),
      this.prisma.userWord.count({ where: { userId, mastery: 'not_learned' } }),
    ]);

    return {
      total: mastered + learning + needReview + notLearned,
      mastered,
      learning,
      needReview,
    };
  }

  private async getStreakInfo(userId: string): Promise<{
    currentStreak: number;
    longestStreak: number;
  }> {
    const userLevel = await this.prisma.userLevel.findUnique({
      where: { userId },
      select: { consecutiveDays: true, longestStreak: true },
    });

    return {
      currentStreak: userLevel?.consecutiveDays || 0,
      longestStreak: userLevel?.longestStreak || 0,
    };
  }

  private async getLearningHistory(userId: string): Promise<{
    totalDays: number;
    totalTime: number;
  }> {
    const records = await this.prisma.gameRecord.findMany({
      where: { userId },
      select: { createdAt: true, timeUsed: true },
    });

    const uniqueDays = new Set(records.map((r) => r.createdAt.toISOString().split('T')[0]));

    return {
      totalDays: uniqueDays.size,
      totalTime: records.reduce((sum, r) => sum + r.timeUsed, 0),
    };
  }

  private async getNeedReviewCount(userId: string): Promise<number> {
    const now = new Date();
    return this.prisma.userWord.count({
      where: {
        userId,
        nextReviewAt: { lte: now },
        mastery: { not: 'mastered' },
      },
    });
  }

  private async getPeriodStats(
    userId: string,
    startDate: Date,
    endDate: Date,
    wordBankId?: string,
  ): Promise<{
    totals: LearningTrendDto['totals'];
    daily: DailyStatsDto[];
  }> {
    const where: Record<string, unknown> = {
      userId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (wordBankId) {
      where.section = {
        chapter: { wordBankId },
      };
    }

    const records = await this.prisma.gameRecord.findMany({
      where,
      orderBy: { createdAt: 'asc' },
    });

    // 新学单词
    const newWordsCount = await this.prisma.userWord.count({
      where: {
        userId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // 按日期分组
    const dailyMap = new Map<string, DailyStatsDto>();
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      dailyMap.set(dateStr, {
        date: dateStr,
        wordsLearned: 0,
        newWords: 0,
        reviewedWords: 0,
        score: 0,
        duration: 0,
        gamesPlayed: 0,
        correctWords: 0,
        wrongWords: 0,
        accuracy: 0,
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    records.forEach((record) => {
      const dateStr = record.createdAt.toISOString().split('T')[0];
      const stats = dailyMap.get(dateStr);
      if (stats) {
        stats.wordsLearned += record.totalCount;
        stats.score += record.score;
        stats.duration += record.timeUsed;
        stats.gamesPlayed += 1;
        stats.correctWords += record.correctCount;
        stats.wrongWords += record.wrongCount;
      }
    });

    // 计算每日正确率
    dailyMap.forEach((stats) => {
      const total = stats.correctWords + stats.wrongWords;
      stats.accuracy = total > 0 ? Math.round((stats.correctWords / total) * 100) : 0;
    });

    const daily = Array.from(dailyMap.values());

    // 计算总计
    const totals = daily.reduce(
      (acc, day) => ({
        wordsLearned: acc.wordsLearned + day.wordsLearned,
        newWords: newWordsCount,
        reviewedWords: acc.wordsLearned - newWordsCount,
        score: acc.score + day.score,
        duration: acc.duration + day.duration,
        gamesPlayed: acc.gamesPlayed + day.gamesPlayed,
        accuracy: 0,
      }),
      {
        wordsLearned: 0,
        newWords: 0,
        reviewedWords: 0,
        score: 0,
        duration: 0,
        gamesPlayed: 0,
        accuracy: 0,
      },
    );

    const totalCorrect = daily.reduce((sum, d) => sum + d.correctWords, 0);
    const totalWrong = daily.reduce((sum, d) => sum + d.wrongWords, 0);
    totals.accuracy =
      totalCorrect + totalWrong > 0
        ? Math.round((totalCorrect / (totalCorrect + totalWrong)) * 100)
        : 0;

    return { totals, daily };
  }

  private async calculateCurrentStreak(userId: string): Promise<number> {
    const userLevel = await this.prisma.userLevel.findUnique({
      where: { userId },
      select: { consecutiveDays: true },
    });
    return userLevel?.consecutiveDays || 0;
  }

  private async getWordBankProgressChanges(
    userId: string,
    since: Date,
  ): Promise<LearningReportDto['wordBankProgress']> {
    const userWordBanks = await this.prisma.userWordBank.findMany({
      where: { userId },
      include: { wordBank: true },
    });

    // 简化实现：返回当前进度
    return userWordBanks.map((uwb) => ({
      name: uwb.wordBank.name,
      progress: uwb.progress,
      change: 0, // 需要历史数据支持
    }));
  }

  private analyzeErrorPatterns(
    weakWords: Array<{ word: { english: string; tags: string[] }; wrongCount: number }>,
  ): WeakWordsAnalysisDto['patterns'] {
    const patterns: WeakWordsAnalysisDto['patterns'] = {
      commonMistakes: [],
      weakCategories: [],
    };

    // 分析长单词
    const longWords = weakWords.filter((w) => w.word.english.length > 8);
    if (longWords.length >= 3) {
      patterns.commonMistakes.push({
        pattern: '长单词',
        count: longWords.length,
        examples: longWords.slice(0, 3).map((w) => w.word.english),
      });
    }

    // 分析双写字母单词
    const doubleLetterWords = weakWords.filter((w) => /(.)\1/.test(w.word.english));
    if (doubleLetterWords.length >= 2) {
      patterns.commonMistakes.push({
        pattern: '双写字母',
        count: doubleLetterWords.length,
        examples: doubleLetterWords.slice(0, 3).map((w) => w.word.english),
      });
    }

    return patterns;
  }

  private generateSuggestions(
    weakWords: Array<{ wrongCount: number }>,
    patterns: WeakWordsAnalysisDto['patterns'],
  ): string[] {
    const suggestions: string[] = [];

    if (weakWords.length > 10) {
      suggestions.push('建议每天复习5-10个错词，不要一次复习太多');
    }

    if (patterns.commonMistakes.some((p) => p.pattern === '长单词')) {
      suggestions.push('对于长单词，可以尝试分音节记忆');
    }

    if (patterns.commonMistakes.some((p) => p.pattern === '双写字母')) {
      suggestions.push('注意双写字母的规律，如辅音字母在重读闭音节后双写');
    }

    if (suggestions.length === 0) {
      suggestions.push('继续保持当前的学习节奏');
    }

    return suggestions;
  }

  private generateHighlights(
    stats: { totals: LearningTrendDto['totals']; daily: DailyStatsDto[] },
    days: number,
  ): LearningReportDto['highlights'] {
    const highlights: LearningReportDto['highlights'] = [];

    if (stats.totals.wordsLearned > 0) {
      highlights.push({
        type: 'words',
        title: '学习单词',
        value: `${stats.totals.wordsLearned}个`,
        icon: '📚',
      });
    }

    if (stats.totals.accuracy >= 90) {
      highlights.push({
        type: 'accuracy',
        title: '高正确率',
        value: `${stats.totals.accuracy}%`,
        icon: '🎯',
      });
    }

    const activeDays = stats.daily.filter((d) => d.gamesPlayed > 0).length;
    if (activeDays >= days * 0.7) {
      highlights.push({
        type: 'consistency',
        title: '学习天数',
        value: `${activeDays}天`,
        icon: '📅',
      });
    }

    return highlights;
  }

  private generateReportSuggestions(
    current: { totals: LearningTrendDto['totals'] },
    prev: { totals: LearningTrendDto['totals'] },
  ): string[] {
    const suggestions: string[] = [];

    if (current.totals.wordsLearned < prev.totals.wordsLearned) {
      suggestions.push('本周学习量有所下降，建议保持每日学习习惯');
    }

    if (current.totals.accuracy < 70) {
      suggestions.push('正确率较低，建议多复习已学单词');
    }

    if (current.totals.gamesPlayed < 5) {
      suggestions.push('游戏次数较少，建议每天至少完成2-3次练习');
    }

    if (suggestions.length === 0) {
      suggestions.push('继续保持当前的学习状态，你做得很好！');
    }

    return suggestions;
  }
}
