import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Role } from 'src/common/enums/roles.enum';

export type DriverDocument = Driver & Document & { _id: Types.ObjectId };

@Schema({ timestamps: true })
export class Driver {
  @Prop({ type: String })
  socketId?: string;

  @Prop({
    type: {
      firstname: {
        type: String,
        required: true,
        minlength: [3, 'Firstname must be at least 3 characters long'],
      },
      lastname: {
        type: String,
        minlength: [3, 'Lastname must be at least 3 characters long'],
      },
    },
  })
  fullname: {
    firstname: string;
    lastname?: string;
  };

  @Prop({
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
  })
  email: string;

  @Prop({
    type: String,
    required: true,
    select: false,
  })
  password: string;


  @Prop({
    type: String,
    required: true,
  })
  phoneNumber: string;

  @Prop({
    type: String,
    enum: ['active', 'inactive'],
    default: 'inactive',
  })
  status: 'active' | 'inactive';

  @Prop({
    type: {
      color: {
        type: String,
        required: true,
        minlength: [3, 'Color must be at least 3 characters long'],
      },
      plate: {
        type: String,
        required: true,
        minlength: [3, 'Plate must be at least 3 characters long'],
      },
      capacity: {
        type: Number,
        required: true,
        min: [1, 'Capacity must be at least 1'],
      },
      vehicleType: {
        type: String,
        required: true,
        enum: ['car', 'motorcycle', 'auto'],
      },
      company: {
        type: String,
        required: false, // 👈 make optional if not always needed
      },
      model: {
        type: String,
        required: false,
      },
    },
  })
  vehicle: {
    color: string;
    plate: string;
    capacity: number;
    vehicleType: 'car' | 'motorcycle' | 'auto';
    company?: string;
    model?: string;
  };

  @Prop({ required: true, enum: Role, default: Role.Driver })
  role: Role;

  @Prop({
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number],
      required: true,
    },
  })
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
}

export const DriverSchema = SchemaFactory.createForClass(Driver);
DriverSchema.index({ location: '2dsphere' });
