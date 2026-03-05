import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  Param,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GameService } from './game.service';
import {
  StartGameDto,
  SubmitAnswerDto,
  EndGameDto,
  PauseGameDto,
  ResumeGameDto,
  ReportWrongDto,
  GameMode,
} from './dto';

@ApiTags('游戏')
@Controller('game')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Post('start')
  @ApiOperation({ summary: '开始游戏', description: '开始一个新的游戏会话' })
  async startGame(@Request() req, @Body() dto: StartGameDto) {
    return this.gameService.startGame(req.user.id, dto);
  }

  @Post('submit')
  @ApiOperation({ summary: '提交答案', description: '提交单词答案' })
  async submitAnswer(@Request() req, @Body() dto: SubmitAnswerDto) {
    return this.gameService.submitAnswer(req.user.id, dto);
  }

  @Post('wrong')
  @ApiOperation({ summary: '上报错误输入', description: '输入错误时上报，记录错误次数和错题本，不消耗单词机会' })
  async reportWrong(@Request() req, @Body() dto: ReportWrongDto) {
    return this.gameService.reportWrong(req.user.id, dto);
  }

  @Post('pause')
  @ApiOperation({ summary: '暂停游戏', description: '暂停当前游戏（速度模式不可用）' })
  async pauseGame(@Request() req, @Body() dto: PauseGameDto) {
    return this.gameService.pauseGame(req.user.id, dto);
  }

  @Post('resume')
  @ApiOperation({ summary: '恢复游戏', description: '恢复已暂停的游戏' })
  async resumeGame(@Request() req, @Body() dto: ResumeGameDto) {
    return this.gameService.resumeGame(req.user.id, dto);
  }

  @Post('end')
  @ApiOperation({ summary: '结束游戏', description: '结束当前游戏并获取结算结果' })
  async endGame(@Request() req, @Body() dto: EndGameDto) {
    return this.gameService.endGame(req.user.id, dto);
  }

  @Get('status/:gameRecordId')
  @ApiOperation({ summary: '获取游戏状态', description: '获取进行中的游戏状态' })
  @ApiParam({ name: 'gameRecordId', description: '游戏记录ID' })
  async getGameStatus(@Request() req, @Param('gameRecordId') gameRecordId: string) {
    return this.gameService.getGameStatus(req.user.id, gameRecordId);
  }

  @Get('record/:id')
  @ApiOperation({ summary: '获取游戏记录详情', description: '获取指定游戏记录的详细信息' })
  @ApiParam({ name: 'id', description: '游戏记录ID' })
  async getGameRecord(@Request() req, @Param('id') id: string) {
    return this.gameService.getGameRecord(req.user.id, id);
  }

  @Get('history')
  @ApiOperation({ summary: '获取游戏历史记录', description: '获取用户的游戏历史记录列表' })
  @ApiQuery({ name: 'limit', required: false, description: '每页数量', example: 20 })
  @ApiQuery({ name: 'offset', required: false, description: '偏移量', example: 0 })
  @ApiQuery({ name: 'mode', required: false, enum: GameMode, description: '游戏模式筛选' })
  @ApiQuery({ name: 'sectionId', required: false, description: '小节ID筛选' })
  async getGameHistory(
    @Request() req,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
    @Query('mode') mode?: GameMode,
    @Query('sectionId') sectionId?: string,
  ) {
    return this.gameService.getGameHistory(req.user.id, {
      limit,
      offset,
      mode,
      sectionId,
    });
  }

  @Get('stats')
  @ApiOperation({ summary: '获取游戏统计', description: '获取用户的游戏统计数据' })
  async getUserGameStats(@Request() req) {
    return this.gameService.getUserGameStats(req.user.id);
  }
}
