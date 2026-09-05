"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSecureContact = exports.blockUser = exports.reportUser = exports.getChatHistory = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const BloodRequest_js_1 = require("../models/BloodRequest.js");
const ChatMessage_js_1 = require("../models/ChatMessage.js");
const UserSafety_js_1 = require("../models/UserSafety.js");
const response_js_1 = require("../utils/response.js");
const appError_js_1 = require("../utils/appError.js");
/**
 * GET /api/communication/messages/:requestId
 * Fetch chat message history for an active blood request.
 * Strictly verifies user is requester or accepted donor.
 */
const getChatHistory = async (req, res, next) => {
    try {
        if (!req.user)
            throw new appError_js_1.AppError('Unauthorized', 401);
        const requestId = req.params.requestId;
        const currentUserId = req.user._id.toString();
        if (!mongoose_1.default.Types.ObjectId.isValid(requestId)) {
            throw new appError_js_1.AppError('Invalid request ID format', 400);
        }
        const request = await BloodRequest_js_1.BloodRequest.findById(requestId)
            .populate('requesterId', 'name bloodGroup phone')
            .populate('acceptedDonorId', 'name bloodGroup phone');
        if (!request) {
            throw new appError_js_1.AppError('Blood request not found', 404);
        }
        // Must be in accepted/active lifecycle stage
        const allowedStatuses = ['donor_accepted', 'contact_established', 'on_the_way', 'fulfilled', 'closed'];
        if (!allowedStatuses.includes(request.status)) {
            throw new appError_js_1.AppError('Communication is only available once a donor has accepted this blood request', 403);
        }
        const requesterId = request.requesterId?._id?.toString();
        const donorId = request.acceptedDonorId?._id?.toString();
        const isRequester = currentUserId === requesterId;
        const isDonor = currentUserId === donorId;
        if (!isRequester && !isDonor) {
            throw new appError_js_1.AppError('You are not authorized to view messages for this request', 403);
        }
        const partnerId = isRequester ? donorId : requesterId;
        // Check if blocked
        let isBlocked = false;
        if (partnerId) {
            const blockRecord = await UserSafety_js_1.UserBlock.findOne({
                $or: [
                    { blockerId: currentUserId, blockedId: partnerId },
                    { blockerId: partnerId, blockedId: currentUserId },
                ],
            });
            isBlocked = !!blockRecord;
        }
        const messages = await ChatMessage_js_1.ChatMessage.find({ requestId: request._id })
            .sort({ createdAt: 1 })
            .populate('senderId', 'name');
        const formattedMessages = messages.map((m) => ({
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
        const partnerUser = isRequester ? request.acceptedDonorId : request.requesterId;
        (0, response_js_1.sendResponse)(res, 200, true, 'Chat history retrieved', {
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
    }
    catch (error) {
        next(error);
    }
};
exports.getChatHistory = getChatHistory;
/**
 * POST /api/communication/report
 * File a user safety report
 */
const reportUser = async (req, res, next) => {
    try {
        if (!req.user)
            throw new appError_js_1.AppError('Unauthorized', 401);
        const { reportedId, requestId, reason, details } = req.body;
        if (!reportedId || !reason) {
            throw new appError_js_1.AppError('reportedId and reason are required', 400);
        }
        const validReasons = [
            'harassment',
            'inappropriate_behavior',
            'no_show',
            'fraud_or_scam',
            'safety_concern',
            'other',
        ];
        if (!validReasons.includes(reason)) {
            throw new appError_js_1.AppError('Invalid report reason', 400);
        }
        const report = await UserSafety_js_1.UserReport.create({
            reporterId: req.user._id,
            reportedId,
            requestId,
            reason,
            details,
        });
        (0, response_js_1.sendResponse)(res, 201, true, 'Report submitted successfully. Our safety team will review it.', report);
    }
    catch (error) {
        next(error);
    }
};
exports.reportUser = reportUser;
/**
 * POST /api/communication/block
 * Block an abusive user to sever all communication
 */
const blockUser = async (req, res, next) => {
    try {
        if (!req.user)
            throw new appError_js_1.AppError('Unauthorized', 401);
        const { targetUserId } = req.body;
        if (!targetUserId) {
            throw new appError_js_1.AppError('targetUserId is required', 400);
        }
        if (targetUserId === req.user._id.toString()) {
            throw new appError_js_1.AppError('You cannot block yourself', 400);
        }
        // Upsert block record
        await UserSafety_js_1.UserBlock.findOneAndUpdate({ blockerId: req.user._id, blockedId: targetUserId }, { blockerId: req.user._id, blockedId: targetUserId }, { upsert: true, new: true });
        (0, response_js_1.sendResponse)(res, 200, true, 'User blocked successfully. Communication has been severed.');
    }
    catch (error) {
        next(error);
    }
};
exports.blockUser = blockUser;
/**
 * GET /api/communication/contact/:requestId
 * Get partner contact phone number securely (only unlocked if accepted)
 */
const getSecureContact = async (req, res, next) => {
    try {
        if (!req.user)
            throw new appError_js_1.AppError('Unauthorized', 401);
        const requestId = req.params.requestId;
        const currentUserId = req.user._id.toString();
        if (!mongoose_1.default.Types.ObjectId.isValid(requestId)) {
            throw new appError_js_1.AppError('Invalid request ID format', 400);
        }
        const request = await BloodRequest_js_1.BloodRequest.findById(requestId)
            .populate('requesterId', 'name phone email')
            .populate('acceptedDonorId', 'name phone bloodGroup');
        if (!request) {
            throw new appError_js_1.AppError('Blood request not found', 404);
        }
        if (request.status !== 'donor_accepted' &&
            request.status !== 'contact_established' &&
            request.status !== 'on_the_way' &&
            request.status !== 'fulfilled' &&
            request.status !== 'closed') {
            throw new appError_js_1.AppError('Contact details are only available after donor acceptance', 403);
        }
        const requester = request.requesterId;
        const donor = request.acceptedDonorId;
        const isRequester = currentUserId === requester?._id?.toString();
        const isDonor = currentUserId === donor?._id?.toString();
        if (!isRequester && !isDonor) {
            throw new appError_js_1.AppError('Unauthorized access to contact details', 403);
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
        (0, response_js_1.sendResponse)(res, 200, true, 'Secure contact info retrieved', contact);
    }
    catch (error) {
        next(error);
    }
};
exports.getSecureContact = getSecureContact;
