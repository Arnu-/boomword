import { Test, TestingModule } from '@nestjs/testing';
import { AchievementService } from './achievement.service';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { RedisService } from '../../shared/redis/redis.service';
import { NotFoundException } from '@nestjs/common';
import { AchievementTrigger } from './dto';

describe('AchievementService', () => {
  let service: AchievementService;

  const mockUserId = 'test-user-id';

  // Mock Prisma Service
  const mockPrismaService = {
    userAchievement: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    achievement: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
    },
    user: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    userWord: {
      count: jest.fn(),
    },
    gameRecord: {
      aggregate: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
    },
    userLevel: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    friendship: {
      count: jest.fn(),
    },
    userWordBank: {
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
    getClient: jest.fn(),
  };

  const mockRedisClient = {
    zrevrank: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AchievementService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: RedisService, useValue: mockRedisService },
      ],
    }).compile();

    service = module.get<AchievementService>(AchievementService);

    jest.clearAllMocks();

    // Default mock returns
    mockRedisService.getJson.mockResolvedValue(null);
    mockRedisService.setJson.mockResolvedValue('OK');
    mockRedisService.del.mockResolvedValue(1);
    mockRedisService.getClient.mockReturnValue(mockRedisClient);
    mockRedisClient.zrevrank.mockResolvedValue(null);

    // Default progress data
    mockPrismaService.userWord.count.mockResolvedValue(0);
    mockPrismaService.gameRecord.aggregate.mockResolvedValue({
      _sum: { score: 0 },
      _max: { maxCombo: 0 },
    });
    mockPrismaService.gameRecord.count.mockResolvedValue(0);
    mockPrismaService.gameRecord.findMany.mockResolvedValue([]);
    mockPrismaService.userLevel.findUnique.mockResolvedValue({ level: 1, consecutiveDays: 0 });
    mockPrismaService.friendship.count.mockResolvedValue(0);
    mockPrismaService.userWordBank.count.mockResolvedValue(0);
    mockPrismaService.userAchievement.findMany.mockResolvedValue([]);
    mockPrismaService.achievement.findMany.mockResolvedValue([]);
    mockPrismaService.user.count.mockResolvedValue(100);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ==================== getAllAchievements ====================
  describe('getAllAchievements', () => {
    it('should return all achievements with unlock status', async () => {
      mockPrismaService.userAchievement.findMany.mockResolvedValue([]);

      const result = await service.getAllAchievements(mockUserId);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);

      // Check structure of first achievement
      const firstAchievement = result[0];
      expect(firstAchievement.code).toBeDefined();
      expect(firstAchievement.name).toBeDefined();
      expect(firstAchievement.type).toBeDefined();
      expect(firstAchievement.rarity).toBeDefined();
      expect(firstAchievement.isUnlocked).toBeDefined();
      expect(firstAchievement.progress).toBeDefined();
      expect(firstAchievement.progress.current).toBeDefined();
      expect(firstAchievement.progress.target).toBeDefined();
      expect(firstAchievement.progress.percentage).toBeDefined();
    });

    it('should mark achievements as unlocked for user with achievements', async () => {
      mockPrismaService.userAchievement.findMany.mockResolvedValue([
        {
          achievement: {
            id: 'ach-1',
            code: 'first_game',
            name: '初次冒险',
          },
          unlockedAt: new Date(),
        },
      ]);

      const result = await service.getAllAchievements(mockUserId);

      const firstGameAchievement = result.find((a) => a.code === 'first_game');
      expect(firstGameAchievement).toBeDefined();
      expect(firstGameAchievement!.isUnlocked).toBe(true);
    });

    it('should filter by type when provided', async () => {
      mockPrismaService.userAchievement.findMany.mockResolvedValue([]);

      const result = await service.getAllAchievements(mockUserId, { type: 'learning' as any });

      expect(result.every((a) => a.type === 'learning')).toBe(true);
    });

    it('should filter unlocked only when requested', async () => {
      mockPrismaService.userAchievement.findMany.mockResolvedValue([
        {
          achievement: { id: 'ach-1', code: 'first_game', name: '初次冒险' },
          unlockedAt: new Date(),
        },
      ]);

      const result = await service.getAllAchievements(mockUserId, { unlockedOnly: true });

      expect(result.every((a) => a.isUnlocked)).toBe(true);
    });

    it('should hide details of hidden achievements that are not unlocked', async () => {
      mockPrismaService.userAchievement.findMany.mockResolvedValue([]);

      const result = await service.getAllAchievements(mockUserId);

      const hiddenAchievements = result.filter((a) => a.isHidden && !a.isUnlocked);
      hiddenAchievements.forEach((a) => {
        expect(a.name).toBe('???');
        expect(a.icon).toBe('❓');
      });
    });
  });

  // ==================== getAchievementDetail ====================
  describe('getAchievementDetail', () => {
    it('should throw NotFoundException for non-existent achievement code', async () => {
      await expect(
        service.getAchievementDetail(mockUserId, 'non_existent_code'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return achievement detail for valid code', async () => {
      mockPrismaService.userAchievement.findFirst.mockResolvedValue(null);

      const result = await service.getAchievementDetail(mockUserId, 'first_game');

      expect(result).toBeDefined();
      expect(result.code).toBe('first_game');
      expect(result.name).toBeDefined();
      expect(result.progress).toBeDefined();
    });

    it('should show unlocked achievement details', async () => {
      mockPrismaService.userAchievement.findFirst.mockResolvedValue({
        achievement: { id: 'ach-1', code: 'first_game', name: '初次冒险' },
        unlockedAt: new Date('2024-01-15'),
      });

      const result = await service.getAchievementDetail(mockUserId, 'first_game');

      expect(result.isUnlocked).toBe(true);
      expect(result.unlockedAt).toBeDefined();
    });
  });

  // ==================== getUnlockedAchievements ====================
  describe('getUnlockedAchievements', () => {
    it('should return empty array when user has no achievements', async () => {
      mockPrismaService.userAchievement.findMany.mockResolvedValue([]);

      const result = await service.getUnlockedAchievements(mockUserId);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it('should return unlocked achievements with details', async () => {
      mockPrismaService.userAchievement.findMany.mockResolvedValue([
        {
          achievement: {
            id: 'ach-1',
            code: 'first_game',
            name: '初次冒险',
            description: '完成第一次游戏',
            icon: '🎉',
            expReward: 20,
          },
          unlockedAt: new Date('2024-01-15'),
        },
      ]);

      const result = await service.getUnlockedAchievements(mockUserId);

      expect(result.length).toBe(1);
      expect(result[0].code).toBe('first_game');
      expect(result[0].name).toBe('初次冒险');
      expect(result[0].unlockedAt).toBeDefined();
    });
  });

  // ==================== getAchievementStats ====================
  describe('getAchievementStats', () => {
    it('should return stats with zero values for new user', async () => {
      mockPrismaService.userAchievement.findMany.mockResolvedValue([]);

      const result = await service.getAchievementStats(mockUserId);

      expect(result).toBeDefined();
      expect(result.totalAchievements).toBeGreaterThan(0);
      expect(result.unlockedCount).toBe(0);
      expect(result.completionRate).toBe(0);
      expect(result.totalExpEarned).toBe(0);
      expect(result.byType).toBeDefined();
      expect(result.byRarity).toBeDefined();
      expect(result.recentUnlocks).toBeDefined();
    });

    it('should calculate correct stats for user with achievements', async () => {
      mockPrismaService.userAchievement.findMany.mockResolvedValue([
        {
          achievement: {
            id: 'ach-1',
            code: 'first_game',
            name: '初次冒险',
            description: '完成第一次游戏',
            icon: '🎉',
            expReward: 20,
          },
          unlockedAt: new Date(),
        },
        {
          achievement: {
            id: 'ach-2',
            code: 'games_10',
            name: '初试身手',
            description: '完成10次游戏',
            icon: '🎮',
            expReward: 10,
          },
          unlockedAt: new Date(),
        },
      ]);

      const result = await service.getAchievementStats(mockUserId);

      expect(result.unlockedCount).toBe(2);
      expect(result.completionRate).toBeGreaterThan(0);
      expect(result.totalExpEarned).toBeGreaterThan(0);
    });

    it('should include recent unlocks (max 5)', async () => {
      const mockAchievements = Array.from({ length: 7 }, (_, i) => ({
        achievement: {
          id: `ach-${i}`,
          code: `first_game`,
          name: `Achievement ${i}`,
          description: `Desc ${i}`,
          icon: '🎉',
          expReward: 10,
        },
        unlockedAt: new Date(),
      }));

      mockPrismaService.userAchievement.findMany.mockResolvedValue(mockAchievements);

      const result = await service.getAchievementStats(mockUserId);

      expect(result.recentUnlocks.length).toBeLessThanOrEqual(5);
    });
  });

  // ==================== checkAndUnlockAchievements ====================
  describe('checkAndUnlockAchievements', () => {
    it('should return empty unlocks for user with no progress', async () => {
      mockPrismaService.userAchievement.findMany.mockResolvedValue([]);

      const result = await service.checkAndUnlockAchievements(
        mockUserId,
        AchievementTrigger.GAME_END,
      );

      expect(result).toBeDefined();
      expect(result.newUnlocks).toBeDefined();
      expect(Array.isArray(result.newUnlocks)).toBe(true);
      expect(result.totalExpEarned).toBeDefined();
      expect(result.nearCompletion).toBeDefined();
    });

    it('should unlock first_game achievement when user completes first game', async () => {
      mockPrismaService.userAchievement.findMany.mockResolvedValue([]);
      mockPrismaService.gameRecord.count.mockResolvedValue(1); // 1 game completed
      mockPrismaService.achievement.findUnique.mockResolvedValue(null);
      mockPrismaService.achievement.create.mockResolvedValue({
        id: 'ach-1',
        code: 'first_game',
        name: '初次冒险',
        description: '完成第一次游戏',
        icon: '🎉',
        expReward: 20,
      });
      mockPrismaService.userAchievement.findUnique.mockResolvedValue(null);
      mockPrismaService.userAchievement.create.mockResolvedValue({});
      mockPrismaService.userLevel.findUnique.mockResolvedValue({
        level: 1,
        currentExp: 0,
        totalExp: 0,
        consecutiveDays: 0,
      });
      mockPrismaService.userLevel.update.mockResolvedValue({});

      const result = await service.checkAndUnlockAchievements(
        mockUserId,
        AchievementTrigger.GAME_END,
      );

      expect(result.newUnlocks.length).toBeGreaterThan(0);
      const firstGameUnlock = result.newUnlocks.find((u) => u.code === 'first_game');
      expect(firstGameUnlock).toBeDefined();
    });

    it('should not unlock already unlocked achievements', async () => {
      mockPrismaService.userAchievement.findMany.mockResolvedValue([
        {
          achievement: { id: 'ach-1', code: 'first_game' },
          unlockedAt: new Date(),
        },
      ]);
      mockPrismaService.gameRecord.count.mockResolvedValue(5);

      const result = await service.checkAndUnlockAchievements(
        mockUserId,
        AchievementTrigger.GAME_END,
      );

      const firstGameUnlock = result.newUnlocks.find((u) => u.code === 'first_game');
      expect(firstGameUnlock).toBeUndefined();
    });

    it('should identify near-completion achievements', async () => {
      mockPrismaService.userAchievement.findMany.mockResolvedValue([]);
      // 9 games completed (90% of 10 needed for games_10)
      mockPrismaService.gameRecord.count.mockResolvedValue(9);

      const result = await service.checkAndUnlockAchievements(
        mockUserId,
        AchievementTrigger.GAME_END,
      );

      expect(result.nearCompletion).toBeDefined();
      // games_10 should be near completion
      const nearGames10 = result.nearCompletion.find((a) => a.code === 'games_10');
      expect(nearGames10).toBeDefined();
    });
  });

  // ==================== checkAllAchievements ====================
  describe('checkAllAchievements', () => {
    it('should check all achievements and return results', async () => {
      mockPrismaService.userAchievement.findMany.mockResolvedValue([]);

      const result = await service.checkAllAchievements(mockUserId);

      expect(result).toBeDefined();
      expect(result.newUnlocks).toBeDefined();
      expect(result.totalExpEarned).toBeDefined();
      expect(result.nearCompletion).toBeDefined();
    });
  });

  // ==================== getAchievementRanking ====================
  describe('getAchievementRanking', () => {
    it('should return achievement ranking', async () => {
      mockPrismaService.userAchievement.groupBy.mockResolvedValue([
        { userId: 'user-1', _count: { achievementId: 10 } },
        { userId: 'user-2', _count: { achievementId: 8 } },
      ]);

      mockPrismaService.user.findMany.mockResolvedValue([
        { id: 'user-1', nickname: 'User1', avatarUrl: null },
        { id: 'user-2', nickname: 'User2', avatarUrl: null },
      ]);

      mockPrismaService.userAchievement.findMany.mockResolvedValue([]);
      mockPrismaService.userAchievement.count.mockResolvedValue(5);

      const result = await service.getAchievementRanking(mockUserId, 1, 10);

      expect(result).toBeDefined();
      expect(result.items).toBeDefined();
      expect(result.pagination).toBeDefined();
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(10);
    });

    it('should return empty ranking when no users have achievements', async () => {
      mockPrismaService.userAchievement.groupBy.mockResolvedValue([]);
      mockPrismaService.user.findMany.mockResolvedValue([]);
      mockPrismaService.userAchievement.count.mockResolvedValue(0);

      const result = await service.getAchievementRanking(mockUserId, 1, 10);

      expect(result.items).toHaveLength(0);
      expect(result.myRank).toBeNull();
    });
  });
});
