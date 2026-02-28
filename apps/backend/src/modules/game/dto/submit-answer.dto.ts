import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SubmitAnswerDto {
  @ApiProperty({ description: '游戏记录ID' })
  @IsString()
  @IsNotEmpty()
  gameRecordId: string;

  @ApiProperty({ description: '单词ID' })
  @IsString()
  @IsNotEmpty()
  wordId: string;

  @ApiProperty({ description: '用户输入的答案' })
  @IsString()
  @IsNotEmpty()
  answer: string;

  @ApiProperty({ description: '答题耗时(毫秒)' })
  @IsNumber()
  @Min(0)
  timeSpent: number;
}
