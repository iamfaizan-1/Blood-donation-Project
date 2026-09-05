"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendResponse = void 0;
const sendResponse = (res, statusCode, success, message, data) => {
    return res.status(statusCode).json({
        success,
        message,
        ...(data !== undefined && { data }),
    });
};
exports.sendResponse = sendResponse;
