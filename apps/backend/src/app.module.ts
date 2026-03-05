import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';

// 配置
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import redisConfig from './config/redis.config';
import jwtConfig from './config/jwt.config';

// 共享模块
import { PrismaModule } from './shared/prisma/prisma.module';
import { RedisModule } from './shared/redis/redis.module';

// 业务模块
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { WordBankModule } from './modules/wordbank/wordbank.module';
import { LevelModule } from './modules/level/level.module';
import { GameModule } from './modules/game/game.module';
import { LearningModule } from './modules/learning/learning.module';
import { RankingModule } from './modules/ranking/ranking.module';
import { AchievementModule } from './modules/achievement/achievement.module';
import { AdminModule } from './modules/admin/admin.module';

// 健康检查
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    // 配置模块
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, redisConfig, jwtConfig],
      envFilePath: ['.env.local', '.env'],
    }),

    // 限流模块
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 10,
      },
      {
        name: 'medium',
        ttl: 60000,
        limit: 100,
      },
      {
        name: 'long',
        ttl: 3600000,
        limit: 1000,
      },
    ]),

    // 共享模块
    PrismaModule,
    RedisModule,

    // 业务模块
    HealthModule,
    AuthModule,
    UserModule,
    WordBankModule,
    LevelModule,
    GameModule,
    LearningModule,
    RankingModule,
    AchievementModule,
    AdminModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
