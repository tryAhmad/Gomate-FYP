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
      images: [
        {
          url: { type: String },
          publicId: { type: String },
        },
      ],
    },
  })
  vehicle: {
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
      required: true,
    },
  })
  location: {
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
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  })
  verificationStatus: 'pending' | 'approved' | 'rejected';

  @Prop({ type: String })
  rejectionReason?: string;
}

export const DriverSchema = SchemaFactory.createForClass(Driver);
DriverSchema.index({ location: '2dsphere' });
