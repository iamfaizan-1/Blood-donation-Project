import { User, IUserLocation, BloodGroup } from '../models/User.js';
import { AppError } from '../utils/appError.js';

export interface UpdateProfileDTO {
  name?: string;
  phone?: string;
  bloodGroup?: BloodGroup;
  location?: IUserLocation;
}

export class UserService {
  /** Get user profile by ID */
  public static async getUserById(userId: string) {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    return user;
  }

  /** Update user profile */
  public static async updateProfile(userId: string, data: UpdateProfileDTO) {
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: data },
      { new: true, runValidators: true }
    );

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user;
  }

  /** Toggle donor availability */
  public static async updateAvailability(userId: string, isAvailable: boolean) {
    const updateFields: any = { isAvailable };
    if (isAvailable) {
      updateFields.isDonor = true;
      updateFields.isVerified = true;
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateFields },
      { new: true }
    );

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user;
  }

  /** Update user's device push notification token */
  public static async updatePushToken(userId: string, pushToken: string) {
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { pushToken } },
      { new: true }
    );

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user;
  }
}
