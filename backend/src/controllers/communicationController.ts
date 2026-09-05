import mongoose from 'mongoose';
import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { BloodRequest } from '../models/BloodRequest.js';
import { ChatMessage } from '../models/ChatMessage.js';
import { UserBlock, UserReport, ReportReason } from '../models/UserSafety.js';
import { sendResponse } from '../utils/response.js';
import { AppError } from '../utils/appError.js';

/**
 * GET /api/communication/messages/:requestId
 * Fetch chat message history for an active blood request.
 * Strictly verifies user is requester or accepted donor.
 */
export const getChatHistory = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401);

    const requestId = req.params.requestId as string;
    const currentUserId = req.user._id.toString();

    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      throw new AppError('Invalid request ID format', 400);
    }

    const request = await BloodRequest.findById(requestId)
      .populate('requesterId', 'name bloodGroup phone')
      .populate('acceptedDonorId', 'name bloodGroup phone');

    if (!request) {
      throw new AppError('Blood request not found', 404);
    }

    // Must be in accepted/active lifecycle stage
    const allowedStatuses = ['donor_accepted', 'contact_established', 'on_the_way', 'fulfilled', 'closed'];
    if (!allowedStatuses.includes(request.status)) {
      throw new AppError(
        'Communication is only available once a donor has accepted this blood request',
        403
      );
    }

    const requesterId = (request.requesterId as any)?._id?.toString();
    const donorId = (request.acceptedDonorId as any)?._id?.toString();

    const isRequester = currentUserId === requesterId;
    const isDonor = currentUserId === donorId;

    if (!isRequester && !isDonor) {
      throw new AppError('You are not authorized to view messages for this request', 403);
    }

    const partnerId = isRequester ? donorId : requesterId;

    // Check if blocked
    let isBlocked = false;
    if (partnerId) {
      const blockRecord = await UserBlock.findOne({
        $or: [
          { blockerId: currentUserId, blockedId: partnerId },
          { blockerId: partnerId, blockedId: currentUserId },
        ],
      });
      isBlocked = !!blockRecord;
    }

    const messages = await ChatMessage.find({ requestId: request._id })
      .sort({ createdAt: 1 })
      .populate('senderId', 'name');

    const formattedMessages = messages.map((m: any) => ({
      _id: m._id.toString(),
      requestId: m.requestId.toString(),
      senderId: m.senderId?._id?.toString() || m.senderId.toString(),
      senderName: m.senderId?.name || 'User',
      message: m.message,
      messageType: m.messageType,
      locationData: m.locationData,
      createdAt: m.createdAt.toISOString(),
      isMe: (m.senderId?._id?.toString() || m.senderId.toString()) === currentUserId,
    }));

    const partnerUser = isRequester ? request.acceptedDonorId as any : request.requesterId as any;

    sendResponse(res, 200, true, 'Chat history retrieved', {
      messages: formattedMessages,
      partner: {
        id: partnerUser?._id,
        name: partnerUser?.name || 'User',
        bloodGroup: partnerUser?.bloodGroup,
        phone: partnerUser?.phone,
      },
      isBlocked,
      requestStatus: request.status,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/communication/report
 * File a user safety report
 */
export const reportUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401);

    const { reportedId, requestId, reason, details } = req.body;

    if (!reportedId || !reason) {
      throw new AppError('reportedId and reason are required', 400);
    }

    const validReasons: ReportReason[] = [
      'harassment',
      'inappropriate_behavior',
      'no_show',
      'fraud_or_scam',
      'safety_concern',
      'other',
    ];

    if (!validReasons.includes(reason)) {
      throw new AppError('Invalid report reason', 400);
    }

    const report = await UserReport.create({
      reporterId: req.user._id,
      reportedId,
      requestId,
      reason,
      details,
    });

    sendResponse(
      res,
      201,
      true,
      'Report submitted successfully. Our safety team will review it.',
      report
    );
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/communication/block
 * Block an abusive user to sever all communication
 */
export const blockUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401);

    const { targetUserId } = req.body;
    if (!targetUserId) {
      throw new AppError('targetUserId is required', 400);
    }

    if (targetUserId === req.user._id.toString()) {
      throw new AppError('You cannot block yourself', 400);
    }

    // Upsert block record
    await UserBlock.findOneAndUpdate(
      { blockerId: req.user._id, blockedId: targetUserId },
      { blockerId: req.user._id, blockedId: targetUserId },
      { upsert: true, new: true }
    );

    sendResponse(res, 200, true, 'User blocked successfully. Communication has been severed.');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/communication/contact/:requestId
 * Get partner contact phone number securely (only unlocked if accepted)
 */
export const getSecureContact = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401);

    const requestId = req.params.requestId as string;
    const currentUserId = req.user._id.toString();

    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      throw new AppError('Invalid request ID format', 400);
    }

    const request = await BloodRequest.findById(requestId)
      .populate('requesterId', 'name phone email')
      .populate('acceptedDonorId', 'name phone bloodGroup');

    if (!request) {
      throw new AppError('Blood request not found', 404);
    }

    if (
      request.status !== 'donor_accepted' &&
      request.status !== 'contact_established' &&
      request.status !== 'on_the_way' &&
      request.status !== 'fulfilled' &&
      request.status !== 'closed'
    ) {
      throw new AppError('Contact details are only available after donor acceptance', 403);
    }

    const requester = request.requesterId as any;
    const donor = request.acceptedDonorId as any;

    const isRequester = currentUserId === requester?._id?.toString();
    const isDonor = currentUserId === donor?._id?.toString();

    if (!isRequester && !isDonor) {
      throw new AppError('Unauthorized access to contact details', 403);
    }

    const contact = isRequester
      ? {
          name: donor?.name,
          phone: donor?.phone,
          bloodGroup: donor?.bloodGroup,
          role: 'donor',
        }
      : {
          name: requester?.name,
          phone: requester?.phone || request.contactNumber,
          role: 'requester',
        };

    sendResponse(res, 200, true, 'Secure contact info retrieved', contact);
  } catch (error) {
    next(error);
  }
};
