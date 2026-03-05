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
    @Query('status') status?: string,
  ) {
    return this.adminService.getUsers(+page, +limit, keyword, status);
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
    @Body() body: { status: string },
  ) {
    return this.adminService.updateUserStatus(id, body.status);
  }

  @Put('users/:id/role')
  @ApiOperation({ summary: '更新用户角色' })
  async updateUserRole(
    @Param('id') id: string,
    @Body() body: { role: string },
  ) {
    return this.adminService.updateUserRole(id, body.role);
  }

  @Post('users/:id/reset-password')
  @ApiOperation({ summary: '重置用户密码' })
  async resetUserPassword(
    @Param('id') id: string,
    @Body() body: { newPassword: string },
  ) {
    return this.adminService.resetUserPassword(id, body.newPassword);
  }

  @Get('users/:id/game-records')
  @ApiOperation({ summary: '获取用户游戏记录' })
  async getUserGameRecords(
    @Param('id') id: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('mode') mode?: string,
  ) {
    return this.adminService.getUserGameRecords(id, +page, +limit, mode);
  }

  @Get('users/:id/progress')
  @ApiOperation({ summary: '获取用户学习进度' })
  async getUserProgress(@Param('id') id: string) {
    return this.adminService.getUserProgress(id);
  }

  // ==================== 分类管理 ====================

  @Get('categories')
  @ApiOperation({ summary: '获取分类列表' })
  async getCategories() {
    return this.adminService.getCategories();
  }

  @Post('categories')
  @ApiOperation({ summary: '创建分类' })
  async createCategory(
    @Body() body: { name: string; code: string; description?: string; parentId?: string; sort?: number },
  ) {
    return this.adminService.createCategory(body);
  }

  @Put('categories/:id')
  @ApiOperation({ summary: '更新分类' })
  async updateCategory(
    @Param('id') id: string,
    @Body() body: { name?: string; description?: string; sort?: number; isActive?: boolean },
  ) {
    return this.adminService.updateCategory(id, body);
  }

  @Delete('categories/:id')
  @ApiOperation({ summary: '删除分类' })
  async deleteCategory(@Param('id') id: string) {
    return this.adminService.deleteCategory(id);
  }

  // ==================== 词库管理 ====================

  @Get('wordbanks')
  @ApiOperation({ summary: '获取词库列表' })
  async getWordBanks(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('keyword') keyword?: string,
    @Query('categoryId') categoryId?: string,
  ) {
    return this.adminService.getWordBanks(+page, +limit, keyword, categoryId);
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
      isFree?: boolean;
      sort?: number;
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
      isFree?: boolean;
      sort?: number;
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
    @Body() body: { name: string; description?: string; order?: number },
  ) {
    return this.adminService.createChapter(wordBankId, body);
  }

  @Put('chapters/:id')
  @ApiOperation({ summary: '更新章节' })
  async updateChapter(
    @Param('id') id: string,
    @Body() body: { name?: string; description?: string; order?: number; isActive?: boolean },
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
    @Body() body: { name: string; order?: number; timeLimit?: number },
  ) {
    return this.adminService.createSection(chapterId, body);
  }

  @Put('sections/:id')
  @ApiOperation({ summary: '更新小节' })
  async updateSection(
    @Param('id') id: string,
    @Body() body: { name?: string; order?: number; timeLimit?: number; isActive?: boolean },
  ) {
    return this.adminService.updateSection(id, body);
  }

  @Delete('sections/:id')
  @ApiOperation({ summary: '删除小节' })
  async deleteSection(@Param('id') id: string) {
    return this.adminService.deleteSection(id);
  }

  // ==================== 单词管理 ====================

  @Get('words')
  @ApiOperation({ summary: '获取全局单词列表' })
  async getWords(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('keyword') keyword?: string,
  ) {
    return this.adminService.getWords(+page, +limit, keyword);
  }

  @Post('words')
  @ApiOperation({ summary: '创建单词' })
  async createWord(
    @Body() body: {
      english: string;
      chinese: string;
      phonetic?: string;
      difficulty?: number;
      exampleSentence?: string;
      exampleChinese?: string;
      tags?: string[];
    },
  ) {
    return this.adminService.createWord(body);
  }

  @Put('words/:id')
  @ApiOperation({ summary: '更新单词' })
  async updateWord(
    @Param('id') id: string,
    @Body() body: {
      english?: string;
      chinese?: string;
      phonetic?: string;
      difficulty?: number;
      exampleSentence?: string;
      exampleChinese?: string;
      tags?: string[];
    },
  ) {
    return this.adminService.updateWord(id, body);
  }

  @Delete('words/:id')
  @ApiOperation({ summary: '删除单词' })
  async deleteWord(@Param('id') id: string) {
    return this.adminService.deleteWord(id);
  }

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

  @Post('sections/:sectionId/words/batch')
  @ApiOperation({ summary: '批量添加单词到小节' })
  async batchAddWordsToSection(
    @Param('sectionId') sectionId: string,
    @Body() body: { wordIds: string[] },
  ) {
    return this.adminService.batchAddWordsToSection(sectionId, body.wordIds);
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

  @Get('statistics/game-modes')
  @ApiOperation({ summary: '获取游戏模式分布统计' })
  async getGameModeStats() {
    return this.adminService.getGameModeStats();
  }
}
