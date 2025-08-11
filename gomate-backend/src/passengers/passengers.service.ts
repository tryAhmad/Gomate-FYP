import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePassengerDto } from './dto/create-passenger.dto';
import { UpdatePassengerDto } from './dto/update-passenger.dto';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Passenger, PassengerDocument } from './schemas/passenger.schema';

@Injectable()
export class PassengersService {
  constructor(
    @InjectModel(Passenger.name)
    private passengerModel: Model<PassengerDocument>,
  ) {}

  async createPassenger(createPassengerDto: CreatePassengerDto) {
    const newPassenger = new this.passengerModel(createPassengerDto);
    return await newPassenger.save();
  }

  findAll() {
    return this.passengerModel.find().exec();
  }

  async getPassengerProfile(id: string) {
    const passenger =  this.passengerModel.findById(id).select('-password');
    if (!passenger) {
      throw new NotFoundException('Passenger not found');
    }
    return passenger;
  }

  findOne(id: string) {
    return this.passengerModel.findById(id).exec();
  }

  findOneByEmail(email: string) {
    return this.passengerModel.findOne({email}).exec();
  }

  update(id: string, updatePassengerDto: UpdatePassengerDto) {
    return this.passengerModel.findByIdAndUpdate(id, updatePassengerDto, { new: true }).exec();
  }

  remove(id: string) {
    return this.passengerModel.findByIdAndDelete(id).exec();
  }
}
