"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const BloodRequest_js_1 = require("../models/BloodRequest.js");
const appError_js_1 = require("../utils/appError.js");
const donorWorkflowService_js_1 = require("./donorWorkflowService.js");
class RequestService {
    /** Create a new blood request */
    static async createRequest(data) {
        // Check for duplicate active request by same requester for same patient & hospital
        const existingActive = await BloodRequest_js_1.BloodRequest.findOne({
            requesterId: data.requesterId,
            patientName: data.patientName.trim(),
            bloodGroup: data.bloodGroup,
            hospitalName: data.hospitalName.trim(),
            status: {
                $in: [
                    'pending',
                    'matching',
                    'donor_found',
                    'donor_accepted',
                    'contact_established',
                    'on_the_way',
                ],
            },
        });
        if (existingActive) {
            throw new appError_js_1.AppError('An active blood request for this patient and hospital already exists. Please check your active requests.', 409);
        }
        const request = await BloodRequest_js_1.BloodRequest.create({
            requesterId: data.requesterId,
            patientName: data.patientName.trim(),
            bloodGroup: data.bloodGroup,
            unitsRequired: data.unitsRequired,
            hospitalName: data.hospitalName.trim(),
            hospitalLocation: data.hospitalLocation || { address: '', latitude: 0, longitude: 0 },
            urgency: data.urgency || 'normal',
            requiredDateTime: data.requiredDateTime,
            contactNumber: data.contactNumber,
            notes: data.notes,
            searchRadiusKm: data.searchRadiusKm || 10,
            status: 'pending',
            statusHistory: [
                {
                    status: 'pending',
                    timestamp: new Date(),
                    updatedBy: data.requesterId,
                },
            ],
        });
        // Step 1 & 2: Automatically find compatible available donors and dispatch notifications
        try {
            await donorWorkflowService_js_1.DonorWorkflowService.notifyMatchedDonors(request._id.toString());
        }
        catch (err) {
            console.warn('Auto donor notification warning:', err.message);
        }
        return request;
    }
    /** Get requests created by a specific user */
    static async getUserRequests(userId) {
        return await BloodRequest_js_1.BloodRequest.find({ requesterId: userId })
            .sort({ createdAt: -1 });
    }
    /** Get all active requests (for donors searching) */
    static async getActiveRequests(filter) {
        const query = {};
        if (filter?.bloodGroup)
            query.bloodGroup = filter.bloodGroup;
        if (filter?.status) {
            query.status = filter.status;
        }
        else {
            query.status = {
                $in: [
                    'pending',
                    'active',
                    'matching',
                    'donor_found',
                    'donor_accepted',
                    'contact_established',
                    'on_the_way',
                ],
            };
        }
        return await BloodRequest_js_1.BloodRequest.find(query)
            .populate('requesterId', 'name phone isVerified')
            .sort({ createdAt: -1 });
    }
    /** Get request details by ID */
    static async getRequestById(requestId) {
        if (!mongoose_1.default.Types.ObjectId.isValid(requestId)) {
            throw new appError_js_1.AppError('Invalid request ID format', 400);
        }
        const request = await BloodRequest_js_1.BloodRequest.findById(requestId).populate('requesterId', 'name phone isVerified');
        if (!request) {
            throw new appError_js_1.AppError('Blood request not found', 404);
        }
        return request;
    }
    /** Update request status */
    static async updateRequestStatus(requestId, userId, status) {
        if (!mongoose_1.default.Types.ObjectId.isValid(requestId)) {
            throw new appError_js_1.AppError('Invalid request ID format', 400);
        }
        const request = await BloodRequest_js_1.BloodRequest.findById(requestId);
        if (!request) {
            throw new appError_js_1.AppError('Blood request not found', 404);
        }
        // Only requester or admin can update status
        if (request.requesterId.toString() !== userId) {
            throw new appError_js_1.AppError('Unauthorized to update this request status', 403);
        }
        request.status = status;
        await request.save();
        return request;
    }
}
exports.RequestService = RequestService;
