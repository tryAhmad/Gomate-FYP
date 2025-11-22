import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { ApiOperation, ApiTags, ApiParam } from '@nestjs/swagger';
import { ServiceFeesService } from './service-fees.service';
import { CreateServiceFeeDto } from './dto/create-service-fee.dto';
import { UpdateServiceFeeDto } from './dto/update-service-fee.dto';

@ApiTags('Service Fees')
@Controller('service-fees')
export class ServiceFeesController {
  constructor(private readonly serviceFeesService: ServiceFeesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all weekly service fees' })
  async getAllServiceFees() {
    const fees = await this.serviceFeesService.getAllServiceFees();
    return {
      message: 'Service fees retrieved successfully',
      data: fees,
    };
  }

  @Get(':vehicleType')
  @ApiOperation({ summary: 'Get service fee by vehicle type' })
  @ApiParam({ name: 'vehicleType', enum: ['car', 'motorcycle', 'auto'] })
  async getServiceFeeByVehicleType(@Param('vehicleType') vehicleType: 'car' | 'motorcycle' | 'auto') {
    const fee = await this.serviceFeesService.getServiceFeeByVehicleType(vehicleType);
    return {
      message: 'Service fee retrieved successfully',
      data: fee,
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create a new service fee' })
  async createServiceFee(@Body() dto: CreateServiceFeeDto) {
    return this.serviceFeesService.createServiceFee(dto);
  }

  @Put(':vehicleType')
  @ApiOperation({ summary: 'Update service fee by vehicle type' })
  @ApiParam({ name: 'vehicleType', enum: ['car', 'motorcycle', 'auto'] })
  async updateServiceFee(
    @Param('vehicleType') vehicleType: string,
    @Body() dto: UpdateServiceFeeDto,
  ) {
    return this.serviceFeesService.updateServiceFee(vehicleType, dto);
  }

  @Delete(':vehicleType')
  @ApiOperation({ summary: 'Delete service fee by vehicle type' })
  @ApiParam({ name: 'vehicleType', enum: ['car', 'motorcycle', 'auto'] })
  async deleteServiceFee(@Param('vehicleType') vehicleType: string) {
    return this.serviceFeesService.deleteServiceFee(vehicleType);
  }
}
