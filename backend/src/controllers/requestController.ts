import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { RequestService } from '../services/requestService.js';
import { DonorMatchingService } from '../services/donorMatchingService.js';
import { sendResponse } from '../utils/response.js';
import { AppError } from '../utils/appError.js';
import { BloodGroup } from '../models/User.js';

export const createRequest = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401);

    const request = await RequestService.createRequest({
      ...req.body,
      requesterId: req.user._id.toString(),
    });

    sendResponse(res, 201, true, 'Blood request created successfully', request);
  } catch (error) {
    next(error);
  }
};

export const getActiveRequests = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { bloodGroup, status } = req.query;
    const requests = await RequestService.getActiveRequests({
      bloodGroup: bloodGroup as any,
      status: status as any,
    });

    sendResponse(res, 200, true, 'Active blood requests retrieved', requests);
  } catch (error) {
    next(error);
  }
};

export const getMatchingDonors = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { bloodGroup, radius, latitude, longitude } = req.query;
    const radiusKm = radius ? parseFloat(radius as string) : 20;
    const hospitalLocation = {
      latitude: latitude ? parseFloat(latitude as string) : 40.7128,
      longitude: longitude ? parseFloat(longitude as string) : -74.0060,
    };

    const matchingDonors = await DonorMatchingService.findMatchingDonors({
      recipientBloodGroup: (bloodGroup as BloodGroup) || undefined,
      hospitalLocation,
      radiusKm,
      onlyVerified: req.query.onlyVerified === 'true',
    });

    sendResponse(res, 200, true, 'Compatible matching donors retrieved', matchingDonors);
  } catch (error) {
    next(error);
  }
};

export const getMyRequests = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401);

    const requests = await RequestService.getUserRequests(req.user._id.toString());
    sendResponse(res, 200, true, 'Your blood requests retrieved', requests);
  } catch (error) {
    next(error);
  }
};

export const getRequestById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const requestId = req.params.id as string;
    const request = await RequestService.getRequestById(requestId);
    sendResponse(res, 200, true, 'Blood request details retrieved', request);
  } catch (error) {
    next(error);
  }
};

export const updateRequestStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401);
    const requestId = req.params.id as string;
    const { status } = req.body;

    if (!status) {
      throw new AppError('Request status is required', 400);
    }

    const updatedRequest = await RequestService.updateRequestStatus(
      requestId,
      req.user._id.toString(),
      status
    );

    sendResponse(res, 200, true, 'Request status updated', updatedRequest);
  } catch (error) {
    next(error);
  }
};
