import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { RideType } from 'src/common/enums/ride-type.enum';

@Schema({
  timestamps: true,
})
export class RideRequest extends Document {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Passenger' })
  passengerID: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Driver' })
  driverID?: Types.ObjectId;

  @Prop({
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number], // [lng, lat]
      required: true,
    },
  })
  pickupLocation: {
    type: 'Point';
    coordinates: [number, number];
  };

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
  dropoffLocation: {
    type: 'Point';
    coordinates: [number, number];
  };

  @Prop({
    type: String,
    enum: RideType,
    required: true,
  })
  rideType: RideType;

  @Prop({ required: true })
  Fare: number;

  @Prop({
    enum: ['pending', 'accepted', 'started', 'completed', 'cancelled'],
    default: 'pending',
  })
  status: string;
}

export const RideRequestSchema = SchemaFactory.createForClass(RideRequest);

// Geospatial indexes
RideRequestSchema.index({ pickupLocation: '2dsphere' });
RideRequestSchema.index({ dropoffLocation: '2dsphere' });
