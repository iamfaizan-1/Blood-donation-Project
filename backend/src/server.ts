import http from 'http';
import app from './app.js';
import { connectDB } from './config/db.js';
import { config } from './config/env.js';
import { SocketService } from './services/socketService.js';
import { User } from './models/User.js';

// Seed default demo donor account if not present
const seedDemoUser = async (): Promise<void> => {
  try {
    const demoEmail = 'john.doe@healthnet.org';
    const exists = await User.findOne({ email: demoEmail });
    if (!exists) {
      await User.create({
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
  } catch (err: any) {
    console.warn('Demo user seed notice:', err.message);
  }
};

const startServer = async (): Promise<void> => {
  // Connect to MongoDB Database
  await connectDB();
  await seedDemoUser();

  const httpServer = http.createServer(app);

  // Initialize Socket.IO with real-time authentication and event handling
  SocketService.initialize(httpServer);

  const server = httpServer.listen(config.port, () => {
    console.log(`
===================================================
🩸 Blood Donation API & Socket.IO Server Running!
📡 Port: ${config.port}
🌍 Environment: ${config.nodeEnv}
🔗 URL: http://localhost:${config.port}
💬 Real-time Socket.IO: Active
===================================================
    `);
  });

  // Handle Unhandled Rejections
  process.on('unhandledRejection', (err: Error) => {
    console.error('UNHANDLED REJECTION! 💥 Shutting down...', err.name, err.message);
    server.close(() => {
      process.exit(1);
    });
  });
};

startServer();
