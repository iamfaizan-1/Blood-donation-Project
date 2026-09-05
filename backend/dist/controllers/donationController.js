"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDonationHistory = exports.completeDonation = exports.createDonation = void 0;
const donationService_js_1 = require("../services/donationService.js");
const response_js_1 = require("../utils/response.js");
const appError_js_1 = require("../utils/appError.js");
const createDonation = async (req, res, next) => {
    try {
        if (!req.user)
            throw new appError_js_1.AppError('Unauthorized', 401);
        const { requestId } = req.body;
        if (!requestId) {
            throw new appError_js_1.AppError('requestId is required', 400);
        }
        const donation = await donationService_js_1.DonationService.createDonation({
            donorId: req.user._id.toString(),
            requestId,
        });
        (0, response_js_1.sendResponse)(res, 201, true, 'Donation accepted successfully', donation);
    }
    catch (error) {
        next(error);
    }
};
exports.createDonation = createDonation;
const completeDonation = async (req, res, next) => {
    try {
        if (!req.user)
            throw new appError_js_1.AppError('Unauthorized', 401);
        const donationId = req.params.id;
        const completed = await donationService_js_1.DonationService.completeDonation(donationId, req.user._id.toString());
        (0, response_js_1.sendResponse)(res, 200, true, 'Donation marked as completed! Thank you for saving a life.', completed);
    }
    catch (error) {
        next(error);
    }
};
exports.completeDonation = completeDonation;
const getDonationHistory = async (req, res, next) => {
    try {
        if (!req.user)
            throw new appError_js_1.AppError('Unauthorized', 401);
        const history = await donationService_js_1.DonationService.getDonationHistory(req.user._id.toString());
        (0, response_js_1.sendResponse)(res, 200, true, 'Donation history retrieved', history);
    }
    catch (error) {
        next(error);
    }
};
exports.getDonationHistory = getDonationHistory;
