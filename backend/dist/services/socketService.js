"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketService = void 0;
const socket_io_1 = require("socket.io");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_js_1 = require("../config/env.js");
const User_js_1 = require("../models/User.js");
const BloodRequest_js_1 = require("../models/BloodRequest.js");
const ChatMessage_js_1 = require("../models/ChatMessage.js");
const UserSafety_js_1 = require("../models/UserSafety.js");
class SocketService {
    static io = null;
    static initialize(httpServer) {
        this.io = new socket_io_1.Server(httpServer, {
            cors: {
                origin: '*',
                methods: ['GET', 'POST'],
            },
            pingTimeout: 30000,
            pingInterval: 10000,
        });
        // Authentication Middleware
        this.io.use(async (socket, next) => {
            try {
                const token = socket.handshake.auth?.token ||
                    socket.handshake.headers?.authorization?.replace('Bearer ', '');
                if (!token) {
                    return next(new Error('Authentication token required'));
                }
                const decoded = jsonwebtoken_1.default.verify(token, env_js_1.config.jwtSecret);
                const user = await User_js_1.User.findById(decoded.id);
                if (!user) {
                    return next(new Error('User not found'));
                }
                socket.user = user;
                next();
            }
            catch (error) {
                return next(new Error(`Authentication failed: ${error.message}`));
            }
        });
        // Connection Handler
        this.io.on('connection', (socket) => {
            const currentUser = socket.user;
            console.log(`[Socket] User connected: ${currentUser.name} (${currentUser._id})`);
            // 1. Join Request Private Chat Room
            socket.on('join_chat', async ({ requestId }) => {
                try {
                    if (!requestId) {
                        return socket.emit('chat_error', { message: 'requestId is required' });
                    }
                    const request = await BloodRequest_js_1.BloodRequest.findById(requestId)
                        .populate('requesterId', 'name phone bloodGroup')
                        .populate('acceptedDonorId', 'name phone bloodGroup');
                    if (!request) {
                        return socket.emit('chat_error', { message: 'Blood request not found' });
                    }
                    // Rule 1: Only allow communication after a donor accepts a blood request
                    const allowedStatuses = [
                        'donor_accepted',
                        'contact_established',
                        'on_the_way',
                        'fulfilled',
                        'closed',
                    ];
                    if (!allowedStatuses.includes(request.status)) {
                        return socket.emit('chat_error', {
                            message: 'Chat is only available once a donor has accepted this blood request.',
                        });
                    }
                    // Rule 2: Only requester and accepted donor can access the conversation
                    const currentUserId = currentUser._id.toString();
                    const requesterId = request.requesterId?._id?.toString();
                    const donorId = request.acceptedDonorId?._id?.toString();
                    const isRequester = currentUserId === requesterId;
                    const isDonor = currentUserId === donorId;
                    if (!isRequester && !isDonor) {
                        return socket.emit('chat_error', {
                            message: 'Unauthorized: You are not a participant in this blood request.',
                        });
                    }
                    const partnerId = isRequester ? donorId : requesterId;
                    // Rule 3: Check if blocked
                    if (partnerId) {
                        const isBlocked = await UserSafety_js_1.UserBlock.findOne({
                            $or: [
                                { blockerId: currentUserId, blockedId: partnerId },
                                { blockerId: partnerId, blockedId: currentUserId },
                            ],
                        });
                        if (isBlocked) {
                            return socket.emit('chat_error', {
                                message: 'Communication is unavailable because a user has been blocked.',
                                isBlocked: true,
                            });
                        }
                    }
                    const roomName = `request_${requestId}`;
                    socket.join(roomName);
                    const partnerUser = isRequester
                        ? request.acceptedDonorId
                        : request.requesterId;
                    socket.emit('joined_chat', {
                        requestId,
                        role: isRequester ? 'requester' : 'donor',
                        partner: {
                            id: partnerUser?._id,
                            name: partnerUser?.name || 'User',
                            bloodGroup: partnerUser?.bloodGroup,
                        },
                    });
                    console.log(`[Socket] User ${currentUser.name} joined private room ${roomName}`);
                }
                catch (error) {
                    socket.emit('chat_error', { message: error.message });
                }
            });
            // 2. Send Message (Text or Location)
            socket.on('send_message', async (data) => {
                try {
                    const { requestId, message, messageType = 'text', locationData } = data;
                    if (!requestId || !message) {
                        return socket.emit('chat_error', { message: 'Message content is required' });
                    }
                    const request = await BloodRequest_js_1.BloodRequest.findById(requestId);
                    if (!request) {
                        return socket.emit('chat_error', { message: 'Blood request not found' });
                    }
                    const currentUserId = currentUser._id.toString();
                    const requesterId = request.requesterId.toString();
                    const donorId = request.acceptedDonorId?.toString();
                    if (currentUserId !== requesterId && currentUserId !== donorId) {
                        return socket.emit('chat_error', { message: 'Unauthorized sender' });
                    }
                    const receiverId = currentUserId === requesterId ? donorId : requesterId;
                    if (!receiverId) {
                        return socket.emit('chat_error', { message: 'No accepted donor on this request' });
                    }
                    // Check block status
                    const isBlocked = await UserSafety_js_1.UserBlock.findOne({
                        $or: [
                            { blockerId: currentUserId, blockedId: receiverId },
                            { blockerId: receiverId, blockedId: currentUserId },
                        ],
                    });
                    if (isBlocked) {
                        return socket.emit('chat_error', {
                            message: 'Cannot send message: conversation is blocked.',
                            isBlocked: true,
                        });
                    }
                    // Persist message to database
                    const chatMsg = await ChatMessage_js_1.ChatMessage.create({
                        requestId: request._id,
                        senderId: currentUser._id,
                        receiverId,
                        message,
                        messageType,
                        locationData,
                    });
                    const payload = {
                        _id: chatMsg._id.toString(),
                        requestId,
                        senderId: currentUserId,
                        senderName: currentUser.name,
                        message: chatMsg.message,
                        messageType: chatMsg.messageType,
                        locationData: chatMsg.locationData,
                        createdAt: chatMsg.createdAt.toISOString(),
                    };
                    const roomName = `request_${requestId}`;
                    this.io.to(roomName).emit('new_message', payload);
                }
                catch (error) {
                    socket.emit('chat_error', { message: error.message });
                }
            });
            // 3. Live Active Location Sharing
            socket.on('share_location', async (data) => {
                try {
                    const { requestId, latitude, longitude, address } = data;
                    const request = await BloodRequest_js_1.BloodRequest.findById(requestId);
                    if (!request)
                        return;
                    const currentUserId = currentUser._id.toString();
                    const requesterId = request.requesterId.toString();
                    const donorId = request.acceptedDonorId?.toString();
                    if (currentUserId !== requesterId && currentUserId !== donorId)
                        return;
                    const receiverId = currentUserId === requesterId ? donorId : requesterId;
                    if (!receiverId)
                        return;
                    const roomName = `request_${requestId}`;
                    // Store location message
                    const locMsg = await ChatMessage_js_1.ChatMessage.create({
                        requestId: request._id,
                        senderId: currentUser._id,
                        receiverId,
                        message: address || `📍 Live coordinates: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
                        messageType: 'location',
                        locationData: { latitude, longitude, address },
                    });
                    const payload = {
                        _id: locMsg._id.toString(),
                        requestId,
                        senderId: currentUserId,
                        senderName: currentUser.name,
                        message: locMsg.message,
                        messageType: 'location',
                        locationData: { latitude, longitude, address },
                        createdAt: locMsg.createdAt.toISOString(),
                    };
                    this.io.to(roomName).emit('new_message', payload);
                    this.io.to(roomName).emit('location_update', {
                        senderId: currentUserId,
                        senderRole: currentUserId === donorId ? 'donor' : 'requester',
                        latitude,
                        longitude,
                        address,
                        timestamp: new Date().toISOString(),
                    });
                }
                catch (err) {
                    console.error('Error sharing location via socket:', err.message);
                }
            });
            // 4. Typing Indicator
            socket.on('typing', ({ requestId, isTyping }) => {
                const roomName = `request_${requestId}`;
                socket.to(roomName).emit('partner_typing', {
                    userId: currentUser._id.toString(),
                    userName: currentUser.name,
                    isTyping,
                });
            });
            // Disconnect
            socket.on('disconnect', () => {
                console.log(`[Socket] User disconnected: ${currentUser.name}`);
            });
        });
        return this.io;
    }
    static getIO() {
        return this.io;
    }
    static emitStatusUpdate(requestId, newStatus, updatedBy) {
        if (!this.io)
            return;
        const roomName = `request_${requestId}`;
        this.io.to(roomName).emit('status_updated', {
            requestId,
            status: newStatus,
            updatedBy,
            timestamp: new Date().toISOString(),
        });
    }
}
exports.SocketService = SocketService;
