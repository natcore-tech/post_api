import { Test, TestingModule } from '@nestjs/testing';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import {
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { QueryDto } from 'src/common/dto/query.dto';

describe('PostsController', () => {
  let controller: PostsController;
  let service: jest.Mocked<PostsService>;

  const post = {
    id: 'post-1',
    title: 'Titulo',
    content: 'Contenido',
    category: { id: 'cat-1', name: 'General' },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PostsController],
      providers: [
        {
          provide: PostsService,
          useValue: {
            create: jest.fn().mockResolvedValue(post),
            findAll: jest.fn().mockResolvedValue({
              items: [post],
              meta: { totalItems: 1, itemCount: 1, itemsPerPage: 10, totalPages: 1, currentPage: 1 },
            }),
            findOne: jest.fn().mockResolvedValue(post),
            update: jest.fn().mockResolvedValue(post),
            remove: jest.fn().mockResolvedValue(true),
          },
        },
      ],
    }).compile();

    controller = module.get<PostsController>(PostsController);
    service = module.get(PostsService);
    jest.clearAllMocks();
  });

  it('create debe retornar SuccessResponseDto', async () => {
    const response = await controller.create({ title: 'Titulo', content: 'Contenido', categoryId: 'cat-1' } as any);
    expect(response?.success).toBe(true);
    expect(response?.data?.title).toBe('Titulo');
  });

  it('create debe lanzar NotFoundException si service retorna null', async () => {
    service.create.mockResolvedValueOnce(null as any);
    await expect(controller.create({ title: 'T', content: 'C', categoryId: 'no-cat' } as any)).rejects.toBeInstanceOf(NotFoundException);
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

  it('update debe lanzar NotFoundException si no existe o categoria no valida', async () => {
    service.update.mockResolvedValueOnce(null as any);
    await expect(controller.update('no-id', { title: 'X' } as any)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('remove debe lanzar NotFoundException si no se puede borrar', async () => {
    service.remove.mockResolvedValueOnce(false as any);
    await expect(controller.remove('post-1')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('remove debe retornar SuccessResponseDto con id', async () => {
    const response = await controller.remove('post-1');
    expect(response?.success).toBe(true);
    expect(response?.data).toBe('post-1');
  });
});
