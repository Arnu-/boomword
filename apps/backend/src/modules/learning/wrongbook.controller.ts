import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiParam, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WrongBookService } from './wrongbook.service';
import { QueryWrongBookDto, WrongBookPracticeDto } from './dto';

@ApiTags('错词本')
@Controller('wrongbook')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WrongBookController {
  constructor(private readonly wrongBookService: WrongBookService) {}

  // ==================== 错词列表 ====================

  @Get()
  @ApiOperation({ summary: '获取错词列表', description: '获取用户的错词列表，支持排序和筛选' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: '页码' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: '每页数量' })
  @ApiQuery({ name: 'wordBankId', required: false, description: '词库ID筛选' })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: ['wrongCount', 'recent', 'difficulty'],
    description: '排序方式',
  })
  @ApiQuery({ name: 'minWrongCount', required: false, type: Number, description: '最小错误次数' })
  async getWrongWords(
    @Request() req,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('wordBankId') wordBankId?: string,
    @Query('sortBy') sortBy?: 'wrongCount' | 'recent' | 'difficulty',
    @Query('minWrongCount') minWrongCount?: number,
  ) {
    return this.wrongBookService.getWrongWords(req.user.id, {
      page,
      limit,
      wordBankId,
      sortBy,
      minWrongCount: minWrongCount ? Number(minWrongCount) : undefined,
    });
  }

  // ==================== 错词统计 ====================

  @Get('statistics')
  @ApiOperation({ summary: '获取错词统计', description: '获取错词本的统计数据' })
  async getStatistics(@Request() req) {
    return this.wrongBookService.getStatistics(req.user.id);
  }

  @Get('analysis')
  @ApiOperation({ summary: '获取错词分析', description: '分析错词的错误模式和薄弱领域' })
  async getAnalysis(@Request() req) {
    return this.wrongBookService.getAnalysis(req.user.id);
  }

  // ==================== 错词练习 ====================

  @Post('practice/start')
  @ApiOperation({ summary: '开始错词练习', description: '开始一次错词练习，返回练习单词列表' })
  @ApiBody({ type: WrongBookPracticeDto, required: false })
  async startPractice(@Request() req, @Body() dto?: WrongBookPracticeDto) {
    return this.wrongBookService.startPractice(req.user.id, dto || {});
  }

  @Post('practice/result')
  @ApiOperation({ summary: '记录练习结果', description: '记录单个单词的练习结果' })
  @ApiBody({
    schema: {
      properties: {
        wordId: { type: 'string', description: '单词ID' },
        isCorrect: { type: 'boolean', description: '是否正确' },
      },
    },
  })
  async recordPracticeResult(
    @Request() req,
    @Body('wordId') wordId: string,
    @Body('isCorrect') isCorrect: boolean,
  ) {
    return this.wrongBookService.recordPracticeResult(req.user.id, wordId, isCorrect);
  }

  // ==================== 错词管理 ====================

  @Post('add/:wordId')
  @ApiOperation({ summary: '添加单词到错词本', description: '手动将单词添加到错词本' })
  @ApiParam({ name: 'wordId', description: '单词ID' })
  async addWord(@Request() req, @Param('wordId') wordId: string) {
    return this.wrongBookService.addWord(req.user.id, wordId);
  }

  @Delete(':wordId')
  @ApiOperation({ summary: '从错词本移除单词', description: '从错词本中移除指定单词' })
  @ApiParam({ name: 'wordId', description: '单词ID' })
  async removeWord(@Request() req, @Param('wordId') wordId: string) {
    return this.wrongBookService.removeWord(req.user.id, wordId);
  }

  @Post('remove-batch')
  @ApiOperation({ summary: '批量移除单词', description: '批量从错词本中移除单词' })
  @ApiBody({
    schema: {
      properties: {
        wordIds: { type: 'array', items: { type: 'string' }, description: '单词ID列表' },
      },
    },
  })
  async removeWords(@Request() req, @Body('wordIds') wordIds: string[]) {
    return this.wrongBookService.removeWords(req.user.id, wordIds);
  }

  @Delete()
  @ApiOperation({ summary: '清空错词本', description: '清空所有错词' })
  async clearAll(@Request() req) {
    return this.wrongBookService.clearAll(req.user.id);
  }

  @Post('restore/:wordId')
  @ApiOperation({ summary: '恢复已移除的单词', description: '将已移除的单词恢复到错词本' })
  @ApiParam({ name: 'wordId', description: '单词ID' })
  async restoreWord(@Request() req, @Param('wordId') wordId: string) {
    return this.wrongBookService.restoreWord(req.user.id, wordId);
  }

  // ==================== 历史记录 ====================

  @Get('history')
  @ApiOperation({ summary: '获取已移除单词', description: '获取已从错词本移除的单词历史记录' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getRemovedWords(
    @Request() req,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.wrongBookService.getRemovedWords(req.user.id, page, limit);
  }
}
