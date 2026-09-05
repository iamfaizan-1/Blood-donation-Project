import mongoose from 'mongoose';
import { BloodRequest, IBloodRequestDocument } from '../models/BloodRequest.js';
import { DonorNotification } from '../models/DonorNotification.js';
import { Donation } from '../models/Donation.js';
import { User, IUserDocument } from '../models/User.js';
import { DonorMatchingService } from './donorMatchingService.js';
import { PushNotificationService } from './pushNotificationService.js';
import { AppError } from '../utils/appError.js';

export interface NotifyDonorsResult {
  requestId: string;
  notifiedCount: number;
  matchedDonors: Array<{
    donorId: string;
    firstName: string;
    bloodGroup: string;
    distanceKm: number;
  }>;
}

export interface AcceptResult {
  donation: any;
  request: any;
  requesterContact: {
    name: string;
    phone: string;
  };
}

export interface DonorRequestView {
  notificationId: string;
  requestId: string;
  bloodGroup: string;
  unitsRequired: number;
  hospitalName: string;
  hospitalAddress: string;
  distanceKm: number;
  distanceFormatted: string;
  urgency: string;
  requiredDateTime: string | null;
  patientName: string;
  notes: string;
  status: string;
  requestStatus: string;
  createdAt: string;
}

export class DonorWorkflowService {
  /**
   * Step 1: After a blood request is created, find compatible donors
   * and create notification records for each matched donor.
   */
  public static async notifyMatchedDonors(requestId: string): Promise<NotifyDonorsResult> {
    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      throw new AppError('Invalid request ID format', 400);
    }

    const request = await BloodRequest.findById(requestId);
    if (!request) {
      throw new AppError('Blood request not found', 404);
    }

    // Find compatible, available, verified donors within radius
    const matchedDonors = await DonorMatchingService.findMatchingDonors({
      recipientBloodGroup: request.bloodGroup,
      hospitalLocation: {
        latitude: request.hospitalLocation?.latitude || 0,
        longitude: request.hospitalLocation?.longitude || 0,
      },
      radiusKm: request.searchRadiusKm || 10,
      onlyVerified: true,
    });

    // Create notification records for each matched donor
    const notifications = [];
    for (const donor of matchedDonors) {
      try {
        const notification = await DonorNotification.create({
          requestId: request._id,
          donorId: donor.id,
          status: 'pending',
          distanceKm: donor.distanceKm,
        });
        notifications.push({
          donorId: donor.id,
          firstName: donor.firstName,
          bloodGroup: donor.bloodGroup,
          distanceKm: donor.distanceKm,
        });
      } catch (error: any) {
        // Skip duplicate notifications (compound unique index)
        if (error.code !== 11000) {
          console.error(`Failed to notify donor ${donor.id}:`, error.message);
        }
      }
    }

    // Update request status to matching/donor_found
    request.status = notifications.length > 0 ? 'donor_found' : 'matching';
    request.statusHistory.push({
      status: request.status,
      timestamp: new Date(),
      updatedBy: request.requesterId,
    });
    await request.save();

    // Send push notification #1: Emergency blood request to matched donors
    if (notifications.length > 0) {
      try {
        const donorIds = notifications.map((n) => n.donorId);
        const donorUsers = await User.find({
          _id: { $in: donorIds },
          pushToken: { $exists: true, $ne: null },
        }).select('pushToken');

        const pushTokens = donorUsers
          .map((u) => u.pushToken)
          .filter(Boolean) as string[];

        if (pushTokens.length > 0) {
          await PushNotificationService.notifyEmergencyRequest(pushTokens, {
            requestId: request._id.toString(),
            bloodGroup: request.bloodGroup,
            unitsRequired: request.unitsRequired,
            hospitalName: request.hospitalName,
            urgency: request.urgency,
            distanceKm: notifications[0]?.distanceKm,
            requiredDateTime: request.requiredDateTime
              ? request.requiredDateTime.toISOString()
              : null,
            patientName: request.patientName,
            notes: request.notes,
          });
        }
      } catch (pushErr: any) {
        console.warn('Failed to send emergency request push:', pushErr.message);
      }
    }

    return {
      requestId: request._id.toString(),
      notifiedCount: notifications.length,
      matchedDonors: notifications,
    };
  }

  /**
   * Get all pending request notifications for a specific donor.
   * Privacy: Does NOT expose requester phone number or exact address until accepted.
   */
  public static async getDonorNotifications(donorId: string): Promise<DonorRequestView[]> {
    const notifications = await DonorNotification.find({
      donorId,
      status: 'pending',
    })
      .populate({
        path: 'requestId',
        select:
          'patientName bloodGroup unitsRequired hospitalName hospitalLocation urgency requiredDateTime notes status createdAt',
      })
      .sort({ createdAt: -1 });

    return notifications
      .filter((n) => n.requestId != null) // filter out deleted requests
      .map((n) => {
        const req = n.requestId as unknown as IBloodRequestDocument;
        return {
          notificationId: n._id.toString(),
          requestId: req._id.toString(),
          bloodGroup: req.bloodGroup,
          unitsRequired: req.unitsRequired,
          hospitalName: req.hospitalName,
          hospitalAddress: req.hospitalLocation?.address || '',
          distanceKm: n.distanceKm,
          distanceFormatted: `${n.distanceKm} km`,
          urgency: req.urgency,
          requiredDateTime: req.requiredDateTime
            ? req.requiredDateTime.toISOString()
            : null,
          patientName: req.patientName,
          notes: req.notes || '',
          status: n.status,
          requestStatus: req.status,
          createdAt: req.createdAt.toISOString(),
        };
      });
  }

  /**
   * Donor ACCEPTS a blood request.
   * - Uses atomic findOneAndUpdate to prevent race conditions (only first acceptor wins)
   * - Creates a Donation record
   * - Reveals requester contact info to the donor
   */
  public static async acceptRequest(
    notificationId: string,
    donorId: string
  ): Promise<AcceptResult> {
    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      throw new AppError('Invalid notification ID format', 400);
    }

    // Check if donor is currently available
    const donorUser = await User.findById(donorId);
    if (donorUser && !donorUser.isAvailable) {
      throw new AppError(
        'You are currently marked as unavailable to donate blood',
        400
      );
    }

    // 1. Validate the notification belongs to this donor
    const notification = await DonorNotification.findOne({
      _id: notificationId,
      donorId,
    });

    if (!notification) {
      throw new AppError('Donor notification not found', 404);
    }

    if (notification.status !== 'pending') {
      throw new AppError(
        `You have already ${notification.status} this request`,
        400
      );
    }

    const requestId = notification.requestId;

    // 2. Atomic update: only set acceptedDonorId if it's still null
    //    This prevents race conditions where multiple donors accept simultaneously
    const updatedRequest = await BloodRequest.findOneAndUpdate(
      {
        _id: requestId,
        acceptedDonorId: null, // Only succeeds if no donor has been accepted yet
        status: { $nin: ['fulfilled', 'cancelled', 'expired'] },
      },
      {
        $set: {
          acceptedDonorId: donorId,
          status: 'donor_accepted',
        },
        $push: {
          statusHistory: {
            status: 'donor_accepted',
            timestamp: new Date(),
            updatedBy: donorId,
          },
        },
      },
      { new: true }
    ).populate('requesterId', 'name phone email pushToken');

    if (!updatedRequest) {
      // Another donor already accepted, or request was cancelled/fulfilled
      notification.status = 'expired';
      notification.respondedAt = new Date();
      await notification.save();

      throw new AppError(
        'This request has already been accepted by another donor or is no longer available',
        409
      );
    }

    // 3. Update this donor's notification to accepted
    notification.status = 'accepted';
    notification.respondedAt = new Date();
    await notification.save();

    // 4. Expire all other pending notifications for this request
    await DonorNotification.updateMany(
      {
        requestId,
        donorId: { $ne: donorId },
        status: 'pending',
      },
      {
        $set: { status: 'expired', respondedAt: new Date() },
      }
    );

    // 5. Create a Donation record
    const donation = await Donation.create({
      donorId,
      requestId,
      status: 'accepted',
    });

    // Send push notification #2: Donor accepted request (to requester)
    const requester = updatedRequest.requesterId as any;
    try {
      if (requester?.pushToken) {
        const donorUser = await User.findById(donorId).select('name');
        await PushNotificationService.notifyDonorAccepted(
          requester.pushToken,
          donorUser?.name || 'A verified donor',
          {
            requestId: updatedRequest._id.toString(),
            bloodGroup: updatedRequest.bloodGroup,
            hospitalName: updatedRequest.hospitalName,
          }
        );
      }
    } catch (pushErr: any) {
      console.warn('Failed to send donor accepted push:', pushErr.message);
    }

    // 6. Return result with requester contact info (now visible after acceptance)
    return {
      donation: await donation.populate([
        { path: 'donorId', select: 'name bloodGroup' },
        {
          path: 'requestId',
          select:
            'patientName hospitalName bloodGroup unitsRequired urgency hospitalLocation contactNumber',
        },
      ]),
      request: updatedRequest,
      requesterContact: {
        name: requester?.name || 'Requester',
        phone: requester?.phone || updatedRequest.contactNumber,
      },
    };
  }

  /**
   * Donor DECLINES a blood request.
   * - Updates notification status to declined
   * - Request remains available for other matched donors
   */
  public static async declineRequest(
    notificationId: string,
    donorId: string
  ): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      throw new AppError('Invalid notification ID format', 400);
    }

    const notification = await DonorNotification.findOne({
      _id: notificationId,
      donorId,
    });

    if (!notification) {
      throw new AppError('Donor notification not found', 404);
    }

    if (notification.status !== 'pending') {
      throw new AppError(
        `You have already ${notification.status} this request`,
        400
      );
    }

    notification.status = 'declined';
    notification.respondedAt = new Date();
    await notification.save();

    // Check if all donors have declined — if so, update request status
    const remainingPending = await DonorNotification.countDocuments({
      requestId: notification.requestId,
      status: 'pending',
    });

    if (remainingPending === 0) {
      // All matched donors declined — set back to pending for re-matching
      await BloodRequest.findByIdAndUpdate(notification.requestId, {
        status: 'pending',
      });
    }

    // Send push notification #3: Donor declined (to requester)
    try {
      const request = await BloodRequest.findById(notification.requestId).populate(
        'requesterId',
        'pushToken'
      );
      const requester = request?.requesterId as any;
      if (requester?.pushToken) {
        await PushNotificationService.notifyDonorDeclined(requester.pushToken, {
          requestId: request!._id.toString(),
          hospitalName: request!.hospitalName,
        });
      }
    } catch (pushErr: any) {
      console.warn('Failed to send donor declined push:', pushErr.message);
    }
  }

  /**
   * Get the accepted request details for a specific request.
   * Returns donor and requester contact info only if request is accepted.
   */
  public static async getAcceptedRequestDetails(requestId: string, userId: string) {
    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      throw new AppError('Invalid request ID format', 400);
    }

    const request = await BloodRequest.findById(requestId)
      .populate('requesterId', 'name phone email')
      .populate('acceptedDonorId', 'name phone bloodGroup');

    if (!request) {
      throw new AppError('Blood request not found', 404);
    }

    const isRequester = request.requesterId &&
      (request.requesterId as any)._id?.toString() === userId;
    const isDonor = request.acceptedDonorId &&
      (request.acceptedDonorId as any)._id?.toString() === userId;

    if (!isRequester && !isDonor) {
      throw new AppError('You are not authorized to view these details', 403);
    }

    const result: any = {
      request: {
        _id: request._id,
        patientName: request.patientName,
        bloodGroup: request.bloodGroup,
        unitsRequired: request.unitsRequired,
        hospitalName: request.hospitalName,
        hospitalLocation: request.hospitalLocation,
        urgency: request.urgency,
        requiredDateTime: request.requiredDateTime,
        notes: request.notes,
        status: request.status,
        statusHistory: request.statusHistory || [],
        requesterId: (request.requesterId as any)?._id || request.requesterId,
        acceptedDonorId: (request.acceptedDonorId as any)?._id || request.acceptedDonorId,
        createdAt: request.createdAt,
      },
    };

    // Reveal contact details only after donor has accepted
    if (
      request.status === 'donor_accepted' ||
      request.status === 'contact_established' ||
      request.status === 'on_the_way' ||
      request.status === 'fulfilled' ||
      request.status === 'closed'
    ) {
      const requester = request.requesterId as any;
      const donor = request.acceptedDonorId as any;

      if (isDonor && requester) {
        result.requesterContact = {
          name: requester.name,
          phone: requester.phone || request.contactNumber,
        };
      }

      if (isRequester && donor) {
        result.donorContact = {
          name: donor.name,
          phone: donor.phone,
          bloodGroup: donor.bloodGroup,
        };
      }
    }

    return result;
  }

  /**
   * Update the request status through the workflow stages.
   * Role-based transitions:
   *   Donor only: donor_accepted → contact_established → on_the_way → fulfilled
   *   Requester only: fulfilled → closed
   */
  public static async advanceRequestStatus(
    requestId: string,
    userId: string,
    newStatus: string
  ) {
    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      throw new AppError('Invalid request ID format', 400);
    }

    const request = await BloodRequest.findById(requestId);
    if (!request) {
      throw new AppError('Blood request not found', 404);
    }

    const isRequester = request.requesterId.toString() === userId;
    const isDonor = request.acceptedDonorId?.toString() === userId;

    if (!isRequester && !isDonor) {
      throw new AppError('You are not authorized to update this request', 403);
    }

    // Define allowed transitions with role constraints
    const donorTransitions: Record<string, string[]> = {
      donor_accepted: ['contact_established'],
      contact_established: ['on_the_way'],
      on_the_way: ['fulfilled'],
    };

    const requesterTransitions: Record<string, string[]> = {
      fulfilled: ['closed'],
    };

    // Check if the transition is valid for the user's role
    let transitionAllowed = false;

    if (isDonor) {
      const allowed = donorTransitions[request.status];
      if (allowed && allowed.includes(newStatus)) {
        transitionAllowed = true;
      }
    }

    if (isRequester) {
      const allowed = requesterTransitions[request.status];
      if (allowed && allowed.includes(newStatus)) {
        transitionAllowed = true;
      }
    }

    if (!transitionAllowed) {
      const role = isDonor ? 'donor' : 'requester';
      throw new AppError(
        `Cannot transition from '${request.status}' to '${newStatus}' as ${role}`,
        400
      );
    }

    request.status = newStatus as any;

    // Record status history entry with timestamp and user
    request.statusHistory.push({
      status: newStatus,
      timestamp: new Date(),
      updatedBy: userId as any,
    });

    await request.save();

    // Emit real-time status update via Socket.IO
    try {
      const { SocketService } = await import('./socketService.js');
      SocketService.emitStatusUpdate(requestId, newStatus, userId);
    } catch (socketErr: any) {
      console.warn('Failed to emit status update via socket:', socketErr.message);
    }

    // Send push notification #4: Donor is on the way (to requester)
    if (newStatus === 'on_the_way') {
      try {
        const populated = await BloodRequest.findById(requestId)
          .populate('requesterId', 'pushToken')
          .populate('acceptedDonorId', 'name');
        const requester = populated?.requesterId as any;
        const donor = populated?.acceptedDonorId as any;

        if (requester?.pushToken) {
          await PushNotificationService.notifyDonorOnTheWay(
            requester.pushToken,
            donor?.name || 'Your donor',
            {
              requestId: request._id.toString(),
              hospitalName: request.hospitalName,
            }
          );
        }
      } catch (pushErr: any) {
        console.warn('Failed to send donor on the way push:', pushErr.message);
      }
    }

    // Send push notification #5: Donation completed (to both donor and requester)
    if (newStatus === 'fulfilled') {
      await Donation.findOneAndUpdate(
        { requestId: request._id, status: { $ne: 'completed' } },
        { status: 'completed', completedAt: new Date() }
      );

      try {
        const populated = await BloodRequest.findById(requestId)
          .populate('requesterId', 'pushToken')
          .populate('acceptedDonorId', 'pushToken');

        const requesterToken = (populated?.requesterId as any)?.pushToken;
        const donorToken = (populated?.acceptedDonorId as any)?.pushToken;
        const tokens = [requesterToken, donorToken].filter(Boolean) as string[];

        if (tokens.length > 0) {
          await PushNotificationService.notifyDonationCompleted(tokens, {
            requestId: request._id.toString(),
            hospitalName: request.hospitalName,
            bloodGroup: request.bloodGroup,
          });
        }
      } catch (pushErr: any) {
        console.warn('Failed to send donation completed push:', pushErr.message);
      }
    }

    return request;
  }
}
