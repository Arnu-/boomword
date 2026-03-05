import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CategoryService } from '../services/category.service';

@ApiTags('wordbanks')
@Controller('categories')
export class CategoryController {
  constructor(private categoryService: CategoryService) {}

  @Get()
  @ApiOperation({ summary: '获取分类列表' })
  async getCategories() {
    return this.categoryService.findAll();
  }
}
