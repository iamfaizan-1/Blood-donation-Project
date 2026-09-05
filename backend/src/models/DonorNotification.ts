import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type NotificationStatus = 'pending' | 'accepted' | 'declined' | 'expired';

export interface IDonorNotification {
  requestId: Types.ObjectId;
  donorId: Types.ObjectId;
  status: NotificationStatus;
  distanceKm: number;
  respondedAt?: Date;
  createdAt: Date;
}

export interface IDonorNotificationDocument extends IDonorNotification, Document {}

const DonorNotificationSchema = new Schema<IDonorNotificationDocument>(
  {
    requestId: {
      type: Schema.Types.ObjectId,
      ref: 'BloodRequest',
      required: [true, 'Request ID is required'],
      index: true,
    },
    donorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Donor ID is required'],
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'expired'],
      default: 'pending',
    },
    distanceKm: {
      type: Number,
      default: 0,
    },
    respondedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index: each donor only gets one notification per request
DonorNotificationSchema.index({ requestId: 1, donorId: 1 }, { unique: true });

export const DonorNotification: Model<IDonorNotificationDocument> =
  mongoose.model<IDonorNotificationDocument>('DonorNotification', DonorNotificationSchema);
