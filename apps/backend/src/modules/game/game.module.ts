import { Module } from '@nestjs/common';
import { GameController } from './game.controller';
import { GameService } from './game.service';
import { LevelModule } from '../level/level.module';

@Module({
  imports: [LevelModule],
  controllers: [GameController],
  providers: [GameService],
  exports: [GameService],
})
export class GameModule {}
