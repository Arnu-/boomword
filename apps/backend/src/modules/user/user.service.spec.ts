import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('UserService', () => {
  let service: UserService;

  const mockUserId = 'test-user-id';

  // Mock Prisma Service
  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    userLevel: {
      findUnique: jest.fn(),
    },
    gameRecord: {
      aggregate: jest.fn(),
    },
    userWord: {
      groupBy: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<UserService>(UserService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ==================== findById ====================
  describe('findById', () => {
    it('should throw NotFoundException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.findById(mockUserId)).rejects.toThrow(NotFoundException);
    });

    it('should return user info with level data', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: mockUserId,
        nickname: 'TestUser',
        avatarUrl: 'https://example.com/avatar.png',
        gender: 'male' as const,
        grade: 'high_school',
        createdAt: new Date('2024-01-01'),
        level: {
          level: 10,
          currentExp: 500,
          totalExp: 2000,
          title: '词汇达人',
          consecutiveDays: 7,
        },
      });

      const result = await service.findById(mockUserId);

      expect(result).toBeDefined();
      expect(result.id).toBe(mockUserId);
      expect(result.nickname).toBe('TestUser');
      expect(result.level).toBe(10);
      expect(result.exp).toBe(500);
      expect(result.totalExp).toBe(2000);
      expect(result.title).toBe('词汇达人');
      expect(result.consecutiveDays).toBe(7);
    });

    it('should return default level values when user has no level record', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: mockUserId,
        nickname: 'NewUser',
        avatarUrl: null,
        gender: null,
        grade: null,
        createdAt: new Date(),
        level: null,
      });

      const result = await service.findById(mockUserId);

      expect(result.level).toBe(1);
      expect(result.exp).toBe(0);
      expect(result.totalExp).toBe(0);
      expect(result.consecutiveDays).toBe(0);
    });
  });

  // ==================== update ====================
  describe('update', () => {
    it('should update user info and return updated data', async () => {
      const updateDto = {
        nickname: 'UpdatedUser',
        avatar: 'https://example.com/new-avatar.png',
        gender: 'female' as const,
        grade: 'college',
      };

      mockPrismaService.user.update.mockResolvedValue({
        id: mockUserId,
        nickname: 'UpdatedUser',
        avatarUrl: 'https://example.com/new-avatar.png',
        gender: 'female' as const,
        grade: 'college',
        level: { level: 5, currentExp: 200 },
      });

      const result = await service.update(mockUserId, updateDto);

      expect(result).toBeDefined();
      expect(result.nickname).toBe('UpdatedUser');
      expect(result.avatar).toBe('https://example.com/new-avatar.png');
      expect(mockPrismaService.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockUserId },
          data: expect.objectContaining({
            nickname: 'UpdatedUser',
            avatarUrl: 'https://example.com/new-avatar.png',
          }),
        }),
      );
    });

    it('should handle partial updates', async () => {
      const updateDto = { nickname: 'OnlyNickname' };

      mockPrismaService.user.update.mockResolvedValue({
        id: mockUserId,
        nickname: 'OnlyNickname',
        avatarUrl: null,
        gender: null,
        grade: null,
        level: null,
      });

      const result = await service.update(mockUserId, updateDto);

      expect(result.nickname).toBe('OnlyNickname');
      expect(result.level).toBe(1);
    });
  });

  // ==================== getStats ====================
  describe('getStats', () => {
    it('should return comprehensive user statistics', async () => {
      mockPrismaService.userLevel.findUnique.mockResolvedValue({
        level: 15,
        currentExp: 800,
        totalExp: 5000,
        consecutiveDays: 10,
        longestStreak: 30,
      });

      mockPrismaService.gameRecord.aggregate.mockResolvedValue({
        _count: 50,
        _sum: {
          score: 25000,
          correctCount: 400,
          wrongCount: 100,
        },
      });

      mockPrismaService.userWord.groupBy.mockResolvedValue([
        { mastery: 'mastered', _count: 200 },
        { mastery: 'learning', _count: 100 },
        { mastery: 'need_review', _count: 50 },
        { mastery: 'not_learned', _count: 30 },
      ]);

      const result = await service.getStats(mockUserId);

      expect(result).toBeDefined();
      expect(result.level).toBe(15);
      expect(result.exp).toBe(800);
      expect(result.totalExp).toBe(5000);
      expect(result.consecutiveDays).toBe(10);
      expect(result.longestStreak).toBe(30);
      expect(result.totalGames).toBe(50);
      expect(result.totalScore).toBe(25000);
      expect(result.totalCorrect).toBe(400);
      expect(result.totalWrong).toBe(100);
      expect(result.words.mastered).toBe(200);
      expect(result.words.learning).toBe(100);
      expect(result.words.needReview).toBe(50);
      expect(result.words.notLearned).toBe(30);
    });

    it('should return default values when user has no records', async () => {
      mockPrismaService.userLevel.findUnique.mockResolvedValue(null);

      mockPrismaService.gameRecord.aggregate.mockResolvedValue({
        _count: 0,
        _sum: {
          score: null,
          correctCount: null,
          wrongCount: null,
        },
      });

      mockPrismaService.userWord.groupBy.mockResolvedValue([]);

      const result = await service.getStats(mockUserId);

      expect(result.level).toBe(1);
      expect(result.exp).toBe(0);
      expect(result.totalGames).toBe(0);
      expect(result.totalScore).toBe(0);
      expect(result.words.mastered).toBe(0);
      expect(result.words.learning).toBe(0);
    });

    it('should correctly map mastery counts from groupBy result', async () => {
      mockPrismaService.userLevel.findUnique.mockResolvedValue(null);
      mockPrismaService.gameRecord.aggregate.mockResolvedValue({
        _count: 0,
        _sum: { score: null, correctCount: null, wrongCount: null },
      });

      mockPrismaService.userWord.groupBy.mockResolvedValue([
        { mastery: 'mastered', _count: 150 },
      ]);

      const result = await service.getStats(mockUserId);

      expect(result.words.mastered).toBe(150);
      expect(result.words.learning).toBe(0);
      expect(result.words.needReview).toBe(0);
      expect(result.words.notLearned).toBe(0);
    });
  });
});