"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalErrorHandler = void 0;
const appError_js_1 = require("../utils/appError.js");
const env_js_1 = require("../config/env.js");
const globalErrorHandler = (err, _req, res, _next) => {
    let statusCode = 500;
    let message = 'Internal Server Error';
    if (err instanceof appError_js_1.AppError) {
        statusCode = err.statusCode;
        message = err.message;
    }
    else if (err.name === 'ValidationError') {
        statusCode = 400;
        message = err.message;
    }
    else if (err.name === 'CastError') {
        statusCode = 400;
        message = 'Resource not found / Invalid ID format';
    }
    else if (err.code === 11000) {
        statusCode = 400;
        message = 'Duplicate field value entered (email already exists)';
    }
    res.status(statusCode).json({
        success: false,
        message,
        ...(env_js_1.config.nodeEnv === 'development' && { stack: err.stack }),
    });
};
exports.globalErrorHandler = globalErrorHandler;
