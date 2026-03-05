import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from '@/shared/prisma/prisma.service';
import { RedisService } from '@/shared/redis/redis.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  @Get()
  @ApiOperation({ summary: '健康检查' })
  async check() {
    const checks = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        database: 'unknown',
        redis: 'unknown',
      },
    };

    // 检查数据库
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      checks.services.database = 'ok';
    } catch {
      checks.services.database = 'error';
      checks.status = 'degraded';
    }

    // 检查Redis
    try {
      await this.redis.getClient().ping();
      checks.services.redis = 'ok';
    } catch {
      checks.services.redis = 'error';
      checks.status = 'degraded';
    }

    return checks;
  }
}
