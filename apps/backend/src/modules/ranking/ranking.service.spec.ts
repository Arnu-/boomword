import { Test, TestingModule } from '@nestjs/testing';
import { RankingService } from './ranking.service';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { RedisService } from '../../shared/redis/redis.service';
import { NotFoundException } from '@nestjs/common';
import { RankingType } from './dto';

describe('RankingService', () => {
  let service: RankingService;

  const mockUserId = 'test-user-id';
  const mockSectionId = 'test-section-id';
  const mockWordBankId = 'test-wordbank-id';

  // Mock Prisma Service
  const mockPrismaService = {
    section: {
      findUnique: jest.fn(),
    },
    wordBank: {
      findUnique: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
    },
    friendship: {
      findMany: jest.fn(),
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
    zrevrange: jest.fn(),
    zcard: jest.fn(),
    zrevrank: jest.fn(),
    zscore: jest.fn(),
    zincrby: jest.fn(),
    zadd: jest.fn(),
    expire: jest.fn(),
    zrange: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RankingService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: RedisService, useValue: mockRedisService },
      ],
    }).compile();

    service = module.get<RankingService>(RankingService);

    jest.clearAllMocks();

    // Default mock returns
    mockRedisService.getJson.mockResolvedValue(null);
    mockRedisService.setJson.mockResolvedValue('OK');
    mockRedisService.del.mockResolvedValue(1);
    mockRedisService.zincrby.mockResolvedValue(100);
    mockRedisService.getClient.mockReturnValue(mockRedisClient);

    mockRedisClient.zrevrange.mockResolvedValue([]);
    mockRedisClient.zcard.mockResolvedValue(0);
    mockRedisClient.zrevrank.mockResolvedValue(null);
    mockRedisClient.zscore.mockResolvedValue(null);
    mockRedisClient.zincrby.mockResolvedValue(100);
    mockRedisClient.zadd.mockResolvedValue(1);
    mockRedisClient.expire.mockResolvedValue(1);
    mockRedisClient.zrange.mockResolvedValue([]);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ==================== getGlobalRanking ====================
  describe('getGlobalRanking', () => {
    it('should return empty ranking when no data', async () => {
      mockRedisClient.zrevrange.mockResolvedValue([]);
      mockRedisClient.zcard.mockResolvedValue(0);
      mockRedisClient.zrevrank.mockResolvedValue(null);
      mockRedisClient.zscore.mockResolvedValue(null);

      const result = await service.getGlobalRanking(RankingType.WEEKLY, mockUserId, 1, 10);

      expect(result).toBeDefined();
      expect(result.type).toBe(RankingType.WEEKLY);
      expect(result.items).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
      expect(result.myRank).toBeDefined();
      expect(result.myRank.rank).toBeNull();
    });

    it('should return ranking with user data', async () => {
      // Simulate 2 users in ranking: userId1 with 500 points, userId2 with 300 points
      mockRedisClient.zrevrange.mockResolvedValue(['user-1', '500', 'user-2', '300']);
      mockRedisClient.zcard.mockResolvedValue(2);
      mockRedisClient.zrevrank.mockResolvedValue(0); // Current user is rank 1
      mockRedisClient.zscore.mockResolvedValue('500');

      mockPrismaService.user.findMany.mockResolvedValue([
        { id: 'user-1', nickname: 'User1', avatarUrl: null, level: { level: 5, title: '初学者' } },
        { id: 'user-2', nickname: 'User2', avatarUrl: null, level: { level: 3, title: '初学者' } },
      ]);

      const result = await service.getGlobalRanking(RankingType.WEEKLY, mockUserId, 1, 10);

      expect(result.items.length).toBe(2);
      expect(result.items[0].score).toBe(500);
      expect(result.items[1].score).toBe(300);
      expect(result.pagination.total).toBe(2);
    });

    it('should return monthly ranking', async () => {
      mockRedisClient.zrevrange.mockResolvedValue([]);
      mockRedisClient.zcard.mockResolvedValue(0);
      mockRedisClient.zrevrank.mockResolvedValue(null);
      mockRedisClient.zscore.mockResolvedValue(null);

      const result = await service.getGlobalRanking(RankingType.MONTHLY, mockUserId, 1, 10);

      expect(result.type).toBe(RankingType.MONTHLY);
    });

    it('should return total ranking', async () => {
      mockRedisClient.zrevrange.mockResolvedValue([]);
      mockRedisClient.zcard.mockResolvedValue(0);
      mockRedisClient.zrevrank.mockResolvedValue(null);
      mockRedisClient.zscore.mockResolvedValue(null);

      const result = await service.getGlobalRanking(RankingType.TOTAL, mockUserId, 1, 10);

      expect(result.type).toBe(RankingType.TOTAL);
    });
  });

  // ==================== getTopRanking ====================
  describe('getTopRanking', () => {
    it('should return cached top ranking if available', async () => {
      const cachedData = {
        type: RankingType.WEEKLY,
        items: [{ rank: 1, userId: 'user-1', score: 1000 }],
        updatedAt: new Date(),
      };

      mockRedisService.getJson.mockResolvedValue(cachedData);

      const result = await service.getTopRanking(RankingType.WEEKLY, 10);

      expect(result).toEqual(cachedData);
      expect(mockRedisClient.zrevrange).not.toHaveBeenCalled();
    });

    it('should fetch and cache top ranking when cache is empty', async () => {
      mockRedisService.getJson.mockResolvedValue(null);
      mockRedisClient.zrevrange.mockResolvedValue(['user-1', '1000', 'user-2', '800']);

      mockPrismaService.user.findMany.mockResolvedValue([
        { id: 'user-1', nickname: 'User1', avatarUrl: null, level: { level: 10, title: '达人' } },
        { id: 'user-2', nickname: 'User2', avatarUrl: null, level: { level: 8, title: '达人' } },
      ]);

      const result = await service.getTopRanking(RankingType.WEEKLY, 10);

      expect(result).toBeDefined();
      expect(result.type).toBe(RankingType.WEEKLY);
      expect(result.items.length).toBe(2);
      expect(mockRedisService.setJson).toHaveBeenCalled();
    });
  });

  // ==================== getMyRanking ====================
  describe('getMyRanking', () => {
    it('should return null ranks when user has no score', async () => {
      mockRedisClient.zrevrank.mockResolvedValue(null);
      mockRedisClient.zscore.mockResolvedValue(null);
      mockRedisClient.zcard.mockResolvedValue(100);

      const result = await service.getMyRanking(mockUserId);

      expect(result).toBeDefined();
      expect(result.weekly.rank).toBeNull();
      expect(result.monthly.rank).toBeNull();
      expect(result.total.rank).toBeNull();
    });

    it('should return correct ranks when user has scores', async () => {
      mockRedisClient.zrevrank.mockResolvedValue(4); // 0-indexed, so rank 5
      mockRedisClient.zscore.mockResolvedValue('500');
      mockRedisClient.zcard.mockResolvedValue(100);

      const result = await service.getMyRanking(mockUserId);

      expect(result.weekly.rank).toBe(5); // rank + 1
      expect(result.weekly.score).toBe(500);
      expect(result.weekly.percentile).toBeDefined();
    });
  });

  // ==================== getNearbyRanking ====================
  describe('getNearbyRanking', () => {
    it('should return empty result when user not in ranking', async () => {
      mockRedisClient.zrevrank.mockResolvedValue(null);

      const result = await service.getNearbyRanking(RankingType.WEEKLY, mockUserId, 5);

      expect(result).toBeDefined();
      expect(result.items).toHaveLength(0);
      expect(result.myRank.rank).toBeNull();
    });

    it('should return nearby users when user is in ranking', async () => {
      mockRedisClient.zrevrank.mockResolvedValue(10); // User is at rank 11
      mockRedisClient.zrevrange.mockResolvedValue([
        'user-a', '900', 'user-b', '800', mockUserId, '700',
        'user-c', '600', 'user-d', '500',
      ]);
      mockRedisClient.zcard.mockResolvedValue(100);
      mockRedisClient.zscore.mockResolvedValue('700');

      mockPrismaService.user.findMany.mockResolvedValue([
        { id: 'user-a', nickname: 'UserA', avatarUrl: null, level: { level: 5, title: '初学者' } },
        { id: 'user-b', nickname: 'UserB', avatarUrl: null, level: { level: 4, title: '初学者' } },
        { id: mockUserId, nickname: 'Me', avatarUrl: null, level: { level: 3, title: '初学者' } },
        { id: 'user-c', nickname: 'UserC', avatarUrl: null, level: { level: 2, title: '初学者' } },
        { id: 'user-d', nickname: 'UserD', avatarUrl: null, level: { level: 1, title: '初学者' } },
      ]);

      const result = await service.getNearbyRanking(RankingType.WEEKLY, mockUserId, 5);

      expect(result.items.length).toBeGreaterThan(0);
      expect(result.myRank.rank).toBe(11);
    });
  });

  // ==================== getSectionRanking ====================
  describe('getSectionRanking', () => {
    it('should throw NotFoundException if section not found', async () => {
      mockPrismaService.section.findUnique.mockResolvedValue(null);

      await expect(
        service.getSectionRanking(mockSectionId, mockUserId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return section ranking', async () => {
      mockPrismaService.section.findUnique.mockResolvedValue({
        id: mockSectionId,
        name: 'Section 1',
      });

      mockRedisClient.zrevrange.mockResolvedValue(['user-1', '500']);
      mockRedisClient.zcard.mockResolvedValue(1);
      mockRedisClient.zrevrank.mockResolvedValue(null);
      mockRedisClient.zscore.mockResolvedValue(null);

      mockPrismaService.user.findMany.mockResolvedValue([
        { id: 'user-1', nickname: 'User1', avatarUrl: null, level: { level: 5, title: '初学者' } },
      ]);

      const result = await service.getSectionRanking(mockSectionId, mockUserId);

      expect(result).toBeDefined();
      expect(result.items.length).toBe(1);
    });
  });

  // ==================== getWordBankRanking ====================
  describe('getWordBankRanking', () => {
    it('should throw NotFoundException if wordbank not found', async () => {
      mockPrismaService.wordBank.findUnique.mockResolvedValue(null);

      await expect(
        service.getWordBankRanking(mockWordBankId, mockUserId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return wordbank ranking', async () => {
      mockPrismaService.wordBank.findUnique.mockResolvedValue({
        id: mockWordBankId,
        name: 'Test WordBank',
      });

      mockRedisClient.zrevrange.mockResolvedValue([]);
      mockRedisClient.zcard.mockResolvedValue(0);
      mockRedisClient.zrevrank.mockResolvedValue(null);
      mockRedisClient.zscore.mockResolvedValue(null);

      const result = await service.getWordBankRanking(mockWordBankId, mockUserId);

      expect(result).toBeDefined();
      expect(result.items).toHaveLength(0);
    });
  });

  // ==================== getFriendsRanking ====================
  describe('getFriendsRanking', () => {
    it('should return empty result when user has no friends', async () => {
      mockPrismaService.friendship.findMany.mockResolvedValue([]);
      mockPrismaService.user.findMany.mockResolvedValue([
        { id: mockUserId, nickname: 'Me', avatarUrl: null, level: { level: 5, title: '初学者' } },
      ]);
      mockRedisClient.zscore.mockResolvedValue('100');

      const result = await service.getFriendsRanking(mockUserId, RankingType.WEEKLY);

      expect(result).toBeDefined();
      expect(result.totalFriends).toBe(0); // Only self, no friends
    });

    it('should return friends ranking including self', async () => {
      mockPrismaService.friendship.findMany.mockResolvedValue([
        { userId: mockUserId, friendId: 'friend-1' },
        { userId: 'friend-2', friendId: mockUserId },
      ]);

      mockPrismaService.user.findMany.mockResolvedValue([
        { id: mockUserId, nickname: 'Me', avatarUrl: null, level: { level: 5, title: '初学者' } },
        { id: 'friend-1', nickname: 'Friend1', avatarUrl: null, level: { level: 3, title: '初学者' } },
        { id: 'friend-2', nickname: 'Friend2', avatarUrl: null, level: { level: 4, title: '初学者' } },
      ]);

      mockRedisClient.zscore
        .mockResolvedValueOnce('500') // mockUserId
        .mockResolvedValueOnce('300') // friend-1
        .mockResolvedValueOnce('400'); // friend-2

      const result = await service.getFriendsRanking(mockUserId, RankingType.WEEKLY);

      expect(result).toBeDefined();
      expect(result.items.length).toBe(3); // self + 2 friends
      expect(result.totalFriends).toBe(2);
      expect(result.myRankAmongFriends).toBeDefined();
    });
  });

  // ==================== updateGlobalScore ====================
  describe('updateGlobalScore', () => {
    it('should update scores in all ranking keys', async () => {
      await service.updateGlobalScore(mockUserId, 100);

      expect(mockRedisClient.zincrby).toHaveBeenCalledTimes(3); // weekly, monthly, total
      expect(mockRedisClient.expire).toHaveBeenCalledTimes(2); // weekly, monthly
    });
  });

  // ==================== getRankingStats ====================
  describe('getRankingStats', () => {
    it('should return zero stats when ranking is empty', async () => {
      mockRedisClient.zcard.mockResolvedValue(0);

      const result = await service.getRankingStats(RankingType.WEEKLY);

      expect(result).toBeDefined();
      expect(result.totalUsers).toBe(0);
      expect(result.totalScore).toBe(0);
      expect(result.averageScore).toBe(0);
      expect(result.topScore).toBe(0);
    });

    it('should calculate correct stats', async () => {
      mockRedisClient.zcard.mockResolvedValue(3);
      mockRedisClient.zrevrange.mockResolvedValueOnce(['user-1', '1000']); // top entry
      mockRedisClient.zrange.mockResolvedValue(['user-3', '200', 'user-2', '500', 'user-1', '1000']);

      const result = await service.getRankingStats(RankingType.WEEKLY);

      expect(result.totalUsers).toBe(3);
      expect(result.topScore).toBe(1000);
      expect(result.totalScore).toBe(1700);
      expect(result.averageScore).toBe(567); // Math.round(1700/3)
    });
  });

  // ==================== getUserBestRank ====================
  describe('getUserBestRank', () => {
    it('should return null best ranks when no history', async () => {
      mockRedisService.getJson.mockResolvedValue(null);

      const result = await service.getUserBestRank(mockUserId);

      expect(result).toBeDefined();
      expect(result.weekly.bestRank).toBeNull();
      expect(result.monthly.bestRank).toBeNull();
    });

    it('should return cached best ranks', async () => {
      const cachedData = {
        weekly: { bestRank: 5, achievedAt: '2024-01-15T00:00:00.000Z' },
        monthly: { bestRank: 10, achievedAt: '2024-01-01T00:00:00.000Z' },
      };

      mockRedisService.getJson.mockResolvedValue(cachedData);

      const result = await service.getUserBestRank(mockUserId);

      expect(result.weekly.bestRank).toBe(5);
      expect(result.monthly.bestRank).toBe(10);
      expect(result.weekly.achievedAt).toBeInstanceOf(Date);
    });
  });
});
