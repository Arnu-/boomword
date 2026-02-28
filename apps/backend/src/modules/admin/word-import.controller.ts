import {
  Controller,
  Post,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from './guards/admin.guard';
import { WordImportService } from './word-import.service';

@ApiTags('词库导入')
@Controller('admin/import')
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth()
export class WordImportController {
  constructor(private readonly wordImportService: WordImportService) {}

  @Post('words')
  @ApiOperation({ summary: '批量导入单词' })
  async importWords(
    @Body() body: {
      wordBankId: string;
      words: Array<{
        english: string;
        chinese: string;
        phonetic?: string;
        audioUrl?: string;
        example?: string;
        exampleTranslation?: string;
      }>;
    },
  ) {
    return this.wordImportService.importWords(body.wordBankId, body.words);
  }

  @Post('words/file')
  @ApiOperation({ summary: '从文件导入单词' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        wordBankId: { type: 'string' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async importWordsFromFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('wordBankId') wordBankId: string,
  ) {
    return this.wordImportService.importWordsFromFile(wordBankId, file);
  }

  @Post('wordbank/complete')
  @ApiOperation({ summary: '完整导入词库（包含章节、小节、单词）' })
  async importCompleteWordBank(
    @Body() body: {
      name: string;
      code: string;
      description?: string;
      categoryId: string;
      chapters: Array<{
        name: string;
        sections: Array<{
          name: string;
          words: Array<{
            english: string;
            chinese: string;
            phonetic?: string;
          }>;
        }>;
      }>;
    },
  ) {
    return this.wordImportService.importCompleteWordBank(body);
  }
}
