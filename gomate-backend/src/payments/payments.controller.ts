import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags, ApiParam } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { UpdatePaymentStatusDto } from './dto/update-payment-status.dto';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all driver payment information' })
  async getAllDriverPayments() {
    const payments = await this.paymentsService.getAllDriverPayments();
    return {
      message: 'Driver payments retrieved successfully',
      data: payments,
    };
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get payment statistics' })
  async getPaymentStatistics() {
    const stats = await this.paymentsService.getPaymentStatistics();
    return {
      message: 'Payment statistics retrieved successfully',
      data: stats,
    };
  }

  @Get(':driverId')
  @ApiOperation({ summary: 'Get payment details for a specific driver' })
  @ApiParam({ name: 'driverId', description: 'Driver ID' })
  async getDriverPayment(@Param('driverId') driverId: string) {
    const payment = await this.paymentsService.getDriverPayment(driverId);
    return {
      message: 'Driver payment retrieved successfully',
      data: payment,
    };
  }

  @Put(':driverId')
  @ApiOperation({ summary: 'Update payment status for a driver' })
  @ApiParam({ name: 'driverId', description: 'Driver ID' })
  async updatePaymentStatus(
    @Param('driverId') driverId: string,
    @Body() dto: UpdatePaymentStatusDto,
  ) {
    return this.paymentsService.updatePaymentStatus(driverId, dto);
  }

  @Post(':driverId/mark-paid')
  @ApiOperation({ summary: 'Mark driver payment as paid' })
  @ApiParam({ name: 'driverId', description: 'Driver ID' })
  async markAsPaid(@Param('driverId') driverId: string) {
    return this.paymentsService.markAsPaid(driverId);
  }

  @Post(':driverId/suspend')
  @ApiOperation({ summary: 'Suspend driver account' })
  @ApiParam({ name: 'driverId', description: 'Driver ID' })
  async suspendAccount(@Param('driverId') driverId: string) {
    return this.paymentsService.suspendAccount(driverId);
  }

  @Post(':driverId/activate')
  @ApiOperation({ summary: 'Activate driver account' })
  @ApiParam({ name: 'driverId', description: 'Driver ID' })
  async activateAccount(@Param('driverId') driverId: string) {
    return this.paymentsService.activateAccount(driverId);
  }

  @Post('update-weekly-status')
  @ApiOperation({ summary: 'Manually trigger weekly payment status update' })
  async updateWeeklyStatus() {
    await this.paymentsService.updateWeeklyPaymentStatus();
    return {
      message: 'Weekly payment status update completed successfully',
    };
  }
}
