"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = void 0;
const dns_1 = __importDefault(require("dns"));
const mongoose_1 = __importDefault(require("mongoose"));
const env_js_1 = require("./env.js");
// Configure public DNS servers to resolve MongoDB Atlas SRV records reliably on Windows
try {
    dns_1.default.setServers(['8.8.8.8', '1.1.1.1']);
}
catch {
    // Ignore if not permitted
}
const connectDB = async () => {
    try {
        const conn = await mongoose_1.default.connect(env_js_1.config.mongoUri);
        console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
    }
    catch (error) {
        console.error(`[Database Error] Connection failed: ${error.message}`);
        process.exit(1);
    }
};
exports.connectDB = connectDB;
