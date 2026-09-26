import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import requestRoutes from './routes/requestRoutes.js';
import donationRoutes from './routes/donationRoutes.js';
import donorWorkflowRoutes from './routes/donorWorkflowRoutes.js';
import communicationRoutes from './routes/communicationRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import chatbotRoutes from './routes/chatbotRoutes.js';
import { globalErrorHandler } from './middleware/errorHandler.js';
import { AppError } from './utils/appError.js';
import { config } from './config/env.js';

const app: Application = express();

// Security Middlewares
app.use(helmet());
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

// Logging Middleware
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
}

// Body Parsing Middlewares
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check API
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'Blood Donation REST API',
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/donor-workflow', donorWorkflowRoutes);
app.use('/api/communication', communicationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/chatbot', chatbotRoutes);

// Handle 404 Undefined Routes
app.all('*', (req: Request, _res: Response, next) => {
  next(new AppError(`Cannot find ${req.originalUrl} on this server!`, 404));
});

// Global Error Handler
app.use(globalErrorHandler);

export default app;
