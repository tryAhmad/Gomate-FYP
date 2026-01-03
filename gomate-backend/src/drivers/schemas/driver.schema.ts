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

  @Prop({ type: String })
  dateOfBirth?: string;

  @Prop({
    type: {
      url: { type: String },
      publicId: { type: String },
    },
  })
  profilePhoto?: {
    url: string;
    publicId: string;
  };

  @Prop({
    type: String,
    enum: ['active', 'inactive'],
    default: 'inactive',
  })
  status: 'active' | 'inactive';

  @Prop({
    type: String,
    enum: ['active', 'suspended'],
    default: 'active',
  })
  accountStatus: 'active' | 'suspended';

  @Prop({
    type: String,
    enum: ['paid', 'pending', 'overdue'],
    default: 'pending',
  })
  paymentStatus: 'paid' | 'pending' | 'overdue';

  @Prop({ type: Date, default: null })
  lastPaymentDate: Date;

  @Prop({ type: Date, default: () => new Date() })
  weekStartDate: Date;

  @Prop({
    type: {
      color: {
        type: String,
        required: false,
      },
      plate: {
        type: String,
        required: false,
      },
      capacity: {
        type: Number,
        required: false,
      },
      vehicleType: {
        type: String,
        required: false,
        enum: ['car', 'motorcycle', 'auto'],
      },
      company: {
        type: String,
        required: false,
      },
      model: {
        type: String,
        required: false,
      },
      images: [
        {
          url: { type: String },
          publicId: { type: String },
        },
      ],
    },
    required: false,
  })
  vehicle?: {
    color: string;
    plate: string;
    capacity: number;
    vehicleType: 'car' | 'motorcycle' | 'auto';
    company?: string;
    model?: string;
    images?: Array<{
      url: string;
      publicId: string;
    }>;
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
      required: false,
    },
  })
  location?: {
    type: 'Point';
    coordinates: [number, number];
  };

  @Prop({
    type: {
      cnic: {
        front: {
          url: { type: String },
          publicId: { type: String },
        },
        back: {
          url: { type: String },
          publicId: { type: String },
        },
      },
      selfieWithId: {
        url: { type: String },
        publicId: { type: String },
      },
      drivingLicense: {
        front: {
          url: { type: String },
          publicId: { type: String },
        },
        back: {
          url: { type: String },
          publicId: { type: String },
        },
      },
    },
  })
  documents?: {
    cnic?: {
      front?: {
        url: string;
        publicId: string;
      };
      back?: {
        url: string;
        publicId: string;
      };
    };
    selfieWithId?: {
      url: string;
      publicId: string;
    };
    drivingLicense?: {
      front?: {
        url: string;
        publicId: string;
      };
      back?: {
        url: string;
        publicId: string;
      };
    };
  };

  @Prop({
    type: String,
    enum: ['incomplete', 'pending', 'approved', 'rejected'],
    default: 'incomplete',
  })
  verificationStatus: 'incomplete' | 'pending' | 'approved' | 'rejected';

  @Prop({ type: String })
  rejectionReason?: string;
}

export const DriverSchema = SchemaFactory.createForClass(Driver);
// Sparse index allows documents without location field
DriverSchema.index({ location: '2dsphere' }, { sparse: true });
