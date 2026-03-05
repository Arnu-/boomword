import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PauseGameDto {
  @ApiProperty({ description: '游戏记录ID' })
  @IsString()
  @IsNotEmpty()
  gameRecordId: string;
}

export class ResumeGameDto {
  @ApiProperty({ description: '游戏记录ID' })
  @IsString()
  @IsNotEmpty()
  gameRecordId: string;
}
