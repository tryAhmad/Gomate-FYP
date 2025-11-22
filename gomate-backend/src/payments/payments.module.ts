import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { Driver, DriverSchema } from '../drivers/schemas/driver.schema';
import { RideRequest, RideRequestSchema } from '../rides/ride-request/schemas/ride-request.schema';
import { ServiceFeesModule } from '../service-fees/service-fees.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    MongooseModule.forFeature([
      { name: Driver.name, schema: DriverSchema },
      { name: RideRequest.name, schema: RideRequestSchema },
    ]),
    ServiceFeesModule,
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
