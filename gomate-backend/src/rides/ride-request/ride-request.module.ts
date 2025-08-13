import { forwardRef, Module } from '@nestjs/common';
import { RideRequestController } from './ride-request.controller';
import { RideRequestService } from './ride-request.service';
import { RideRequest, RideRequestSchema } from './schemas/ride-request.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { DriversModule } from 'src/drivers/drivers.module';
import { WebSocketModule } from 'src/socket/webSocket.module';
import { SharedRideRequestService } from './shared-ride-request.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RideRequest.name, schema: RideRequestSchema },
    ]),
    DriversModule,
    forwardRef(() => WebSocketModule),
  ],
  controllers: [RideRequestController],
  providers: [RideRequestService, SharedRideRequestService],
  exports: [RideRequestService, SharedRideRequestService],
})
export class RideRequestModule {}
