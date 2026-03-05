import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AchievementService } from './achievement.service';
import {
  AchievementType,
  AchievementRarity,
  AchievementDetailDto,
  AchievementStatsDto,
  AchievementCheckResultDto,
  AchievementTrigger,
} from './dto';

@ApiTags('成就')
@Controller('achievements')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AchievementController {
  constructor(private readonly achievementService: AchievementService) {}

  // ==================== 成就列表 ====================

  @Get()
  @ApiOperation({ summary: '获取所有成就列表', description: '获取所有成就及当前用户的解锁状态和进度' })
  @ApiQuery({ name: 'type', required: false, enum: AchievementType, description: '成就类型筛选' })
  @ApiQuery({ name: 'rarity', required: false, enum: AchievementRarity, description: '稀有度筛选' })
  @ApiQuery({ name: 'unlockedOnly', required: false, type: Boolean, description: '只显示已解锁' })
  @ApiQuery({ name: 'lockedOnly', required: false, type: Boolean, description: '只显示未解锁' })
  @ApiResponse({ status: 200, type: [AchievementDetailDto] })
  async getAllAchievements(
    @Request() req,
    @Query('type') type?: AchievementType,
    @Query('rarity') rarity?: AchievementRarity,
    @Query('unlockedOnly') unlockedOnly?: boolean,
    @Query('lockedOnly') lockedOnly?: boolean,
  ): Promise<AchievementDetailDto[]> {
    return this.achievementService.getAllAchievements(req.user.id, {
      type,
      rarity,
      unlockedOnly: unlockedOnly === true || unlockedOnly === 'true' as unknown as boolean,
      lockedOnly: lockedOnly === true || lockedOnly === 'true' as unknown as boolean,
    });
  }

  @Get('unlocked')
  @ApiOperation({ summary: '获取已解锁成就', description: '获取当前用户已解锁的所有成就' })
  async getUnlockedAchievements(@Request() req) {
    return this.achievementService.getUnlockedAchievements(req.user.id);
  }

  @Get('detail/:code')
  @ApiOperation({ summary: '获取成就详情', description: '获取指定成就的详细信息' })
  @ApiParam({ name: 'code', description: '成就代码' })
  @ApiResponse({ status: 200, type: AchievementDetailDto })
  async getAchievementDetail(
    @Request() req,
    @Param('code') code: string,
  ): Promise<AchievementDetailDto> {
    return this.achievementService.getAchievementDetail(req.user.id, code);
  }

  // ==================== 成就统计 ====================

  @Get('stats')
  @ApiOperation({ summary: '获取成就统计', description: '获取当前用户的成就统计数据' })
  @ApiResponse({ status: 200, type: AchievementStatsDto })
  async getAchievementStats(@Request() req): Promise<AchievementStatsDto> {
    return this.achievementService.getAchievementStats(req.user.id);
  }

  @Get('progress')
  @ApiOperation({ summary: '获取成就进度概览', description: '获取成就完成进度概览' })
  async getAchievementProgress(@Request() req) {
    const stats = await this.achievementService.getAchievementStats(req.user.id);
    return {
      totalAchievements: stats.totalAchievements,
      unlockedCount: stats.unlockedCount,
      completionRate: stats.completionRate,
      totalExpEarned: stats.totalExpEarned,
    };
  }

  // ==================== 成就排行榜 ====================

  @Get('ranking')
  @ApiOperation({ summary: '获取成就排行榜', description: '按成就数量排行' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: '页码', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: '每页数量', example: 50 })
  async getAchievementRanking(
    @Request() req,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ) {
    return this.achievementService.getAchievementRanking(req.user.id, page, limit);
  }

  // ==================== 成就检查 ====================

  @Post('check')
  @ApiOperation({ summary: '检查成就', description: '手动触发成就检查，检查是否有新成就可以解锁' })
  @ApiResponse({ status: 200, type: AchievementCheckResultDto })
  async checkAchievements(@Request() req): Promise<AchievementCheckResultDto> {
    return this.achievementService.checkAllAchievements(req.user.id);
  }

  // ==================== 分类查询 ====================

  @Get('by-type/:type')
  @ApiOperation({ summary: '按类型获取成就', description: '获取指定类型的所有成就' })
  @ApiParam({ name: 'type', enum: AchievementType, description: '成就类型' })
  async getAchievementsByType(
    @Request() req,
    @Param('type') type: AchievementType,
  ): Promise<AchievementDetailDto[]> {
    return this.achievementService.getAllAchievements(req.user.id, { type });
  }

  @Get('by-rarity/:rarity')
  @ApiOperation({ summary: '按稀有度获取成就', description: '获取指定稀有度的所有成就' })
  @ApiParam({ name: 'rarity', enum: AchievementRarity, description: '稀有度' })
  async getAchievementsByRarity(
    @Request() req,
    @Param('rarity') rarity: AchievementRarity,
  ): Promise<AchievementDetailDto[]> {
    return this.achievementService.getAllAchievements(req.user.id, { rarity });
  }

  // ==================== 近期解锁 ====================

  @Get('recent')
  @ApiOperation({ summary: '获取最近解锁的成就', description: '获取最近解锁的成就列表' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: '数量限制', example: 5 })
  async getRecentAchievements(
    @Request() req,
    @Query('limit', new DefaultValuePipe(5), ParseIntPipe) limit: number,
  ) {
    const unlocked = await this.achievementService.getUnlockedAchievements(req.user.id);
    return unlocked.slice(0, Math.min(limit, 20));
  }

  // ==================== 稀有成就 ====================

  @Get('rare')
  @ApiOperation({ summary: '获取稀有成就', description: '获取史诗和传说级别的成就' })
  async getRareAchievements(@Request() req): Promise<AchievementDetailDto[]> {
    const epic = await this.achievementService.getAllAchievements(req.user.id, {
      rarity: AchievementRarity.EPIC,
    });
    const legendary = await this.achievementService.getAllAchievements(req.user.id, {
      rarity: AchievementRarity.LEGENDARY,
    });
    return [...legendary, ...epic];
  }

  // ==================== 接近完成 ====================

  @Get('near-completion')
  @ApiOperation({ summary: '获取接近完成的成就', description: '获取进度超过80%但未解锁的成就' })
  async getNearCompletionAchievements(@Request() req) {
    const all = await this.achievementService.getAllAchievements(req.user.id);
    return all
      .filter((a) => !a.isUnlocked && a.progress.percentage >= 80)
      .sort((a, b) => b.progress.percentage - a.progress.percentage)
      .slice(0, 10);
  }
}
