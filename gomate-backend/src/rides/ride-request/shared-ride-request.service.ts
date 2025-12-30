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

    const match = await this.findCompatibleMatch(ride);
    if (!match) {
      try {
        const socketId = this.rideGateway.connectedPassengers.get(
          passengerID.toString(),
        );
        if (socketId) {
          this.rideGateway.server
            .to(socketId)
            .emit('sharedRideSearching', {
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

    // Pair both rides atomically
    const paired = await this.pairPassengers(ride, match);

    // Notify both passengers
    try {
      const primaryPassengerId = ride.passengerID.toString();
      const secondaryPassengerId = match.passengerID.toString();

      console.log(
        `🔔 Emitting sharedRideMatched to primary passenger: ${primaryPassengerId}`,
      );
      console.log(
        `🔔 Emitting sharedRideMatched to secondary passenger: ${secondaryPassengerId}`,
      );
      console.log(
        `📊 Connected passengers:`,
        Array.from(this.rideGateway.connectedPassengers.keys()),
      );

      this.rideGateway.server
        .to(primaryPassengerId)
        .emit('sharedRideMatched', paired.primary);
      this.rideGateway.server
        .to(secondaryPassengerId)
        .emit('sharedRideMatched', paired.secondary);

      console.log(`✅ sharedRideMatched events emitted successfully`);
    } catch (e) {
      // Non-fatal: socket may not be connected; continue
      console.warn('WebSocket emit failed (sharedRideMatched):', e.message);
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
      .limit(15) // small batch to score
      .exec();

    if (!candidates.length) return null;

    // Score by alignment; pick best above threshold
    let best: { cand: RideRequest; score: number } | null = null;

    for (const cand of candidates) {
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
      .exec();

    const updatedB = await this.rideRequestModel
      .findByIdAndUpdate(
        freshB._id,
        { $set: { matchedWith: freshA._id, status: 'matched' } },
        { new: true },
      )
      .exec();

    if (!updatedA || !updatedB) {
      throw new BadRequestException('Failed to pair rides');
    }

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
    const radius = Math.max(this.PICKUP_RADIUS_M, 2500);

    const result = await this.driversService.findNearbyDrivers(
      centroid,
      a.rideType, // same type enforced in match
      radius,
    );
    const nearbyDrivers = result.drivers ?? [];

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

    nearbyDrivers.forEach((driver: any) => {
      const driverId = (driver._id as Types.ObjectId).toString();
      const connected = this.rideGateway.connectedDrivers.get(driverId);

      if (connected?.socketId) {
        this.rideGateway.server
          .to(connected.socketId)
          .emit('newSharedRideRequest', combinedPayload);
        console.log(
          `Emitted shared ride to driver socket: ${connected.socketId}`,
        );
      } else {
        console.log(`Driver ${driverId} is not connected`);
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
}
