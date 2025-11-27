import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { StatisticsService } from './statistics.service';

@ApiTags('Statistics')
@Controller('statistics')
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  async getDashboardStats() {
    const stats = await this.statisticsService.getDashboardStats();
    return {
      message: 'Dashboard statistics retrieved successfully',
      data: stats,
    };
  }

  @Get('rides-revenue-trend')
  @ApiOperation({ summary: 'Get rides and revenue trend for the last 6 months' })
  async getRidesAndRevenueTrend() {
    const trend = await this.statisticsService.getRidesAndRevenueTrend();
    return {
      message: 'Rides and revenue trend retrieved successfully',
      data: trend,
    };
  }

  @Get('driver-status')
  @ApiOperation({ summary: 'Get driver status distribution' })
  async getDriverStatusDistribution() {
    const distribution = await this.statisticsService.getDriverStatusDistribution();
    return {
      message: 'Driver status distribution retrieved successfully',
      data: distribution,
    };
  }

  @Get('driver-ride-counts')
  @ApiOperation({ summary: 'Get completed ride counts for all drivers' })
  async getDriverRideCounts() {
    const counts = await this.statisticsService.getDriverRideCounts();
    return {
      message: 'Driver ride counts retrieved successfully',
      data: counts,
    };
  }

  @Get('all-rides')
  @ApiOperation({ summary: 'Get all rides with passenger and driver details for admin dashboard' })
  async getAllRides() {
    const rides = await this.statisticsService.getAllRidesWithDetails();
    return {
      message: 'All rides retrieved successfully',
      data: rides,
    };
  }

  @Get('ride/:id')
  @ApiOperation({ summary: 'Get a single ride by ID with full details' })
  async getRideById(@Param('id') id: string) {
    const ride = await this.statisticsService.getRideById(id);
    return {
      message: 'Ride retrieved successfully',
      data: ride,
    };
  }
}
