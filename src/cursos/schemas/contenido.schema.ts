
import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Contenido extends Document {
  @Prop({ required: true })
  titulo: string;

  @Prop({ required: true })
  duracion: number;

  @Prop({ required: true })
  descripcion: string;

  @Prop({ required: true })
  tipo: string;

  @Prop({ required: true })
  enlace: string;

  @Prop({ required: true })
  dificultad: string;

  @Prop({ required: true })
  fecha_publicacion: Date;

  @Prop({ required: true, default: false })
  completado: boolean;

  @Prop({ required: true })
  tiempo_estimado: string;

  @Prop({ required: true })
  video_id: string;
}

export const ContenidoSchema = SchemaFactory.createForClass(Contenido);
