
import {
  Controller, Get, Post, Put, Delete, Param, Body, Query, NotFoundException, InternalServerErrorException
} from '@nestjs/common';
import { CursosService } from './cursos.service';
import { CreateCursoDto } from './dto/create-curso.dto';
import { SuccessResponseDto } from 'src/common/dto/response.dto';

@Controller('cursos')
export class CursosController {
  constructor(private readonly cursosService: CursosService) {}

  @Post()
  async create(@Body() dto: CreateCursoDto) {
    const curso = await this.cursosService.create(dto);
    if (!curso) throw new InternalServerErrorException('Failed to create course');
    return new SuccessResponseDto('Course created successfully', curso);
  }

  @Get()
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ): Promise<SuccessResponseDto<any>> {
    const result = await this.cursosService.findAll({ page, limit });
    if (!result) throw new InternalServerErrorException('Could not retrieve courses');
    return new SuccessResponseDto('Courses retrieved successfully', result);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const curso = await this.cursosService.findOne(id);
    if (!curso) throw new NotFoundException('Course not found');
    return new SuccessResponseDto('Course retrieved successfully', curso);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: CreateCursoDto) {
    const curso = await this.cursosService.update(id, dto);
    if (!curso) throw new NotFoundException('Course not found');
    return new SuccessResponseDto('Course updated successfully', curso);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const curso = await this.cursosService.remove(id);
    if (!curso) throw new NotFoundException('Course not found');
    return new SuccessResponseDto('Course deleted successfully', curso);
  }
}
