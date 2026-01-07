import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import {
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { QueryDto } from 'src/common/dto/query.dto';

describe('CategoriesController', () => {
  let controller: CategoriesController;
  let service: jest.Mocked<CategoriesService>;

  const category = {
    id: 'cat-1',
    name: 'General',
    description: 'Categoria general',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoriesController],
      providers: [
        {
          provide: CategoriesService,
          useValue: {
            create: jest.fn().mockResolvedValue(category),
            findAll: jest.fn().mockResolvedValue({
              items: [category],
              meta: { totalItems: 1, itemCount: 1, itemsPerPage: 10, totalPages: 1, currentPage: 1 },
            }),
            findOne: jest.fn().mockResolvedValue(category),
            update: jest.fn().mockResolvedValue(category),
            remove: jest.fn().mockResolvedValue(category),
          },
        },
      ],
    }).compile();

    controller = module.get<CategoriesController>(CategoriesController);
    service = module.get(CategoriesService);
    jest.clearAllMocks();
  });

  it('create debe retornar SuccessResponseDto', async () => {
    const response = await controller.create({ name: 'General', description: 'Categoria general' } as any);
    expect(response?.success).toBe(true);
    expect(response?.data?.name).toBe('General');
  });

  it('create debe lanzar InternalServerErrorException si falla', async () => {
    service.create.mockResolvedValueOnce(null as any);
    await expect(controller.create({ name: 'X' } as any)).rejects.toBeInstanceOf(InternalServerErrorException);
  });

  describe('findAll', () => {
    it('findAll debe retornar lista paginada', async () => {
      const query: QueryDto = { page: 1, limit: 10 } as any;
      const response = await controller.findAll(query);
      expect(response?.success).toBe(true);
      expect(response?.data?.items?.length).toBe(1);
      expect(service.findAll).toHaveBeenCalledWith(query);
    });

    it('si limit > 100, debe recortarlo a 100', async () => {
      const query: QueryDto = { page: 1, limit: 1000 } as any;
      await controller.findAll(query);
      expect(service.findAll).toHaveBeenCalledWith(expect.objectContaining({ limit: 100 }));
    });

    it('findAll debe lanzar InternalServerErrorException si service retorna null', async () => {
      service.findAll.mockResolvedValueOnce(null as any);
      const query: QueryDto = { page: 1, limit: 10 } as any;
      await expect(controller.findAll(query)).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });

  it('findOne debe lanzar NotFoundException si no existe', async () => {
    service.findOne.mockResolvedValueOnce(null as any);
    await expect(controller.findOne('no-id')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('update debe lanzar NotFoundException si no existe', async () => {
    service.update.mockResolvedValueOnce(null as any);
    await expect(controller.update('no-id', { name: 'X' } as any)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('remove debe lanzar NotFoundException si no existe', async () => {
    service.remove.mockResolvedValueOnce(null as any);
    await expect(controller.remove('no-id')).rejects.toBeInstanceOf(NotFoundException);
  });
});
