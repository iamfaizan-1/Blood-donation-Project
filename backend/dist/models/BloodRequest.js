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
exports.BloodRequest = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const BloodRequestSchema = new mongoose_1.Schema({
    requesterId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Requester ID is required'],
    },
    patientName: {
        type: String,
        required: [true, 'Patient name is required'],
        trim: true,
    },
    bloodGroup: {
        type: String,
        required: [true, 'Blood group is required'],
        enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    },
    unitsRequired: {
        type: Number,
        required: [true, 'Units required is mandatory'],
        min: [1, 'At least 1 unit must be requested'],
    },
    hospitalName: {
        type: String,
        required: [true, 'Hospital name is required'],
        trim: true,
    },
    hospitalLocation: {
        address: { type: String, default: '' },
        latitude: { type: Number, default: 0 },
        longitude: { type: Number, default: 0 },
    },
    urgency: {
        type: String,
        enum: ['critical', 'urgent', 'normal'],
        default: 'normal',
    },
    requiredDateTime: {
        type: Date,
    },
    contactNumber: {
        type: String,
        required: [true, 'Contact phone number is required'],
        trim: true,
    },
    notes: {
        type: String,
        trim: true,
    },
    status: {
        type: String,
        enum: [
            'pending',
            'matching',
            'donor_found',
            'donor_accepted',
            'contact_established',
            'on_the_way',
            'active',
            'fulfilled',
            'closed',
            'cancelled',
            'expired',
        ],
        default: 'pending',
    },
    statusHistory: [
        {
            status: { type: String, required: true },
            timestamp: { type: Date, default: Date.now },
            updatedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
        },
    ],
    acceptedDonorId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    },
    searchRadiusKm: {
        type: Number,
        default: 10,
    },
}, {
    timestamps: true,
});
exports.BloodRequest = mongoose_1.default.model('BloodRequest', BloodRequestSchema);
