import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  Query,
} from '@nestjs/common';
import { DriversService } from './drivers.service';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';
import { ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorators';
import { Role } from 'src/common/enums/roles.enum';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import {
  UploadDriverDocumentsDto,
  UpdateVerificationStatusDto,
} from './dto/upload-documents.dto';

@ApiTags('Drivers')
@Controller('drivers')
export class DriversController {
  constructor(private readonly driversService: DriversService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new driver' })
  async create(@Body() createDriverDto: CreateDriverDto) {
    const driverExists = await this.driversService.findOneByEmail(
      createDriverDto.email,
    );
    if (driverExists) {
      return { message: 'Driver with this email already exists' };
    }
    const driver = await this.driversService.createDriver(createDriverDto);
    return { message: 'Driver created successfully', driver };
  }

  @Get()
  //@UseGuards(JwtAuthGuard, RolesGuard)
  //@Roles(Role.Admin) // admin role can access this endpoint
  @ApiOperation({ summary: 'Get all drivers' })
  async findAll() {
    const drivers = await this.driversService.findAll();
    return { message: 'Drivers retrieved successfully', drivers };
  }

  @Get(':id')
  //@UseGuards(JwtAuthGuard) // Temporarily disabled for admin dashboard
  @ApiOperation({ summary: 'Get a driver by ID' })
  async findOne(@Param('id') id: string) {
    const driver = await this.driversService.findOne(id);
    return { message: 'Driver retrieved successfully', driver };
  }

  @Patch(':id')
  //@UseGuards(JwtAuthGuard) // Temporarily disabled for admin dashboard
  @ApiOperation({ summary: 'Update a driver by ID' })
  async update(
    @Param('id') id: string,
    @Body() updateDriverDto: UpdateDriverDto,
  ) {
    const driver = await this.driversService.update(id, updateDriverDto);
    return { message: 'Driver updated successfully', driver };
  }

  @Delete(':id')
  //@UseGuards(JwtAuthGuard) // Temporarily disabled for admin dashboard
  @ApiOperation({ summary: 'Delete a driver by ID' })
  async remove(@Param('id') id: string) {
    const driver = await this.driversService.remove(id);
    return { message: 'Driver removed successfully', driver };
  }

  @Post(':id/documents')
  @ApiOperation({ summary: 'Upload driver documents' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'cnicFront', maxCount: 1 },
      { name: 'cnicBack', maxCount: 1 },
      { name: 'selfieWithId', maxCount: 1 },
      { name: 'licenseFront', maxCount: 1 },
      { name: 'licenseBack', maxCount: 1 },
      { name: 'profilePhoto', maxCount: 1 },
      { name: 'vehicleImages', maxCount: 6 },
    ]),
  )
  async uploadDocuments(
    @Param('id') id: string,
    @UploadedFiles()
    files: {
      cnicFront?: Express.Multer.File[];
      cnicBack?: Express.Multer.File[];
      selfieWithId?: Express.Multer.File[];
      licenseFront?: Express.Multer.File[];
      licenseBack?: Express.Multer.File[];
      profilePhoto?: Express.Multer.File[];
      vehicleImages?: Express.Multer.File[];
    },
    @Body() body: any,
  ) {
    console.log('=== CONTROLLER RECEIVED ===');
    console.log('Raw body keys:', Object.keys(body));
    console.log('Full body:', body);
    console.log('vehicleModel:', body.vehicleModel);
    console.log('vehicleColor:', body.vehicleColor);
    console.log('vehicleCompany:', body.vehicleCompany);

    const driver = await this.driversService.uploadDriverDocuments(
      id,
      files,
      body,
    );
    return { message: 'Documents uploaded successfully', driver };
  }

  @Get('verification/pending')
  //@UseGuards(JwtAuthGuard, RolesGuard)
  //@Roles(Role.Admin)
  @ApiOperation({ summary: 'Get drivers with pending verification' })
  async getPendingDrivers() {
    const drivers =
      await this.driversService.getDriversByVerificationStatus('pending');
    return { message: 'Pending drivers retrieved successfully', drivers };
  }

  @Get('verification/status')
  //@UseGuards(JwtAuthGuard, RolesGuard)
  //@Roles(Role.Admin)
  @ApiOperation({ summary: 'Get drivers by verification status' })
  async getDriversByStatus(
    @Query('status') status: 'pending' | 'approved' | 'rejected',
  ) {
    const drivers =
      await this.driversService.getDriversByVerificationStatus(status);
    return {
      message: `Drivers with status ${status} retrieved successfully`,
      drivers,
    };
  }

  @Patch(':id/verification')
  //@UseGuards(JwtAuthGuard, RolesGuard)
  //@Roles(Role.Admin)
  @ApiOperation({ summary: 'Update driver verification status' })
  async updateVerificationStatus(
    @Param('id') id: string,
    @Body() updateVerificationDto: UpdateVerificationStatusDto,
  ) {
    const driver = await this.driversService.updateVerificationStatus(
      id,
      updateVerificationDto,
    );
    return { message: 'Verification status updated successfully', driver };
  }

  @Patch(':id/suspend')
  //@UseGuards(JwtAuthGuard, RolesGuard)
  //@Roles(Role.Admin)
  @ApiOperation({ summary: 'Suspend driver account' })
  async suspendAccount(@Param('id') id: string) {
    const driver = await this.driversService.updateAccountStatus(
      id,
      'suspended',
    );
    return { message: 'Driver account suspended successfully', driver };
  }

  @Patch(':id/activate')
  //@UseGuards(JwtAuthGuard, RolesGuard)
  //@Roles(Role.Admin)
  @ApiOperation({ summary: 'Activate driver account' })
  async activateAccount(@Param('id') id: string) {
    const driver = await this.driversService.updateAccountStatus(id, 'active');
    return { message: 'Driver account activated successfully', driver };
  }
}
