import {
  BadRequestException,
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

    const rideWithPassenger = await this.rideRequestModel
      .findById(ride._id)
      .populate('passengerID', 'username') // 👈 only fetch fields you need
      .lean();

    if (!rideWithPassenger) {
      throw new NotFoundException('Ride request not found after creation');
    }

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
        this.rideGateway.server.to(connected.socketId).emit('newRideRequest', {
          ride: rideWithPassenger,
          passenger: rideWithPassenger.passengerID, // 👈 extracted passenger info
        });
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

  async updateRideRequest(id: string, dto: UpdateRideRequestDto) {
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

  async getNearbyRides(
    location: [number, number],
    radius: number,
    rideMode?: string, // solo or shared
  ) {
    const query: any = {
      pickupLocation: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: location, // [lng, lat]
          },
          $maxDistance: radius, // in meters
        },
      },
      status: 'pending',
    };

    if (rideMode) {
      query.rideMode = rideMode; // filter by exact mode if provided
    }

    const rides = await this.rideRequestModel.find(query);

    return {
      message: 'Nearby rides retrieved successfully',
      rides,
    };
  }

  async acceptDriverOffer(
    rideId: string,
    driverId: string,
    counterFare: number,
  ) {
    return await this.rideRequestModel.findByIdAndUpdate(
      rideId,
      {
        $set: {
          status: 'accepted',
          driverID: driverId,
          fare: counterFare,
        },
      },
      { new: true },
    );
  }
  async startRide(rideId: string) {
    return await this.rideRequestModel.findByIdAndUpdate(
      rideId,
      {
        $set: {
          status: 'started',
        },
      },
      { new: true },
    );
  }

  async completeRide(rideId: string) {
    return await this.rideRequestModel.findByIdAndUpdate(
      rideId,
      {
        $set: {
          status: 'completed',
        },
      },
      { new: true },
    );
  }

  async getPassengerRideHistory(passengerId: string) {
    const rides = await this.rideRequestModel
      .find({ passengerID: passengerId })
      .sort({ createdAt: -1 }) // newest first
      .lean();

    return {
      message: 'Ride history retrieved successfully',
      rides,
    };
  }

  async cancelRide(
    rideId: string,
    cancelledBy: 'passenger' | 'driver',
    reason?: string,
  ) {
    return await this.rideRequestModel.findByIdAndUpdate(
      rideId,
      {
        $set: {
          status: 'cancelled',
          cancelledBy,
          cancellationReason: reason || null,
        },
      },
      { new: true },
    );
  }

  async deleteRideRequest(id: string) {
    const deleted = await this.rideRequestModel.findByIdAndDelete(id).exec();

    if (!deleted) {
      throw new NotFoundException('Ride request not found');
    }

    return {
      message: 'Ride request deleted successfully',
      ride: deleted,
    };
  }

  calculateFareFromDistanceTime(
    distanceMeters: number,
    durationSeconds: number,
    rideType?: 'auto' | 'car' | 'bike',
  ) {
    if (distanceMeters == null || durationSeconds == null) {
      throw new BadRequestException(
        'Both distance (meters) and duration (seconds) are required',
      );
    }

    const baseFare = {
      auto: 40,
      car: 70,
      bike: 25,
    } as const;

    const perKmRate = {
      auto: 15,
      car: 25,
      bike: 10,
    } as const;

    const perMinuteRate = {
      auto: 2,
      car: 3,
      bike: 1.5,
    } as const;

    const calc = (type: 'auto' | 'car' | 'bike') =>
      Math.round(
        baseFare[type] +
          (distanceMeters / 1000) * perKmRate[type] +
          (durationSeconds / 60) * perMinuteRate[type],
      );

    const fares = {
      auto: calc('auto'),
      car: calc('car'),
      bike: calc('bike'),
    };

    if (rideType && ['auto', 'car', 'bike'].includes(rideType)) {
      return {
        message: 'Fare calculated successfully',
        rideType,
        fare: fares[rideType],
      };
    }

    return {
      message: 'Fare calculated successfully',
      fares,
    };
  }
}
