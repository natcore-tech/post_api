import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { QueryDto } from '../common/dto/query.dto';

describe('UsersController', () => {
  let controller: UsersController;
  let service: jest.Mocked<UsersService>;

  const user = {
    id: 'uuid-1',
    username: 'john',
    email: 'john@example.com',
    password: 'hashed',
    isActive: true,
    profile: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            create: jest.fn().mockResolvedValue(user),
            findAll: jest.fn().mockResolvedValue({
              items: [user],
              meta: {
                totalItems: 1,
                itemCount: 1,
                itemsPerPage: 10,
                totalPages: 1,
                currentPage: 1,
              },
            }),
            findOne: jest.fn().mockResolvedValue(user),
            update: jest.fn().mockResolvedValue(user),
            remove: jest.fn().mockResolvedValue(user),
            updateProfile: jest.fn().mockResolvedValue(user),
          },
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get(UsersService);
    jest.clearAllMocks();
  });

  it('create debe retornar SuccessResponseDto', async () => {
    const response = await controller.create({
      username: 'john',
      email: 'john@example.com',
      password: '123456',
    } as any);
    expect(response?.success).toBe(true);
    expect(response?.data?.username).toBe('john');
  });

  describe('findAll', () => {
    it('debe retornar lista paginada', async () => {
      const query: QueryDto = { page: 1, limit: 10 } as any;
      const response = await controller.findAll(query, 'true');
      expect(response?.success).toBe(true);
      expect(service.findAll).toHaveBeenCalledWith(query, true);
    });

    it('si limit > 100, debe recortarlo a 100', async () => {
      const query: QueryDto = { page: 1, limit: 1000 } as any;
      await controller.findAll(query, 'true');
      expect(service.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 100 }),
        true,
      );
    });

    it('debe lanzar BadRequestException si isActive es inválido', async () => {
      const query: QueryDto = { page: 1, limit: 10 } as any;
      await expect(controller.findAll(query, 'yes')).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(service.findAll).not.toHaveBeenCalled();
    });

    it('debe lanzar InternalServerErrorException si service retorna null', async () => {
      service.findAll.mockResolvedValueOnce(null as any);
      const query: QueryDto = { page: 1, limit: 10 } as any;
      await expect(controller.findAll(query, 'true')).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
    });
  });

  it('findOne debe lanzar NotFoundException si no existe', async () => {
    service.findOne.mockResolvedValueOnce(null as any);
    await expect(controller.findOne('no-id')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('remove debe lanzar NotFoundException si no existe', async () => {
    service.remove.mockResolvedValueOnce(null as any);
    await expect(controller.remove('no-id')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('update debe lanzar NotFoundException si no existe', async () => {
    service.update.mockResolvedValueOnce(null as any);
    await expect(
      controller.update('no-id', { email: 'x@y.com' } as any),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  describe('uploadProfile', () => {
    it('debe lanzar BadRequestException si no hay archivo', async () => {
      await expect(
        controller.uploadProfile('uuid-1', undefined as any),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('debe lanzar NotFoundException si no existe el usuario', async () => {
      service.updateProfile.mockResolvedValueOnce(null as any);
      await expect(
        controller.uploadProfile('no-id', { filename: 'img.png' } as any),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('debe retornar SuccessResponseDto si actualiza profile', async () => {
      const response = await controller.uploadProfile('uuid-1', {
        filename: 'img.png',
      } as any);
      expect(response?.success).toBe(true);
      expect(service.updateProfile).toHaveBeenCalledWith('uuid-1', 'img.png');
    });
  });
});
