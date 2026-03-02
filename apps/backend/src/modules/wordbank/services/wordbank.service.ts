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
    // 获取词库详情
    const wordBank = await this.prisma.wordBank.findUnique({
      where: { id: bankId },
      include: {
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

    // 获取用户小节进度
    const userSections = await this.prisma.userSection.findMany({
      where: {
        userId,
        section: {
          chapter: {
            wordBankId: bankId,
          },
        },
      },
    });

    const sectionProgressMap = new Map(userSections.map((s) => [s.sectionId, s]));

    // 计算进度统计
    let completedSections = 0;
    let totalSections = 0;
    let totalStars = 0;
    let maxStars = 0;

    const chapters = wordBank.chapters.map((chapter, chapterIndex) => {
      const sections = chapter.sections.map((section, sectionIndex) => {
        totalSections++;
        maxStars += 3;

        const userSection = sectionProgressMap.get(section.id);
        const stars = Math.max(userSection?.practiceStars || 0, userSection?.challengeStars || 0);
        const isCompleted = stars > 0;
        
        // 第一个小节默认解锁，或者前一个小节完成后解锁
        const isUnlocked = (chapterIndex === 0 && sectionIndex === 0) || 
                          userSection?.unlocked || 
                          isCompleted;

        if (isCompleted) {
          completedSections++;
          totalStars += stars;
        }

        return {
          id: section.id,
          name: section.name,
          order: section.order,
          wordCount: section.wordCount,
          isUnlocked,
          isCompleted,
          stars,
          bestScore: Math.max(userSection?.practiceBestScore || 0, userSection?.challengeBestScore || 0),
        };
      });

      return {
        id: chapter.id,
        name: chapter.name,
        order: chapter.order,
        sections,
      };
    });

    return {
      wordBank: {
        id: wordBank.id,
        name: wordBank.name,
        description: wordBank.description,
        totalWords: wordBank.wordCount,
      },
      progress: {
        completedSections,
        totalSections,
        percentage: totalSections > 0 ? Math.round((completedSections / totalSections) * 100) : 0,
        totalStars,
        maxStars,
      },
      chapters,
    };
  }
}
