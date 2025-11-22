import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ServiceFee, ServiceFeeDocument } from './schemas/service-fee.schema';
import { CreateServiceFeeDto } from './dto/create-service-fee.dto';
import { UpdateServiceFeeDto } from './dto/update-service-fee.dto';

@Injectable()
export class ServiceFeesService {
  // Default weekly fees if not found in database (in PKR)
  private readonly defaultFees = {
    car: 1000,
    motorcycle: 500,
    auto: 750,
  };

  constructor(
    @InjectModel(ServiceFee.name)
    private serviceFeeModel: Model<ServiceFeeDocument>,
  ) {}

  async onModuleInit() {
    // Seed default service fees if they don't exist
    await this.seedDefaultFees();
  }

  private async seedDefaultFees() {
    const existingCount = await this.serviceFeeModel.countDocuments();
    
    if (existingCount === 0) {
      console.log('Seeding default service fees...');
      const defaultSettings = [
        { vehicleType: 'car', weeklyFee: this.defaultFees.car, isActive: true },
        { vehicleType: 'motorcycle', weeklyFee: this.defaultFees.motorcycle, isActive: true },
        { vehicleType: 'auto', weeklyFee: this.defaultFees.auto, isActive: true },
      ];

      await this.serviceFeeModel.insertMany(defaultSettings);
      console.log('Default service fees seeded successfully');
    }
  }

  async getAllServiceFees() {
    const fees = await this.serviceFeeModel.find().lean();
    return fees;
  }

  async getServiceFeeByVehicleType(vehicleType: 'car' | 'motorcycle' | 'auto') {
    const fee = await this.serviceFeeModel.findOne({ vehicleType }).lean();
    
    // Fallback to default if not found
    if (!fee) {
      console.warn(`Service fee not found for ${vehicleType}, using default`);
      return {
        vehicleType,
        weeklyFee: this.defaultFees[vehicleType],
        isActive: true,
      };
    }

    return fee;
  }

  async createServiceFee(dto: CreateServiceFeeDto) {
    const existing = await this.serviceFeeModel.findOne({ vehicleType: dto.vehicleType });
    
    if (existing) {
      return {
        message: 'Service fee already exists for this vehicle type. Use update instead.',
        fee: existing,
      };
    }

    const fee = new this.serviceFeeModel(dto);
    await fee.save();

    return {
      message: 'Service fee created successfully',
      fee,
    };
  }

  async updateServiceFee(vehicleType: string, dto: UpdateServiceFeeDto) {
    const updated = await this.serviceFeeModel.findOneAndUpdate(
      { vehicleType },
      { $set: dto },
      { new: true, runValidators: true },
    );

    if (!updated) {
      throw new NotFoundException(`Service fee not found for vehicle type: ${vehicleType}`);
    }

    return {
      message: 'Service fee updated successfully',
      fee: updated,
    };
  }

  async deleteServiceFee(vehicleType: string) {
    const deleted = await this.serviceFeeModel.findOneAndDelete({ vehicleType });

    if (!deleted) {
      throw new NotFoundException(`Service fee not found for vehicle type: ${vehicleType}`);
    }

    return {
      message: 'Service fee deleted successfully',
      fee: deleted,
    };
  }

  // Method to get all fees as a map for quick lookup
  async getFeesMap() {
    const fees = await this.getAllServiceFees();
    const feesMap: Record<string, number> = {};

    fees.forEach((fee) => {
      if (fee.isActive) {
        feesMap[fee.vehicleType] = fee.weeklyFee;
      }
    });

    // Fill in any missing vehicle types with defaults
    (['car', 'motorcycle', 'auto'] as const).forEach((vehicleType) => {
      if (!feesMap[vehicleType]) {
        feesMap[vehicleType] = this.defaultFees[vehicleType];
      }
    });

    return feesMap;
  }
}
