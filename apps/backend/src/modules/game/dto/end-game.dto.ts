import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class EndGameDto {
  @ApiProperty({ description: '游戏记录ID' })
  @IsString()
  @IsNotEmpty()
  gameRecordId: string;
}
