"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.advanceStatus = exports.getRequestDetails = exports.declineRequest = exports.acceptRequest = exports.getMyNotifications = exports.notifyDonors = void 0;
const donorWorkflowService_js_1 = require("../services/donorWorkflowService.js");
const response_js_1 = require("../utils/response.js");
const appError_js_1 = require("../utils/appError.js");
/**
 * POST /api/donor-workflow/notify/:requestId
 * Dispatches notifications to all matched donors for a blood request.
 */
const notifyDonors = async (req, res, next) => {
    try {
        if (!req.user)
            throw new appError_js_1.AppError('Unauthorized', 401);
        const requestId = req.params.requestId;
        const result = await donorWorkflowService_js_1.DonorWorkflowService.notifyMatchedDonors(requestId);
        (0, response_js_1.sendResponse)(res, 200, true, `${result.notifiedCount} compatible donors notified`, result);
    }
    catch (error) {
        next(error);
    }
};
exports.notifyDonors = notifyDonors;
/**
 * GET /api/donor-workflow/notifications
 * Returns all pending request notifications for the authenticated donor.
 */
const getMyNotifications = async (req, res, next) => {
    try {
        if (!req.user)
            throw new appError_js_1.AppError('Unauthorized', 401);
        const notifications = await donorWorkflowService_js_1.DonorWorkflowService.getDonorNotifications(req.user._id.toString());
        (0, response_js_1.sendResponse)(res, 200, true, 'Donor notifications retrieved', notifications);
    }
    catch (error) {
        next(error);
    }
};
exports.getMyNotifications = getMyNotifications;
/**
 * POST /api/donor-workflow/accept/:notificationId
 * Donor accepts a blood request. Uses atomic update to prevent race conditions.
 */
const acceptRequest = async (req, res, next) => {
    try {
        if (!req.user)
            throw new appError_js_1.AppError('Unauthorized', 401);
        const notificationId = req.params.notificationId;
        const result = await donorWorkflowService_js_1.DonorWorkflowService.acceptRequest(notificationId, req.user._id.toString());
        (0, response_js_1.sendResponse)(res, 200, true, 'Request accepted! Requester contact information is now available.', result);
    }
    catch (error) {
        next(error);
    }
};
exports.acceptRequest = acceptRequest;
/**
 * POST /api/donor-workflow/decline/:notificationId
 * Donor declines a blood request. Request remains available for other donors.
 */
const declineRequest = async (req, res, next) => {
    try {
        if (!req.user)
            throw new appError_js_1.AppError('Unauthorized', 401);
        const notificationId = req.params.notificationId;
        await donorWorkflowService_js_1.DonorWorkflowService.declineRequest(notificationId, req.user._id.toString());
        (0, response_js_1.sendResponse)(res, 200, true, 'Request declined. Other donors will be notified.');
    }
    catch (error) {
        next(error);
    }
};
exports.declineRequest = declineRequest;
/**
 * GET /api/donor-workflow/request-details/:requestId
 * Gets accepted request details including privacy-gated contact info.
 */
const getRequestDetails = async (req, res, next) => {
    try {
        if (!req.user)
            throw new appError_js_1.AppError('Unauthorized', 401);
        const requestId = req.params.requestId;
        const details = await donorWorkflowService_js_1.DonorWorkflowService.getAcceptedRequestDetails(requestId, req.user._id.toString());
        (0, response_js_1.sendResponse)(res, 200, true, 'Request details retrieved', details);
    }
    catch (error) {
        next(error);
    }
};
exports.getRequestDetails = getRequestDetails;
/**
 * PATCH /api/donor-workflow/advance/:requestId
 * Advances the request through workflow status stages.
 */
const advanceStatus = async (req, res, next) => {
    try {
        if (!req.user)
            throw new appError_js_1.AppError('Unauthorized', 401);
        const requestId = req.params.requestId;
        const { status } = req.body;
        if (!status) {
            throw new appError_js_1.AppError('New status is required', 400);
        }
        const updated = await donorWorkflowService_js_1.DonorWorkflowService.advanceRequestStatus(requestId, req.user._id.toString(), status);
        (0, response_js_1.sendResponse)(res, 200, true, 'Request status advanced', updated);
    }
    catch (error) {
        next(error);
    }
};
exports.advanceStatus = advanceStatus;
