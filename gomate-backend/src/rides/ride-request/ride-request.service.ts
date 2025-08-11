import {
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { RideRequest } from './schemas/ride-request.schema';
import { Model, Types } from 'mongoose';
import { CreateRideRequestDto } from './dto/create-ride-request.dto';
import { UpdateRideRequestDto } from './dto/update-ride-request.dto';
import { DriversService } from 'src/drivers/drivers.service';
import { RideGateway } from 'src/socket/gateways/ride.gateway';

@Injectable()
export class RideRequestService {
  constructor(
    @InjectModel(RideRequest.name)
    private readonly rideRequestModel: Model<RideRequest>,
    private readonly driversService: DriversService,

    @Inject(forwardRef(() => RideGateway))
    private readonly rideGateway: RideGateway,
  ) {}

  async createRideRequest(passengerID: string, dto: CreateRideRequestDto) {
    const ride = new this.rideRequestModel({
      ...dto,
      passengerID,
      status: 'pending',
    });
    await ride.save();
    return {
      message: 'Ride request created successfully',
      ride,
    };
  }

  // Unified method for API & WebSocket
  async createRideAndNotifyDrivers(
    passengerId: string,
    dto: CreateRideRequestDto,
  ) {
    // 1. Create ride
    const { ride } = await this.createRideRequest(passengerId, dto);

    // 2. Find nearby drivers
    const passengerLocation = dto.pickupLocation.coordinates;
    const radius = 2000;
    const result = await this.driversService.findNearbyDrivers(
      passengerLocation,
      dto.rideType,
      radius,
    );
    const nearbyDrivers = result.drivers;

    // 3. Emit to connected drivers
    nearbyDrivers.forEach((driver) => {
      const driverId = (driver._id as Types.ObjectId).toString();
      const connected = this.rideGateway.connectedDrivers.get(driverId);

      if (connected?.socketId) {
        this.rideGateway.server
          .to(connected.socketId)
          .emit('newRideRequest', ride);
        console.log(
          `Emitted ride request to driver socket: ${connected.socketId}`,
        );
      } else {
        console.log(`Driver ${driverId} is not connected`);
      }
    });

    return { message: 'Ride emitted to nearby drivers', ride };
  }

  async getById(id: string) {
    const ride = await this.rideRequestModel.findById(id).exec();
    if (!ride) {
      throw new NotFoundException('Ride request not found');
    }
    return {
      message: 'Ride request retrieved successfully',
      ride,
    };
  }

  async updateRideRequest(id: String, dto: UpdateRideRequestDto) {
    const updated = await this.rideRequestModel
      .findByIdAndUpdate(id, dto, { new: true })
      .exec();

    if (!updated) {
      throw new NotFoundException('Ride request not found');
    }
    return {
      message: 'Ride request updated successfully',
      ride: updated,
    };
  }

  async getNearbyRides(location: [number, number], radius: number) {
    const rides = await this.rideRequestModel.find({
      pickupLocation: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: location, // [lng, lat]
          },
          $maxDistance: radius, // in meters
        },
      },
      status: 'pending', // filter only unaccepted rides
    });

    return {
      message: 'Nearby rides retrieved successfully',
      rides,
    };
  }

  async acceptDriverOffer(rideId: string, driverId: string) {
    return await this.rideRequestModel.findByIdAndUpdate(
      rideId,
      {
        $set: {
          status: 'accepted',
          acceptedDriver: driverId,
        },
      },
      { new: true },
    );
  }
}
