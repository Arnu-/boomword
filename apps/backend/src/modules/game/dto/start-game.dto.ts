import { IsEnum, IsNotEmpty, IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum GameMode {
  PRACTICE = 'practice',
  CHALLENGE = 'challenge',
  SPEED = 'speed',
}

export class StartGameDto {
  @ApiProperty({ description: '小节ID' })
  @IsString()
  @IsNotEmpty()
  sectionId: string;

  @ApiProperty({ description: '游戏模式', enum: GameMode })
  @IsEnum(GameMode)
  mode: GameMode;

  @ApiPropertyOptional({ description: '是否随机打乱单词顺序', default: false })
  @IsOptional()
  @IsBoolean()
  shuffle?: boolean;
}
