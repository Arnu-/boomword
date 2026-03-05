import {
  Controller,
  Get,
  Post,
  Body,
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
import { LearningService } from './learning.service';
import {
  TimeRange,
  MasteryLevel,
  LearningOverviewDto,
  LearningTrendDto,
  QueryLearningStatsDto,
  SetDailyGoalDto,
} from './dto';

@ApiTags('学习统计')
@Controller('learning')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class LearningController {
  constructor(private readonly learningService: LearningService) {}

  // ==================== 学习总览 ====================

  @Get('overview')
  @ApiOperation({
    summary: '获取学习总览',
    description: '获取用户的学习总览数据，包括词库进度、统计信息、今日数据等',
  })
  @ApiResponse({ status: 200, type: LearningOverviewDto })
  async getOverview(@Request() req): Promise<LearningOverviewDto> {
    return this.learningService.getOverview(req.user.id);
  }

  // ==================== 学习统计 ====================

  @Get('statistics')
  @ApiOperation({ summary: '获取学习统计数据', description: '获取指定时间范围的学习统计数据' })
  @ApiQuery({ name: 'range', required: false, enum: TimeRange, description: '时间范围' })
  @ApiQuery({ name: 'days', required: false, type: Number, description: '自定义天数' })
  @ApiQuery({ name: 'wordBankId', required: false, description: '词库ID筛选' })
  @ApiResponse({ status: 200, type: LearningTrendDto })
  async getLearningTrend(
    @Request() req,
    @Query('range') range?: TimeRange,
    @Query('days', new DefaultValuePipe(7), ParseIntPipe) days?: number,
    @Query('wordBankId') wordBankId?: string,
  ): Promise<LearningTrendDto> {
    return this.learningService.getLearningTrend(req.user.id, { range, days, wordBankId });
  }

  @Get('heatmap')
  @ApiOperation({ summary: '获取学习热力图', description: '获取指定年份的学习热力图数据' })
  @ApiQuery({ name: 'year', required: false, type: Number, description: '年份' })
  async getHeatmapData(@Request() req, @Query('year') year?: number) {
    return this.learningService.getHeatmapData(req.user.id, year);
  }

  @Get('time-distribution')
  @ApiOperation({ summary: '获取学习时段分析', description: '分析用户的学习时间分布' })
  @ApiQuery({ name: 'days', required: false, type: Number, description: '统计天数' })
  async getTimeDistribution(
    @Request() req,
    @Query('days', new DefaultValuePipe(30), ParseIntPipe) days: number,
  ) {
    return this.learningService.getTimeDistribution(req.user.id, days);
  }

  // ==================== 单词掌握度 ====================

  @Get('mastery/distribution')
  @ApiOperation({ summary: '获取掌握度分布', description: '获取单词掌握度分布统计' })
  @ApiQuery({ name: 'wordBankId', required: false, description: '词库ID筛选' })
  async getMasteryDistribution(@Request() req, @Query('wordBankId') wordBankId?: string) {
    return this.learningService.getMasteryDistribution(req.user.id, wordBankId);
  }

  @Get('words/mastered')
  @ApiOperation({ summary: '获取已掌握单词', description: '获取已掌握的单词列表' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'wordBankId', required: false, description: '词库ID筛选' })
  async getMasteredWords(
    @Request() req,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('wordBankId') wordBankId?: string,
  ) {
    return this.learningService.getWordsByMastery(
      req.user.id,
      MasteryLevel.MASTERED,
      page,
      limit,
      wordBankId,
    );
  }

  @Get('words/learning')
  @ApiOperation({ summary: '获取学习中单词', description: '获取学习中的单词列表' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'wordBankId', required: false, description: '词库ID筛选' })
  async getLearningWords(
    @Request() req,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('wordBankId') wordBankId?: string,
  ) {
    return this.learningService.getWordsByMastery(
      req.user.id,
      MasteryLevel.LEARNING,
      page,
      limit,
      wordBankId,
    );
  }

  @Get('words/need-review')
  @ApiOperation({ summary: '获取需复习单词', description: '获取需要复习的单词列表' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getNeedReviewWords(
    @Request() req,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.learningService.getWordsByMastery(
      req.user.id,
      MasteryLevel.NEED_REVIEW,
      page,
      limit,
    );
  }

  // ==================== 复习提醒 ====================

  @Get('review-reminder')
  @ApiOperation({ summary: '获取复习提醒', description: '获取需要复习的单词提醒' })
  async getReviewReminder(@Request() req) {
    return this.learningService.getReviewReminder(req.user.id);
  }

  // ==================== 薄弱分析 ====================

  @Get('weak-words')
  @ApiOperation({ summary: '获取薄弱单词分析', description: '分析用户的薄弱单词和错误模式' })
  async getWeakWordsAnalysis(@Request() req) {
    return this.learningService.getWeakWordsAnalysis(req.user.id);
  }

  // ==================== 词库进度 ====================

  @Get('wordbank/:id/progress')
  @ApiOperation({ summary: '获取词库学习进度', description: '获取指定词库的详细学习进度' })
  @ApiParam({ name: 'id', description: '词库ID' })
  async getWordBankProgress(@Request() req, @Param('id') wordBankId: string) {
    return this.learningService.getWordBankProgress(req.user.id, wordBankId);
  }

  // ==================== 学习报告 ====================

  @Get('report/weekly')
  @ApiOperation({ summary: '获取周学习报告', description: '生成本周的学习报告' })
  async getWeeklyReport(@Request() req) {
    return this.learningService.generateLearningReport(req.user.id, 'weekly');
  }

  @Get('report/monthly')
  @ApiOperation({ summary: '获取月学习报告', description: '生成本月的学习报告' })
  async getMonthlyReport(@Request() req) {
    return this.learningService.generateLearningReport(req.user.id, 'monthly');
  }

  // ==================== 每日目标 ====================

  @Get('daily-goal')
  @ApiOperation({ summary: '获取每日目标状态', description: '获取今日学习目标完成情况' })
  async getDailyGoal(@Request() req) {
    return this.learningService.getDailyGoalStatus(req.user.id);
  }

  @Post('daily-goal')
  @ApiOperation({ summary: '设置每日目标', description: '设置每日学习目标' })
  async setDailyGoal(@Request() req, @Body() dto: SetDailyGoalDto) {
    await this.learningService.setDailyGoal(req.user.id, dto);
    return { success: true, message: '每日目标设置成功' };
  }

  // ==================== 签到 ====================

  @Post('check-in')
  @ApiOperation({ summary: '签到', description: '每日签到，更新连续学习天数' })
  async checkIn(@Request() req) {
    return this.learningService.checkIn(req.user.id);
  }
}
