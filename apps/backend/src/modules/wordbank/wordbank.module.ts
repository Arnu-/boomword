import { Module } from '@nestjs/common';
import { CategoryController } from './controllers/category.controller';
import { WordBankController } from './controllers/wordbank.controller';
import { CategoryService } from './services/category.service';
import { WordBankService } from './services/wordbank.service';

@Module({
  controllers: [CategoryController, WordBankController],
  providers: [CategoryService, WordBankService],
  exports: [CategoryService, WordBankService],
})
export class WordBankModule {}
