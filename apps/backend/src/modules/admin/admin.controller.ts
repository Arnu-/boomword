import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from './guards/admin.guard';
import { AdminService } from './admin.service';

@ApiTags('管理后台')
@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ==================== 用户管理 ====================

  @Get('users')
  @ApiOperation({ summary: '获取用户列表' })
  async getUsers(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('keyword') keyword?: string,
  ) {
    return this.adminService.getUsers(+page, +limit, keyword);
  }

  @Get('users/:id')
  @ApiOperation({ summary: '获取用户详情' })
  async getUserDetail(@Param('id') id: string) {
    return this.adminService.getUserDetail(id);
  }

  @Put('users/:id/status')
  @ApiOperation({ summary: '更新用户状态' })
  async updateUserStatus(
    @Param('id') id: string,
    @Body() body: { status: 'active' | 'banned' },
  ) {
    return this.adminService.updateUserStatus(id, body.status);
  }

  // ==================== 词库管理 ====================

  @Get('wordbanks')
  @ApiOperation({ summary: '获取词库列表' })
  async getWordBanks(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.adminService.getWordBanks(+page, +limit);
  }

  @Post('wordbanks')
  @ApiOperation({ summary: '创建词库' })
  async createWordBank(
    @Body() body: {
      name: string;
      code: string;
      description?: string;
      coverImage?: string;
      difficulty?: number;
      categoryId: string;
    },
  ) {
    return this.adminService.createWordBank(body);
  }

  @Put('wordbanks/:id')
  @ApiOperation({ summary: '更新词库' })
  async updateWordBank(
    @Param('id') id: string,
    @Body() body: {
      name?: string;
      description?: string;
      coverImage?: string;
      difficulty?: number;
      isActive?: boolean;
    },
  ) {
    return this.adminService.updateWordBank(id, body);
  }

  @Delete('wordbanks/:id')
  @ApiOperation({ summary: '删除词库' })
  async deleteWordBank(@Param('id') id: string) {
    return this.adminService.deleteWordBank(id);
  }

  // ==================== 章节管理 ====================

  @Get('wordbanks/:wordBankId/chapters')
  @ApiOperation({ summary: '获取章节列表' })
  async getChapters(@Param('wordBankId') wordBankId: string) {
    return this.adminService.getChapters(wordBankId);
  }

  @Post('wordbanks/:wordBankId/chapters')
  @ApiOperation({ summary: '创建章节' })
  async createChapter(
    @Param('wordBankId') wordBankId: string,
    @Body() body: { name: string; order?: number },
  ) {
    return this.adminService.createChapter(wordBankId, body);
  }

  @Put('chapters/:id')
  @ApiOperation({ summary: '更新章节' })
  async updateChapter(
    @Param('id') id: string,
    @Body() body: { name?: string; order?: number },
  ) {
    return this.adminService.updateChapter(id, body);
  }

  @Delete('chapters/:id')
  @ApiOperation({ summary: '删除章节' })
  async deleteChapter(@Param('id') id: string) {
    return this.adminService.deleteChapter(id);
  }

  // ==================== 小节管理 ====================

  @Get('chapters/:chapterId/sections')
  @ApiOperation({ summary: '获取小节列表' })
  async getSections(@Param('chapterId') chapterId: string) {
    return this.adminService.getSections(chapterId);
  }

  @Post('chapters/:chapterId/sections')
  @ApiOperation({ summary: '创建小节' })
  async createSection(
    @Param('chapterId') chapterId: string,
    @Body() body: { name: string; order?: number },
  ) {
    return this.adminService.createSection(chapterId, body);
  }

  @Put('sections/:id')
  @ApiOperation({ summary: '更新小节' })
  async updateSection(
    @Param('id') id: string,
    @Body() body: { name?: string; order?: number },
  ) {
    return this.adminService.updateSection(id, body);
  }

  @Delete('sections/:id')
  @ApiOperation({ summary: '删除小节' })
  async deleteSection(@Param('id') id: string) {
    return this.adminService.deleteSection(id);
  }

  // ==================== 单词管理 ====================

  @Get('sections/:sectionId/words')
  @ApiOperation({ summary: '获取小节单词列表' })
  async getSectionWords(@Param('sectionId') sectionId: string) {
    return this.adminService.getSectionWords(sectionId);
  }

  @Post('sections/:sectionId/words')
  @ApiOperation({ summary: '添加单词到小节' })
  async addWordToSection(
    @Param('sectionId') sectionId: string,
    @Body() body: { wordId: string; order?: number },
  ) {
    return this.adminService.addWordToSection(sectionId, body);
  }

  @Delete('sections/:sectionId/words/:wordId')
  @ApiOperation({ summary: '从小节移除单词' })
  async removeWordFromSection(
    @Param('sectionId') sectionId: string,
    @Param('wordId') wordId: string,
  ) {
    return this.adminService.removeWordFromSection(sectionId, wordId);
  }

  // ==================== 统计数据 ====================

  @Get('statistics/overview')
  @ApiOperation({ summary: '获取总览统计' })
  async getOverviewStats() {
    return this.adminService.getOverviewStats();
  }

  @Get('statistics/daily')
  @ApiOperation({ summary: '获取每日统计' })
  async getDailyStats(@Query('days') days = 30) {
    return this.adminService.getDailyStats(+days);
  }
}
