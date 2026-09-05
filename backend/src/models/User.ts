import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export interface IUserLocation {
  address: string;
  latitude: number;
  longitude: number;
}

export interface IUser {
  name: string;
  email: string;
  password?: string;
  phone: string;
  bloodGroup: BloodGroup;
  isDonor: boolean;
  isAvailable: boolean;
  isVerified: boolean;
  location: IUserLocation;
  pushToken?: string;
  createdAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export interface IUserDocument extends IUser, Document {
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUserDocument>(
  {
    name: {
      type: String,
      required: [true, 'User name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      validate: {
        validator: function (v: string) {
          const digits = v.replace(/\D/g, '');
          return digits.length >= 7 && digits.length <= 15;
        },
        message: 'Phone number must contain between 7 and 15 digits',
      },
    },
    bloodGroup: {
      type: String,
      required: [true, 'Blood group is required'],
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    },
    isDonor: {
      type: Boolean,
      default: true,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    isVerified: {
      type: Boolean,
      default: true,
    },
    location: {
      address: { type: String, default: 'Central Hospital District' },
      latitude: { type: Number, default: 40.7128 },
      longitude: { type: Number, default: -74.0060 },
    },
    pushToken: {
      type: String,
      trim: true,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving if modified
UserSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password!, salt);
});

// Compare entered password with hashed password
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, this.password!);
};

export const User: Model<IUserDocument> = mongoose.model<IUserDocument>(
  'User',
  UserSchema
);
