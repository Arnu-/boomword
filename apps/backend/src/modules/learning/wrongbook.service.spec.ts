import { Test, TestingModule } from '@nestjs/testing';
import { WrongBookService } from './wrongbook.service';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { RedisService } from '../../shared/redis/redis.service';

describe('WrongBookService', () => {
  let service: WrongBookService;

  const mockUserId = 'test-user-id';
  const mockWordId = 'test-word-id';

  // Mock Prisma Service
  const mockPrismaService = {
    wrongBook: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
      aggregate: jest.fn(),
    },
    userWord: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
    },
    word: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    $transaction: jest.fn((fn) => fn(mockPrismaService)),
  };

  // Mock Redis Service
  const mockRedisService = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    getJson: jest.fn(),
    setJson: jest.fn(),
    delPattern: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WrongBookService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: RedisService, useValue: mockRedisService },
      ],
    }).compile();

    service = module.get<WrongBookService>(WrongBookService);

    // Clear all mocks before each test
    jest.clearAllMocks();

    // Setup default mock returns
    mockRedisService.getJson.mockResolvedValue(null);
    mockRedisService.del.mockResolvedValue(1);
    mockRedisService.delPattern.mockResolvedValue(1);
    mockPrismaService.wrongBook.count.mockResolvedValue(0);
    mockPrismaService.wrongBook.findMany.mockResolvedValue([]);
    mockPrismaService.userWord.findMany.mockResolvedValue([]);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getWrongWords', () => {
    it('should return paginated wrong words list', async () => {
      const mockWrongBooks = [
        {
          id: 'wb-1',
          wordId: mockWordId,
          wrongCount: 5,
          createdAt: new Date(),
          updatedAt: new Date(),
          word: {
            id: mockWordId,
            english: 'difficult',
            chinese: '困难的',
            phonetic: '/ˈdɪfɪkəlt/',
            difficulty: 3,
            exampleSentence: 'This is difficult.',
            exampleChinese: '这很困难。',
          },
        },
      ];
      
      mockPrismaService.wrongBook.findMany.mockResolvedValue(mockWrongBooks);
      mockPrismaService.wrongBook.count.mockResolvedValue(1);
      mockPrismaService.userWord.findMany.mockResolvedValue([
        { wordId: mockWordId, correctCount: 3, wrongCount: 5, lastPracticeAt: new Date() },
      ]);

      const result = await service.getWrongWords(mockUserId, {
        page: 1,
        limit: 20,
        sortBy: 'wrongCount',
      });

      expect(result).toBeDefined();
      expect(result.items).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
      expect(result.pagination.page).toBe(1);
    });
  });

  describe('getStatistics', () => {
    it('should return wrong book statistics', async () => {
      mockPrismaService.wrongBook.count.mockResolvedValue(50);
      mockPrismaService.wrongBook.findMany.mockResolvedValue([
        { wrongCount: 10, word: { english: 'test', chinese: '测试', difficulty: 3 } },
      ]);

      const result = await service.getStatistics(mockUserId);

      expect(result).toBeDefined();
      expect((result as any).totalWrongWords).toBe(50);
    });

    it('should use cache when available', async () => {
      const cachedStats = {
        totalWrongWords: 50,
        todayNewWrong: 5,
        frequentWrongCount: 10,
      };

      mockRedisService.getJson.mockResolvedValue(cachedStats);

      const result = await service.getStatistics(mockUserId);

      expect(result).toEqual(cachedStats);
      expect(mockPrismaService.wrongBook.count).not.toHaveBeenCalled();
    });
  });

  describe('startPractice', () => {
    it('should return practice words', async () => {
      const mockWrongBooks = [
        {
          wordId: 'w1',
          wrongCount: 5,
          word: {
            id: 'w1',
            english: 'test',
            chinese: '测试',
            phonetic: '/test/',
            difficulty: 2,
          },
        },
      ];

      mockPrismaService.wrongBook.findMany.mockResolvedValue(mockWrongBooks);

      const result = await service.startPractice(mockUserId, {
        limit: 10,
        shuffle: true,
      });

      expect(result).toBeDefined();
      expect(result.words).toBeDefined();
      expect(result.totalWords).toBeDefined();
    });

    it('should prioritize frequent errors when requested', async () => {
      mockPrismaService.wrongBook.findMany.mockResolvedValue([]);

      await service.startPractice(mockUserId, {
        limit: 10,
        frequentOnly: true,
      });

      expect(mockPrismaService.wrongBook.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            wrongCount: { gte: 3 },
          }),
        }),
      );
    });
  });

  describe('recordPracticeResult', () => {
    it('should record practice result', async () => {
      const mockWrongBook = {
        id: 'wb-1',
        userId: mockUserId,
        wordId: mockWordId,
        wrongCount: 3,
        isRemoved: false,
      };

      mockPrismaService.wrongBook.findFirst.mockResolvedValue(mockWrongBook);
      mockPrismaService.wrongBook.update.mockResolvedValue({
        ...mockWrongBook,
        wrongCount: 4,
      });
      mockPrismaService.userWord.upsert.mockResolvedValue({});

      const result = await service.recordPracticeResult(
        mockUserId,
        mockWordId,
        false, // incorrect answer
      );

      expect(result).toBeDefined();
      expect(result.removed).toBe(false);
    });
  });

  describe('addWord', () => {
    it('should add new word to wrong book', async () => {
      mockPrismaService.word.findUnique.mockResolvedValue({
        id: mockWordId,
        english: 'test',
        chinese: '测试',
      });
      mockPrismaService.wrongBook.findFirst.mockResolvedValue(null);
      mockPrismaService.wrongBook.create.mockResolvedValue({
        id: 'new-wb',
        userId: mockUserId,
        wordId: mockWordId,
        wrongCount: 1,
      });

      const result = await service.addWord(mockUserId, mockWordId);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(mockPrismaService.wrongBook.create).toHaveBeenCalled();
    });
  });

  describe('removeWord', () => {
    it('should mark word as removed', async () => {
      const mockWrongBook = {
        id: 'wb-1',
        userId: mockUserId,
        wordId: mockWordId,
        wrongCount: 3,
        isRemoved: false,
      };

      // removeWord uses findUnique, not findFirst
      mockPrismaService.wrongBook.findUnique.mockResolvedValue(mockWrongBook);
      mockPrismaService.wrongBook.update.mockResolvedValue({
        ...mockWrongBook,
        isRemoved: true,
      });

      const result = await service.removeWord(mockUserId, mockWordId);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });
  });

  describe('removeWords', () => {
    it('should batch remove multiple words', async () => {
      const wordIds = ['w1', 'w2', 'w3'];
      mockPrismaService.wrongBook.updateMany.mockResolvedValue({ count: 3 });

      const result = await service.removeWords(mockUserId, wordIds);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.count).toBe(3);
    });
  });

  describe('clearAll', () => {
    it('should clear all words from wrong book', async () => {
      mockPrismaService.wrongBook.updateMany.mockResolvedValue({ count: 50 });

      const result = await service.clearAll(mockUserId);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.deletedCount).toBe(50);
    });
  });

  describe('restoreWord', () => {
    it('should restore a removed word', async () => {
      const removedWrongBook = {
        id: 'wb-1',
        userId: mockUserId,
        wordId: mockWordId,
        wrongCount: 3,
        isRemoved: true,
      };

      // restoreWord uses findUnique, not findFirst
      mockPrismaService.wrongBook.findUnique.mockResolvedValue(removedWrongBook);
      mockPrismaService.wrongBook.update.mockResolvedValue({
        ...removedWrongBook,
        isRemoved: false,
      });

      const result = await service.restoreWord(mockUserId, mockWordId);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });
  });

  describe('getRemovedWords', () => {
    it('should return list of removed words', async () => {
      const mockRemovedWords = [
        {
          id: 'wb-1',
          wordId: 'w1',
          wrongCount: 3,
          updatedAt: new Date(),
          word: {
            id: 'w1',
            english: 'test',
            chinese: '测试',
            phonetic: '/test/',
          },
        },
      ];

      mockPrismaService.wrongBook.findMany.mockResolvedValue(mockRemovedWords);
      mockPrismaService.wrongBook.count.mockResolvedValue(1);

      const result = await service.getRemovedWords(mockUserId, 1, 20);

      expect(result).toBeDefined();
      expect(result.items).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
    });
  });
});
