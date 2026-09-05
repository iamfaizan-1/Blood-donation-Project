"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userController_js_1 = require("../controllers/userController.js");
const auth_js_1 = require("../middleware/auth.js");
const router = (0, express_1.Router)();
// Protect all user routes with JWT authentication
router.use(auth_js_1.authenticate);
router.get('/me', userController_js_1.getCurrentUser);
router.put('/profile', userController_js_1.updateProfile);
router.patch('/availability', userController_js_1.updateAvailability);
router.post('/push-token', userController_js_1.updatePushToken);
exports.default = router;
