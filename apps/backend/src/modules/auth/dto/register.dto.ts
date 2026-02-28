import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEmail,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: '13800138000', description: '手机号', required: false })
  @IsOptional()
  @IsString()
  @Matches(/^1[3-9]\d{9}$/, { message: '手机号格式不正确' })
  phone?: string;

  @ApiProperty({ example: 'user@example.com', description: '邮箱', required: false })
  @IsOptional()
  @IsEmail({}, { message: '邮箱格式不正确' })
  @MaxLength(100)
  email?: string;

  @ApiProperty({ example: 'Password123', description: '密码' })
  @IsString()
  @MinLength(8, { message: '密码至少8位' })
  @MaxLength(20, { message: '密码最多20位' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: '密码需包含大小写字母和数字',
  })
  password: string;

  @ApiProperty({ example: '玩家001', description: '昵称' })
  @IsString()
  @MinLength(2, { message: '昵称至少2个字符' })
  @MaxLength(20, { message: '昵称最多20个字符' })
  nickname: string;

  @ApiProperty({ example: '123456', description: '验证码' })
  @IsString()
  @Matches(/^\d{6}$/, { message: '验证码为6位数字' })
  code: string;
}
