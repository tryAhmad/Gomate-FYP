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
import { forwardRef, Inject, Logger } from '@nestjs/common';
import { SharedRideRequestService } from 'src/rides/ride-request/shared-ride-request.service';

import { createAdapter } from '@socket.io/redis-adapter';
import { createClient, RedisClientType } from 'redis';

@WebSocketGateway({ cors: true })
export class RideGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(RideGateway.name);

  // Redis client for adapter + offers store
  private redis!: RedisClientType;
  private redisSub!: RedisClientType;

  // Offers TTL (seconds)
  private readonly OFFERS_TTL_SECONDS = 600; // 10 minutes

  constructor(
    @Inject(forwardRef(() => RideRequestService))
    private readonly rideRequestService: RideRequestService,

    @Inject(forwardRef(() => SharedRideRequestService))
    private readonly sharedRideRequestService: SharedRideRequestService,

    private readonly driversService: DriversService,
  ) {}

  /** Initialize Redis adapter after Socket.IO server is ready */
  async afterInit(server: Server) {
    const url = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
    this.redis = createClient({ url });
    this.redisSub = this.redis.duplicate();

    await this.redis.connect();
    await this.redisSub.connect();

    server.adapter(createAdapter(this.redis, this.redisSub));
    this.logger.log(`Socket.IO Redis adapter connected @ ${url}`);
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    // No maps to clean up—rooms + Redis adapter handle cluster state.
  }

  // ---------------------------
  // Registration (rooms only)
  // ---------------------------

  /** Driver registration: join a stable room for this driver */
  @SubscribeMessage('registerDriver')
  async handleDriverRegister(
    @MessageBody()
    data: { driverId: string; location: [number, number]; rideType: string },
    @ConnectedSocket() client: Socket,
  ) {
    // Persist latest socketId (if you use it elsewhere)
    await this.driversService.updateSocketId(data.driverId, client.id);

    // Join per-driver room
    client.join(`driver:${data.driverId}`);

    // If you want rideType rooms (optional), you can also:
    // client.join(`rideType:${data.rideType}`);

    this.logger.log(
      `Driver ${data.driverId} registered (rideType=${data.rideType}) on socket ${client.id}`,
    );
  }

  /** Passenger registration: join a stable room for this passenger */
  @SubscribeMessage('registerPassenger')
  handlePassengerRegister(
    @MessageBody() data: { passengerId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`passenger:${data.passengerId}`);
    this.logger.log(
      `Passenger ${data.passengerId} registered on socket ${client.id}`,
    );
  }

  // ---------------------------
  // Ride creation
  // ---------------------------

  // Solo ride creation (unchanged flow; your service should notify drivers)
  @SubscribeMessage('createRideRequest')
  async handleRideRequest(
    @MessageBody() data: { passengerId: string; dto: CreateRideRequestDto },
  ) {
    return this.rideRequestService.createRideAndNotifyDrivers(
      data.passengerId,
      data.dto,
    );
  }

  // Shared ride creation — now tries immediate matching
  @SubscribeMessage('createSharedRideRequest')
  async handleSharedRideRequest(
    @MessageBody() data: { passengerId: string; dto: CreateRideRequestDto },
  ) {
    return this.sharedRideRequestService.createSharedAndMatch(
      data.passengerId,
      data.dto,
    );
  }

  // ---------------------------
  // Counter-offers (Redis-backed)
  // ---------------------------

  /** Driver sends a counter offer; we persist to Redis (TTL) and notify passenger */
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
    this.logger.log(
      `Driver ${data.driverId} countered ${data.counterFare} for ride ${data.rideId}`,
    );

    await this.saveOffer(data.rideId, data.driverId, data.counterFare);

    // Notify passenger room
    this.server
      .to(`passenger:${data.passengerId}`)
      .emit('receiveCounterOffer', {
        rideId: data.rideId,
        driverId: data.driverId,
        counterFare: data.counterFare,
      });
  }

  /** Passenger accepts a driver's offer; we confirm and notify all parties */
  @SubscribeMessage('acceptDriverOffer')
  async handleAcceptDriverOffer(
    @MessageBody()
    data: {
      rideId: string;
      driverId: string;
      passengerId: string;
    },
  ) {
    this.logger.log(
      `Passenger ${data.passengerId} accepted driver ${data.driverId} for ride ${data.rideId}`,
    );

    // Ensure the driver's offer exists
    const offer = await this.getOffer(data.rideId, data.driverId);
    if (offer == null) {
      this.logger.warn(
        `No stored offer for ride ${data.rideId} from driver ${data.driverId}`,
      );
      return { ok: false, message: 'Offer not found or expired' };
    }

    // Update DB with accepted driver and fare
    const updatedRide = await this.rideRequestService.acceptDriverOffer(
      data.rideId,
      data.driverId,
      offer,
    );

    if (!updatedRide) {
      return { ok: false, message: 'Ride not found or already assigned' };
    }

    // Notify the accepted driver
    this.server.to(`driver:${data.driverId}`).emit('offerAccepted', {
      rideId: data.rideId,
      passengerId: data.passengerId,
    });

    // Notify other drivers that their offer is rejected
    const allOffers = await this.getAllOffers(data.rideId);
    for (const [otherDriverId] of Object.entries(allOffers)) {
      if (otherDriverId !== data.driverId) {
        this.server.to(`driver:${otherDriverId}`).emit('offerRejected', {
          rideId: data.rideId,
        });
      }
    }

    // Clear offers for this ride
    await this.clearOffers(data.rideId);

    return { ok: true, ride: updatedRide };
  }

  // ---------------------------
  // Redis helpers for offers
  // ---------------------------

  private offersKey(rideId: string) {
    return `ride:offers:${rideId}`;
  }

  private async saveOffer(
    rideId: string,
    driverId: string,
    counterFare: number,
  ) {
    const key = this.offersKey(rideId);
    await this.redis.hSet(key, driverId, String(counterFare));
    // Refresh TTL on every new offer
    await this.redis.expire(key, this.OFFERS_TTL_SECONDS);
  }

  private async getOffer(
    rideId: string,
    driverId: string,
  ): Promise<number | null> {
    const key = this.offersKey(rideId);
    const val = await this.redis.hGet(key, driverId);
    return val == null ? null : Number(val);
  }

  private async getAllOffers(rideId: string): Promise<Record<string, number>> {
    const key = this.offersKey(rideId);
    const map = await this.redis.hGetAll(key);
    const out: Record<string, number> = {};
    for (const [k, v] of Object.entries(map)) out[k] = Number(v);
    return out;
  }

  private async clearOffers(rideId: string) {
    const key = this.offersKey(rideId);
    await this.redis.del(key);
  }
}
