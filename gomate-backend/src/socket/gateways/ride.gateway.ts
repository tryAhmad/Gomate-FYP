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

@WebSocketGateway({ cors: true })
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
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);

    // Remove driver if exists
    for (const [driverId, info] of this.connectedDrivers.entries()) {
      if (info.socketId === client.id) {
        this.connectedDrivers.delete(driverId);
        console.log(`Driver ${driverId} disconnected`);
        return;
      }
    }

    // Remove passenger if exists
    for (const [passengerId, socketId] of this.connectedPassengers.entries()) {
      if (socketId === client.id) {
        this.connectedPassengers.delete(passengerId);
        console.log(`Passenger ${passengerId} disconnected`);
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
    console.log(`Driver ${data.driverId} registered for real-time`);
  }

  @SubscribeMessage('registerPassenger')
  handlePassengerRegister(
    @MessageBody() data: { passengerId: string },
    @ConnectedSocket() client: Socket,
  ) {
    this.connectedPassengers.set(data.passengerId, client.id);
    client.join(data.passengerId); // ✅ This makes `.to(passengerId)` work
    console.log(`Passenger ${data.passengerId} registered for real-time`);
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
    return this.sharedRideRequestService.createSharedRideRequest(
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

    // Store offer in memory
    const offers = this.rideOffers.get(data.rideId) || [];
    offers.push({ driverId: data.driverId, counterFare: data.counterFare });
    this.rideOffers.set(data.rideId, offers);

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
      location: {
        lat: driver.location.coordinates[1],
        lng: driver.location.coordinates[0],
      },
      vehicle: {
        color: driver.vehicle?.color,
        company: driver.vehicle?.company,
        model: driver.vehicle?.model,
        plate: driver.vehicle?.plate,
      },
    };

    // ✅ Send to passenger
    const passengerSocketId = this.connectedPassengers.get(data.passengerId);
    if (passengerSocketId) {
      this.server.to(passengerSocketId).emit('receiveCounterOffer', {
        rideId: data.rideId,
        counterFare: data.counterFare,
        driver: driverInfo,
      });
      console.log(`Sent counter offer to passenger ${data.passengerId}
        details: ${JSON.stringify({
          rideId: data.rideId,
          counterFare: data.counterFare,
          driver: driverInfo,
        })}`);
    } else {
      console.log(`Passenger ${data.passengerId} is not connected`);
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
    console.log(
      `Passenger ${data.passengerId} accepted driver ${data.driverId} for ride ${data.rideId}`,
    );

    // Get the stored offers for this ride
    const offers = this.rideOffers.get(data.rideId) || [];

    // Find the matching driver's offer
    const offer = offers.find((o) => o.driverId === data.driverId);
    if (!offer) {
      console.log(
        `No counter offer found for ride ${data.rideId} and driver ${data.driverId}`,
      );
      return;
    }

    // Update DB with accepted driver and stored counter fare
    const updatedRide = await this.rideRequestService.acceptDriverOffer(
      data.rideId,
      data.driverId,
      offer.counterFare,
    );

    if (!updatedRide) {
      console.log(`Ride ${data.rideId} not found`);
      return;
    }

    // Notify accepted driver
    const driverInfo = this.connectedDrivers.get(data.driverId);
    if (driverInfo) {
      this.server.to(driverInfo.socketId).emit('offerAccepted', {
        rideId: data.rideId,
        passengerId: data.passengerId,
      });
    }

    // Notify other drivers that their offer was rejected
    offers.forEach((o) => {
      if (o.driverId !== data.driverId) {
        const otherDriver = this.connectedDrivers.get(o.driverId);
        if (otherDriver) {
          this.server.to(otherDriver.socketId).emit('offerRejected', {
            rideId: data.rideId,
          });
        }
      }
    });

    // Clear offers for that ride from memory
    this.rideOffers.delete(data.rideId);

    return updatedRide;
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
      `Driver ${data.driverId} has reached pickup location for ride ${data.rideId}`,
    );

    // Verify the driver is connected and matches the socket
    const driverInfo = this.connectedDrivers.get(data.driverId);
    if (!driverInfo || driverInfo.socketId !== client.id) {
      console.log(`Unauthorized driver reach attempt for ride ${data.rideId}`);
      return { success: false, message: 'Unauthorized' };
    }

    // Update ride status to "started"
    const updatedRide = await this.rideRequestService.startRide(data.rideId);

    if (!updatedRide) {
      console.log(`Failed to start ride ${data.rideId}`);
      return { success: false, message: 'Failed to start ride' };
    }

    // Notify passenger that driver has arrived and ride is starting
    const passengerSocketId = this.connectedPassengers.get(data.passengerId);
    if (passengerSocketId) {
      this.server.to(passengerSocketId).emit('driverArrived', {
        rideId: data.rideId,
        message: 'Your driver has arrived! The ride is now starting.',
        status: 'started',
      });
      console.log(`Notified passenger ${data.passengerId} that driver arrived`);
    }

    // Confirm to driver that ride has started
    this.server.to(client.id).emit('rideStarted', {
      rideId: data.rideId,
      message: 'Ride has been started successfully',
      status: 'started',
    });

    return {
      success: true,
      message: 'Ride started successfully',
      ride: updatedRide,
    };
  }
}
