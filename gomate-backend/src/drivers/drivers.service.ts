import { Injectable } from '@nestjs/common';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Driver, DriverDocument } from './schemas/driver.schema';
import { RideType } from 'src/common/enums/ride-type.enum';

@Injectable()
export class DriversService {
  constructor(
    @InjectModel(Driver.name) private driverModel: Model<DriverDocument>,
  ) {}

  async createDriver(createDriverDto: CreateDriverDto) {
    const newDriver = new this.driverModel(createDriverDto);
    return await newDriver.save();
  }

  async findAll() {
    return this.driverModel.find().exec();
  }

  async findOne(id: string) {
    return this.driverModel.findById(id).exec();
  }

  async findOneByEmail(email: string) {
    return this.driverModel.findOne({ email }).select('+password').exec();
  }

  async update(id: string, updateDriverDto: UpdateDriverDto) {
    return this.driverModel
      .findByIdAndUpdate(id, updateDriverDto, {
        new: true,
      })
      .exec();
  }

  async updateSocketId(driverId: string, socketId: string) {
    return this.driverModel.findByIdAndUpdate(driverId, { socketId });
  }

  async remove(id: string) {
    return this.driverModel.findByIdAndDelete(id).exec();
  }

  async findNearbyDrivers(
    location: [number, number],
    rideTypes: RideType,
    radius: number,
  ) {
    console.log(location[0], location[1],);
    const drivers = await this.driverModel.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: location,
          },
          $maxDistance: radius,
        },
      },
      'vehicle.vehicleType': rideTypes,
      status: 'active',
    });

    return {
      message: 'Nearby drivers retrieved successfully',
      drivers,
    };
  }
}
