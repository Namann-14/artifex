import { Router } from 'express';
import { generateVideo, getVideoStatus, generateVideoSync } from '../controllers/videoGeneration';
import { requireAuthentication } from '../middleware/auth';
import { checkQuota } from '../middleware/quota';

const router = Router();

/**
 * POST /api/v1/video/generate
 * Generate video from image (async - returns task_id immediately)
 */
router.post('/generate', requireAuthentication, checkQuota, generateVideo);

/**
 * GET /api/v1/video/status/:taskId
 * Get video generation status and download URL
 */
router.get('/status/:taskId', requireAuthentication, getVideoStatus);

/**
 * POST /api/v1/video/generate-sync
 * Generate video from image (sync - waits for completion)
 */
router.post('/generate-sync', requireAuthentication, checkQuota, generateVideoSync);

export default router;
