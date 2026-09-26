"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const analyticsController_js_1 = require("../controllers/analyticsController.js");
const auth_js_1 = require("../middleware/auth.js");
const router = (0, express_1.Router)();
router.use(auth_js_1.authenticate);
// GET /api/analytics/insights -> KDD data mining insights (donor clusters + demand patterns)
router.get('/insights', analyticsController_js_1.getDataMiningInsights);
exports.default = router;
