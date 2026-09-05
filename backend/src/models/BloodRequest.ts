import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { BloodGroup } from './User.js';

export type UrgencyLevel = 'critical' | 'urgent' | 'normal';
export type RequestStatus =
  | 'pending'
  | 'matching'
  | 'donor_found'
  | 'donor_accepted'
  | 'contact_established'
  | 'on_the_way'
  | 'active'
  | 'fulfilled'
  | 'closed'
  | 'cancelled'
  | 'expired';

export interface IHospitalLocation {
  address: string;
  latitude: number;
  longitude: number;
}

export interface IStatusHistoryEntry {
  status: string;
  timestamp: Date;
  updatedBy: Types.ObjectId;
}

export interface IBloodRequest {
  requesterId: Types.ObjectId;
  patientName: string;
  bloodGroup: BloodGroup;
  unitsRequired: number;
  hospitalName: string;
  hospitalLocation: IHospitalLocation;
  urgency: UrgencyLevel;
  requiredDateTime?: Date;
  contactNumber: string;
  notes?: string;
  status: RequestStatus;
  statusHistory: IStatusHistoryEntry[];
  acceptedDonorId?: Types.ObjectId;
  searchRadiusKm: number;
  createdAt: Date;
}

export interface IBloodRequestDocument extends IBloodRequest, Document {}

const BloodRequestSchema = new Schema<IBloodRequestDocument>(
  {
    requesterId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Requester ID is required'],
    },
    patientName: {
      type: String,
      required: [true, 'Patient name is required'],
      trim: true,
    },
    bloodGroup: {
      type: String,
      required: [true, 'Blood group is required'],
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    },
    unitsRequired: {
      type: Number,
      required: [true, 'Units required is mandatory'],
      min: [1, 'At least 1 unit must be requested'],
    },
    hospitalName: {
      type: String,
      required: [true, 'Hospital name is required'],
      trim: true,
    },
    hospitalLocation: {
      address: { type: String, default: '' },
      latitude: { type: Number, default: 0 },
      longitude: { type: Number, default: 0 },
    },
    urgency: {
      type: String,
      enum: ['critical', 'urgent', 'normal'],
      default: 'normal',
    },
    requiredDateTime: {
      type: Date,
    },
    contactNumber: {
      type: String,
      required: [true, 'Contact phone number is required'],
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: [
        'pending',
        'matching',
        'donor_found',
        'donor_accepted',
        'contact_established',
        'on_the_way',
        'active',
        'fulfilled',
        'closed',
        'cancelled',
        'expired',
      ],
      default: 'pending',
    },
    statusHistory: [
      {
        status: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
      },
    ],
    acceptedDonorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    searchRadiusKm: {
      type: Number,
      default: 10,
    },
  },
  {
    timestamps: true,
  }
);

export const BloodRequest: Model<IBloodRequestDocument> =
  mongoose.model<IBloodRequestDocument>('BloodRequest', BloodRequestSchema);
