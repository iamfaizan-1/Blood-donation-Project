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
exports.UserReport = exports.UserBlock = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const UserBlockSchema = new mongoose_1.Schema({
    blockerId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    blockedId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
}, {
    timestamps: true,
});
// Prevent duplicate blocks
UserBlockSchema.index({ blockerId: 1, blockedId: 1 }, { unique: true });
exports.UserBlock = mongoose_1.default.model('UserBlock', UserBlockSchema);
const UserReportSchema = new mongoose_1.Schema({
    reporterId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    reportedId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    requestId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'BloodRequest',
    },
    reason: {
        type: String,
        required: true,
        enum: [
            'harassment',
            'inappropriate_behavior',
            'no_show',
            'fraud_or_scam',
            'safety_concern',
            'other',
        ],
    },
    details: {
        type: String,
        trim: true,
        maxlength: [1000, 'Report details cannot exceed 1000 characters'],
    },
    status: {
        type: String,
        enum: ['pending', 'reviewed', 'action_taken', 'dismissed'],
        default: 'pending',
    },
}, {
    timestamps: true,
});
exports.UserReport = mongoose_1.default.model('UserReport', UserReportSchema);
