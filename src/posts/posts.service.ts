import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { paginate, Pagination } from 'nestjs-typeorm-paginate';
import { Repository } from 'typeorm';
import { Post } from './post.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { Category } from '../categories/category.entity';
import { QueryDto } from 'src/common/dto/query.dto';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private postsRepository: Repository<Post>,
    @InjectRepository(Category)
    private categoriesRepository: Repository<Category>,
  ) {}

  async create(createPostDto: CreatePostDto): Promise<Post | null> {
    try {
      const category = await this.categoriesRepository.findOne({ where: { id: createPostDto.categoryId } });
      if (!category) return null;

      const post = this.postsRepository.create({
        title: createPostDto.title,
        content: createPostDto.content,
        category: category,
      });

      return await this.postsRepository.save(post);
    } catch (err) {
      console.error('Error creating post:', err);
      return null;
    }
  }

  async findAll(queryDto: QueryDto): Promise<Pagination<Post> | null> {
    try {
      const { page, limit, search, searchField, sort, order } = queryDto;
      const queryBuilder = this.postsRepository.createQueryBuilder('post')
        .leftJoinAndSelect('post.category', 'category');

      if (search) {
        if (searchField) {
          switch (searchField) {
            case 'title':
              queryBuilder.where('post.title ILIKE :search', {
                search: `%${search}%`,
              });
              break;
            case 'content':
              queryBuilder.where('post.content ILIKE :search', {
                search: `%${search}%`,
              });
              break;
            case 'category':
              queryBuilder.where('category.name ILIKE :search', {
                search: `%${search}%`,
              });
              break;
            default:
              queryBuilder.where(
                '(post.title ILIKE :search OR post.content ILIKE :search OR category.name ILIKE :search)',
                { search: `%${search}%` },
              );
          }
        } else {
          queryBuilder.where(
            '(post.title ILIKE :search OR post.content ILIKE :search OR category.name ILIKE :search)',
            { search: `%${search}%` },
          );
        }
      }

      if (sort) {
        queryBuilder.orderBy(`post.${sort}`, (order ?? 'ASC') as 'ASC' | 'DESC');
      }

      return await paginate<Post>(queryBuilder, { page, limit });
    } catch (err) {
      console.error('Error fetching posts:', err);
      return null;
    }
  }

  async findOne(id: string): Promise<Post | null> {
    try {
      return await this.postsRepository.findOne({ where: { id }, relations: ['category'] });
    } catch (err) {
      console.error('Error fetching post:', err);
      return null;
    }
  }

  async update(id: string, dto: CreatePostDto): Promise<Post | null> {
    try {
      const post = await this.findOne(id);
      if (!post) return null;

      if (dto.categoryId) {
        const category = await this.categoriesRepository.findOne({ where: { id: dto.categoryId } });
        if (!category) return null;
        post.category = category;
      }

      post.title = dto.title ?? post.title;
      post.content = dto.content ?? post.content;

      return await this.postsRepository.save(post);
    } catch (err) {
      console.error('Error updating post:', err);
      return null;
    }
  }

  async remove(id: string): Promise<boolean> {
    try {
      const result = await this.postsRepository.delete(id);
      return result.affected !== 0;
    } catch (err) {
      console.error('Error deleting post:', err);
      return false;
    }
  }
}
