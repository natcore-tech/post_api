jest.mock('nestjs-typeorm-paginate', () => ({
  paginate: jest.fn(),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SelectQueryBuilder } from 'typeorm';
import { paginate, Pagination } from 'nestjs-typeorm-paginate';

import { PostsService } from './posts.service';
import { Post } from './post.entity';
import { Category } from '../categories/category.entity';
import { QueryDto } from 'src/common/dto/query.dto';

describe('PostsService', () => {
  let service: PostsService;

  let postsRepo: {
    create: jest.Mock;
    save: jest.Mock;
    findOne: jest.Mock;
    delete: jest.Mock;
    createQueryBuilder: jest.Mock;
  };

  let categoriesRepo: {
    findOne: jest.Mock;
  };

  let qb: {
    leftJoinAndSelect: jest.Mock;
    where: jest.Mock;
    orderBy: jest.Mock;
  };

  const category: Category = {
    id: 'cat-1',
    name: 'General',
    description: 'Categoria general',
  } as any;

  const post: Post = {
    id: 'post-1',
    title: 'Titulo',
    content: 'Contenido',
    category,
  } as any;

  beforeEach(async () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);

    qb = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
    };

    postsRepo = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      delete: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(qb),
    };

    categoriesRepo = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        { provide: getRepositoryToken(Post), useValue: postsRepo },
        { provide: getRepositoryToken(Category), useValue: categoriesRepo },
      ],
    }).compile();

    service = module.get<PostsService>(PostsService);

    jest.clearAllMocks();
    (paginate as jest.Mock).mockReset();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('create', () => {
    it('debe retornar null si la categoria no existe', async () => {
      categoriesRepo.findOne.mockResolvedValueOnce(null);

      const result = await service.create({ title: 'T', content: 'C', categoryId: 'no-cat' } as any);

      expect(categoriesRepo.findOne).toHaveBeenCalledWith({ where: { id: 'no-cat' } });
      expect(result).toBeNull();
    });

    it('debe crear y guardar el post si la categoria existe', async () => {
      categoriesRepo.findOne.mockResolvedValueOnce(category);

      postsRepo.create.mockReturnValue(post);
      postsRepo.save.mockResolvedValue(post);

      const dto = { title: 'Titulo', content: 'Contenido', categoryId: 'cat-1' };

      const result = await service.create(dto as any);

      expect(categoriesRepo.findOne).toHaveBeenCalledWith({ where: { id: 'cat-1' } });
      expect(postsRepo.create).toHaveBeenCalledWith({
        title: 'Titulo',
        content: 'Contenido',
        category,
      });
      expect(postsRepo.save).toHaveBeenCalledWith(post);
      expect(result).toEqual(post);
    });

    it('debe retornar null si ocurre error', async () => {
      categoriesRepo.findOne.mockRejectedValueOnce(new Error('db error'));

      const result = await service.create({ title: 'T', content: 'C', categoryId: 'cat-1' } as any);

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('debe buscar por title si searchField=title', async () => {
      const query: QueryDto = {
        page: 1,
        limit: 10,
        search: 'tit',
        searchField: 'title',
        sort: 'title',
        order: 'DESC',
      };

      const paginated: Pagination<Post> = {
        items: [post],
        meta: {
          totalItems: 1,
          itemCount: 1,
          itemsPerPage: 10,
          totalPages: 1,
          currentPage: 1,
        } as any,
        links: {} as any,
      };

      (paginate as jest.Mock).mockResolvedValue(paginated);

      const result = await service.findAll(query);

      expect(postsRepo.createQueryBuilder).toHaveBeenCalledWith('post');
      expect(qb.leftJoinAndSelect).toHaveBeenCalledWith('post.category', 'category');
      expect(qb.where).toHaveBeenCalledWith('post.title ILIKE :search', { search: '%tit%' });
      expect(qb.orderBy).toHaveBeenCalledWith('post.title', 'DESC');
      expect(paginate).toHaveBeenCalledWith(qb as unknown as SelectQueryBuilder<Post>, { page: 1, limit: 10 });
      expect(result).toEqual(paginated);
    });

    it('debe buscar por category si searchField=category', async () => {
      const query: QueryDto = { page: 1, limit: 10, search: 'gen', searchField: 'category' } as any;

      (paginate as jest.Mock).mockResolvedValue({
        items: [post],
        meta: { totalItems: 1, itemCount: 1, itemsPerPage: 10, totalPages: 1, currentPage: 1 },
      });

      await service.findAll(query);

      expect(qb.where).toHaveBeenCalledWith('category.name ILIKE :search', { search: '%gen%' });
    });

    it('debe buscar por defecto si no viene searchField', async () => {
      const query: QueryDto = { page: 1, limit: 10, search: 'x' } as any;

      (paginate as jest.Mock).mockResolvedValue({
        items: [],
        meta: { totalItems: 0, itemCount: 0, itemsPerPage: 10, totalPages: 0, currentPage: 1 },
      });

      await service.findAll(query);

      expect(qb.where).toHaveBeenCalledWith(
        '(post.title ILIKE :search OR post.content ILIKE :search OR category.name ILIKE :search)',
        { search: '%x%' },
      );
    });

    it('debe ordenar ASC por defecto si sort viene y order no', async () => {
      const query: QueryDto = { page: 1, limit: 10, sort: 'title' } as any;

      (paginate as jest.Mock).mockResolvedValue({
        items: [],
        meta: { totalItems: 0, itemCount: 0, itemsPerPage: 10, totalPages: 0, currentPage: 1 },
      });

      await service.findAll(query);

      expect(qb.orderBy).toHaveBeenCalledWith('post.title', 'ASC');
    });

    it('debe retornar null si ocurre error', async () => {
      postsRepo.createQueryBuilder.mockImplementationOnce(() => {
        throw new Error('qb error');
      });

      const result = await service.findAll({ page: 1, limit: 10 } as any);

      expect(result).toBeNull();
    });
  });

  describe('findOne', () => {
    it('debe retornar el post con relations category', async () => {
      postsRepo.findOne.mockResolvedValueOnce(post);

      const result = await service.findOne('post-1');

      expect(postsRepo.findOne).toHaveBeenCalledWith({ where: { id: 'post-1' }, relations: ['category'] });
      expect(result).toEqual(post);
    });

    it('debe retornar null si ocurre error', async () => {
      postsRepo.findOne.mockRejectedValueOnce(new Error('db error'));

      const result = await service.findOne('post-1');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('debe retornar null si no existe el post', async () => {
      postsRepo.findOne.mockResolvedValueOnce(null);

      const result = await service.update('no-id', { title: 'X' } as any);

      expect(result).toBeNull();
    });

    it('debe retornar null si categoryId viene y categoria no existe', async () => {
      postsRepo.findOne.mockResolvedValueOnce({ ...post });
      categoriesRepo.findOne.mockResolvedValueOnce(null);

      const result = await service.update('post-1', { categoryId: 'no-cat' } as any);

      expect(categoriesRepo.findOne).toHaveBeenCalledWith({ where: { id: 'no-cat' } });
      expect(result).toBeNull();
    });

    it('debe actualizar title/content y guardar (sin cambiar categoria)', async () => {
      postsRepo.findOne.mockResolvedValueOnce({ ...post });
      postsRepo.save.mockResolvedValueOnce({ ...post, title: 'Nuevo', content: 'NuevoC' });

      const result = await service.update('post-1', { title: 'Nuevo', content: 'NuevoC' } as any);

      expect(postsRepo.save).toHaveBeenCalled();
      expect(result?.title).toBe('Nuevo');
      expect(result?.content).toBe('NuevoC');
    });

    it('debe cambiar categoria si categoryId es válido', async () => {
      const otherCategory = { ...category, id: 'cat-2', name: 'Otra' } as any;

      postsRepo.findOne.mockResolvedValueOnce({ ...post });
      categoriesRepo.findOne.mockResolvedValueOnce(otherCategory);

      postsRepo.save.mockResolvedValueOnce({ ...post, category: otherCategory });

      const result = await service.update('post-1', { categoryId: 'cat-2' } as any);

      expect(categoriesRepo.findOne).toHaveBeenCalledWith({ where: { id: 'cat-2' } });
      expect(postsRepo.save).toHaveBeenCalled();
      expect(result?.category.id).toBe('cat-2');
    });

    it('debe retornar null si ocurre error', async () => {
      postsRepo.findOne.mockRejectedValueOnce(new Error('db error'));

      const result = await service.update('post-1', { title: 'X' } as any);

      expect(result).toBeNull();
    });
  });

  describe('remove', () => {
    it('debe devolver true si affected != 0', async () => {
      postsRepo.delete.mockResolvedValueOnce({ affected: 1 });

      const result = await service.remove('post-1');

      expect(postsRepo.delete).toHaveBeenCalledWith('post-1');
      expect(result).toBe(true);
    });

    it('debe devolver false si affected == 0', async () => {
      postsRepo.delete.mockResolvedValueOnce({ affected: 0 });

      const result = await service.remove('post-1');

      expect(result).toBe(false);
    });

    it('debe devolver false si ocurre error', async () => {
      postsRepo.delete.mockRejectedValueOnce(new Error('delete error'));

      const result = await service.remove('post-1');

      expect(result).toBe(false);
    });
  });
});
