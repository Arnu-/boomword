import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WordBankService } from '../services/wordbank.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserData, Public } from '@/common/decorators';

@ApiTags('wordbanks')
@Controller('wordbanks')
export class WordBankController {
  constructor(private wordBankService: WordBankService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: '获取词库列表' })
  async getWordBanks(@Query('categoryId') categoryId?: string) {
    return this.wordBankService.findAll(categoryId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: '获取词库详情' })
  async getWordBank(@Param('id') id: string, @CurrentUser() user: CurrentUserData) {
    return this.wordBankService.findOne(id, user?.id);
  }

  @Get(':id/progress')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: '获取词库学习进度' })
  async getProgress(@Param('id') id: string, @CurrentUser() user: CurrentUserData) {
    return this.wordBankService.getProgress(id, user.id);
  }
}
