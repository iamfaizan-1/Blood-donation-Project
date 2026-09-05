import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type DonationStatus = 'accepted' | 'on_the_way' | 'completed' | 'cancelled';

export interface IDonation {
  donorId: Types.ObjectId;
  requestId: Types.ObjectId;
  completedAt?: Date;
  status: DonationStatus;
  createdAt: Date;
}

export interface IDonationDocument extends IDonation, Document {}

const DonationSchema = new Schema<IDonationDocument>(
  {
    donorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Donor ID is required'],
    },
    requestId: {
      type: Schema.Types.ObjectId,
      ref: 'BloodRequest',
      required: [true, 'Request ID is required'],
    },
    completedAt: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['accepted', 'on_the_way', 'completed', 'cancelled'],
      default: 'accepted',
    },
  },
  {
    timestamps: true,
  }
);

export const Donation: Model<IDonationDocument> = mongoose.model<IDonationDocument>(
  'Donation',
  DonationSchema
);
