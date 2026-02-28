import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '@/shared/prisma/prisma.service';
import { RedisService } from '@/shared/redis/redis.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { IdGenerator } from '@/common/utils';
import { CacheKeys, CacheTTL } from '@/common/constants';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private redis: RedisService,
  ) {}

  async register(dto: RegisterDto) {
    const { phone, email, password, nickname, code } = dto;

    if (!phone && !email) {
      throw new BadRequestException('手机号或邮箱至少填写一个');
    }

    // 验证验证码
    await this.verifyCode(phone || email!, code);

    // 检查用户是否存在
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ phone: phone || undefined }, { email: email || undefined }].filter(
          (c) => Object.values(c)[0] !== undefined,
        ),
      },
    });

    if (existingUser) {
      throw new ConflictException('用户已存在');
    }

    // 密码加密
    const passwordHash = await bcrypt.hash(password, 12);

    // 创建用户
    const user = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          id: IdGenerator.userId(),
          phone,
          email,
          passwordHash,
          nickname,
          status: 'active',
        },
      });

      // 初始化用户等级
      await tx.userLevel.create({
        data: {
          id: IdGenerator.uuid(),
          userId: newUser.id,
          level: 1,
          currentExp: 0,
          totalExp: 0,
          title: '初学者',
        },
      });

      return newUser;
    });

    // 生成Token
    const tokens = await this.generateTokens(user.id);

    return {
      user: {
        id: user.id,
        nickname: user.nickname,
        avatar: user.avatarUrl,
        level: 1,
        exp: 0,
      },
      ...tokens,
    };
  }

  async login(dto: LoginDto) {
    const { phone, email, password } = dto;

    if (!phone && !email) {
      throw new BadRequestException('手机号或邮箱至少填写一个');
    }

    // 查找用户
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ phone: phone || undefined }, { email: email || undefined }].filter(
          (c) => Object.values(c)[0] !== undefined,
        ),
        deletedAt: null,
      },
      include: {
        level: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    // 验证密码
    if (!user.passwordHash) {
      throw new UnauthorizedException('密码错误');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('密码错误');
    }

    // 检查账号状态
    if (user.status === 'locked') {
      throw new UnauthorizedException('账号已被锁定');
    }

    if (user.status === 'banned') {
      throw new UnauthorizedException('账号已被封禁');
    }

    // 生成Token
    const tokens = await this.generateTokens(user.id);

    // 更新最后登录时间
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
      },
    });

    return {
      user: {
        id: user.id,
        nickname: user.nickname,
        avatar: user.avatarUrl,
        level: user.level?.level || 1,
        exp: user.level?.currentExp || 0,
      },
      ...tokens,
    };
  }

  async sendCode(target: string, type: 'register' | 'login' | 'reset') {
    // 生成6位验证码
    const code = Math.random().toString().slice(2, 8);

    // 存储验证码（5分钟有效）
    const key = CacheKeys.VERIFY_CODE(target);
    await this.redis.set(key, code, CacheTTL.VERIFY_CODE);

    // TODO: 实际需要调用短信/邮件服务
    console.log(`[${type}] Send code ${code} to ${target}`);

    return { message: '验证码已发送' };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get('jwt.refreshSecret'),
      });

      const userId = payload.sub;

      // 验证RefreshToken
      const storedToken = await this.redis.get(CacheKeys.AUTH_REFRESH(userId));
      if (storedToken !== refreshToken) {
        throw new UnauthorizedException('RefreshToken无效');
      }

      // 生成新Token
      return this.generateTokens(userId);
    } catch {
      throw new UnauthorizedException('RefreshToken无效或已过期');
    }
  }

  async logout(userId: string) {
    await this.redis.del(CacheKeys.AUTH_REFRESH(userId));
    return { message: '登出成功' };
  }

  async validateUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { level: true },
    });

    if (!user || user.deletedAt) {
      throw new UnauthorizedException('用户不存在');
    }

    if (user.status !== 'active') {
      throw new UnauthorizedException('账号状态异常');
    }

    return {
      id: user.id,
      nickname: user.nickname,
      avatar: user.avatarUrl,
      level: user.level?.level || 1,
      role: user.role,
    };
  }

  private async verifyCode(target: string, code: string) {
    // 开发环境允许使用固定验证码 000000
    const isDev = this.configService.get('app.nodeEnv') === 'development';
    if (isDev && code === '000000') {
      console.log(`[DEV] Using bypass code for ${target}`);
      return;
    }

    const key = CacheKeys.VERIFY_CODE(target);
    const storedCode = await this.redis.get(key);

    if (!storedCode || storedCode !== code) {
      throw new UnauthorizedException('验证码错误或已过期');
    }

    // 验证成功后删除
    await this.redis.del(key);
  }

  private async generateTokens(userId: string) {
    const payload = { sub: userId };

    const [token, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('jwt.secret'),
        expiresIn: this.configService.get('jwt.expiresIn'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('jwt.refreshSecret'),
        expiresIn: this.configService.get('jwt.refreshExpiresIn'),
      }),
    ]);

    // 存储RefreshToken
    await this.redis.set(CacheKeys.AUTH_REFRESH(userId), refreshToken, CacheTTL.AUTH_REFRESH);

    return {
      token,
      refreshToken,
    };
  }
}
