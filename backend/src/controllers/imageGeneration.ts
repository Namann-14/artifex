import { Request, Response } from 'express';
import { ImageGenerationOrchestrator } from '../services/imageGenerationOrchestrator';
import { logger } from '../utils/logger';
import { SubscriptionTier } from '../types';
import { UserModel } from '../models/User';
import { ImageGenerationModel } from '../models/ImageGeneration';
import fs from 'fs';

export class ImageGenerationController {
  private orchestrator: ImageGenerationOrchestrator;

  constructor() {
    this.orchestrator = new ImageGenerationOrchestrator();
  }

  private async ensureUserExists(clerkId: string): Promise<any> {
    let user = await UserModel.findByClerkId(clerkId);
    
    if (!user) {
      // Create a basic user record if it doesn't exist
      try {
        // Generate a unique username based on clerkId to avoid duplicates
        const uniqueUsername = `user_${clerkId.slice(-8)}`;
        
        user = await UserModel.create({
          clerkId,
          email: `${clerkId}@temp.example.com`, // Temporary email, should be updated via webhook
          name: `User_${clerkId.slice(-8)}`, // Make name unique too
          username: uniqueUsername, // Explicitly set unique username
          subscriptionTier: 'free',
          monthlyUsage: 0,
          totalImagesGenerated: 0,
          isActive: true,
          emailVerified: false,
          preferences: {
            defaultImageSize: '1024x1024',
            defaultStyle: 'realistic',
            emailNotifications: true,
            marketingEmails: false,
            theme: 'auto',
            language: 'en'
          }
        });
        console.log('Created new user record for Clerk ID:', clerkId, 'with username:', uniqueUsername);
      } catch (error: any) {
        console.error('Failed to create user:', error);
        
        // If it's still a duplicate key error, it might be an existing user - try to find again
        if (error.code === 11000) {
          console.log('Duplicate key error, attempting to find existing user for Clerk ID:', clerkId);
          user = await UserModel.findByClerkId(clerkId);
          if (!user) {
            throw new Error('User creation failed due to duplicate key and user not found');
          }
        } else {
          throw new Error('Failed to create user record');
        }
      }
    }
    
    return user;
  }

  private createPermissions(subscriptionTier: SubscriptionTier) {
    return {
      maxImageGenerations: subscriptionTier === 'free' ? 10 : subscriptionTier === 'plus' ? 100 : 1000,
      allowsHighResolution: subscriptionTier !== 'free',
      allowsAdvancedFeatures: subscriptionTier === 'pro',
      allowsCommercialUse: subscriptionTier === 'pro',
      allowsAPIAccess: true,
      allowsPriorityProcessing: subscriptionTier === 'pro',
      maxConcurrentGenerations: subscriptionTier === 'free' ? 1 : subscriptionTier === 'plus' ? 3 : 5,
      allowsCustomModels: subscriptionTier === 'pro',
      allowsBatchProcessing: subscriptionTier !== 'free',
      allowsImageUpscaling: subscriptionTier !== 'free'
    };
  }

  private createContext(userId: string, subscriptionTier: SubscriptionTier, request: any, quotaInfo?: any) {
    return {
      userId,
      subscriptionTier,
      quotaInfo: quotaInfo || { remaining: 10, resetDate: new Date() },
      subscriptionInfo: {
        userId,
        tier: subscriptionTier,
        status: 'active' as any,
        isActive: true,
        isInTrial: false,
        hasExpired: false,
        features: [],
        permissions: this.createPermissions(subscriptionTier)
      },
      request: {
        ...request,
        subscriptionTier,
        userId
      }
    };
  }

  private async saveGenerationHistory(
    userId: string,
    type: 'text-to-image' | 'image-to-image' | 'multi-image-composition' | 'refine-image',
    prompt: string,
    result: any,
    inputParameters: any,
    sourceImages?: any[]
  ): Promise<void> {
    try {
      // Map type to schema-compatible values
      const typeMap: { [key: string]: string } = {
        'text-to-image': 'text-to-image',
        'image-to-image': 'image-to-image', 
        'multi-image-composition': 'multi-image',
        'refine-image': 'refine'
      };

      const generationData: any = {
        userId,
        type: typeMap[type] || 'text-to-image',
        prompt,
        negativePrompt: inputParameters.negativePrompt,
        style: inputParameters.style || 'realistic',
        aspectRatio: inputParameters.aspectRatio || '1:1',
        quality: inputParameters.quality || 'standard',
        modelName: 'gemini-2.0-flash-exp',
        seed: inputParameters.seed,
        steps: 30,
        guidance: 7.5,
        inputImages: sourceImages?.map(img => img.secureUrl || img.url).filter(Boolean) || [],
        outputImages: result.data?.images?.map((img: any) => ({
          url: img.secureUrl || img.url,
          width: img.width || 1024,
          height: img.height || 1024,
          format: img.format || 'png',
          fileSize: img.bytes || 0,
          storageKey: img.publicId || img.id || `generated-${Date.now()}`,
          thumbnailUrl: img.thumbnailUrl || img.url,
          publicId: img.publicId || '',
          secureUrl: img.secureUrl || img.url,
          cloudinaryUrl: img.secureUrl || img.url,
          bytes: img.bytes || 0
        })) || [],
        processingTimeMs: result.data?.usage?.processingTime || 0,
        cost: 0,
        credits: result.data?.usage?.credits || 1,
        metadata: {
          model: 'gemini-2.0-flash-exp',
          version: '1.0',
          parameters: {
            prompt,
            style: inputParameters.style,
            quality: inputParameters.quality,
            aspectRatio: inputParameters.aspectRatio
          },
          processingNode: 'cloud',
          actualTime: result.data?.usage?.processingTime || 0
        },
        status: result.success ? 'completed' : 'failed',
        errorMessage: result.success ? undefined : result.error?.message,
        isFavorite: false,
        isPublic: false,
        tags: []
      };

      console.log('Saving generation data:', JSON.stringify(generationData, null, 2));
      const savedGeneration = await ImageGenerationModel.create(generationData);
      console.log('Generation saved with ID:', savedGeneration._id);
      logger.info('Generation history saved successfully', { userId, type, id: savedGeneration._id });
    } catch (error) {
      console.error('Failed to save generation history:', error);
      logger.error('Failed to save generation history', error as Error);
      // Don't throw error to avoid breaking the main flow
    }
  }

  /**
   * Generate image from text prompt
   */
  async textToImage(req: Request, res: Response): Promise<void> {
    try {
      const { prompt, aspectRatio, style, quality, seed, negativePrompt } = req.body;
      const userId = req.auth?.userId || req.user?.id;

      if (!userId) {
        console.log('No userId found in request:', { 
          hasAuth: !!req.auth, 
          authUserId: req.auth?.userId, 
          hasUser: !!req.user,
          userUserId: req.user?.id 
        });
        res.status(401).json({ 
          success: false, 
          message: 'Authentication required - no user ID found' 
        });
        return;
      }

      console.log('Text-to-image request from user:', userId);

      // Ensure user exists in database
      const user = await this.ensureUserExists(userId);
      const subscriptionTier = user.subscriptionTier as SubscriptionTier;

      logger.info('Text-to-image generation request', {
        userId,
        prompt: prompt.substring(0, 100),
        aspectRatio,
        style,
        quality
      });

      const context = this.createContext(userId, subscriptionTier, {
        prompt,
        aspectRatio,
        style,
        quality,
        seed,
        negativePrompt
      }, (req as any).quotaInfo);

      const result = await this.orchestrator.generateTextToImage(context);

      // Save generation history regardless of success/failure
      await this.saveGenerationHistory(
        userId,
        'text-to-image',
        prompt,
        result,
        { prompt, aspectRatio, style, quality, seed, negativePrompt }
      );

      if (!result.success) {
        res.status(400).json({
          success: false,
          message: result.error?.message || 'Image generation failed'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          images: result.data?.images || [],
          metadata: result.data?.metadata,
          usage: result.data?.usage
        }
      });

    } catch (error) {
      logger.error('Text-to-image generation error', error as Error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during image generation'
      });
    }
  }

  /**
   * Transform existing image with text prompt
   */
  async imageToImage(req: Request, res: Response): Promise<void> {
    try {
      const { prompt, transformationType, strength } = req.body;
      const userId = req.auth?.userId || req.user?.id;
      const sourceImage = req.file;

      if (!userId) {
        res.status(401).json({ 
          success: false, 
          message: 'Authentication required' 
        });
        return;
      }

      if (!sourceImage) {
        res.status(400).json({
          success: false,
          message: 'Source image is required'
        });
        return;
      }

      const subscriptionTier = (req.user?.subscriptionStatus || 'free') as SubscriptionTier;

      logger.info('Image-to-image generation request', {
        userId,
        prompt: prompt.substring(0, 100),
        transformationType,
        strength,
        sourceImageSize: sourceImage.size
      });

      const context = this.createContext(userId, subscriptionTier, {
        prompt,
        transformationType,
        strength
      }, (req as any).quotaInfo);

      // Read the uploaded image file and pass the path for Gemini service
      const imageBuffer = fs.readFileSync(sourceImage.path);
      const inputImageType = sourceImage.mimetype;
      const tempImagePath = sourceImage.path;

      let result;
      try {
        // Pass the temp image path to the orchestrator for Gemini processing
        result = await this.orchestrator.generateImageToImage(context, imageBuffer, inputImageType, tempImagePath);
      } finally {
        // Clean up the temporary file after processing (success or failure)
        try {
          if (fs.existsSync(tempImagePath)) {
            fs.unlinkSync(tempImagePath);
            logger.info('Cleaned up temporary image file', { path: tempImagePath });
          }
        } catch (cleanupError) {
          logger.warn('Failed to clean up temporary file', { path: tempImagePath, error: cleanupError });
        }
      }

      // Save generation history with source image info
      const sourceImageInfo = [{
        originalName: sourceImage.originalname,
        bytes: sourceImage.size
      }];
      
      await this.saveGenerationHistory(
        userId,
        'image-to-image',
        prompt,
        result,
        { prompt, transformationType, strength },
        sourceImageInfo
      );

      if (!result.success) {
        res.status(400).json({
          success: false,
          message: result.error?.message || 'Image generation failed'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          images: result.data?.images || [],
          metadata: result.data?.metadata,
          usage: result.data?.usage
        }
      });

    } catch (error) {
      logger.error('Image-to-image generation error', error as Error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during image generation'
      });
    }
  }

  /**
   * Compose multiple images into single output
   */
  async multiImageComposition(req: Request, res: Response): Promise<void> {
    try {
      const { prompt, compositionType, layout } = req.body;
      const userId = req.auth?.userId || req.user?.id;
      const sourceImages = req.files as Express.Multer.File[];

      if (!userId) {
        res.status(401).json({ 
          success: false, 
          message: 'Authentication required' 
        });
        return;
      }

      if (!sourceImages || sourceImages.length === 0) {
        res.status(400).json({
          success: false,
          message: 'At least one source image is required'
        });
        return;
      }

      const subscriptionTier = (req.user?.subscriptionStatus || 'free') as SubscriptionTier;

      logger.info('Multi-image composition request', {
        userId,
        prompt: prompt.substring(0, 100),
        compositionType,
        layout,
        imageCount: sourceImages.length
      });

      const context = this.createContext(userId, subscriptionTier, {
        prompt,
        compositionType,
        layout
      }, (req as any).quotaInfo);

      // Read all uploaded image files
      const inputImages = sourceImages.map(file => ({
        data: fs.readFileSync(file.path),
        type: file.mimetype,
        description: file.originalname
      }));

      let result;
      try {
        result = await this.orchestrator.generateMultiImageComposition(context, inputImages);
      } finally {
        // Clean up temporary files after processing
        sourceImages.forEach(file => {
          try {
            if (fs.existsSync(file.path)) {
              fs.unlinkSync(file.path);
              logger.info('Cleaned up temporary image file', { path: file.path });
            }
          } catch (cleanupError) {
            logger.warn('Failed to clean up temporary file', { path: file.path, error: cleanupError });
          }
        });
      }

      // Save generation history with source images info
      const sourceImagesInfo = sourceImages.map(img => ({
        originalName: img.originalname,
        bytes: img.size
      }));
      
      await this.saveGenerationHistory(
        userId,
        'multi-image-composition',
        prompt,
        result,
        { prompt, compositionType, layout },
        sourceImagesInfo
      );

      if (!result.success) {
        res.status(400).json({
          success: false,
          message: result.error?.message || 'Image generation failed'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          images: result.data?.images || [],
          metadata: result.data?.metadata,
          usage: result.data?.usage
        }
      });

    } catch (error) {
      logger.error('Multi-image composition error', error as Error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during image generation'
      });
    }
  }

  /**
   * Refine existing image with detailed adjustments
   */
  async refineImage(req: Request, res: Response): Promise<void> {
    try {
      const { 
        prompt, 
        refinementType, 
        adjustments, 
        preserveAspectRatio 
      } = req.body;
      const userId = req.auth?.userId || req.user?.id;
      const sourceImage = req.file;

      if (!userId) {
        res.status(401).json({ 
          success: false, 
          message: 'Authentication required' 
        });
        return;
      }

      if (!sourceImage) {
        res.status(400).json({
          success: false,
          message: 'Source image is required'
        });
        return;
      }

      const subscriptionTier = (req.user?.subscriptionStatus || 'free') as SubscriptionTier;

      logger.info('Image refinement request', {
        userId,
        prompt: prompt?.substring(0, 100),
        refinementType,
        adjustments,
        preserveAspectRatio,
        sourceImageSize: sourceImage.size
      });

      const context = this.createContext(userId, subscriptionTier, {
        prompt,
        refinementType,
        adjustments,
        preserveAspectRatio
      }, (req as any).quotaInfo);

      // Read the uploaded image file  
      const imageBuffer = fs.readFileSync(sourceImage.path);
      const inputImageType = sourceImage.mimetype;
      const tempImagePath = sourceImage.path;

      let result;
      try {
        result = await this.orchestrator.refineImage(
          context, 
          imageBuffer, 
          inputImageType, 
          refinementType || 'enhance'
        );
      } finally {
        // Clean up the temporary file after processing
        try {
          if (fs.existsSync(tempImagePath)) {
            fs.unlinkSync(tempImagePath);
            logger.info('Cleaned up temporary image file', { path: tempImagePath });
          }
        } catch (cleanupError) {
          logger.warn('Failed to clean up temporary file', { path: tempImagePath, error: cleanupError });
        }
      }

      // Save generation history with source image info
      const sourceImageInfo = [{
        originalName: sourceImage.originalname,
        bytes: sourceImage.size
      }];
      
      await this.saveGenerationHistory(
        userId,
        'refine-image',
        prompt,
        result,
        { prompt, refinementType, adjustments, preserveAspectRatio },
        sourceImageInfo
      );

      if (!result.success) {
        res.status(400).json({
          success: false,
          message: result.error?.message || 'Image refinement failed'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          images: result.data?.images || [],
          metadata: result.data?.metadata,
          usage: result.data?.usage
        }
      });

    } catch (error) {
      logger.error('Image refinement error', error as Error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during image refinement'
      });
    }
  }

  /**
   * Get generation history for user
   */
  async getGenerationHistory(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.auth?.userId || req.user?.id;
      const { page = 1, limit = 20, type, status, isFavorite } = req.query;

      if (!userId) {
        res.status(401).json({ 
          success: false, 
          message: 'Authentication required' 
        });
        return;
      }

      logger.info('Generation history request', {
        userId,
        page,
        limit,
        type,
        status,
        isFavorite
      });

      const options = {
        page: Number(page),
        limit: Math.min(Number(limit), 100), // Cap at 100
        type: type as string,
        status: status as string,
        isFavorite: isFavorite === 'true' ? true : isFavorite === 'false' ? false : undefined,
        sortBy: 'createdAt',
        sortOrder: 'desc' as const
      };

      const result = await ImageGenerationModel.findByUserId(userId, options);

      res.status(200).json({
        success: true,
        data: {
          generations: result.generations,
          pagination: {
            page: result.page,
            limit: Number(limit),
            total: result.total,
            totalPages: result.totalPages,
            hasNext: result.page < result.totalPages,
            hasPrev: result.page > 1
          }
        }
      });

    } catch (error) {
      logger.error('Get generation history error', error as Error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while retrieving history'
      });
    }
  }

  /**
   * Get user's current generation quota and usage
   */
  async getQuotaStatus(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.auth?.userId || req.user?.id;

      if (!userId) {
        res.status(401).json({ 
          success: false, 
          message: 'Authentication required' 
        });
        return;
      }

      logger.info('Quota status request', { userId });

      const subscriptionTier = (req.user?.subscriptionStatus || 'free') as SubscriptionTier;

      // For now, return a placeholder response
      res.status(200).json({
        success: true,
        data: {
          subscription: subscriptionTier,
          current: {
            images: 0,
            credits: 10
          },
          limits: {
            images: subscriptionTier === 'free' ? 10 : subscriptionTier === 'plus' ? 100 : 1000,
            credits: subscriptionTier === 'free' ? 50 : subscriptionTier === 'plus' ? 500 : 5000,
            fileSize: subscriptionTier === 'free' ? 10485760 : subscriptionTier === 'plus' ? 20971520 : 52428800,
            maxDimensions: subscriptionTier === 'free' ? 1024 : subscriptionTier === 'plus' ? 2048 : 4096,
            multiImageCount: subscriptionTier === 'free' ? 3 : subscriptionTier === 'plus' ? 5 : 10
          },
          resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          usage: {
            daily: 0,
            weekly: 0,
            monthly: 0
          }
        }
      });

    } catch (error) {
      logger.error('Get quota status error', error as Error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while retrieving quota'
      });
    }
  }
}

// Export singleton instance
export const imageGenerationController = new ImageGenerationController();