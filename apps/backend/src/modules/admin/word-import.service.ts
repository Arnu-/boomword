import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import * as XLSX from 'xlsx';

interface WordData {
  english: string;
  chinese: string;
  phonetic?: string;
  audioUrl?: string;
  exampleSentence?: string;
  exampleChinese?: string;
}

@Injectable()
export class WordImportService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 批量导入单词
   */
  async importWords(wordBankId: string, words: WordData[]) {
    const wordBank = await this.prisma.wordBank.findUnique({
      where: { id: wordBankId },
    });

    if (!wordBank) {
      throw new BadRequestException('词库不存在');
    }

    const results = {
      total: words.length,
      success: 0,
      failed: 0,
      errors: [] as Array<{ word: string; error: string }>,
    };

    for (const word of words) {
      try {
        // 检查单词是否已存在
        const existing = await this.prisma.word.findFirst({
          where: {
            english: word.english,
            chinese: word.chinese,
          },
        });

        if (existing) {
          // 更新现有单词
          await this.prisma.word.update({
            where: { id: existing.id },
            data: {
              phonetic: word.phonetic,
              audioUrl: word.audioUrl,
              exampleSentence: word.exampleSentence,
              exampleChinese: word.exampleChinese,
            },
          });
        } else {
          // 创建新单词
          await this.prisma.word.create({
            data: {
              english: word.english,
              chinese: word.chinese,
              phonetic: word.phonetic,
              audioUrl: word.audioUrl,
              exampleSentence: word.exampleSentence,
              exampleChinese: word.exampleChinese,
              difficulty: this.calculateDifficulty(word.english),
            },
          });
        }
        results.success++;
      } catch (error: any) {
        results.failed++;
        results.errors.push({
          word: word.english,
          error: error.message,
        });
      }
    }

    return results;
  }

  /**
   * 从文件导入单词（支持Excel/CSV）
   */
  async importWordsFromFile(wordBankId: string, file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('请上传文件');
    }

    const words: WordData[] = [];

    try {
      const workbook = XLSX.read(file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);

      for (const row of data as any[]) {
        const english = row['english'] || row['英文'] || row['单词'];
        const chinese = row['chinese'] || row['中文'] || row['释义'];

        if (english && chinese) {
          words.push({
            english: String(english).trim(),
            chinese: String(chinese).trim(),
            phonetic: row['phonetic'] || row['音标'],
            audioUrl: row['audioUrl'] || row['音频'],
            exampleSentence: row['example'] || row['例句'],
            exampleChinese: row['exampleTranslation'] || row['例句翻译'],
          });
        }
      }
    } catch (error: any) {
      throw new BadRequestException('文件解析失败: ' + error.message);
    }

    if (words.length === 0) {
      throw new BadRequestException('文件中没有有效的单词数据');
    }

    return this.importWords(wordBankId, words);
  }

  /**
   * 完整导入词库（包含章节、小节、单词）
   */
  async importCompleteWordBank(data: {
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
  }) {
    return this.prisma.$transaction(async (tx) => {
      // 创建词库
      const wordBank = await tx.wordBank.create({
        data: {
          name: data.name,
          code: data.code,
          description: data.description,
          categoryId: data.categoryId,
        },
      });

      let totalWords = 0;
      let chapterOrder = 1;

      for (const chapterData of data.chapters) {
        // 创建章节
        const chapter = await tx.chapter.create({
          data: {
            wordBankId: wordBank.id,
            name: chapterData.name,
            order: chapterOrder++,
          },
        });

        let sectionOrder = 1;

        for (const sectionData of chapterData.sections) {
          // 创建小节
          const section = await tx.section.create({
            data: {
              chapterId: chapter.id,
              name: sectionData.name,
              order: sectionOrder++,
            },
          });

          let wordOrder = 1;

          for (const wordData of sectionData.words) {
            // 查找或创建单词
            let word = await tx.word.findFirst({
              where: {
                english: wordData.english,
                chinese: wordData.chinese,
              },
            });

            if (!word) {
              word = await tx.word.create({
                data: {
                  english: wordData.english,
                  chinese: wordData.chinese,
                  phonetic: wordData.phonetic,
                  difficulty: this.calculateDifficulty(wordData.english),
                },
              });
            }

            // 关联单词到小节
            await tx.sectionWord.create({
              data: {
                sectionId: section.id,
                wordId: word.id,
                order: wordOrder++,
              },
            });

            totalWords++;
          }
        }
      }

      return {
        wordBank,
        statistics: {
          chapters: data.chapters.length,
          sections: data.chapters.reduce((sum, c) => sum + c.sections.length, 0),
          words: totalWords,
        },
      };
    });
  }

  /**
   * 根据单词长度计算难度
   */
  private calculateDifficulty(english: string): number {
    const length = english.length;
    if (length <= 4) return 1;
    if (length <= 6) return 2;
    if (length <= 8) return 3;
    if (length <= 10) return 4;
    return 5;
  }
}
