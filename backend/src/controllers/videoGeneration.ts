import { Request, Response } from 'express';
import { videoGenerationService } from '../services/videoGenerationService';
import { logger } from '../utils/logger';
import { asyncHandler } from '../utils/asyncHandler';
import { addVideoGenerationJob, getJobStatus } from '../services/jobQueue';
import { v4 as uuidv4 } from 'uuid';

/**
 * Generate video from image
 */
export const generateVideo = asyncHandler(async (req: Request, res: Response) => {
  const { image, prompt, negative_prompt, duration, cfg_scale, webhook_url } = req.body;

  if (!image) {
    return res.status(400).json({
      success: false,
      error: 'Image is required',
    });
  }

  if (!prompt) {
    return res.status(400).json({
      success: false,
      error: 'Prompt is required',
    });
  }

  try {
    const result = await videoGenerationService.generateVideo({
      image,
      prompt,
      negative_prompt,
      duration: duration || '5',
      cfg_scale: cfg_scale || 0.5,
      webhook_url,
    });

    return res.status(200).json({
      success: true,
      data: {
        task_id: result.data.task_id,
        status: result.data.status,
        message: 'Video generation initiated. Use the task_id to check status.',
      },
    });
  } catch (error) {
    logger.error('Video generation failed', { error });
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Video generation failed',
    });
  }
});

/**
 * Get video generation status
 */
export const getVideoStatus = asyncHandler(async (req: Request, res: Response) => {
  const { taskId } = req.params;

  if (!taskId) {
    return res.status(400).json({
      success: false,
      error: 'Task ID is required',
    });
  }

  try {
    const result = await videoGenerationService.getVideoStatus(taskId);

    return res.status(200).json({
      success: true,
      data: {
        task_id: result.data.task_id,
        status: result.data.status,
        video_url: result.data.generated ? result.data.generated[0] : null,
        generated: result.data.generated || [],
      },
    });
  } catch (error) {
    logger.error('Failed to get video status', { error, taskId });
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get video status',
    });
  }
});

/**
 * Generate video and wait for completion (synchronous endpoint)
 */
export const generateVideoSync = asyncHandler(async (req: Request, res: Response) => {
  const { image, prompt, negative_prompt, duration, cfg_scale } = req.body;

  if (!image) {
    return res.status(400).json({
      success: false,
      error: 'Image is required',
    });
  }

  if (!prompt) {
    return res.status(400).json({
      success: false,
      error: 'Prompt is required',
    });
  }

  try {
    // Initiate video generation
    const initResult = await videoGenerationService.generateVideo({
      image,
      prompt,
      negative_prompt,
      duration: duration || '5',
      cfg_scale: cfg_scale || 0.5,
    });

    const taskId = initResult.data.task_id;

    // Wait for completion (max 5 minutes)
    const result = await videoGenerationService.waitForVideoCompletion(taskId, 60, 5000);

    return res.status(200).json({
      success: true,
      data: {
        task_id: result.data.task_id,
        status: result.data.status,
        video_url: result.data.generated ? result.data.generated[0] : null,
        generated: result.data.generated || [],
      },
    });
  } catch (error) {
    logger.error('Synchronous video generation failed', { error });
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Video generation failed',
    });
  }
});

/**
 * Generate video asynchronously (returns jobId immediately)
 * Uses Redis job queue for processing
 */
export const generateVideoAsync = asyncHandler(async (req: Request, res: Response) => {
  logger.info('Video async endpoint hit', {
    body: req.body,
    auth: (req as any).auth,
    userId: (req as any).userId
  });

  const { imageUrl, prompt, negativePrompt, duration, cfgScale } = req.body;
  const userId = (req as any).auth?.userId || (req as any).userId;
  const subscriptionTier = (req as any).subscriptionTier || 'free';

  logger.info('Extracted values', { userId, imageUrl: imageUrl?.substring(0, 50), subscriptionTier });

  if (!userId) {
    logger.error('No userId found in request');
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
  }

  if (!imageUrl) {
    logger.error('No imageUrl provided');
    return res.status(400).json({
      success: false,
      error: 'Image URL is required',
    });
  }

  try {
    const jobId = `vid-${uuidv4()}`;
    
    logger.info('Creating video job', { jobId, userId });

    // Add job to Redis queue
    await addVideoGenerationJob({
      jobId,
      userId,
      imageUrl,
      prompt,
      negativePrompt,
      duration: duration || '5',
      cfgScale: cfgScale || 0.5,
      subscriptionTier,
      createdAt: new Date(),
    });

    logger.info('Video generation job queued successfully', { jobId, userId });

    return res.status(202).json({
      success: true,
      data: {
        jobId,
        message: 'Video generation queued. Use the jobId to track progress via WebSocket.',
      },
    });
  } catch (error) {
    logger.error('Failed to queue video generation', { error, userId });
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to queue video generation',
    });
  }
});

/**
 * Get video generation job status
 */
export const getVideoJobStatus = asyncHandler(async (req: Request, res: Response) => {
  const { jobId } = req.params;
  const userId = (req as any).userId;

  if (!jobId) {
    return res.status(400).json({
      success: false,
      error: 'Job ID is required',
    });
  }

  try {
    const status = await getJobStatus(jobId, 'video');

    if (!status) {
      return res.status(404).json({
        success: false,
        error: 'Job not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: status,
    });
  } catch (error) {
    logger.error('Failed to get video job status', { error, jobId, userId });
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get job status',
    });
  }
});
