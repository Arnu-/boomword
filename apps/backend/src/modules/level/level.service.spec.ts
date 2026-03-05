import { Test, TestingModule } from '@nestjs/testing';
import { LevelService } from './level.service';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { RedisService } from '../../shared/redis/redis.service';
import { NotFoundException } from '@nestjs/common';

describe('LevelService', () => {
  let service: LevelService;

  const mockUserId = 'test-user-id';
  const mockSectionId = 'test-section-id';
  const mockWordBankId = 'test-wordbank-id';

  // Mock Prisma Service
  const mockPrismaService = {
    section: {
      findUnique: jest.fn(),
    },
    userSection: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
    sectionWord: {
      findMany: jest.fn(),
    },
    chapter: {
      findFirst: jest.fn(),
    },
  };

  // Mock Redis Service
  const mockRedisService = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    getJson: jest.fn(),
    setJson: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LevelService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: RedisService, useValue: mockRedisService },
      ],
    }).compile();

    service = module.get<LevelService>(LevelService);

    jest.clearAllMocks();

    // Default mock returns
    mockRedisService.getJson.mockResolvedValue(null);
    mockRedisService.setJson.mockResolvedValue('OK');
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ==================== getSectionDetail ====================
  describe('getSectionDetail', () => {
    const mockSection = {
      id: mockSectionId,
      name: 'Section 1',
      wordCount: 20,
      timeLimit: 0,
      chapter: {
        id: 'chapter-1',
        name: 'Chapter 1',
        wordBank: {
          name: 'CET-4',
        },
      },
    };

    it('should throw NotFoundException if section not found', async () => {
      mockPrismaService.section.findUnique.mockResolvedValue(null);

      await expect(service.getSectionDetail(mockSectionId, mockUserId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return section detail without user progress for new user', async () => {
      mockPrismaService.section.findUnique.mockResolvedValue(mockSection);
      mockPrismaService.userSection.findUnique.mockResolvedValue(null);

      const result = await service.getSectionDetail(mockSectionId, mockUserId);

      expect(result).toBeDefined();
      expect(result.id).toBe(mockSectionId);
      expect(result.name).toBe('Section 1');
      expect(result.wordCount).toBe(20);
      expect(result.chapterName).toBe('Chapter 1');
      expect(result.wordBankName).toBe('CET-4');
      expect(result.unlocked).toBe(false);
      expect(result.practiceCompleted).toBe(false);
      expect(result.practiceStars).toBe(0);
      expect(result.practiceBestScore).toBe(0);
      expect(result.challengeCompleted).toBe(false);
      expect(result.challengeStars).toBe(0);
      expect(result.speedCompleted).toBe(false);
    });

    it('should return section detail with user progress', async () => {
      mockPrismaService.section.findUnique.mockResolvedValue(mockSection);
      mockPrismaService.userSection.findUnique.mockResolvedValue({
        unlocked: true,
        practiceCompleted: true,
        practiceStars: 3,
        practiceBestScore: 1000,
        challengeCompleted: true,
        challengeStars: 2,
        challengeBestScore: 1500,
        speedCompleted: false,
        speedStars: 0,
        speedBestScore: 0,
      });

      const result = await service.getSectionDetail(mockSectionId, mockUserId);

      expect(result.unlocked).toBe(true);
      expect(result.practiceCompleted).toBe(true);
      expect(result.practiceStars).toBe(3);
      expect(result.practiceBestScore).toBe(1000);
      expect(result.challengeCompleted).toBe(true);
      expect(result.challengeStars).toBe(2);
      expect(result.speedCompleted).toBe(false);
    });

    it('should query section with chapter and wordBank included', async () => {
      mockPrismaService.section.findUnique.mockResolvedValue(mockSection);
      mockPrismaService.userSection.findUnique.mockResolvedValue(null);

      await service.getSectionDetail(mockSectionId, mockUserId);

      expect(mockPrismaService.section.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockSectionId },
          include: expect.objectContaining({
            chapter: expect.any(Object),
          }),
        }),
      );
    });
  });

  // ==================== getSectionWords ====================
  describe('getSectionWords', () => {
    const mockSectionWords = [
      {
        word: {
          id: 'word-1',
          english: 'apple',
          chinese: '苹果',
          phonetic: '/ˈæpəl/',
          difficulty: 1,
        },
        order: 1,
      },
      {
        word: {
          id: 'word-2',
          english: 'banana',
          chinese: '香蕉',
          phonetic: '/bəˈnɑːnə/',
          difficulty: 2,
        },
        order: 2,
      },
      {
        word: {
          id: 'word-3',
          english: 'cherry',
          chinese: '樱桃',
          phonetic: '/ˈtʃeri/',
          difficulty: 3,
        },
        order: 3,
      },
    ];

    it('should return cached words when cache is available', async () => {
      const cachedWords = [{ id: 'word-1', english: 'apple', chinese: '苹果' }];
      mockRedisService.getJson.mockResolvedValue(cachedWords);

      const result = await service.getSectionWords(mockSectionId);

      expect(result).toEqual(cachedWords);
      expect(mockPrismaService.sectionWord.findMany).not.toHaveBeenCalled();
    });

    it('should fetch words from database when cache is empty', async () => {
      mockRedisService.getJson.mockResolvedValue(null);
      mockPrismaService.sectionWord.findMany.mockResolvedValue(mockSectionWords);

      const result = await service.getSectionWords(mockSectionId) as any[];

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(3);
      expect(mockRedisService.setJson).toHaveBeenCalled();
    });

    it('should return words in correct format', async () => {
      mockRedisService.getJson.mockResolvedValue(null);
      mockPrismaService.sectionWord.findMany.mockResolvedValue(mockSectionWords);

      const result = await service.getSectionWords(mockSectionId);

      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('english');
      expect(result[0]).toHaveProperty('chinese');
      expect(result[0]).toHaveProperty('phonetic');
      expect(result[0]).toHaveProperty('difficulty');
      // Should not include internal fields
      expect(result[0]).not.toHaveProperty('order');
    });

    it('should return words ordered by order field', async () => {
      mockRedisService.getJson.mockResolvedValue(null);
      mockPrismaService.sectionWord.findMany.mockResolvedValue(mockSectionWords);

      await service.getSectionWords(mockSectionId);

      expect(mockPrismaService.sectionWord.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { order: 'asc' },
        }),
      );
    });

    it('should return empty array for section with no words', async () => {
      mockRedisService.getJson.mockResolvedValue(null);
      mockPrismaService.sectionWord.findMany.mockResolvedValue([]);

      const result = await service.getSectionWords(mockSectionId);

      expect(result).toHaveLength(0);
    });
  });

  // ==================== unlockFirstSection ====================
  describe('unlockFirstSection', () => {
    it('should unlock first section when it exists', async () => {
      const mockFirstChapter = {
        id: 'chapter-1',
        sections: [
          { id: 'section-1', name: 'Section 1' },
        ],
      };

      mockPrismaService.chapter.findFirst.mockResolvedValue(mockFirstChapter);
      mockPrismaService.userSection.upsert.mockResolvedValue({
        userId: mockUserId,
        sectionId: 'section-1',
        unlocked: true,
      });

      await service.unlockFirstSection(mockUserId, mockWordBankId);

      expect(mockPrismaService.userSection.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId_sectionId: {
              userId: mockUserId,
              sectionId: 'section-1',
            },
          },
          create: expect.objectContaining({ unlocked: true }),
          update: expect.objectContaining({ unlocked: true }),
        }),
      );
    });

    it('should do nothing when no chapters exist', async () => {
      mockPrismaService.chapter.findFirst.mockResolvedValue(null);

      await service.unlockFirstSection(mockUserId, mockWordBankId);

      expect(mockPrismaService.userSection.upsert).not.toHaveBeenCalled();
    });

    it('should do nothing when chapter has no sections', async () => {
      mockPrismaService.chapter.findFirst.mockResolvedValue({
        id: 'chapter-1',
        sections: [],
      });

      await service.unlockFirstSection(mockUserId, mockWordBankId);

      expect(mockPrismaService.userSection.upsert).not.toHaveBeenCalled();
    });

    it('should query first chapter ordered by order field', async () => {
      mockPrismaService.chapter.findFirst.mockResolvedValue(null);

      await service.unlockFirstSection(mockUserId, mockWordBankId);

      expect(mockPrismaService.chapter.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ wordBankId: mockWordBankId }),
          orderBy: { order: 'asc' },
        }),
      );
    });
  });
});
