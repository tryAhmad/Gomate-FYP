import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Driver, DriverDocument } from '../drivers/schemas/driver.schema';
import { RideRequest } from '../rides/ride-request/schemas/ride-request.schema';
import { ServiceFeesService } from '../service-fees/service-fees.service';
import { UpdatePaymentStatusDto } from './dto/update-payment-status.dto';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectModel(Driver.name)
    private driverModel: Model<DriverDocument>,
    @InjectModel(RideRequest.name)
    private rideRequestModel: Model<RideRequest>,
    private serviceFeesService: ServiceFeesService,
  ) {}

  // Get the start of the current week (Monday)
  private getWeekStart(date: Date = new Date()): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(d.setDate(diff));
  }

  // Calculate days since week start
  private getDaysSinceWeekStart(): number {
    const now = new Date();
    const weekStart = this.getWeekStart();
    const diffTime = Math.abs(now.getTime() - weekStart.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  // Automated weekly payment status update (runs every day at midnight)
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async updateWeeklyPaymentStatus() {
    console.log('Running weekly payment status update...');

    const drivers = await this.driverModel.find({ accountStatus: 'active' });
    const weekStart = this.getWeekStart();
    const daysSinceWeekStart = this.getDaysSinceWeekStart();

    for (const driver of drivers) {
      // Check if it's a new week
      const driverWeekStart = driver.weekStartDate
        ? new Date(driver.weekStartDate)
        : weekStart;

      if (weekStart > driverWeekStart) {
        // New week started
        if (driver.paymentStatus === 'paid') {
          // Reset to pending for new week
          await this.driverModel.findByIdAndUpdate(driver._id, {
            paymentStatus: 'pending',
            weekStartDate: weekStart,
          });
          console.log(
            `Reset payment status to pending for driver: ${driver.email}`,
          );
        } else {
          // Was not paid last week, keep as overdue
          await this.driverModel.findByIdAndUpdate(driver._id, {
            paymentStatus: 'overdue',
            weekStartDate: weekStart,
          });
          console.log(`Marked as overdue for driver: ${driver.email}`);
        }
      } else {
        // Same week - check if should mark as overdue
        if (driver.paymentStatus === 'pending' && daysSinceWeekStart >= 3) {
          await this.driverModel.findByIdAndUpdate(driver._id, {
            paymentStatus: 'overdue',
          });
          console.log(
            `Marked as overdue (3+ days) for driver: ${driver.email}`,
          );
        }
      }
    }

    console.log('Weekly payment status update completed');
  }

  // Get all drivers with payment information
  async getAllDriverPayments() {
    const drivers = await this.driverModel.find().select('-password').lean();

    // Get service fees
    const feesMap = await this.serviceFeesService.getFeesMap();

    // Calculate total earnings for each driver
    const driversWithPayments = await Promise.all(
      drivers.map(async (driver) => {
        // Calculate total earnings from completed rides
        const totalEarningsResult = await this.rideRequestModel.aggregate([
          {
            $match: {
              driverID: driver._id,
              status: 'completed',
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$fare' },
            },
          },
        ]);

        const totalEarnings =
          totalEarningsResult.length > 0 ? totalEarningsResult[0].total : 0;

        // Get weekly fee based on vehicle type
        const vehicleType = driver.vehicle?.vehicleType || 'car';
        const weeklyFee = feesMap[vehicleType] || 0;

        return {
          _id: driver._id,
          fullname: driver.fullname,
          email: driver.email,
          phoneNumber: driver.phoneNumber,
          vehicleType: driver.vehicle?.vehicleType,
          status: driver.status,
          accountStatus: driver.accountStatus || 'active',
          paymentStatus: driver.paymentStatus || 'pending',
          lastPaymentDate: driver.lastPaymentDate,
          weeklyFee,
          totalEarnings,
        };
      }),
    );

    return driversWithPayments;
  }

  // Get payment details for a specific driver
  async getDriverPayment(driverId: string) {
    const driver = await this.driverModel
      .findById(driverId)
      .select('-password')
      .lean();

    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    // Get service fees
    const feesMap = await this.serviceFeesService.getFeesMap();
    const vehicleType = driver.vehicle?.vehicleType || 'car';
    const weeklyFee = feesMap[vehicleType] || 0;

    // Calculate total earnings
    const totalEarningsResult = await this.rideRequestModel.aggregate([
      {
        $match: {
          driverID: driver._id,
          status: 'completed',
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$fare' },
        },
      },
    ]);

    const totalEarnings =
      totalEarningsResult.length > 0 ? totalEarningsResult[0].total : 0;

    return {
      _id: driver._id,
      fullname: driver.fullname,
      email: driver.email,
      phoneNumber: driver.phoneNumber,
      vehicleType: driver.vehicle?.vehicleType,
      status: driver.status,
      accountStatus: driver.accountStatus || 'active',
      paymentStatus: driver.paymentStatus || 'pending',
      lastPaymentDate: driver.lastPaymentDate,
      weeklyFee,
      totalEarnings,
    };
  }

  // Update payment status for a driver
  async updatePaymentStatus(driverId: string, dto: UpdatePaymentStatusDto) {
    const updateData: any = {};

    if (dto.paymentStatus) {
      updateData.paymentStatus = dto.paymentStatus;

      // If marking as paid, update last payment date
      if (dto.paymentStatus === 'paid') {
        updateData.lastPaymentDate = new Date();
      }
    }

    if (dto.accountStatus) {
      updateData.accountStatus = dto.accountStatus;
    }

    if (dto.lastPaymentDate) {
      updateData.lastPaymentDate = new Date(dto.lastPaymentDate);
    }

    const updated = await this.driverModel
      .findByIdAndUpdate(
        driverId,
        { $set: updateData },
        { new: true, runValidators: true },
      )
      .select('-password');

    if (!updated) {
      throw new NotFoundException('Driver not found');
    }

    return {
      message: 'Payment status updated successfully',
      driver: updated,
    };
  }

  // Mark driver payment as paid
  async markAsPaid(driverId: string) {
    return this.updatePaymentStatus(driverId, {
      paymentStatus: 'paid',
      lastPaymentDate: new Date().toISOString(),
    });
  }

  // Suspend driver account
  async suspendAccount(driverId: string) {
    return this.updatePaymentStatus(driverId, {
      accountStatus: 'suspended',
    });
  }

  // Activate driver account
  async activateAccount(driverId: string) {
    return this.updatePaymentStatus(driverId, {
      accountStatus: 'active',
    });
  }

  // Get payment statistics
  async getPaymentStatistics() {
    const drivers = await this.getAllDriverPayments();

    const stats = {
      totalDrivers: drivers.length,
      paidThisWeek: drivers.filter((d) => d.paymentStatus === 'paid').length,
      pendingPayments: drivers.filter((d) => d.paymentStatus === 'pending')
        .length,
      overduePayments: drivers.filter((d) => d.paymentStatus === 'overdue')
        .length,
      suspendedAccounts: drivers.filter((d) => d.accountStatus === 'suspended')
        .length,
      totalRevenue: drivers.reduce((sum, d) => sum + d.totalEarnings, 0),
      expectedWeeklyFees: drivers.reduce((sum, d) => sum + d.weeklyFee, 0),
    };

    return stats;
  }
}
