import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { CreateRideRequestDto } from 'src/rides/ride-request/dto/create-ride-request.dto';
import { RideRequestService } from 'src/rides/ride-request/ride-request.service';
import { DriversService } from 'src/drivers/drivers.service';
import { forwardRef, Inject } from '@nestjs/common';
import { SharedRideRequestService } from 'src/rides/ride-request/shared-ride-request.service';

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})
export class RideGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // Keep track of connected drivers
  public connectedDrivers: Map<
    string,
    { socketId: string; location: [number, number]; rideType: string }
  > = new Map();

  // Keep track of connected passengers
  public connectedPassengers: Map<string, string> = new Map();

  // Store temporary offers in memory: Map<rideId, Array<{ driverId, counterFare }>>
  private rideOffers = new Map<
    string,
    { driverId: string; counterFare: number }[]
  >();

  constructor(
    @Inject(forwardRef(() => RideRequestService))
    private readonly rideRequestService: RideRequestService,

    @Inject(forwardRef(() => SharedRideRequestService))
    private readonly sharedRideRequestService: SharedRideRequestService,

    private readonly driversService: DriversService,
  ) {}

  handleConnection(client: Socket) {
    // Client connected
  }

  handleDisconnect(client: Socket) {
    // Remove driver if exists
    for (const [driverId, info] of this.connectedDrivers.entries()) {
      if (info.socketId === client.id) {
        this.connectedDrivers.delete(driverId);
        return;
      }
    }

    // Remove passenger if exists
    for (const [passengerId, socketId] of this.connectedPassengers.entries()) {
      if (socketId === client.id) {
        this.connectedPassengers.delete(passengerId);
        return;
      }
    }
  }

  @SubscribeMessage('registerDriver')
  async handleDriverRegister(
    @MessageBody()
    data: { driverId: string; location: [number, number]; rideType: string },
    @ConnectedSocket() client: Socket,
  ) {
    this.connectedDrivers.set(data.driverId, {
      socketId: client.id,
      location: data.location,
      rideType: data.rideType,
    });

    await this.driversService.updateSocketId(data.driverId, client.id);
    await this.driversService.updateDriverLocation(
      data.driverId,
      data.location,
    );
  }

  @SubscribeMessage('updateDriverLocation')
  async handleUpdateDriverLocation(
    @MessageBody()
    data: {
      driverId: string;
      location: [number, number];
      passengerId?: string;
    },
    @ConnectedSocket() client: Socket,
  ) {
    // Verify driver is authorized
    const driverInfo = this.connectedDrivers.get(data.driverId);
    if (!driverInfo || driverInfo.socketId !== client.id) {
      return { success: false, message: 'Unauthorized' };
    }

    // Update driver location in memory
    this.connectedDrivers.set(data.driverId, {
      ...driverInfo,
      location: data.location,
    });

    // Update location in database
    await this.driversService.updateDriverLocation(
      data.driverId,
      data.location,
    );

    console.log(
      `📍 Driver ${data.driverId} location updated: [${data.location}]`,
    );

    // If there's an active ride with a passenger, emit location update to passenger(s)
    if (data.passengerId) {
      // Handle both single passenger ID (string) and multiple (could be array or stringified)
      let passengerIds: string[] = [];

      if (typeof data.passengerId === 'string') {
        try {
          // Try to parse if it's a JSON array
          const parsed = JSON.parse(data.passengerId);
          if (Array.isArray(parsed)) {
            passengerIds = parsed;
          } else {
            passengerIds = [data.passengerId];
          }
        } catch {
          // Not JSON, treat as single ID
          passengerIds = [data.passengerId];
        }
      } else if (Array.isArray(data.passengerId)) {
        passengerIds = data.passengerId;
      }

      // Send location update to all passengers
      passengerIds.forEach((passengerId) => {
        const passengerSocketId = this.connectedPassengers.get(passengerId);
        if (passengerSocketId) {
          this.server.to(passengerSocketId).emit('driverLocationUpdate', {
            driverId: data.driverId,
            location: {
              lat: data.location[1],
              lng: data.location[0],
            },
          });
          console.log(`📍 Sent location update to passenger ${passengerId}`);
        } else {
          console.log(`⚠️ Passenger ${passengerId} not connected`);
        }
      });
    }

    return { success: true, message: 'Location updated' };
  }

  /**
   * Get nearby connected drivers based on real-time location
   * Uses haversine formula to calculate distance
   */
  getNearbyConnectedDrivers(
    passengerLocation: [number, number],
    rideType: string,
    radius: number,
  ): string[] {
    const nearbyDriverIds: string[] = [];

    for (const [driverId, driverInfo] of this.connectedDrivers.entries()) {
      // Check if driver's ride type matches
      if (driverInfo.rideType !== rideType && driverInfo.rideType !== 'all') {
        continue;
      }

      // Calculate distance using haversine formula
      const distance = this.calculateDistance(
        passengerLocation,
        driverInfo.location,
      );

      console.log(`Driver ${driverId} is ${distance}m away (max: ${radius}m)`);

      if (distance <= radius) {
        nearbyDriverIds.push(driverId);
      }
    }

    console.log(
      `Found ${nearbyDriverIds.length} nearby connected drivers for ${rideType} within ${radius}m`,
    );
    return nearbyDriverIds;
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   * Returns distance in meters
   */
  private calculateDistance(
    coord1: [number, number],
    coord2: [number, number],
  ): number {
    const [lng1, lat1] = coord1;
    const [lng2, lat2] = coord2;

    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lng2 - lng1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  @SubscribeMessage('registerPassenger')
  handlePassengerRegister(
    @MessageBody() data: { passengerId: string },
    @ConnectedSocket() client: Socket,
  ) {
    this.connectedPassengers.set(data.passengerId, client.id);
    client.join(data.passengerId); // ✅ This makes `.to(passengerId)` work
    console.log(`✅ Passenger ${data.passengerId} registered for real-time`);
    console.log(`   Socket ID: ${client.id}`);
    console.log(
      `   Total passengers connected: ${this.connectedPassengers.size}`,
    );
  }

  // Solo ride creation
  @SubscribeMessage('createRideRequest')
  async handleRideRequest(
    @MessageBody() data: { passengerId: string; dto: CreateRideRequestDto },
  ) {
    return this.rideRequestService.createRideAndNotifyDrivers(
      data.passengerId,
      data.dto,
    );
  }

  // SHARED RIDE CREATION
  @SubscribeMessage('createSharedRideRequest')
  async handleSharedRideRequest(
    @MessageBody() data: { passengerId: string; dto: CreateRideRequestDto },
  ) {
    return this.sharedRideRequestService.createSharedAndMatch(
      data.passengerId,
      data.dto,
    );
  }

  @SubscribeMessage('sendCounterOffer')
  async handleCounterOffer(
    @MessageBody()
    data: {
      rideId: string;
      passengerId: string;
      driverId: string;
      counterFare: number;
    },
  ) {
    console.log(
      `Driver ${data.driverId} sent counter fare ${data.counterFare} for ride ${data.rideId}`,
    );

    // Store offer in memory - update existing offer if driver already sent one
    const offers = this.rideOffers.get(data.rideId) || [];
    const existingOfferIndex = offers.findIndex(
      (o) => o.driverId === data.driverId,
    );

    if (existingOfferIndex !== -1) {
      // Update existing offer with new counter fare
      console.log(
        `Updating existing offer from ${offers[existingOfferIndex].counterFare} to ${data.counterFare}`,
      );
      offers[existingOfferIndex].counterFare = data.counterFare;
    } else {
      // Add new offer
      console.log(`Adding new offer: ${data.counterFare}`);
      offers.push({ driverId: data.driverId, counterFare: data.counterFare });
    }

    this.rideOffers.set(data.rideId, offers);
    console.log(`📋 Current offers for ride ${data.rideId}:`, offers);

    // ✅ Fetch driver details from DB
    const driver = await this.driversService.findOne(data.driverId);
    if (!driver) {
      console.log(`Driver ${data.driverId} not found in DB`);
      return;
    }

    // ✅ Build correct driver info
    const driverInfo = {
      id: driver._id.toString(),
      firstname: driver.fullname?.firstname,
      lastname: driver.fullname?.lastname,
      phoneNumber: driver.phoneNumber,
      profilePicture: driver.profilePhoto?.url || '',
      location: driver.location
        ? {
            lat: driver.location.coordinates[1],
            lng: driver.location.coordinates[0],
          }
        : null,
      vehicle: {
        color: driver.vehicle?.color,
        company: driver.vehicle?.company,
        model: driver.vehicle?.model,
        plate: driver.vehicle?.plate,
      },
    };

    // ✅ Send to passenger
    const passengerSocketId = this.connectedPassengers.get(data.passengerId);
    console.log(
      `Looking for passenger ${data.passengerId}, found socket: ${passengerSocketId}`,
    );
    console.log(
      `All connected passengers:`,
      Array.from(this.connectedPassengers.entries()),
    );

    if (passengerSocketId) {
      const offerPayload = {
        rideId: data.rideId,
        counterFare: data.counterFare,
        driver: driverInfo,
      };

      this.server
        .to(passengerSocketId)
        .emit('receiveCounterOffer', offerPayload);

      console.log(`✅ Sent counter offer to passenger ${data.passengerId}`);
      console.log(`   Socket ID: ${passengerSocketId}`);
      console.log(`   Payload:`, JSON.stringify(offerPayload, null, 2));
    } else {
      console.log(`❌ Passenger ${data.passengerId} is not connected`);
      console.log(
        `   Available passengers:`,
        Array.from(this.connectedPassengers.keys()),
      );
    }
  }

  @SubscribeMessage('acceptDriverOffer')
  async handleAcceptDriverOffer(
    @MessageBody()
    data: {
      rideId: string;
      driverId: string;
      passengerId: string;
      counterFare?: number;
    },
  ) {
    console.log('='.repeat(60));
    console.log('🎯 ACCEPT DRIVER OFFER EVENT RECEIVED');
    console.log(
      `Passenger ${data.passengerId} accepted driver ${data.driverId} for ride ${data.rideId}`,
    );
    console.log('Data received:', JSON.stringify(data, null, 2));
    console.log('='.repeat(60));

    // Get the stored offers for this ride
    const offers = this.rideOffers.get(data.rideId) || [];
    console.log(
      `📋 Found ${offers.length} offers for ride ${data.rideId}:`,
      offers,
    );

    // Find the matching driver's offer
    const offer = offers.find((o) => o.driverId === data.driverId);
    if (!offer) {
      console.log('='.repeat(60));
      console.log('❌ NO COUNTER OFFER FOUND');
      console.log(`   Ride ${data.rideId} - Driver ${data.driverId}`);
      console.log(
        '   Available offers:',
        offers.map((o) => ({ driverId: o.driverId, fare: o.counterFare })),
      );
      console.log('='.repeat(60));
      return;
    }

    console.log(`✅ Found matching offer:`, offer);

    // Update DB with accepted driver and stored counter fare
    const updatedRide = await this.rideRequestService.acceptDriverOffer(
      data.rideId,
      data.driverId,
      offer.counterFare,
    );

    if (!updatedRide) {
      console.log(`❌ Ride ${data.rideId} not found in database`);
      return;
    }

    console.log(`✅ Database updated for ride ${data.rideId}`);

    // Notify accepted driver
    const driverInfo = this.connectedDrivers.get(data.driverId);
    console.log('='.repeat(60));
    console.log('🔍 LOOKING UP DRIVER IN CONNECTED DRIVERS');
    console.log(`   Driver ID: ${data.driverId}`);
    console.log(`   Found: ${driverInfo ? 'YES' : 'NO'}`);
    if (driverInfo) {
      console.log(`   Socket ID: ${driverInfo.socketId}`);
      console.log(`   Location: [${driverInfo.location}]`);
      console.log(`   Ride Type: ${driverInfo.rideType}`);
    }
    console.log(`   Total connected drivers: ${this.connectedDrivers.size}`);
    console.log('   All driver IDs:', Array.from(this.connectedDrivers.keys()));
    console.log('='.repeat(60));

    if (driverInfo) {
      const acceptPayload = {
        rideId: data.rideId,
        passengerId: data.passengerId,
        driverId: data.driverId,
        counterFare: offer.counterFare,
        message: 'Your counter offer was accepted!',
      };

      console.log('='.repeat(60));
      console.log('📤 EMITTING offerAccepted TO DRIVER');
      console.log(`   Target Socket: ${driverInfo.socketId}`);
      console.log('   Payload:', JSON.stringify(acceptPayload, null, 2));
      console.log('='.repeat(60));

      this.server.to(driverInfo.socketId).emit('offerAccepted', acceptPayload);

      console.log(`✅ offerAccepted event emitted successfully`);
    } else {
      console.log('='.repeat(60));
      console.log(`❌ DRIVER ${data.driverId} IS NOT CONNECTED`);
      console.log(
        `   Available driver IDs:`,
        Array.from(this.connectedDrivers.keys()),
      );
      console.log('='.repeat(60));
    }

    // Notify other drivers that their offer was rejected
    offers.forEach((o) => {
      if (o.driverId !== data.driverId) {
        const otherDriver = this.connectedDrivers.get(o.driverId);
        if (otherDriver) {
          this.server.to(otherDriver.socketId).emit('offerRejected', {
            rideId: data.rideId,
          });
          console.log(`📤 Sent offerRejected to driver ${o.driverId}`);
        }
      }
    });

    // Clear offers for that ride from memory
    this.rideOffers.delete(data.rideId);
    console.log(`🧹 Cleared offers for ride ${data.rideId}`);
    console.log('='.repeat(60));

    return updatedRide;
  }

  /**
   * Atomic acceptance of shared ride requests.
   * First driver to accept gets the ride, all others are rejected.
   */
  @SubscribeMessage('acceptSharedRide')
  async handleAcceptSharedRide(
    @MessageBody()
    data: {
      rideId: string; // primary ride ID
      driverId: string;
    },
    @ConnectedSocket() client: Socket,
  ) {
    console.log('='.repeat(60));
    console.log('🚗 SHARED RIDE ACCEPTANCE REQUEST');
    console.log(`   Ride ID: ${data.rideId}`);
    console.log(`   Ride ID Type: ${typeof data.rideId}`);
    console.log(`   Driver ID: ${data.driverId}`);
    console.log(`   Driver ID Type: ${typeof data.driverId}`);
    console.log('='.repeat(60));

    // Verify driver is connected and authorized
    const connectedDriver = this.connectedDrivers.get(data.driverId);
    if (!connectedDriver || connectedDriver.socketId !== client.id) {
      console.log(`❌ Unauthorized driver ${data.driverId}`);
      console.log(`   Driver found in connected drivers: ${!!connectedDriver}`);
      if (connectedDriver) {
        console.log(`   Expected socket: ${connectedDriver.socketId}`);
        console.log(`   Actual socket: ${client.id}`);
      }
      return { success: false, message: 'Unauthorized' };
    }

    console.log('✅ Driver authorized, attempting atomic acceptance...');

    // Attempt atomic acceptance
    const result = await this.sharedRideRequestService.acceptSharedRideAtomic(
      data.rideId,
      data.driverId,
    );

    if (!result) {
      console.log(`❌ Failed to accept shared ride - already taken`);
      this.server.to(client.id).emit('sharedRideAcceptanceFailed', {
        rideId: data.rideId,
        message: 'This ride has already been accepted by another driver.',
      });
      return { success: false, message: 'Ride already accepted' };
    }

    console.log(`✅ Driver ${data.driverId} successfully accepted shared ride`);

    // Notify the accepted driver
    const acceptedPayload = {
      success: true,
      rideId: data.rideId,
      primaryRide: result.primary,
      secondaryRide: result.secondary,
      message: 'Shared ride accepted successfully!',
    };

    this.server.to(client.id).emit('sharedRideAccepted', acceptedPayload);
    console.log(`📤 Sent sharedRideAccepted to driver ${data.driverId}`);

    // Notify both passengers
    const primaryPassengerId = (result.primary.passengerID as any)?._id
      ? (result.primary.passengerID as any)._id.toString()
      : result.primary.passengerID.toString();

    const secondaryPassengerId = (result.secondary.passengerID as any)?._id
      ? (result.secondary.passengerID as any)._id.toString()
      : result.secondary.passengerID.toString();

    const primaryPassengerSocket =
      this.connectedPassengers.get(primaryPassengerId);
    const secondaryPassengerSocket =
      this.connectedPassengers.get(secondaryPassengerId);

    const driver = result.primary.driverID;

    // Get driver's current location from connectedDrivers map
    const driverInfo = this.connectedDrivers.get(data.driverId);
    const driverLocation = driverInfo?.location || null;

    console.log(`🔍 Driver location for ${data.driverId}:`, driverLocation);

    const driverData = {
      _id: (driver as any)?._id || driver,
      username: (driver as any)?.fullname?.firstname || 'Driver',
      phone: (driver as any)?.phoneNumber || '',
      vehicleInfo: {
        vehicleColor: (driver as any)?.vehicle?.color || '',
        vehicleCompany: (driver as any)?.vehicle?.company || '',
        vehicleModel: (driver as any)?.vehicle?.model || '',
        vehicleNumber: (driver as any)?.vehicle?.plate || '',
      },
      profilePicture: (driver as any)?.profilePhoto?.url || '',
      location: driverLocation
        ? {
            latitude: driverLocation[1],
            longitude: driverLocation[0],
          }
        : null,
    };

    if (primaryPassengerSocket) {
      this.server.to(primaryPassengerSocket).emit('driverAssigned', {
        rideId: result.primary._id,
        driver: driverData,
        message: 'A driver has been assigned to your shared ride!',
      });
      console.log(`📤 Notified primary passenger ${primaryPassengerId}`);
      console.log(`   Driver location sent:`, driverData.location);
    }

    if (secondaryPassengerSocket) {
      this.server.to(secondaryPassengerSocket).emit('driverAssigned', {
        rideId: result.secondary._id,
        driver: driverData,
        message: 'A driver has been assigned to your shared ride!',
      });
      console.log(`📤 Notified secondary passenger ${secondaryPassengerId}`);
      console.log(`   Driver location sent:`, driverData.location);
    }

    // Notify all OTHER drivers that this shared ride is no longer available
    this.connectedDrivers.forEach((info, otherDriverId) => {
      if (otherDriverId !== data.driverId) {
        this.server.to(info.socketId).emit('sharedRideNoLongerAvailable', {
          rideId: data.rideId,
          message: 'This shared ride has been accepted by another driver.',
        });
      }
    });

    console.log(`📤 Sent rejection notifications to all other drivers`);
    console.log('='.repeat(60));

    return { success: true };
  }

  // Add this new event handler to your existing RideGateway class

  @SubscribeMessage('driverReached')
  async handleDriverReached(
    @MessageBody()
    data: {
      driverId: string;
      passengerId: string;
      rideId: string;
    },
    @ConnectedSocket() client: Socket,
  ) {
    console.log(
      `Driver ${data.driverId} reached pickup for ride ${data.rideId}`,
    );

    const driverInfo = this.connectedDrivers.get(data.driverId);
    if (!driverInfo || driverInfo.socketId !== client.id) {
      return { success: false, message: 'Unauthorized' };
    }

    // Notify passenger
    const passengerSocketId = this.connectedPassengers.get(data.passengerId);
    if (passengerSocketId) {
      this.server.to(passengerSocketId).emit('driverArrived', {
        rideId: data.rideId,
        message: 'Your driver has reached the pickup location.',
        status: 'driver_reached', // client-side status only
      });
      console.log(`Passenger ${data.passengerId} notified that driver arrived`);
    }

    // Confirm to driver
    this.server.to(client.id).emit('waitingForPassenger', {
      rideId: data.rideId,
      message: 'Waiting for passenger to board.',
      status: 'driver_reached',
    });

    return {
      success: true,
      message: 'Driver arrival event emitted',
    };
  }

  @SubscribeMessage('startRide')
  async handleStartRide(
    @MessageBody()
    data: {
      driverId: string;
      passengerId: string;
      rideId: string;
    },
    @ConnectedSocket() client: Socket,
  ) {
    console.log(`Driver ${data.driverId} starting ride ${data.rideId}`);

    const driverInfo = this.connectedDrivers.get(data.driverId);
    if (!driverInfo || driverInfo.socketId !== client.id) {
      return { success: false, message: 'Unauthorized' };
    }

    // Update DB → ride started
    const updatedRide = await this.rideRequestService.startRide(data.rideId);

    if (!updatedRide) {
      return { success: false, message: 'Failed to start ride' };
    }

    // Notify passenger
    const passengerSocketId = this.connectedPassengers.get(data.passengerId);
    if (passengerSocketId) {
      this.server.to(passengerSocketId).emit('rideStarted', {
        rideId: data.rideId,
        message: 'Your ride has started.',
        status: 'started',
      });
    }

    // Confirm to driver
    this.server.to(client.id).emit('rideStarted', {
      rideId: data.rideId,
      message: 'Ride started successfully.',
      status: 'started',
    });

    return {
      success: true,
      message: 'Ride started successfully',
      ride: updatedRide,
    };
  }

  @SubscribeMessage('endRide')
  async handleEndRide(
    @MessageBody()
    data: {
      driverId: string;
      passengerId: string;
      rideId: string;
    },
    @ConnectedSocket() client: Socket,
  ) {
    console.log(`Driver ${data.driverId} ending ride ${data.rideId}`);

    // Validate driver is authorized
    const driverInfo = this.connectedDrivers.get(data.driverId);
    if (!driverInfo || driverInfo.socketId !== client.id) {
      return { success: false, message: 'Unauthorized' };
    }

    // Update DB → ride completed
    const updatedRide = await this.rideRequestService.completeRide(data.rideId);

    if (!updatedRide) {
      console.log(`Failed to complete ride ${data.rideId}`);
      return { success: false, message: 'Failed to complete ride' };
    }

    // 🚗 Check if this is a shared ride (has matchedWith)
    let matchedRideId: string | null = null;
    let matchedRide: any = null;
    if (updatedRide.matchedWith) {
      matchedRideId =
        (updatedRide.matchedWith as any)._id?.toString() ||
        updatedRide.matchedWith.toString();
      console.log(
        `🔗 This is a shared ride, also completing matched ride: ${matchedRideId}`,
      );

      // Complete the matched ride as well
      if (matchedRideId) {
        matchedRide = await this.rideRequestService.completeRide(matchedRideId);
      }
    }

    // Notify passenger
    const passengerSocketId = this.connectedPassengers.get(data.passengerId);
    if (passengerSocketId) {
      this.server.to(passengerSocketId).emit('rideCompleted', {
        rideId: data.rideId,
        message: 'Your ride has been completed. Thank you for riding with us!',
        status: 'completed',
      });
    }

    // Notify second passenger if this is a shared ride
    if (matchedRide && matchedRide.passengerID) {
      const secondPassengerId =
        (matchedRide.passengerID as any)._id?.toString() ||
        matchedRide.passengerID.toString();
      const secondPassengerSocketId =
        this.connectedPassengers.get(secondPassengerId);
      if (secondPassengerSocketId) {
        console.log(
          `🔗 Notifying second passenger ${secondPassengerId} about ride completion`,
        );
        this.server.to(secondPassengerSocketId).emit('rideCompleted', {
          rideId: matchedRideId,
          message:
            'Your ride has been completed. Thank you for riding with us!',
          status: 'completed',
        });
      }
    }

    // Confirm to driver
    this.server.to(client.id).emit('rideCompleted', {
      rideId: data.rideId,
      message: 'Ride completed successfully.',
      status: 'completed',
    });

    return {
      success: true,
      message: 'Ride completed successfully',
      ride: updatedRide,
    };
  }

  @SubscribeMessage('cancelRide')
  async handleCancelRide(
    @MessageBody()
    data: {
      rideId: string;
      cancelledBy: 'passenger' | 'driver';
      passengerId: string;
      driverId?: string | null;
      reason?: string;
    },
    @ConnectedSocket() client: Socket,
  ) {
    console.log(
      `🚫 ${data.cancelledBy} cancelled ride ${data.rideId}. DriverId: ${data.driverId}. Reason: ${data.reason}`,
    );
    console.log(
      '📡 Connected drivers:',
      Array.from(this.connectedDrivers.keys()),
    );

    // Validate driver if cancellation is from driver
    if (data.cancelledBy === 'driver') {
      if (!data.driverId) {
        return {
          success: false,
          message: 'Driver ID is required for driver cancellation',
        };
      }
      const driverInfo = this.connectedDrivers.get(data.driverId);
      if (!driverInfo || driverInfo.socketId !== client.id) {
        return { success: false, message: 'Unauthorized driver' };
      }
    }

    // Validate passenger if cancellation is from passenger
    if (data.cancelledBy === 'passenger') {
      const passengerSocketId = this.connectedPassengers.get(data.passengerId);
      if (!passengerSocketId || passengerSocketId !== client.id) {
        return { success: false, message: 'Unauthorized passenger' };
      }
    }

    // ✅ Update DB → ride cancelled
    const updatedRide = await this.rideRequestService.cancelRide(
      data.rideId,
      data.cancelledBy,
      data.reason,
    );

    if (!updatedRide) {
      console.log(`Failed to cancel ride ${data.rideId}`);
      return { success: false, message: 'Failed to cancel ride' };
    }

    // 🚗 Check if this is a shared ride (has matchedWith)
    let matchedRideId: string | null = null;
    if (updatedRide.matchedWith) {
      matchedRideId =
        (updatedRide.matchedWith as any)._id?.toString() ||
        updatedRide.matchedWith.toString();
      console.log(
        `🔗 This is a shared ride, also cancelling matched ride: ${matchedRideId}`,
      );

      // Cancel the matched ride as well
      if (matchedRideId) {
        await this.rideRequestService.cancelRide(
          matchedRideId,
          data.cancelledBy,
          data.reason || 'Partner passenger cancelled the ride',
        );
      }
    }

    // ✅ Notify the other party
    if (data.cancelledBy === 'passenger') {
      // If passenger cancels, notify all drivers (in case ride wasn't accepted yet)
      // or the specific driver if one was accepted
      if (data.driverId) {
        const driverInfo = this.connectedDrivers.get(data.driverId);
        if (driverInfo) {
          this.server.to(driverInfo.socketId).emit('rideCancelled', {
            rideId: data.rideId,
            cancelledBy: 'passenger',
            reason: data.reason || 'Passenger cancelled the ride.',
            status: 'cancelled',
          });
        }
      } else {
        // No specific driver - broadcast to all connected drivers
        console.log('🔊 Broadcasting ride cancellation to all drivers');
        console.log(
          `🔊 Total connected drivers: ${this.connectedDrivers.size}`,
        );
        let emittedCount = 0;
        this.connectedDrivers.forEach((driverInfo, driverId) => {
          console.log(
            `🔊 Emitting rideCancelled to driver ${driverId} (socket: ${driverInfo.socketId})`,
          );
          // Emit for the primary ride
          this.server.to(driverInfo.socketId).emit('rideCancelled', {
            rideId: data.rideId,
            cancelledBy: 'passenger',
            reason: data.reason || 'Passenger cancelled the ride.',
            status: 'cancelled',
          });

          // If it's a shared ride, also emit for the matched ride
          if (matchedRideId) {
            console.log(`🔊 Also emitting for matched ride ${matchedRideId}`);
            this.server.to(driverInfo.socketId).emit('rideCancelled', {
              rideId: matchedRideId,
              cancelledBy: 'passenger',
              reason: data.reason || 'Partner passenger cancelled the ride.',
              status: 'cancelled',
            });
          }

          emittedCount++;
        });
        console.log(`🔊 Emitted rideCancelled to ${emittedCount} drivers`);
      }
    } else if (data.cancelledBy === 'driver') {
      const passengerSocketId = this.connectedPassengers.get(data.passengerId);
      if (passengerSocketId) {
        this.server.to(passengerSocketId).emit('rideCancelled', {
          rideId: data.rideId,
          cancelledBy: 'driver',
          reason: data.reason || 'Driver cancelled the ride.',
          status: 'cancelled',
        });
      }
    }

    // ✅ Confirm to the canceller
    this.server.to(client.id).emit('rideCancelled', {
      rideId: data.rideId,
      cancelledBy: data.cancelledBy,
      reason: data.reason,
      status: 'cancelled',
    });

    return {
      success: true,
      message: 'Ride cancelled successfully',
      ride: updatedRide,
    };
  }

  @SubscribeMessage('driverArrivedAtPickup')
  async handleDriverArrivedAtPickup(
    @MessageBody()
    data: {
      driverId: string;
      passengerId: string;
      rideId: string;
      passengerName: string;
      stopType: string;
    },
    @ConnectedSocket() client: Socket,
  ) {
    console.log(
      `🚗 [SHARED RIDE] Driver ${data.driverId} arrived at pickup for passenger ${data.passengerName} (${data.passengerId})`,
    );
    console.log(
      `🚗 [SHARED RIDE] RideId: ${data.rideId}, StopType: ${data.stopType}`,
    );

    const driverInfo = this.connectedDrivers.get(data.driverId);
    if (!driverInfo || driverInfo.socketId !== client.id) {
      console.error(`❌ [SHARED RIDE] Unauthorized driver ${data.driverId}`);
      return { success: false, message: 'Unauthorized' };
    }

    // Notify the specific passenger
    const passengerSocketId = this.connectedPassengers.get(data.passengerId);
    console.log(
      `📡 [SHARED RIDE] Looking for passenger ${data.passengerId}, found socketId: ${passengerSocketId}`,
    );

    if (passengerSocketId) {
      this.server.to(passengerSocketId).emit('driverArrivedAtYourPickup', {
        rideId: data.rideId,
        driverId: data.driverId,
        message: `Your driver has arrived at your pickup location.`,
      });
      console.log(
        `✅ [SHARED RIDE] Notified passenger ${data.passengerId} (socket: ${passengerSocketId}) of driver arrival`,
      );
    } else {
      console.warn(
        `⚠️ [SHARED RIDE] Passenger ${data.passengerId} not connected, cannot notify of arrival`,
      );
      console.warn(
        `⚠️ [SHARED RIDE] Connected passengers: ${Array.from(this.connectedPassengers.keys()).join(', ')}`,
      );
    }

    return {
      success: true,
      message: 'Passenger notified of driver arrival',
    };
  }

  @SubscribeMessage('startSharedRideLeg')
  async handleStartSharedRideLeg(
    @MessageBody()
    data: {
      driverId: string;
      passengerId: string;
      rideId: string;
      passengerName: string;
    },
    @ConnectedSocket() client: Socket,
  ) {
    console.log(
      `🚀 [SHARED RIDE] Driver ${data.driverId} starting ride leg for passenger ${data.passengerName} (${data.passengerId})`,
    );
    console.log(`🚀 [SHARED RIDE] RideId: ${data.rideId}`);

    const driverInfo = this.connectedDrivers.get(data.driverId);
    if (!driverInfo || driverInfo.socketId !== client.id) {
      console.error(`❌ [SHARED RIDE] Unauthorized driver ${data.driverId}`);
      return { success: false, message: 'Unauthorized' };
    }

    // Notify the specific passenger
    const passengerSocketId = this.connectedPassengers.get(data.passengerId);
    console.log(
      `📡 [SHARED RIDE] Looking for passenger ${data.passengerId}, found socketId: ${passengerSocketId}`,
    );

    if (passengerSocketId) {
      this.server.to(passengerSocketId).emit('yourRideLegStarted', {
        rideId: data.rideId,
        driverId: data.driverId,
        message: `Your ride has started. Enjoy your journey!`,
        status: 'started',
      });
      console.log(
        `✅ [SHARED RIDE] Notified passenger ${data.passengerId} (socket: ${passengerSocketId}) that their ride leg started`,
      );
    } else {
      console.warn(
        `⚠️ [SHARED RIDE] Passenger ${data.passengerId} not connected, cannot notify of ride start`,
      );
      console.warn(
        `⚠️ [SHARED RIDE] Connected passengers: ${Array.from(this.connectedPassengers.keys()).join(', ')}`,
      );
    }

    return {
      success: true,
      message: 'Passenger notified of ride start',
    };
  }

  @SubscribeMessage('endSharedRideLeg')
  async handleEndSharedRideLeg(
    @MessageBody()
    data: {
      driverId: string;
      passengerId: string;
      rideId: string;
      passengerName: string;
      fare: string;
    },
    @ConnectedSocket() client: Socket,
  ) {
    console.log(
      `✅ [SHARED RIDE] Driver ${data.driverId} ending ride leg for passenger ${data.passengerName} (${data.passengerId})`,
    );
    console.log(
      `✅ [SHARED RIDE] RideId: ${data.rideId}, Fare: Rs ${data.fare}`,
    );

    const driverInfo = this.connectedDrivers.get(data.driverId);
    if (!driverInfo || driverInfo.socketId !== client.id) {
      console.error(`❌ [SHARED RIDE] Unauthorized driver ${data.driverId}`);
      return { success: false, message: 'Unauthorized' };
    }

    // Notify the specific passenger
    const passengerSocketId = this.connectedPassengers.get(data.passengerId);
    console.log(
      `📡 [SHARED RIDE] Looking for passenger ${data.passengerId}, found socketId: ${passengerSocketId}`,
    );

    if (passengerSocketId) {
      this.server.to(passengerSocketId).emit('yourRideLegCompleted', {
        rideId: data.rideId,
        driverId: data.driverId,
        fare: data.fare,
        message: `You have reached your destination. Thank you for riding with us!`,
        status: 'completed',
      });
      console.log(
        `✅ [SHARED RIDE] Notified passenger ${data.passengerId} (socket: ${passengerSocketId}) that their ride leg completed`,
      );
    } else {
      console.warn(
        `⚠️ [SHARED RIDE] Passenger ${data.passengerId} not connected, cannot notify of ride completion`,
      );
      console.warn(
        `⚠️ [SHARED RIDE] Connected passengers: ${Array.from(this.connectedPassengers.keys()).join(', ')}`,
      );
    }

    return {
      success: true,
      message: 'Passenger notified of ride completion',
    };
  }
}
