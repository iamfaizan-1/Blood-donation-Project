"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const authRoutes_js_1 = __importDefault(require("./routes/authRoutes.js"));
const userRoutes_js_1 = __importDefault(require("./routes/userRoutes.js"));
const requestRoutes_js_1 = __importDefault(require("./routes/requestRoutes.js"));
const donationRoutes_js_1 = __importDefault(require("./routes/donationRoutes.js"));
const donorWorkflowRoutes_js_1 = __importDefault(require("./routes/donorWorkflowRoutes.js"));
const communicationRoutes_js_1 = __importDefault(require("./routes/communicationRoutes.js"));
const analyticsRoutes_js_1 = __importDefault(require("./routes/analyticsRoutes.js"));
const chatbotRoutes_js_1 = __importDefault(require("./routes/chatbotRoutes.js"));
const errorHandler_js_1 = require("./middleware/errorHandler.js");
const appError_js_1 = require("./utils/appError.js");
const env_js_1 = require("./config/env.js");
const app = (0, express_1.default)();
// Security Middlewares
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: true,
    credentials: true,
}));
// Logging Middleware
if (env_js_1.config.nodeEnv === 'development') {
    app.use((0, morgan_1.default)('dev'));
}
// Body Parsing Middlewares
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Health Check API
app.get('/health', (_req, res) => {
    res.status(200).json({
        status: 'online',
        timestamp: new Date().toISOString(),
        service: 'Blood Donation REST API',
    });
});
// API Routes
app.use('/api/auth', authRoutes_js_1.default);
app.use('/api/users', userRoutes_js_1.default);
app.use('/api/requests', requestRoutes_js_1.default);
app.use('/api/donations', donationRoutes_js_1.default);
app.use('/api/donor-workflow', donorWorkflowRoutes_js_1.default);
app.use('/api/communication', communicationRoutes_js_1.default);
app.use('/api/analytics', analyticsRoutes_js_1.default);
app.use('/api/chatbot', chatbotRoutes_js_1.default);
// Handle 404 Undefined Routes
app.all('*', (req, _res, next) => {
    next(new appError_js_1.AppError(`Cannot find ${req.originalUrl} on this server!`, 404));
});
// Global Error Handler
app.use(errorHandler_js_1.globalErrorHandler);
exports.default = app;
