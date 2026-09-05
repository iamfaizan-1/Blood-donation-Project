"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const communicationController_js_1 = require("../controllers/communicationController.js");
const auth_js_1 = require("../middleware/auth.js");
const router = (0, express_1.Router)();
// Protect all communication endpoints with JWT authentication
router.use(auth_js_1.authenticate);
router.get('/messages/:requestId', communicationController_js_1.getChatHistory);
router.post('/report', communicationController_js_1.reportUser);
router.post('/block', communicationController_js_1.blockUser);
router.get('/contact/:requestId', communicationController_js_1.getSecureContact);
exports.default = router;
