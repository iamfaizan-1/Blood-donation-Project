"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const app_js_1 = __importDefault(require("./app.js"));
const db_js_1 = require("./config/db.js");
const env_js_1 = require("./config/env.js");
const socketService_js_1 = require("./services/socketService.js");
const User_js_1 = require("./models/User.js");
// Seed default demo donor account if not present
const seedDemoUser = async () => {
    try {
        const demoEmail = 'john.doe@healthnet.org';
        const exists = await User_js_1.User.findOne({ email: demoEmail });
        if (!exists) {
            await User_js_1.User.create({
                name: 'John Doe',
                email: demoEmail,
                password: 'secret123',
                phone: '+15552344921',
                bloodGroup: 'O+',
                isDonor: true,
                isAvailable: true,
                isVerified: true,
                location: {
                    address: '123 Health Blvd, Central District',
                    latitude: 40.7128,
                    longitude: -74.0060,
                },
            });
            console.log('✅ Demo account seeded: john.doe@healthnet.org / secret123');
        }
    }
    catch (err) {
        console.warn('Demo user seed notice:', err.message);
    }
};
const startServer = async () => {
    // Connect to MongoDB Database
    await (0, db_js_1.connectDB)();
    await seedDemoUser();
    const httpServer = http_1.default.createServer(app_js_1.default);
    // Initialize Socket.IO with real-time authentication and event handling
    socketService_js_1.SocketService.initialize(httpServer);
    const server = httpServer.listen(env_js_1.config.port, () => {
        console.log(`
===================================================
🩸 Blood Donation API & Socket.IO Server Running!
📡 Port: ${env_js_1.config.port}
🌍 Environment: ${env_js_1.config.nodeEnv}
🔗 URL: http://localhost:${env_js_1.config.port}
💬 Real-time Socket.IO: Active
===================================================
    `);
    });
    // Handle Unhandled Rejections
    process.on('unhandledRejection', (err) => {
        console.error('UNHANDLED REJECTION! 💥 Shutting down...', err.name, err.message);
        server.close(() => {
            process.exit(1);
        });
    });
};
startServer();
