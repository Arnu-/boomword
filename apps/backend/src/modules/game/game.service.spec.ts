import { Test, TestingModule } from '@nestjs/testing';
import { GameService } from './game.service';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { RedisService } from '../../shared/redis/redis.service';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { GameMode } from './dto';

describe('GameService', () => {
  let service: GameService;

  const mockUserId = 'test-user-id';
  const mockSectionId = 'test-section-id';
  const mockGameRecordId = 'test-game-record-id';
  const mockWordId = 'test-word-id';

  // Mock game session
  const mockGameSession = {
    gameRecordId: mockGameRecordId,
    userId: mockUserId,
    sectionId: mockSectionId,
    mode: GameMode.PRACTICE,
    words: [
      { id: mockWordId, english: 'apple', chinese: '苹果', phonetic: '/ˈæpəl/', difficulty: 1 },
      { id: 'word-2', english: 'banana', chinese: '香蕉', phonetic: '/bəˈnɑːnə/', difficulty: 2 },
    ],
    currentIndex: 0,
    correctCount: 0,
    wrongCount: 0,
    totalScore: 0,
    maxCombo: 0,
    currentCombo: 0,
    startTime: Date.now() - 5000,
    pausedTime: 0,
    isPaused: false,
    timeLimit: 0,
    answeredWords: [],
  };

  // Mock Prisma Service
  const mockPrismaService = {
    section: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    },
    chapter: {
      findFirst: jest.fn(),
    },
    userSection: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
    },
    gameRecord: {
      create: jest.fn(),
      update: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
      groupBy: jest.fn(),
    },
    wrongBook: {
      upsert: jest.fn(),
    },
    userWord: {
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
    },
    userLevel: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    userWordBank: {
      upsert: jest.fn(),
    },
  };

  // Mock Redis Service
  const mockRedisService = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    getJson: jest.fn(),
    setJson: jest.fn(),
    zincrby: jest.fn(),
    getClient: jest.fn(),
  };

  const mockRedisClient = {
    expire: jest.fn(),
    zrevrank: jest.fn(),
    zscore: jest.fn(),
    zincrby: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GameService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: RedisService, useValue: mockRedisService },
      ],
    }).compile();

    service = module.get<GameService>(GameService);

    jest.clearAllMocks();

    // Default mock returns
    mockRedisService.get.mockResolvedValue(null);
    mockRedisService.set.mockResolvedValue('OK');
    mockRedisService.del.mockResolvedValue(1);
    mockRedisService.zincrby.mockResolvedValue(100);
    mockRedisService.getClient.mockReturnValue(mockRedisClient);
    mockRedisClient.expire.mockResolvedValue(1);
    mockRedisClient.zincrby.mockResolvedValue(100);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ==================== startGame ====================
  describe('startGame', () => {
    const startGameDto = {
      sectionId: mockSectionId,
      mode: GameMode.PRACTICE,
      shuffle: false,
    };

    const mockSection = {
      id: mockSectionId,
      name: 'Section 1',
      isActive: true,
      order: 1,
      chapter: {
        id: 'chapter-1',
        name: 'Chapter 1',
        order: 1,
        wordBankId: 'wordbank-1',
        wordBank: { id: 'wordbank-1', name: 'Test WordBank' },
      },
      sectionWords: [
        {
          word: {
            id: mockWordId,
            english: 'apple',
            chinese: '苹果',
            phonetic: '/ˈæpəl/',
            difficulty: 1,
          },
        },
        {
          word: {
            id: 'word-2',
            english: 'banana',
            chinese: '香蕉',
            phonetic: '/bəˈnɑːnə/',
            difficulty: 2,
          },
        },
      ],
    };

    it('should throw NotFoundException if section not found', async () => {
      mockPrismaService.section.findUnique.mockResolvedValue(null);

      await expect(service.startGame(mockUserId, startGameDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if section is not active', async () => {
      mockPrismaService.section.findUnique.mockResolvedValue({
        ...mockSection,
        isActive: false,
      });

      await expect(service.startGame(mockUserId, startGameDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if section has no words', async () => {
      mockPrismaService.section.findUnique.mockResolvedValue({
        ...mockSection,
        sectionWords: [],
      });

      await expect(service.startGame(mockUserId, startGameDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw ForbiddenException if section is not unlocked', async () => {
      mockPrismaService.section.findUnique.mockResolvedValue({
        ...mockSection,
        order: 2, // Not first section
      });

      mockPrismaService.userSection.findUnique.mockResolvedValue(null);

      await expect(service.startGame(mockUserId, startGameDto)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should start game successfully for first section', async () => {
      mockPrismaService.section.findUnique.mockResolvedValue(mockSection);
      mockPrismaService.userSection.findUnique.mockResolvedValue({
        unlocked: true,
        practiceStars: 0,
        challengeStars: 0,
      });
      mockPrismaService.gameRecord.create.mockResolvedValue({
        id: mockGameRecordId,
        userId: mockUserId,
        sectionId: mockSectionId,
        mode: GameMode.PRACTICE,
      });

      const result = await service.startGame(mockUserId, startGameDto);

      expect(result).toBeDefined();
      expect(result.gameRecordId).toBe(mockGameRecordId);
      expect(result.mode).toBe(GameMode.PRACTICE);
      expect(result.totalWords).toBe(2);
      expect(result.words).toBeDefined();
      expect(mockRedisService.set).toHaveBeenCalled();
    });

    it('should auto-unlock first section and start game', async () => {
      mockPrismaService.section.findUnique.mockResolvedValue(mockSection); // order=1, chapter.order=1
      mockPrismaService.userSection.findUnique.mockResolvedValue(null);
      mockPrismaService.userSection.upsert.mockResolvedValue({ unlocked: true });
      mockPrismaService.gameRecord.create.mockResolvedValue({
        id: mockGameRecordId,
        mode: GameMode.PRACTICE,
      });

      const result = await service.startGame(mockUserId, startGameDto);

      expect(result).toBeDefined();
      expect(mockPrismaService.userSection.upsert).toHaveBeenCalled();
    });

    it('should throw ForbiddenException for challenge mode without practice stars', async () => {
      mockPrismaService.section.findUnique.mockResolvedValue(mockSection);
      mockPrismaService.userSection.findUnique.mockResolvedValue({
        unlocked: true,
        practiceStars: 0,
        challengeStars: 0,
      });

      await expect(
        service.startGame(mockUserId, { ...startGameDto, mode: GameMode.CHALLENGE }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException for speed mode without challenge stars', async () => {
      mockPrismaService.section.findUnique.mockResolvedValue(mockSection);
      mockPrismaService.userSection.findUnique.mockResolvedValue({
        unlocked: true,
        practiceStars: 3,
        challengeStars: 1, // Need at least 2
      });

      await expect(
        service.startGame(mockUserId, { ...startGameDto, mode: GameMode.SPEED }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ==================== submitAnswer ====================
  describe('submitAnswer', () => {
    const submitDto = {
      gameRecordId: mockGameRecordId,
      wordId: mockWordId,
      answer: 'apple',
      timeSpent: 3000,
    };

    it('should throw BadRequestException if game session not found', async () => {
      mockRedisService.get.mockResolvedValue(null);

      await expect(service.submitAnswer(mockUserId, submitDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw ForbiddenException if user does not own the game', async () => {
      mockRedisService.get.mockResolvedValue(
        JSON.stringify({ ...mockGameSession, userId: 'other-user' }),
      );

      await expect(service.submitAnswer(mockUserId, submitDto)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw BadRequestException if game is paused', async () => {
      mockRedisService.get.mockResolvedValue(
        JSON.stringify({ ...mockGameSession, isPaused: true }),
      );

      await expect(service.submitAnswer(mockUserId, submitDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if word not in game', async () => {
      mockRedisService.get.mockResolvedValue(JSON.stringify(mockGameSession));

      await expect(
        service.submitAnswer(mockUserId, { ...submitDto, wordId: 'non-existent-word' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if word already answered', async () => {
      mockRedisService.get.mockResolvedValue(
        JSON.stringify({ ...mockGameSession, answeredWords: [mockWordId] }),
      );

      await expect(service.submitAnswer(mockUserId, submitDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should return correct result for correct answer', async () => {
      mockRedisService.get.mockResolvedValue(JSON.stringify(mockGameSession));
      mockPrismaService.userWord.findUnique.mockResolvedValue(null);
      mockPrismaService.userWord.create.mockResolvedValue({});

      const result = await service.submitAnswer(mockUserId, submitDto) as any;

      expect(result).toBeDefined();
      expect(result.isCorrect).toBe(true);
      expect(result.correctAnswer).toBe('apple');
      expect(result.wordScore).toBeGreaterThan(0);
      expect(result.correctCount).toBe(1);
      expect(result.wrongCount).toBe(0);
    });

    it('should return incorrect result for wrong answer', async () => {
      mockRedisService.get.mockResolvedValue(JSON.stringify(mockGameSession));
      mockPrismaService.wrongBook.upsert.mockResolvedValue({});
      mockPrismaService.userWord.findUnique.mockResolvedValue(null);
      mockPrismaService.userWord.create.mockResolvedValue({});

      const result = await service.submitAnswer(mockUserId, {
        ...submitDto,
        answer: 'wrong-answer',
      }) as any;

      expect(result.isCorrect).toBe(false);
      expect(result.wordScore).toBe(0);
      expect(result.wrongCount).toBe(1);
      expect(result.combo).toBe(0);
    });

    it('should be case-insensitive for answer comparison', async () => {
      mockRedisService.get.mockResolvedValue(JSON.stringify(mockGameSession));
      mockPrismaService.userWord.findUnique.mockResolvedValue(null);
      mockPrismaService.userWord.create.mockResolvedValue({});

      const result = await service.submitAnswer(mockUserId, {
        ...submitDto,
        answer: 'APPLE',
      }) as any;

      expect(result.isCorrect).toBe(true);
    });

    it('should mark game as completed when all words answered', async () => {
      const almostDoneSession = {
        ...mockGameSession,
        answeredWords: ['word-2'], // Only one word left
      };
      mockRedisService.get.mockResolvedValue(JSON.stringify(almostDoneSession));
      mockPrismaService.userWord.findUnique.mockResolvedValue(null);
      mockPrismaService.userWord.create.mockResolvedValue({});

      const result = await service.submitAnswer(mockUserId, submitDto) as any;

      expect(result.isCompleted).toBe(true);
    });
  });

  // ==================== pauseGame ====================
  describe('pauseGame', () => {
    const pauseDto = { gameRecordId: mockGameRecordId };

    it('should throw BadRequestException if game session not found', async () => {
      mockRedisService.get.mockResolvedValue(null);

      await expect(service.pauseGame(mockUserId, pauseDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw ForbiddenException if user does not own the game', async () => {
      mockRedisService.get.mockResolvedValue(
        JSON.stringify({ ...mockGameSession, userId: 'other-user' }),
      );

      await expect(service.pauseGame(mockUserId, pauseDto)).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if game is already paused', async () => {
      mockRedisService.get.mockResolvedValue(
        JSON.stringify({ ...mockGameSession, isPaused: true }),
      );

      await expect(service.pauseGame(mockUserId, pauseDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for speed mode', async () => {
      mockRedisService.get.mockResolvedValue(
        JSON.stringify({ ...mockGameSession, mode: GameMode.SPEED }),
      );

      await expect(service.pauseGame(mockUserId, pauseDto)).rejects.toThrow(BadRequestException);
    });

    it('should pause game successfully', async () => {
      mockRedisService.get.mockResolvedValue(JSON.stringify(mockGameSession));

      const result = await service.pauseGame(mockUserId, pauseDto);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(mockRedisService.set).toHaveBeenCalled();
    });
  });

  // ==================== resumeGame ====================
  describe('resumeGame', () => {
    const resumeDto = { gameRecordId: mockGameRecordId };
    const pausedSession = {
      ...mockGameSession,
      isPaused: true,
      pauseStartTime: Date.now() - 10000, // Paused 10 seconds ago
    };

    it('should throw BadRequestException if game session not found', async () => {
      mockRedisService.get.mockResolvedValue(null);

      await expect(service.resumeGame(mockUserId, resumeDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if game is not paused', async () => {
      mockRedisService.get.mockResolvedValue(JSON.stringify(mockGameSession));

      await expect(service.resumeGame(mockUserId, resumeDto)).rejects.toThrow(BadRequestException);
    });

    it('should resume game successfully', async () => {
      mockRedisService.get.mockResolvedValue(JSON.stringify(pausedSession));

      const result = await service.resumeGame(mockUserId, resumeDto);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(mockRedisService.set).toHaveBeenCalled();
    });

    it('should throw BadRequestException if pause duration exceeds maximum', async () => {
      const longPausedSession = {
        ...mockGameSession,
        isPaused: true,
        pauseStartTime: Date.now() - 400000, // Paused 400 seconds (> 300 max)
      };
      mockRedisService.get.mockResolvedValue(JSON.stringify(longPausedSession));
      mockPrismaService.gameRecord.update.mockResolvedValue({});

      await expect(service.resumeGame(mockUserId, resumeDto)).rejects.toThrow(BadRequestException);
    });
  });

  // ==================== endGame ====================
  describe('endGame', () => {
    const endGameDto = { gameRecordId: mockGameRecordId };

    it('should throw BadRequestException if game session not found', async () => {
      mockRedisService.get.mockResolvedValue(null);

      await expect(service.endGame(mockUserId, endGameDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException if user does not own the game', async () => {
      mockRedisService.get.mockResolvedValue(
        JSON.stringify({ ...mockGameSession, userId: 'other-user' }),
      );

      await expect(service.endGame(mockUserId, endGameDto)).rejects.toThrow(ForbiddenException);
    });

    it('should end game and return results', async () => {
      const completedSession = {
        ...mockGameSession,
        correctCount: 2,
        wrongCount: 0,
        totalScore: 50,
        answeredWords: [mockWordId, 'word-2'],
      };
      mockRedisService.get.mockResolvedValue(JSON.stringify(completedSession));

      mockPrismaService.gameRecord.update.mockResolvedValue({
        id: mockGameRecordId,
        correctCount: 2,
        wrongCount: 0,
        score: 50,
        stars: 3,
      });

      mockPrismaService.userSection.findUnique.mockResolvedValue({
        practiceCompleted: false,
        practiceBestScore: 0,
        practiceStars: 0,
      });

      mockPrismaService.userSection.update.mockResolvedValue({});

      mockPrismaService.section.findUnique.mockResolvedValue({
        id: mockSectionId,
        order: 1,
        chapterId: 'chapter-1',
        chapter: {
          order: 1,
          wordBankId: 'wordbank-1',
          wordBank: { wordCount: 100 },
        },
      });

      mockPrismaService.section.findFirst.mockResolvedValue(null);
      mockPrismaService.chapter.findFirst.mockResolvedValue(null);

      mockPrismaService.userLevel.findUnique.mockResolvedValue({
        level: 5,
        currentExp: 100,
        totalExp: 1000,
        title: '初学者',
      });
      mockPrismaService.userLevel.update.mockResolvedValue({});
      mockPrismaService.userWordBank.upsert.mockResolvedValue({});

      // Mock userWord count for progress
      mockPrismaService.userWord.count.mockResolvedValue(10);

      const result = await service.endGame(mockUserId, endGameDto);

      expect(result).toBeDefined();
      expect(result.gameRecordId).toBe(mockGameRecordId);
      expect(result.correctCount).toBe(2);
      expect(result.wrongCount).toBe(0);
      expect(result.accuracy).toBe(100);
      expect(result.stars).toBeGreaterThanOrEqual(0);
      expect(result.expEarned).toBeGreaterThanOrEqual(0);
    });
  });

  // ==================== getGameStatus ====================
  describe('getGameStatus', () => {
    it('should return inactive status if session not found', async () => {
      mockRedisService.get.mockResolvedValue(null);

      const result = await service.getGameStatus(mockUserId, mockGameRecordId);

      expect(result.active).toBe(false);
    });

    it('should throw ForbiddenException if user does not own the game', async () => {
      mockRedisService.get.mockResolvedValue(
        JSON.stringify({ ...mockGameSession, userId: 'other-user' }),
      );

      await expect(service.getGameStatus(mockUserId, mockGameRecordId)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should return active game status', async () => {
      mockRedisService.get.mockResolvedValue(JSON.stringify(mockGameSession));

      const result = await service.getGameStatus(mockUserId, mockGameRecordId);

      expect(result.active).toBe(true);
      expect(result.gameRecordId).toBe(mockGameRecordId);
      expect(result.mode).toBe(GameMode.PRACTICE);
      expect(result.isPaused).toBe(false);
      expect(result.progress).toBeDefined();
      expect(result.stats).toBeDefined();
    });
  });

  // ==================== getGameRecord ====================
  describe('getGameRecord', () => {
    it('should throw NotFoundException if record not found', async () => {
      mockPrismaService.gameRecord.findFirst.mockResolvedValue(null);

      await expect(service.getGameRecord(mockUserId, mockGameRecordId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return game record', async () => {
      const mockRecord = {
        id: mockGameRecordId,
        userId: mockUserId,
        mode: GameMode.PRACTICE,
        score: 100,
        stars: 3,
        section: {
          id: mockSectionId,
          name: 'Section 1',
          chapter: {
            name: 'Chapter 1',
            wordBank: { name: 'Test WordBank' },
          },
        },
      };

      mockPrismaService.gameRecord.findFirst.mockResolvedValue(mockRecord);

      const result = await service.getGameRecord(mockUserId, mockGameRecordId);

      expect(result).toBeDefined();
      expect(result.id).toBe(mockGameRecordId);
    });
  });

  // ==================== getGameHistory ====================
  describe('getGameHistory', () => {
    it('should return paginated game history', async () => {
      const mockRecords = [
        {
          id: 'record-1',
          mode: GameMode.PRACTICE,
          score: 100,
          stars: 3,
          createdAt: new Date(),
          section: {
            id: mockSectionId,
            name: 'Section 1',
            chapter: {
              name: 'Chapter 1',
              wordBank: { id: 'wb-1', name: 'Test WordBank' },
            },
          },
        },
      ];

      mockPrismaService.gameRecord.findMany.mockResolvedValue(mockRecords);
      mockPrismaService.gameRecord.count.mockResolvedValue(1);

      const result = await service.getGameHistory(mockUserId, { limit: 20, offset: 0 });

      expect(result).toBeDefined();
      expect(result.records).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.offset).toBe(0);
    });

    it('should filter by mode when provided', async () => {
      mockPrismaService.gameRecord.findMany.mockResolvedValue([]);
      mockPrismaService.gameRecord.count.mockResolvedValue(0);

      await service.getGameHistory(mockUserId, { mode: GameMode.CHALLENGE });

      expect(mockPrismaService.gameRecord.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ mode: GameMode.CHALLENGE }),
        }),
      );
    });
  });

  // ==================== getUserGameStats ====================
  describe('getUserGameStats', () => {
    it('should return comprehensive game statistics', async () => {
      mockPrismaService.gameRecord.aggregate.mockResolvedValue({
        _count: 100,
        _sum: {
          score: 50000,
          correctCount: 800,
          wrongCount: 200,
          timeUsed: 36000,
        },
        _max: {
          score: 1500,
          maxCombo: 30,
        },
        _avg: {
          accuracy: 80,
        },
      });

      mockPrismaService.gameRecord.groupBy.mockResolvedValue([
        {
          mode: 'practice',
          _count: 60,
          _sum: { score: 30000 },
          _max: { score: 1000, stars: 3 },
        },
        {
          mode: 'challenge',
          _count: 40,
          _sum: { score: 20000 },
          _max: { score: 1500, stars: 3 },
        },
      ]);

      const result = await service.getUserGameStats(mockUserId);

      expect(result).toBeDefined();
      expect(result.totalGames).toBe(100);
      expect(result.totalScore).toBe(50000);
      expect(result.totalCorrect).toBe(800);
      expect(result.highestScore).toBe(1500);
      expect(result.highestCombo).toBe(30);
      expect(result.averageAccuracy).toBe(80);
      expect(result.byMode).toBeDefined();
      expect(result.byMode['practice']).toBeDefined();
    });

    it('should return zero values when user has no games', async () => {
      mockPrismaService.gameRecord.aggregate.mockResolvedValue({
        _count: 0,
        _sum: { score: null, correctCount: null, wrongCount: null, timeUsed: null },
        _max: { score: null, maxCombo: null },
        _avg: { accuracy: null },
      });

      mockPrismaService.gameRecord.groupBy.mockResolvedValue([]);

      const result = await service.getUserGameStats(mockUserId);

      expect(result.totalGames).toBe(0);
      expect(result.totalScore).toBe(0);
      expect(result.highestScore).toBe(0);
    });
  });
});
