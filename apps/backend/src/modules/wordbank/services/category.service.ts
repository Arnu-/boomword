import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/shared/prisma/prisma.service';
import { RedisService } from '@/shared/redis/redis.service';
import { CacheKeys, CacheTTL } from '@/common/constants';

@Injectable()
export class CategoryService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async findAll() {
    // 尝试从缓存获取
    const cached = await this.redis.getJson(CacheKeys.CATEGORIES);
    if (cached) {
      return cached;
    }

    // 从数据库获取
    const categories = await this.prisma.category.findMany({
      where: {
        isActive: true,
        parentId: null,
      },
      include: {
        children: {
          where: { isActive: true },
          orderBy: { sort: 'asc' },
        },
      },
      orderBy: { sort: 'asc' },
    });

    const result = categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      code: cat.code,
      icon: cat.icon,
      children: cat.children.map((child) => ({
        id: child.id,
        name: child.name,
        code: child.code,
      })),
    }));

    // 缓存结果
    await this.redis.setJson(CacheKeys.CATEGORIES, result, CacheTTL.CATEGORIES);

    return result;
  }
}
