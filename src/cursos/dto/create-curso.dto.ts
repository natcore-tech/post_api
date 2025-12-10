
import { IsNotEmpty, IsString, IsNumber, IsArray, IsDateString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateContenidoDto } from './create-contenido.dto';

class InstructorDto {
  @IsNotEmpty()
  @IsString()
  nombre: string;

  @IsNotEmpty()
  @IsString()
  email: string;
}

export class CreateCursoDto {
  @IsNotEmpty()
  @IsString()
  nombre: string;

  @IsNotEmpty()
  @IsString()
  descripcion: string;

  @IsNotEmpty()
  @IsString()
  categoria: string;

  @IsNotEmpty()
  @IsDateString()
  fecha_inicio: Date;

  @IsNotEmpty()
  @IsDateString()
  fecha_fin: Date;

  @IsNotEmpty()
  @IsString()
  nivel: string;

  @IsArray()
  @IsString({ each: true })
  requisitos: string[];

  @IsNotEmpty()
  @IsNumber()
  precio: number;

  @ValidateNested()
  @Type(() => InstructorDto)
  instructor: InstructorDto;

  @IsNumber()
  calificacion_promedio?: number;

  @IsString()
  estado?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateContenidoDto)
  contenidos: CreateContenidoDto[];
}
