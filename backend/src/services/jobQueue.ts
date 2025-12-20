import Bull, { Queue, Job, JobOptions } from 'bull';
import { redisClient } from '../config/redis';
import { logger } from '../utils/logger';

/**
 * Job Queue Service using Bull
 * Manages background jobs for image and video generation with progress tracking
 */

// Lazy load websocket service to avoid circular dependency
let websocketService: any;
const getWebsocketService = async () => {
  if (!websocketService) {
    websocketService = await import('./websocketService');
  }
  return websocketService;
};

// Job data interfaces
export interface ImageGenerationJobData {
  jobId: string;
  userId: string;
  type: 'text-to-image' | 'image-to-image' | 'multi-image-composition' | 'refine-image';
  prompt: string;
  parameters: {
    aspectRatio?: string;
    style?: string;
    quality?: string;
    negativePrompt?: string;
    seed?: number;
    transformationType?: string;
    strength?: number;
    refinementType?: string;
    adjustments?: any;
    preserveAspectRatio?: boolean;
    compositionType?: string;
    layout?: string;
  };
  inputData?: {
    imageBuffer?: Buffer;
    imageType?: string;
    imagePath?: string;
    inputImages?: Array<{
      data: Buffer;
      type: string;
      description?: string;
    }>;
  };
  subscriptionTier: string;
  createdAt: Date;
}

export interface VideoGenerationJobData {
  jobId: string;
  userId: string;
  imageUrl: string;
  prompt?: string;
  negativePrompt?: string;
  duration?: '5' | '10';
  cfgScale?: number;
  subscriptionTier: string;
  createdAt: Date;
}

// Redis connection configuration for Bull
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
};

// Create queues
export const imageGenerationQueue: Queue<ImageGenerationJobData> = new Bull('image-generation', {
  redis: redisConfig,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: 100, // Keep last 100 completed jobs
    removeOnFail: 200, // Keep last 200 failed jobs
  },
});

export const videoGenerationQueue: Queue<VideoGenerationJobData> = new Bull('video-generation', {
  redis: redisConfig,
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: 50,
    removeOnFail: 100,
  },
});

/**
 * Initialize queue event handlers
 */
export const initializeQueues = () => {
  // Image generation queue events
  imageGenerationQueue.on('active', async (job: Job<ImageGenerationJobData>) => {
    logger.info(`Image generation job ${job.id} started`, {
      userId: job.data.userId,
      type: job.data.type,
    });
    const ws = await getWebsocketService();
    ws.emitGenerationProgress(job.data.userId, job.data.jobId, {
      status: 'processing',
      progress: 10,
      message: 'Starting image generation...',
    });
  });

  imageGenerationQueue.on('progress', async (job: Job<ImageGenerationJobData>, progress: number) => {
    logger.info(`Image generation job ${job.id} progress: ${progress}%`);
    const ws = await getWebsocketService();
    ws.emitGenerationProgress(job.data.userId, job.data.jobId, {
      status: 'processing',
      progress,
      message: `Generating image... ${progress}%`,
    });
  });

  imageGenerationQueue.on('completed', async (job: Job<ImageGenerationJobData>, result: any) => {
    logger.info(`Image generation job ${job.id} completed`, {
      userId: job.data.userId,
    });
    const ws = await getWebsocketService();
    ws.emitGenerationComplete(job.data.userId, job.data.jobId, result);
  });

  imageGenerationQueue.on('failed', async (job: Job<ImageGenerationJobData>, error: Error) => {
    logger.error(`Image generation job ${job.id} failed`, {
      userId: job.data.userId,
      error: error.message,
    });
    const ws = await getWebsocketService();
    ws.emitGenerationError(job.data.userId, job.data.jobId, {
      message: error.message,
      code: 'GENERATION_FAILED',
    });
  });

  imageGenerationQueue.on('stalled', (job: Job<ImageGenerationJobData>) => {
    logger.warn(`Image generation job ${job.id} stalled`, {
      userId: job.data.userId,
    });
  });

  // Video generation queue events
  videoGenerationQueue.on('active', async (job: Job<VideoGenerationJobData>) => {
    logger.info(`Video generation job ${job.id} started`, {
      userId: job.data.userId,
    });
    const ws = await getWebsocketService();
    ws.emitGenerationProgress(job.data.userId, job.data.jobId, {
      status: 'processing',
      progress: 5,
      message: 'Initiating video generation...',
    });
  });

  videoGenerationQueue.on('progress', async (job: Job<VideoGenerationJobData>, progress: number) => {
    logger.info(`Video generation job ${job.id} progress: ${progress}%`);
    const ws = await getWebsocketService();
    ws.emitGenerationProgress(job.data.userId, job.data.jobId, {
      status: 'processing',
      progress,
      message: `Generating video... ${progress}%`,
    });
  });

  videoGenerationQueue.on('completed', async (job: Job<VideoGenerationJobData>, result: any) => {
    logger.info(`Video generation job ${job.id} completed`, {
      userId: job.data.userId,
    });
    const ws = await getWebsocketService();
    ws.emitGenerationComplete(job.data.userId, job.data.jobId, result);
  });

  videoGenerationQueue.on('failed', async (job: Job<VideoGenerationJobData>, error: Error) => {
    logger.error(`Video generation job ${job.id} failed`, {
      userId: job.data.userId,
      error: error.message,
    });
    const ws = await getWebsocketService();
    ws.emitGenerationError(job.data.userId, job.data.jobId, {
      message: error.message,
      code: 'VIDEO_GENERATION_FAILED',
    });
  });

  logger.info('✅ Job queues initialized');
};

/**
 * Set up job processors
 */
export const setupProcessors = () => {
  // Image generation processor
  imageGenerationQueue.process(async (job: Job<ImageGenerationJobData>) => {
    const { jobId, userId } = job.data;
    
    try {
      logger.info(`Processing image generation job ${jobId}`);
      
      // Update progress
      await job.progress(20);
      
      // TODO: Integrate with ImageGenerationOrchestrator when ready
      // For now, simulate the work to demonstrate WebSocket/Redis functionality
      logger.info(`Simulating image generation for ${jobId}`);
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      await job.progress(50);
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      await job.progress(80);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      await job.progress(100);
      
      // Return mock result - integrate with actual generation later
      return {
        imageUrl: 'https://via.placeholder.com/512x512.png?text=Generated+Image',
        metadata: { jobId, timestamp: new Date() }
      };
      
    } catch (error) {
      logger.error(`Image generation job ${jobId} failed`, error);
      throw error;
    }
  });

  // Video generation processor
  videoGenerationQueue.process(async (job: Job<VideoGenerationJobData>) => {
    const { jobId, userId, imageUrl, prompt, negativePrompt, duration, cfgScale } = job.data;
    
    try {
      logger.info(`Processing video generation job ${jobId}`);
      
      // Import service dynamically
      const { videoGenerationService } = await import('./videoGenerationService');
      
      // Update progress
      await job.progress(10);
      
      // Initiate video generation with Freepik API
      const initResult = await videoGenerationService.generateVideo({
        image: imageUrl,
        prompt: prompt || 'animate this image',
        negative_prompt: negativePrompt,
        duration: duration || '5',
        cfg_scale: cfgScale || 0.5,
      });
      
      const taskId = initResult.data.task_id;
      logger.info(`Video task ${taskId} created for job ${jobId}`);
      
      await job.progress(30);
      
      // Poll for completion
      const result = await videoGenerationService.waitForVideoCompletion(taskId, 60, 5000);
      
      await job.progress(90);
      
      const videoUrl = result.data.generated?.[0];
      
      if (!videoUrl) {
        throw new Error('No video URL returned from API');
      }
      
      await job.progress(100);
      
      return {
        videoUrl,
        taskId,
        status: result.data.status,
        metadata: { jobId, timestamp: new Date() }
      };
      
    } catch (error) {
      logger.error(`Video generation job ${jobId} failed`, error);
      throw error;
    }
  });
  
  logger.info('✅ Job processors initialized');
};

/**
 * Add image generation job to queue
 */
export const addImageGenerationJob = async (
  data: ImageGenerationJobData,
  options?: JobOptions
): Promise<Job<ImageGenerationJobData>> => {
  try {
    const job = await imageGenerationQueue.add(data, {
      jobId: data.jobId,
      priority: data.subscriptionTier === 'pro' ? 1 : data.subscriptionTier === 'plus' ? 2 : 3,
      ...options,
    });

    logger.info(`Image generation job ${job.id} queued`, {
      userId: data.userId,
      type: data.type,
    });

    // Emit initial queued status
    const ws = await getWebsocketService();
    ws.emitGenerationProgress(data.userId, data.jobId, {
      status: 'queued',
      progress: 0,
      message: 'Job queued for processing...',
    });

    return job;
  } catch (error) {
    logger.error('Failed to queue image generation job', error);
    throw error;
  }
};

/**
 * Add video generation job to queue
 */
export const addVideoGenerationJob = async (
  data: VideoGenerationJobData,
  options?: JobOptions
): Promise<Job<VideoGenerationJobData>> => {
  try {
    const job = await videoGenerationQueue.add(data, {
      jobId: data.jobId,
      priority: data.subscriptionTier === 'pro' ? 1 : data.subscriptionTier === 'plus' ? 2 : 3,
      ...options,
    });

    logger.info(`Video generation job ${job.id} queued`, {
      userId: data.userId,
    });

    // Emit initial queued status
    const ws = await getWebsocketService();
    ws.emitGenerationProgress(data.userId, data.jobId, {
      status: 'queued',
      progress: 0,
      message: 'Video generation queued...',
    });

    return job;
  } catch (error) {
    logger.error('Failed to queue video generation job', error);
    throw error;
  }
};

/**
 * Get job status
 */
export const getJobStatus = async (
  jobId: string,
  queueType: 'image' | 'video'
): Promise<any> => {
  try {
    const queue = queueType === 'image' ? imageGenerationQueue : videoGenerationQueue;
    const job = await queue.getJob(jobId);

    if (!job) {
      return { status: 'not-found' };
    }

    const state = await job.getState();
    const progress = job.progress();
    const result = job.returnvalue;
    const failedReason = job.failedReason;

    return {
      status: state,
      progress,
      result,
      failedReason,
      createdAt: job.timestamp,
      processedAt: job.processedOn,
      finishedAt: job.finishedOn,
    };
  } catch (error) {
    logger.error(`Failed to get job status for ${jobId}`, error);
    throw error;
  }
};

/**
 * Cancel a job
 */
export const cancelJob = async (jobId: string, queueType: 'image' | 'video'): Promise<void> => {
  try {
    const queue = queueType === 'image' ? imageGenerationQueue : videoGenerationQueue;
    const job = await queue.getJob(jobId);

    if (job) {
      await job.remove();
      logger.info(`Job ${jobId} cancelled`);
    }
  } catch (error) {
    logger.error(`Failed to cancel job ${jobId}`, error);
    throw error;
  }
};

/**
 * Get queue statistics
 */
export const getQueueStats = async (queueType: 'image' | 'video'): Promise<any> => {
  try {
    const queue = queueType === 'image' ? imageGenerationQueue : videoGenerationQueue;

    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
      total: waiting + active + completed + failed + delayed,
    };
  } catch (error) {
    logger.error(`Failed to get queue stats for ${queueType}`, error);
    throw error;
  }
};

/**
 * Clean old jobs from queue
 */
export const cleanQueue = async (
  queueType: 'image' | 'video',
  grace: number = 86400000 // 24 hours in ms
): Promise<void> => {
  try {
    const queue = queueType === 'image' ? imageGenerationQueue : videoGenerationQueue;
    await queue.clean(grace, 'completed');
    await queue.clean(grace * 2, 'failed'); // Keep failed jobs longer
    logger.info(`Cleaned ${queueType} queue`);
  } catch (error) {
    logger.error(`Failed to clean ${queueType} queue`, error);
  }
};

/**
 * Pause queue
 */
export const pauseQueue = async (queueType: 'image' | 'video'): Promise<void> => {
  const queue = queueType === 'image' ? imageGenerationQueue : videoGenerationQueue;
  await queue.pause();
  logger.info(`${queueType} queue paused`);
};

/**
 * Resume queue
 */
export const resumeQueue = async (queueType: 'image' | 'video'): Promise<void> => {
  const queue = queueType === 'image' ? imageGenerationQueue : videoGenerationQueue;
  await queue.resume();
  logger.info(`${queueType} queue resumed`);
};

/**
 * Close all queues gracefully
 */
export const closeQueues = async (): Promise<void> => {
  try {
    await imageGenerationQueue.close();
    await videoGenerationQueue.close();
    logger.info('✅ Job queues closed gracefully');
  } catch (error) {
    logger.error('❌ Error closing job queues:', error);
  }
};

export default {
  imageGenerationQueue,
  videoGenerationQueue,
  initializeQueues,
  addImageGenerationJob,
  addVideoGenerationJob,
  getJobStatus,
  cancelJob,
  getQueueStats,
  cleanQueue,
  pauseQueue,
  resumeQueue,
  closeQueues,
};
