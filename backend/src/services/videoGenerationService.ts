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
      logger.info('🎬 Initiating video generation', {
        prompt: params.prompt,
        duration: params.duration || '5',
        imageType: params.image?.startsWith('data:') ? 'base64' : params.image?.startsWith('http') ? 'url' : 'unknown',
        imageSize: params.image?.length
      });

      // If image is base64, we need to upload to Cloudinary first
      let imageUrl = params.image;
      if (params.image?.startsWith('data:')) {
        logger.info('Converting base64 image to Cloudinary URL...', {
          imageSize: params.image.length,
          mimeType: params.image.substring(0, 30)
        });
        try {
          const { cloudinaryService } = await import('./cloudinaryService');
          
          // Check if Cloudinary is configured
          if (!cloudinaryService.isReady()) {
            throw new Error('Cloudinary is not configured. Please check environment variables: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET');
          }
          
          logger.info('Uploading base64 image directly to Cloudinary...');
          
          // Use uploadFromUrl which accepts data URIs directly
          const uploadResult = await cloudinaryService.uploadFromUrl(params.image, {
            folder: 'artifex/video-generation',
            resourceType: 'image',
            quality: 'auto:best',
            format: 'jpg' // Ensure consistent format
          });
          
          logger.info('Cloudinary upload result', {
            success: uploadResult.success,
            error: uploadResult.error,
            url: uploadResult.secureUrl?.substring(0, 80)
          });
          
          if (!uploadResult.success || !uploadResult.secureUrl) {
            const errorMsg = uploadResult.error || 'Failed to upload image';
            logger.error('Cloudinary upload failed', { error: errorMsg });
            throw new Error(errorMsg);
          }
          
          imageUrl = uploadResult.secureUrl;
          logger.info('✅ Image uploaded to Cloudinary successfully', { 
            url: imageUrl,
            format: uploadResult.format,
            bytes: uploadResult.bytes
          });
        } catch (uploadError) {
          logger.error('Failed to upload image to Cloudinary', {
            error: uploadError,
            message: uploadError instanceof Error ? uploadError.message : String(uploadError)
          });
          throw new Error(`Failed to process image for video generation: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}. Please ensure the image is a valid JPEG/PNG.`);
        }
      }

      // Validate image URL
      if (!imageUrl || (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://'))) {
        throw new Error(`Invalid image URL: ${imageUrl}. Must be a valid HTTP/HTTPS URL.`);
      }

      const requestBody = {
        image: imageUrl,
        prompt: params.prompt,
        negative_prompt: params.negative_prompt || '',
        duration: params.duration || '5',
        cfg_scale: params.cfg_scale || 0.5,
        webhook_url: params.webhook_url,
      };

      logger.info('📤 Sending request to Freepik API', {
        apiUrl: this.videoApiUrl,
        imageUrl: imageUrl?.substring(0, 100) + '...',
        prompt: params.prompt,
        duration: requestBody.duration,
        cfgScale: requestBody.cfg_scale,
        hasApiKey: !!this.apiKey,
        requestBody: JSON.stringify(requestBody, null, 2)
      });

      const response = await axios.post<VideoGenerationResponse>(
        this.videoApiUrl,
        requestBody,
        {
          headers: {
            'x-freepik-api-key': this.apiKey,
            'Content-Type': 'application/json',
          },
          timeout: 60000, // 60 second timeout (increased from 30s)
        }
      );

      logger.info('📥 Freepik API response received', {
        status: response.status,
        statusText: response.statusText,
        data: JSON.stringify(response.data, null, 2)
      });

      logger.info('Video generation initiated successfully', {
        task_id: response.data.data.task_id,
        status: response.data.data.status,
      });

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorDetails = {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message,
          code: error.code,
          config: {
            url: error.config?.url,
            method: error.config?.method,
            headers: error.config?.headers
          }
        };
        
        logger.error('❌ Freepik video generation API error', errorDetails);
        
        // Extract detailed error message
        const apiError = error.response?.data as any;
        const errorMessage = 
          apiError?.error?.message ||
          apiError?.message ||
          apiError?.detail ||
          error.response?.data ||
          error.message;

        throw new Error(
          `Video generation API error [${error.response?.status}]: ${typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage)}`
        );
      }

      logger.error('❌ Unexpected error during video generation', { 
        error,
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      throw new Error(`Video generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check video generation status and get result
   */
  async getVideoStatus(taskId: string): Promise<VideoStatusResponse> {
    try {
      logger.info('Checking video generation status', { task_id: taskId });

      const url = `${this.videoApiUrl}/${taskId}`;
      
      // Retry logic with exponential backoff
      let lastError: any;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const response = await axios.get<VideoStatusResponse>(url, {
            headers: {
              'x-freepik-api-key': this.apiKey,
            },
            timeout: 60000, // 60 second timeout (increased from 15s)
          });

          logger.info('Video status retrieved', {
            task_id: taskId,
            status: response.data.data.status,
            hasVideo: !!response.data.data.generated,
            attempt
          });

          return response.data;
        } catch (retryError) {
          lastError = retryError;
          
          if (axios.isAxiosError(retryError)) {
            // Don't retry on 4xx errors (client errors) - these won't succeed
            if (retryError.response?.status && retryError.response.status >= 400 && retryError.response.status < 500) {
              throw retryError;
            }
            
            // Only retry on timeouts and 5xx errors
            if (retryError.code === 'ECONNABORTED' || (retryError.response?.status && retryError.response.status >= 500)) {
              if (attempt < 3) {
                const delay = Math.pow(2, attempt) * 1000; // 2s, 4s
                logger.warn(`Status check attempt ${attempt} failed, retrying in ${delay}ms...`, {
                  task_id: taskId,
                  error: retryError.message
                });
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
              }
            }
          }
          
          throw retryError;
        }
      }

      throw lastError;
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

      logger.info('Video status check', {
        taskId,
        attempt: attempts + 1,
        maxAttempts,
        status: status.data.status,
        fullData: JSON.stringify(status.data, null, 2)
      });

      if (status.data.status === 'COMPLETED') {
        return status;
      }

      if (status.data.status === 'FAILED') {
        // Log the full response to debug
        logger.error('❌ Video generation failed - Full API response:', {
          taskId,
          status: status.data.status,
          fullData: JSON.stringify(status.data, null, 2),
          rawResponse: status
        });
        
        // Extract error message from various possible locations in the API response
        const apiData = status.data as any;
        const errorMessage = 
          status.data.error ||
          apiData.error_message ||
          apiData.message ||
          apiData.error?.message ||
          apiData.error?.detail ||
          apiData.failure_reason ||
          apiData.fail_reason ||
          'API returned FAILED status. Possible causes:\n' +
          '  1. Image format not supported (ensure JPG/PNG)\n' +
          '  2. Image too large or too small\n' +
          '  3. Content policy violation\n' +
          '  4. API quota/rate limits exceeded\n' +
          '  5. Invalid image URL or inaccessible image\n' +
          'Check your Freepik API dashboard for detailed error logs.';
        
        throw new Error(`Video generation failed: ${errorMessage}`);
      }

      attempts++;
      if (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, intervalMs));
      }
    }

    throw new Error('Video generation timed out after ' + (maxAttempts * intervalMs / 1000) + ' seconds');
  }
}

export const videoGenerationService = new VideoGenerationService();
export default videoGenerationService;
