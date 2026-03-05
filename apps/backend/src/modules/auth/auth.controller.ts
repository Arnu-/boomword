import { Controller, Post, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { SendCodeDto } from './dto/send-code.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser, CurrentUserData } from '@/common/decorators';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: '用户注册' })
  @ApiResponse({ status: 201, description: '注册成功' })
  @ApiResponse({ status: 400, description: '参数错误' })
  @ApiResponse({ status: 409, description: '用户已存在' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '用户登录' })
  @ApiResponse({ status: 200, description: '登录成功' })
  @ApiResponse({ status: 401, description: '用户名或密码错误' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '刷新Token' })
  @ApiResponse({ status: 200, description: '刷新成功' })
  @ApiResponse({ status: 401, description: 'RefreshToken无效' })
  async refreshToken(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto.refreshToken);
  }

  @Post('send-code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '发送验证码' })
  @ApiResponse({ status: 200, description: '验证码已发送' })
  async sendCode(@Body() dto: SendCodeDto) {
    return this.authService.sendCode(dto.target, dto.type);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: '退出登录' })
  @ApiResponse({ status: 200, description: '退出成功' })
  async logout(@CurrentUser() user: CurrentUserData) {
    return this.authService.logout(user.id);
  }
}
