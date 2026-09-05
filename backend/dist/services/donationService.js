"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DonationService = void 0;
const Donation_js_1 = require("../models/Donation.js");
const BloodRequest_js_1 = require("../models/BloodRequest.js");
const appError_js_1 = require("../utils/appError.js");
class DonationService {
    /** Create donation / Accept blood request */
    static async createDonation(data) {
        const request = await BloodRequest_js_1.BloodRequest.findById(data.requestId);
        if (!request) {
            throw new appError_js_1.AppError('Blood request not found', 404);
        }
        if (request.status === 'fulfilled' || request.status === 'cancelled') {
            throw new appError_js_1.AppError(`Cannot donate to a ${request.status} request`, 400);
        }
        // Check if donor has already accepted this request
        const existingDonation = await Donation_js_1.Donation.findOne({
            donorId: data.donorId,
            requestId: data.requestId,
            status: { $in: ['accepted', 'on_the_way', 'completed'] },
        });
        if (existingDonation) {
            throw new appError_js_1.AppError('You have already accepted/donated for this request', 400);
        }
        const donation = await Donation_js_1.Donation.create({
            donorId: data.donorId,
            requestId: data.requestId,
            status: 'accepted',
        });
        // Update request status to active
        request.status = 'active';
        await request.save();
        return await donation.populate([
            { path: 'donorId', select: 'name bloodGroup phone' },
            { path: 'requestId', select: 'patientName hospitalName bloodGroup unitsRequired' },
        ]);
    }
    /** Mark donation as completed */
    static async completeDonation(donationId, userId) {
        const donation = await Donation_js_1.Donation.findById(donationId);
        if (!donation) {
            throw new appError_js_1.AppError('Donation record not found', 404);
        }
        // Ensure only donor or requester can complete
        if (donation.donorId.toString() !== userId) {
            const request = await BloodRequest_js_1.BloodRequest.findById(donation.requestId);
            if (!request || request.requesterId.toString() !== userId) {
                throw new appError_js_1.AppError('Unauthorized to update this donation status', 403);
            }
        }
        donation.status = 'completed';
        donation.completedAt = new Date();
        await donation.save();
        // Mark blood request as fulfilled
        await BloodRequest_js_1.BloodRequest.findByIdAndUpdate(donation.requestId, {
            status: 'fulfilled',
        });
        return donation;
    }
    /** Get donor donation history */
    static async getDonationHistory(donorId) {
        return await Donation_js_1.Donation.find({ donorId })
            .populate({
            path: 'requestId',
            select: 'patientName hospitalName bloodGroup unitsRequired urgency status createdAt',
        })
            .sort({ createdAt: -1 });
    }
}
exports.DonationService = DonationService;
