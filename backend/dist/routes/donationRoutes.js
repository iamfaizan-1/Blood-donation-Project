"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const donationController_js_1 = require("../controllers/donationController.js");
const auth_js_1 = require("../middleware/auth.js");
const router = (0, express_1.Router)();
// Protect all donation routes
router.use(auth_js_1.authenticate);
router.post('/', donationController_js_1.createDonation);
router.patch('/:id/complete', donationController_js_1.completeDonation);
router.get('/history', donationController_js_1.getDonationHistory);
exports.default = router;
