"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatMessage = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const ChatMessageSchema = new mongoose_1.Schema({
    requestId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'BloodRequest',
        required: [true, 'Request ID is required for chat messages'],
        index: true,
    },
    senderId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Sender ID is required'],
        index: true,
    },
    receiverId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Receiver ID is required'],
        index: true,
    },
    message: {
        type: String,
        required: [true, 'Message text is required'],
        trim: true,
        maxlength: [2000, 'Message cannot exceed 2000 characters'],
    },
    messageType: {
        type: String,
        enum: ['text', 'location'],
        default: 'text',
    },
    locationData: {
        latitude: { type: Number },
        longitude: { type: Number },
        address: { type: String },
    },
}, {
    timestamps: true,
});
// Compound index for querying chat history efficiently
ChatMessageSchema.index({ requestId: 1, createdAt: 1 });
exports.ChatMessage = mongoose_1.default.model('ChatMessage', ChatMessageSchema);
