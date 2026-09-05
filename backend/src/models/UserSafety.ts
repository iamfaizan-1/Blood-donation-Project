import mongoose, { Schema, Document, Model, Types } from 'mongoose';

// --- User Block Model ---
export interface IUserBlock {
  blockerId: Types.ObjectId;
  blockedId: Types.ObjectId;
  createdAt: Date;
}

export interface IUserBlockDocument extends IUserBlock, Document {}

const UserBlockSchema = new Schema<IUserBlockDocument>(
  {
    blockerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    blockedId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate blocks
UserBlockSchema.index({ blockerId: 1, blockedId: 1 }, { unique: true });

export const UserBlock: Model<IUserBlockDocument> = mongoose.model<IUserBlockDocument>(
  'UserBlock',
  UserBlockSchema
);

// --- User Report Model ---
export type ReportReason =
  | 'harassment'
  | 'inappropriate_behavior'
  | 'no_show'
  | 'fraud_or_scam'
  | 'safety_concern'
  | 'other';

export interface IUserReport {
  reporterId: Types.ObjectId;
  reportedId: Types.ObjectId;
  requestId?: Types.ObjectId;
  reason: ReportReason;
  details?: string;
  status: 'pending' | 'reviewed' | 'action_taken' | 'dismissed';
  createdAt: Date;
}

export interface IUserReportDocument extends IUserReport, Document {}

const UserReportSchema = new Schema<IUserReportDocument>(
  {
    reporterId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    reportedId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    requestId: {
      type: Schema.Types.ObjectId,
      ref: 'BloodRequest',
    },
    reason: {
      type: String,
      required: true,
      enum: [
        'harassment',
        'inappropriate_behavior',
        'no_show',
        'fraud_or_scam',
        'safety_concern',
        'other',
      ],
    },
    details: {
      type: String,
      trim: true,
      maxlength: [1000, 'Report details cannot exceed 1000 characters'],
    },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'action_taken', 'dismissed'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

export const UserReport: Model<IUserReportDocument> = mongoose.model<IUserReportDocument>(
  'UserReport',
  UserReportSchema
);
