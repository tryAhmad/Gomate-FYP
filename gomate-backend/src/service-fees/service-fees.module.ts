import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ServiceFeesController } from './service-fees.controller';
import { ServiceFeesService } from './service-fees.service';
import { ServiceFee, ServiceFeeSchema } from './schemas/service-fee.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ServiceFee.name, schema: ServiceFeeSchema },
    ]),
  ],
  controllers: [ServiceFeesController],
  providers: [ServiceFeesService],
  exports: [ServiceFeesService],
})
export class ServiceFeesModule {}
