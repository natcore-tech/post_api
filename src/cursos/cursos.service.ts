
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Curso } from './schemas/curso.schema';
import { Contenido } from './schemas/contenido.schema';
import { CreateCursoDto } from './dto/create-curso.dto';

@Injectable()
export class CursosService {
  constructor(
    @InjectModel(Curso.name) private readonly cursoModel: Model<Curso>,
    @InjectModel(Contenido.name) private readonly contenidoModel: Model<Contenido>,
  ) {}

  async create(dto: CreateCursoDto): Promise<Curso | null> {
    try {
      const { contenidos, ...cursoData } = dto;
      const curso = new this.cursoModel(cursoData);

      if (contenidos && contenidos.length > 0) {
        const contenidosIds: Types.ObjectId[] = [];

        // Crear los contenidos uno por uno
        for (const contenido of contenidos) {
          // Filtramos solo los campos necesarios para `Contenido`
          const contenidoData = {
            titulo: contenido.titulo,
            duracion: contenido.duracion,
            descripcion: contenido.descripcion,
            tipo: contenido.tipo,
            enlace: contenido.enlace,
            dificultad: contenido.dificultad,
            fecha_publicacion: contenido.fecha_publicacion,
            completado: contenido.completado,
            tiempo_estimado: contenido.tiempo_estimado,
            video_id: contenido.video_id,
          };
          let contenidoEntity: Contenido;
          try {
            contenidoEntity = new this.contenidoModel(contenidoData);
            contenidoEntity.save();
            contenidosIds.push(contenidoEntity._id as Types.ObjectId);  // Especificamos que _id es un ObjectId
          } catch (error) {
            console.error('Error al crear contenido:', error);
          }
        }
        curso.contenidos = contenidosIds;
        
      }
      const savedCurso = await curso.save();
      return savedCurso;
    } catch (err) {
      console.error('Error creando curso:', err);
      return null;
    }
  }

  async findAll(options: { page: number, limit: number }): Promise<any | null> {
    try {
      const { page, limit } = options;
      const cursos = await this.cursoModel.find()
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('contenidos');

      return { items: cursos, page, limit };
    } catch (err) {
      console.error('Error retrieving courses:', err);
      return null;
    }
  }

  async findOne(id: string): Promise<Curso | null> {
    try {
      return await this.cursoModel.findById(id).populate('contenidos');
    } catch (err) {
      console.error('Error finding course:', err);
      return null;
    }
  }

  async update(id: string, dto: CreateCursoDto): Promise<Curso | null> {
    try {
      const curso = await this.findOne(id);
      if (!curso) return null;

      // Actualizar los campos del curso
      Object.assign(curso, dto);

      if (dto.contenidos) {
        // Crear los contenidos y los asociamos con el curso
        const contenidosIds: Types.ObjectId[] = [];
        for (const contenido of dto.contenidos) {
          const contenidoData = {
            titulo: contenido.titulo,
            duracion: contenido.duracion,
            descripcion: contenido.descripcion,
            tipo: contenido.tipo,
            enlace: contenido.enlace,
            dificultad: contenido.dificultad,
            fecha_publicacion: contenido.fecha_publicacion,
            completado: contenido.completado,
            tiempo_estimado: contenido.tiempo_estimado,
            video_id: contenido.video_id,
          };

          const contenidoEntity = await this.contenidoModel.create(contenidoData);
          contenidosIds.push(contenidoEntity._id as Types.ObjectId);
        }
        curso.contenidos = contenidosIds;
      }
      return await curso.save();
    } catch (err) {
      console.error('Error updating course:', err);
      return null;
    }
  }

  async remove(id: string): Promise<Curso | null> {
    try {
      const curso = await this.findOne(id);
      if (!curso) return null;

      return await curso.deleteOne();  // Cambié de `remove` a `deleteOne`
    } catch (err) {
      console.error('Error deleting course:', err);
      return null;
    }
  }
}
