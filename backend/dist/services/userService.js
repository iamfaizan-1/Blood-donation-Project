"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const User_js_1 = require("../models/User.js");
const appError_js_1 = require("../utils/appError.js");
class UserService {
    /** Get user profile by ID */
    static async getUserById(userId) {
        const user = await User_js_1.User.findById(userId);
        if (!user) {
            throw new appError_js_1.AppError('User not found', 404);
        }
        return user;
    }
    /** Update user profile */
    static async updateProfile(userId, data) {
        const user = await User_js_1.User.findByIdAndUpdate(userId, { $set: data }, { new: true, runValidators: true });
        if (!user) {
            throw new appError_js_1.AppError('User not found', 404);
        }
        return user;
    }
    /** Toggle donor availability */
    static async updateAvailability(userId, isAvailable) {
        const updateFields = { isAvailable };
        if (isAvailable) {
            updateFields.isDonor = true;
            updateFields.isVerified = true;
        }
        const user = await User_js_1.User.findByIdAndUpdate(userId, { $set: updateFields }, { new: true });
        if (!user) {
            throw new appError_js_1.AppError('User not found', 404);
        }
        return user;
    }
    /** Update user's device push notification token */
    static async updatePushToken(userId, pushToken) {
        const user = await User_js_1.User.findByIdAndUpdate(userId, { $set: { pushToken } }, { new: true });
        if (!user) {
            throw new appError_js_1.AppError('User not found', 404);
        }
        return user;
    }
}
exports.UserService = UserService;
