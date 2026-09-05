"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateRequestStatus = exports.getRequestById = exports.getMyRequests = exports.getMatchingDonors = exports.getActiveRequests = exports.createRequest = void 0;
const requestService_js_1 = require("../services/requestService.js");
const donorMatchingService_js_1 = require("../services/donorMatchingService.js");
const response_js_1 = require("../utils/response.js");
const appError_js_1 = require("../utils/appError.js");
const createRequest = async (req, res, next) => {
    try {
        if (!req.user)
            throw new appError_js_1.AppError('Unauthorized', 401);
        const request = await requestService_js_1.RequestService.createRequest({
            ...req.body,
            requesterId: req.user._id.toString(),
        });
        (0, response_js_1.sendResponse)(res, 201, true, 'Blood request created successfully', request);
    }
    catch (error) {
        next(error);
    }
};
exports.createRequest = createRequest;
const getActiveRequests = async (req, res, next) => {
    try {
        const { bloodGroup, status } = req.query;
        const requests = await requestService_js_1.RequestService.getActiveRequests({
            bloodGroup: bloodGroup,
            status: status,
        });
        (0, response_js_1.sendResponse)(res, 200, true, 'Active blood requests retrieved', requests);
    }
    catch (error) {
        next(error);
    }
};
exports.getActiveRequests = getActiveRequests;
const getMatchingDonors = async (req, res, next) => {
    try {
        const { bloodGroup, radius, latitude, longitude } = req.query;
        const radiusKm = radius ? parseFloat(radius) : 20;
        const hospitalLocation = {
            latitude: latitude ? parseFloat(latitude) : 40.7128,
            longitude: longitude ? parseFloat(longitude) : -74.0060,
        };
        const matchingDonors = await donorMatchingService_js_1.DonorMatchingService.findMatchingDonors({
            recipientBloodGroup: bloodGroup || undefined,
            hospitalLocation,
            radiusKm,
            onlyVerified: req.query.onlyVerified === 'true',
        });
        (0, response_js_1.sendResponse)(res, 200, true, 'Compatible matching donors retrieved', matchingDonors);
    }
    catch (error) {
        next(error);
    }
};
exports.getMatchingDonors = getMatchingDonors;
const getMyRequests = async (req, res, next) => {
    try {
        if (!req.user)
            throw new appError_js_1.AppError('Unauthorized', 401);
        const requests = await requestService_js_1.RequestService.getUserRequests(req.user._id.toString());
        (0, response_js_1.sendResponse)(res, 200, true, 'Your blood requests retrieved', requests);
    }
    catch (error) {
        next(error);
    }
};
exports.getMyRequests = getMyRequests;
const getRequestById = async (req, res, next) => {
    try {
        const requestId = req.params.id;
        const request = await requestService_js_1.RequestService.getRequestById(requestId);
        (0, response_js_1.sendResponse)(res, 200, true, 'Blood request details retrieved', request);
    }
    catch (error) {
        next(error);
    }
};
exports.getRequestById = getRequestById;
const updateRequestStatus = async (req, res, next) => {
    try {
        if (!req.user)
            throw new appError_js_1.AppError('Unauthorized', 401);
        const requestId = req.params.id;
        const { status } = req.body;
        if (!status) {
            throw new appError_js_1.AppError('Request status is required', 400);
        }
        const updatedRequest = await requestService_js_1.RequestService.updateRequestStatus(requestId, req.user._id.toString(), status);
        (0, response_js_1.sendResponse)(res, 200, true, 'Request status updated', updatedRequest);
    }
    catch (error) {
        next(error);
    }
};
exports.updateRequestStatus = updateRequestStatus;
