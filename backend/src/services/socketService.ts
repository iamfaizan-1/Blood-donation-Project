import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { User, IUserDocument } from '../models/User.js';
import { BloodRequest } from '../models/BloodRequest.js';
import { ChatMessage } from '../models/ChatMessage.js';
import { UserBlock } from '../models/UserSafety.js';

interface AuthenticatedSocket extends Socket {
  user?: IUserDocument;
}

export class SocketService {
  private static io: Server | null = null;

  public static initialize(httpServer: HttpServer): Server {
    this.io = new Server(httpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
      pingTimeout: 30000,
      pingInterval: 10000,
    });

    // Authentication Middleware
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token =
          socket.handshake.auth?.token ||
          socket.handshake.headers?.authorization?.replace('Bearer ', '');

        if (!token) {
          return next(new Error('Authentication token required'));
        }

        const decoded = jwt.verify(token, config.jwtSecret) as { id: string };
        const user = await User.findById(decoded.id);

        if (!user) {
          return next(new Error('User not found'));
        }

        socket.user = user;
        next();
      } catch (error: any) {
        return next(new Error(`Authentication failed: ${error.message}`));
      }
    });

    // Connection Handler
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      const currentUser = socket.user!;
      console.log(`[Socket] User connected: ${currentUser.name} (${currentUser._id})`);

      // 1. Join Request Private Chat Room
      socket.on('join_chat', async ({ requestId }: { requestId: string }) => {
        try {
          if (!requestId) {
            return socket.emit('chat_error', { message: 'requestId is required' });
          }

          const request = await BloodRequest.findById(requestId)
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
              message:
                'Chat is only available once a donor has accepted this blood request.',
            });
          }

          // Rule 2: Only requester and accepted donor can access the conversation
          const currentUserId = currentUser._id.toString();
          const requesterId = (request.requesterId as any)?._id?.toString();
          const donorId = (request.acceptedDonorId as any)?._id?.toString();

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
            const isBlocked = await UserBlock.findOne({
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
            ? (request.acceptedDonorId as any)
            : (request.requesterId as any);

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
        } catch (error: any) {
          socket.emit('chat_error', { message: error.message });
        }
      });

      // 2. Send Message (Text or Location)
      socket.on(
        'send_message',
        async (data: {
          requestId: string;
          message: string;
          messageType?: 'text' | 'location';
          locationData?: { latitude: number; longitude: number; address?: string };
        }) => {
          try {
            const { requestId, message, messageType = 'text', locationData } = data;

            if (!requestId || !message) {
              return socket.emit('chat_error', { message: 'Message content is required' });
            }

            const request = await BloodRequest.findById(requestId);
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
            const isBlocked = await UserBlock.findOne({
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
            const chatMsg = await ChatMessage.create({
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
            this.io!.to(roomName).emit('new_message', payload);
          } catch (error: any) {
            socket.emit('chat_error', { message: error.message });
          }
        }
      );

      // 3. Live Active Location Sharing
      socket.on(
        'share_location',
        async (data: {
          requestId: string;
          latitude: number;
          longitude: number;
          address?: string;
        }) => {
          try {
            const { requestId, latitude, longitude, address } = data;
            const request = await BloodRequest.findById(requestId);
            if (!request) return;

            const currentUserId = currentUser._id.toString();
            const requesterId = request.requesterId.toString();
            const donorId = request.acceptedDonorId?.toString();

            if (currentUserId !== requesterId && currentUserId !== donorId) return;

            const receiverId = currentUserId === requesterId ? donorId : requesterId;
            if (!receiverId) return;

            const roomName = `request_${requestId}`;

            // Store location message
            const locMsg = await ChatMessage.create({
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

            this.io!.to(roomName).emit('new_message', payload);
            this.io!.to(roomName).emit('location_update', {
              senderId: currentUserId,
              senderRole: currentUserId === donorId ? 'donor' : 'requester',
              latitude,
              longitude,
              address,
              timestamp: new Date().toISOString(),
            });
          } catch (err: any) {
            console.error('Error sharing location via socket:', err.message);
          }
        }
      );

      // 4. Typing Indicator
      socket.on('typing', ({ requestId, isTyping }: { requestId: string; isTyping: boolean }) => {
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

  public static getIO(): Server | null {
    return this.io;
  }

  public static emitStatusUpdate(
    requestId: string,
    newStatus: string,
    updatedBy: string
  ): void {
    if (!this.io) return;
    const roomName = `request_${requestId}`;
    this.io.to(roomName).emit('status_updated', {
      requestId,
      status: newStatus,
      updatedBy,
      timestamp: new Date().toISOString(),
    });
  }
}
