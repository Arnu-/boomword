import {
  Controller,
  Get,
  Query,
  Param,
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
import { RankingService } from './ranking.service';
import {
  RankingType,
  RankingResponseDto,
  MyRankResponseDto,
  TopRankingResponseDto,
  FriendsRankingResponseDto,
} from './dto';

@ApiTags('排行榜')
@Controller('ranking')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RankingController {
  constructor(private readonly rankingService: RankingService) {}

  // ==================== 全局排行榜 ====================

  @Get('weekly')
  @ApiOperation({ summary: '获取周排行榜', description: '获取本周的全局排行榜' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: '页码', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: '每页数量', example: 50 })
  @ApiResponse({ status: 200, type: RankingResponseDto })
  async getWeeklyRanking(
    @Request() req,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ): Promise<RankingResponseDto> {
    return this.rankingService.getGlobalRanking(RankingType.WEEKLY, req.user.id, page, limit);
  }

  @Get('monthly')
  @ApiOperation({ summary: '获取月排行榜', description: '获取本月的全局排行榜' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: '页码', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: '每页数量', example: 50 })
  @ApiResponse({ status: 200, type: RankingResponseDto })
  async getMonthlyRanking(
    @Request() req,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ): Promise<RankingResponseDto> {
    return this.rankingService.getGlobalRanking(RankingType.MONTHLY, req.user.id, page, limit);
  }

  @Get('total')
  @ApiOperation({ summary: '获取总排行榜', description: '获取历史累计的全局排行榜' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: '页码', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: '每页数量', example: 50 })
  @ApiResponse({ status: 200, type: RankingResponseDto })
  async getTotalRanking(
    @Request() req,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ): Promise<RankingResponseDto> {
    return this.rankingService.getGlobalRanking(RankingType.TOTAL, req.user.id, page, limit);
  }

  // ==================== Top N 排行榜 ====================

  @Get('top/weekly')
  @ApiOperation({ summary: '获取周榜 Top N', description: '获取本周排行榜前 N 名（带缓存）' })
  @ApiQuery({ name: 'n', required: false, type: Number, description: 'Top N', example: 10 })
  @ApiResponse({ status: 200, type: TopRankingResponseDto })
  async getWeeklyTop(
    @Query('n', new DefaultValuePipe(10), ParseIntPipe) n: number,
  ): Promise<TopRankingResponseDto> {
    return this.rankingService.getTopRanking(RankingType.WEEKLY, Math.min(n, 100));
  }

  @Get('top/monthly')
  @ApiOperation({ summary: '获取月榜 Top N', description: '获取本月排行榜前 N 名（带缓存）' })
  @ApiQuery({ name: 'n', required: false, type: Number, description: 'Top N', example: 10 })
  @ApiResponse({ status: 200, type: TopRankingResponseDto })
  async getMonthlyTop(
    @Query('n', new DefaultValuePipe(10), ParseIntPipe) n: number,
  ): Promise<TopRankingResponseDto> {
    return this.rankingService.getTopRanking(RankingType.MONTHLY, Math.min(n, 100));
  }

  @Get('top/total')
  @ApiOperation({ summary: '获取总榜 Top N', description: '获取总排行榜前 N 名（带缓存）' })
  @ApiQuery({ name: 'n', required: false, type: Number, description: 'Top N', example: 10 })
  @ApiResponse({ status: 200, type: TopRankingResponseDto })
  async getTotalTop(
    @Query('n', new DefaultValuePipe(10), ParseIntPipe) n: number,
  ): Promise<TopRankingResponseDto> {
    return this.rankingService.getTopRanking(RankingType.TOTAL, Math.min(n, 100));
  }

  // ==================== 用户排名 ====================

  @Get('my-rank')
  @ApiOperation({ summary: '获取我的排名', description: '获取当前用户在各个排行榜的排名' })
  @ApiResponse({ status: 200, type: MyRankResponseDto })
  async getMyRank(@Request() req): Promise<MyRankResponseDto> {
    return this.rankingService.getMyRanking(req.user.id);
  }

  @Get('nearby')
  @ApiOperation({ summary: '获取我附近的排名', description: '获取当前用户排名附近的用户列表' })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: RankingType,
    description: '排行榜类型',
    example: 'weekly',
  })
  @ApiQuery({
    name: 'range',
    required: false,
    type: Number,
    description: '前后各取多少名',
    example: 5,
  })
  @ApiResponse({ status: 200, type: RankingResponseDto })
  async getNearbyRanking(
    @Request() req,
    @Query('type') type: RankingType = RankingType.WEEKLY,
    @Query('range', new DefaultValuePipe(5), ParseIntPipe) range: number,
  ): Promise<RankingResponseDto> {
    return this.rankingService.getNearbyRanking(type, req.user.id, Math.min(range, 20));
  }

  @Get('best-rank')
  @ApiOperation({ summary: '获取历史最佳排名', description: '获取用户的历史最佳排名记录' })
  async getUserBestRank(@Request() req) {
    return this.rankingService.getUserBestRank(req.user.id);
  }

  // ==================== 关卡排行榜 ====================

  @Get('section/:sectionId')
  @ApiOperation({ summary: '获取小节排行榜', description: '获取指定小节的排行榜' })
  @ApiParam({ name: 'sectionId', description: '小节ID' })
  @ApiQuery({
    name: 'mode',
    required: false,
    enum: ['practice', 'challenge', 'speed'],
    description: '游戏模式',
    example: 'challenge',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: '页码', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: '每页数量', example: 50 })
  @ApiResponse({ status: 200, type: RankingResponseDto })
  async getSectionRanking(
    @Request() req,
    @Param('sectionId') sectionId: string,
    @Query('mode') mode: 'practice' | 'challenge' | 'speed' = 'challenge',
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ): Promise<RankingResponseDto> {
    return this.rankingService.getSectionRanking(sectionId, req.user.id, mode, page, limit);
  }

  @Get('wordbank/:wordBankId')
  @ApiOperation({ summary: '获取词库排行榜', description: '获取指定词库的排行榜' })
  @ApiParam({ name: 'wordBankId', description: '词库ID' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: '页码', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: '每页数量', example: 50 })
  @ApiResponse({ status: 200, type: RankingResponseDto })
  async getWordBankRanking(
    @Request() req,
    @Param('wordBankId') wordBankId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ): Promise<RankingResponseDto> {
    return this.rankingService.getWordBankRanking(wordBankId, req.user.id, page, limit);
  }

  // ==================== 好友排行榜 ====================

  @Get('friends')
  @ApiOperation({ summary: '获取好友排行榜', description: '获取当前用户好友的排行榜' })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: RankingType,
    description: '排行榜类型',
    example: 'weekly',
  })
  @ApiResponse({ status: 200, type: FriendsRankingResponseDto })
  async getFriendsRanking(
    @Request() req,
    @Query('type') type: RankingType = RankingType.WEEKLY,
  ): Promise<FriendsRankingResponseDto> {
    return this.rankingService.getFriendsRanking(req.user.id, type);
  }

  // ==================== 排行榜统计 ====================

  @Get('stats/:type')
  @ApiOperation({ summary: '获取排行榜统计', description: '获取指定排行榜的统计信息' })
  @ApiParam({ name: 'type', enum: RankingType, description: '排行榜类型' })
  async getRankingStats(@Param('type') type: RankingType) {
    return this.rankingService.getRankingStats(type);
  }
}
