import { Router } from 'express';
import healthRouter from './health';
import authRouter from './auth';
import generateRouter from './generate';
import testCloudinaryRouter from './test-cloudinary';

// Create main router
const router = Router();

// Health check routes
router.use('/health', healthRouter);

// Authentication routes
router.use('/auth', authRouter);

// Image generation routes
router.use('/generate', generateRouter);

// Test routes
router.use('/test-cloudinary', testCloudinaryRouter);

// Future route modules will be mounted here
// router.use('/users', usersRouter);
// router.use('/subscriptions', subscriptionsRouter);

// API information endpoint
router.get('/', (req, res) => {
  res.json({
    message: 'Artifex API v1',
    version: '1.0.0',
    status: 'active',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/api/v1/health',
      auth: '/api/v1/auth',
      generate: '/api/v1/generate',
      // Future endpoints will be listed here
      // users: '/api/v1/users',
      // subscriptions: '/api/v1/subscriptions'
    }
  });
});

export default router;