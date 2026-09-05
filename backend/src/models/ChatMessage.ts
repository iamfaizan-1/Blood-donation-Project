import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type MessageType = 'text' | 'location';

export interface ILocationData {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface IChatMessage {
  requestId: Types.ObjectId;
  senderId: Types.ObjectId;
  receiverId: Types.ObjectId;
  message: string;
  messageType: MessageType;
  locationData?: ILocationData;
  createdAt: Date;
}

export interface IChatMessageDocument extends IChatMessage, Document {}

const ChatMessageSchema = new Schema<IChatMessageDocument>(
  {
    requestId: {
      type: Schema.Types.ObjectId,
      ref: 'BloodRequest',
      required: [true, 'Request ID is required for chat messages'],
      index: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Sender ID is required'],
      index: true,
    },
    receiverId: {
      type: Schema.Types.ObjectId,
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
  },
  {
    timestamps: true,
  }
);

// Compound index for querying chat history efficiently
ChatMessageSchema.index({ requestId: 1, createdAt: 1 });

export const ChatMessage: Model<IChatMessageDocument> = mongoose.model<IChatMessageDocument>(
  'ChatMessage',
  ChatMessageSchema
);
