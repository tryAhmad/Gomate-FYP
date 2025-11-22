import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Passenger, PassengerDocument } from '../passengers/schemas/passenger.schema';
import { Driver, DriverDocument } from '../drivers/schemas/driver.schema';
import { RideRequest } from '../rides/ride-request/schemas/ride-request.schema';

@Injectable()
export class StatisticsService {
  constructor(
    @InjectModel(Passenger.name)
    private passengerModel: Model<PassengerDocument>,
    @InjectModel(Driver.name)
    private driverModel: Model<DriverDocument>,
    @InjectModel(RideRequest.name)
    private rideRequestModel: Model<RideRequest>,
  ) {}

  async getDashboardStats() {
    // Get current date and last month date
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Total users count
    const totalUsers = await this.passengerModel.countDocuments();
    const lastMonthUsers = await this.passengerModel.countDocuments({
      createdAt: { $lt: currentMonthStart },
    });
    const userGrowth = lastMonthUsers > 0 
      ? ((totalUsers - lastMonthUsers) / lastMonthUsers * 100).toFixed(1)
      : 0;

    // Active drivers count
    const activeDrivers = await this.driverModel.countDocuments({ status: 'active' });
    const lastMonthActiveDrivers = await this.driverModel.countDocuments({
      status: 'active',
      createdAt: { $lt: currentMonthStart },
    });
    const driverGrowth = lastMonthActiveDrivers > 0
      ? ((activeDrivers - lastMonthActiveDrivers) / lastMonthActiveDrivers * 100).toFixed(1)
      : 0;

    // Total rides count
    const totalRides = await this.rideRequestModel.countDocuments({
      status: { $in: ['completed', 'started', 'accepted', 'matched'] },
    });
    const lastMonthRides = await this.rideRequestModel.countDocuments({
      status: { $in: ['completed', 'started', 'accepted', 'matched'] },
      createdAt: { $lt: currentMonthStart },
    });
    const rideGrowth = lastMonthRides > 0
      ? ((totalRides - lastMonthRides) / lastMonthRides * 100).toFixed(1)
      : 0;

    // Total revenue (sum of all completed rides' fares)
    const revenueResult = await this.rideRequestModel.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$fare' } } },
    ]);
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

    const lastMonthRevenueResult = await this.rideRequestModel.aggregate([
      {
        $match: {
          status: 'completed',
          createdAt: { $lt: currentMonthStart },
        },
      },
      { $group: { _id: null, total: { $sum: '$fare' } } },
    ]);
    const lastMonthRevenue = lastMonthRevenueResult.length > 0 ? lastMonthRevenueResult[0].total : 0;
    const revenueGrowth = lastMonthRevenue > 0
      ? ((totalRevenue - lastMonthRevenue) / lastMonthRevenue * 100).toFixed(1)
      : 0;

    return {
      totalUsers,
      userGrowth: `+${userGrowth}%`,
      activeDrivers,
      driverGrowth: `+${driverGrowth}%`,
      totalRides,
      rideGrowth: `+${rideGrowth}%`,
      totalRevenue,
      revenueGrowth: `+${revenueGrowth}%`,
    };
  }

  async getRidesAndRevenueTrend() {
    // Get last 6 months data
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyData = await this.rideRequestModel.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo },
          status: { $in: ['completed', 'started', 'accepted', 'matched'] },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          rides: { $sum: 1 },
          revenue: {
            $sum: {
              $cond: [{ $eq: ['$status', 'completed'] }, '$fare', 0],
            },
          },
        },
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 },
      },
    ]);

    // Format the data
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const formattedData = monthlyData.map((item) => ({
      month: monthNames[item._id.month - 1],
      rides: item.rides,
      revenue: item.revenue,
    }));

    return formattedData;
  }

  async getDriverStatusDistribution() {
    const totalDrivers = await this.driverModel.countDocuments();
    const activeDrivers = await this.driverModel.countDocuments({ status: 'active' });
    const inactiveDrivers = await this.driverModel.countDocuments({ status: 'inactive' });
    
    // Count drivers with no status set or pending verification (if applicable)
    const pendingDrivers = totalDrivers - activeDrivers - inactiveDrivers;

    // Calculate percentages
    const activePercentage = totalDrivers > 0 ? Math.round((activeDrivers / totalDrivers) * 100) : 0;
    const inactivePercentage = totalDrivers > 0 ? Math.round((inactiveDrivers / totalDrivers) * 100) : 0;
    const pendingPercentage = totalDrivers > 0 ? Math.round((pendingDrivers / totalDrivers) * 100) : 0;

    return [
      { name: 'Active', value: activePercentage },
      { name: 'Inactive', value: inactivePercentage },
      { name: 'Pending', value: pendingPercentage },
    ];
  }

  async getDriverRideCounts() {
    // Aggregate completed rides by driver
    const rideCounts = await this.rideRequestModel.aggregate([
      {
        $match: {
          status: 'completed',
          driverID: { $exists: true, $ne: null },
        },
      },
      {
        $group: {
          _id: '$driverID',
          completedRides: { $sum: 1 },
        },
      },
    ]);

    // Convert to a map for easy lookup: driverId -> count
    const countsMap: Record<string, number> = {};
    rideCounts.forEach((item) => {
      countsMap[item._id.toString()] = item.completedRides;
    });

    return countsMap;
  }

  async getAllRidesWithDetails() {
    const rides = await this.rideRequestModel
      .find()
      .populate('passengerID', 'username email phoneNumber')
      .populate('driverID', 'fullname email phoneNumber vehicle status')
      .sort({ createdAt: -1 }) // newest first
      .lean();

    return rides;
  }
}
