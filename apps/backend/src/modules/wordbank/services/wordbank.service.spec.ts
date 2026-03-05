import { Test, TestingModule } from '@nestjs/testing';
import { WordBankService } from './wordbank.service';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { RedisService } from '../../../shared/redis/redis.service';
import { NotFoundException } from '@nestjs/common';

describe('WordBankService', () => {
  let service: WordBankService;

  const mockWordBankId = 'test-wordbank-id';
  const mockUserId = 'test-user-id';
  const mockCategoryId = 'test-category-id';

  // Mock Prisma Service
  const mockPrismaService = {
    wordBank: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    userSection: {
      findMany: jest.fn(),
    },
    userWord: {
      count: jest.fn(),
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
        WordBankService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: RedisService, useValue: mockRedisService },
      ],
    }).compile();

    service = module.get<WordBankService>(WordBankService);

    jest.clearAllMocks();

    // Default mock returns
    mockRedisService.getJson.mockResolvedValue(null);
    mockRedisService.setJson.mockResolvedValue('OK');
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ==================== findAll ====================
  describe('findAll', () => {
    const mockWordBanks = [
      {
        id: mockWordBankId,
        name: 'CET-4',
        code: 'cet4',
        description: '大学英语四级词汇',
        coverImage: null,
        wordCount: 2000,
        chapterCount: 20,
        difficulty: 3,
        isFree: true,
        category: { name: '考试英语' },
      },
      {
        id: 'wb-2',
        name: 'CET-6',
        code: 'cet6',
        description: '大学英语六级词汇',
        coverImage: null,
        wordCount: 3000,
        chapterCount: 30,
        difficulty: 4,
        isFree: false,
        category: { name: '考试英语' },
      },
    ];

    it('should return all word banks from database when cache is empty', async () => {
      mockRedisService.getJson.mockResolvedValue(null);
      mockPrismaService.wordBank.findMany.mockResolvedValue(mockWordBanks);

      const result = await service.findAll() as any[];

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
      expect(mockRedisService.setJson).toHaveBeenCalled();
    });

    it('should return cached word banks when cache is available', async () => {
      const cachedData = [{ id: mockWordBankId, name: 'CET-4' }];
      mockRedisService.getJson.mockResolvedValue(cachedData);

      const result = await service.findAll();

      expect(result).toEqual(cachedData);
      expect(mockPrismaService.wordBank.findMany).not.toHaveBeenCalled();
    });

    it('should filter by categoryId when provided', async () => {
      mockRedisService.getJson.mockResolvedValue(null);
      mockPrismaService.wordBank.findMany.mockResolvedValue([mockWordBanks[0]]);

      const result = await service.findAll(mockCategoryId);

      expect(mockPrismaService.wordBank.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ categoryId: mockCategoryId }),
        }),
      );
    });

    it('should return correct structure for each word bank', async () => {
      mockRedisService.getJson.mockResolvedValue(null);
      mockPrismaService.wordBank.findMany.mockResolvedValue([mockWordBanks[0]]);

      const result = await service.findAll();

      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('name');
      expect(result[0]).toHaveProperty('code');
      expect(result[0]).toHaveProperty('wordCount');
      expect(result[0]).toHaveProperty('difficulty');
      expect(result[0]).toHaveProperty('categoryName');
      expect(result[0]).toHaveProperty('isFree');
    });
  });

  // ==================== findOne ====================
  describe('findOne', () => {
    const mockWordBank = {
      id: mockWordBankId,
      name: 'CET-4',
      code: 'cet4',
      description: '大学英语四级词汇',
      coverImage: null,
      wordCount: 2000,
      chapterCount: 20,
      difficulty: 3,
      category: { id: mockCategoryId, name: '考试英语', code: 'exam' },
      chapters: [
        {
          id: 'chapter-1',
          name: 'Chapter 1',
          order: 1,
          wordCount: 100,
          sections: [
            { id: 'section-1', name: 'Section 1', order: 1, wordCount: 20 },
            { id: 'section-2', name: 'Section 2', order: 2, wordCount: 20 },
          ],
        },
      ],
    };

    it('should throw NotFoundException if word bank not found', async () => {
      mockRedisService.getJson.mockResolvedValue(null);
      mockPrismaService.wordBank.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(NotFoundException);
    });

    it('should return word bank from database when cache is empty', async () => {
      mockRedisService.getJson.mockResolvedValue(null);
      mockPrismaService.wordBank.findUnique.mockResolvedValue(mockWordBank);

      const result = await service.findOne(mockWordBankId);

      expect(result).toBeDefined();
      expect(result.id).toBe(mockWordBankId);
      expect(result.name).toBe('CET-4');
      expect(result.chapters).toBeDefined();
      expect(mockRedisService.setJson).toHaveBeenCalled();
    });

    it('should return cached word bank when cache is available', async () => {
      const cachedData = {
        id: mockWordBankId,
        name: 'CET-4',
        chapters: [{ id: 'chapter-1', sections: [{ id: 'section-1' }] }],
      };
      mockRedisService.getJson.mockResolvedValue(cachedData);

      const result = await service.findOne(mockWordBankId);

      expect(result.id).toBe(mockWordBankId);
      expect(mockPrismaService.wordBank.findUnique).not.toHaveBeenCalled();
    });

    it('should merge user progress when userId is provided', async () => {
      const cachedData = {
        id: mockWordBankId,
        name: 'CET-4',
        chapters: [
          {
            id: 'chapter-1',
            sections: [
              { id: 'section-1', name: 'Section 1' },
              { id: 'section-2', name: 'Section 2' },
            ],
          },
        ],
      };
      mockRedisService.getJson.mockResolvedValue(cachedData);

      mockPrismaService.userSection.findMany.mockResolvedValue([
        {
          sectionId: 'section-1',
          unlocked: true,
          practiceStars: 3,
          challengeStars: 2,
        },
      ]);

      const result = await service.findOne(mockWordBankId, mockUserId);

      expect(result.chapters[0].sections[0].unlocked).toBe(true);
      expect(result.chapters[0].sections[0].practiceStars).toBe(3);
      expect(result.chapters[0].sections[1].unlocked).toBe(false); // Not in userSections
    });
  });

  // ==================== getProgress ====================
  describe('getProgress', () => {
    const mockWordBankWithChapters = {
      id: mockWordBankId,
      name: 'CET-4',
      description: '大学英语四级词汇',
      wordCount: 2000,
      chapters: [
        {
          id: 'chapter-1',
          name: 'Chapter 1',
          order: 1,
          sections: [
            { id: 'section-1', name: 'Section 1', order: 1, wordCount: 20 },
            { id: 'section-2', name: 'Section 2', order: 2, wordCount: 20 },
            { id: 'section-3', name: 'Section 3', order: 3, wordCount: 20 },
          ],
        },
      ],
    };

    it('should throw NotFoundException if word bank not found', async () => {
      mockPrismaService.wordBank.findUnique.mockResolvedValue(null);

      await expect(service.getProgress('non-existent-id', mockUserId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return progress with zero completion for new user', async () => {
      mockPrismaService.wordBank.findUnique.mockResolvedValue(mockWordBankWithChapters);
      mockPrismaService.userSection.findMany.mockResolvedValue([]);

      const result = await service.getProgress(mockWordBankId, mockUserId);

      expect(result).toBeDefined();
      expect(result.wordBank).toBeDefined();
      expect(result.progress).toBeDefined();
      expect(result.progress.completedSections).toBe(0);
      expect(result.progress.totalSections).toBe(3);
      expect(result.progress.percentage).toBe(0);
      expect(result.progress.totalStars).toBe(0);
      expect(result.chapters).toBeDefined();
    });

    it('should calculate correct progress for user with completed sections', async () => {
      mockPrismaService.wordBank.findUnique.mockResolvedValue(mockWordBankWithChapters);
      mockPrismaService.userSection.findMany.mockResolvedValue([
        {
          sectionId: 'section-1',
          unlocked: true,
          practiceStars: 3,
          challengeStars: 2,
          practiceBestScore: 500,
          challengeBestScore: 800,
        },
        {
          sectionId: 'section-2',
          unlocked: true,
          practiceStars: 2,
          challengeStars: 0,
          practiceBestScore: 400,
          challengeBestScore: 0,
        },
      ]);

      const result = await service.getProgress(mockWordBankId, mockUserId);

      expect(result.progress.completedSections).toBe(2);
      expect(result.progress.totalSections).toBe(3);
      expect(result.progress.percentage).toBe(67); // Math.round(2/3 * 100)
      expect(result.progress.totalStars).toBeGreaterThan(0);
    });

    it('should mark first section as unlocked by default', async () => {
      mockPrismaService.wordBank.findUnique.mockResolvedValue(mockWordBankWithChapters);
      mockPrismaService.userSection.findMany.mockResolvedValue([]);

      const result = await service.getProgress(mockWordBankId, mockUserId);

      // First section (chapterIndex=0, sectionIndex=0) should be unlocked
      expect(result.chapters[0].sections[0].isUnlocked).toBe(true);
      // Other sections should not be unlocked
      expect(result.chapters[0].sections[1].isUnlocked).toBe(false);
    });

    it('should return correct section details', async () => {
      mockPrismaService.wordBank.findUnique.mockResolvedValue(mockWordBankWithChapters);
      mockPrismaService.userSection.findMany.mockResolvedValue([
        {
          sectionId: 'section-1',
          unlocked: true,
          practiceStars: 3,
          challengeStars: 3,
          practiceBestScore: 1000,
          challengeBestScore: 1200,
        },
      ]);

      const result = await service.getProgress(mockWordBankId, mockUserId);

      const section1 = result.chapters[0].sections[0];
      expect(section1.id).toBe('section-1');
      expect(section1.isCompleted).toBe(true);
      expect(section1.stars).toBe(3);
      expect(section1.bestScore).toBe(1200); // Max of practice and challenge
    });
  });
});
