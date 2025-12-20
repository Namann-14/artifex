import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { logger } from '../utils/logger';
import { RedisCache } from '../config/redis';

/**
 * WebSocket Service using Socket.IO
 * Handles real-time communication for generation progress, notifications, and updates
 */

let io: Server | null = null;

// Store active connections by userId
const userConnections = new Map<string, Set<string>>();

/**
 * Initialize Socket.IO server
 */
export const initializeWebSocket = (httpServer: HttpServer): Server => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  io.on('connection', (socket: Socket) => {
    logger.info(`WebSocket client connected: ${socket.id}`);

    // Handle user authentication/identification
    socket.on('authenticate', async (userId: string) => {
      if (!userId) {
        logger.warn(`Socket ${socket.id} attempted to authenticate without userId`);
        return;
      }

      // Store connection
      socket.data.userId = userId;
      
      if (!userConnections.has(userId)) {
        userConnections.set(userId, new Set());
      }
      userConnections.get(userId)!.add(socket.id);

      // Join user-specific room
      socket.join(`user:${userId}`);
      
      logger.info(`Socket ${socket.id} authenticated for user ${userId}`);
      
      // Send confirmation
      socket.emit('authenticated', {
        success: true,
        userId,
        socketId: socket.id,
        timestamp: new Date().toISOString(),
      });

      // Send any cached progress updates
      await sendCachedProgress(socket, userId);
    });

    // Handle job subscription
    socket.on('subscribe:job', (jobId: string) => {
      socket.join(`job:${jobId}`);
      logger.info(`Socket ${socket.id} subscribed to job ${jobId}`);
      socket.emit('subscribed', { jobId });
    });

    // Handle job unsubscription
    socket.on('unsubscribe:job', (jobId: string) => {
      socket.leave(`job:${jobId}`);
      logger.info(`Socket ${socket.id} unsubscribed from job ${jobId}`);
      socket.emit('unsubscribed', { jobId });
    });

    // Handle request for job status
    socket.on('request:job-status', async (jobId: string) => {
      try {
        const cachedStatus = await RedisCache.get(`job:status:${jobId}`);
        if (cachedStatus) {
          socket.emit('job:status', cachedStatus);
        } else {
          socket.emit('job:status', {
            jobId,
            status: 'not-found',
            message: 'Job status not available',
          });
        }
      } catch (error) {
        logger.error(`Error fetching job status for ${jobId}:`, error);
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      const userId = socket.data.userId;
      if (userId) {
        const connections = userConnections.get(userId);
        if (connections) {
          connections.delete(socket.id);
          if (connections.size === 0) {
            userConnections.delete(userId);
          }
        }
        logger.info(`Socket ${socket.id} disconnected (user: ${userId})`);
      } else {
        logger.info(`Socket ${socket.id} disconnected`);
      }
    });

    // Handle errors
    socket.on('error', (error) => {
      logger.error(`Socket ${socket.id} error:`, error);
    });
  });

  logger.info('✅ WebSocket server initialized');
  return io;
};

/**
 * Send cached progress updates to newly connected client
 */
const sendCachedProgress = async (socket: Socket, userId: string): Promise<void> => {
  try {
    // Get recent jobs for user from cache
    const recentJobs = await RedisCache.get<string[]>(`user:${userId}:recent-jobs`);
    
    if (recentJobs && recentJobs.length > 0) {
      for (const jobId of recentJobs) {
        const cachedStatus = await RedisCache.get(`job:status:${jobId}`);
        if (cachedStatus) {
          socket.emit('generation:progress', cachedStatus);
        }
      }
    }
  } catch (error) {
    logger.error(`Error sending cached progress to user ${userId}:`, error);
  }
};

/**
 * Emit generation progress to user
 */
export const emitGenerationProgress = async (
  userId: string,
  jobId: string,
  data: {
    status: 'queued' | 'processing' | 'completed' | 'failed';
    progress: number;
    message: string;
    estimatedTime?: number;
    metadata?: any;
  }
): Promise<void> => {
  if (!io) {
    logger.warn('WebSocket server not initialized');
    return;
  }

  const payload = {
    jobId,
    userId,
    ...data,
    timestamp: new Date().toISOString(),
  };

  // Cache the progress update
  await RedisCache.set(`job:status:${jobId}`, payload, 3600); // Cache for 1 hour

  // Add to user's recent jobs list
  try {
    const recentJobs = await RedisCache.get<string[]>(`user:${userId}:recent-jobs`) || [];
    if (!recentJobs.includes(jobId)) {
      recentJobs.unshift(jobId);
      // Keep only last 10 jobs
      const trimmedJobs = recentJobs.slice(0, 10);
      await RedisCache.set(`user:${userId}:recent-jobs`, trimmedJobs, 86400); // 24 hours
    }
  } catch (error) {
    logger.error('Error updating recent jobs cache:', error);
  }

  // Emit to user's room
  io.to(`user:${userId}`).emit('generation:progress', payload);
  
  // Also emit to job-specific room
  io.to(`job:${jobId}`).emit('generation:progress', payload);

  logger.debug(`Progress update sent for job ${jobId}: ${data.progress}%`);
};

/**
 * Emit generation complete notification
 */
export const emitGenerationComplete = async (
  userId: string,
  jobId: string,
  result: any
): Promise<void> => {
  if (!io) {
    logger.warn('WebSocket server not initialized');
    return;
  }

  const payload = {
    jobId,
    userId,
    status: 'completed',
    progress: 100,
    message: 'Generation completed successfully!',
    result,
    timestamp: new Date().toISOString(),
  };

  // Cache the completed status
  await RedisCache.set(`job:status:${jobId}`, payload, 3600);

  // Emit to user's room
  io.to(`user:${userId}`).emit('generation:complete', payload);
  
  // Also emit to job-specific room
  io.to(`job:${jobId}`).emit('generation:complete', payload);

  logger.info(`Generation complete notification sent for job ${jobId}`);
};

/**
 * Emit generation error notification
 */
export const emitGenerationError = async (
  userId: string,
  jobId: string,
  error: {
    message: string;
    code: string;
    details?: any;
  }
): Promise<void> => {
  if (!io) {
    logger.warn('WebSocket server not initialized');
    return;
  }

  const payload = {
    jobId,
    userId,
    status: 'failed',
    progress: 0,
    message: error.message,
    error,
    timestamp: new Date().toISOString(),
  };

  // Cache the error status
  await RedisCache.set(`job:status:${jobId}`, payload, 3600);

  // Emit to user's room
  io.to(`user:${userId}`).emit('generation:error', payload);
  
  // Also emit to job-specific room
  io.to(`job:${jobId}`).emit('generation:error', payload);

  logger.error(`Generation error notification sent for job ${jobId}: ${error.message}`);
};

/**
 * Emit quota update notification
 */
export const emitQuotaUpdate = (
  userId: string,
  quotaData: {
    remaining: number;
    used: number;
    limit: number;
    resetDate: string;
  }
): void => {
  if (!io) {
    logger.warn('WebSocket server not initialized');
    return;
  }

  io.to(`user:${userId}`).emit('quota:update', {
    userId,
    ...quotaData,
    timestamp: new Date().toISOString(),
  });

  logger.debug(`Quota update sent to user ${userId}`);
};

/**
 * Emit subscription update notification
 */
export const emitSubscriptionUpdate = (
  userId: string,
  subscriptionData: {
    tier: string;
    status: string;
    features: string[];
  }
): void => {
  if (!io) {
    logger.warn('WebSocket server not initialized');
    return;
  }

  io.to(`user:${userId}`).emit('subscription:update', {
    userId,
    ...subscriptionData,
    timestamp: new Date().toISOString(),
  });

  logger.info(`Subscription update sent to user ${userId}`);
};

/**
 * Broadcast system notification to all connected users
 */
export const broadcastSystemNotification = (
  notification: {
    type: 'info' | 'warning' | 'error' | 'maintenance';
    title: string;
    message: string;
    action?: {
      label: string;
      url: string;
    };
  }
): void => {
  if (!io) {
    logger.warn('WebSocket server not initialized');
    return;
  }

  io.emit('system:notification', {
    ...notification,
    timestamp: new Date().toISOString(),
  });

  logger.info(`System notification broadcast: ${notification.title}`);
};

/**
 * Get connected users count
 */
export const getConnectedUsersCount = (): number => {
  return userConnections.size;
};

/**
 * Get active connections count
 */
export const getActiveConnectionsCount = (): number => {
  if (!io) return 0;
  return io.sockets.sockets.size;
};

/**
 * Check if user is connected
 */
export const isUserConnected = (userId: string): boolean => {
  return userConnections.has(userId) && userConnections.get(userId)!.size > 0;
};

/**
 * Get WebSocket server instance
 */
export const getWebSocketServer = (): Server | null => {
  return io;
};

/**
 * Close WebSocket server
 */
export const closeWebSocket = async (): Promise<void> => {
  if (io) {
    await new Promise<void>((resolve) => {
      io!.close(() => {
        logger.info('✅ WebSocket server closed');
        resolve();
      });
    });
    io = null;
    userConnections.clear();
  }
};

export default {
  initializeWebSocket,
  emitGenerationProgress,
  emitGenerationComplete,
  emitGenerationError,
  emitQuotaUpdate,
  emitSubscriptionUpdate,
  broadcastSystemNotification,
  getConnectedUsersCount,
  getActiveConnectionsCount,
  isUserConnected,
  getWebSocketServer,
  closeWebSocket,
};
