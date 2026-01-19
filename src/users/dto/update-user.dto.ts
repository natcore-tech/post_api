import { IsEnum, IsOptional, IsString } from 'class-validator';
import { UserRole } from '../user-role.enum';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role: UserRole;
}