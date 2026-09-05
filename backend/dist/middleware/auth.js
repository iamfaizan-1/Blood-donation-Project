"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_js_1 = require("../config/env.js");
const appError_js_1 = require("../utils/appError.js");
const User_js_1 = require("../models/User.js");
const authenticate = async (req, _res, next) => {
    try {
        let token;
        if (req.headers.authorization &&
            req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }
        if (!token) {
            return next(new appError_js_1.AppError('Authentication failed. No token provided.', 401));
        }
        const decoded = jsonwebtoken_1.default.verify(token, env_js_1.config.jwtSecret);
        const currentUser = await User_js_1.User.findById(decoded.id);
        if (!currentUser) {
            return next(new appError_js_1.AppError('The user belonging to this token no longer exists.', 401));
        }
        req.user = currentUser;
        next();
    }
    catch (error) {
        return next(new appError_js_1.AppError('Invalid or expired authentication token', 401));
    }
};
exports.authenticate = authenticate;
