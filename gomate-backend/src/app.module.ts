import { forwardRef, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PassengersModule } from './passengers/passengers.module';
import { DriversModule } from './drivers/drivers.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
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
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const mongoUri = configService.get<string>('MONGODB_URI');
        console.log('Mongo URI:', mongoUri);

        return {
          uri: mongoUri,
          // ensures replica set features are fully supported
          serverSelectionTimeoutMS: 5000,
        };
      },
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
