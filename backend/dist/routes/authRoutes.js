"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_js_1 = require("../controllers/authController.js");
const validate_js_1 = require("../middleware/validate.js");
const router = (0, express_1.Router)();
router.post('/register', validate_js_1.validateRegister, authController_js_1.registerUser);
router.post('/login', validate_js_1.validateLogin, authController_js_1.loginUser);
exports.default = router;
