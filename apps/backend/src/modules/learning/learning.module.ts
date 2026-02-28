import { Module } from '@nestjs/common';
import { LearningController } from './learning.controller';
import { LearningService } from './learning.service';
import { WrongBookController } from './wrongbook.controller';
import { WrongBookService } from './wrongbook.service';

@Module({
  controllers: [LearningController, WrongBookController],
  providers: [LearningService, WrongBookService],
  exports: [LearningService, WrongBookService],
})
export class LearningModule {}
