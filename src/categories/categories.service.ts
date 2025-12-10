import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { paginate, Pagination } from 'nestjs-typeorm-paginate';
import { Category } from './category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { QueryDto } from 'src/common/dto/query.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
  ) {}

  async create(dto: CreateCategoryDto): Promise<Category | null> {
    try {
      const category = this.categoryRepo.create(dto);
      return await this.categoryRepo.save(category);
    } catch (err) {
      console.error('Error creating category:', err);
      return null;
    }
  }

  async findAll(queryDto: QueryDto): Promise<Pagination<Category> | null> {
    try {
      const { page, limit, search, searchField, sort, order } = queryDto;
      const query = this.categoryRepo.createQueryBuilder('category');

      if (search) {
        if (searchField) {
          switch (searchField) {
            case 'name':
              query.where('category.name ILIKE :search', {
                search: `%${search}%`,
              });
              break;
            case 'description':
              query.where('category.description ILIKE :search', {
                search: `%${search}%`,
              });
              break;
            default:
              query.where(
                '(category.name ILIKE :search OR category.description ILIKE :search)',
                { search: `%${search}%` },
              );
          }
        } else {
          query.where(
            '(category.name ILIKE :search OR category.description ILIKE :search)',
            { search: `%${search}%` },
          );
        }
      }

      if (sort) {
        query.orderBy(`category.${sort}`, (order ?? 'ASC') as 'ASC' | 'DESC');
      }

      return await paginate<Category>(query, { page, limit });
    } catch (err) {
      console.error('Error retrieving categories:', err);
      return null;
    }
  }

  async findOne(id: string): Promise<Category | null> {
    try {
      return await this.categoryRepo.findOne({ where: { id } });
    } catch (err) {
      console.error('Error finding category:', err);
      return null;
    }
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<Category | null> {
    try {
      const category = await this.findOne(id);
      if (!category) return null;

      Object.assign(category, dto);
      return await this.categoryRepo.save(category);
    } catch (err) {
      console.error('Error updating category:', err);
      return null;
    }
  }

  async remove(id: string): Promise<Category | null> {
    try {
      const category = await this.findOne(id);
      if (!category) return null;

      return await this.categoryRepo.remove(category);
    } catch (err) {
      console.error('Error deleting category:', err);
      return null;
    }
  }
}
