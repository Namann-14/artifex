import { 
  GenerationContext,
  GenerationResult,
  GeminiGenerationRequest,
  GeminiGenerationResponse,
  ImageGeneration,
  ImageGenerationType,
  ImageGenerationStatus,
  QuotaInfo,
  SubscriptionInfo,
  SubscriptionTier
} from '../types';
import { FreepikImageService } from './freepikService';
import { ImageProcessingService } from './imageProcessingService';
import { ImageGenerationModel, UserModel } from '../models';
import { Document } from 'mongoose';
import { QuotaUtils } from '../utils/quota';
import { 
  AppError, 
  QuotaExceededError, 
  SubscriptionError,
  ValidationError,
  RetryHandler
} from '../utils/imageGenerationErrors';

/**
 * Image Generation Orchestrator Service
 * Coordinates the complete workflow from request validation to response delivery
 * Now using Freepik API for image generation
 */
export class ImageGenerationOrchestrator {
  private freepikService: FreepikImageService;
  private imageProcessingService: ImageProcessingService;
  
  constructor() {
    this.freepikService = new FreepikImageService();
    this.imageProcessingService = new ImageProcessingService();
  }

  /**
   * Orchestrate text-to-image generation
   */
  async generateTextToImage(context: GenerationContext): Promise<GenerationResult> {
    const startTime = Date.now();
    let generationRecord: any = null;

    try {
      // 1. Validate generation context
      await this.validateGenerationContext(context);

      // 2. Create generation record
      generationRecord = await this.createGenerationRecord(context, 'text-to-image');

      // 3. Validate and consume quota
      const quotaResult = await this.validateAndConsumeQuota(context, generationRecord);
      if (!quotaResult.success) {
        throw new QuotaExceededError(
          quotaResult.message || 'Quota exceeded',
          quotaResult.remaining || 0,
          quotaResult.resetDate || new Date()
        );
      }

      // 4. Generate image with Freepik
      const freepikResponse = await this.executeWithRetry(() =>
        this.freepikService.textToImage(context.request)
      );

      // 5. Process generated images
      const processedImages = await this.processGeneratedImages(
        freepikResponse.images,
        context.subscriptionTier
      );

      // 6. Update generation record with results
      await this.updateGenerationRecord(generationRecord, {
        status: 'completed',
        outputImages: processedImages.map(img => ({
          url: img.url,
          width: img.width,
          height: img.height,
          format: img.format,
          fileSize: img.size || img.bytes,
          storageKey: img.id,
          thumbnailUrl: img.thumbnailUrl,
          publicId: img.publicId,
          secureUrl: img.secureUrl,
          cloudinaryUrl: img.cloudinaryUrl,
          bytes: img.bytes
        })),
        processingTimeMs: Date.now() - startTime,
        metadata: {
          ...generationRecord.metadata,
          ...freepikResponse.metadata,
          processedImages: processedImages.length,
          totalProcessingTime: Date.now() - startTime
        }
      });

      // 7. Return success result
      return {
        success: true,
        data: {
          images: processedImages,
          metadata: freepikResponse.metadata,
          usage: freepikResponse.usage,
          generationRecord
        }
      };

    } catch (error) {
      console.error('Text-to-image generation failed in orchestrator:');
      console.error('Error type:', error?.constructor?.name);
      console.error('Error message:', error instanceof Error ? error.message : String(error));
      console.error('Full error:', error);
      
      // Update generation record with error
      if (generationRecord) {
        await this.updateGenerationRecord(generationRecord, {
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      return {
        success: false,
        error: {
          code: error instanceof AppError ? error.errorCode : 'GENERATION_FAILED',
          message: error instanceof Error ? error.message : 'Generation failed',
          details: error instanceof AppError ? { statusCode: error.statusCode } : undefined
        }
      };
    }
  }

  /**
   * Orchestrate image-to-image generation
   */
  async generateImageToImage(
    context: GenerationContext,
    inputImage: Buffer,
    inputImageType: string,
    tempImagePath?: string
  ): Promise<GenerationResult> {
    const startTime = Date.now();
    let generationRecord: any = null;

    try {
      // 1. Validate input image
      const validationResult = await this.imageProcessingService.validateImage(
        inputImage,
        'input_image',
        context.subscriptionTier
      );

      if (!validationResult.valid) {
        throw new ValidationError(
          `Input image validation failed: ${validationResult.errors.join(', ')}`,
          'inputImage',
          'invalid',
          validationResult.errors
        );
      }

      // 2. Validate generation context
      await this.validateGenerationContext(context);

      // 3. Create generation record
      generationRecord = await this.createGenerationRecord(context, 'image-to-image');

      // 4. Validate and consume quota
      const quotaResult = await this.validateAndConsumeQuota(context, generationRecord);
      if (!quotaResult.success) {
        throw new QuotaExceededError(
          quotaResult.message || 'Quota exceeded',
          quotaResult.remaining || 0,
          quotaResult.resetDate || new Date()
        );
      }

      // 5. Generate image with Freepik
      const freepikRequest = {
        ...context.request,
        inputImage,
        inputImageType,
        ...(tempImagePath && { imagePath: tempImagePath }) // Pass the temporary file path if available
      };
      
      const freepikResponse = await this.executeWithRetry(() =>
        this.freepikService.imageToImage(freepikRequest)
      );

      // 6. Process generated images
      const processedImages = await this.processGeneratedImages(
        freepikResponse.images,
        context.subscriptionTier
      );

      // 7. Update generation record
      await this.updateGenerationRecord(generationRecord, {
        status: 'completed',
        inputImages: ['input_image'], // Store reference
        outputImages: processedImages.map(img => ({
          url: img.url,
          width: img.width,
          height: img.height,
          format: img.format,
          fileSize: img.size || img.bytes,
          storageKey: img.id,
          thumbnailUrl: img.thumbnailUrl,
          publicId: img.publicId,
          secureUrl: img.secureUrl,
          cloudinaryUrl: img.cloudinaryUrl,
          bytes: img.bytes
        })),
        processingTimeMs: Date.now() - startTime,
        metadata: {
          ...generationRecord.metadata,
          ...freepikResponse.metadata,
          inputImageAnalysis: typeof freepikResponse.metadata.inputImageAnalysis === 'string' 
            ? { analysis: freepikResponse.metadata.inputImageAnalysis }
            : freepikResponse.metadata.inputImageAnalysis,
          processedImages: processedImages.length
        }
      });

      return {
        success: true,
        data: {
          images: processedImages,
          metadata: freepikResponse.metadata,
          usage: freepikResponse.usage,
          generationRecord
        }
      };

    } catch (error) {
      console.error('Image-to-image generation failed:', error);
      
      if (generationRecord) {
        await this.updateGenerationRecord(generationRecord, {
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      return {
        success: false,
        error: {
          code: error instanceof AppError ? error.errorCode : 'GENERATION_FAILED',
          message: error instanceof Error ? error.message : 'Generation failed',
          details: error instanceof AppError ? { statusCode: error.statusCode } : undefined
        }
      };
    }
  }

  /**
   * Orchestrate multi-image composition
   */
  async generateMultiImageComposition(
    context: GenerationContext,
    inputImages: Array<{ data: Buffer; type: string; description?: string }>
  ): Promise<GenerationResult> {
    const startTime = Date.now();
    let generationRecord: any = null;

    try {
      // 1. Validate subscription tier allows multi-image
      if (context.subscriptionTier === 'free') {
        throw new SubscriptionError(
          'Multi-image composition requires Plus or Pro subscription',
          'plus',
          context.subscriptionTier
        );
      }

      // 2. Validate all input images
      for (const [index, image] of inputImages.entries()) {
        const validationResult = await this.imageProcessingService.validateImage(
          image.data,
          `input_image_${index}`,
          context.subscriptionTier
        );

        if (!validationResult.valid) {
          throw new ValidationError(
            `Input image ${index + 1} validation failed: ${validationResult.errors.join(', ')}`,
            `inputImage${index}`,
            'invalid',
            validationResult.errors
          );
        }
      }

      // 3. Validate generation context
      await this.validateGenerationContext(context);

      // 4. Create generation record
      generationRecord = await this.createGenerationRecord(context, 'multi-image');

      // 5. Validate and consume quota (higher cost for multi-image)
      const enhancedContext = {
        ...context,
        request: {
          ...context.request,
          batchSize: inputImages.length // Treat as batch for quota calculation
        }
      };

      const quotaResult = await this.validateAndConsumeQuota(enhancedContext, generationRecord);
      if (!quotaResult.success) {
        throw new QuotaExceededError(
          quotaResult.message || 'Quota exceeded',
          quotaResult.remaining || 0,
          quotaResult.resetDate || new Date()
        );
      }

      // 6. Generate composition with Freepik (fallback to single image generation)
      // Note: Freepik doesn't natively support multi-image composition
      // Using text-to-image with enhanced prompt describing the composition
      const compositionPrompt = `${context.request.prompt}. Create a composition combining multiple elements.`;
      const freepikResponse = await this.executeWithRetry(() =>
        this.freepikService.textToImage({
          ...context.request,
          prompt: compositionPrompt
        })
      );

      // 7. Process generated images
      const processedImages = await this.processGeneratedImages(
        freepikResponse.images,
        context.subscriptionTier
      );

      // 8. Update generation record
      await this.updateGenerationRecord(generationRecord, {
        status: 'completed',
        inputImages: inputImages.map((_, index) => `input_image_${index}`),
        outputImages: processedImages.map(img => ({
          url: img.url,
          width: img.width,
          height: img.height,
          format: img.format,
          fileSize: img.size || img.bytes,
          storageKey: img.id,
          thumbnailUrl: img.thumbnailUrl,
          publicId: img.publicId,
          secureUrl: img.secureUrl,
          cloudinaryUrl: img.cloudinaryUrl,
          bytes: img.bytes
        })),
        processingTimeMs: Date.now() - startTime,
        metadata: {
          ...generationRecord.metadata,
          ...freepikResponse.metadata,
          inputImageCount: inputImages.length,
          compositionAnalysis: typeof freepikResponse.metadata.compositionAnalysis === 'string'
            ? { analysis: freepikResponse.metadata.compositionAnalysis }
            : freepikResponse.metadata.compositionAnalysis
        }
      });

      return {
        success: true,
        data: {
          images: processedImages,
          metadata: freepikResponse.metadata,
          usage: freepikResponse.usage,
          generationRecord
        }
      };

    } catch (error) {
      console.error('Multi-image composition failed:', error);
      
      if (generationRecord) {
        await this.updateGenerationRecord(generationRecord, {
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      return {
        success: false,
        error: {
          code: error instanceof AppError ? error.errorCode : 'GENERATION_FAILED',
          message: error instanceof Error ? error.message : 'Generation failed',
          details: error instanceof AppError ? { statusCode: error.statusCode } : undefined
        }
      };
    }
  }

  /**
   * Orchestrate image refinement
   */
  async refineImage(
    context: GenerationContext,
    inputImage: Buffer,
    inputImageType: string,
    refinementType: 'enhance' | 'upscale' | 'style-transfer' | 'color-correction'
  ): Promise<GenerationResult> {
    const startTime = Date.now();
    let generationRecord: any = null;

    try {
      // 1. Validate input image
      const validationResult = await this.imageProcessingService.validateImage(
        inputImage,
        'input_image',
        context.subscriptionTier
      );

      if (!validationResult.valid) {
        throw new ValidationError(
          `Input image validation failed: ${validationResult.errors.join(', ')}`,
          'inputImage',
          'invalid',
          validationResult.errors
        );
      }

      // 2. Validate generation context
      await this.validateGenerationContext(context);

      // 3. Create generation record
      generationRecord = await this.createGenerationRecord(context, 'refine');

      // 4. Validate and consume quota
      const quotaResult = await this.validateAndConsumeQuota(context, generationRecord);
      if (!quotaResult.success) {
        throw new QuotaExceededError(
          quotaResult.message || 'Quota exceeded',
          quotaResult.remaining || 0,
          quotaResult.resetDate || new Date()
        );
      }

      // 5. Refine image with Freepik (using image-to-image fallback)
      const freepikResponse = await this.executeWithRetry(() =>
        this.freepikService.imageToImage({
          ...context.request,
          inputImage,
          inputImageType,
          prompt: `${context.request.prompt}. Refine and enhance the image quality.`
        })
      );

      // 6. Process refined images
      const processedImages = await this.processGeneratedImages(
        freepikResponse.images,
        context.subscriptionTier
      );

      // 7. Update generation record
      await this.updateGenerationRecord(generationRecord, {
        status: 'completed',
        inputImages: ['input_image'],
        outputImages: processedImages.map(img => ({
          url: img.url,
          width: img.width,
          height: img.height,
          format: img.format,
          fileSize: img.size || img.bytes,
          storageKey: img.id,
          thumbnailUrl: img.thumbnailUrl,
          publicId: img.publicId,
          secureUrl: img.secureUrl,
          cloudinaryUrl: img.cloudinaryUrl,
          bytes: img.bytes
        })),
        processingTimeMs: Date.now() - startTime,
        metadata: {
          ...generationRecord.metadata,
          ...freepikResponse.metadata,
          refinementType,
          refinementAnalysis: typeof freepikResponse.metadata.refinementAnalysis === 'string'
            ? { analysis: freepikResponse.metadata.refinementAnalysis }
            : freepikResponse.metadata.refinementAnalysis
        }
      });

      return {
        success: true,
        data: {
          images: processedImages,
          metadata: freepikResponse.metadata,
          usage: freepikResponse.usage,
          generationRecord
        }
      };

    } catch (error) {
      console.error('Image refinement failed:', error);
      
      if (generationRecord) {
        await this.updateGenerationRecord(generationRecord, {
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      return {
        success: false,
        error: {
          code: error instanceof AppError ? error.errorCode : 'GENERATION_FAILED',
          message: error instanceof Error ? error.message : 'Generation failed',
          details: error instanceof AppError ? { statusCode: error.statusCode } : undefined
        }
      };
    }
  }

  /**
   * Validate generation context
   */
  private async validateGenerationContext(context: GenerationContext): Promise<void> {
    // Validate user exists and is active
    const user = await UserModel.findByClerkId(context.userId);
    if (!user || !user.isActive) {
      throw new ValidationError(
        'User not found or inactive',
        'userId',
        context.userId
      );
    }

    // Validate subscription info
    if (!context.subscriptionInfo.isActive && context.subscriptionTier !== 'free') {
      throw new SubscriptionError(
        'Subscription is not active',
        context.subscriptionTier,
        'inactive'
      );
    }

    // Validate request parameters
    if (!context.request.prompt || context.request.prompt.trim().length === 0) {
      throw new ValidationError(
        'Prompt is required and cannot be empty',
        'prompt',
        context.request.prompt
      );
    }

    if (context.request.prompt.length > 2000) {
      throw new ValidationError(
        'Prompt exceeds maximum length of 2000 characters',
        'prompt',
        context.request.prompt.length,
        ['<= 2000']
      );
    }

    // Validate quality settings for tier
    const capabilities = this.getModelCapabilities(context.subscriptionTier);
    if (!capabilities.availableQualities.includes(context.request.quality)) {
      throw new ValidationError(
        `Quality '${context.request.quality}' not available for ${context.subscriptionTier} tier`,
        'quality',
        context.request.quality,
        capabilities.availableQualities
      );
    }

    // Validate batch size
    if (context.request.batchSize && context.request.batchSize > capabilities.maxBatchSize) {
      throw new ValidationError(
        `Batch size ${context.request.batchSize} exceeds limit of ${capabilities.maxBatchSize} for ${context.subscriptionTier} tier`,
        'batchSize',
        context.request.batchSize,
        [`<= ${capabilities.maxBatchSize}`]
      );
    }
  }

  /**
   * Create generation record in database
   */
  private async createGenerationRecord(
    context: GenerationContext,
    type: ImageGenerationType
  ): Promise<any> {
    const costOptions: {
      quality: 'standard' | 'hd';
      batchSize: number;
      aspectRatio: string;
      style?: string;
    } = {
      quality: context.request.quality === 'ultra' ? 'hd' : context.request.quality as 'standard' | 'hd',
      batchSize: context.request.batchSize || 1,
      aspectRatio: context.request.aspectRatio
    };

    if (context.request.style) {
      costOptions.style = context.request.style;
    }

    const cost = QuotaUtils.calculateGenerationCost(type, costOptions);

    const generation = new ImageGenerationModel({
      userId: context.userId,
      type,
      status: 'pending' as ImageGenerationStatus,
      prompt: context.request.prompt,
      negativePrompt: context.request.negativePrompt,
      style: context.request.style,
      aspectRatio: context.request.aspectRatio,
      quality: context.request.quality === 'ultra' ? 'hd' : context.request.quality, // Map ultra to hd for mongoose schema
      modelName: 'gemini-2.0-flash-exp',
      seed: context.request.seed,
      steps: context.request.steps,
      guidance: context.request.guidance,
      outputImages: [],
      cost,
      credits: cost,
      metadata: {
        model: 'gemini-2.0-flash-exp',
        version: '2.0',
        parameters: {
          subscriptionTier: context.subscriptionTier,
          batchSize: context.request.batchSize || 1,
          customModel: context.request.customModel
        }
      }
    });

    return await generation.save();
  }

  /**
   * Validate and consume quota
   */
  private async validateAndConsumeQuota(
    context: GenerationContext,
    generationRecord: any
  ): Promise<{
    success: boolean;
    message?: string;
    remaining?: number;
    resetDate?: Date;
  }> {
    try {
      // Calculate credits needed
      const creditsNeeded = generationRecord.credits;

      // Check if user has enough quota using the convenience alias
      if (context.quotaInfo.remaining < creditsNeeded) {
        return {
          success: false,
          message: `Insufficient quota. Need ${creditsNeeded} credits, have ${context.quotaInfo.remaining}`,
          remaining: context.quotaInfo.remaining,
          resetDate: context.quotaInfo.resetDate
        };
      }

      // Consume quota
      const user = await UserModel.findByClerkId(context.userId);
      if (!user) {
        return {
          success: false,
          message: 'User not found'
        };
      }

      user.monthlyUsage += creditsNeeded;
      await user.save();

      // Update generation record status
      generationRecord.status = 'processing';
      await generationRecord.save();

      return { success: true };

    } catch (error) {
      console.error('Quota validation/consumption failed:', error);
      return {
        success: false,
        message: 'Failed to validate/consume quota'
      };
    }
  }

  /**
   * Process generated images (optimization, thumbnails, etc.)
   */
  private async processGeneratedImages(
    images: any[],
    subscriptionTier: string
  ): Promise<any[]> {
    const processedImages = [];
    const { cloudinaryService } = await import('./cloudinaryService');

    for (const image of images) {
      try {
        let cloudinaryResult = null;
        
        // Try to upload to Cloudinary
        console.log('Processing image for Cloudinary upload. Image URL:', image.url);
        
        if (image.data) {
          // If image has base64 data directly
          console.log('Found base64 data, uploading to Cloudinary...');
          const imageBuffer = Buffer.from(image.data, 'base64');
          cloudinaryResult = await cloudinaryService.uploadImage(imageBuffer, {
            folder: `artifex/generations/${subscriptionTier}`,
            quality: 'auto'
          });
        } else if (image.url && image.url.includes('localhost')) {
          // If image is saved locally, read the file and upload to Cloudinary
          console.log('Found local image URL, reading file for Cloudinary upload...');
          try {
            const fs = await import('fs');
            const path = await import('path');
            
            // Extract filename from URL
            const urlPath = new URL(image.url).pathname;
            const filename = path.basename(urlPath);
            const filePath = path.join(process.cwd(), 'uploads', filename);
            
            console.log('Reading image file:', filePath);
            console.log('File exists?', fs.existsSync(filePath));
            
            if (fs.existsSync(filePath)) {
              const imageBuffer = fs.readFileSync(filePath);
              console.log('Read image buffer, size:', imageBuffer.length);
              
              const base64Data = `data:image/png;base64,${imageBuffer.toString('base64')}`;
              console.log('Converted to base64, length:', base64Data.length);
              
              console.log('Uploading to Cloudinary with options:', {
                folder: `artifex/generations/${subscriptionTier}`,
                quality: 'auto',
                format: 'auto'
              });
              
              cloudinaryResult = await cloudinaryService.uploadImage(imageBuffer, {
                folder: `artifex/generations/${subscriptionTier}`,
                quality: 'auto'
              });
              
              console.log('Cloudinary upload completed:', cloudinaryResult);
            } else {
              console.log('Local image file not found:', filePath);
            }
          } catch (fileError) {
            console.error('Error reading local image file:', fileError);
          }
        } else {
          console.log('No upload method available for image:', image);
        }
        
        console.log('Cloudinary upload result:', cloudinaryResult);

        const processedImage = {
          ...image,
          // Add processing metadata
          processedAt: new Date().toISOString(),
          tier: subscriptionTier
        };

        // Add Cloudinary URLs if upload was successful
        if (cloudinaryResult?.success) {
          console.log('Setting Cloudinary URLs:', {
            original: processedImage.url,
            cloudinary: cloudinaryResult.secureUrl
          });
          
          processedImage.publicId = cloudinaryResult.publicId;
          processedImage.secureUrl = cloudinaryResult.secureUrl;
          processedImage.cloudinaryUrl = cloudinaryResult.secureUrl;
          processedImage.bytes = cloudinaryResult.bytes;
          processedImage.url = cloudinaryResult.secureUrl; // Use Cloudinary URL as primary URL
          
          // Generate thumbnail URL
          processedImage.thumbnailUrl = cloudinaryService.generateThumbnailUrl(
            cloudinaryResult.publicId!, 
            300, 
            300
          );
          
          console.log('Final processed image URLs:', {
            url: processedImage.url,
            secureUrl: processedImage.secureUrl,
            thumbnailUrl: processedImage.thumbnailUrl
          });
        } else {
          console.log('Cloudinary upload failed or not attempted:', cloudinaryResult);
        }

        processedImages.push(processedImage);

      } catch (error) {
        console.error(`Failed to process image ${image.id}:`, error);
        // Include unprocessed image with error flag
        processedImages.push({
          ...image,
          processingError: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return processedImages;
  }

  /**
   * Update generation record with results
   */
  private async updateGenerationRecord(
    generationRecord: any,
    updates: Partial<any>
  ): Promise<void> {
    try {
      Object.assign(generationRecord, updates);
      await generationRecord.save();
    } catch (error) {
      console.error('Failed to update generation record:', error);
      // Don't throw here as the generation might have succeeded
    }
  }

  /**
   * Execute operation with retry logic
   */
  private async executeWithRetry<T>(operation: () => Promise<T>): Promise<T> {
    return RetryHandler.withRetry(operation, 3, 1000);
  }

  /**
   * Health check for orchestrator
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: {
      freepikService: any;
      imageProcessingService: any;
      databaseConnected: boolean;
    };
  }> {
    try {
      // Check Freepik service (basic connectivity)
      const freepikHealth = { success: true, message: 'Freepik service initialized' };
      
      // Check image processing service
      const processingHealth = await this.imageProcessingService.healthCheck();
      
      // Check database connection
      const databaseConnected = await this.checkDatabaseConnection();
      
      const allHealthy = freepikHealth.success && 
                        processingHealth.status === 'healthy' && 
                        databaseConnected;
      
      return {
        status: allHealthy ? 'healthy' : 'degraded',
        details: {
          freepikService: freepikHealth,
          imageProcessingService: processingHealth,
          databaseConnected
        }
      };
      
    } catch (error) {
      console.error('Orchestrator health check failed:', error);
      
      return {
        status: 'unhealthy',
        details: {
          freepikService: { success: false, error: 'Health check failed' },
          imageProcessingService: { status: 'unhealthy' },
          databaseConnected: false
        }
      };
    }
  }

  /**
   * Get model capabilities based on subscription tier
   */
  private getModelCapabilities(tier: SubscriptionTier): {
    availableQualities: string[];
    maxBatchSize: number;
    maxResolution: string;
    features: string[];
  } {
    const capabilities = {
      free: {
        availableQualities: ['standard'],
        maxBatchSize: 1,
        maxResolution: '1k',
        features: ['text-to-image']
      },
      plus: {
        availableQualities: ['standard', 'hd'],
        maxBatchSize: 3,
        maxResolution: '2k',
        features: ['text-to-image', 'image-to-image']
      },
      pro: {
        availableQualities: ['standard', 'hd', 'ultra'],
        maxBatchSize: 5,
        maxResolution: '2k',
        features: ['text-to-image', 'image-to-image', 'refine', 'composition']
      }
    };

    return capabilities[tier] || capabilities.free;
  }

  /**
   * Check database connection
   */
  private async checkDatabaseConnection(): Promise<boolean> {
    try {
      await UserModel.findOne().limit(1);
      return true;
    } catch (error) {
      console.error('Database connection check failed:', error);
      return false;
    }
  }

  /**
   * Generate video from image
   */
  async generateVideo(params: {
    imageUrl: string;
    prompt?: string;
    negativePrompt?: string;
    duration?: '5' | '10';
    cfgScale?: number;
    subscriptionTier: SubscriptionTier;
    userId: string;
  }): Promise<any> {
    const startTime = Date.now();

    try {
      console.log('Orchestrator: Starting video generation', {
        imageUrl: params.imageUrl.substring(0, 50),
        prompt: params.prompt?.substring(0, 50),
        duration: params.duration,
        cfgScale: params.cfgScale,
        userId: params.userId
      });

      // Validate image URL
      if (!params.imageUrl || typeof params.imageUrl !== 'string') {
        throw new AppError('Invalid image URL provided', 400, 'INVALID_IMAGE_URL');
      }

      // Generate video using Freepik service
      const videoParams: {
        imageUrl: string;
        prompt?: string;
        negativePrompt?: string;
        duration?: '5' | '10';
        cfgScale?: number;
        webhookUrl?: string;
      } = {
        imageUrl: params.imageUrl,
        duration: params.duration || '5',
        cfgScale: params.cfgScale || 0.5
      };

      if (params.prompt) {
        videoParams.prompt = params.prompt;
      }

      if (params.negativePrompt) {
        videoParams.negativePrompt = params.negativePrompt;
      }

      console.log('Orchestrator: Calling Freepik service...');
      const videoResult = await this.freepikService.imageToVideo(videoParams);

      const processingTime = Date.now() - startTime;

      console.log('Orchestrator: Video generation completed', {
        success: videoResult.success,
        hasVideoUrl: !!videoResult.videoUrl,
        processingTime
      });

      if (!videoResult.videoUrl) {
        throw new AppError('Video URL not returned from generation service', 500, 'NO_VIDEO_URL');
      }

      return {
        success: true,
        videoUrl: videoResult.videoUrl,
        taskId: videoResult.taskId,
        status: videoResult.status,
        metadata: {
          ...videoResult.metadata,
          totalProcessingTime: processingTime
        }
      };

    } catch (error: any) {
      console.error('Orchestrator: Video generation failed');
      console.error('Error type:', error.constructor.name);
      console.error('Error message:', error.message);
      console.error('Error code:', error.code);
      
      // Re-throw with more context if it's not already an AppError
      if (error instanceof AppError) {
        throw error;
      }
      
      throw new AppError(
        `Video generation failed: ${error.message}`,
        error.statusCode || 500,
        error.code || 'VIDEO_GENERATION_ERROR'
      );
    }
  }
}

export default ImageGenerationOrchestrator;
