import { Test, TestingModule } from '@nestjs/testing';
import { LearningService } from './learning.service';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { RedisService } from '../../shared/redis/redis.service';

describe('LearningService', () => {
  let service: LearningService;

  const mockUserId = 'test-user-id';
  const mockWordBankId = 'test-wordbank-id';

  // Mock Prisma Service
  const mockPrismaService = {
    userWordBank: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    userWord: {
      count: jest.fn(),
      findMany: jest.fn(),
      groupBy: jest.fn(),
    },
    userSection: {
      findMany: jest.fn(),
    },
    gameRecord: {
      findMany: jest.fn(),
      aggregate: jest.fn(),
      groupBy: jest.fn(),
    },
    userLevel: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
    wrongBook: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    word: {
      findMany: jest.fn(),
    },
    wordBank: {
      findUnique: jest.fn(),
    },
    $queryRaw: jest.fn(),
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
        LearningService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: RedisService, useValue: mockRedisService },
      ],
    }).compile();

    service = module.get<LearningService>(LearningService);

    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Setup default mock returns
    mockRedisService.getJson.mockResolvedValue(null);
    mockPrismaService.userLevel.findUnique.mockResolvedValue({ consecutiveDays: 5, longestStreak: 10 });
    mockPrismaService.gameRecord.findMany.mockResolvedValue([]);
    mockPrismaService.gameRecord.aggregate.mockResolvedValue({ _sum: { timeUsed: 0 }, _count: { id: 0 } });
    mockPrismaService.userWord.count.mockResolvedValue(0);
    mockPrismaService.userWord.groupBy.mockResolvedValue([]);
    mockPrismaService.userWord.findMany.mockResolvedValue([]);
    mockPrismaService.userWordBank.findMany.mockResolvedValue([]);
    mockPrismaService.wrongBook.findMany.mockResolvedValue([]);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getOverview', () => {
    it('should return learning overview for user', async () => {
      const mockWordBanks = [
        {
          wordBankId: mockWordBankId,
          learnedCount: 50,
          masteredCount: 30,
          progress: 0.5,
          lastStudyAt: new Date(),
          wordBank: {
            id: mockWordBankId,
            name: 'Test WordBank',
            wordCount: 100,
          },
        },
      ];

      mockPrismaService.userWordBank.findMany.mockResolvedValue(mockWordBanks);

      const result = await service.getOverview(mockUserId);

      expect(result).toBeDefined();
      expect(result.wordBanks).toBeDefined();
      expect(result.statistics).toBeDefined();
      expect(result.today).toBeDefined();
      expect(result.dailyGoal).toBeDefined();
    });
  });

  describe('getHeatmapData', () => {
    it('should return heatmap data for the year', async () => {
      const mockRecords = [
        { createdAt: new Date('2024-01-15'), totalCount: 25 },
        { createdAt: new Date('2024-01-16'), totalCount: 10 },
      ];

      mockPrismaService.gameRecord.findMany.mockResolvedValue(mockRecords);

      const result = await service.getHeatmapData(mockUserId, 2024);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      // Should have 366 days for leap year or 365 for normal year
      expect(result.length).toBeGreaterThan(360);
    });
  });

  describe('getMasteryDistribution', () => {
    it('should return mastery distribution', async () => {
      // Need to setup mock before calling service method
      mockPrismaService.userWord.groupBy
        .mockResolvedValueOnce([
          { mastery: 'mastered', _count: { id: 50 } },
          { mastery: 'learning', _count: { id: 30 } },
          { mastery: 'need_review', _count: { id: 20 } },
        ])
        .mockResolvedValueOnce([
          { mastery: 'mastered', _count: { id: 50 } },
          { mastery: 'learning', _count: { id: 30 } },
          { mastery: 'need_review', _count: { id: 20 } },
        ]);
      mockPrismaService.userWordBank.findMany.mockResolvedValue([
        { wordBank: { wordCount: 200 } },
      ]);

      const result = await service.getMasteryDistribution(mockUserId);

      expect(result).toBeDefined();
      expect(result.mastered).toBeDefined();
      expect(result.learning).toBeDefined();
      expect(result.needReview).toBeDefined();
      expect(result.total).toBeDefined();
      expect(result.masteryRate).toBeDefined();
    });
  });

  describe('getReviewReminder', () => {
    it('should return review reminder with due words', async () => {
      const now = new Date();
      mockPrismaService.userWord.count.mockResolvedValue(5);
      mockPrismaService.userWord.findMany.mockResolvedValue([
        {
          id: 'uw-1',
          nextReviewAt: new Date(now.getTime() - 86400000),
          word: { id: 'word-1', english: 'test', chinese: '测试' },
        },
      ]);

      const result = await service.getReviewReminder(mockUserId);

      expect(result).toBeDefined();
      expect(result.todayReviewCount).toBeDefined();
      expect(result.overdueCount).toBeDefined();
      expect(result.upcomingCount).toBeDefined();
      expect(result.words).toBeDefined();
    });
  });

  describe('setDailyGoal', () => {
    it('should set new daily goal', async () => {
      await service.setDailyGoal(mockUserId, {
        wordsTarget: 100,
        durationTarget: 60,
      });

      expect(mockRedisService.setJson).toHaveBeenCalled();
    });
  });

  describe('getTimeDistribution', () => {
    it('should return time distribution analysis', async () => {
      mockPrismaService.gameRecord.findMany.mockResolvedValue([
        {
          createdAt: new Date('2024-01-15T10:00:00'),
          totalCount: 10,
          correctCount: 8,
          wrongCount: 2,
        },
      ]);

      const result = await service.getTimeDistribution(mockUserId, 30);

      expect(result).toBeDefined();
      expect(result.hourly).toBeDefined();
      expect(result.weekday).toBeDefined();
      expect(result.bestTime).toBeDefined();
    });
  });

  describe('getWeakWordsAnalysis', () => {
    it('should return weak words analysis', async () => {
      mockPrismaService.wrongBook.findMany.mockResolvedValue([
        {
          wrongCount: 5,
          updatedAt: new Date(),
          word: {
            id: 'word-1',
            english: 'difficult',
            chinese: '困难的',
            difficulty: 4,
          },
        },
      ]);

      const result = await service.getWeakWordsAnalysis(mockUserId);

      expect(result).toBeDefined();
      expect(result.words).toBeDefined();
      expect(result.patterns).toBeDefined();
      expect(result.suggestions).toBeDefined();
    });
  });

  describe('generateLearningReport', () => {
    it('should return weekly learning report', async () => {
      mockPrismaService.gameRecord.findMany.mockResolvedValue([
        {
          createdAt: new Date(),
          correctCount: 10,
          wrongCount: 2,
          totalCount: 12,
          score: 100,
          timeUsed: 300,
        },
      ]);

      const result = await service.generateLearningReport(mockUserId, 'weekly');

      expect(result).toBeDefined();
      expect(result.period).toBeDefined();
      expect(result.period.type).toBe('weekly');
      expect(result.summary).toBeDefined();
      expect(result.growth).toBeDefined();
      expect(result.highlights).toBeDefined();
      expect(result.suggestions).toBeDefined();
    });

    it('should return monthly learning report', async () => {
      const result = await service.generateLearningReport(mockUserId, 'monthly');

      expect(result).toBeDefined();
      expect(result.period.type).toBe('monthly');
    });
  });

  describe('checkIn', () => {
    it('should perform check-in successfully', async () => {
      mockPrismaService.userLevel.findUnique.mockResolvedValue({
        userId: mockUserId,
        consecutiveDays: 5,
        longestStreak: 10,
        lastSignDate: null,
      });
      mockPrismaService.userLevel.upsert.mockResolvedValue({
        consecutiveDays: 1,
        longestStreak: 10,
      });

      const result = await service.checkIn(mockUserId);

      expect(result).toBeDefined();
      expect(result.streakDays).toBeDefined();
      expect(result.expBonus).toBeDefined();
    });

    it('should handle already checked in today', async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      mockPrismaService.userLevel.findUnique.mockResolvedValue({
        userId: mockUserId,
        consecutiveDays: 5,
        longestStreak: 10,
        lastSignDate: today,
      });

      const result = await service.checkIn(mockUserId);

      expect(result.isNewStreak).toBe(false);
      expect(result.expBonus).toBe(0);
    });
  });
});
