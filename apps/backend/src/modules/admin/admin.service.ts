import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  // ==================== 用户管理 ====================

  async getUsers(page: number, limit: number, keyword?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (keyword) {
      where.OR = [
        { nickname: { contains: keyword } },
        { email: { contains: keyword } },
        { phone: { contains: keyword } },
      ];
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
          createdAt: true,
          lastLoginAt: true,
          _count: {
            select: {
              gameRecords: true,
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
      items: users.map(u => ({
        ...u,
        avatar: u.avatarUrl,
        gamesCount: u._count.gameRecords,
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getUserDetail(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            gameRecords: true,
            userWords: true,
            achievements: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    // 获取学习统计
    const stats = await this.prisma.gameRecord.aggregate({
      where: { userId: id },
      _sum: { score: true, timeUsed: true },
      _avg: { stars: true },
    });

    return {
      ...user,
      passwordHash: undefined,
      avatar: user.avatarUrl,
      statistics: {
        totalGames: user._count.gameRecords,
        totalWords: user._count.userWords,
        totalAchievements: user._count.achievements,
        totalScore: stats._sum?.score || 0,
        totalDuration: stats._sum?.timeUsed || 0,
        avgStars: stats._avg?.stars || 0,
      },
    };
  }

  async updateUserStatus(id: string, status: 'active' | 'banned') {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    return this.prisma.user.update({
      where: { id },
      data: { status },
      select: { id: true, nickname: true, status: true },
    });
  }

  // ==================== 词库管理 ====================

  async getWordBanks(page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [wordBanks, total] = await Promise.all([
      this.prisma.wordBank.findMany({
        include: {
          category: { select: { id: true, name: true } },
          _count: { select: { chapters: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.wordBank.count(),
    ]);

    return {
      items: wordBanks,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async createWordBank(data: {
    name: string;
    description?: string;
    coverImage?: string;
    difficulty?: number;
    categoryId: string;
    code: string;
  }) {
    return this.prisma.wordBank.create({
      data: {
        name: data.name,
        code: data.code,
        description: data.description,
        coverImage: data.coverImage,
        difficulty: data.difficulty || 1,
        categoryId: data.categoryId,
      },
    });
  }

  async updateWordBank(
    id: string,
    data: {
      name?: string;
      description?: string;
      coverImage?: string;
      difficulty?: number;
      isActive?: boolean;
    },
  ) {
    return this.prisma.wordBank.update({
      where: { id },
      data,
    });
  }

  async deleteWordBank(id: string) {
    // 检查是否有用户正在学习该词库
    const usersCount = await this.prisma.userWordBank.count({
      where: { wordBankId: id },
    });

    if (usersCount > 0) {
      throw new BadRequestException(`有${usersCount}个用户正在学习该词库，无法删除`);
    }

    await this.prisma.wordBank.delete({ where: { id } });
    return { success: true };
  }

  // ==================== 章节管理 ====================

  async getChapters(wordBankId: string) {
    return this.prisma.chapter.findMany({
      where: { wordBankId },
      include: {
        _count: { select: { sections: true } },
      },
      orderBy: { order: 'asc' },
    });
  }

  async createChapter(wordBankId: string, data: { name: string; order?: number }) {
    // 获取最大order
    const maxOrder = await this.prisma.chapter.aggregate({
      where: { wordBankId },
      _max: { order: true },
    });

    return this.prisma.chapter.create({
      data: {
        wordBankId,
        name: data.name,
        order: data.order ?? (maxOrder._max?.order || 0) + 1,
      },
    });
  }

  async updateChapter(id: string, data: { name?: string; order?: number }) {
    return this.prisma.chapter.update({
      where: { id },
      data,
    });
  }

  async deleteChapter(id: string) {
    await this.prisma.chapter.delete({ where: { id } });
    return { success: true };
  }

  // ==================== 小节管理 ====================

  async getSections(chapterId: string) {
    return this.prisma.section.findMany({
      where: { chapterId },
      include: {
        _count: { select: { sectionWords: true } },
      },
      orderBy: { order: 'asc' },
    });
  }

  async createSection(chapterId: string, data: { name: string; order?: number }) {
    const maxOrder = await this.prisma.section.aggregate({
      where: { chapterId },
      _max: { order: true },
    });

    return this.prisma.section.create({
      data: {
        chapterId,
        name: data.name,
        order: data.order ?? (maxOrder._max?.order || 0) + 1,
      },
    });
  }

  async updateSection(id: string, data: { name?: string; order?: number }) {
    return this.prisma.section.update({
      where: { id },
      data,
    });
  }

  async deleteSection(id: string) {
    await this.prisma.section.delete({ where: { id } });
    return { success: true };
  }

  // ==================== 单词管理 ====================

  async getSectionWords(sectionId: string) {
    return this.prisma.sectionWord.findMany({
      where: { sectionId },
      include: { word: true },
      orderBy: { order: 'asc' },
    });
  }

  async addWordToSection(sectionId: string, data: { wordId: string; order?: number }) {
    const maxOrder = await this.prisma.sectionWord.aggregate({
      where: { sectionId },
      _max: { order: true },
    });

    return this.prisma.sectionWord.create({
      data: {
        sectionId,
        wordId: data.wordId,
        order: data.order ?? (maxOrder._max?.order || 0) + 1,
      },
      include: { word: true },
    });
  }

  async removeWordFromSection(sectionId: string, wordId: string) {
    await this.prisma.sectionWord.delete({
      where: {
        sectionId_wordId: { sectionId, wordId },
      },
    });
    return { success: true };
  }

  // ==================== 统计数据 ====================

  async getOverviewStats() {
    const [
      totalUsers,
      totalWordBanks,
      totalWords,
      totalGames,
      activeUsers,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.wordBank.count(),
      this.prisma.word.count(),
      this.prisma.gameRecord.count(),
      this.prisma.user.count({
        where: {
          lastLoginAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [todayNewUsers, todayGames] = await Promise.all([
      this.prisma.user.count({
        where: { createdAt: { gte: today } },
      }),
      this.prisma.gameRecord.count({
        where: { createdAt: { gte: today } },
      }),
    ]);

    return {
      totalUsers,
      totalWordBanks,
      totalWords,
      totalGames,
      activeUsers,
      todayNewUsers,
      todayGames,
    };
  }

  async getDailyStats(days: number) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    // 获取每日新用户和游戏记录
    const [users, games] = await Promise.all([
      this.prisma.user.findMany({
        where: { createdAt: { gte: startDate } },
        select: { createdAt: true },
      }),
      this.prisma.gameRecord.findMany({
        where: { createdAt: { gte: startDate } },
        select: { createdAt: true },
      }),
    ]);

    // 按日期聚合
    const statsMap = new Map<string, { newUsers: number; games: number }>();

    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      statsMap.set(dateStr, { newUsers: 0, games: 0 });
    }

    users.forEach((item) => {
      const dateStr = item.createdAt.toISOString().split('T')[0];
      const stats = statsMap.get(dateStr);
      if (stats) {
        stats.newUsers += 1;
      }
    });

    games.forEach((item) => {
      const dateStr = item.createdAt.toISOString().split('T')[0];
      const stats = statsMap.get(dateStr);
      if (stats) {
        stats.games += 1;
      }
    });

    return Array.from(statsMap.entries()).map(([date, stats]) => ({
      date,
      ...stats,
    }));
  }
}
