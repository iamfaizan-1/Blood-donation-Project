import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { UserService } from '../services/userService.js';
import { sendResponse } from '../utils/response.js';
import { AppError } from '../utils/appError.js';

export const getCurrentUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Unauthorized', 401);
    }
    sendResponse(res, 200, true, 'User profile fetched successfully', req.user);
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401);

    const updatedUser = await UserService.updateProfile(
      req.user._id.toString(),
      req.body
    );

    sendResponse(res, 200, true, 'Profile updated successfully', updatedUser);
  } catch (error) {
    next(error);
  }
};

export const updateAvailability = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401);

    const { isAvailable } = req.body;
    if (typeof isAvailable !== 'boolean') {
      throw new AppError('isAvailable boolean field is required', 400);
    }

    const updatedUser = await UserService.updateAvailability(
      req.user._id.toString(),
      isAvailable
    );

    sendResponse(res, 200, true, 'Donor availability status updated', updatedUser);
  } catch (error) {
    next(error);
  }
};

export const updatePushToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401);

    const { pushToken } = req.body;
    if (!pushToken) {
      throw new AppError('pushToken is required', 400);
    }

    const updatedUser = await UserService.updatePushToken(
      req.user._id.toString(),
      pushToken
    );

    sendResponse(res, 200, true, 'Push token registered successfully', {
      userId: updatedUser._id,
      pushToken: updatedUser.pushToken,
    });
  } catch (error) {
    next(error);
  }
};
