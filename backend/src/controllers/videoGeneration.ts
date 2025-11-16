import { Request, Response } from 'express';
import { videoGenerationService } from '../services/videoGenerationService';
import { logger } from '../utils/logger';
import { asyncHandler } from '../utils/asyncHandler';

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
