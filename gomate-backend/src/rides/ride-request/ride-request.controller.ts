import {
  Controller,
  Post,
  Body,
  Req,
  Get,
  Param,
  Patch,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { RideRequestService } from './ride-request.service';
import { SharedRideRequestService } from './shared-ride-request.service';
import { CreateRideRequestDto } from './dto/create-ride-request.dto';
import { Roles } from 'src/common/decorators/roles.decorators';
import { Role } from 'src/common/enums/roles.enum';
import { UpdateRideRequestDto } from './dto/update-ride-request.dto';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RideMode } from 'src/common/enums/ride-mode.enum';
import { CalculateFareDto } from './dto/calculate-fare.dto';

@ApiTags('ride-request')
@Controller('ride-request')
export class RideRequestController {
  constructor(
    private readonly rideRequestService: RideRequestService,
    private readonly sharedRideRequestService: SharedRideRequestService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Passenger)
  @ApiOperation({ summary: 'Create a new ride request' })
  async create(@Body() dto: CreateRideRequestDto, @Req() req: any) {
    const passengerId = req.user?.userId;
    console.log(
      `Creating ${dto.rideMode} ride request for passenger ID:`,
      passengerId,
    );

    if (dto.rideMode === RideMode.Shared) {
      return this.sharedRideRequestService.createSharedAndMatch(
        passengerId,
        dto,
      );
    }

    return this.rideRequestService.createRideAndNotifyDrivers(passengerId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('nearby')
  @ApiOperation({ summary: 'Get nearby ride requests' })
  @ApiQuery({ name: 'lng', type: Number })
  @ApiQuery({ name: 'lat', type: Number })
  @ApiQuery({ name: 'rideMode', enum: RideMode, required: false })
  @ApiQuery({
    name: 'radius',
    type: Number,
    example: 2000,
    description: 'Radius in meters',
  })
  async getNearbyRides(
    @Query('lng') lng: number,
    @Query('lat') lat: number,
    @Query('radius') radius: number,
    @Query('rideMode') rideMode?: RideMode,
  ) {
    const location: [number, number] = [
      parseFloat(lng as any),
      parseFloat(lat as any),
    ];
    const searchRadius = parseInt(radius as any);

    return this.rideRequestService.getNearbyRides(
      location,
      searchRadius,
      rideMode,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Passenger)
  @Get('history')
  @ApiOperation({ summary: 'Get all ride history for logged-in passenger' })
  async getPassengerRideHistory(@Req() req: any) {
    const passengerId = req.user?.userId;
    return this.rideRequestService.getPassengerRideHistory(passengerId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Driver)
  @Get('driver/history')
  @ApiOperation({ summary: 'Get all ride history for logged-in driver' })
  async getDriverRideHistory(@Req() req: any) {
    const driverId = req.user?.userId;
    return this.rideRequestService.getDriverRideHistory(driverId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get ride request by ID' })
  async getById(@Param('id') id: string) {
    return this.rideRequestService.getById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update ride request by ID' })
  async update(@Param('id') id: string, @Body() dto: UpdateRideRequestDto) {
    return this.rideRequestService.updateRideRequest(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete ride request by ID' })
  async delete(@Param('id') id: string) {
    return this.rideRequestService.deleteRideRequest(id);
  }

  @Post('fare')
  @ApiOperation({
    summary:
      'Calculate fare from distance and duration (frontend provides distance & time)',
  })
  async calculateFare(@Body() dto: CalculateFareDto) {
    // dto.distance = meters, dto.duration = seconds
    return this.rideRequestService.calculateFareFromDistanceTime(
      dto.distance,
      dto.duration,
      dto.rideType,
      dto.rideMode,
    );
  }

  @Post('rate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Passenger)
  @ApiOperation({ summary: 'Rate a completed ride' })
  async rateRide(
    @Body() body: { rideId: string; rating: number },
    @Req() req: any,
  ) {
    const passengerId = req.user?.userId;
    return this.rideRequestService.rateRide(
      body.rideId,
      passengerId,
      body.rating,
    );
  }

  @Get('driver/:driverId/average-rating')
  @ApiOperation({ summary: 'Get average rating for a driver' })
  async getDriverAverageRating(@Param('driverId') driverId: string) {
    return this.rideRequestService.getDriverAverageRating(driverId);
  }
}
