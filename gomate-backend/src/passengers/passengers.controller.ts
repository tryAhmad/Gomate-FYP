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
import { PassengersService } from './passengers.service';
import { CreatePassengerDto } from './dto/create-passenger.dto';
import { UpdatePassengerDto } from './dto/update-passenger.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorators';
import { Role } from 'src/common/enums/roles.enum';

@ApiTags('Passengers')
@Controller('passengers')
export class PassengersController {
  constructor(private readonly passengersService: PassengersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new passenger' })
  async create(@Body() createPassengerDto: CreatePassengerDto) {
    const passengerExists = await this.passengersService.findOneByEmail(
      createPassengerDto.email,
    );
    if (passengerExists) {
      return {
        message: 'Passenger with this email already exists',
      };
    }
    const passenger =
      await this.passengersService.createPassenger(createPassengerDto);
    return {
      message: 'Passenger created successfully',
      passenger,
    };
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Driver)
  @ApiOperation({ summary: 'Retrieves all users' })
  async findAll() {
    const passengers = await this.passengersService.findAll();
    return {
      message: 'Passengers retrieved successfully',
      passengers,
    };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin, Role.Passenger)
  @ApiOperation({ summary: 'Retrieves a user by ID' })
  async findOne(@Param('id') id: string) {
    const passenger = await this.passengersService.findOne(id);
    return {
      message: 'Passenger retrieved successfully',
      passenger,
    };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Updates a user by ID' })
  async update(
    @Param('id') id: string,
    @Body() updatePassengerDto: UpdatePassengerDto,
  ) {
    const passenger = await this.passengersService.update(
      id,
      updatePassengerDto,
    );
    return {
      message: 'Passenger updated successfully',
      passenger,
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Deletes a user by ID' })
  async remove(@Param('id') id: string) {
    const passenger = await this.passengersService.remove(id);
    return {
      message: 'Passenger removed successfully',
      passenger,
    };
  }
}
