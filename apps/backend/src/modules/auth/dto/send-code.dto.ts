import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsIn } from 'class-validator';

export class SendCodeDto {
  @ApiProperty({ example: '13800138000', description: '手机号或邮箱' })
  @IsString()
  target: string;

  @ApiProperty({ example: 'register', description: '验证码类型' })
  @IsString()
  @IsIn(['register', 'login', 'reset'])
  type: 'register' | 'login' | 'reset';
}
