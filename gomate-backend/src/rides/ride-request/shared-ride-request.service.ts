// src/rides/ride-request/shared-ride-request.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  forwardRef,
  Inject,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, ClientSession } from 'mongoose';
import { RideRequest } from './schemas/ride-request.schema';
import { CreateRideRequestDto } from './dto/create-ride-request.dto';
import { RideMode } from 'src/common/enums/ride-mode.enum';
import { RideType } from 'src/common/enums/ride-type.enum';
import { DriversService } from 'src/drivers/drivers.service';
import { RideGateway } from 'src/socket/gateways/ride.gateway';

/**
 * Heuristics:
 * - Pickup proximity: within 2 km (geospatial index on pickupLocation is used)
 * - Route alignment: simple vector-angle + path proximity check (straight-line fallback).
 *   You can later replace checkRouteAlignment() with Google/Mapbox/OSRM route comparison.
 */
@Injectable()
export class SharedRideRequestService {
  private readonly PICKUP_RADIUS_M = 2000; // 2 km for pickup proximity
  private readonly ROUTE_MAX_ANGLE_DIFF_DEG = 35; // vectors should be roughly aligned
  private readonly DROP_TO_PATH_MAX_DISTANCE_M = 2000; // dropoff should be near other route

  constructor(
    @InjectModel(RideRequest.name)
    private readonly rideRequestModel: Model<RideRequest>,
    private readonly driversService: DriversService,
    @Inject(forwardRef(() => RideGateway))
    private readonly rideGateway: RideGateway,
  ) {}

  /** Create a shared ride request (status=pending) */
  async createSharedRideRequest(
    passengerID: string,
    dto: CreateRideRequestDto,
  ) {
    if (dto.rideMode !== RideMode.Shared) {
      throw new BadRequestException(
        'rideMode must be "shared" for this endpoint',
      );
    }

    const ride = new this.rideRequestModel({
      ...dto,
      passengerID,
      status: 'pending',
      matchedWith: null,
    });

    await ride.save();
    return { message: 'Shared ride request created successfully', ride };
  }

  /**
   * Create, try to match immediately, notify passengers, and emit to nearby drivers if matched.
   * If not matched, ride remains pending and can be matched later by a scheduler/worker on new requests.
   */
  async createSharedAndMatch(passengerID: string, dto: CreateRideRequestDto) {
    const { ride } = await this.createSharedRideRequest(passengerID, dto);

    // Populate passengerID with full passenger data
    await ride.populate(
      'passengerID',
      'username phoneNumber email profilePicture gender',
    );

    const match = await this.findCompatibleMatch(ride);
    if (!match) {
      try {
        const socketId = this.rideGateway.connectedPassengers.get(
          passengerID.toString(),
        );
        if (socketId) {
          this.rideGateway.server.to(socketId).emit('sharedRideSearching', {
            message: 'No compatible shared match found (yet)',
            ride,
          });
        }
      } catch (e) {
        console.warn('WebSocket emit failed (sharedRideSearching):', e.message);
      }

      return {
        message: 'No compatible shared match found (yet)',
        ride,
        matched: null,
      };
    }

    // Populate match passengerID with full passenger data
    await match.populate(
      'passengerID',
      'username phoneNumber email profilePicture gender',
    );

    // Pair both rides atomically
    const paired = await this.pairPassengers(ride, match);

    // Notify both passengers
    try {
      // Extract passenger IDs (handle both populated object and direct ObjectId)
      const primaryPassengerId = (ride.passengerID as any)?._id
        ? (ride.passengerID as any)._id.toString()
        : ride.passengerID.toString();
      const secondaryPassengerId = (match.passengerID as any)?._id
        ? (match.passengerID as any)._id.toString()
        : match.passengerID.toString();

      console.log(`🔔 Attempting to emit sharedRideMatched to passengers`);
      console.log(`   Primary passenger ID: ${primaryPassengerId}`);
      console.log(`   Secondary passenger ID: ${secondaryPassengerId}`);
      console.log(
        `📊 Connected passengers:`,
        Array.from(this.rideGateway.connectedPassengers.entries()),
      );

      // Get socket IDs from the map
      const primarySocketId =
        this.rideGateway.connectedPassengers.get(primaryPassengerId);
      const secondarySocketId =
        this.rideGateway.connectedPassengers.get(secondaryPassengerId);

      console.log(`   Primary socket ID: ${primarySocketId || 'NOT FOUND'}`);
      console.log(
        `   Secondary socket ID: ${secondarySocketId || 'NOT FOUND'}`,
      );

      if (primarySocketId) {
        this.rideGateway.server
          .to(primarySocketId)
          .emit('sharedRideMatched', paired.primary);
        console.log(
          `✅ Emitted sharedRideMatched to primary passenger (${primarySocketId})`,
        );
      } else {
        console.warn(
          `⚠️ Primary passenger ${primaryPassengerId} not connected`,
        );
      }

      if (secondarySocketId) {
        this.rideGateway.server
          .to(secondarySocketId)
          .emit('sharedRideMatched', paired.secondary);
        console.log(
          `✅ Emitted sharedRideMatched to secondary passenger (${secondarySocketId})`,
        );
      } else {
        console.warn(
          `⚠️ Secondary passenger ${secondaryPassengerId} not connected`,
        );
      }
    } catch (e) {
      // Non-fatal: socket may not be connected; continue
      console.warn('WebSocket emit failed (sharedRideMatched):', e.message);
      console.error('Full error:', e);
    }

    // Emit to nearby drivers as a combined request
    await this.emitCombinedSharedRideToDrivers(
      paired.primary,
      paired.secondary,
    );

    return {
      message: 'Shared ride matched successfully',
      ride: paired.primary,
      matched: paired.secondary,
    };
  }

  /** Find a compatible pending shared ride within pickup radius and route alignment */
  private async findCompatibleMatch(
    ride: RideRequest,
  ): Promise<RideRequest | null> {
    const [lng, lat] = ride.pickupLocation.coordinates;

    // Populate the current ride's passenger to get gender
    await ride.populate(
      'passengerID',
      'username phoneNumber email profilePicture gender',
    );
    const currentPassengerGender = (ride.passengerID as any)?.gender;

    // Candidates: pending, shared, not self, not already matched
    const candidates = await this.rideRequestModel
      .find({
        _id: { $ne: ride._id },
        rideMode: RideMode.Shared,
        status: 'pending',
        matchedWith: null,
        // Vehicle type can be either same or compatible; for now require same:
        rideType: ride.rideType as RideType,
        pickupLocation: {
          $near: {
            $geometry: { type: 'Point', coordinates: [lng, lat] },
            $maxDistance: this.PICKUP_RADIUS_M,
          },
        },
      })
      .populate(
        'passengerID',
        'username phoneNumber email profilePicture gender',
      ) // Include gender in population
      .limit(15) // small batch to score
      .exec();

    if (!candidates.length) return null;

    // Filter candidates based on gender-based matching preference
    let filteredCandidates = candidates;
    if (ride.genderBasedMatching && currentPassengerGender === 'female') {
      // If current passenger is female with gender-based matching ON,
      // only match with other female passengers
      filteredCandidates = candidates.filter((cand) => {
        const candidatePassengerGender = (cand.passengerID as any)?.gender;
        return candidatePassengerGender === 'female';
      });
      console.log(
        `🚺 Gender-based matching enabled: Filtered ${filteredCandidates.length} female passengers from ${candidates.length} total candidates`,
      );
    }

    // Also check if any candidate has gender-based matching enabled
    // If a candidate is female with gender-based matching, only match with females
    filteredCandidates = filteredCandidates.filter((cand) => {
      const candidatePassengerGender = (cand.passengerID as any)?.gender;
      if (cand.genderBasedMatching && candidatePassengerGender === 'female') {
        // Candidate wants gender-based matching, so current passenger must also be female
        return currentPassengerGender === 'female';
      }
      return true; // Otherwise, candidate is compatible
    });

    if (!filteredCandidates.length) {
      console.log('❌ No candidates remaining after gender filtering');
      return null;
    }

    // Score by alignment; pick best above threshold
    let best: { cand: RideRequest; score: number } | null = null;

    for (const cand of filteredCandidates) {
      const score = this.routeAlignmentScore(
        ride.pickupLocation.coordinates,
        ride.dropoffLocation.coordinates,
        cand.pickupLocation.coordinates,
        cand.dropoffLocation.coordinates,
      );

      if (!best || score > best.score) best = { cand, score };
    }

    // Minimal acceptable score (0..1). Tune as needed.
    if (!best || best.score < 0.5) return null;
    return best.cand;
  }

  /** Pair two rides with a Mongo transaction to avoid race conditions */
  private async pairPassengers(
    a: RideRequest,
    b: RideRequest,
  ): Promise<{ primary: RideRequest; secondary: RideRequest }> {
    const freshA = await this.rideRequestModel.findById(a._id).exec();
    const freshB = await this.rideRequestModel.findById(b._id).exec();

    if (!freshA || !freshB) {
      throw new NotFoundException('Ride request not found during pairing');
    }

    if (
      freshA.status !== 'pending' ||
      freshB.status !== 'pending' ||
      freshA.matchedWith ||
      freshB.matchedWith
    ) {
      throw new BadRequestException(
        'One of the rides is no longer available for matching',
      );
    }

    const updatedA = await this.rideRequestModel
      .findByIdAndUpdate(
        freshA._id,
        { $set: { matchedWith: freshB._id, status: 'matched' } },
        { new: true },
      )
      .populate(
        'passengerID',
        'username phoneNumber email profilePicture gender',
      )
      .exec();

    const updatedB = await this.rideRequestModel
      .findByIdAndUpdate(
        freshB._id,
        { $set: { matchedWith: freshA._id, status: 'matched' } },
        { new: true },
      )
      .populate(
        'passengerID',
        'username phoneNumber email profilePicture gender',
      )
      .exec();

    if (!updatedA || !updatedB) {
      throw new BadRequestException('Failed to pair rides');
    }

    console.log('✅ Rides paired successfully:');
    console.log(
      '   Primary passenger:',
      (updatedA.passengerID as any)?._id || updatedA.passengerID,
    );
    console.log(
      '   Secondary passenger:',
      (updatedB.passengerID as any)?._id || updatedB.passengerID,
    );

    return { primary: updatedA, secondary: updatedB };
  }

  /** After two passengers are matched, emit a combined request to nearby drivers */
  private async emitCombinedSharedRideToDrivers(
    a: RideRequest,
    b: RideRequest,
  ) {
    // Choose centroid of pickups for driver search
    const [lng1, lat1] = a.pickupLocation.coordinates;
    const [lng2, lat2] = b.pickupLocation.coordinates;
    const centroid: [number, number] = [(lng1 + lng2) / 2, (lat1 + lat2) / 2];

    // Use a slightly larger radius for shared pickups
    const radius = Math.max(this.PICKUP_RADIUS_M, 5000); // Increased to 5km

    // First, try to find nearby connected drivers with real-time location
    const nearbyConnectedDriverIds = this.rideGateway.getNearbyConnectedDrivers(
      centroid,
      a.rideType,
      radius,
    );

    console.log(
      `Found ${nearbyConnectedDriverIds.length} nearby connected drivers for shared ride`,
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
      const result = await this.driversService.findNearbyDrivers(
        centroid,
        a.rideType,
        radius,
      );

      // Merge and deduplicate drivers
      const connectedDriverIds = new Set(nearbyConnectedDriverIds);
      const dbDrivers = result.drivers.filter(
        (d: any) => !connectedDriverIds.has(d._id.toString()),
      );

      allNearbyDrivers = [...connectedDrivers, ...dbDrivers];
    }

    const nearbyDrivers = allNearbyDrivers ?? [];

    console.log('📊 Preparing combined payload for shared ride:');
    console.log('  - Passenger A:', a.passengerID);
    console.log('  - Passenger B:', b.passengerID);
    console.log('  - Primary Ride ID:', a._id);
    console.log('  - Primary Ride Status:', a.status);
    console.log('  - Secondary Ride ID:', b._id);
    console.log('  - Secondary Ride Status:', b.status);

    // Prepare a combined payload (you can adapt this to your driver app contract)
    const combinedPayload = {
      _id: a._id, // primary id just for reference
      shared: true,
      passengers: [
        {
          rideId: a._id,
          passengerID: a.passengerID,
          pickupLocation: a.pickupLocation,
          dropoffLocation: a.dropoffLocation,
          fare: a.fare,
        },
        {
          rideId: b._id,
          passengerID: b.passengerID,
          pickupLocation: b.pickupLocation,
          dropoffLocation: b.dropoffLocation,
          fare: b.fare,
        },
      ],
      rideType: a.rideType,
      rideMode: RideMode.Shared,
      status: 'matched',
      // You could compute a suggested combined fare for drivers here:
      // suggestedTotalFare: a.fare + b.fare,
    };

    console.log('📦 Combined payload prepared:', {
      _id: combinedPayload._id,
      status: combinedPayload.status,
      passengerCount: combinedPayload.passengers.length,
    });

    nearbyDrivers.forEach((driver: any) => {
      const driverId = (driver._id as Types.ObjectId).toString();
      const connected = this.rideGateway.connectedDrivers.get(driverId);

      if (connected?.socketId) {
        console.log('🚗 Emitting to driver:', {
          driverId,
          socketId: connected.socketId,
          passengers: combinedPayload.passengers.map((p) => ({
            passengerName: (p.passengerID as any)?.username || 'Unknown',
            passengerId: (p.passengerID as any)?._id || p.passengerID,
            fare: p.fare,
          })),
        });

        this.rideGateway.server
          .to(connected.socketId)
          .emit('newSharedRideRequest', combinedPayload);
        console.log(
          `✅ Emitted shared ride to driver socket: ${connected.socketId}`,
        );
      } else {
        console.log(`⚠️ Driver ${driverId} is not connected`);
      }
    });
  }

  // ---------------------
  // Alignment heuristics:
  // ---------------------
  private routeAlignmentScore(
    pickupA: [number, number],
    dropA: [number, number],
    pickupB: [number, number],
    dropB: [number, number],
  ): number {
    // 1) Vector angle alignment (pickup->drop)
    const bearingA = this.bearingDeg(pickupA, dropA);
    const bearingB = this.bearingDeg(pickupB, dropB);
    const angleDiff = this.angleDiffDeg(bearingA, bearingB);

    if (angleDiff > this.ROUTE_MAX_ANGLE_DIFF_DEG) return 0;

    // 2) Each dropoff should be close to the other's straight-line path
    const distDropAtoPathB = this.pointToSegmentDistanceMeters(
      dropA,
      pickupB,
      dropB,
    );
    const distDropBtoPathA = this.pointToSegmentDistanceMeters(
      dropB,
      pickupA,
      dropA,
    );

    const withinPathA =
      distDropBtoPathA <= this.DROP_TO_PATH_MAX_DISTANCE_M ? 1 : 0;
    const withinPathB =
      distDropAtoPathB <= this.DROP_TO_PATH_MAX_DISTANCE_M ? 1 : 0;

    // 3) Bonus if dropoffs are near each other (same-ish destination area)
    const dropToDrop = this.haversineMeters(dropA, dropB);
    const dropNearBonus = dropToDrop <= 3000 ? 0.3 : 0; // within 3 km

    // Final score (0..1)
    const angleScore = 1 - angleDiff / this.ROUTE_MAX_ANGLE_DIFF_DEG; // 1 when perfectly aligned
    const pathScore = (withinPathA + withinPathB) / 2; // 0, 0.5, or 1

    return Math.max(
      0,
      Math.min(1, 0.6 * angleScore + 0.4 * pathScore + dropNearBonus),
    );
  }

  private toRad(d: number) {
    return (d * Math.PI) / 180;
  }

  private haversineMeters(a: [number, number], b: [number, number]) {
    const [lng1, lat1] = a;
    const [lng2, lat2] = b;
    const R = 6371000;
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const s1 =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(s1), Math.sqrt(1 - s1));
    return R * c;
  }

  private bearingDeg(a: [number, number], b: [number, number]) {
    const [lng1, lat1] = a.map(this.toRad.bind(this)) as [number, number];
    const [lng2, lat2] = b.map(this.toRad.bind(this)) as [number, number];
    const dLng = lng2 - lng1;
    const y = Math.sin(dLng) * Math.cos(lat2);
    const x =
      Math.cos(lat1) * Math.sin(lat2) -
      Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
    const brng = Math.atan2(y, x);
    const deg = (brng * 180) / Math.PI;
    return (deg + 360) % 360;
  }

  private angleDiffDeg(a: number, b: number) {
    const d = Math.abs(a - b) % 360;
    return d > 180 ? 360 - d : d;
  }

  /** Distance from point C to segment AB (in meters) */
  private pointToSegmentDistanceMeters(
    c: [number, number],
    a: [number, number],
    b: [number, number],
  ) {
    // Convert to planar (rough) using equirectangular projection for small distances
    const R = 6371000;
    const toXY = ([lng, lat]: [number, number]) => {
      const x = this.toRad(lng) * Math.cos(this.toRad((a[1] + b[1]) / 2));
      const y = this.toRad(lat);
      return [x, y];
    };

    const [ax, ay] = toXY(a);
    const [bx, by] = toXY(b);
    const [cx, cy] = toXY(c);

    const ABx = bx - ax;
    const ABy = by - ay;
    const ACx = cx - ax;
    const ACy = cy - ay;

    const ab2 = ABx * ABx + ABy * ABy || 1e-12;
    let t = (ACx * ABx + ACy * ABy) / ab2;
    t = Math.max(0, Math.min(1, t));

    const px = ax + t * ABx;
    const py = ay + t * ABy;

    const dx = cx - px;
    const dy = cy - py;

    const distRad = Math.sqrt(dx * dx + dy * dy);
    return distRad * R;
  }

  /**
   * Atomically accept a shared ride by a driver using atomic update operations.
   * Only the first driver to accept will succeed. Updates both paired rides.
   * Returns both updated ride documents or null if already accepted.
   * Works with standalone MongoDB (no replica set required).
   */
  async acceptSharedRideAtomic(
    primaryRideId: string,
    driverId: string,
  ): Promise<{ primary: RideRequest; secondary: RideRequest } | null> {
    try {
      console.log('🔍 Starting atomic acceptance for ride:', primaryRideId);

      // First, atomically update the primary ride ONLY if it's still available
      // This is atomic at the document level and doesn't require transactions
      const updatedPrimary = await this.rideRequestModel
        .findOneAndUpdate(
          {
            _id: primaryRideId,
            status: 'matched',
            driverID: null, // Only update if no driver assigned yet
          },
          {
            $set: {
              driverID: new Types.ObjectId(driverId),
              status: 'accepted',
            },
          },
          { new: true },
        )
        .populate('passengerID', 'username phoneNumber email profilePicture')
        .populate('driverID', 'fullname phoneNumber vehicle profilePhoto')
        .exec();

      console.log('🔍 Primary ride update result:', {
        found: !!updatedPrimary,
        rideId: updatedPrimary?._id,
        status: updatedPrimary?.status,
        driverID: updatedPrimary?.driverID,
      });

      if (!updatedPrimary) {
        console.log(
          `❌ Primary ride ${primaryRideId} already accepted by another driver or not in matched state`,
        );
        return null;
      }

      // If primary was updated successfully, update the secondary ride
      if (!updatedPrimary.matchedWith) {
        console.log(`❌ Primary ride ${primaryRideId} has no matchedWith`);
        // Rollback the primary ride
        await this.rideRequestModel.findByIdAndUpdate(primaryRideId, {
          $set: { driverID: null, status: 'matched' },
        });
        return null;
      }

      const updatedSecondary = await this.rideRequestModel
        .findOneAndUpdate(
          {
            _id: updatedPrimary.matchedWith,
            status: 'matched',
            driverID: null,
          },
          {
            $set: {
              driverID: new Types.ObjectId(driverId),
              status: 'accepted',
            },
          },
          { new: true },
        )
        .populate('passengerID', 'username phoneNumber email profilePicture')
        .populate('driverID', 'fullname phoneNumber vehicle profilePhoto')
        .exec();

      console.log('🔍 Secondary ride update result:', {
        found: !!updatedSecondary,
        rideId: updatedSecondary?._id,
        status: updatedSecondary?.status,
      });

      if (!updatedSecondary) {
        console.log(
          `❌ Secondary ride ${updatedPrimary.matchedWith} already accepted or not available`,
        );
        // Rollback the primary ride
        await this.rideRequestModel.findByIdAndUpdate(primaryRideId, {
          $set: { driverID: null, status: 'matched' },
        });
        return null;
      }

      console.log(
        `✅ Driver ${driverId} atomically accepted shared ride ${primaryRideId} and ${updatedSecondary._id}`,
      );

      return { primary: updatedPrimary, secondary: updatedSecondary };
    } catch (error) {
      console.error('Error in acceptSharedRideAtomic:', error);
      return null;
    }
  }
}
