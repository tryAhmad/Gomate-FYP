import { forwardRef, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PassengersModule } from './passengers/passengers.module';
import { DriversModule } from './drivers/drivers.module';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { RideRequestModule } from './rides/ride-request/ride-request.module';
import { WebSocketModule } from './socket/webSocket.module';

@Module({
  imports: [
    PassengersModule,
    DriversModule,
    forwardRef(() => RideRequestModule),
    forwardRef(() => WebSocketModule),
    AuthModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRoot(process.env.MONGODB_URI || ''),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  constructor() {
    console.log('Mongo URI:', process.env.MONGODB_URI);
  }
}
