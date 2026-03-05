import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { RedisService } from '../../shared/redis/redis.service';
import { QueryWrongBookDto, WrongBookPracticeDto } from './dto';

// 缓存键
const CACHE_KEYS = {
  WRONG_BOOK_STATS: (userId: string) => `wrongbook:stats:${userId}`,
  WRONG_BOOK_LIST: (userId: string, page: number) => `wrongbook:list:${userId}:${page}`,
};

// 缓存过期时间（秒）
const CACHE_TTL = {
  STATS: 300, // 5分钟
  LIST: 60, // 1分钟
};

@Injectable()
export class WrongBookService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  // ==================== 错词列表 ====================

  /**
   * 获取错词列表
   */
  async getWrongWords(userId: string, query: QueryWrongBookDto) {
    const { page = 1, limit = 20, wordBankId, sortBy = 'wrongCount', minWrongCount } = query;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      userId,
      isRemoved: false,
    };

    if (minWrongCount) {
      where.wrongCount = { gte: minWrongCount };
    }

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

    // 排序选项
    const orderBy: Record<string, unknown>[] = [];
    switch (sortBy) {
      case 'wrongCount':
        orderBy.push({ wrongCount: 'desc' });
        break;
      case 'recent':
        orderBy.push({ updatedAt: 'desc' });
        break;
      case 'difficulty':
        orderBy.push({ word: { difficulty: 'desc' } });
        break;
      default:
        orderBy.push({ wrongCount: 'desc' });
    }
    orderBy.push({ updatedAt: 'desc' });

    const [wrongWords, total] = await Promise.all([
      this.prisma.wrongBook.findMany({
        where,
        include: {
          word: {
            select: {
              id: true,
              english: true,
              chinese: true,
              phonetic: true,
              difficulty: true,
              exampleSentence: true,
              exampleChinese: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.wrongBook.count({ where }),
    ]);

    // 获取每个单词的学习记录
    const wordIds = wrongWords.map((ww) => ww.wordId);
    const userWords = await this.prisma.userWord.findMany({
      where: {
        userId,
        wordId: { in: wordIds },
      },
      select: {
        wordId: true,
        correctCount: true,
        wrongCount: true,
        lastPracticeAt: true,
      },
    });
    const userWordMap = new Map(userWords.map((uw) => [uw.wordId, uw]));

    return {
      items: wrongWords.map((ww) => {
        const userWord = userWordMap.get(ww.wordId);
        const totalAttempts = (userWord?.correctCount || 0) + (userWord?.wrongCount || 0);
        return {
          id: ww.word.id,
          english: ww.word.english,
          chinese: ww.word.chinese,
          phonetic: ww.word.phonetic,
          difficulty: ww.word.difficulty,
          example: ww.word.exampleSentence
            ? {
                sentence: ww.word.exampleSentence,
                chinese: ww.word.exampleChinese,
              }
            : null,
          wrongCount: ww.wrongCount,
          totalAttempts,
          accuracy:
            totalAttempts > 0
              ? Math.round(((userWord?.correctCount || 0) / totalAttempts) * 100)
              : 0,
          lastWrongAt: ww.updatedAt,
          lastPracticeAt: userWord?.lastPracticeAt,
          addedAt: ww.createdAt,
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
   * 获取错词统计
   */
  async getStatistics(userId: string) {
    // 尝试从缓存获取
    const cacheKey = CACHE_KEYS.WRONG_BOOK_STATS(userId);
    const cached = await this.redis.getJson(cacheKey);
    if (cached) {
      return cached;
    }

    // 总错词数
    const totalWrongWords = await this.prisma.wrongBook.count({
      where: { userId, isRemoved: false },
    });

    // 今日新增错词
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayNewWrong = await this.prisma.wrongBook.count({
      where: {
        userId,
        isRemoved: false,
        createdAt: { gte: today },
      },
    });

    // 高频错词数（错误3次以上）
    const frequentWrongCount = await this.prisma.wrongBook.count({
      where: {
        userId,
        isRemoved: false,
        wrongCount: { gte: 3 },
      },
    });

    // 高频错词列表（前10个）
    const frequentWrong = await this.prisma.wrongBook.findMany({
      where: { userId, isRemoved: false },
      include: {
        word: {
          select: {
            id: true,
            english: true,
            chinese: true,
            difficulty: true,
          },
        },
      },
      orderBy: { wrongCount: 'desc' },
      take: 10,
    });

    // 按难度分布
    const difficultyDistribution = await this.getDifficultyDistribution(userId);

    // 最近移除的错词数（已掌握）
    const recentlyMastered = await this.prisma.wrongBook.count({
      where: {
        userId,
        isRemoved: true,
        updatedAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7天内
        },
      },
    });

    const result = {
      totalWrongWords,
      todayNewWrong,
      frequentWrongCount,
      recentlyMastered,
      frequentWrong: frequentWrong.map((ww) => ({
        id: ww.word.id,
        english: ww.word.english,
        chinese: ww.word.chinese,
        difficulty: ww.word.difficulty,
        wrongCount: ww.wrongCount,
      })),
      difficultyDistribution,
    };

    // 缓存结果
    await this.redis.setJson(cacheKey, result, CACHE_TTL.STATS);

    return result;
  }

  /**
   * 获取错词分析
   */
  async getAnalysis(userId: string) {
    const wrongWords = await this.prisma.wrongBook.findMany({
      where: { userId, isRemoved: false },
      include: {
        word: {
          select: {
            english: true,
            chinese: true,
            difficulty: true,
            tags: true,
          },
        },
      },
      orderBy: { wrongCount: 'desc' },
    });

    // 分析错误模式
    const patterns = this.analyzePatterns(wrongWords);

    // 分析薄弱领域
    const weakAreas = this.analyzeWeakAreas(wrongWords);

    // 生成改进建议
    const suggestions = this.generateSuggestions(wrongWords, patterns, weakAreas);

    // 学习效率分析
    const efficiency = await this.analyzeEfficiency(userId);

    return {
      totalWrongWords: wrongWords.length,
      patterns,
      weakAreas,
      suggestions,
      efficiency,
    };
  }

  // ==================== 错词练习 ====================

  /**
   * 开始错词练习
   */
  async startPractice(userId: string, dto: WrongBookPracticeDto) {
    const { wordIds, limit = 20, frequentOnly = false, shuffle = true } = dto;

    let wrongWords;

    if (wordIds && wordIds.length > 0) {
      // 练习指定单词
      wrongWords = await this.prisma.wrongBook.findMany({
        where: {
          userId,
          wordId: { in: wordIds },
          isRemoved: false,
        },
        include: {
          word: {
            select: {
              id: true,
              english: true,
              chinese: true,
              phonetic: true,
              difficulty: true,
            },
          },
        },
      });
    } else if (frequentOnly) {
      // 只练习高频错词
      wrongWords = await this.prisma.wrongBook.findMany({
        where: {
          userId,
          isRemoved: false,
          wrongCount: { gte: 3 },
        },
        include: {
          word: {
            select: {
              id: true,
              english: true,
              chinese: true,
              phonetic: true,
              difficulty: true,
            },
          },
        },
        orderBy: { wrongCount: 'desc' },
        take: limit,
      });
    } else {
      // 智能选择：优先高频错词和最近出错的
      wrongWords = await this.prisma.wrongBook.findMany({
        where: { userId, isRemoved: false },
        include: {
          word: {
            select: {
              id: true,
              english: true,
              chinese: true,
              phonetic: true,
              difficulty: true,
            },
          },
        },
        orderBy: [{ wrongCount: 'desc' }, { updatedAt: 'desc' }],
        take: limit,
      });
    }

    if (wrongWords.length === 0) {
      return {
        message: '错词本为空，继续学习新单词吧！',
        words: [],
        totalWords: 0,
      };
    }

    // 随机打乱顺序
    let practiceWords = wrongWords.map((ww) => ({
      id: ww.word.id,
      chinese: ww.word.chinese,
      phonetic: ww.word.phonetic,
      difficulty: ww.word.difficulty,
      wrongCount: ww.wrongCount,
    }));

    if (shuffle) {
      practiceWords = this.shuffleArray(practiceWords);
    }

    return {
      totalWords: practiceWords.length,
      words: practiceWords,
      practiceMode: 'wrongbook',
    };
  }

  /**
   * 记录练习结果
   */
  async recordPracticeResult(
    userId: string,
    wordId: string,
    isCorrect: boolean,
  ): Promise<{ removed: boolean; message: string }> {
    const wrongWord = await this.prisma.wrongBook.findUnique({
      where: {
        userId_wordId: { userId, wordId },
      },
    });

    if (!wrongWord) {
      return { removed: false, message: '单词不在错词本中' };
    }

    if (isCorrect) {
      // 连续答对后从错词本移除
      const userWord = await this.prisma.userWord.findUnique({
        where: {
          userId_wordId: { userId, wordId },
        },
      });

      // 如果用户连续正确次数达到3次，从错词本移除
      if (userWord && userWord.correctCount >= 3 && wrongWord.wrongCount <= 2) {
        await this.prisma.wrongBook.update({
          where: {
            userId_wordId: { userId, wordId },
          },
          data: { isRemoved: true },
        });

        // 清除缓存
        await this.clearCache(userId);

        return { removed: true, message: '恭喜！该单词已从错词本移除' };
      }
    }

    return { removed: false, message: isCorrect ? '继续加油！' : '再接再厉！' };
  }

  // ==================== 错词管理 ====================

  /**
   * 手动添加单词到错词本
   */
  async addWord(userId: string, wordId: string): Promise<{ success: boolean; message: string }> {
    // 检查单词是否存在
    const word = await this.prisma.word.findUnique({
      where: { id: wordId },
    });

    if (!word) {
      throw new NotFoundException('单词不存在');
    }

    // 检查是否已在错词本
    const existing = await this.prisma.wrongBook.findUnique({
      where: {
        userId_wordId: { userId, wordId },
      },
    });

    if (existing && !existing.isRemoved) {
      return { success: false, message: '该单词已在错词本中' };
    }

    if (existing) {
      // 恢复已移除的单词
      await this.prisma.wrongBook.update({
        where: {
          userId_wordId: { userId, wordId },
        },
        data: {
          isRemoved: false,
          wrongCount: { increment: 1 },
        },
      });
    } else {
      // 添加新单词
      await this.prisma.wrongBook.create({
        data: {
          userId,
          wordId,
          wrongCount: 1,
        },
      });
    }

    // 清除缓存
    await this.clearCache(userId);

    return { success: true, message: '已添加到错词本' };
  }

  /**
   * 从错词本移除单词
   */
  async removeWord(userId: string, wordId: string): Promise<{ success: boolean }> {
    const wrongWord = await this.prisma.wrongBook.findUnique({
      where: {
        userId_wordId: { userId, wordId },
      },
    });

    if (!wrongWord) {
      throw new NotFoundException('该单词不在错词本中');
    }

    await this.prisma.wrongBook.update({
      where: {
        userId_wordId: { userId, wordId },
      },
      data: { isRemoved: true },
    });

    // 清除缓存
    await this.clearCache(userId);

    return { success: true };
  }

  /**
   * 批量移除单词
   */
  async removeWords(
    userId: string,
    wordIds: string[],
  ): Promise<{ success: boolean; count: number }> {
    const result = await this.prisma.wrongBook.updateMany({
      where: {
        userId,
        wordId: { in: wordIds },
      },
      data: { isRemoved: true },
    });

    // 清除缓存
    await this.clearCache(userId);

    return { success: true, count: result.count };
  }

  /**
   * 清空错词本
   */
  async clearAll(userId: string): Promise<{ success: boolean; deletedCount: number }> {
    const result = await this.prisma.wrongBook.updateMany({
      where: { userId, isRemoved: false },
      data: { isRemoved: true },
    });

    // 清除缓存
    await this.clearCache(userId);

    return {
      success: true,
      deletedCount: result.count,
    };
  }

  /**
   * 恢复已移除的单词
   */
  async restoreWord(userId: string, wordId: string): Promise<{ success: boolean }> {
    const wrongWord = await this.prisma.wrongBook.findUnique({
      where: {
        userId_wordId: { userId, wordId },
      },
    });

    if (!wrongWord) {
      throw new NotFoundException('记录不存在');
    }

    if (!wrongWord.isRemoved) {
      throw new BadRequestException('该单词已在错词本中');
    }

    await this.prisma.wrongBook.update({
      where: {
        userId_wordId: { userId, wordId },
      },
      data: { isRemoved: false },
    });

    // 清除缓存
    await this.clearCache(userId);

    return { success: true };
  }

  /**
   * 获取已移除的单词（历史记录）
   */
  async getRemovedWords(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [words, total] = await Promise.all([
      this.prisma.wrongBook.findMany({
        where: {
          userId,
          isRemoved: true,
        },
        include: {
          word: {
            select: {
              id: true,
              english: true,
              chinese: true,
              phonetic: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.wrongBook.count({
        where: { userId, isRemoved: true },
      }),
    ]);

    return {
      items: words.map((ww) => ({
        id: ww.word.id,
        english: ww.word.english,
        chinese: ww.word.chinese,
        phonetic: ww.word.phonetic,
        wrongCount: ww.wrongCount,
        removedAt: ww.updatedAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ==================== 私有辅助方法 ====================

  private async getDifficultyDistribution(userId: string): Promise<Record<number, number>> {
    const wrongWords = await this.prisma.wrongBook.findMany({
      where: { userId, isRemoved: false },
      include: {
        word: {
          select: { difficulty: true },
        },
      },
    });

    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    wrongWords.forEach((ww) => {
      const diff = ww.word.difficulty;
      distribution[diff] = (distribution[diff] || 0) + 1;
    });

    return distribution;
  }

  private analyzePatterns(
    wrongWords: Array<{ word: { english: string; difficulty: number } }>,
  ): Array<{
    pattern: string;
    count: number;
    percentage: number;
  }> {
    const patterns: Array<{ pattern: string; count: number; percentage: number }> = [];
    const total = wrongWords.length || 1;

    // 分析长单词
    const longWords = wrongWords.filter((w) => w.word.english.length > 8);
    if (longWords.length > 0) {
      patterns.push({
        pattern: '长单词（8个字母以上）',
        count: longWords.length,
        percentage: Math.round((longWords.length / total) * 100),
      });
    }

    // 分析双写字母
    const doubleLetterWords = wrongWords.filter((w) => /(.)\1/.test(w.word.english));
    if (doubleLetterWords.length > 0) {
      patterns.push({
        pattern: '双写字母单词',
        count: doubleLetterWords.length,
        percentage: Math.round((doubleLetterWords.length / total) * 100),
      });
    }

    // 分析高难度单词
    const hardWords = wrongWords.filter((w) => w.word.difficulty >= 4);
    if (hardWords.length > 0) {
      patterns.push({
        pattern: '高难度单词',
        count: hardWords.length,
        percentage: Math.round((hardWords.length / total) * 100),
      });
    }

    // 分析特殊拼写
    const specialSpelling = wrongWords.filter((w) =>
      /ph|gh|igh|ough|tion|sion/.test(w.word.english),
    );
    if (specialSpelling.length > 0) {
      patterns.push({
        pattern: '特殊拼写规则',
        count: specialSpelling.length,
        percentage: Math.round((specialSpelling.length / total) * 100),
      });
    }

    return patterns.sort((a, b) => b.count - a.count);
  }

  private analyzeWeakAreas(
    wrongWords: Array<{ word: { tags: string[] } }>,
  ): Array<{ area: string; count: number }> {
    const areaCount = new Map<string, number>();

    wrongWords.forEach((ww) => {
      ww.word.tags?.forEach((tag) => {
        areaCount.set(tag, (areaCount.get(tag) || 0) + 1);
      });
    });

    return Array.from(areaCount.entries())
      .map(([area, count]) => ({ area, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  private generateSuggestions(
    wrongWords: Array<{ wrongCount: number }>,
    patterns: Array<{ pattern: string; count: number }>,
    weakAreas: Array<{ area: string; count: number }>,
  ): string[] {
    const suggestions: string[] = [];

    // 基于错词数量
    if (wrongWords.length > 50) {
      suggestions.push('错词较多，建议每天专注复习10-15个，循序渐进');
    } else if (wrongWords.length > 20) {
      suggestions.push('建议每天复习5-10个错词，并结合新单词学习');
    }

    // 基于错误模式
    const topPattern = patterns[0];
    if (topPattern) {
      switch (topPattern.pattern) {
        case '长单词（8个字母以上）':
          suggestions.push('长单词建议分音节记忆，先记住发音再记拼写');
          break;
        case '双写字母单词':
          suggestions.push('注意双写字母的规律：重读闭音节结尾的单音节词，双写末尾辅音字母');
          break;
        case '高难度单词':
          suggestions.push('高难度单词建议结合词根词缀记忆，理解单词构成');
          break;
        case '特殊拼写规则':
          suggestions.push('建议系统学习英语发音规则，如ph发/f/，tion发/ʃən/');
          break;
      }
    }

    // 基于薄弱领域
    if (weakAreas.length > 0) {
      suggestions.push(
        `薄弱领域：${weakAreas
          .slice(0, 2)
          .map((a) => a.area)
          .join('、')}，建议加强这些类别的单词练习`,
      );
    }

    // 通用建议
    if (suggestions.length < 2) {
      suggestions.push('建议在清晨或睡前复习，记忆效果更好');
    }

    return suggestions;
  }

  private async analyzeEfficiency(userId: string): Promise<{
    avgReviewTimes: number;
    successRate: number;
    avgDaysToMaster: number;
  }> {
    // 获取已移除（掌握）的单词
    const masteredWords = await this.prisma.wrongBook.findMany({
      where: { userId, isRemoved: true },
      select: {
        wrongCount: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (masteredWords.length === 0) {
      return {
        avgReviewTimes: 0,
        successRate: 0,
        avgDaysToMaster: 0,
      };
    }

    // 计算平均复习次数
    const totalWrongCount = masteredWords.reduce((sum, w) => sum + w.wrongCount, 0);
    const avgReviewTimes = Math.round(totalWrongCount / masteredWords.length);

    // 计算成功率（基于总的正确/错误比例）
    const currentWrong = await this.prisma.wrongBook.count({
      where: { userId, isRemoved: false },
    });
    const successRate =
      masteredWords.length + currentWrong > 0
        ? Math.round((masteredWords.length / (masteredWords.length + currentWrong)) * 100)
        : 0;

    // 计算平均掌握天数
    const totalDays = masteredWords.reduce((sum, w) => {
      const days = Math.ceil(
        (w.updatedAt.getTime() - w.createdAt.getTime()) / (24 * 60 * 60 * 1000),
      );
      return sum + days;
    }, 0);
    const avgDaysToMaster = Math.round(totalDays / masteredWords.length);

    return {
      avgReviewTimes,
      successRate,
      avgDaysToMaster,
    };
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  private async clearCache(userId: string): Promise<void> {
    await Promise.all([
      this.redis.del(CACHE_KEYS.WRONG_BOOK_STATS(userId)),
      this.redis.delPattern(CACHE_KEYS.WRONG_BOOK_LIST(userId, 0).replace(':0', ':*')),
    ]);
  }
}
