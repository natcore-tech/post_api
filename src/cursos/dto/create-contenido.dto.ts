
import { IsNotEmpty, IsString, IsNumber, IsBoolean, IsDateString } from 'class-validator';

export class CreateContenidoDto {
  @IsNotEmpty()
  @IsString()
  titulo: string;

  @IsNotEmpty()
  @IsNumber()
  duracion: number;

  @IsNotEmpty()
  @IsString()
  descripcion: string;

  @IsNotEmpty()
  @IsString()
  tipo: string;

  @IsNotEmpty()
  @IsString()
  enlace: string;

  @IsNotEmpty()
  @IsString()
  dificultad: string;

  @IsNotEmpty()
  @IsDateString()
  fecha_publicacion: Date;

  @IsNotEmpty()
  @IsBoolean()
  completado: boolean;

  @IsNotEmpty()
  @IsString()
  tiempo_estimado: string;

  @IsNotEmpty()
  @IsString()
  video_id: string;
}
