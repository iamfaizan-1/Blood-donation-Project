import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { DonorWorkflowService } from '../services/donorWorkflowService.js';
import { sendResponse } from '../utils/response.js';
import { AppError } from '../utils/appError.js';

/**
 * POST /api/donor-workflow/notify/:requestId
 * Dispatches notifications to all matched donors for a blood request.
 */
export const notifyDonors = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401);

    const requestId = req.params.requestId as string;
    const result = await DonorWorkflowService.notifyMatchedDonors(requestId);

    sendResponse(
      res,
      200,
      true,
      `${result.notifiedCount} compatible donors notified`,
      result
    );
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/donor-workflow/notifications
 * Returns all pending request notifications for the authenticated donor.
 */
export const getMyNotifications = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401);

    const notifications = await DonorWorkflowService.getDonorNotifications(
      req.user._id.toString()
    );

    sendResponse(
      res,
      200,
      true,
      'Donor notifications retrieved',
      notifications
    );
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/donor-workflow/accept/:notificationId
 * Donor accepts a blood request. Uses atomic update to prevent race conditions.
 */
export const acceptRequest = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401);

    const notificationId = req.params.notificationId as string;
    const result = await DonorWorkflowService.acceptRequest(
      notificationId,
      req.user._id.toString()
    );

    sendResponse(
      res,
      200,
      true,
      'Request accepted! Requester contact information is now available.',
      result
    );
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/donor-workflow/decline/:notificationId
 * Donor declines a blood request. Request remains available for other donors.
 */
export const declineRequest = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401);

    const notificationId = req.params.notificationId as string;
    await DonorWorkflowService.declineRequest(
      notificationId,
      req.user._id.toString()
    );

    sendResponse(res, 200, true, 'Request declined. Other donors will be notified.');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/donor-workflow/request-details/:requestId
 * Gets accepted request details including privacy-gated contact info.
 */
export const getRequestDetails = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401);

    const requestId = req.params.requestId as string;
    const details = await DonorWorkflowService.getAcceptedRequestDetails(
      requestId,
      req.user._id.toString()
    );

    sendResponse(res, 200, true, 'Request details retrieved', details);
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/donor-workflow/advance/:requestId
 * Advances the request through workflow status stages.
 */
export const advanceStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401);

    const requestId = req.params.requestId as string;
    const { status } = req.body;

    if (!status) {
      throw new AppError('New status is required', 400);
    }

    const updated = await DonorWorkflowService.advanceRequestStatus(
      requestId,
      req.user._id.toString(),
      status
    );

    sendResponse(res, 200, true, 'Request status advanced', updated);
  } catch (error) {
    next(error);
  }
};
