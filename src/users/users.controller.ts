import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  BadRequestException,
  NotFoundException,
  UseInterceptors,
  UploadedFile,
  InternalServerErrorException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { SuccessResponseDto } from '../common/dto/response.dto';
import { Pagination } from 'nestjs-typeorm-paginate';
import { User } from './user.entity';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { QueryDto } from '../common/dto/query.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async create(@Body() dto: CreateUserDto) {
    const user = await this.usersService.create(dto);
    return new SuccessResponseDto('User created successfully', user);
  }

  @Get()
  async findAll(
    @Query() query: QueryDto,
    @Query('isActive') isActive?: string,
  ): Promise<SuccessResponseDto<Pagination<User>>> {
    if (query.limit && query.limit > 100) {
      query.limit = 100;
    }

    if (isActive !== undefined && isActive !== 'true' && isActive !== 'false') {
      throw new BadRequestException(
        'Invalid value for "isActive". Use "true" or "false".',
      );
    }

    const result = await this.usersService.findAll(query, isActive === 'true');

    if (!result)
      throw new InternalServerErrorException('Could not retrieve users');

    return new SuccessResponseDto('Users retrieved successfully', result);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findOne(id);
    if (!user) throw new NotFoundException('User not found');
    return new SuccessResponseDto('User retrieved successfully', user);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    const user = await this.usersService.update(id, dto);
    if (!user) throw new NotFoundException('User not found');
    return new SuccessResponseDto('User updated successfully', user);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const user = await this.usersService.remove(id);
    if (!user) throw new NotFoundException('User not found');
    return new SuccessResponseDto('User deleted successfully', user);
  }

  @Put(':id/profile')
  @UseInterceptors(
    FileInterceptor('profile', {
      storage: diskStorage({
        destination: './public/profile',
        filename: (req, file, cb) =>
          cb(null, `${Date.now()}-${file.originalname}`),
      }),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png)$/)) {
          return cb(
            new BadRequestException('Only JPG or PNG files are allowed'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async uploadProfile(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Profile image is required');
    const user = await this.usersService.updateProfile(id, file.filename);
    if (!user) throw new NotFoundException('User not found');
    return new SuccessResponseDto('Profile image updated', user);
  }
}
