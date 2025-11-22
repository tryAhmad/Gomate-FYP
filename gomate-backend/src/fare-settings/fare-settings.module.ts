import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FareSettingsController } from './fare-settings.controller';
import { FareSettingsService } from './fare-settings.service';
import { FareSetting, FareSettingSchema } from './schemas/fare-setting.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: FareSetting.name, schema: FareSettingSchema },
    ]),
  ],
  controllers: [FareSettingsController],
  providers: [FareSettingsService],
  exports: [FareSettingsService],
})
export class FareSettingsModule {}
