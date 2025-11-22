import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ServiceFeeDocument = ServiceFee & Document;

@Schema({ timestamps: true })
export class ServiceFee {
  @Prop({
    required: true,
    unique: true,
    enum: ['car', 'motorcycle', 'auto'],
    type: String,
  })
  vehicleType: 'car' | 'motorcycle' | 'auto';

  @Prop({ required: true, min: 0 })
  weeklyFee: number;

  @Prop({ default: true })
  isActive: boolean;
}

export const ServiceFeeSchema = SchemaFactory.createForClass(ServiceFee);
