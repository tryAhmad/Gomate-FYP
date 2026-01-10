import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification } from './schemas/notification.schema';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<Notification>,
  ) {}

  async create(
    driverID: string,
    type: string,
    title: string,
    message: string,
    metadata?: Record<string, any>,
  ) {
    const notification = new this.notificationModel({
      driverID: new Types.ObjectId(driverID),
      type,
      title,
      message,
      metadata,
      read: false,
    });

    return notification.save();
  }

  async getDriverNotifications(driverID: string) {
    return this.notificationModel
      .find({ driverID: new Types.ObjectId(driverID) })
      .sort({ createdAt: -1 })
      .lean();
  }

  async markAsRead(notificationId: string) {
    return this.notificationModel.findByIdAndUpdate(
      notificationId,
      { read: true },
      { new: true },
    );
  }

  async markAllAsRead(driverID: string) {
    return this.notificationModel.updateMany(
      { driverID: new Types.ObjectId(driverID), read: false },
      { read: true },
    );
  }

  async deleteNotification(notificationId: string) {
    return this.notificationModel.findByIdAndDelete(notificationId);
  }
}
