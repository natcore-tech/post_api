jest.mock('nestjs-typeorm-paginate', () => ({
  paginate: jest.fn(),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SelectQueryBuilder } from 'typeorm';
import { paginate, Pagination } from 'nestjs-typeorm-paginate';

import { CategoriesService } from './categories.service';
import { Category } from './category.entity';
import { QueryDto } from 'src/common/dto/query.dto';

describe('CategoriesService', () => {
  let service: CategoriesService;

  let repo: {
    create: jest.Mock;
    save: jest.Mock;
    findOne: jest.Mock;
    remove: jest.Mock;
    createQueryBuilder: jest.Mock;
  };

  let qb: {
    where: jest.Mock;
    orderBy: jest.Mock;
  };

  const category: Category = {
    id: 'cat-1',
    name: 'General',
    description: 'Categoria general',
  } as any;

  beforeEach(async () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);

    qb = {
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
    };

    repo = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(qb),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        { provide: getRepositoryToken(Category), useValue: repo },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);

    jest.clearAllMocks();
    (paginate as jest.Mock).mockReset();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('create', () => {
    it('debe crear y guardar la categoría', async () => {
      repo.create.mockReturnValue(category);
      repo.save.mockResolvedValue(category);

      const result = await service.create({ name: 'General', description: 'Categoria general' } as any);

      expect(repo.create).toHaveBeenCalledWith({ name: 'General', description: 'Categoria general' });
      expect(repo.save).toHaveBeenCalledWith(category);
      expect(result).toEqual(category);
    });

    it('debe retornar null si ocurre error', async () => {
      repo.create.mockImplementationOnce(() => {
        throw new Error('create error');
      });

      const result = await service.create({ name: 'X' } as any);

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('debe buscar por name si searchField=name', async () => {
      const query: QueryDto = {
        page: 1,
        limit: 10,
        search: 'gen',
        searchField: 'name',
        sort: 'name',
        order: 'DESC',
      };

      const paginated: Pagination<Category> = {
        items: [category],
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

      expect(repo.createQueryBuilder).toHaveBeenCalledWith('category');
      expect(qb.where).toHaveBeenCalledWith('category.name ILIKE :search', { search: '%gen%' });
      expect(qb.orderBy).toHaveBeenCalledWith('category.name', 'DESC');
      expect(paginate).toHaveBeenCalledWith(qb as unknown as SelectQueryBuilder<Category>, { page: 1, limit: 10 });
      expect(result).toEqual(paginated);
    });

    it('debe buscar por description si searchField=description', async () => {
      const query: QueryDto = { page: 1, limit: 10, search: 'general', searchField: 'description' } as any;

      (paginate as jest.Mock).mockResolvedValue({
        items: [category],
        meta: { totalItems: 1, itemCount: 1, itemsPerPage: 10, totalPages: 1, currentPage: 1 },
      });

      await service.findAll(query);

      expect(qb.where).toHaveBeenCalledWith('category.description ILIKE :search', { search: '%general%' });
    });

    it('debe buscar por defecto si no viene searchField', async () => {
      const query: QueryDto = { page: 1, limit: 10, search: 'x' } as any;

      (paginate as jest.Mock).mockResolvedValue({
        items: [],
        meta: { totalItems: 0, itemCount: 0, itemsPerPage: 10, totalPages: 0, currentPage: 1 },
      });

      await service.findAll(query);

      expect(qb.where).toHaveBeenCalledWith(
        '(category.name ILIKE :search OR category.description ILIKE :search)',
        { search: '%x%' },
      );
    });

    it('debe ordenar ASC por defecto si sort viene y order no', async () => {
      const query: QueryDto = { page: 1, limit: 10, sort: 'name' } as any;

      (paginate as jest.Mock).mockResolvedValue({
        items: [],
        meta: { totalItems: 0, itemCount: 0, itemsPerPage: 10, totalPages: 0, currentPage: 1 },
      });

      await service.findAll(query);

      expect(qb.orderBy).toHaveBeenCalledWith('category.name', 'ASC');
    });

    it('debe retornar null si ocurre error', async () => {
      repo.createQueryBuilder.mockImplementationOnce(() => {
        throw new Error('qb error');
      });

      const result = await service.findAll({ page: 1, limit: 10 } as any);

      expect(result).toBeNull();
    });
  });

  describe('findOne', () => {
    it('debe retornar la categoría', async () => {
      repo.findOne.mockResolvedValue(category);

      const result = await service.findOne('cat-1');

      expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 'cat-1' } });
      expect(result).toEqual(category);
    });

    it('debe retornar null si ocurre error', async () => {
      repo.findOne.mockRejectedValueOnce(new Error('db error'));

      const result = await service.findOne('cat-1');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('debe retornar null si no existe', async () => {
      repo.findOne.mockResolvedValueOnce(null);

      const result = await service.update('no-id', { name: 'X' } as any);

      expect(result).toBeNull();
    });

    it('debe actualizar y guardar', async () => {
      const original = { ...category };
      repo.findOne.mockResolvedValueOnce(original);
      repo.save.mockResolvedValueOnce({ ...original, name: 'Nuevo' });

      const result = await service.update('cat-1', { name: 'Nuevo' } as any);

      expect(repo.save).toHaveBeenCalled();
      expect(result?.name).toBe('Nuevo');
    });

    it('debe retornar null si ocurre error', async () => {
      repo.findOne.mockRejectedValueOnce(new Error('db error'));

      const result = await service.update('cat-1', { name: 'X' } as any);

      expect(result).toBeNull();
    });
  });

  describe('remove', () => {
    it('debe retornar null si no existe', async () => {
      repo.findOne.mockResolvedValueOnce(null);

      const result = await service.remove('no-id');

      expect(result).toBeNull();
    });

    it('debe remover y retornar la categoría', async () => {
      repo.findOne.mockResolvedValueOnce({ ...category });
      repo.remove.mockResolvedValueOnce({ ...category });

      const result = await service.remove('cat-1');

      expect(repo.remove).toHaveBeenCalled();
      expect(result?.id).toBe('cat-1');
    });

    it('debe retornar null si ocurre error', async () => {
      repo.findOne.mockResolvedValueOnce({ ...category });
      repo.remove.mockRejectedValueOnce(new Error('remove error'));

      const result = await service.remove('cat-1');

      expect(result).toBeNull();
    });
  });
});
