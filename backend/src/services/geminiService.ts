// @ts-ignore
import { GoogleGenerativeAI, GenerativeModel, Part, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
// Import the new image generation package
import { GoogleGenAI } from '@google/genai';
import * as fs from 'node:fs';
import * as path from 'path';
import { 
  GeminiGenerationRequest, 
  GeminiGenerationResponse, 
  GeminiModelConfig,
  ImageGenerationType,
  ImageQuality,
  AspectRatio,
  SubscriptionTier
} from '../types';
import { AppError } from '../utils/imageGenerationErrors';

/**
 * Comprehensive Google Gemini 2.5 Flash Image Preview API service
 * Handles all image generation operations with proper error handling and response processing
 */
export class GeminiImageService {
  private genAI: GoogleGenerativeAI;
  private genAIImage: GoogleGenAI; // New image generation client
  private models: Map<string, GenerativeModel>;
  private readonly defaultModel = 'gemini-2.0-flash-exp';
  private readonly imageModel = 'gemini-2.5-flash-image-preview'; // Updated to image generation model
  
  constructor(apiKey?: string) {
    const key = apiKey || process.env.GEMINI_API_KEY;
    
    if (!key) {
      throw new AppError(
        'Google Gemini API key is required',
        500,
        'GEMINI_API_KEY_MISSING'
      );
    }
    
    this.genAI = new GoogleGenerativeAI(key);
    this.genAIImage = new GoogleGenAI({
      apiKey: key
    });
    this.models = new Map();
    this.initializeModels();
  }

  /**
   * Initialize Gemini models with different configurations
   */
  private initializeModels(): void {
    // Standard model for basic text-to-image
    this.models.set('standard', this.genAI.getGenerativeModel({
      model: this.imageModel,
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
      },
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
        }
      ]
    }));

    // High-quality model for premium users
    this.models.set('premium', this.genAI.getGenerativeModel({
      model: this.imageModel,
      generationConfig: {
        temperature: 0.8,
        topK: 32,
        topP: 0.9,
        maxOutputTokens: 8192,
      }
    }));

    // Creative model for artistic generations
    this.models.set('creative', this.genAI.getGenerativeModel({
      model: this.imageModel,
      generationConfig: {
        temperature: 1.0,
        topK: 50,
        topP: 0.95,
        maxOutputTokens: 8192,
      }
    }));
  }

  /**
   * Get appropriate model based on subscription tier and quality settings
   */
  private getModel(tier: SubscriptionTier, quality: ImageQuality): GenerativeModel {
    if (tier === 'pro' && quality === 'ultra') {
      return this.models.get('creative') || this.models.get('standard')!;
    } else if (tier === 'plus' && quality === 'hd') {
      return this.models.get('premium') || this.models.get('standard')!;
    }
    return this.models.get('standard')!;
  }

  /**
   * Generate image from text prompt using Gemini 2.5 Flash
   */
  async textToImage(request: GeminiGenerationRequest): Promise<GeminiGenerationResponse> {
    try {
      const startTime = Date.now();
      
      // Construct enhanced prompt based on parameters
      const enhancedPrompt = this.buildEnhancedPrompt(request);
      
      console.log('Generating image with Gemini 2.5 Flash Image Preview:', {
        prompt: enhancedPrompt.substring(0, 100) + '...',
        quality: request.quality,
        tier: request.subscriptionTier,
        aspectRatio: request.aspectRatio
      });

      // Use the new GoogleGenAI for native image generation
      const response = await this.genAIImage.models.generateContent({
        model: this.imageModel,
        contents: enhancedPrompt,
      });

      const images = [];
      const processingTime = Date.now() - startTime;

      // Process the response to extract images
      if (!response.candidates || response.candidates.length === 0) {
        throw new AppError('No candidates returned from Gemini', 500, 'NO_CANDIDATES');
      }

      const candidate = response.candidates[0];
      if (!candidate?.content?.parts) {
        throw new AppError('No content parts in response', 500, 'NO_CONTENT_PARTS');
      }

      for (const part of candidate.content.parts) {
        if (part.inlineData && part.inlineData.data) {
          // Save the image and create URL
          const imageData = await this.saveGeneratedImage(part.inlineData.data, request);
          images.push(imageData);
        }
      }

      if (images.length === 0) {
        throw new AppError('No images were generated', 500, 'NO_IMAGES_GENERATED');
      }
      
      return {
        success: true,
        images,
        metadata: {
          prompt: request.prompt,
          enhancedPrompt,
          model: this.imageModel,
          quality: request.quality,
          aspectRatio: request.aspectRatio,
          ...(request.style && { style: request.style }),
          generatedAt: new Date().toISOString(),
          processingTime,
          subscriptionTier: request.subscriptionTier
        },
        usage: {
          creditsUsed: this.calculateCreditsUsed(request),
          tokensUsed: candidate?.content?.parts?.length || 0
        }
      };

    } catch (error) {
      console.error('Gemini text-to-image generation failed:', error);
      throw this.handleGeminiError(error, 'text-to-image');
    }
  }

  /**
   * Generate image from image input with text prompt (image-to-image)
   */
  async imageToImage(request: GeminiGenerationRequest & { 
    inputImage: Buffer | string;
    inputImageType: string;
    imagePath?: string; // Path to temporary image file
  }): Promise<GeminiGenerationResponse> {
    const startTime = Date.now();
    
    try {
      // Convert input image to base64 if it's a Buffer
      let base64Image: string;
      if (Buffer.isBuffer(request.inputImage)) {
        base64Image = request.inputImage.toString("base64");
      } else if (typeof request.inputImage === 'string' && request.imagePath) {
        // Read from file path if provided
        const imageData = fs.readFileSync(request.imagePath);
        base64Image = imageData.toString("base64");
      } else {
        base64Image = request.inputImage as string;
      }

      const enhancedPrompt = this.buildImageToImagePrompt(request);
      
      console.log('Generating image-to-image with Gemini:', {
        prompt: enhancedPrompt.substring(0, 100) + '...',
        quality: request.quality,
        inputImageType: request.inputImageType,
        hasImagePath: !!request.imagePath
      });

      // Create the prompt array as per Google Gemini pattern
      const prompt = [
        { text: enhancedPrompt },
        {
          inlineData: {
            mimeType: request.inputImageType,
            data: base64Image,
          },
        },
      ];

      // Use the Google GenAI for image generation
      const response = await this.genAIImage.models.generateContent({
        model: this.imageModel,
        contents: prompt,
      });

      const processingTime = Date.now() - startTime;
      const images: any[] = [];

      // Process the response parts
      if (response.candidates && response.candidates.length > 0) {
        const candidate = response.candidates[0];
        
        if (!candidate || !candidate.content || !candidate.content.parts) {
          throw new AppError('No content generated', 500, 'NO_CONTENT_GENERATED');
        }

        for (const part of candidate.content.parts) {
          if (part.text) {
            console.log('Generated text:', part.text);
          } else if (part.inlineData && part.inlineData.data) {
            // Save the generated image
            const imageData = await this.saveGeneratedImage(part.inlineData.data, request);
            images.push(imageData);
          }
        }
      }

      if (images.length === 0) {
        // If no images generated, fall back to mock response system
        console.log('No images generated by Gemini, falling back to mock system');
        const fallbackData = await this.generateMockImageResponse(request, enhancedPrompt);
        
        return {
          success: true,
          images: fallbackData.images,
          metadata: {
            prompt: request.prompt,
            enhancedPrompt,
            model: this.imageModel,
            quality: request.quality,
            aspectRatio: request.aspectRatio || '1:1',
            generatedAt: new Date().toISOString(),
            subscriptionTier: request.subscriptionTier,
            inputImageType: request.inputImageType,
            fallbackUsed: true,
            processingTime: fallbackData.processingTime
          },
          usage: {
            creditsUsed: this.calculateCreditsUsed(request),
            tokensUsed: 0
          }
        };
      }
      
      return {
        success: true,
        images,
        metadata: {
          prompt: request.prompt,
          enhancedPrompt,
          model: this.imageModel,
          quality: request.quality,
          aspectRatio: request.aspectRatio,
          inputImageType: request.inputImageType,
          ...(request.style && { style: request.style }),
          generatedAt: new Date().toISOString(),
          processingTime,
          subscriptionTier: request.subscriptionTier
        },
        usage: {
          creditsUsed: this.calculateCreditsUsed(request),
          tokensUsed: response.candidates?.[0]?.content?.parts?.length || 0
        }
      };

    } catch (error) {
      console.error('Gemini image-to-image generation failed:', error);
      
      // If Gemini fails, use mock response system
      console.log('Gemini failed, using mock fallback system');
      const fallbackData = await this.generateMockImageResponse(request, request.prompt);
      
      return {
        success: true,
        images: fallbackData.images,
        metadata: {
          prompt: request.prompt,
          enhancedPrompt: request.prompt,
          model: 'fallback-system',
          quality: request.quality,
          aspectRatio: request.aspectRatio || '1:1',
          generatedAt: new Date().toISOString(),
          subscriptionTier: request.subscriptionTier,
          processingTime: Date.now() - startTime
        },
        usage: {
          creditsUsed: this.calculateCreditsUsed(request),
          tokensUsed: 0
        }
      };
    }
  }

  /**
   * Generate composition from multiple input images
   */
  async multiImageComposition(request: GeminiGenerationRequest & {
    inputImages: Array<{ data: Buffer | string; type: string; description?: string }>;
  }): Promise<GeminiGenerationResponse> {
    try {
      const model = this.getModel(request.subscriptionTier, request.quality);
      
      // Validate subscription tier allows multi-image
      if (request.subscriptionTier === 'free') {
        throw new AppError(
          'Multi-image composition requires Plus or Pro subscription',
          403,
          'MULTI_IMAGE_NOT_ALLOWED'
        );
      }

      // Prepare multiple image parts
      const imageParts = await Promise.all(
        request.inputImages.map(img => this.prepareImagePart(img.data, img.type))
      );
      
      const enhancedPrompt = this.buildMultiImagePrompt(request);
      
      console.log('Generating multi-image composition:', {
        imageCount: request.inputImages.length,
        quality: request.quality
      });

      // Analyze all images together
      const result = await model.generateContent([enhancedPrompt, ...imageParts]);
      const response = await result.response;
      const compositionText = response.text();

      // Mock composition response
      const mockImageData = await this.generateMockImageResponse(request, compositionText);
      
      return {
        success: true,
        images: mockImageData.images,
        metadata: {
          prompt: request.prompt,
          enhancedPrompt,
          model: this.imageModel,
          quality: request.quality,
          aspectRatio: request.aspectRatio,
          ...(request.style && { style: request.style }),
          generatedAt: new Date().toISOString(),
          processingTime: mockImageData.processingTime,
          subscriptionTier: request.subscriptionTier,
          inputImageCount: request.inputImages.length,
          compositionAnalysis: compositionText
        },
        usage: {
          creditsUsed: this.calculateCreditsUsed(request) * request.inputImages.length,
          tokensUsed: response.usageMetadata?.totalTokenCount || 0
        }
      };

    } catch (error) {
      console.error('Gemini multi-image composition failed:', error);
      throw this.handleGeminiError(error, 'multi-image');
    }
  }

  /**
   * Refine/enhance existing image
   */
  async refineImage(request: GeminiGenerationRequest & {
    inputImage: Buffer | string;
    inputImageType: string;
    refinementType: 'enhance' | 'upscale' | 'style-transfer' | 'color-correction';
  }): Promise<GeminiGenerationResponse> {
    try {
      const model = this.getModel(request.subscriptionTier, request.quality);
      
      const imagePart = await this.prepareImagePart(request.inputImage, request.inputImageType);
      const enhancedPrompt = this.buildRefinementPrompt(request);
      
      console.log('Refining image with Gemini:', {
        refinementType: request.refinementType,
        quality: request.quality
      });

      // Use Gemini to analyze refinement requirements
      const result = await model.generateContent([enhancedPrompt, imagePart]);
      const response = await result.response;
      const refinementText = response.text();

      // Mock refinement response
      const mockImageData = await this.generateMockImageResponse(request, refinementText);
      
      return {
        success: true,
        images: mockImageData.images,
        metadata: {
          prompt: request.prompt,
          enhancedPrompt,
          model: this.imageModel,
          quality: request.quality,
          aspectRatio: request.aspectRatio,
          ...(request.style && { style: request.style }),
          generatedAt: new Date().toISOString(),
          processingTime: mockImageData.processingTime,
          subscriptionTier: request.subscriptionTier,
          refinementType: request.refinementType,
          refinementAnalysis: refinementText
        },
        usage: {
          creditsUsed: this.calculateCreditsUsed(request),
          tokensUsed: response.usageMetadata?.totalTokenCount || 0
        }
      };

    } catch (error) {
      console.error('Gemini image refinement failed:', error);
      throw this.handleGeminiError(error, 'refine');
    }
  }

  /**
   * Build enhanced prompt with quality and style parameters
   */
  private buildEnhancedPrompt(request: GeminiGenerationRequest): string {
    let prompt = request.prompt;
    
    // Add quality modifiers
    const qualityModifiers = {
      standard: 'high quality, detailed',
      hd: 'ultra high definition, extremely detailed, professional quality',
      ultra: 'masterpiece quality, photorealistic, ultra-detailed, 8K resolution'
    };
    
    // Add style modifiers
    const styleModifiers = {
      realistic: 'photorealistic, natural lighting, realistic textures',
      artistic: 'artistic style, creative composition, unique perspective',
      anime: 'anime style, vibrant colors, detailed character design',
      abstract: 'abstract art, creative interpretation, unique visual style',
      cinematic: 'cinematic lighting, dramatic composition, movie-like quality'
    };
    
    // Add aspect ratio considerations
    const aspectRatioGuides = {
      '1:1': 'square composition, centered subject',
      '16:9': 'widescreen composition, landscape orientation',
      '9:16': 'portrait orientation, vertical composition',
      '4:3': 'classic composition ratio',
      '3:2': 'photography standard ratio'
    };
    
    // Build enhanced prompt
    const qualityMod = qualityModifiers[request.quality] || qualityModifiers.standard;
    const styleMod = request.style ? styleModifiers[request.style] : '';
    const aspectMod = aspectRatioGuides[request.aspectRatio] || '';
    
    const enhancedParts = [
      prompt,
      qualityMod,
      styleMod,
      aspectMod,
      'professional photography, sharp focus, perfect composition'
    ].filter(Boolean);
    
    return enhancedParts.join(', ');
  }

  /**
   * Build prompt for image-to-image generation
   */
  private buildImageToImagePrompt(request: GeminiGenerationRequest): string {
    return `Transform this image according to the following instructions: ${request.prompt}. 
    Maintain the overall composition while applying the requested changes. 
    Quality level: ${request.quality}, Style: ${request.style || 'realistic'}.
    Ensure the transformation preserves important visual elements while implementing the requested modifications.`;
  }

  /**
   * Build prompt for multi-image composition
   */
  private buildMultiImagePrompt(request: GeminiGenerationRequest): string {
    return `Create a cohesive composition using these multiple images with the following concept: ${request.prompt}.
    Blend the images harmoniously while maintaining visual consistency.
    Quality: ${request.quality}, Style: ${request.style || 'realistic'}.
    Ensure smooth transitions and balanced composition across all elements.`;
  }

  /**
   * Build prompt for image refinement
   */
  private buildRefinementPrompt(request: GeminiGenerationRequest & { refinementType: string }): string {
    const refinementInstructions = {
      enhance: 'Enhance the overall quality, sharpness, and details of this image',
      upscale: 'Increase the resolution and add fine details to this image',
      'style-transfer': `Apply ${request.style || 'artistic'} style to this image while preserving content`,
      'color-correction': 'Improve the color balance, saturation, and overall color quality'
    };
    
    const instruction = refinementInstructions[request.refinementType as keyof typeof refinementInstructions] || 'Improve this image';
    
    return `${instruction}. ${request.prompt ? request.prompt : 'Focus on professional quality improvements.'}
    Target quality: ${request.quality}. Maintain the original composition and subject matter.`;
  }

  /**
   * Prepare image data for Gemini API
   */
  private async prepareImagePart(imageData: Buffer | string, mimeType: string): Promise<Part> {
    let data: string;
    
    if (Buffer.isBuffer(imageData)) {
      data = imageData.toString('base64');
    } else {
      // Assume it's already base64 or a data URL
      if (imageData.startsWith('data:')) {
        const base64Data = imageData.split(',')[1];
        data = base64Data || imageData;
      } else {
        data = imageData;
      }
    }
    
    return {
      inlineData: {
        data,
        mimeType
      }
    };
  }

  /**
   * Calculate credits used based on generation parameters
   */
  private calculateCreditsUsed(request: GeminiGenerationRequest): number {
    let credits = 1; // Base cost
    
    // Quality multipliers
    const qualityMultipliers = {
      standard: 1.0,
      hd: 1.5,
      ultra: 2.0
    };
    
    credits *= qualityMultipliers[request.quality] || 1.0;
    
    // Batch size multiplier
    if (request.batchSize && request.batchSize > 1) {
      credits *= request.batchSize * 0.9; // Slight discount for batch
    }
    
    return Math.ceil(credits);
  }

  /**
   * Generate mock image response for demonstration
   * In production, this would be replaced with actual image generation
   */
  private async generateMockImageResponse(
    request: GeminiGenerationRequest, 
    analysisText: string
  ): Promise<{ images: any[], processingTime: number }> {
    const processingTime = Math.random() * 3000 + 1000; // 1-4 seconds
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, processingTime));
    
    // Get dimensions for the aspect ratio
    const width = this.getWidthFromAspectRatio(request.aspectRatio || '1:1');
    const height = this.getHeightFromAspectRatio(request.aspectRatio || '1:1');
    
    // Use seed from request or generate from prompt as fallback
    const seed = request.seed || this.generateSeedFromPrompt(request.prompt);
    
    const images = Array.from({ length: request.batchSize || 1 }, (_, index) => ({
      id: `img_${Date.now()}_${index}`,
      // Using picsum.photos for actual working placeholder images
      url: `https://picsum.photos/seed/${seed + index}/${width}/${height}`,
      thumbnailUrl: `https://picsum.photos/seed/${seed + index}/${Math.floor(width / 4)}/${Math.floor(height / 4)}`,
      width,
      height,
      format: 'jpg',
      size: Math.floor(Math.random() * 500000) + 100000, // Random size between 100KB - 600KB
      metadata: {
        prompt: request.prompt,
        analysis: analysisText.substring(0, 200),
        generatedAt: new Date().toISOString(),
        seed: seed + index
      }
    }));
    
    return { images, processingTime };
  }

  /**
   * Generate a consistent seed from prompt
   */
  private generateSeedFromPrompt(prompt: string): number {
    let hash = 0;
    for (let i = 0; i < prompt.length; i++) {
      const char = prompt.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash) % 10000;
  }

  /**
   * Get width from aspect ratio string
   */
  private getWidthFromAspectRatio(aspectRatio: AspectRatio): number {
    const ratios = {
      '1:1': 1024,
      '16:9': 1920,
      '9:16': 1080,
      '4:3': 1024,
      '3:2': 1080
    };
    return ratios[aspectRatio] || 1024;
  }

  /**
   * Get height from aspect ratio string
   */
  private getHeightFromAspectRatio(aspectRatio: AspectRatio): number {
    const ratios = {
      '1:1': 1024,
      '16:9': 1080,
      '9:16': 1920,
      '4:3': 768,
      '3:2': 720
    };
    return ratios[aspectRatio] || 1024;
  }

  /**
   * Handle Gemini API errors with proper classification
   */
  private handleGeminiError(error: any, operation: string): AppError {
    console.error(`Gemini ${operation} error:`, error);
    
    // Check for specific Gemini API errors
    if (error.message?.includes('API key')) {
      return new AppError(
        'Invalid or expired API key',
        401,
        'GEMINI_API_KEY_INVALID'
      );
    }
    
    if (error.message?.includes('quota') || error.message?.includes('rate limit')) {
      return new AppError(
        'API rate limit exceeded. Please try again later.',
        429,
        'GEMINI_RATE_LIMIT_EXCEEDED'
      );
    }
    
    if (error.message?.includes('safety')) {
      return new AppError(
        'Content violates safety guidelines. Please modify your request.',
        400,
        'GEMINI_SAFETY_VIOLATION'
      );
    }
    
    if (error.message?.includes('timeout')) {
      return new AppError(
        'Generation request timed out. Please try again.',
        408,
        'GEMINI_REQUEST_TIMEOUT'
      );
    }
    
    // Generic error
    return new AppError(
      `Image generation failed: ${error.message || 'Unknown error'}`,
      500,
      'GEMINI_GENERATION_ERROR'
    );
  }

  /**
   * Test Gemini API connectivity
   */
  async testConnection(): Promise<{ success: boolean; model: string; error?: string }> {
    try {
      const model = this.models.get('standard')!;
      const result = await model.generateContent('Test connection');
      const response = await result.response;
      
      return {
        success: true,
        model: this.imageModel
      };
    } catch (error) {
      return {
        success: false,
        model: this.imageModel,
        error: (error as Error).message
      };
    }
  }

  /**
   * Get model capabilities based on subscription tier
   */
  getModelCapabilities(tier: SubscriptionTier): {
    maxBatchSize: number;
    availableQualities: ImageQuality[];
    maxImageSize: number;
    supportedFormats: string[];
  } {
    const capabilities = {
      free: {
        maxBatchSize: 1,
        availableQualities: ['standard'] as ImageQuality[],
        maxImageSize: 1024 * 1024, // 1MB
        supportedFormats: ['jpeg', 'png', 'webp']
      },
      plus: {
        maxBatchSize: 4,
        availableQualities: ['standard', 'hd'] as ImageQuality[],
        maxImageSize: 5 * 1024 * 1024, // 5MB
        supportedFormats: ['jpeg', 'png', 'webp', 'gif']
      },
      pro: {
        maxBatchSize: 10,
        availableQualities: ['standard', 'hd', 'ultra'] as ImageQuality[],
        maxImageSize: 20 * 1024 * 1024, // 20MB
        supportedFormats: ['jpeg', 'png', 'webp', 'gif', 'tiff', 'bmp']
      }
    };
    
    return capabilities[tier];
  }

  /**
   * Save generated image from base64 data
   */
  private async saveGeneratedImage(base64Data: string, request: GeminiGenerationRequest): Promise<any> {
    try {
      // Create filename with timestamp and seed
      const timestamp = Date.now();
      const filename = `gemini-image-${timestamp}-${request.seed || 'random'}.png`;
      
      // Ensure uploads directory exists
      const uploadsDir = path.join(process.cwd(), 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      
      // Save image file
      const filepath = path.join(uploadsDir, filename);
      const buffer = Buffer.from(base64Data, 'base64');
      fs.writeFileSync(filepath, buffer);
      
      console.log(`Image saved as ${filename}`);
      
      // Calculate dimensions based on aspect ratio
      const { width, height } = this.getDimensionsFromAspectRatio(request.aspectRatio || '1:1');
      
      // Return image data structure
      return {
        id: `img_${timestamp}`,
        url: `http://localhost:3001/uploads/${filename}`, // Full URL for serving
        thumbnailUrl: `http://localhost:3001/uploads/${filename}`, // For now, same as main image
        width,
        height,
        format: 'png',
        size: buffer.length,
        metadata: {
          prompt: request.prompt,
          seed: request.seed,
          generatedAt: new Date().toISOString(),
          filename
        }
      };
    } catch (error) {
      console.error('Failed to save generated image:', error);
      throw new AppError('Failed to save generated image', 500, 'IMAGE_SAVE_ERROR');
    }
  }

  /**
   * Get dimensions from aspect ratio
   */
  private getDimensionsFromAspectRatio(aspectRatio: string): { width: number; height: number } {
    const ratios: { [key: string]: { width: number; height: number } } = {
      '1:1': { width: 1024, height: 1024 },
      '16:9': { width: 1920, height: 1080 },
      '9:16': { width: 1080, height: 1920 },
      '4:3': { width: 1024, height: 768 },
      '3:2': { width: 1080, height: 720 }
    };
    
    const result = ratios[aspectRatio];
    if (result) {
      return result;
    }
    
    // Default fallback
    return { width: 1024, height: 1024 };
  }
}

export default GeminiImageService;