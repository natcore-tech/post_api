import {
  Controller, Get, Post, Put, Delete,
  Param, Body, Query, NotFoundException, InternalServerErrorException
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Pagination } from 'nestjs-typeorm-paginate';
import { Category } from './category.entity';
import { SuccessResponseDto } from 'src/common/dto/response.dto';
import { QueryDto } from 'src/common/dto/query.dto';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  async create(@Body() dto: CreateCategoryDto) {
    const category = await this.categoriesService.create(dto);
    if (!category) throw new InternalServerErrorException('Failed to create category');
    return new SuccessResponseDto('Category created successfully', category);
  }

  @Get()
  async findAll(
    @Query() query: QueryDto,
  ): Promise<SuccessResponseDto<Pagination<Category>>> {
    if (query.limit && query.limit > 100) {
      query.limit = 100;
    }

    const result = await this.categoriesService.findAll(query);

    if (!result) throw new InternalServerErrorException('Could not retrieve categories');

    return new SuccessResponseDto('Categories retrieved successfully', result);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const category = await this.categoriesService.findOne(id);
    if (!category) throw new NotFoundException('Category not found');
    return new SuccessResponseDto('Category retrieved successfully', category);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    const category = await this.categoriesService.update(id, dto);
    if (!category) throw new NotFoundException('Category not found');
    return new SuccessResponseDto('Category updated successfully', category);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const category = await this.categoriesService.remove(id);
    if (!category) throw new NotFoundException('Category not found');
    return new SuccessResponseDto('Category deleted successfully', category);
  }
}
