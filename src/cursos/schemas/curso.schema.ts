
import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Contenido } from './contenido.schema';

@Schema({ timestamps: true })
export class Curso extends Document {
  @Prop({ required: true })
  nombre: string;

  @Prop({ required: true })
  descripcion: string;

  @Prop({ required: true })
  categoria: string;

  @Prop({ required: true })
  fecha_inicio: Date;

  @Prop({ required: true })
  fecha_fin: Date;

  @Prop({ required: true })
  nivel: string;

  @Prop({ required: true, default: [] })
  requisitos: string[];

  @Prop({ required: true })
  precio: number;

  @Prop({
    type: {
      nombre: { type: String, required: true },
      email: { type: String, required: true }
    },
    required: true
  })
  instructor: {
    nombre: string;
    email: string;
  };

  @Prop({ required: true, default: 0 })
  calificacion_promedio: number;

  @Prop({ required: true, default: 'activo' })
  estado: string;

  @Prop({ type: [Types.ObjectId], ref: 'Contenido', default: [] })
  contenidos: Types.ObjectId[];
}

export const CursoSchema = SchemaFactory.createForClass(Curso);
