import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { RedisService } from '../../shared/redis/redis.service';
import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';

// Mock bcrypt
jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;

  const mockUserId = 'user-test-id';

  // Mock Prisma Service
  const mockPrismaService = {
    user: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    userLevel: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  // Mock Redis Service
  const mockRedisService = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    getJson: jest.fn(),
    setJson: jest.fn(),
  };

  // Mock JWT Service
  const mockJwtService = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
  };

  // Mock Config Service
  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, string> = {
        'jwt.secret': 'test-secret',
        'jwt.refreshSecret': 'test-refresh-secret',
        'jwt.expiresIn': '1h',
        'jwt.refreshExpiresIn': '7d',
        'app.nodeEnv': 'test',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: RedisService, useValue: mockRedisService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);

    jest.clearAllMocks();

    // Default mock returns
    mockJwtService.signAsync.mockResolvedValue('mock-token');
    mockRedisService.set.mockResolvedValue('OK');
    mockRedisService.del.mockResolvedValue(1);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ==================== register ====================
  describe('register', () => {
    const registerDto = {
      phone: '13800138000',
      password: 'password123',
      nickname: 'TestUser',
      code: '000000',
    };

    it('should throw BadRequestException if neither phone nor email provided', async () => {
      await expect(
        service.register({ password: 'pass', nickname: 'nick', code: '000000' } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw UnauthorizedException if verification code is invalid', async () => {
      mockRedisService.get.mockResolvedValue('123456');

      await expect(
        service.register({ ...registerDto, code: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw ConflictException if user already exists', async () => {
      // Use dev bypass code
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'app.nodeEnv') return 'development';
        return 'test-value';
      });

      mockPrismaService.user.findFirst.mockResolvedValue({
        id: mockUserId,
        phone: '13800138000',
      });

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
    });

    it('should register user successfully with dev bypass code', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'app.nodeEnv') return 'development';
        if (key === 'jwt.secret') return 'test-secret';
        if (key === 'jwt.refreshSecret') return 'test-refresh-secret';
        if (key === 'jwt.expiresIn') return '1h';
        if (key === 'jwt.refreshExpiresIn') return '7d';
        return 'test-value';
      });

      mockPrismaService.user.findFirst.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');

      const newUser = {
        id: mockUserId,
        nickname: 'TestUser',
        avatarUrl: null,
      };

      mockPrismaService.$transaction.mockImplementation(async (fn: any) => {
        mockPrismaService.user.create.mockResolvedValue(newUser);
        mockPrismaService.userLevel.create.mockResolvedValue({});
        return fn(mockPrismaService);
      });

      mockJwtService.signAsync.mockResolvedValue('mock-token');

      const result = await service.register(registerDto);

      expect(result).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.token).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });
  });

  // ==================== login ====================
  describe('login', () => {
    const loginDto = {
      phone: '13800138000',
      password: 'password123',
    };

    it('should throw BadRequestException if neither phone nor email provided', async () => {
      await expect(
        service.login({ password: 'pass' } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password is incorrect', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue({
        id: mockUserId,
        phone: '13800138000',
        passwordHash: 'hashed-password',
        status: 'active',
        level: { level: 1, currentExp: 0 },
      });

      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if account is locked', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue({
        id: mockUserId,
        phone: '13800138000',
        passwordHash: 'hashed-password',
        status: 'locked',
        level: { level: 1, currentExp: 0 },
      });

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if account is banned', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue({
        id: mockUserId,
        phone: '13800138000',
        passwordHash: 'hashed-password',
        status: 'banned',
        level: { level: 1, currentExp: 0 },
      });

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should login successfully with correct credentials', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue({
        id: mockUserId,
        nickname: 'TestUser',
        avatarUrl: null,
        phone: '13800138000',
        passwordHash: 'hashed-password',
        status: 'active',
        level: { level: 5, currentExp: 100 },
      });

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.signAsync.mockResolvedValue('mock-token');
      mockPrismaService.user.update.mockResolvedValue({});

      const result = await service.login(loginDto);

      expect(result).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.user.id).toBe(mockUserId);
      expect(result.token).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(mockPrismaService.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockUserId },
          data: expect.objectContaining({ lastLoginAt: expect.any(Date) }),
        }),
      );
    });

    it('should use default level values when user has no level record', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue({
        id: mockUserId,
        nickname: 'TestUser',
        avatarUrl: null,
        phone: '13800138000',
        passwordHash: 'hashed-password',
        status: 'active',
        level: null,
      });

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.signAsync.mockResolvedValue('mock-token');
      mockPrismaService.user.update.mockResolvedValue({});

      const result = await service.login(loginDto);

      expect(result.user.level).toBe(1);
      expect(result.user.exp).toBe(0);
    });
  });

  // ==================== sendCode ====================
  describe('sendCode', () => {
    it('should send verification code and store in redis', async () => {
      mockRedisService.set.mockResolvedValue('OK');

      const result = await service.sendCode('13800138000', 'register');

      expect(result).toBeDefined();
      expect(result.message).toBeDefined();
      expect(mockRedisService.set).toHaveBeenCalled();
    });

    it('should send code for login type', async () => {
      const result = await service.sendCode('test@example.com', 'login');
      expect(result.message).toBeDefined();
    });

    it('should send code for reset type', async () => {
      const result = await service.sendCode('13800138000', 'reset');
      expect(result.message).toBeDefined();
    });
  });

  // ==================== refreshToken ====================
  describe('refreshToken', () => {
    it('should throw UnauthorizedException if token is invalid', async () => {
      mockJwtService.verifyAsync.mockRejectedValue(new Error('invalid token'));

      await expect(service.refreshToken('invalid-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if stored token does not match', async () => {
      mockJwtService.verifyAsync.mockResolvedValue({ sub: mockUserId });
      mockRedisService.get.mockResolvedValue('different-token');

      await expect(service.refreshToken('my-refresh-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should return new tokens when refresh token is valid', async () => {
      mockJwtService.verifyAsync.mockResolvedValue({ sub: mockUserId });
      mockRedisService.get.mockResolvedValue('valid-refresh-token');
      mockJwtService.signAsync.mockResolvedValue('new-token');

      const result = await service.refreshToken('valid-refresh-token');

      expect(result).toBeDefined();
      expect(result.token).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });
  });

  // ==================== logout ====================
  describe('logout', () => {
    it('should delete refresh token from redis', async () => {
      mockRedisService.del.mockResolvedValue(1);

      const result = await service.logout(mockUserId);

      expect(result).toBeDefined();
      expect(result.message).toBeDefined();
      expect(mockRedisService.del).toHaveBeenCalled();
    });
  });

  // ==================== validateUser ====================
  describe('validateUser', () => {
    it('should throw UnauthorizedException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.validateUser(mockUserId)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if user is deleted', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: mockUserId,
        deletedAt: new Date(),
        status: 'active',
        level: null,
      });

      await expect(service.validateUser(mockUserId)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if user status is not active', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: mockUserId,
        deletedAt: null,
        status: 'locked',
        level: null,
      });

      await expect(service.validateUser(mockUserId)).rejects.toThrow(UnauthorizedException);
    });

    it('should return user info for valid active user', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: mockUserId,
        nickname: 'TestUser',
        avatarUrl: null,
        deletedAt: null,
        status: 'active',
        role: 'user',
        level: { level: 5, title: '词汇达人' },
      });

      const result = await service.validateUser(mockUserId);

      expect(result).toBeDefined();
      expect(result.id).toBe(mockUserId);
      expect(result.level).toBe(5);
      expect(result.role).toBe('user');
    });
  });
});
