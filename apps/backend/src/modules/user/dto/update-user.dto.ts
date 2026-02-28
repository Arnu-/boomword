import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength, IsIn } from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({ example: '新昵称', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  nickname?: string;

  @ApiProperty({ example: 'https://example.com/avatar.png', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  avatar?: string;

  @ApiProperty({ example: 'male', required: false })
  @IsOptional()
  @IsIn(['male', 'female', 'unknown'])
  gender?: 'male' | 'female' | 'unknown';

  @ApiProperty({ example: '高一', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  grade?: string;
}
