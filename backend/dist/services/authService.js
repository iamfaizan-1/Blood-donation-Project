"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_js_1 = require("../models/User.js");
const env_js_1 = require("../config/env.js");
const appError_js_1 = require("../utils/appError.js");
class AuthService {
    /** Generate JWT token */
    static generateToken(id, email) {
        return jsonwebtoken_1.default.sign({ id, email }, env_js_1.config.jwtSecret, {
            expiresIn: env_js_1.config.jwtExpiresIn,
        });
    }
    /** Register new user */
    static async register(data) {
        const cleanEmail = data.email.trim().toLowerCase();
        const existingUser = await User_js_1.User.findOne({ email: cleanEmail });
        if (existingUser) {
            throw new appError_js_1.AppError('An account with this email already exists', 400);
        }
        const user = await User_js_1.User.create({
            name: data.name.trim(),
            email: cleanEmail,
            password: data.password,
            phone: data.phone.trim(),
            bloodGroup: data.bloodGroup,
            isDonor: data.isDonor !== undefined ? data.isDonor : true,
            location: data.location || { address: '', latitude: 0, longitude: 0 },
        });
        const token = this.generateToken(user._id.toString(), user.email);
        // Omit password from output
        const userObj = user.toObject();
        delete userObj.password;
        return { user: userObj, token };
    }
    /** Login user */
    static async login(data) {
        if (!data.email || !data.password) {
            throw new appError_js_1.AppError('Please provide email and password', 400);
        }
        const cleanEmail = data.email.trim().toLowerCase();
        const user = await User_js_1.User.findOne({ email: cleanEmail }).select('+password');
        if (!user || !(await user.comparePassword(data.password))) {
            throw new appError_js_1.AppError('Invalid email or password', 401);
        }
        const token = this.generateToken(user._id.toString(), user.email);
        const userObj = user.toObject();
        delete userObj.password;
        return { user: userObj, token };
    }
}
exports.AuthService = AuthService;
