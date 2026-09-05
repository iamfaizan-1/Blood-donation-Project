import { io, Socket } from 'socket.io-client';
import apiClient from './api';
import { storage } from '../utils/storage';

const SOCKET_URL =
  (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api').replace('/api', '');

export interface ChatMessageItem {
  _id: string;
  requestId: string;
  senderId: string;
  senderName: string;
  message: string;
  messageType: 'text' | 'location';
  locationData?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  createdAt: string;
  isMe?: boolean;
}

export interface PartnerInfo {
  id: string;
  name: string;
  bloodGroup: string;
  phone?: string;
  role?: 'requester' | 'donor';
}

export type ConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'disconnected';

export class ChatService {
  private socket: Socket | null = null;
  private currentRequestId: string | null = null;
  private statusListeners: Array<(status: ConnectionStatus) => void> = [];
  private messageListeners: Array<(msg: ChatMessageItem) => void> = [];
  private errorListeners: Array<(error: { message: string; isBlocked?: boolean }) => void> = [];
  private typingListeners: Array<(data: { userId: string; userName: string; isTyping: boolean }) => void> = [];
  private locationListeners: Array<(data: any) => void> = [];
  private statusUpdateListeners: Array<(data: { requestId: string; status: string; updatedBy: string; timestamp: string }) => void> = [];

  /**
   * Connect to Socket.IO server with JWT token and join request room
   */
  public async connect(requestId: string): Promise<void> {
    this.currentRequestId = requestId;
    const token = await storage.getToken();

    if (this.socket) {
      this.socket.disconnect();
    }

    this.notifyStatus('connecting');

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    this.socket.on('connect', () => {
      this.notifyStatus('connected');
      console.log('[Socket] Connected to server, joining chat room for request:', requestId);
      this.socket?.emit('join_chat', { requestId });
    });

    this.socket.on('reconnecting', () => {
      this.notifyStatus('reconnecting');
    });

    this.socket.on('disconnect', () => {
      this.notifyStatus('disconnected');
    });

    this.socket.on('new_message', (message: ChatMessageItem) => {
      this.messageListeners.forEach((fn) => fn(message));
    });

    this.socket.on('location_update', (data: any) => {
      this.locationListeners.forEach((fn) => fn(data));
    });

    this.socket.on('partner_typing', (data: any) => {
      this.typingListeners.forEach((fn) => fn(data));
    });

    this.socket.on('chat_error', (error: { message: string; isBlocked?: boolean }) => {
      this.errorListeners.forEach((fn) => fn(error));
    });

    this.socket.on('status_updated', (data: any) => {
      this.statusUpdateListeners.forEach((fn) => fn(data));
    });
  }

  /**
   * Send a text message
   */
  public sendMessage(requestId: string, message: string): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('send_message', {
        requestId,
        message,
        messageType: 'text',
      });
    }
  }

  /**
   * Share active coordinates / location update
   */
  public shareLocation(
    requestId: string,
    latitude: number,
    longitude: number,
    address?: string
  ): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('share_location', {
        requestId,
        latitude,
        longitude,
        address,
      });
    }
  }

  /**
   * Send typing status
   */
  public sendTyping(requestId: string, isTyping: boolean): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('typing', { requestId, isTyping });
    }
  }

  /**
   * Disconnect from socket
   */
  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.currentRequestId = null;
    this.notifyStatus('disconnected');
  }

  // --- Listeners ---
  public onStatusChange(callback: (status: ConnectionStatus) => void): () => void {
    this.statusListeners.push(callback);
    return () => {
      this.statusListeners = this.statusListeners.filter((fn) => fn !== callback);
    };
  }

  public onNewMessage(callback: (msg: ChatMessageItem) => void): () => void {
    this.messageListeners.push(callback);
    return () => {
      this.messageListeners = this.messageListeners.filter((fn) => fn !== callback);
    };
  }

  public onLocationUpdate(callback: (data: any) => void): () => void {
    this.locationListeners.push(callback);
    return () => {
      this.locationListeners = this.locationListeners.filter((fn) => fn !== callback);
    };
  }

  public onPartnerTyping(callback: (data: { userId: string; userName: string; isTyping: boolean }) => void): () => void {
    this.typingListeners.push(callback);
    return () => {
      this.typingListeners = this.typingListeners.filter((fn) => fn !== callback);
    };
  }

  public onError(callback: (error: { message: string; isBlocked?: boolean }) => void): () => void {
    this.errorListeners.push(callback);
    return () => {
      this.errorListeners = this.errorListeners.filter((fn) => fn !== callback);
    };
  }

  public onStatusUpdate(
    callback: (data: { requestId: string; status: string; updatedBy: string; timestamp: string }) => void
  ): () => void {
    this.statusUpdateListeners.push(callback);
    return () => {
      this.statusUpdateListeners = this.statusUpdateListeners.filter((fn) => fn !== callback);
    };
  }

  private notifyStatus(status: ConnectionStatus): void {
    this.statusListeners.forEach((fn) => fn(status));
  }

  // --- REST Helpers ---
  public static async getHistory(requestId: string) {
    const response = await apiClient.get(`/communication/messages/${requestId}`);
    return response.data.data;
  }

  public static async getSecureContact(requestId: string) {
    const response = await apiClient.get(`/communication/contact/${requestId}`);
    return response.data.data;
  }

  public static async reportUser(data: {
    reportedId: string;
    requestId?: string;
    reason: string;
    details?: string;
  }) {
    const response = await apiClient.post('/communication/report', data);
    return response.data.data;
  }

  public static async blockUser(targetUserId: string) {
    const response = await apiClient.post('/communication/block', { targetUserId });
    return response.data.data;
  }
}

export const chatService = new ChatService();
export default chatService;
