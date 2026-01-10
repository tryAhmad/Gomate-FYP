import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Role } from 'src/common/enums/roles.enum';

export type PassengerDocument = Passenger & Document;

@Schema({ timestamps: true })
export class Passenger {
  @Prop({ required: true })
  username: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  phoneNumber: string;

  @Prop({ required: true, enum: ['male', 'female', 'other'] })
  gender: string;

  @Prop({ required: true, enum: Role, default: Role.Passenger })
  role: Role;

  @Prop({ default: null })
  profilePicture: string;
}

export const PassengerSchema = SchemaFactory.createForClass(Passenger);
