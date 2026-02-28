import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/shared/prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async findById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        level: true,
      },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    return {
      id: user.id,
      nickname: user.nickname,
      avatar: user.avatarUrl,
      gender: user.gender,
      grade: user.grade,
      level: user.level?.level || 1,
      exp: user.level?.currentExp || 0,
      totalExp: user.level?.totalExp || 0,
      title: user.level?.title,
      consecutiveDays: user.level?.consecutiveDays || 0,
      createdAt: user.createdAt,
    };
  }

  async update(userId: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        nickname: dto.nickname,
        avatarUrl: dto.avatar,
        gender: dto.gender,
        grade: dto.grade,
      },
      include: {
        level: true,
      },
    });

    return {
      id: user.id,
      nickname: user.nickname,
      avatar: user.avatarUrl,
      gender: user.gender,
      grade: user.grade,
      level: user.level?.level || 1,
      exp: user.level?.currentExp || 0,
    };
  }

  async getStats(userId: string) {
    const [level, gameRecords, userWords] = await Promise.all([
      this.prisma.userLevel.findUnique({
        where: { userId },
      }),
      this.prisma.gameRecord.aggregate({
        where: { userId },
        _count: true,
        _sum: {
          score: true,
          correctCount: true,
          wrongCount: true,
        },
      }),
      this.prisma.userWord.groupBy({
        by: ['mastery'],
        where: { userId },
        _count: true,
      }),
    ]);

    const masteryMap = userWords.reduce(
      (acc, item) => {
        acc[item.mastery] = item._count;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      level: level?.level || 1,
      exp: level?.currentExp || 0,
      totalExp: level?.totalExp || 0,
      consecutiveDays: level?.consecutiveDays || 0,
      longestStreak: level?.longestStreak || 0,
      totalGames: gameRecords._count,
      totalScore: gameRecords._sum.score || 0,
      totalCorrect: gameRecords._sum.correctCount || 0,
      totalWrong: gameRecords._sum.wrongCount || 0,
      words: {
        notLearned: masteryMap['not_learned'] || 0,
        learning: masteryMap['learning'] || 0,
        mastered: masteryMap['mastered'] || 0,
        needReview: masteryMap['need_review'] || 0,
      },
    };
  }
}
