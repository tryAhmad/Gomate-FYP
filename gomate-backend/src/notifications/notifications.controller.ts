import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorators';
import { Role } from '../common/enums/roles.enum';

@ApiTags('notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('send-payment-reminder/:driverId')
  @ApiOperation({
    summary: 'Send payment reminder notification to driver (Admin)',
  })
  async sendPaymentReminder(
    @Param('driverId') driverId: string,
    @Body() body: { amount?: number; dueDate?: string },
  ) {
    const notification = await this.notificationsService.create(
      driverId,
      'Payment',
      'Payment Reminder',
      `Your payment is overdue. Please settle your account balance at the earliest.${body.amount ? ` Amount: Rs ${body.amount}` : ''}${body.dueDate ? ` Due Date: ${body.dueDate}` : ''}`,
      { amount: body.amount, dueDate: body.dueDate },
    );

    return {
      success: true,
      message: 'Payment reminder sent successfully',
      notification,
    };
  }

  @Get('driver/:driverId')
  @ApiOperation({ summary: 'Get all notifications for a driver' })
  async getDriverNotifications(@Param('driverId') driverId: string) {
    const notifications =
      await this.notificationsService.getDriverNotifications(driverId);
    return {
      notifications,
      unreadCount: notifications.filter((n) => !n.read).length,
    };
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  async markAsRead(@Param('id') id: string) {
    const notification = await this.notificationsService.markAsRead(id);
    return {
      success: true,
      notification,
    };
  }

  @Patch('driver/:driverId/read-all')
  @ApiOperation({ summary: 'Mark all notifications as read for a driver' })
  async markAllAsRead(@Param('driverId') driverId: string) {
    await this.notificationsService.markAllAsRead(driverId);
    return {
      success: true,
      message: 'All notifications marked as read',
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a notification' })
  async deleteNotification(@Param('id') id: string) {
    await this.notificationsService.deleteNotification(id);
    return {
      success: true,
      message: 'Notification deleted',
    };
  }
}
