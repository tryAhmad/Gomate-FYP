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
  handleCounterOffer(
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

    // Send to passenger in real-time
    const passengerSocketId = this.connectedPassengers.get(data.passengerId);
    if (passengerSocketId) {
      this.server.to(passengerSocketId).emit('receiveCounterOffer', {
        rideId: data.rideId,
        driverId: data.driverId,
        counterFare: data.counterFare,
      });
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
}
