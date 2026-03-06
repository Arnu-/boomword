import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { RedisService } from '../../shared/redis/redis.service';
import {
  StartGameDto,
  SubmitAnswerDto,
  EndGameDto,
  PauseGameDto,
  ResumeGameDto,
  GameMode,
} from './dto';

// 游戏配置常量
const GAME_CONFIG = {
  // 各模式时间限制（秒/单词）
  TIME_LIMIT: {
    [GameMode.PRACTICE]: 0, // 无限制
    [GameMode.CHALLENGE]: 10, // 每词10秒
    [GameMode.SPEED]: 5, // 每词5秒
  },
  // 基础分值（按难度等级）
  BASE_SCORE: {
    1: 10,
    2: 20,
    3: 30,
    4: 40,
    5: 50,
  },
  // 连击加成上限
  MAX_COMBO_BONUS: 2.0,
  // 连击加成系数
  COMBO_BONUS_RATE: 0.1,
  // 时间加成系数
  TIME_BONUS_RATE: 0.5,
  // 经验值奖励
  EXP_REWARD: {
    COMPLETE_SECTION: 10, // 完成小节
    THREE_STAR: 20, // 三星通关额外奖励
    CHALLENGE_COMPLETE: 30, // 挑战模式完成
    SPEED_COMPLETE: 50, // 速度挑战完成
    PERFECT_ACCURACY: 15, // 100%正确率
  },
  // 评星标准
  STAR_THRESHOLD: {
    [GameMode.PRACTICE]: { one: 0.6, two: 0.8, three: 1.0 },
    [GameMode.CHALLENGE]: { one: 0.6, two: 0.8, three: 1.0 },
    [GameMode.SPEED]: { one: 0.5, two: 0.7, three: 0.9 },
  },
  // 游戏会话过期时间（秒）
  SESSION_TTL: 1800, // 30分钟
  // 暂停最大时长（秒）
  MAX_PAUSE_DURATION: 300, // 5分钟
};

// 游戏会话接口
interface GameSession {
  gameRecordId: string;
  userId: string;
  sectionId: string;
  mode: GameMode;
  words: Array<{
    id: string;
    english: string;
    chinese: string;
    phonetic?: string;
    difficulty: number;
  }>;
  currentIndex: number;
  correctCount: number;
  wrongCount: number;
  totalScore: number;
  maxCombo: number;
  currentCombo: number;
  startTime: number;
  pausedTime: number; // 累计暂停时长（毫秒）
  isPaused: boolean;
  pauseStartTime?: number; // 暂停开始时间
  timeLimit: number; // 总时间限制（秒），0表示无限制
  answeredWords: string[]; // 已回答的单词ID列表
}

// 答题结果接口
interface AnswerResult {
  wordId: string;
  isCorrect: boolean;
  userAnswer: string;
  correctAnswer: string;
  score: number;
  timeSpent: number;
}

@Injectable()
export class GameService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  /**
   * 开始游戏
   */
  async startGame(userId: string, dto: StartGameDto) {
    // 检查是否有进行中的游戏，如果有则自动清理
    const existingSession = await this.getActiveGameSession(userId);
    if (existingSession) {
      // 自动结束旧游戏并清理会话
      await this.forceEndGame(existingSession);
    }

    // 获取小节信息和单词列表
    const section = await this.prisma.section.findUnique({
      where: { id: dto.sectionId },
      include: {
        chapter: {
          include: {
            wordBank: true,
          },
        },
        sectionWords: {
          include: {
            word: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    if (!section) {
      throw new NotFoundException('小节不存在');
    }

    if (!section.isActive) {
      throw new BadRequestException('该小节暂不可用');
    }

    if (section.sectionWords.length === 0) {
      throw new BadRequestException('该小节没有单词');
    }

    // 获取用户小节进度
    let userSection = await this.prisma.userSection.findUnique({
      where: {
        userId_sectionId: {
          userId,
          sectionId: dto.sectionId,
        },
      },
    });

    // 检查是否是第一个小节（第一章第一关默认解锁）
    const isFirstSection = section.order === 1 && section.chapter.order === 1;
    
    // 如果是第一个小节，确保解锁
    if (isFirstSection && (!userSection || !userSection.unlocked)) {
      userSection = await this.prisma.userSection.upsert({
        where: {
          userId_sectionId: {
            userId,
            sectionId: dto.sectionId,
          },
        },
        create: {
          userId,
          sectionId: dto.sectionId,
          unlocked: true,
        },
        update: {
          unlocked: true,
        },
      });
    }

    // 检查解锁状态
    if (!userSection || !userSection.unlocked) {
      throw new ForbiddenException('该小节尚未解锁');
    }

    // 检查游戏模式解锁条件
    await this.validateModeUnlock(dto.mode, userSection);

    // 准备单词列表
    let words = section.sectionWords.map((sw) => ({
      id: sw.word.id,
      english: sw.word.english,
      chinese: sw.word.chinese,
      phonetic: sw.word.phonetic,
      difficulty: sw.word.difficulty,
    }));

    // 如果需要随机打乱顺序
    if (dto.shuffle) {
      words = this.shuffleArray(words);
    }

    // 计算时间限制
    const timePerWord = GAME_CONFIG.TIME_LIMIT[dto.mode];
    const timeLimit = timePerWord > 0 ? timePerWord * words.length : 0;

    // 创建游戏记录
    const gameRecord = await this.prisma.gameRecord.create({
      data: {
        userId,
        sectionId: dto.sectionId,
        mode: dto.mode,
        totalCount: words.length,
        correctCount: 0,
        wrongCount: 0,
        score: 0,
        stars: 0,
        timeUsed: 0,
        maxCombo: 0,
        accuracy: 0,
      },
    });

    // 创建游戏会话缓存
    const gameSession: GameSession = {
      gameRecordId: gameRecord.id,
      userId,
      sectionId: dto.sectionId,
      mode: dto.mode,
      words,
      currentIndex: 0,
      correctCount: 0,
      wrongCount: 0,
      totalScore: 0,
      maxCombo: 0,
      currentCombo: 0,
      startTime: Date.now(),
      pausedTime: 0,
      isPaused: false,
      timeLimit,
      answeredWords: [],
    };

    // 保存会话到 Redis
    await this.saveGameSession(gameSession);

    // 记录用户当前活跃游戏
    await this.redis.set(`game:active:${userId}`, gameRecord.id, GAME_CONFIG.SESSION_TTL);

    // 返回游戏开始信息
    return {
      gameRecordId: gameRecord.id,
      mode: dto.mode,
      totalWords: words.length,
      timeLimit,
      sectionInfo: {
        id: section.id,
        name: section.name,
        chapterName: section.chapter.name,
        wordBankName: section.chapter.wordBank.name,
      },
      words: words.map((w) => this.formatWordByMode(w, dto.mode)),
    };
  }

  /**
   * 提交答案
   */
  async submitAnswer(userId: string, dto: SubmitAnswerDto) {
    // 获取游戏会话
    const session = await this.getGameSession(dto.gameRecordId);
    if (!session) {
      throw new BadRequestException('游戏会话已过期或不存在');
    }

    // 验证用户
    if (session.userId !== userId) {
      throw new ForbiddenException('无权操作此游戏');
    }

    // 检查游戏是否暂停
    if (session.isPaused) {
      throw new BadRequestException('游戏已暂停，请先恢复游戏');
    }

    // 检查是否超时（有时间限制的模式）
    if (session.timeLimit > 0) {
      const elapsed = this.getElapsedTime(session);
      if (elapsed >= session.timeLimit * 1000) {
        // 自动结束游戏
        return this.endGame(userId, { gameRecordId: dto.gameRecordId });
      }
    }

    // 查找要回答的单词
    const wordIndex = session.words.findIndex((w) => w.id === dto.wordId);
    if (wordIndex === -1) {
      throw new BadRequestException('单词不在当前游戏中');
    }

    // 检查是否已回答过
    if (session.answeredWords.includes(dto.wordId)) {
      throw new BadRequestException('该单词已回答过');
    }

    const currentWord = session.words[wordIndex];

    // 判断答案是否正确（忽略大小写和首尾空格）
    const isCorrect =
      dto.answer.toLowerCase().trim() === currentWord.english.toLowerCase().trim();

    // 计算本次得分
    let wordScore = 0;
    if (isCorrect) {
      wordScore = this.calculateScore(currentWord.difficulty, dto.timeSpent, session.currentCombo);
      session.currentCombo++;
      session.correctCount++;
      session.maxCombo = Math.max(session.maxCombo, session.currentCombo);
    } else {
      session.wrongCount++;
      session.currentCombo = 0;

      // 记录错题
      await this.recordWrongWord(userId, dto.wordId);
    }

    session.totalScore += wordScore;
    session.answeredWords.push(dto.wordId);
    session.currentIndex = session.answeredWords.length;

    // 更新用户单词学习记录
    await this.updateUserWordProgress(userId, dto.wordId, isCorrect);

    // 保存更新后的会话
    await this.saveGameSession(session);

    // 计算剩余时间
    let remainingTime: number | null = null;
    if (session.timeLimit > 0) {
      const elapsed = this.getElapsedTime(session);
      remainingTime = Math.max(0, session.timeLimit * 1000 - elapsed);
    }

    // 检查是否所有单词都已回答
    const isCompleted = session.answeredWords.length >= session.words.length;

    return {
      isCorrect,
      correctAnswer: currentWord.english,
      wordScore,
      totalScore: session.totalScore,
      correctCount: session.correctCount,
      wrongCount: session.wrongCount,
      combo: session.currentCombo,
      maxCombo: session.maxCombo,
      remainingTime,
      progress: {
        current: session.answeredWords.length,
        total: session.words.length,
      },
      isCompleted,
    };
  }

  /**
   * 上报错误输入（不消耗单词机会，仅记录错误次数和错题本）
   */
  async reportWrong(userId: string, dto: { gameRecordId: string; wordId: string }) {
    // 获取游戏会话
    const session = await this.getGameSession(dto.gameRecordId);
    if (!session) {
      throw new BadRequestException('游戏会话已过期或不存在');
    }

    if (session.userId !== userId) {
      throw new ForbiddenException('无权操作此游戏');
    }

    if (session.isPaused) {
      throw new BadRequestException('游戏已暂停');
    }

    // 检查单词是否在当前游戏中
    const wordExists = session.words.some((w) => w.id === dto.wordId);
    if (!wordExists) {
      throw new BadRequestException('单词不在当前游戏中');
    }

    // 增加错误计数（不标记为已回答，不消耗单词）
    session.wrongCount++;
    session.currentCombo = 0;

    // 保存会话
    await this.saveGameSession(session);

    // 记录到错题本
    await this.recordWrongWord(userId, dto.wordId);

    // 更新用户单词学习进度（标记为答错）
    await this.updateUserWordProgress(userId, dto.wordId, false);

    return {
      success: true,
      wrongCount: session.wrongCount,
      combo: session.currentCombo,
    };
  }

  /**
   * 暂停游戏
   */
  async pauseGame(userId: string, dto: PauseGameDto) {
    const session = await this.getGameSession(dto.gameRecordId);
    if (!session) {
      throw new BadRequestException('游戏会话已过期或不存在');
    }

    if (session.userId !== userId) {
      throw new ForbiddenException('无权操作此游戏');
    }

    if (session.isPaused) {
      throw new BadRequestException('游戏已经处于暂停状态');
    }

    // 速度挑战模式不允许暂停
    if (session.mode === GameMode.SPEED) {
      throw new BadRequestException('速度挑战模式不允许暂停');
    }

    session.isPaused = true;
    session.pauseStartTime = Date.now();

    await this.saveGameSession(session);

    return {
      success: true,
      message: '游戏已暂停',
      maxPauseDuration: GAME_CONFIG.MAX_PAUSE_DURATION,
    };
  }

  /**
   * 恢复游戏
   */
  async resumeGame(userId: string, dto: ResumeGameDto) {
    const session = await this.getGameSession(dto.gameRecordId);
    if (!session) {
      throw new BadRequestException('游戏会话已过期或不存在');
    }

    if (session.userId !== userId) {
      throw new ForbiddenException('无权操作此游戏');
    }

    if (!session.isPaused) {
      throw new BadRequestException('游戏未处于暂停状态');
    }

    // 计算暂停时长
    const pauseDuration = Date.now() - (session.pauseStartTime || Date.now());

    // 检查是否超过最大暂停时长
    if (pauseDuration > GAME_CONFIG.MAX_PAUSE_DURATION * 1000) {
      // 暂停时间过长，强制结束游戏
      await this.forceEndGame(session);
      throw new BadRequestException('暂停时间过长，游戏已自动结束');
    }

    session.pausedTime += pauseDuration;
    session.isPaused = false;
    session.pauseStartTime = undefined;

    await this.saveGameSession(session);

    // 计算剩余时间
    let remainingTime: number | null = null;
    if (session.timeLimit > 0) {
      const elapsed = this.getElapsedTime(session);
      remainingTime = Math.max(0, session.timeLimit * 1000 - elapsed);
    }

    return {
      success: true,
      message: '游戏已恢复',
      remainingTime,
      progress: {
        current: session.answeredWords.length,
        total: session.words.length,
      },
    };
  }

  /**
   * 结束游戏
   */
  async endGame(userId: string, dto: EndGameDto) {
    // 获取游戏会话
    const session = await this.getGameSession(dto.gameRecordId);
    if (!session) {
      throw new BadRequestException('游戏会话已过期或不存在');
    }

    if (session.userId !== userId) {
      throw new ForbiddenException('无权操作此游戏');
    }

    // 如果游戏暂停中，先计算暂停时长
    if (session.isPaused && session.pauseStartTime) {
      session.pausedTime += Date.now() - session.pauseStartTime;
    }

    // 计算实际游戏时间（不包括暂停时间）
    const timeUsed = Math.floor((Date.now() - session.startTime - session.pausedTime) / 1000);

    // 计算正确率和星级
    const accuracy =
      session.words.length > 0 ? session.correctCount / session.words.length : 0;
    const stars = this.calculateStars(session.mode, accuracy, timeUsed, session.timeLimit);

    // 更新游戏记录
    const gameRecord = await this.prisma.gameRecord.update({
      where: { id: dto.gameRecordId },
      data: {
        correctCount: session.correctCount,
        wrongCount: session.wrongCount,
        score: session.totalScore,
        stars,
        timeUsed,
        maxCombo: session.maxCombo,
        accuracy: Math.round(accuracy * 100),
      },
    });

    // 获取用户小节进度，用于判断是否是新纪录
    const existingUserSection = await this.prisma.userSection.findUnique({
      where: {
        userId_sectionId: {
          userId,
          sectionId: session.sectionId,
        },
      },
    });

    // 确定要更新的字段
    const modePrefix = this.getModePrefix(session.mode);
    const currentBestScore = (existingUserSection?.[`${modePrefix}BestScore`] as number) || 0;
    const currentStars = (existingUserSection?.[`${modePrefix}Stars`] as number) || 0;

    const updateData: Record<string, unknown> = {
      playCount: { increment: 1 },
    };

    if (stars >= 1) {
      updateData[`${modePrefix}Completed`] = true;
    }

    if (session.totalScore > currentBestScore) {
      updateData[`${modePrefix}BestScore`] = session.totalScore;
    }
    if (stars > currentStars) {
      updateData[`${modePrefix}Stars`] = stars;
    }

    // 更新用户小节进度
    await this.prisma.userSection.update({
      where: {
        userId_sectionId: {
          userId,
          sectionId: session.sectionId,
        },
      },
      data: updateData,
    });

    // 只有挑战模式（challenge/speed）获得至少1星才解锁下一个小节
    if (stars >= 1 && session.mode !== GameMode.PRACTICE) {
      await this.unlockNextSection(userId, session.sectionId);
    }

    // 计算并发放经验值
    const expEarned = await this.calculateAndGrantExp(
      userId,
      session.mode,
      stars,
      accuracy,
      existingUserSection?.[`${modePrefix}Completed`] as boolean,
    );

    // 只有挑战模式才计入排行榜
    if (session.mode !== GameMode.PRACTICE) {
      await this.updateRankingScore(userId, session.totalScore);
    }

    // 更新用户词库进度
    await this.updateUserWordBankProgress(userId, session.sectionId);

    // 清除游戏会话缓存
    await this.clearGameSession(userId, dto.gameRecordId);

    return {
      gameRecordId: gameRecord.id,
      totalScore: session.totalScore,
      correctCount: session.correctCount,
      wrongCount: session.wrongCount,
      totalCount: session.words.length,
      accuracy: Math.round(accuracy * 100),
      stars,
      timeUsed,
      maxCombo: session.maxCombo,
      isNewBest: session.totalScore > currentBestScore,
      isNewStarRecord: stars > currentStars,
      expEarned,
    };
  }

  /**
   * 获取当前游戏状态
   */
  async getGameStatus(userId: string, gameRecordId: string) {
    const session = await this.getGameSession(gameRecordId);
    if (!session) {
      return { active: false, message: '游戏会话不存在或已过期' };
    }

    if (session.userId !== userId) {
      throw new ForbiddenException('无权查看此游戏');
    }

    // 计算剩余时间
    let remainingTime: number | null = null;
    if (session.timeLimit > 0 && !session.isPaused) {
      const elapsed = this.getElapsedTime(session);
      remainingTime = Math.max(0, session.timeLimit * 1000 - elapsed);
    }

    // 获取未回答的单词
    const unansweredWords = session.words
      .filter((w) => !session.answeredWords.includes(w.id))
      .map((w) => this.formatWordByMode(w, session.mode));

    return {
      active: true,
      gameRecordId: session.gameRecordId,
      mode: session.mode,
      isPaused: session.isPaused,
      progress: {
        current: session.answeredWords.length,
        total: session.words.length,
      },
      stats: {
        correctCount: session.correctCount,
        wrongCount: session.wrongCount,
        totalScore: session.totalScore,
        currentCombo: session.currentCombo,
        maxCombo: session.maxCombo,
      },
      remainingTime,
      unansweredWords,
    };
  }

  /**
   * 获取游戏记录详情
   */
  async getGameRecord(userId: string, recordId: string) {
    const record = await this.prisma.gameRecord.findFirst({
      where: {
        id: recordId,
        userId,
      },
      include: {
        section: {
          include: {
            chapter: {
              include: {
                wordBank: true,
              },
            },
          },
        },
      },
    });

    if (!record) {
      throw new NotFoundException('游戏记录不存在');
    }

    // 仅挑战模式才查询下一小节（训练模式不解锁，不显示下一节入口）
    let nextSection = null;
    if (record.mode === GameMode.CHALLENGE) {
      nextSection = await this.prisma.section.findFirst({
        where: {
          chapterId: record.section.chapterId,
          order: { gt: record.section.order },
          isActive: true,
        },
        orderBy: { order: 'asc' },
        select: { id: true, name: true, wordCount: true },
      });
    }

    return {
      ...record,
      nextSection: nextSection ?? null,
    };
  }

  /**
   * 获取游戏历史记录
   */
  async getGameHistory(
    userId: string,
    options: { limit?: number; offset?: number; mode?: GameMode; sectionId?: string } = {},
  ) {
    const { limit = 20, offset = 0, mode, sectionId } = options;

    const where: Record<string, unknown> = { userId };
    if (mode) {
      where.mode = mode;
    }
    if (sectionId) {
      where.sectionId = sectionId;
    }

    const [records, total] = await Promise.all([
      this.prisma.gameRecord.findMany({
        where,
        include: {
          section: {
            include: {
              chapter: {
                include: {
                  wordBank: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
        skip: offset,
      }),
      this.prisma.gameRecord.count({ where }),
    ]);

    return {
      records,
      total,
      limit,
      offset,
    };
  }

  /**
   * 获取用户游戏统计
   */
  async getUserGameStats(userId: string) {
    const stats = await this.prisma.gameRecord.aggregate({
      where: { userId },
      _count: true,
      _sum: {
        score: true,
        correctCount: true,
        wrongCount: true,
        timeUsed: true,
      },
      _max: {
        score: true,
        maxCombo: true,
      },
      _avg: {
        accuracy: true,
      },
    });

    // 按模式统计
    const modeStats = await this.prisma.gameRecord.groupBy({
      by: ['mode'],
      where: { userId },
      _count: true,
      _sum: {
        score: true,
      },
      _max: {
        score: true,
        stars: true,
      },
    });

    return {
      totalGames: stats._count,
      totalScore: stats._sum.score || 0,
      totalCorrect: stats._sum.correctCount || 0,
      totalWrong: stats._sum.wrongCount || 0,
      totalTimeUsed: stats._sum.timeUsed || 0,
      highestScore: stats._max.score || 0,
      highestCombo: stats._max.maxCombo || 0,
      averageAccuracy: Math.round(stats._avg.accuracy || 0),
      byMode: modeStats.reduce(
        (acc, item) => {
          acc[item.mode] = {
            count: item._count,
            totalScore: item._sum.score || 0,
            highestScore: item._max.score || 0,
            highestStars: item._max.stars || 0,
          };
          return acc;
        },
        {} as Record<string, unknown>,
      ),
    };
  }

  /**
   * 获取用户下一关信息（最后一次通过的关的下一关，不区分模式）
   */
  async getNextSection(userId: string, mode: GameMode) {
    // 查找用户最近一次通过的游戏记录（stars >= 1，不区分模式）
    const lastPassedRecord = await this.prisma.gameRecord.findFirst({
      where: {
        userId,
        stars: { gte: 1 },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        section: {
          include: {
            chapter: {
              include: {
                wordBank: true,
              },
            },
          },
        },
      },
    });

    // 如果没有通过记录，返回第一个可用关卡
    if (!lastPassedRecord) {
      const firstSection = await this.prisma.section.findFirst({
        where: { isActive: true },
        orderBy: [
          { chapter: { wordBank: { sort: 'asc' } } },
          { chapter: { order: 'asc' } },
          { order: 'asc' },
        ],
        include: {
          chapter: {
            include: { wordBank: true },
          },
        },
      });

      if (!firstSection) {
        return null;
      }

      return {
        sectionId: firstSection.id,
        sectionName: firstSection.name,
        chapterName: firstSection.chapter.name,
        wordBankName: firstSection.chapter.wordBank.name,
        wordCount: firstSection.wordCount,
        isFirst: true,
      };
    }

    const currentSection = lastPassedRecord.section;

    // 查找同章节下一个小节
    let nextSection = await this.prisma.section.findFirst({
      where: {
        chapterId: currentSection.chapterId,
        order: { gt: currentSection.order },
        isActive: true,
      },
      orderBy: { order: 'asc' },
      include: {
        chapter: {
          include: { wordBank: true },
        },
      },
    });

    // 如果当前章节没有下一个小节，查找下一章节的第一个小节
    if (!nextSection) {
      const nextChapter = await this.prisma.chapter.findFirst({
        where: {
          wordBankId: currentSection.chapter.wordBankId,
          order: { gt: currentSection.chapter.order },
          isActive: true,
        },
        orderBy: { order: 'asc' },
        include: {
          wordBank: true,
          sections: {
            where: { isActive: true },
            orderBy: { order: 'asc' },
            take: 1,
          },
        },
      });

      if (nextChapter && nextChapter.sections.length > 0) {
        const sec = nextChapter.sections[0];
        nextSection = {
          ...sec,
          chapter: {
            ...nextChapter,
            sections: nextChapter.sections,
          },
        } as any;
      }
    }

    // 如果没有下一关，说明已通关所有关卡，返回当前最后一关
    if (!nextSection) {
      return {
        sectionId: currentSection.id,
        sectionName: currentSection.name,
        chapterName: currentSection.chapter.name,
        wordBankName: currentSection.chapter.wordBank.name,
        wordCount: currentSection.wordCount,
        isLast: true,
      };
    }

    return {
      sectionId: nextSection.id,
      sectionName: nextSection.name,
      chapterName: nextSection.chapter.name,
      wordBankName: nextSection.chapter.wordBank.name,
      wordCount: nextSection.wordCount,
      isFirst: false,
      isLast: false,
    };
  }

  // ==================== 私有方法 ====================

  /**
   * 获取游戏会话
   */
  private async getGameSession(gameRecordId: string): Promise<GameSession | null> {
    const sessionData = await this.redis.get(`game:session:${gameRecordId}`);
    return sessionData ? JSON.parse(sessionData) : null;
  }

  /**
   * 保存游戏会话
   */
  private async saveGameSession(session: GameSession): Promise<void> {
    await this.redis.set(
      `game:session:${session.gameRecordId}`,
      JSON.stringify(session),
      GAME_CONFIG.SESSION_TTL,
    );
  }

  /**
   * 清除游戏会话
   */
  private async clearGameSession(userId: string, gameRecordId: string): Promise<void> {
    await Promise.all([
      this.redis.del(`game:session:${gameRecordId}`),
      this.redis.del(`game:active:${userId}`),
    ]);
  }

  /**
   * 获取用户当前活跃的游戏会话
   */
  private async getActiveGameSession(userId: string): Promise<GameSession | null> {
    const activeGameId = await this.redis.get(`game:active:${userId}`);
    if (!activeGameId) {
      return null;
    }
    return this.getGameSession(activeGameId);
  }

  /**
   * 验证游戏模式解锁条件
   */
  private async validateModeUnlock(
    mode: GameMode,
    userSection: { practiceStars: number; challengeStars: number } | null,
  ): Promise<void> {
    if (!userSection) {
      if (mode !== GameMode.PRACTICE) {
        throw new ForbiddenException('请先完成练习模式');
      }
      return;
    }

    switch (mode) {
      case GameMode.CHALLENGE:
        if (userSection.practiceStars < 1) {
          throw new ForbiddenException('请先在练习模式获得至少1星');
        }
        break;
      case GameMode.SPEED:
        if (userSection.challengeStars < 2) {
          throw new ForbiddenException('请先在挑战模式获得至少2星');
        }
        break;
    }
  }

  /**
   * 计算得分
   */
  private calculateScore(difficulty: number, timeSpent: number, currentCombo: number): number {
    // 基础分
    const baseScore = GAME_CONFIG.BASE_SCORE[difficulty as keyof typeof GAME_CONFIG.BASE_SCORE] || 10;

    // 时间加成（答题越快加成越高，最高50%）
    const timeSeconds = timeSpent / 1000;
    const timeBonus = Math.max(0, (10 - timeSeconds) / 10) * GAME_CONFIG.TIME_BONUS_RATE;

    // 连击加成（最高100%）
    const comboBonus = Math.min(
      GAME_CONFIG.MAX_COMBO_BONUS - 1,
      currentCombo * GAME_CONFIG.COMBO_BONUS_RATE,
    );

    // 总分 = 基础分 * (1 + 时间加成 + 连击加成)
    const totalMultiplier = 1 + timeBonus + comboBonus;
    return Math.round(baseScore * totalMultiplier);
  }

  /**
   * 计算星级
   */
  private calculateStars(
    mode: GameMode,
    accuracy: number,
    timeUsed: number,
    timeLimit: number,
  ): number {
    const threshold = GAME_CONFIG.STAR_THRESHOLD[mode];

    // 基于正确率的基础星级
    let stars = 0;
    if (accuracy >= threshold.three) {
      stars = 3;
    } else if (accuracy >= threshold.two) {
      stars = 2;
    } else if (accuracy >= threshold.one) {
      stars = 1;
    }

    // 挑战模式和速度模式，如果超时则降低星级
    if (timeLimit > 0 && timeUsed > timeLimit) {
      stars = Math.max(0, stars - 1);
    }

    // 三星条件：挑战/速度模式需要在时间限制内完成
    if (stars === 3 && timeLimit > 0) {
      // 剩余时间百分比需要大于一定值
      const remainingPercent = (timeLimit - timeUsed) / timeLimit;
      if (mode === GameMode.CHALLENGE && remainingPercent < 0.3) {
        stars = 2;
      }
      if (mode === GameMode.SPEED && remainingPercent < 0.2) {
        stars = 2;
      }
    }

    return stars;
  }

  /**
   * 计算并发放经验值
   */
  private async calculateAndGrantExp(
    userId: string,
    mode: GameMode,
    stars: number,
    accuracy: number,
    wasAlreadyCompleted: boolean,
  ): Promise<number> {
    let expEarned = 0;

    // 首次完成小节奖励
    if (!wasAlreadyCompleted && stars >= 1) {
      expEarned += GAME_CONFIG.EXP_REWARD.COMPLETE_SECTION;
    }

    // 三星通关奖励
    if (stars === 3) {
      expEarned += GAME_CONFIG.EXP_REWARD.THREE_STAR;
    }

    // 模式特殊奖励
    if (mode === GameMode.CHALLENGE && stars >= 1) {
      expEarned += GAME_CONFIG.EXP_REWARD.CHALLENGE_COMPLETE;
    }
    if (mode === GameMode.SPEED && stars >= 1) {
      expEarned += GAME_CONFIG.EXP_REWARD.SPEED_COMPLETE;
    }

    // 完美正确率奖励
    if (accuracy === 1) {
      expEarned += GAME_CONFIG.EXP_REWARD.PERFECT_ACCURACY;
    }

    // 更新用户经验值
    if (expEarned > 0) {
      await this.updateUserExp(userId, expEarned);
    }

    return expEarned;
  }

  /**
   * 更新用户经验值
   */
  private async updateUserExp(userId: string, exp: number): Promise<void> {
    const userLevel = await this.prisma.userLevel.findUnique({
      where: { userId },
    });

    if (!userLevel) {
      // 创建用户等级记录
      await this.prisma.userLevel.create({
        data: {
          userId,
          level: 1,
          currentExp: exp,
          totalExp: exp,
          title: '初学者',
        },
      });
      return;
    }

    const newTotalExp = userLevel.totalExp + exp;
    const newCurrentExp = userLevel.currentExp + exp;

    // 计算新等级和升级后剩余经验
    const { level, remainingExp, title } = this.calculateLevel(newTotalExp);

    await this.prisma.userLevel.update({
      where: { userId },
      data: {
        level,
        currentExp: remainingExp,
        totalExp: newTotalExp,
        title,
      },
    });
  }

  /**
   * 根据总经验值计算等级
   */
  private calculateLevel(totalExp: number): { level: number; remainingExp: number; title: string } {
    const levelThresholds = [
      { level: 1, exp: 0, title: '初学者' },
      { level: 10, exp: 500, title: '初学者' },
      { level: 20, exp: 2000, title: '入门学徒' },
      { level: 30, exp: 5000, title: '词汇达人' },
      { level: 40, exp: 10000, title: '单词高手' },
      { level: 50, exp: 20000, title: '英语大师' },
      { level: 100, exp: 100000, title: '词汇王者' },
    ];

    let currentLevel = 1;
    let currentTitle = '初学者';
    let expForCurrentLevel = 0;

    for (let i = levelThresholds.length - 1; i >= 0; i--) {
      if (totalExp >= levelThresholds[i].exp) {
        currentLevel = levelThresholds[i].level;
        currentTitle = levelThresholds[i].title;
        expForCurrentLevel = levelThresholds[i].exp;
        break;
      }
    }

    // 计算当前等级段内的细分等级
    const nextThreshold = levelThresholds.find((t) => t.exp > totalExp);
    if (nextThreshold) {
      const expInRange = totalExp - expForCurrentLevel;
      const rangeSize = nextThreshold.exp - expForCurrentLevel;
      const levelRange = nextThreshold.level - currentLevel;
      const additionalLevels = Math.floor((expInRange / rangeSize) * levelRange);
      currentLevel = Math.min(currentLevel + additionalLevels, nextThreshold.level - 1);
    }

    return {
      level: currentLevel,
      remainingExp: totalExp - expForCurrentLevel,
      title: currentTitle,
    };
  }

  /**
   * 记录错误单词
   */
  private async recordWrongWord(userId: string, wordId: string): Promise<void> {
    await this.prisma.wrongBook.upsert({
      where: {
        userId_wordId: {
          userId,
          wordId,
        },
      },
      create: {
        userId,
        wordId,
        wrongCount: 1,
      },
      update: {
        wrongCount: { increment: 1 },
        isRemoved: false,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * 更新用户单词学习进度
   */
  private async updateUserWordProgress(
    userId: string,
    wordId: string,
    isCorrect: boolean,
  ): Promise<void> {
    const existingUserWord = await this.prisma.userWord.findUnique({
      where: {
        userId_wordId: {
          userId,
          wordId,
        },
      },
    });

    if (existingUserWord) {
      // 计算新的掌握度
      let newMastery = existingUserWord.mastery;
      if (isCorrect) {
        const newCorrectCount = existingUserWord.correctCount + 1;
        if (newCorrectCount >= 5) {
          newMastery = 'mastered';
        } else if (newCorrectCount >= 1) {
          newMastery = 'learning';
        }
      }

      await this.prisma.userWord.update({
        where: {
          userId_wordId: {
            userId,
            wordId,
          },
        },
        data: {
          correctCount: isCorrect ? { increment: 1 } : undefined,
          wrongCount: !isCorrect ? { increment: 1 } : undefined,
          mastery: newMastery,
          lastPracticeAt: new Date(),
        },
      });
    } else {
      await this.prisma.userWord.create({
        data: {
          userId,
          wordId,
          correctCount: isCorrect ? 1 : 0,
          wrongCount: isCorrect ? 0 : 1,
          mastery: 'learning',
          lastPracticeAt: new Date(),
        },
      });
    }
  }

  /**
   * 解锁下一个小节
   */
  private async unlockNextSection(userId: string, currentSectionId: string): Promise<void> {
    const currentSection = await this.prisma.section.findUnique({
      where: { id: currentSectionId },
      include: {
        chapter: true,
      },
    });

    if (!currentSection) return;

    // 查找同章节下一个小节
    let nextSection = await this.prisma.section.findFirst({
      where: {
        chapterId: currentSection.chapterId,
        order: { gt: currentSection.order },
        isActive: true,
      },
      orderBy: { order: 'asc' },
    });

    // 如果当前章节没有下一个小节，查找下一章节的第一个小节
    if (!nextSection) {
      const nextChapter = await this.prisma.chapter.findFirst({
        where: {
          wordBankId: currentSection.chapter.wordBankId,
          order: { gt: currentSection.chapter.order },
          isActive: true,
        },
        orderBy: { order: 'asc' },
        include: {
          sections: {
            where: { isActive: true },
            orderBy: { order: 'asc' },
            take: 1,
          },
        },
      });

      if (nextChapter && nextChapter.sections.length > 0) {
        nextSection = nextChapter.sections[0];
      }
    }

    if (nextSection) {
      await this.prisma.userSection.upsert({
        where: {
          userId_sectionId: {
            userId,
            sectionId: nextSection.id,
          },
        },
        create: {
          userId,
          sectionId: nextSection.id,
          unlocked: true,
        },
        update: {
          unlocked: true,
        },
      });
    }
  }

  /**
   * 更新用户词库进度
   */
  private async updateUserWordBankProgress(userId: string, sectionId: string): Promise<void> {
    // 获取小节所属的词库
    const section = await this.prisma.section.findUnique({
      where: { id: sectionId },
      include: {
        chapter: {
          include: {
            wordBank: true,
          },
        },
      },
    });

    if (!section) return;

    const wordBankId = section.chapter.wordBankId;

    // 统计用户在该词库的学习进度
    const learnedCount = await this.prisma.userWord.count({
      where: {
        userId,
        word: {
          sectionWords: {
            some: {
              section: {
                chapter: {
                  wordBankId,
                },
              },
            },
          },
        },
      },
    });

    const masteredCount = await this.prisma.userWord.count({
      where: {
        userId,
        mastery: 'mastered',
        word: {
          sectionWords: {
            some: {
              section: {
                chapter: {
                  wordBankId,
                },
              },
            },
          },
        },
      },
    });

    const totalWords = section.chapter.wordBank.wordCount || 1;
    const progress = Math.min(100, Math.round((learnedCount / totalWords) * 100));

    await this.prisma.userWordBank.upsert({
      where: {
        userId_wordBankId: {
          userId,
          wordBankId,
        },
      },
      create: {
        userId,
        wordBankId,
        learnedCount,
        masteredCount,
        progress,
        lastStudyAt: new Date(),
      },
      update: {
        learnedCount,
        masteredCount,
        progress,
        lastStudyAt: new Date(),
      },
    });
  }

  /**
   * 更新排行榜分数
   */
  private async updateRankingScore(userId: string, score: number): Promise<void> {
    const now = new Date();
    const weekKey = `ranking:weekly:${this.getWeekNumber(now)}`;
    const monthKey = `ranking:monthly:${now.getFullYear()}:${now.getMonth() + 1}`;
    const totalKey = 'ranking:total';

    // 使用Redis ZINCRBY增加分数
    await Promise.all([
      this.redis.zincrby(weekKey, score, userId),
      this.redis.zincrby(monthKey, score, userId),
      this.redis.zincrby(totalKey, score, userId),
    ]);

    // 设置周榜过期时间（7天）
    const client = this.redis.getClient();
    await client.expire(weekKey, 7 * 24 * 60 * 60);
    // 设置月榜过期时间（35天）
    await client.expire(monthKey, 35 * 24 * 60 * 60);
  }

  /**
   * 强制结束游戏（暂停超时等情况）
   */
  private async forceEndGame(session: GameSession): Promise<void> {
    // 更新游戏记录为未完成状态
    await this.prisma.gameRecord.update({
      where: { id: session.gameRecordId },
      data: {
        correctCount: session.correctCount,
        wrongCount: session.wrongCount,
        score: session.totalScore,
        stars: 0,
        timeUsed: Math.floor((Date.now() - session.startTime) / 1000),
        maxCombo: session.maxCombo,
        accuracy: session.words.length > 0
          ? Math.round((session.correctCount / session.words.length) * 100)
          : 0,
      },
    });

    // 清除游戏会话
    await this.clearGameSession(session.userId, session.gameRecordId);
  }

  /**
   * 获取游戏已用时间（毫秒，不含暂停时间）
   */
  private getElapsedTime(session: GameSession): number {
    const now = Date.now();
    let elapsed = now - session.startTime - session.pausedTime;

    // 如果当前处于暂停状态，不计算暂停时间
    if (session.isPaused && session.pauseStartTime) {
      elapsed -= now - session.pauseStartTime;
    }

    return Math.max(0, elapsed);
  }

  /**
   * 根据游戏模式格式化单词
   */
  private formatWordByMode(
    word: { id: string; english: string; chinese: string; phonetic?: string; difficulty: number },
    mode: GameMode,
  ): Record<string, unknown> {
    const baseInfo = {
      id: word.id,
      chinese: word.chinese,
      difficulty: word.difficulty,
    };

    switch (mode) {
      case GameMode.PRACTICE:
        // 练习模式：显示英文和中文
        return {
          ...baseInfo,
          english: word.english,
          phonetic: word.phonetic,
        };
      case GameMode.CHALLENGE:
        // 挑战模式：只显示中文
        return baseInfo;
      case GameMode.SPEED:
        // 速度挑战：只显示英文
        return {
          id: word.id,
          english: word.english,
          difficulty: word.difficulty,
        };
      default:
        return baseInfo;
    }
  }

  /**
   * 获取模式字段前缀
   */
  private getModePrefix(mode: GameMode): string {
    switch (mode) {
      case GameMode.PRACTICE:
        return 'practice';
      case GameMode.CHALLENGE:
        return 'challenge';
      case GameMode.SPEED:
        return 'speed';
      default:
        return 'practice';
    }
  }

  /**
   * 获取周数
   */
  private getWeekNumber(date: Date): string {
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const days = Math.floor(
      (date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000),
    );
    const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
    return `${date.getFullYear()}:${weekNumber}`;
  }

  /**
   * 随机打乱数组
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}