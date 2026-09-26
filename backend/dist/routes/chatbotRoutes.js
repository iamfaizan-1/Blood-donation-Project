"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const chatbotController_js_1 = require("../controllers/chatbotController.js");
const auth_js_1 = require("../middleware/auth.js");
const router = (0, express_1.Router)();
router.use(auth_js_1.authenticate);
// POST /api/chatbot/ask -> { message: string } => { intent, reply }
router.post('/ask', chatbotController_js_1.askChatbot);
exports.default = router;
