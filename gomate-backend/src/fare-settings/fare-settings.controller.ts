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
import { FareSettingsService } from './fare-settings.service';
import { CreateFareSettingDto } from './dto/create-fare-setting.dto';
import { UpdateFareSettingDto } from './dto/update-fare-setting.dto';

@ApiTags('Fare Settings')
@Controller('fare-settings')
export class FareSettingsController {
  constructor(private readonly fareSettingsService: FareSettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all fare settings' })
  async getAllFareSettings() {
    const settings = await this.fareSettingsService.getAllFareSettings();
    return {
      message: 'Fare settings retrieved successfully',
      data: settings,
    };
  }

  @Get(':rideType')
  @ApiOperation({ summary: 'Get fare setting by ride type' })
  @ApiParam({ name: 'rideType', enum: ['auto', 'car', 'bike'] })
  async getFareByRideType(@Param('rideType') rideType: 'auto' | 'car' | 'bike') {
    const setting = await this.fareSettingsService.getFareByRideType(rideType);
    return {
      message: 'Fare setting retrieved successfully',
      data: setting,
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create a new fare setting' })
  async createFareSetting(@Body() dto: CreateFareSettingDto) {
    return this.fareSettingsService.createFareSetting(dto);
  }

  @Put(':rideType')
  @ApiOperation({ summary: 'Update fare setting by ride type' })
  @ApiParam({ name: 'rideType', enum: ['auto', 'car', 'bike'] })
  async updateFareSetting(
    @Param('rideType') rideType: string,
    @Body() dto: UpdateFareSettingDto,
  ) {
    return this.fareSettingsService.updateFareSetting(rideType, dto);
  }

  @Delete(':rideType')
  @ApiOperation({ summary: 'Delete fare setting by ride type' })
  @ApiParam({ name: 'rideType', enum: ['auto', 'car', 'bike'] })
  async deleteFareSetting(@Param('rideType') rideType: string) {
    return this.fareSettingsService.deleteFareSetting(rideType);
  }
}
