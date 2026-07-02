import express, { Request, Response, NextFunction } from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import cookieParser from "cookie-parser";
import authRoutes from './routes/auth.routes';
import zaloRoutes from './routes/zalo.routes';
import conversationRoutes from './routes/conversation.routes';
import customerRoutes from './routes/customer.routes';
import cannedResponseRoutes from './routes/cannedResponse.routes';
import aiRoutes from './routes/ai.routes';
import knowledgeRoutes from './routes/knowledge.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

const httpServer = createServer(app);
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    callback(null, true); // Allow all origins dynamically
  },
  credentials: true,
};

const io = new Server(httpServer, {
  cors: corsOptions
});
app.set('io', io);

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

app.use(cookieParser());
app.use(helmet());
app.use(cors(corsOptions));

app.use(express.json());

// Phục vụ các file tĩnh trong thư mục public (dùng để xác thực domain Zalo)
app.use(express.static(path.join(__dirname, '../public')));

// API Response Wrapper Middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const originalJson = res.json;
  res.json = function (body) {
    if (body && typeof body === 'object' && ('success' in body)) {
      return originalJson.call(this, body);
    }
    return originalJson.call(this, {
      success: true,
      data: body,
    });
  };
  next();
});

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/zalo', zaloRoutes);
app.use('/api/v1/conversations', conversationRoutes);
app.use('/api/v1/customers', customerRoutes);
app.use('/api/v1/canned-responses', cannedResponseRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/knowledge', knowledgeRoutes);

// Mock Routes (For testing without Zalo OA)
import mockRoutes from './mock-zalo/mock.routes';
app.use('/api/v1/mock-zalo', mockRoutes);

// Error Handling Middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

import { startZaloTokenRefreshJob } from './utils/zalo-refresh';

httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  startZaloTokenRefreshJob();
});
