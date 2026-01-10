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
import { FareSettingsService } from 'src/fare-settings/fare-settings.service';

@Injectable()
export class RideRequestService {
  constructor(
    @InjectModel(RideRequest.name)
    private readonly rideRequestModel: Model<RideRequest>,
    private readonly driversService: DriversService,
    private readonly fareSettingsService: FareSettingsService,

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
      .populate('passengerID', 'username profilePicture phoneNumber') // 👈 Added phoneNumber
      .lean();

    if (!rideWithPassenger) {
      throw new NotFoundException('Ride request not found after creation');
    }

    // 2. Find nearby drivers using real-time location
    const passengerLocation = dto.pickupLocation.coordinates;
    const radius = 5000; // 5km radius

    // First, try to find nearby connected drivers with real-time location
    const nearbyConnectedDriverIds = this.rideGateway.getNearbyConnectedDrivers(
      passengerLocation,
      dto.rideType,
      radius,
    );

    console.log(
      `Found ${nearbyConnectedDriverIds.length} nearby connected drivers with real-time location`,
    );

    // Get driver details from database for connected drivers
    const connectedDriversPromises = nearbyConnectedDriverIds.map((id) =>
      this.driversService.findOne(id),
    );
    const connectedDrivers = (
      await Promise.all(connectedDriversPromises)
    ).filter((d) => d !== null);

    // If not enough connected drivers, fall back to database location search
    let allNearbyDrivers = connectedDrivers;
    if (connectedDrivers.length < 5) {
      console.log(
        `Only ${connectedDrivers.length} connected drivers found, searching database for more...`,
      );
      const result = await this.driversService.findNearbyDrivers(
        passengerLocation,
        dto.rideType,
        radius,
      );

      // Merge and deduplicate drivers
      const connectedDriverIds = new Set(nearbyConnectedDriverIds);
      const dbDrivers = result.drivers.filter(
        (d) => !connectedDriverIds.has(d._id.toString()),
      );

      allNearbyDrivers = [...connectedDrivers, ...dbDrivers];
      console.log(
        `Total nearby drivers: ${allNearbyDrivers.length} (${connectedDrivers.length} connected + ${dbDrivers.length} from DB)`,
      );
    }

    // 3. Emit to connected drivers
    allNearbyDrivers.forEach((driver) => {
      const driverId = (driver._id as Types.ObjectId).toString();
      const connected = this.rideGateway.connectedDrivers.get(driverId);

      if (connected?.socketId) {
        const populatedPassenger = rideWithPassenger.passengerID as any;
        const emitData = {
          ride: rideWithPassenger,
          passenger: populatedPassenger, // 👈 extracted passenger info
        };
        console.log('📤 Emitting ride with passenger data:', {
          passengerUsername: populatedPassenger?.username,
          passengerProfilePic: populatedPassenger?.profilePicture,
          passengerID: populatedPassenger?._id,
        });
        this.rideGateway.server
          .to(connected.socketId)
          .emit('newRideRequest', emitData);
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

  async getDriverRideHistory(driverId: string) {
    // Query for both ObjectId and string driverID to support old and new data
    const rides = await this.rideRequestModel
      .find({
        $or: [
          { driverID: new Types.ObjectId(driverId) },
          { driverID: driverId },
        ],
      })
      .populate('passengerID', 'username phoneNumber email profilePicture')
      .populate({
        path: 'matchedWith',
        select:
          'passengerID pickupLocation dropoffLocation fare rideType rideMode status createdAt updatedAt matchedWith rating',
        populate: {
          path: 'passengerID',
          select: 'username phoneNumber email profilePicture',
        },
      })
      .sort({ createdAt: -1 }) // newest first
      .lean();

    // Group shared rides together
    const processedRides: any[] = [];
    const processedIds = new Set<string>();

    console.log(`[DEBUG] Processing ${rides.length} total rides`);
    let soloCount = 0;
    let sharedCount = 0;

    for (const ride of rides) {
      const rideId = ride._id.toString();

      // Skip if already processed (as part of a shared ride pair)
      if (processedIds.has(rideId)) {
        continue;
      }

      if (ride.matchedWith && ride.rideMode === 'shared') {
        // This is a shared ride - find its pair
        const matchedRideId =
          (ride.matchedWith as any)._id?.toString() ||
          ride.matchedWith.toString();
        const matchedRide = rides.find(
          (r) => r._id.toString() === matchedRideId,
        );

        if (matchedRide) {
          sharedCount++;
          // Mark both as processed
          processedIds.add(rideId);
          processedIds.add(matchedRideId);

          // Create a combined shared ride entry
          const timestamps = ride as any;
          const sharedRideEntry = {
            _id: rideId, // Use primary ride ID
            rideMode: 'shared',
            rideType: ride.rideType,
            driverID: ride.driverID,
            status: ride.status,
            rating: ride.rating, // Include rating from main ride
            createdAt:
              timestamps.createdAt || timestamps.updatedAt || new Date(),
            fare: ride.fare + (matchedRide.fare || 0), // Combined fare
            passengers: [
              {
                passengerID: ride.passengerID,
                pickupLocation: ride.pickupLocation,
                dropoffLocation: ride.dropoffLocation,
                fare: ride.fare,
              },
              {
                passengerID: matchedRide.passengerID,
                pickupLocation: matchedRide.pickupLocation,
                dropoffLocation: matchedRide.dropoffLocation,
                fare: matchedRide.fare,
              },
            ],
          };
          processedRides.push(sharedRideEntry);
        } else {
          // Matched ride not found in results, add as solo
          processedIds.add(rideId);
          processedRides.push(ride);
        }
      } else {
        // Solo ride
        soloCount++;
        processedIds.add(rideId);
        processedRides.push(ride);
      }
    }

    console.log(
      `[DEBUG] Processed rides: ${processedRides.length} total (${soloCount} solo, ${sharedCount} shared)`,
    );

    return {
      message: 'Driver ride history retrieved successfully',
      rides: processedRides,
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

  async calculateFareFromDistanceTime(
    distanceMeters: number,
    durationSeconds: number,
    rideType?: 'auto' | 'car' | 'bike',
    rideMode?: 'solo' | 'shared',
  ) {
    if (distanceMeters == null || durationSeconds == null) {
      throw new BadRequestException(
        'Both distance (meters) and duration (seconds) are required',
      );
    }

    // Fetch dynamic fare settings from database
    const faresMap = await this.fareSettingsService.getFaresMap();

    const calc = (type: 'auto' | 'car' | 'bike') => {
      const fareConfig = faresMap[type];
      const soloFare = Math.round(
        fareConfig.baseFare +
          (distanceMeters / 1000) * fareConfig.perKmRate +
          (durationSeconds / 60) * fareConfig.perMinuteRate,
      );

      // Apply 75% (0.75) discount for shared rides
      if (rideMode === 'shared') {
        return Math.round(soloFare * 0.75);
      }

      return soloFare;
    };

    const fares = {
      auto: calc('auto'),
      car: calc('car'),
      bike: calc('bike'),
    };

    if (rideType && ['auto', 'car', 'bike'].includes(rideType)) {
      return {
        message: 'Fare calculated successfully',
        rideType,
        rideMode: rideMode || 'solo',
        fare: fares[rideType],
      };
    }

    return {
      message: 'Fare calculated successfully',
      rideMode: rideMode || 'solo',
      fares,
    };
  }

  async rateRide(rideId: string, passengerId: string, rating: number) {
    console.log(
      `[RATING] Attempting to rate ride ${rideId} by passenger ${passengerId} with rating ${rating}`,
    );

    if (!rating || rating < 1 || rating > 5) {
      throw new BadRequestException('Rating must be between 1 and 5');
    }

    const ride = await this.rideRequestModel
      .findById(rideId)
      .populate('matchedWith');

    if (!ride) {
      console.log(`[RATING ERROR] Ride ${rideId} not found`);
      throw new NotFoundException('Ride not found');
    }

    console.log(
      `[RATING] Found ride: ${rideId}, status: ${ride.status}, passengerID: ${ride.passengerID}`,
    );

    // Check if this passenger is part of this ride (solo or shared)
    const isMainPassenger = ride.passengerID.toString() === passengerId;
    const matchedRide = ride.matchedWith as any;
    const isMatchedPassenger =
      matchedRide && matchedRide.passengerID?.toString() === passengerId;

    console.log(
      `[RATING] isMainPassenger: ${isMainPassenger}, isMatchedPassenger: ${isMatchedPassenger}`,
    );

    if (!isMainPassenger && !isMatchedPassenger) {
      throw new BadRequestException('You can only rate your own rides');
    }

    if (ride.status !== 'completed') {
      console.log(
        `[RATING ERROR] Ride ${rideId} status is ${ride.status}, not completed`,
      );
      throw new BadRequestException('You can only rate completed rides');
    }

    // Check if this passenger has already rated
    if (ride.rating) {
      console.log(
        `[WARNING] Passenger ${passengerId} is updating their rating for ride ${rideId} from ${ride.rating} to ${rating}`,
      );
    }

    // For shared rides: Note that both passengers will update the same rating field
    // This is a known limitation - a proper fix would require a passengers array with individual ratings
    console.log(`[RATING] Setting rating to ${rating} for ride ${rideId}`);
    ride.rating = rating;
    const savedRide = await ride.save();

    console.log(
      `[RATING SUCCESS] Saved rating ${savedRide.rating} for ride ${rideId}`,
    );

    return {
      message: 'Rating submitted successfully',
      rating: savedRide.rating,
    };
  }

  async getDriverAverageRating(driverId: string) {
    const rides = await this.rideRequestModel.find({
      $or: [{ driverID: new Types.ObjectId(driverId) }, { driverID: driverId }],
      rating: { $exists: true, $ne: null },
      status: 'completed',
    });

    if (rides.length === 0) {
      return {
        averageRating: 0,
        totalRatings: 0,
        message: 'No ratings yet',
      };
    }

    const totalRating = rides.reduce(
      (sum, ride) => sum + (ride.rating || 0),
      0,
    );
    const averageRating = totalRating / rides.length;

    return {
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
      totalRatings: rides.length,
    };
  }
}
