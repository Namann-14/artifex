import axios from 'axios';
import { logger } from '../utils/logger';

interface VideoGenerationRequest {
  image: string; // URL or base64 image
  prompt: string;
  negative_prompt?: string;
  duration?: '5' | '10';
  cfg_scale?: number;
  webhook_url?: string;
}

interface VideoGenerationResponse {
  data: {
    task_id: string;
    status: string;
    generated?: string[];
  };
}

interface VideoStatusResponse {
  data: {
    task_id: string;
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
    generated?: string[];
    error?: string;
  };
}

class VideoGenerationService {
  private apiKey: string;
  private videoApiUrl: string;

  constructor() {
    this.apiKey = process.env.FREEPIK_API_KEY || '';
    this.videoApiUrl = process.env.FREEPIK_VIDEO_API_URL || 'https://api.freepik.com/v1/ai/image-to-video/kling-v2-5-pro';

    if (!this.apiKey) {
      throw new Error('FREEPIK_API_KEY is not configured');
    }
  }

  /**
   * Initiate video generation from image
   */
  async generateVideo(params: VideoGenerationRequest): Promise<VideoGenerationResponse> {
    try {
      logger.info('Initiating video generation', {
        prompt: params.prompt,
        duration: params.duration || '5',
      });

      const requestBody = {
        image: params.image,
        prompt: params.prompt,
        negative_prompt: params.negative_prompt || '',
        duration: params.duration || '5',
        cfg_scale: params.cfg_scale || 0.5,
        webhook_url: params.webhook_url,
      };

      const response = await axios.post<VideoGenerationResponse>(
        this.videoApiUrl,
        requestBody,
        {
          headers: {
            'x-freepik-api-key': this.apiKey,
            'Content-Type': 'application/json',
          },
          timeout: 30000, // 30 second timeout
        }
      );

      logger.info('Video generation initiated successfully', {
        task_id: response.data.data.task_id,
        status: response.data.data.status,
      });

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        logger.error('Freepik video generation API error', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
        });

        throw new Error(
          `Video generation failed: ${error.response?.data?.message || error.message}`
        );
      }

      logger.error('Unexpected error during video generation', { error });
      throw new Error('Video generation failed due to an unexpected error');
    }
  }

  /**
   * Check video generation status and get result
   */
  async getVideoStatus(taskId: string): Promise<VideoStatusResponse> {
    try {
      logger.info('Checking video generation status', { task_id: taskId });

      const url = `${this.videoApiUrl}/${taskId}`;
      
      const response = await axios.get<VideoStatusResponse>(url, {
        headers: {
          'x-freepik-api-key': this.apiKey,
        },
        timeout: 15000, // 15 second timeout
      });

      logger.info('Video status retrieved', {
        task_id: taskId,
        status: response.data.data.status,
        hasVideo: !!response.data.data.generated,
      });

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        logger.error('Freepik video status API error', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
        });

        throw new Error(
          `Failed to get video status: ${error.response?.data?.message || error.message}`
        );
      }

      logger.error('Unexpected error getting video status', { error });
      throw new Error('Failed to get video status due to an unexpected error');
    }
  }

  /**
   * Poll for video completion (helper method)
   */
  async waitForVideoCompletion(
    taskId: string,
    maxAttempts: number = 60,
    intervalMs: number = 5000
  ): Promise<VideoStatusResponse> {
    let attempts = 0;

    while (attempts < maxAttempts) {
      const status = await this.getVideoStatus(taskId);

      if (status.data.status === 'COMPLETED') {
        return status;
      }

      if (status.data.status === 'FAILED') {
        throw new Error(`Video generation failed: ${status.data.error || 'Unknown error'}`);
      }

      attempts++;
      if (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, intervalMs));
      }
    }

    throw new Error('Video generation timed out');
  }
}

export const videoGenerationService = new VideoGenerationService();
export default videoGenerationService;
