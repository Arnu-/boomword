import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/shared/prisma/prisma.service';
import { RedisService } from '@/shared/redis/redis.service';
import { CacheKeys, CacheTTL } from '@/common/constants';

@Injectable()
export class LevelService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async getSectionDetail(sectionId: string, userId: string) {
    const section = await this.prisma.section.findUnique({
      where: { id: sectionId },
      include: {
        chapter: {
          include: {
            wordBank: {
              select: { name: true },
            },
          },
        },
      },
    });

    if (!section) {
      throw new NotFoundException('小节不存在');
    }

    // 获取用户进度
    const userSection = await this.prisma.userSection.findUnique({
      where: {
        userId_sectionId: { userId, sectionId },
      },
    });

    return {
      id: section.id,
      name: section.name,
      wordCount: section.wordCount,
      timeLimit: section.timeLimit,
      chapterName: section.chapter.name,
      wordBankName: section.chapter.wordBank.name,
      unlocked: userSection?.unlocked || false,
      practiceCompleted: userSection?.practiceCompleted || false,
      practiceStars: userSection?.practiceStars || 0,
      practiceBestScore: userSection?.practiceBestScore || 0,
      challengeCompleted: userSection?.challengeCompleted || false,
      challengeStars: userSection?.challengeStars || 0,
      challengeBestScore: userSection?.challengeBestScore || 0,
      speedCompleted: userSection?.speedCompleted || false,
      speedStars: userSection?.speedStars || 0,
      speedBestScore: userSection?.speedBestScore || 0,
    };
  }

  async getSectionWords(sectionId: string) {
    const cacheKey = CacheKeys.SECTION_WORDS(sectionId);

    // 尝试从缓存获取
    const cached = await this.redis.getJson(cacheKey);
    if (cached) {
      return cached;
    }

    const sectionWords = await this.prisma.sectionWord.findMany({
      where: { sectionId },
      include: {
        word: true,
      },
      orderBy: { order: 'asc' },
    });

    const result = sectionWords.map((sw) => ({
      id: sw.word.id,
      english: sw.word.english,
      chinese: sw.word.chinese,
      phonetic: sw.word.phonetic,
      difficulty: sw.word.difficulty,
    }));

    // 缓存结果
    await this.redis.setJson(cacheKey, result, CacheTTL.SECTION_WORDS);

    return result;
  }

  async unlockFirstSection(userId: string, wordBankId: string) {
    // 获取第一个小节
    const firstChapter = await this.prisma.chapter.findFirst({
      where: { wordBankId, isActive: true },
      orderBy: { order: 'asc' },
      include: {
        sections: {
          where: { isActive: true },
          orderBy: { order: 'asc' },
          take: 1,
        },
      },
    });

    if (firstChapter && firstChapter.sections.length > 0) {
      const firstSection = firstChapter.sections[0];

      await this.prisma.userSection.upsert({
        where: {
          userId_sectionId: { userId, sectionId: firstSection.id },
        },
        create: {
          userId,
          sectionId: firstSection.id,
          unlocked: true,
        },
        update: {
          unlocked: true,
        },
      });
    }
  }
}
