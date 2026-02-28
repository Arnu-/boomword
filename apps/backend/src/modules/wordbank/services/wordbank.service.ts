import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/shared/prisma/prisma.service';
import { RedisService } from '@/shared/redis/redis.service';
import { CacheKeys, CacheTTL } from '@/common/constants';

@Injectable()
export class WordBankService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async findAll(categoryId?: string) {
    const cacheKey = CacheKeys.WORDBANK_LIST(categoryId);

    // 尝试从缓存获取
    const cached = await this.redis.getJson(cacheKey);
    if (cached) {
      return cached;
    }

    // 从数据库获取
    const wordBanks = await this.prisma.wordBank.findMany({
      where: {
        categoryId: categoryId || undefined,
        isActive: true,
      },
      include: {
        category: {
          select: { name: true },
        },
      },
      orderBy: { sort: 'asc' },
    });

    const result = wordBanks.map((bank) => ({
      id: bank.id,
      name: bank.name,
      code: bank.code,
      description: bank.description,
      coverImage: bank.coverImage,
      wordCount: bank.wordCount,
      chapterCount: bank.chapterCount,
      difficulty: bank.difficulty,
      categoryName: bank.category.name,
      isFree: bank.isFree,
    }));

    // 缓存结果
    await this.redis.setJson(cacheKey, result, CacheTTL.WORDBANK_LIST);

    return result;
  }

  async findOne(id: string, userId?: string) {
    const cacheKey = CacheKeys.WORDBANK_DETAIL(id);

    // 尝试从缓存获取基础数据
    let bankData = await this.redis.getJson<any>(cacheKey);

    if (!bankData) {
      const wordBank = await this.prisma.wordBank.findUnique({
        where: { id },
        include: {
          category: true,
          chapters: {
            where: { isActive: true },
            orderBy: { order: 'asc' },
            include: {
              sections: {
                where: { isActive: true },
                orderBy: { order: 'asc' },
              },
            },
          },
        },
      });

      if (!wordBank) {
        throw new NotFoundException('词库不存在');
      }

      bankData = {
        id: wordBank.id,
        name: wordBank.name,
        code: wordBank.code,
        description: wordBank.description,
        coverImage: wordBank.coverImage,
        wordCount: wordBank.wordCount,
        chapterCount: wordBank.chapterCount,
        difficulty: wordBank.difficulty,
        categoryName: wordBank.category.name,
        chapters: wordBank.chapters.map((chap) => ({
          id: chap.id,
          name: chap.name,
          order: chap.order,
          wordCount: chap.wordCount,
          sections: chap.sections.map((sec) => ({
            id: sec.id,
            name: sec.name,
            order: sec.order,
            wordCount: sec.wordCount,
          })),
        })),
      };

      // 缓存基础数据
      await this.redis.setJson(cacheKey, bankData, CacheTTL.WORDBANK_DETAIL);
    }

    // 如果有用户，获取用户进度
    if (userId) {
      const userSections = await this.prisma.userSection.findMany({
        where: {
          userId,
          section: {
            chapter: {
              wordBankId: id,
            },
          },
        },
      });

      const sectionMap = new Map(userSections.map((s) => [s.sectionId, s]));

      // 合并用户进度
      bankData.chapters = bankData.chapters.map((chap: any) => ({
        ...chap,
        sections: chap.sections.map((sec: any) => {
          const userSec = sectionMap.get(sec.id);
          return {
            ...sec,
            unlocked: userSec?.unlocked || false,
            practiceStars: userSec?.practiceStars || 0,
            challengeStars: userSec?.challengeStars || 0,
          };
        }),
      }));
    }

    return bankData;
  }

  async getProgress(bankId: string, userId: string) {
    const userWordBank = await this.prisma.userWordBank.findUnique({
      where: {
        userId_wordBankId: { userId, wordBankId: bankId },
      },
    });

    const wordBank = await this.prisma.wordBank.findUnique({
      where: { id: bankId },
      select: { wordCount: true },
    });

    return {
      learnedCount: userWordBank?.learnedCount || 0,
      masteredCount: userWordBank?.masteredCount || 0,
      totalCount: wordBank?.wordCount || 0,
      progress: userWordBank?.progress || 0,
      lastStudyAt: userWordBank?.lastStudyAt,
    };
  }
}
