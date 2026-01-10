// src/socket/socket.module.ts
import { forwardRef, Module } from '@nestjs/common';
import { RideGateway } from './gateways/ride.gateway';
import { DriversModule } from 'src/drivers/drivers.module';
import { RideRequestModule } from 'src/rides/ride-request/ride-request.module';

@Module({
  imports: [
    forwardRef(() => RideRequestModule),
    forwardRef(() => DriversModule), // exports DriversService
  ],
  providers: [RideGateway],
  exports: [RideGateway],
})
export class WebSocketModule {}
