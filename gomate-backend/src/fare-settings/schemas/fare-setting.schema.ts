import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type FareSettingDocument = FareSetting & Document;

@Schema({ timestamps: true })
export class FareSetting {
  @Prop({
    required: true,
    unique: true,
    enum: ['auto', 'car', 'bike'],
    type: String,
  })
  rideType: 'auto' | 'car' | 'bike';

  @Prop({ required: true, min: 0 })
  baseFare: number;

  @Prop({ required: true, min: 0 })
  perKmRate: number;

  @Prop({ required: true, min: 0 })
  perMinuteRate: number;
}

export const FareSettingSchema = SchemaFactory.createForClass(FareSetting);
