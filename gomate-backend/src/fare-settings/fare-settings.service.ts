import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { FareSetting, FareSettingDocument } from './schemas/fare-setting.schema';
import { CreateFareSettingDto } from './dto/create-fare-setting.dto';
import { UpdateFareSettingDto } from './dto/update-fare-setting.dto';

@Injectable()
export class FareSettingsService {
  // Default fallback values if not found in database
  private readonly defaultFares = {
    auto: { baseFare: 40, perKmRate: 15, perMinuteRate: 2 },
    car: { baseFare: 70, perKmRate: 25, perMinuteRate: 3 },
    bike: { baseFare: 25, perKmRate: 10, perMinuteRate: 1.5 },
  };

  constructor(
    @InjectModel(FareSetting.name)
    private fareSettingModel: Model<FareSettingDocument>,
  ) {}

  async onModuleInit() {
    // Seed default fare settings if they don't exist
    await this.seedDefaultFares();
  }

  private async seedDefaultFares() {
    const existingCount = await this.fareSettingModel.countDocuments();
    
    if (existingCount === 0) {
      console.log('Seeding default fare settings...');
      const defaultSettings = [
        { rideType: 'auto', ...this.defaultFares.auto },
        { rideType: 'car', ...this.defaultFares.car },
        { rideType: 'bike', ...this.defaultFares.bike },
      ];

      await this.fareSettingModel.insertMany(defaultSettings);
      console.log('Default fare settings seeded successfully');
    }
  }

  async getAllFareSettings() {
    const settings = await this.fareSettingModel.find().lean();
    return settings;
  }

  async getFareByRideType(rideType: 'auto' | 'car' | 'bike') {
    const setting = await this.fareSettingModel.findOne({ rideType }).lean();
    
    // Fallback to default if not found
    if (!setting) {
      console.warn(`Fare setting not found for ${rideType}, using default`);
      return {
        rideType,
        ...this.defaultFares[rideType],
      };
    }

    return setting;
  }

  async createFareSetting(dto: CreateFareSettingDto) {
    const existing = await this.fareSettingModel.findOne({ rideType: dto.rideType });
    
    if (existing) {
      return {
        message: 'Fare setting already exists for this ride type. Use update instead.',
        setting: existing,
      };
    }

    const setting = new this.fareSettingModel(dto);
    await setting.save();

    return {
      message: 'Fare setting created successfully',
      setting,
    };
  }

  async updateFareSetting(rideType: string, dto: UpdateFareSettingDto) {
    const updated = await this.fareSettingModel.findOneAndUpdate(
      { rideType },
      { $set: dto },
      { new: true, runValidators: true },
    );

    if (!updated) {
      throw new NotFoundException(`Fare setting not found for ride type: ${rideType}`);
    }

    return {
      message: 'Fare setting updated successfully',
      setting: updated,
    };
  }

  async deleteFareSetting(rideType: string) {
    const deleted = await this.fareSettingModel.findOneAndDelete({ rideType });

    if (!deleted) {
      throw new NotFoundException(`Fare setting not found for ride type: ${rideType}`);
    }

    return {
      message: 'Fare setting deleted successfully',
      setting: deleted,
    };
  }

  // Method to get all fares as a map for quick lookup
  async getFaresMap() {
    const settings = await this.getAllFareSettings();
    const faresMap: Record<string, { baseFare: number; perKmRate: number; perMinuteRate: number }> = {};

    settings.forEach((setting) => {
      faresMap[setting.rideType] = {
        baseFare: setting.baseFare,
        perKmRate: setting.perKmRate,
        perMinuteRate: setting.perMinuteRate,
      };
    });

    // Fill in any missing ride types with defaults
    (['auto', 'car', 'bike'] as const).forEach((rideType) => {
      if (!faresMap[rideType]) {
        faresMap[rideType] = this.defaultFares[rideType];
      }
    });

    return faresMap;
  }
}
