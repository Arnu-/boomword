import { Module } from '@nestjs/common';
import { LevelController } from './level.controller';
import { LevelService } from './level.service';

@Module({
  controllers: [LevelController],
  providers: [LevelService],
  exports: [LevelService],
})
export class LevelModule {}
