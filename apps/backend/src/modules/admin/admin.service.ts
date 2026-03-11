import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../shared/prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  // ==================== 用户管理 ====================

  /** 获取用户列表（分页+搜索） */
  async getUsers(page: number, limit: number, keyword?: string, status?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (keyword) {
      where.OR = [
        { nickname: { contains: keyword, mode: 'insensitive' } },
        { email: { contains: keyword, mode: 'insensitive' } },
        { phone: { contains: keyword } },
      ];
    }

    if (status) {
      where.status = status;
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          nickname: true,
          email: true,
          phone: true,
          avatarUrl: true,
          role: true,
          status: true,
          gender: true,
          grade: true,
          isGuest: true,
          createdAt: true,
          lastLoginAt: true,
          level: {
            select: { level: true, totalExp: true, consecutiveDays: true },
          },
          _count: {
            select: {
              gameRecords: true,
              userWords: true,
              achievements: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      items: users.map((u) => ({
        ...u,
        avatar: u.avatarUrl,
        gamesCount: u._count.gameRecords,
        wordsCount: u._count.userWords,
        achievementsCount: u._count.achievements,
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /** 获取用户详情 */
  async getUserDetail(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        level: true,
        _count: {
          select: {
            gameRecords: true,
            userWords: true,
            achievements: true,
            wrongBooks: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    // 获取游戏统计
    const stats = await this.prisma.gameRecord.aggregate({
      where: { userId: id },
      _sum: { score: true, timeUsed: true, correctCount: true },
      _avg: { stars: true, accuracy: true },
      _max: { score: true },
    });

    // 按模式统计
    const modeStats = await this.prisma.gameRecord.groupBy({
      by: ['mode'],
      where: { userId: id },
      _count: { id: true },
      _avg: { score: true },
    });

    return {
      ...user,
      passwordHash: undefined,
      avatar: user.avatarUrl,
      statistics: {
        totalGames: user._count.gameRecords,
        totalWords: user._count.userWords,
        totalAchievements: user._count.achievements,
        totalWrongWords: user._count.wrongBooks,
        totalScore: stats._sum?.score || 0,
        totalDuration: stats._sum?.timeUsed || 0,
        totalCorrect: stats._sum?.correctCount || 0,
        avgStars: Math.round((stats._avg?.stars || 0) * 10) / 10,
        avgAccuracy: Math.round((stats._avg?.accuracy || 0) * 100) / 100,
        maxScore: stats._max?.score || 0,
        modeStats,
      },
    };
  }

  /** 更新用户状态 */
  async updateUserStatus(id: string, status: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('用户不存在');

    return this.prisma.user.update({
      where: { id },
      data: { status: status as any },
      select: { id: true, nickname: true, status: true },
    });
  }

  /** 重置用户密码 */
  async resetUserPassword(id: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('用户不存在');

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id },
      data: { passwordHash },
    });

    return { success: true, message: '密码重置成功' };
  }

  /** 获取用户游戏记录 */
  async getUserGameRecords(userId: string, page: number, limit: number, mode?: string) {
    const skip = (page - 1) * limit;
    const where: any = { userId };
    if (mode) where.mode = mode;

    const [records, total] = await Promise.all([
      this.prisma.gameRecord.findMany({
        where,
        include: {
          section: {
            include: {
              chapter: {
                include: {
                  wordBank: { select: { id: true, name: true } },
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.gameRecord.count({ where }),
    ]);

    return {
      items: records,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /** 获取用户学习进度 */
  async getUserProgress(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('用户不存在');

    // 词库进度
    const wordBankProgress = await this.prisma.userWordBank.findMany({
      where: { userId },
      include: {
        wordBank: { select: { id: true, name: true, wordCount: true, chapterCount: true } },
      },
      orderBy: { lastStudyAt: 'desc' },
    });

    // 小节进度统计
    const sectionStats = await this.prisma.userSection.aggregate({
      where: { userId },
      _count: { id: true },
      _sum: {
        practiceStars: true,
        challengeStars: true,
      },
    });

    const completedSections = await this.prisma.userSection.count({
      where: { userId, practiceCompleted: true },
    });

    // 单词掌握情况
    const wordMastery = await this.prisma.userWord.groupBy({
      by: ['mastery'],
      where: { userId },
      _count: { id: true },
    });

    return {
      wordBankProgress,
      sectionStats: {
        total: sectionStats._count.id,
        completed: completedSections,
        totalPracticeStars: sectionStats._sum?.practiceStars || 0,
        totalChallengeStars: sectionStats._sum?.challengeStars || 0,
      },
      wordMastery,
    };
  }

  /** 更新用户角色 */
  async updateUserRole(id: string, role: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('用户不存在');

    return this.prisma.user.update({
      where: { id },
      data: { role: role as any },
      select: { id: true, nickname: true, role: true },
    });
  }

  // ==================== 分类管理 ====================

  /** 获取所有分类（树形） */
  async getCategories() {
    const categories = await this.prisma.category.findMany({
      orderBy: { sort: 'asc' },
      include: {
        _count: { select: { wordBanks: true } },
      },
    });
    return categories;
  }

  /** 创建分类 */
  async createCategory(data: {
    name: string;
    code: string;
    description?: string;
    parentId?: string;
    sort?: number;
  }) {
    return this.prisma.category.create({ data });
  }

  /** 更新分类 */
  async updateCategory(id: string, data: { name?: string; description?: string; sort?: number; isActive?: boolean }) {
    return this.prisma.category.update({ where: { id }, data });
  }

  /** 删除分类 */
  async deleteCategory(id: string) {
    const count = await this.prisma.wordBank.count({ where: { categoryId: id } });
    if (count > 0) throw new BadRequestException(`该分类下有${count}个词库，无法删除`);
    await this.prisma.category.delete({ where: { id } });
    return { success: true };
  }

  // ==================== 词库管理 ====================

  /** 获取词库列表 */
  async getWordBanks(page: number, limit: number, keyword?: string, categoryId?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (keyword) where.name = { contains: keyword, mode: 'insensitive' };
    if (categoryId) where.categoryId = categoryId;

    const [wordBanks, total] = await Promise.all([
      this.prisma.wordBank.findMany({
        where,
        include: {
          category: { select: { id: true, name: true } },
          _count: { select: { chapters: true, userWordBanks: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.wordBank.count({ where }),
    ]);

    // 实时统计每个词库的真实单词数
    const wordBankIds = wordBanks.map((wb) => wb.id);
    const wordCountResults = await this.prisma.sectionWord.groupBy({
      by: ['sectionId'],
      where: {
        section: {
          chapter: {
            wordBankId: { in: wordBankIds },
          },
        },
      },
      _count: { id: true },
    });

    // 通过 section -> chapter -> wordBank 映射统计每个词库的单词数
    const sectionIds = wordCountResults.map((r) => r.sectionId);
    const sections = await this.prisma.section.findMany({
      where: { id: { in: sectionIds } },
      select: { id: true, chapter: { select: { wordBankId: true } } },
    });

    const sectionToWordBank = new Map(
      sections.map((s) => [s.id, s.chapter.wordBankId]),
    );

    const realWordCountMap = new Map<string, number>();
    for (const r of wordCountResults) {
      const wbId = sectionToWordBank.get(r.sectionId);
      if (wbId) {
        realWordCountMap.set(wbId, (realWordCountMap.get(wbId) || 0) + r._count.id);
      }
    }

    return {
      items: wordBanks.map((wb) => ({
        ...wb,
        wordCount: realWordCountMap.get(wb.id) ?? wb.wordCount,
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /** 创建词库 */
  async createWordBank(data: {
    name: string;
    code: string;
    description?: string;
    coverImage?: string;
    difficulty?: number;
    categoryId: string;
    isFree?: boolean;
    sort?: number;
  }) {
    return this.prisma.wordBank.create({ data });
  }

  /** 更新词库 */
  async updateWordBank(id: string, data: {
    name?: string;
    description?: string;
    coverImage?: string;
    difficulty?: number;
    isActive?: boolean;
    isFree?: boolean;
    sort?: number;
  }) {
    return this.prisma.wordBank.update({ where: { id }, data });
  }

  /** 删除词库 */
  async deleteWordBank(id: string) {
    const usersCount = await this.prisma.userWordBank.count({ where: { wordBankId: id } });
    if (usersCount > 0) throw new BadRequestException(`有${usersCount}个用户正在学习该词库，无法删除`);
    await this.prisma.wordBank.delete({ where: { id } });
    return { success: true };
  }

  // ==================== 章节管理 ====================

  /** 获取章节列表 */
  async getChapters(wordBankId: string) {
    return this.prisma.chapter.findMany({
      where: { wordBankId },
      include: {
        _count: { select: { sections: true } },
      },
      orderBy: { order: 'asc' },
    });
  }

  /** 创建章节 */
  async createChapter(wordBankId: string, data: { name: string; description?: string; order?: number }) {
    const maxOrder = await this.prisma.chapter.aggregate({
      where: { wordBankId },
      _max: { order: true },
    });

    return this.prisma.chapter.create({
      data: {
        wordBankId,
        name: data.name,
        description: data.description,
        order: data.order ?? (maxOrder._max?.order || 0) + 1,
      },
    });
  }

  /** 更新章节 */
  async updateChapter(id: string, data: { name?: string; description?: string; order?: number; isActive?: boolean }) {
    return this.prisma.chapter.update({ where: { id }, data });
  }

  /** 删除章节 */
  async deleteChapter(id: string) {
    await this.prisma.chapter.delete({ where: { id } });
    return { success: true };
  }

  // ==================== 小节管理 ====================

  /** 获取小节列表 */
  async getSections(chapterId: string) {
    return this.prisma.section.findMany({
      where: { chapterId },
      include: {
        _count: { select: { sectionWords: true } },
      },
      orderBy: { order: 'asc' },
    });
  }

  /** 创建小节 */
  async createSection(chapterId: string, data: { name: string; order?: number; timeLimit?: number }) {
    const maxOrder = await this.prisma.section.aggregate({
      where: { chapterId },
      _max: { order: true },
    });

    return this.prisma.section.create({
      data: {
        chapterId,
        name: data.name,
        order: data.order ?? (maxOrder._max?.order || 0) + 1,
        timeLimit: data.timeLimit || 0,
      },
    });
  }

  /** 更新小节 */
  async updateSection(id: string, data: { name?: string; order?: number; timeLimit?: number; isActive?: boolean }) {
    return this.prisma.section.update({ where: { id }, data });
  }

  /** 删除小节 */
  async deleteSection(id: string) {
    await this.prisma.section.delete({ where: { id } });
    return { success: true };
  }

  // ==================== 单词管理 ====================

  /** 获取小节单词列表 */
  async getSectionWords(sectionId: string) {
    return this.prisma.sectionWord.findMany({
      where: { sectionId },
      include: { word: true },
      orderBy: { order: 'asc' },
    });
  }

  /** 全局单词列表（分页+搜索） */
  async getWords(page: number, limit: number, keyword?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (keyword) {
      where.OR = [
        { english: { contains: keyword, mode: 'insensitive' } },
        { chinese: { contains: keyword } },
      ];
    }

    const [words, total] = await Promise.all([
      this.prisma.word.findMany({
        where,
        include: {
          _count: { select: { sectionWords: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.word.count({ where }),
    ]);

    return {
      items: words,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /** 创建单词 */
  async createWord(data: {
    english: string;
    chinese: string;
    phonetic?: string;
    difficulty?: number;
    exampleSentence?: string;
    exampleChinese?: string;
    tags?: string[];
  }) {
    return this.prisma.word.create({ data });
  }

  /** 更新单词 */
  async updateWord(id: string, data: {
    english?: string;
    chinese?: string;
    phonetic?: string;
    difficulty?: number;
    exampleSentence?: string;
    exampleChinese?: string;
    tags?: string[];
  }) {
    return this.prisma.word.update({ where: { id }, data });
  }

  /** 删除单词 */
  async deleteWord(id: string) {
    const count = await this.prisma.sectionWord.count({ where: { wordId: id } });
    if (count > 0) throw new BadRequestException(`该单词被${count}个小节使用，无法删除`);
    await this.prisma.word.delete({ where: { id } });
    return { success: true };
  }

  /** 添加单词到小节 */
  async addWordToSection(sectionId: string, data: { wordId: string; order?: number }) {
    const maxOrder = await this.prisma.sectionWord.aggregate({
      where: { sectionId },
      _max: { order: true },
    });

    const result = await this.prisma.sectionWord.create({
      data: {
        sectionId,
        wordId: data.wordId,
        order: data.order ?? (maxOrder._max?.order || 0) + 1,
      },
      include: { word: true },
    });

    // 更新小节单词数
    await this.prisma.section.update({
      where: { id: sectionId },
      data: { wordCount: { increment: 1 } },
    });

    return result;
  }

  /** 从小节移除单词 */
  async removeWordFromSection(sectionId: string, wordId: string) {
    await this.prisma.sectionWord.delete({
      where: { sectionId_wordId: { sectionId, wordId } },
    });

    await this.prisma.section.update({
      where: { id: sectionId },
      data: { wordCount: { decrement: 1 } },
    });

    return { success: true };
  }

  /** 批量添加单词到小节 */
  async batchAddWordsToSection(sectionId: string, wordIds: string[]) {
    const maxOrder = await this.prisma.sectionWord.aggregate({
      where: { sectionId },
      _max: { order: true },
    });

    let currentOrder = (maxOrder._max?.order || 0) + 1;

    const creates = wordIds.map((wordId) => ({
      sectionId,
      wordId,
      order: currentOrder++,
    }));

    await this.prisma.sectionWord.createMany({
      data: creates,
      skipDuplicates: true,
    });

    await this.prisma.section.update({
      where: { id: sectionId },
      data: { wordCount: { increment: wordIds.length } },
    });

    return { success: true, added: wordIds.length };
  }

  // ==================== 统计数据 ====================

  /** 总览统计 */
  async getOverviewStats() {
    const [
      totalUsers,
      totalWordBanks,
      totalWords,
      totalGames,
      activeUsers,
      guestUsers,
    ] = await Promise.all([
      this.prisma.user.count({ where: { isGuest: false } }),
      this.prisma.wordBank.count(),
      this.prisma.word.count(),
      this.prisma.gameRecord.count(),
      this.prisma.user.count({
        where: { lastLoginAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
      }),
      this.prisma.user.count({ where: { isGuest: true } }),
    ]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [todayNewUsers, todayGames, totalChapters, totalSections] = await Promise.all([
      this.prisma.user.count({ where: { createdAt: { gte: today } } }),
      this.prisma.gameRecord.count({ where: { createdAt: { gte: today } } }),
      this.prisma.chapter.count(),
      this.prisma.section.count(),
    ]);

    // 今日游戏得分统计
    const todayScoreStats = await this.prisma.gameRecord.aggregate({
      where: { createdAt: { gte: today } },
      _avg: { score: true, accuracy: true },
      _sum: { score: true },
    });

    return {
      totalUsers,
      guestUsers,
      totalWordBanks,
      totalWords,
      totalGames,
      activeUsers,
      totalChapters,
      totalSections,
      todayNewUsers,
      todayGames,
      todayAvgScore: Math.round(todayScoreStats._avg?.score || 0),
      todayAvgAccuracy: Math.round((todayScoreStats._avg?.accuracy || 0) * 100) / 100,
    };
  }

  /** 每日统计 */
  async getDailyStats(days: number) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const [users, games] = await Promise.all([
      this.prisma.user.findMany({
        where: { createdAt: { gte: startDate } },
        select: { createdAt: true },
      }),
      this.prisma.gameRecord.findMany({
        where: { createdAt: { gte: startDate } },
        select: { createdAt: true, score: true, accuracy: true },
      }),
    ]);

    const statsMap = new Map<string, { newUsers: number; games: number; totalScore: number; avgAccuracy: number }>();

    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      statsMap.set(dateStr, { newUsers: 0, games: 0, totalScore: 0, avgAccuracy: 0 });
    }

    users.forEach((item) => {
      const dateStr = item.createdAt.toISOString().split('T')[0];
      const stats = statsMap.get(dateStr);
      if (stats) stats.newUsers += 1;
    });

    games.forEach((item) => {
      const dateStr = item.createdAt.toISOString().split('T')[0];
      const stats = statsMap.get(dateStr);
      if (stats) {
        stats.games += 1;
        stats.totalScore += item.score;
        stats.avgAccuracy += item.accuracy;
      }
    });

    return Array.from(statsMap.entries()).map(([date, stats]) => ({
      date,
      newUsers: stats.newUsers,
      games: stats.games,
      totalScore: stats.totalScore,
      avgAccuracy: stats.games > 0 ? Math.round((stats.avgAccuracy / stats.games) * 100) / 100 : 0,
    }));
  }

  /** 游戏模式分布统计 */
  async getGameModeStats() {
    return this.prisma.gameRecord.groupBy({
      by: ['mode'],
      _count: { id: true },
      _avg: { score: true, accuracy: true, stars: true },
    });
  }
}