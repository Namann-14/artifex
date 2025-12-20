import { Router } from 'express';
import { 
  generateVideo, 
  getVideoStatus, 
  generateVideoSync,
  generateVideoAsync,
  getVideoJobStatus
} from '../controllers/videoGeneration';
import { requireAuthentication } from '../middleware/auth';
import { checkQuota } from '../middleware/quota';

const router = Router();

/**
 * POST /api/v1/video/generate
 * Generate video from image (async - returns task_id immediately)
 */
router.post('/generate', requireAuthentication, checkQuota(), generateVideo);

/**
 * GET /api/v1/video/status/:taskId
 * Get video generation status and download URL
 */
router.get('/status/:taskId', requireAuthentication, getVideoStatus);

/**
 * POST /api/v1/video/generate-sync
 * Generate video from image (sync - waits for completion)
 */
router.post('/generate-sync', requireAuthentication, checkQuota(), generateVideoSync);

/**
 * POST /api/v1/video/generate-async
 * Generate video using Redis job queue (returns jobId immediately)
 */
router.post('/generate-async', requireAuthentication, checkQuota(), generateVideoAsync);

/**
 * GET /api/v1/video/job/:jobId/status
 * Get video generation job status from Redis queue
 */
router.get('/job/:jobId/status', requireAuthentication, getVideoJobStatus);

export default router;
