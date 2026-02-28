import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserData } from '@/common/decorators';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT')
export class UserController {
  constructor(private userService: UserService) {}

  @Get('me')
  @ApiOperation({ summary: '获取当前用户信息' })
  async getCurrentUser(@CurrentUser() user: CurrentUserData) {
    return this.userService.findById(user.id);
  }

  @Put('me')
  @ApiOperation({ summary: '更新当前用户信息' })
  async updateCurrentUser(@CurrentUser() user: CurrentUserData, @Body() dto: UpdateUserDto) {
    return this.userService.update(user.id, dto);
  }

  @Get('me/stats')
  @ApiOperation({ summary: '获取用户学习统计' })
  async getUserStats(@CurrentUser() user: CurrentUserData) {
    return this.userService.getStats(user.id);
  }
}
