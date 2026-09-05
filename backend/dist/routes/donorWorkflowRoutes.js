"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const donorWorkflowController_js_1 = require("../controllers/donorWorkflowController.js");
const auth_js_1 = require("../middleware/auth.js");
const router = (0, express_1.Router)();
// All donor workflow routes require authentication
router.use(auth_js_1.authenticate);
// Requester dispatches notifications to matched donors
router.post('/notify/:requestId', donorWorkflowController_js_1.notifyDonors);
// Donor views their pending request notifications
router.get('/notifications', donorWorkflowController_js_1.getMyNotifications);
// Donor accepts a request
router.post('/accept/:notificationId', donorWorkflowController_js_1.acceptRequest);
// Donor declines a request
router.post('/decline/:notificationId', donorWorkflowController_js_1.declineRequest);
// Get accepted request details with privacy-gated contact info
router.get('/request-details/:requestId', donorWorkflowController_js_1.getRequestDetails);
// Advance request status through workflow stages
router.patch('/advance/:requestId', donorWorkflowController_js_1.advanceStatus);
exports.default = router;
