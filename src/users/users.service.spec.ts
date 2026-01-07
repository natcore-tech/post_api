jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

jest.mock('nestjs-typeorm-paginate', () => ({
  paginate: jest.fn(),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SelectQueryBuilder } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { paginate, Pagination } from 'nestjs-typeorm-paginate';

import { UsersService } from './users.service';
import { User } from './user.entity';
import { QueryDto } from 'src/common/dto/query.dto';

describe('UsersService', () => {
  let service: UsersService;

  let repo: {
    create: jest.Mock;
    save: jest.Mock;
    findOne: jest.Mock;
    remove: jest.Mock;
    createQueryBuilder: jest.Mock;
  };

  let qb: {
    andWhere: jest.Mock;
    orderBy: jest.Mock;
  };

  const baseUser: User = {
    id: 'uuid-1',
    username: 'john',
    email: 'john@example.com',
    password: 'hashed',
    isActive: true,
    profile: null as unknown as string,
  };

  beforeEach(async () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);

    qb = {
      andWhere: jest.fn().mockReturnThis(),
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
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: repo,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);

    jest.clearAllMocks();
    (paginate as jest.Mock).mockReset();
    (bcrypt.hash as jest.Mock).mockReset();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('create', () => {
    it('debe hashear password, crear y guardar usuario', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-10');

      repo.create.mockReturnValue({ ...baseUser, password: 'hashed-10' });
      repo.save.mockResolvedValue({ ...baseUser, password: 'hashed-10' });

      const dto = {
        username: 'john',
        email: 'john@example.com',
        password: '123456',
      };

      const result = await service.create(dto as any);

      expect(bcrypt.hash).toHaveBeenCalledWith('123456', 10);
      expect(repo.create).toHaveBeenCalledWith({
        ...dto,
        password: 'hashed-10',
      });
      expect(repo.save).toHaveBeenCalled();
      expect(result).toEqual({ ...baseUser, password: 'hashed-10' });
    });

    it('debe retornar null si ocurre error', async () => {
      (bcrypt.hash as jest.Mock).mockRejectedValueOnce(new Error('hash error'));

      const result = await service.create({
        username: 'x',
        email: 'x@x.com',
        password: '123',
      } as any);

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('debe aplicar isActive, searchField=username, sort y llamar paginate', async () => {
      const query: QueryDto = {
        page: 1,
        limit: 10,
        search: 'jo',
        searchField: 'username',
        sort: 'username',
        order: 'DESC',
      };

      const paginated: Pagination<User> = {
        items: [baseUser],
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

      const result = await service.findAll(query, true);

      expect(repo.createQueryBuilder).toHaveBeenCalledWith('user');
      expect(qb.andWhere).toHaveBeenCalledWith('user.isActive = :isActive', {
        isActive: true,
      });
      expect(qb.andWhere).toHaveBeenCalledWith('user.username ILIKE :search', {
        search: '%jo%',
      });
      expect(qb.orderBy).toHaveBeenCalledWith('user.username', 'DESC');
      expect(paginate).toHaveBeenCalledWith(
        qb as unknown as SelectQueryBuilder<User>,
        { page: 1, limit: 10 },
      );
      expect(result).toEqual(paginated);
    });

    it('debe buscar por defecto si no viene searchField', async () => {
      const query: QueryDto = { page: 1, limit: 10, search: 'john' } as any;

      (paginate as jest.Mock).mockResolvedValue({
        items: [baseUser],
        meta: {
          totalItems: 1,
          itemCount: 1,
          itemsPerPage: 10,
          totalPages: 1,
          currentPage: 1,
        },
      });

      await service.findAll(query);

      expect(qb.andWhere).toHaveBeenCalledWith(
        '(user.username ILIKE :search OR user.email ILIKE :search)',
        { search: '%john%' },
      );
    });

    it('debe retornar null si ocurre error', async () => {
      repo.createQueryBuilder.mockImplementationOnce(() => {
        throw new Error('qb error');
      });

      const result = await service.findAll({ page: 1, limit: 10 } as any);

      expect(result).toBeNull();
    });
  });
});
