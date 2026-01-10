import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Driver, DriverDocument } from './schemas/driver.schema';
import { RideType } from 'src/common/enums/ride-type.enum';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { UpdateVerificationStatusDto } from './dto/upload-documents.dto';

@Injectable()
export class DriversService {
  constructor(
    @InjectModel(Driver.name) private driverModel: Model<DriverDocument>,
    private cloudinaryService: CloudinaryService,
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

  async updateDriverLocation(driverId: string, location: [number, number]) {
    return this.driverModel.findByIdAndUpdate(
      driverId,
      {
        $set: {
          location: {
            type: 'Point',
            coordinates: location,
          },
        },
      },
      { new: true },
    );
  }

  async remove(id: string) {
    return this.driverModel.findByIdAndDelete(id).exec();
  }

  async findNearbyDrivers(
    location: [number, number],
    rideTypes: RideType,
    radius: number,
  ) {
    console.log(location[0], location[1]);
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

  /**
   * Upload driver documents to Cloudinary
   */
  async uploadDriverDocuments(
    driverId: string,
    files: {
      cnicFront?: Express.Multer.File[];
      cnicBack?: Express.Multer.File[];
      selfieWithId?: Express.Multer.File[];
      licenseFront?: Express.Multer.File[];
      licenseBack?: Express.Multer.File[];
      profilePhoto?: Express.Multer.File[];
      vehicleImages?: Express.Multer.File[];
    },
    body?: any,
  ) {
    const driver = await this.driverModel.findById(driverId);
    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    const documents: any = driver.documents || {};
    const updateData: any = {};

    // Upload Profile Photo
    if (files.profilePhoto && files.profilePhoto[0]) {
      const result = await this.cloudinaryService.uploadImage(
        files.profilePhoto[0],
        `gomate/drivers/${driverId}/profile`,
      );
      updateData.profilePhoto = {
        url: result.url,
        publicId: result.publicId,
      };
    }

    // Upload CNIC Front
    if (files.cnicFront && files.cnicFront[0]) {
      const result = await this.cloudinaryService.uploadImage(
        files.cnicFront[0],
        `gomate/drivers/${driverId}/cnic/front`,
      );
      if (!documents.cnic) documents.cnic = {};
      documents.cnic.front = {
        url: result.url,
        publicId: result.publicId,
      };
    }

    // Upload CNIC Back
    if (files.cnicBack && files.cnicBack[0]) {
      const result = await this.cloudinaryService.uploadImage(
        files.cnicBack[0],
        `gomate/drivers/${driverId}/cnic/back`,
      );
      if (!documents.cnic) documents.cnic = {};
      documents.cnic.back = {
        url: result.url,
        publicId: result.publicId,
      };
    }

    // Upload Selfie with ID
    if (files.selfieWithId && files.selfieWithId[0]) {
      const result = await this.cloudinaryService.uploadImage(
        files.selfieWithId[0],
        `gomate/drivers/${driverId}/selfie`,
      );
      documents.selfieWithId = {
        url: result.url,
        publicId: result.publicId,
      };
    }

    // Upload License Front
    if (files.licenseFront && files.licenseFront[0]) {
      const result = await this.cloudinaryService.uploadImage(
        files.licenseFront[0],
        `gomate/drivers/${driverId}/license/front`,
      );
      if (!documents.drivingLicense) documents.drivingLicense = {};
      documents.drivingLicense.front = {
        url: result.url,
        publicId: result.publicId,
      };
    }

    // Upload License Back
    if (files.licenseBack && files.licenseBack[0]) {
      const result = await this.cloudinaryService.uploadImage(
        files.licenseBack[0],
        `gomate/drivers/${driverId}/license/back`,
      );
      if (!documents.drivingLicense) documents.drivingLicense = {};
      documents.drivingLicense.back = {
        url: result.url,
        publicId: result.publicId,
      };
    }

    // Update basic info if provided in body
    if (body) {
      // Don't update fullname - it was already set during signup
      // Only update dateOfBirth and phone if they changed
      if (body.dateOfBirth) updateData.dateOfBirth = body.dateOfBirth;
      if (body.phone) updateData.phoneNumber = body.phone;

      // Build complete vehicle object to replace existing one
      const vehicleUpdate: any = {};
      if (body.vehicleCompany) vehicleUpdate.company = body.vehicleCompany;
      if (body.vehicleModel) vehicleUpdate.model = body.vehicleModel;
      if (body.vehicleColor) vehicleUpdate.color = body.vehicleColor;
      if (body.vehicleType) vehicleUpdate.vehicleType = body.vehicleType;
      if (body.vehiclePlate) vehicleUpdate.plate = body.vehiclePlate;
      if (body.vehicleCapacity)
        vehicleUpdate.capacity = parseInt(body.vehicleCapacity);

      // Only update vehicle if we have at least one vehicle field
      if (Object.keys(vehicleUpdate).length > 0) {
        // Preserve only images from existing vehicle, replace all other fields
        const existingImages = driver.vehicle?.images || [];
        updateData.vehicle = {
          ...vehicleUpdate,
          images: existingImages, // Will be updated below if new images uploaded
        };
      }
    }

    // Upload Vehicle Images (1-6)
    if (files.vehicleImages && files.vehicleImages.length > 0) {
      const vehicleImageResults =
        await this.cloudinaryService.uploadMultipleImages(
          files.vehicleImages,
          `gomate/drivers/${driverId}/vehicle`,
        );

      const vehicleImages = vehicleImageResults.map((result) => ({
        url: result.url,
        publicId: result.publicId,
      }));

      // Merge images into vehicle object
      if (updateData.vehicle) {
        updateData.vehicle.images = vehicleImages;
      } else {
        // If vehicle wasn't updated above, update images using dot notation
        updateData['vehicle.images'] = vehicleImages;
      }
    }

    // Update driver with new documents and data
    // Only change verification status to 'pending' if actual verification documents are uploaded
    // Don't change status if only profile photo is updated
    const isVerificationDocumentUploaded =
      files.cnicFront ||
      files.cnicBack ||
      files.selfieWithId ||
      files.licenseFront ||
      files.licenseBack ||
      files.vehicleImages;

    const updatePayload: any = {
      $set: {
        ...updateData,
        documents,
      },
    };

    // Only set verification status to pending if verification documents are uploaded
    // This allows profile photo updates without affecting verification status
    if (isVerificationDocumentUploaded) {
      updatePayload.$set.verificationStatus = 'pending';
    }

    const updatedDriver = await this.driverModel.findByIdAndUpdate(
      driverId,
      updatePayload,
      { new: true, runValidators: false },
    );

    console.log('Updated driver vehicle:', updatedDriver?.vehicle);
    return updatedDriver;
  }

  /**
   * Get drivers by verification status
   */
  async getDriversByVerificationStatus(
    status: 'incomplete' | 'pending' | 'approved' | 'rejected',
  ) {
    return this.driverModel.find({ verificationStatus: status }).exec();
  }

  /**
   * Update driver verification status
   */
  async updateVerificationStatus(
    driverId: string,
    updateVerificationDto: UpdateVerificationStatusDto,
  ) {
    const driver = await this.driverModel.findById(driverId);
    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    const updateData: any = {
      verificationStatus: updateVerificationDto.verificationStatus,
    };

    if (updateVerificationDto.verificationStatus === 'rejected') {
      updateData.rejectionReason =
        updateVerificationDto.rejectionReason || 'No reason provided';
    } else {
      updateData.rejectionReason = null;
    }

    const updatedDriver = await this.driverModel.findByIdAndUpdate(
      driverId,
      updateData,
      { new: true },
    );

    return updatedDriver;
  }

  /**
   * Update driver account status (active/suspended)
   */
  async updateAccountStatus(
    driverId: string,
    accountStatus: 'active' | 'suspended',
  ) {
    const driver = await this.driverModel.findById(driverId);
    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    const updatedDriver = await this.driverModel.findByIdAndUpdate(
      driverId,
      { accountStatus },
      { new: true },
    );

    return updatedDriver;
  }
}
