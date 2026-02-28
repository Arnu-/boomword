import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { WordImportController } from './word-import.controller';
import { WordImportService } from './word-import.service';

@Module({
  controllers: [AdminController, WordImportController],
  providers: [AdminService, WordImportService],
  exports: [AdminService, WordImportService],
})
export class AdminModule {}
