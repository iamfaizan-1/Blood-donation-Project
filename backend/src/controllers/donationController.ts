import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { DonationService } from '../services/donationService.js';
import { sendResponse } from '../utils/response.js';
import { AppError } from '../utils/appError.js';

export const createDonation = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401);
    const { requestId } = req.body;

    if (!requestId) {
      throw new AppError('requestId is required', 400);
    }

    const donation = await DonationService.createDonation({
      donorId: req.user._id.toString(),
      requestId,
    });

    sendResponse(res, 201, true, 'Donation accepted successfully', donation);
  } catch (error) {
    next(error);
  }
};

export const completeDonation = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401);
    const donationId = req.params.id as string;

    const completed = await DonationService.completeDonation(
      donationId,
      req.user._id.toString()
    );

    sendResponse(res, 200, true, 'Donation marked as completed! Thank you for saving a life.', completed);
  } catch (error) {
    next(error);
  }
};

export const getDonationHistory = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401);

    const history = await DonationService.getDonationHistory(
      req.user._id.toString()
    );

    sendResponse(res, 200, true, 'Donation history retrieved', history);
  } catch (error) {
    next(error);
  }
};
