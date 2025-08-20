import { forwardRef, Module, OnModuleInit } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PassengersModule } from './passengers/passengers.module';
import { DriversModule } from './drivers/drivers.module';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule, InjectConnection } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { RideRequestModule } from './rides/ride-request/ride-request.module';
import { WebSocketModule } from './socket/webSocket.module';
import { Connection } from 'mongoose';

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
    MongooseModule.forRoot(process.env.MONGODB_URI || '', {
      retryAttempts: 5, // optional auto-reconnect
      retryDelay: 2000, // 2 sec delay between retries
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements OnModuleInit {
  constructor(@InjectConnection() private readonly connection: Connection) {
    console.log('Mongo URI:', process.env.MONGODB_URI);
  }

  onModuleInit() {
    // ✅ Fires when Mongo is connected
    this.connection.once('open', () => {
      console.log('✅ MongoDB connected');
    });

    // ❌ Fires if there’s an error connecting or during runtime
    this.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err.message);
    });

    // ⚠️ Fires if Mongo gets disconnected later
    this.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected');
    });
  }
}
