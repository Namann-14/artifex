import { 
  GeminiGenerationRequest, 
  GeminiGenerationResponse, 
  SubscriptionTier,
  ImageQuality,
  AspectRatio
} from '../types';
import { AppError } from '../utils/imageGenerationErrors';
import { cloudinaryService } from './cloudinaryService';
import fetch from 'node-fetch';

/**
 * Freepik Mystic API Service
 * Handles text-to-image generation using Freepik's API
 */
export class FreepikImageService {
  private readonly apiKey: string;
  private readonly apiUrl: string;
  
  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.FREEPIK_API_KEY || '';
    this.apiUrl = process.env.FREEPIK_API_URL || 'https://api.freepik.com/v1/ai/mystic';
    
    if (!this.apiKey) {
      throw new AppError(
        'Freepik API key is required',
        500,
        'FREEPIK_API_KEY_MISSING'
      );
    }
  }

  /**
   * Map subscription tier to quality settings
   */
  private getQualitySettings(tier: SubscriptionTier, quality?: ImageQuality): {
    resolution: string;
    hdr: number;
    creative_detailing: number;
  } {
    // Default settings based on tier
    const settings = {
      free: { resolution: '1k', hdr: 30, creative_detailing: 25 },
      plus: { resolution: '2k', hdr: 50, creative_detailing: 33 },
      pro: { resolution: '2k', hdr: 70, creative_detailing: 50 }
    };

    const tierSettings = settings[tier] || settings.free;

    // Override with quality if specified
    if (quality === 'hd' || quality === 'ultra') {
      tierSettings.resolution = '2k';
      tierSettings.hdr = quality === 'ultra' ? 70 : 50;
      tierSettings.creative_detailing = quality === 'ultra' ? 50 : 33;
    }

    return tierSettings;
  }

  /**
   * Map aspect ratio to Freepik format
   */
  private mapAspectRatio(aspectRatio?: AspectRatio): string {
    const ratioMap: Record<string, string> = {
      '1:1': 'square_1_1',
      'square': 'square_1_1',
      '16:9': 'widescreen_16_9',
      'landscape': 'widescreen_16_9',
      '9:16': 'portrait_9_16',
      'portrait': 'portrait_9_16',
      '4:3': 'standard_4_3',
      '3:4': 'standard_3_4'
    };

    return ratioMap[aspectRatio || '1:1'] || 'square_1_1';
  }

  /**
   * Map style to Freepik model
   */
  private mapStyleToModel(style?: string): string {
    const styleMap: Record<string, string> = {
      'realistic': 'realism',
      'photorealistic': 'realism',
      'artistic': 'creative',
      'creative': 'creative',
      'anime': 'anime',
      'digital-art': 'creative',
      'painting': 'creative',
      '3d': 'realism'
    };

    return styleMap[style || 'realistic'] || 'realism';
  }

  /**
   * Build Freepik API request payload
   */
  private buildRequestPayload(request: GeminiGenerationRequest): any {
    const qualitySettings = this.getQualitySettings(
      request.subscriptionTier, 
      request.quality
    );
    
    const payload: any = {
      prompt: request.prompt,
      resolution: qualitySettings.resolution,
      aspect_ratio: this.mapAspectRatio(request.aspectRatio),
      model: this.mapStyleToModel(request.style),
      creative_detailing: qualitySettings.creative_detailing,
      hdr: qualitySettings.hdr,
      engine: 'automatic',
      fixed_generation: false,
      filter_nsfw: true
    };

    // Don't add styling object - the model field handles the style
    // The styling object is for more advanced style customization

    // Add webhook URL if needed (for async processing)
    // payload.webhook_url = 'https://your-domain.com/webhook';

    return payload;
  }

  /**
   * Poll for generation result
   */
  private async pollGenerationResult(generationId: string, maxAttempts = 30): Promise<any> {
    const pollUrl = `https://api.freepik.com/v1/ai/mystic/${generationId}`;
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds between polls
      
      const response = await fetch(pollUrl, {
        method: 'GET',
        headers: {
          'x-freepik-api-key': this.apiKey
        }
      });

      if (!response.ok) {
        const errorData: any = await response.json().catch(() => ({}));
        throw new AppError(
          `Freepik API polling error: ${errorData.message || response.statusText}`,
          response.status,
          'FREEPIK_POLL_ERROR'
        );
      }

      const result: any = await response.json();
      const data = result.data || result;
      
      console.log(`Poll attempt ${attempt + 1}: Status=${data.status}, Generated count=${data.generated?.length || 0}`);
      
      // Check if generation is complete
      if (data.status === 'COMPLETED' || data.status === 'completed') {
        // Check if images are in the generated array
        if (data.generated && data.generated.length > 0) {
          const firstImage = data.generated[0];
          console.log('Generated image data:', firstImage);
          console.log('Generated image type:', typeof firstImage);
          
          // Freepik returns the URL as a string directly in the generated array
          if (typeof firstImage === 'string') {
            return {
              image_url: firstImage,
              data: data
            };
          }
          
          // If it's an object, extract the URL from properties
          return {
            image_url: firstImage.url || firstImage.image_url || firstImage.image,
            ...firstImage,
            data: data
          };
        } else if (data.image_url) {
          return { image_url: data.image_url, data: data };
        } else {
          console.error('Completed but no images:', data);
          throw new AppError(
            'Generation completed but no images were produced',
            500,
            'NO_IMAGES_GENERATED'
          );
        }
      } else if (data.status === 'FAILED' || data.status === 'failed') {
        throw new AppError(
          `Image generation failed: ${data.error || 'Unknown error'}`,
          500,
          'FREEPIK_GENERATION_FAILED'
        );
      }
      
      // Continue polling if still processing (CREATED, PROCESSING, etc.)
      console.log(`Task ${generationId} status: ${data.status} (attempt ${attempt + 1}/${maxAttempts})`);
    }
    
    throw new AppError(
      'Image generation timed out after 60 seconds',
      408,
      'FREEPIK_TIMEOUT'
    );
  }

  /**
   * Upload image URL to Cloudinary
   */
  private async uploadToCloudinary(imageUrl: string, request: GeminiGenerationRequest): Promise<any> {
    try {
      // Download image from Freepik URL
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        throw new Error('Failed to download generated image');
      }

      const arrayBuffer = await imageResponse.arrayBuffer();
      const imageBuffer = Buffer.from(arrayBuffer);
      
      console.log('Uploading to Cloudinary...');
      // Upload to Cloudinary
      const uploadResult = await cloudinaryService.uploadImage(imageBuffer, {
        folder: `artifex/${request.subscriptionTier}`
      });

      // Check if Cloudinary upload was successful
      if (!uploadResult || !uploadResult.success || !uploadResult.secureUrl) {
        console.log('Cloudinary upload failed or not configured, using direct URL fallback');
        throw new Error('Cloudinary upload failed');
      }

      console.log('Cloudinary upload successful:', uploadResult.publicId);
      return {
        url: uploadResult.secureUrl,
        secureUrl: uploadResult.secureUrl,
        publicId: uploadResult.publicId,
        format: uploadResult.format || 'jpeg',
        width: uploadResult.width || 1024,
        height: uploadResult.height || 1024,
        bytes: uploadResult.bytes || 0
      };
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      // Fallback to direct URL if Cloudinary fails
      console.log('Using direct Freepik URL as fallback');
      return {
        url: imageUrl,
        secureUrl: imageUrl,
        publicId: `freepik_${Date.now()}`,
        format: 'jpeg',
        width: 1024,
        height: 1024,
        bytes: 0
      };
    }
  }

  /**
   * Generate image from text prompt using Freepik API
   */
  async textToImage(request: GeminiGenerationRequest): Promise<GeminiGenerationResponse> {
    try {
      const startTime = Date.now();
      
      console.log('Generating image with Freepik Mystic API:', {
        prompt: request.prompt.substring(0, 100) + '...',
        quality: request.quality,
        tier: request.subscriptionTier,
        aspectRatio: request.aspectRatio
      });

      const requestPayload = this.buildRequestPayload(request);
      console.log('Freepik request payload:', JSON.stringify(requestPayload, null, 2));

      // Make API request to Freepik
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'x-freepik-api-key': this.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestPayload)
      });

      console.log('Freepik API response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Freepik API error response:', errorText);
        let errorData: any = {};
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { message: errorText };
        }
        throw new AppError(
          `Freepik API error: ${errorData.message || errorData.error || response.statusText}`,
          response.status,
          'FREEPIK_API_ERROR'
        );
      }

      const data: any = await response.json();
      console.log('Freepik API response data:', JSON.stringify(data, null, 2));

      // Check if immediate URL is provided or need to poll
      let imageUrl: string;
      let generationData: any;

      // Freepik returns data wrapped in a data object
      const responseData = data.data || data;
      
      if (responseData.image_url) {
        // Image is ready immediately
        console.log('Image URL received immediately:', responseData.image_url);
        imageUrl = responseData.image_url;
        generationData = responseData;
      } else if (responseData.task_id || responseData.id || responseData.generation_id) {
        // Need to poll for result
        const generationId = responseData.task_id || responseData.id || responseData.generation_id;
        console.log('Polling for generation result. Task ID:', generationId);
        generationData = await this.pollGenerationResult(generationId);
        
        // Extract URL from the polled result
        imageUrl = generationData.image_url || generationData.url || generationData.image;
        console.log('Image URL received after polling:', imageUrl);
        
        if (!imageUrl) {
          console.error('No URL found in generation data:', generationData);
          throw new AppError(
            'Generation completed but no image URL was returned',
            500,
            'NO_IMAGE_URL'
          );
        }
      } else {
        console.error('Invalid Freepik response - no image_url or task_id:', data);
        throw new AppError(
          'Invalid response from Freepik API - no image URL or task ID provided',
          500,
          'INVALID_FREEPIK_RESPONSE'
        );
      }

      console.log('Uploading to Cloudinary...');
      // Upload to Cloudinary for better management
      const cloudinaryResult = await this.uploadToCloudinary(imageUrl, request);
      console.log('Cloudinary upload complete:', cloudinaryResult.publicId);

      const processingTime = Date.now() - startTime;

      const imageData = {
        id: cloudinaryResult.publicId,
        url: cloudinaryResult.secureUrl || cloudinaryResult.url,
        secureUrl: cloudinaryResult.secureUrl || cloudinaryResult.url,
        publicId: cloudinaryResult.publicId,
        width: cloudinaryResult.width || 1024,
        height: cloudinaryResult.height || 1024,
        format: cloudinaryResult.format || 'png',
        bytes: cloudinaryResult.bytes || 0,
        size: cloudinaryResult.bytes || 0,
        cloudinaryUrl: cloudinaryResult.url,
        originalUrl: imageUrl,
        thumbnailUrl: cloudinaryResult.thumbnailUrl,
        metadata: {
          prompt: request.prompt,
          generatedAt: new Date().toISOString()
        }
      };

      return {
        success: true,
        images: [imageData],
        metadata: {
          prompt: request.prompt,
          enhancedPrompt: request.prompt,
          model: 'freepik-mystic',
          quality: request.quality,
          aspectRatio: request.aspectRatio,
          style: request.style || 'realistic',
          generatedAt: new Date().toISOString(),
          processingTime,
          subscriptionTier: request.subscriptionTier
        },
        usage: {
          creditsUsed: this.calculateCreditsUsed(request),
          tokensUsed: 0
        }
      };

    } catch (error: any) {
      console.error('Freepik text-to-image generation failed:');
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      console.error('Full error:', error);
      throw this.handleFreepikError(error);
    }
  }

  /**
   * Image-to-image generation (not supported by Freepik Mystic)
   * Falls back to text-to-image with descriptive prompt
   */
  async imageToImage(request: GeminiGenerationRequest & { 
    inputImage: Buffer | string;
    inputImageType: string;
  }): Promise<GeminiGenerationResponse> {
    console.warn('Image-to-image not natively supported by Freepik. Using text-to-image with enhanced prompt.');
    
    // Enhance prompt to describe transformation
    const enhancedRequest = {
      ...request,
      prompt: `${request.prompt}. Based on reference image, maintain similar composition and style.`
    };

    return this.textToImage(enhancedRequest);
  }

  /**
   * Image-to-video generation using Freepik Kling API
   */
  async imageToVideo(params: {
    imageUrl: string;
    prompt?: string;
    negativePrompt?: string;
    duration?: '5' | '10';
    cfgScale?: number;
    webhookUrl?: string;
  }): Promise<any> {
    try {
      const startTime = Date.now();
      const videoApiUrl = 'https://api.freepik.com/v1/ai/image-to-video/kling-v2-5-pro';
      
      console.log('Generating video with Freepik Kling API:', {
        imageUrl: params.imageUrl.substring(0, 100) + '...',
        prompt: params.prompt?.substring(0, 100),
        duration: params.duration || '5',
        cfgScale: params.cfgScale,
        apiKey: this.apiKey ? `${this.apiKey.substring(0, 10)}...` : 'MISSING'
      });

      // Validate API key
      if (!this.apiKey) {
        throw new AppError(
          'Freepik API key is not configured. Please check your environment variables.',
          500,
          'MISSING_API_KEY'
        );
      }

      // Validate image URL
      if (!params.imageUrl || typeof params.imageUrl !== 'string') {
        throw new AppError('Invalid or missing image URL', 400, 'INVALID_IMAGE_URL');
      }

      let imageToSend = params.imageUrl;

      // Handle base64 images - upload to Cloudinary first
      if (params.imageUrl.startsWith('data:image')) {
        console.log('Detected base64 image, uploading to Cloudinary...');
        try {
          const parts = params.imageUrl.split(',');
          if (parts.length !== 2 || !parts[1]) {
            throw new Error('Invalid base64 image format');
          }
          const base64Data: string = parts[1];
          const imageBuffer = Buffer.from(base64Data, 'base64');
          
          const uploadResult = await cloudinaryService.uploadImage(imageBuffer, {
            folder: 'artifex/video-sources',
            quality: '100',  // Use highest quality
            format: 'jpg',    // Ensure JPG format
            width: 1024,      // Minimum width for Freepik
            height: 1024,     // Minimum height for Freepik
            crop: 'pad'       // Pad to maintain aspect ratio
          });

          if (!uploadResult || !uploadResult.success || !uploadResult.secureUrl) {
            throw new AppError('Failed to upload base64 image to Cloudinary', 500, 'CLOUDINARY_UPLOAD_FAILED');
          }

          // Use direct Cloudinary URL - it's already public and optimized
          imageToSend = uploadResult.secureUrl;
          console.log('Base64 image uploaded to Cloudinary:', imageToSend);
        } catch (error: any) {
          throw new AppError(
            `Failed to process base64 image: ${error.message}`,
            500,
            'BASE64_UPLOAD_FAILED'
          );
        }
      } else {
        // Validate HTTP(S) URL and check if it's a direct image
        try {
          const url = new URL(params.imageUrl);
          
          // Check if it's a direct image URL (ends with image extension)
          const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
          const hasImageExtension = imageExtensions.some(ext => 
            url.pathname.toLowerCase().endsWith(ext)
          );

          console.log('Validating image URL...');
          const imageResponse = await fetch(params.imageUrl, { 
            method: 'GET',
            redirect: 'follow'
          });
          
          if (!imageResponse.ok) {
            throw new AppError(
              `Image URL is not accessible: ${imageResponse.status} ${imageResponse.statusText}`,
              400,
              'IMAGE_URL_NOT_ACCESSIBLE'
            );
          }

          const contentType = imageResponse.headers.get('content-type');
          console.log('Image content type:', contentType);
          
          // If not an image content type, throw error
          if (!contentType || !contentType.startsWith('image/')) {
            throw new AppError(
              `Invalid image URL. The URL must point directly to an image file (e.g., .jpg, .png). ` +
              `Please use a direct image URL, not a search result or webpage.`,
              400,
              'INVALID_IMAGE_TYPE'
            );
          }

          // If it's a valid image, we can use the URL directly
          imageToSend = params.imageUrl;
          
        } catch (error: any) {
          if (error instanceof AppError) {
            throw error;
          }
          
          // Handle URL parsing errors
          throw new AppError(
            `Invalid image URL format. Please provide a valid HTTP(S) URL pointing directly to an image file.`,
            400,
            'INVALID_URL_FORMAT'
          );
        }
      }

      const requestPayload: any = {
        image: imageToSend,
        duration: String(params.duration || '5'), // Ensure it's a string
      };

      // Only add optional fields if they have values
      if (params.prompt && params.prompt.trim()) {
        requestPayload.prompt = params.prompt.trim();
      }

      if (params.negativePrompt && params.negativePrompt.trim()) {
        requestPayload.negative_prompt = params.negativePrompt.trim();
      }

      if (params.cfgScale !== undefined && params.cfgScale !== null) {
        requestPayload.cfg_scale = Number(params.cfgScale);
      }

      if (params.webhookUrl) {
        requestPayload.webhook_url = params.webhookUrl;
      }

      console.log('Freepik video request payload:', JSON.stringify({
        ...requestPayload,
        image: requestPayload.image.length > 100 ? 
          requestPayload.image.substring(0, 100) + `... (${requestPayload.image.length} chars)` : 
          requestPayload.image
      }, null, 2));

      // Make API request to Freepik
      const response = await fetch(videoApiUrl, {
        method: 'POST',
        headers: {
          'x-freepik-api-key': this.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestPayload)
      });

      console.log('Freepik video API response status:', response.status, response.statusText);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Freepik video API error response:', errorText);
        let errorData: any = {};
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { message: errorText };
        }
        
        let errorMessage = 'Freepik API error: ';
        if (response.status === 401) {
          errorMessage += 'Invalid API key. Please check your FREEPIK_API_KEY environment variable.';
        } else if (response.status === 402) {
          errorMessage += 'Insufficient credits or quota exceeded. Please check your Freepik account.';
        } else if (response.status === 429) {
          errorMessage += 'Rate limit exceeded. Please wait a moment and try again.';
        } else {
          errorMessage += errorData.message || errorData.error || response.statusText;
        }
        
        throw new AppError(
          errorMessage,
          response.status,
          'FREEPIK_VIDEO_API_ERROR'
        );
      }

      const data: any = await response.json();
      console.log('Freepik video API response data:', JSON.stringify(data, null, 2));

      // Extract task ID for polling
      const responseData = data.data || data;
      const taskId = responseData.task_id || responseData.id || responseData.generation_id;
      
      if (!taskId) {
        throw new AppError(
          'No task ID returned from Freepik video API',
          500,
          'NO_TASK_ID'
        );
      }

      console.log('Video generation task started. Task ID:', taskId);

      // Poll for video result (video generation takes longer)
      const videoResult = await this.pollVideoGenerationResult(taskId, 60); // 60 attempts = ~2 minutes
      
      const processingTime = Date.now() - startTime;

      return {
        success: true,
        taskId,
        videoUrl: videoResult.video_url || videoResult.url,
        status: videoResult.status,
        metadata: {
          prompt: params.prompt,
          duration: params.duration || '5',
          generatedAt: new Date().toISOString(),
          processingTime
        },
        data: videoResult
      };

    } catch (error: any) {
      console.error('Freepik image-to-video generation failed:', error);
      throw this.handleFreepikError(error);
    }
  }

  /**
   * Poll for video generation result
   */
  private async pollVideoGenerationResult(taskId: string, maxAttempts = 60): Promise<any> {
    const pollUrl = `https://api.freepik.com/v1/ai/image-to-video/kling-v2-5-pro/${taskId}`;
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds between polls
      
      const response = await fetch(pollUrl, {
        method: 'GET',
        headers: {
          'x-freepik-api-key': this.apiKey
        }
      });

      if (!response.ok) {
        const errorData: any = await response.json().catch(() => ({}));
        throw new AppError(
          `Freepik video API polling error: ${errorData.message || response.statusText}`,
          response.status,
          'FREEPIK_VIDEO_POLL_ERROR'
        );
      }

      const result: any = await response.json();
      const data = result.data || result;
      
      console.log(`Video poll attempt ${attempt + 1}: Status=${data.status}`);
      
      // Check if generation is complete
      if (data.status === 'COMPLETED' || data.status === 'completed') {
        // Check for video URL in various possible locations
        const videoUrl = data.video_url || 
                        data.url || 
                        data.video || 
                        (data.output && data.output[0]) ||
                        (data.generated && data.generated[0]);
        
        if (!videoUrl) {
          console.error('Completed but no video URL found. Full data:', JSON.stringify(data, null, 2));
          throw new AppError(
            'Video generation completed but no video URL was returned',
            500,
            'NO_VIDEO_URL'
          );
        }
        
        console.log('Video generation successful! Video URL:', videoUrl);
        return {
          video_url: videoUrl,
          status: data.status,
          data: data
        };
      } else if (data.status === 'FAILED' || data.status === 'failed') {
        // Log full error data for debugging
        console.error('Video generation FAILED. Full error data:', JSON.stringify(data, null, 2));
        console.error('Task ID:', taskId);
        console.error('You may check this task directly at Freepik dashboard');
        
        // Try to get more detailed error information
        let errorMessage = '';
        
        if (data.error) {
          errorMessage = `Video generation failed: ${data.error}`;
        } else if (data.error_message) {
          errorMessage = `Video generation failed: ${data.error_message}`;
        } else if (data.message) {
          errorMessage = `Video generation failed: ${data.message}`;
        } else if (data.errors && Array.isArray(data.errors)) {
          errorMessage = `Video generation failed: ${data.errors.join(', ')}`;
        } else if (data.errors && typeof data.errors === 'object') {
          errorMessage = `Video generation failed: ${JSON.stringify(data.errors)}`;
        } else {
          // No error details provided - give helpful message
          errorMessage = 'Video generation failed. Common reasons:\n\n' +
                         '1. API Credits/Quota: Your Freepik API plan may be out of credits\n' +
                         '   → Check your account at https://www.freepik.com/api/dashboard\n\n' +
                         '2. Image Requirements: The image may not meet requirements\n' +
                         '   → Try: Standard format (JPG/PNG), clear quality, 512x512 to 2048x2048px\n' +
                         '   → Avoid: Blurry, overly compressed, or inappropriate content\n\n' +
                         '3. Prompt Issues: The prompt may contain restricted content\n' +
                         '   → Try: Simpler, descriptive prompts without sensitive terms\n\n' +
                         '4. API Permissions: Your API key may not have video generation access\n' +
                         '   → Verify your subscription includes Kling video generation\n\n' +
                         `Task ID for support: ${taskId}`;
        }
        
        throw new AppError(
          errorMessage,
          500,
          'FREEPIK_VIDEO_GENERATION_FAILED'
        );
      }
      
      // Continue polling if still processing
      console.log(`Video task ${taskId} status: ${data.status} (attempt ${attempt + 1}/${maxAttempts})`);
    }
    
    throw new AppError(
      'Video generation timed out after 2 minutes',
      408,
      'FREEPIK_VIDEO_TIMEOUT'
    );
  }

  /**
   * Calculate credits used based on request parameters
   */
  private calculateCreditsUsed(request: GeminiGenerationRequest): number {
    let credits = 1; // Base cost

    // Quality multiplier
    if (request.quality === 'hd') credits *= 1.5;
    if (request.quality === 'ultra') credits *= 2;

    // Batch multiplier (if batch generation is requested in future)
    const batchSize = (request as any).numberOfImages || 1;
    if (batchSize > 1) {
      credits *= batchSize * 0.9; // Slight discount for batch
    }

    return Math.ceil(credits);
  }

  /**
   * Handle Freepik API errors
   */
  private handleFreepikError(error: any): AppError {
    if (error instanceof AppError) {
      return error;
    }

    const message = error.message || 'Freepik image generation failed';
    const statusCode = error.statusCode || 500;
    
    // Check for specific error types
    if (message.includes('API key')) {
      return new AppError('Invalid Freepik API key', 401, 'INVALID_API_KEY');
    }
    
    if (message.includes('quota') || message.includes('limit')) {
      return new AppError('Freepik API quota exceeded', 429, 'QUOTA_EXCEEDED');
    }

    if (message.includes('timeout')) {
      return new AppError('Image generation timed out', 408, 'TIMEOUT');
    }

    return new AppError(message, statusCode, 'FREEPIK_ERROR');
  }
}

// Export singleton instance
export const freepikService = new FreepikImageService();
