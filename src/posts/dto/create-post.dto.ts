import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreatePostDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  content: string;

  @IsUUID()
  categoryId: string;
}