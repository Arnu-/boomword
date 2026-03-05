import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { LevelService } from './level.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserData } from '@/common/decorators';

@ApiTags('levels')
@Controller('levels')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT')
export class LevelController {
  constructor(private levelService: LevelService) {}

  @Get('sections/:sectionId')
  @ApiOperation({ summary: '获取小节详情' })
  async getSectionDetail(
    @Param('sectionId') sectionId: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.levelService.getSectionDetail(sectionId, user.id);
  }

  @Get('sections/:sectionId/words')
  @ApiOperation({ summary: '获取小节单词列表' })
  async getSectionWords(@Param('sectionId') sectionId: string) {
    return this.levelService.getSectionWords(sectionId);
  }
}
