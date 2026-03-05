import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReportWrongDto {
  @ApiProperty({ description: '游戏记录ID' })
  @IsString()
  @IsNotEmpty()
  gameRecordId: string;

  @ApiProperty({ description: '输错的单词ID' })
  @IsString()
  @IsNotEmpty()
  wordId: string;
}
