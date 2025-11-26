import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { DriversService } from './drivers.service';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorators';
import { Role } from 'src/common/enums/roles.enum';

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
  @UseGuards(JwtAuthGuard)
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
}
