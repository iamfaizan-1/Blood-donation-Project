"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DonorWorkflowService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const BloodRequest_js_1 = require("../models/BloodRequest.js");
const DonorNotification_js_1 = require("../models/DonorNotification.js");
const Donation_js_1 = require("../models/Donation.js");
const User_js_1 = require("../models/User.js");
const donorMatchingService_js_1 = require("./donorMatchingService.js");
const pushNotificationService_js_1 = require("./pushNotificationService.js");
const appError_js_1 = require("../utils/appError.js");
class DonorWorkflowService {
    /**
     * Step 1: After a blood request is created, find compatible donors
     * and create notification records for each matched donor.
     */
    static async notifyMatchedDonors(requestId) {
        if (!mongoose_1.default.Types.ObjectId.isValid(requestId)) {
            throw new appError_js_1.AppError('Invalid request ID format', 400);
        }
        const request = await BloodRequest_js_1.BloodRequest.findById(requestId);
        if (!request) {
            throw new appError_js_1.AppError('Blood request not found', 404);
        }
        // Find compatible, available, verified donors within radius
        const matchedDonors = await donorMatchingService_js_1.DonorMatchingService.findMatchingDonors({
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
                const notification = await DonorNotification_js_1.DonorNotification.create({
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
            }
            catch (error) {
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
                const donorUsers = await User_js_1.User.find({
                    _id: { $in: donorIds },
                    pushToken: { $exists: true, $ne: null },
                }).select('pushToken');
                const pushTokens = donorUsers
                    .map((u) => u.pushToken)
                    .filter(Boolean);
                if (pushTokens.length > 0) {
                    await pushNotificationService_js_1.PushNotificationService.notifyEmergencyRequest(pushTokens, {
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
            }
            catch (pushErr) {
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
    static async getDonorNotifications(donorId) {
        const notifications = await DonorNotification_js_1.DonorNotification.find({
            donorId,
            status: 'pending',
        })
            .populate({
            path: 'requestId',
            select: 'patientName bloodGroup unitsRequired hospitalName hospitalLocation urgency requiredDateTime notes status createdAt',
        })
            .sort({ createdAt: -1 });
        return notifications
            .filter((n) => n.requestId != null) // filter out deleted requests
            .map((n) => {
            const req = n.requestId;
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
    static async acceptRequest(notificationId, donorId) {
        if (!mongoose_1.default.Types.ObjectId.isValid(notificationId)) {
            throw new appError_js_1.AppError('Invalid notification ID format', 400);
        }
        // Check if donor is currently available
        const donorUser = await User_js_1.User.findById(donorId);
        if (donorUser && !donorUser.isAvailable) {
            throw new appError_js_1.AppError('You are currently marked as unavailable to donate blood', 400);
        }
        // 1. Validate the notification belongs to this donor
        const notification = await DonorNotification_js_1.DonorNotification.findOne({
            _id: notificationId,
            donorId,
        });
        if (!notification) {
            throw new appError_js_1.AppError('Donor notification not found', 404);
        }
        if (notification.status !== 'pending') {
            throw new appError_js_1.AppError(`You have already ${notification.status} this request`, 400);
        }
        const requestId = notification.requestId;
        // 2. Atomic update: only set acceptedDonorId if it's still null
        //    This prevents race conditions where multiple donors accept simultaneously
        const updatedRequest = await BloodRequest_js_1.BloodRequest.findOneAndUpdate({
            _id: requestId,
            acceptedDonorId: null, // Only succeeds if no donor has been accepted yet
            status: { $nin: ['fulfilled', 'cancelled', 'expired'] },
        }, {
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
        }, { new: true }).populate('requesterId', 'name phone email pushToken');
        if (!updatedRequest) {
            // Another donor already accepted, or request was cancelled/fulfilled
            notification.status = 'expired';
            notification.respondedAt = new Date();
            await notification.save();
            throw new appError_js_1.AppError('This request has already been accepted by another donor or is no longer available', 409);
        }
        // 3. Update this donor's notification to accepted
        notification.status = 'accepted';
        notification.respondedAt = new Date();
        await notification.save();
        // 4. Expire all other pending notifications for this request
        await DonorNotification_js_1.DonorNotification.updateMany({
            requestId,
            donorId: { $ne: donorId },
            status: 'pending',
        }, {
            $set: { status: 'expired', respondedAt: new Date() },
        });
        // 5. Create a Donation record
        const donation = await Donation_js_1.Donation.create({
            donorId,
            requestId,
            status: 'accepted',
        });
        // Send push notification #2: Donor accepted request (to requester)
        const requester = updatedRequest.requesterId;
        try {
            if (requester?.pushToken) {
                const donorUser = await User_js_1.User.findById(donorId).select('name');
                await pushNotificationService_js_1.PushNotificationService.notifyDonorAccepted(requester.pushToken, donorUser?.name || 'A verified donor', {
                    requestId: updatedRequest._id.toString(),
                    bloodGroup: updatedRequest.bloodGroup,
                    hospitalName: updatedRequest.hospitalName,
                });
            }
        }
        catch (pushErr) {
            console.warn('Failed to send donor accepted push:', pushErr.message);
        }
        // 6. Return result with requester contact info (now visible after acceptance)
        return {
            donation: await donation.populate([
                { path: 'donorId', select: 'name bloodGroup' },
                {
                    path: 'requestId',
                    select: 'patientName hospitalName bloodGroup unitsRequired urgency hospitalLocation contactNumber',
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
    static async declineRequest(notificationId, donorId) {
        if (!mongoose_1.default.Types.ObjectId.isValid(notificationId)) {
            throw new appError_js_1.AppError('Invalid notification ID format', 400);
        }
        const notification = await DonorNotification_js_1.DonorNotification.findOne({
            _id: notificationId,
            donorId,
        });
        if (!notification) {
            throw new appError_js_1.AppError('Donor notification not found', 404);
        }
        if (notification.status !== 'pending') {
            throw new appError_js_1.AppError(`You have already ${notification.status} this request`, 400);
        }
        notification.status = 'declined';
        notification.respondedAt = new Date();
        await notification.save();
        // Check if all donors have declined — if so, update request status
        const remainingPending = await DonorNotification_js_1.DonorNotification.countDocuments({
            requestId: notification.requestId,
            status: 'pending',
        });
        if (remainingPending === 0) {
            // All matched donors declined — set back to pending for re-matching
            await BloodRequest_js_1.BloodRequest.findByIdAndUpdate(notification.requestId, {
                status: 'pending',
            });
        }
        // Send push notification #3: Donor declined (to requester)
        try {
            const request = await BloodRequest_js_1.BloodRequest.findById(notification.requestId).populate('requesterId', 'pushToken');
            const requester = request?.requesterId;
            if (requester?.pushToken) {
                await pushNotificationService_js_1.PushNotificationService.notifyDonorDeclined(requester.pushToken, {
                    requestId: request._id.toString(),
                    hospitalName: request.hospitalName,
                });
            }
        }
        catch (pushErr) {
            console.warn('Failed to send donor declined push:', pushErr.message);
        }
    }
    /**
     * Get the accepted request details for a specific request.
     * Returns donor and requester contact info only if request is accepted.
     */
    static async getAcceptedRequestDetails(requestId, userId) {
        if (!mongoose_1.default.Types.ObjectId.isValid(requestId)) {
            throw new appError_js_1.AppError('Invalid request ID format', 400);
        }
        const request = await BloodRequest_js_1.BloodRequest.findById(requestId)
            .populate('requesterId', 'name phone email')
            .populate('acceptedDonorId', 'name phone bloodGroup');
        if (!request) {
            throw new appError_js_1.AppError('Blood request not found', 404);
        }
        const isRequester = request.requesterId &&
            request.requesterId._id?.toString() === userId;
        const isDonor = request.acceptedDonorId &&
            request.acceptedDonorId._id?.toString() === userId;
        if (!isRequester && !isDonor) {
            throw new appError_js_1.AppError('You are not authorized to view these details', 403);
        }
        const result = {
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
                requesterId: request.requesterId?._id || request.requesterId,
                acceptedDonorId: request.acceptedDonorId?._id || request.acceptedDonorId,
                createdAt: request.createdAt,
            },
        };
        // Reveal contact details only after donor has accepted
        if (request.status === 'donor_accepted' ||
            request.status === 'contact_established' ||
            request.status === 'on_the_way' ||
            request.status === 'fulfilled' ||
            request.status === 'closed') {
            const requester = request.requesterId;
            const donor = request.acceptedDonorId;
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
    static async advanceRequestStatus(requestId, userId, newStatus) {
        if (!mongoose_1.default.Types.ObjectId.isValid(requestId)) {
            throw new appError_js_1.AppError('Invalid request ID format', 400);
        }
        const request = await BloodRequest_js_1.BloodRequest.findById(requestId);
        if (!request) {
            throw new appError_js_1.AppError('Blood request not found', 404);
        }
        const isRequester = request.requesterId.toString() === userId;
        const isDonor = request.acceptedDonorId?.toString() === userId;
        if (!isRequester && !isDonor) {
            throw new appError_js_1.AppError('You are not authorized to update this request', 403);
        }
        // Define allowed transitions with role constraints
        const donorTransitions = {
            donor_accepted: ['contact_established'],
            contact_established: ['on_the_way'],
            on_the_way: ['fulfilled'],
        };
        const requesterTransitions = {
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
            throw new appError_js_1.AppError(`Cannot transition from '${request.status}' to '${newStatus}' as ${role}`, 400);
        }
        request.status = newStatus;
        // Record status history entry with timestamp and user
        request.statusHistory.push({
            status: newStatus,
            timestamp: new Date(),
            updatedBy: userId,
        });
        await request.save();
        // Emit real-time status update via Socket.IO
        try {
            const { SocketService } = await import('./socketService.js');
            SocketService.emitStatusUpdate(requestId, newStatus, userId);
        }
        catch (socketErr) {
            console.warn('Failed to emit status update via socket:', socketErr.message);
        }
        // Send push notification #4: Donor is on the way (to requester)
        if (newStatus === 'on_the_way') {
            try {
                const populated = await BloodRequest_js_1.BloodRequest.findById(requestId)
                    .populate('requesterId', 'pushToken')
                    .populate('acceptedDonorId', 'name');
                const requester = populated?.requesterId;
                const donor = populated?.acceptedDonorId;
                if (requester?.pushToken) {
                    await pushNotificationService_js_1.PushNotificationService.notifyDonorOnTheWay(requester.pushToken, donor?.name || 'Your donor', {
                        requestId: request._id.toString(),
                        hospitalName: request.hospitalName,
                    });
                }
            }
            catch (pushErr) {
                console.warn('Failed to send donor on the way push:', pushErr.message);
            }
        }
        // Send push notification #5: Donation completed (to both donor and requester)
        if (newStatus === 'fulfilled') {
            await Donation_js_1.Donation.findOneAndUpdate({ requestId: request._id, status: { $ne: 'completed' } }, { status: 'completed', completedAt: new Date() });
            try {
                const populated = await BloodRequest_js_1.BloodRequest.findById(requestId)
                    .populate('requesterId', 'pushToken')
                    .populate('acceptedDonorId', 'pushToken');
                const requesterToken = populated?.requesterId?.pushToken;
                const donorToken = populated?.acceptedDonorId?.pushToken;
                const tokens = [requesterToken, donorToken].filter(Boolean);
                if (tokens.length > 0) {
                    await pushNotificationService_js_1.PushNotificationService.notifyDonationCompleted(tokens, {
                        requestId: request._id.toString(),
                        hospitalName: request.hospitalName,
                        bloodGroup: request.bloodGroup,
                    });
                }
            }
            catch (pushErr) {
                console.warn('Failed to send donation completed push:', pushErr.message);
            }
        }
        return request;
    }
}
exports.DonorWorkflowService = DonorWorkflowService;
