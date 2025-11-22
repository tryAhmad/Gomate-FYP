import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StatisticsController } from './statistics.controller';
import { StatisticsService } from './statistics.service';
import { Passenger, PassengerSchema } from '../passengers/schemas/passenger.schema';
import { Driver, DriverSchema } from '../drivers/schemas/driver.schema';
import { RideRequest, RideRequestSchema } from '../rides/ride-request/schemas/ride-request.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Passenger.name, schema: PassengerSchema },
      { name: Driver.name, schema: DriverSchema },
      { name: RideRequest.name, schema: RideRequestSchema },
    ]),
  ],
  controllers: [StatisticsController],
  providers: [StatisticsService],
  exports: [StatisticsService],
})
export class StatisticsModule {}
