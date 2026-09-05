"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginUser = exports.registerUser = void 0;
const authService_js_1 = require("../services/authService.js");
const response_js_1 = require("../utils/response.js");
const registerUser = async (req, res, next) => {
    try {
        const result = await authService_js_1.AuthService.register(req.body);
        (0, response_js_1.sendResponse)(res, 201, true, 'User registered successfully', result);
    }
    catch (error) {
        next(error);
    }
};
exports.registerUser = registerUser;
const loginUser = async (req, res, next) => {
    try {
        const result = await authService_js_1.AuthService.login(req.body);
        (0, response_js_1.sendResponse)(res, 200, true, 'User logged in successfully', result);
    }
    catch (error) {
        next(error);
    }
};
exports.loginUser = loginUser;
