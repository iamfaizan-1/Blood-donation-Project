"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const requestController_js_1 = require("../controllers/requestController.js");
const auth_js_1 = require("../middleware/auth.js");
const validate_js_1 = require("../middleware/validate.js");
const router = (0, express_1.Router)();
// Public routes for donors
router.get('/', requestController_js_1.getActiveRequests);
router.get('/match/donors', requestController_js_1.getMatchingDonors);
router.get('/:id', requestController_js_1.getRequestById);
// Protected routes
router.post('/', auth_js_1.authenticate, validate_js_1.validateBloodRequest, requestController_js_1.createRequest);
router.get('/user/my-requests', auth_js_1.authenticate, requestController_js_1.getMyRequests);
router.patch('/:id/status', auth_js_1.authenticate, requestController_js_1.updateRequestStatus);
exports.default = router;
