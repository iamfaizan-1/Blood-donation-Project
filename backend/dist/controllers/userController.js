"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePushToken = exports.updateAvailability = exports.updateProfile = exports.getCurrentUser = void 0;
const userService_js_1 = require("../services/userService.js");
const response_js_1 = require("../utils/response.js");
const appError_js_1 = require("../utils/appError.js");
const getCurrentUser = async (req, res, next) => {
    try {
        if (!req.user) {
            throw new appError_js_1.AppError('Unauthorized', 401);
        }
        (0, response_js_1.sendResponse)(res, 200, true, 'User profile fetched successfully', req.user);
    }
    catch (error) {
        next(error);
    }
};
exports.getCurrentUser = getCurrentUser;
const updateProfile = async (req, res, next) => {
    try {
        if (!req.user)
            throw new appError_js_1.AppError('Unauthorized', 401);
        const updatedUser = await userService_js_1.UserService.updateProfile(req.user._id.toString(), req.body);
        (0, response_js_1.sendResponse)(res, 200, true, 'Profile updated successfully', updatedUser);
    }
    catch (error) {
        next(error);
    }
};
exports.updateProfile = updateProfile;
const updateAvailability = async (req, res, next) => {
    try {
        if (!req.user)
            throw new appError_js_1.AppError('Unauthorized', 401);
        const { isAvailable } = req.body;
        if (typeof isAvailable !== 'boolean') {
            throw new appError_js_1.AppError('isAvailable boolean field is required', 400);
        }
        const updatedUser = await userService_js_1.UserService.updateAvailability(req.user._id.toString(), isAvailable);
        (0, response_js_1.sendResponse)(res, 200, true, 'Donor availability status updated', updatedUser);
    }
    catch (error) {
        next(error);
    }
};
exports.updateAvailability = updateAvailability;
const updatePushToken = async (req, res, next) => {
    try {
        if (!req.user)
            throw new appError_js_1.AppError('Unauthorized', 401);
        const { pushToken } = req.body;
        if (!pushToken) {
            throw new appError_js_1.AppError('pushToken is required', 400);
        }
        const updatedUser = await userService_js_1.UserService.updatePushToken(req.user._id.toString(), pushToken);
        (0, response_js_1.sendResponse)(res, 200, true, 'Push token registered successfully', {
            userId: updatedUser._id,
            pushToken: updatedUser.pushToken,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updatePushToken = updatePushToken;
