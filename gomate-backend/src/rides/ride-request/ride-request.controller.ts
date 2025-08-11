import { Controller, Post, Body, Req, Get, Param, Patch, UseGuards, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { RideRequestService } from './ride-request.service';
import { CreateRideRequestDto } from './dto/create-ride-request.dto';
import { Roles } from 'src/common/decorators/roles.decorators';
import { Role } from 'src/common/enums/roles.enum';
import { UpdateRideRequestDto } from './dto/update-ride-request.dto';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@ApiTags('ride-request')
@Controller('ride-request')
export class RideRequestController {
  constructor(private readonly rideRequestService: RideRequestService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Passenger)
  @ApiOperation({ summary: 'Create a new ride request' })
  async create(@Body() dto: CreateRideRequestDto, @Req() req: any) {
    const passengerId = req.user?.userId;
    console.log('Creating ride request for passenger ID:', passengerId);
    return this.rideRequestService.createRideAndNotifyDrivers(passengerId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('nearby')
  @ApiOperation({ summary: 'Get nearby ride requests' })
  @ApiQuery({ name: 'lng', type: Number, example: 73.0479 })
  @ApiQuery({ name: 'lat', type: Number, example: 33.6844 })
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
  ) {
    const location: [number, number] = [
      parseFloat(lng as any),
      parseFloat(lat as any),
    ];
    const searchRadius = parseInt(radius as any);

    return this.rideRequestService.getNearbyRides(location, searchRadius);
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
}
