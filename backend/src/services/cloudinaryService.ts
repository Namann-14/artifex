import { v2 as cloudinary } from 'cloudinary';
import { logger } from '../utils/logger';

export interface CloudinaryConfig {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
}

export interface UploadOptions {
  folder?: string;
  publicId?: string;
  transformation?: any;
  resourceType?: 'image' | 'video' | 'raw' | 'auto';
  format?: string;
  quality?: string | number;
  width?: number;
  height?: number;
  crop?: string;
}

export interface CloudinaryUploadResult {
  success: boolean;
  publicId?: string;
  secureUrl?: string;
  width?: number;
  height?: number;
  format?: string;
  bytes?: number;
  error?: string;
}

export class CloudinaryService {
  private static instance: CloudinaryService;
  private isConfigured = false;

  private constructor() {
    this.configure();
  }

  public static getInstance(): CloudinaryService {
    if (!CloudinaryService.instance) {
      CloudinaryService.instance = new CloudinaryService();
    }
    return CloudinaryService.instance;
  }

  private configure(): void {
    try {
      const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
      const apiKey = process.env.CLOUDINARY_API_KEY;
      const apiSecret = process.env.CLOUDINARY_API_SECRET;

      console.log('Cloudinary configuration:', {
        cloudName: cloudName ? 'Set' : 'Missing',
        apiKey: apiKey ? 'Set' : 'Missing',
        apiSecret: apiSecret ? 'Set' : 'Missing'
      });

      if (!cloudName || !apiKey || !apiSecret) {
        logger.warn('Cloudinary environment variables not found. Image upload will be disabled.');
        console.log('Missing Cloudinary env vars:', { cloudName, apiKey, apiSecret });
        return;
      }

      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true
      });

      this.isConfigured = true;
      logger.info('Cloudinary configured successfully');
      console.log('Cloudinary is configured and ready');
    } catch (error) {
      logger.error('Failed to configure Cloudinary', error as Error);
      console.error('Cloudinary configuration error:', error);
    }
  }

  public async uploadImage(
    imageBuffer: Buffer,
    options: UploadOptions = {}
  ): Promise<CloudinaryUploadResult> {
    if (!this.isConfigured) {
      return {
        success: false,
        error: 'Cloudinary is not configured. Please check environment variables.'
      };
    }

    try {
      const uploadOptions: any = {
        resource_type: options.resourceType || 'image',
        folder: options.folder || 'artifex/generations',
        public_id: options.publicId,
        format: options.format,
        quality: options.quality || 'auto',
        transformation: options.transformation
      };

      // Add dimensions if specified
      if (options.width) uploadOptions.width = options.width;
      if (options.height) uploadOptions.height = options.height;
      if (options.crop) uploadOptions.crop = options.crop;

      // Remove undefined values
      Object.keys(uploadOptions).forEach(key => {
        if (uploadOptions[key] === undefined) {
          delete uploadOptions[key];
        }
      });

      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          uploadOptions,
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          }
        ).end(imageBuffer);
      });

      const uploadResult = result as any;

      logger.info('Image uploaded to Cloudinary successfully', {
        publicId: uploadResult.public_id,
        bytes: uploadResult.bytes,
        format: uploadResult.format
      });

      return {
        success: true,
        publicId: uploadResult.public_id,
        secureUrl: uploadResult.secure_url,
        width: uploadResult.width,
        height: uploadResult.height,
        format: uploadResult.format,
        bytes: uploadResult.bytes
      };

    } catch (error) {
      logger.error('Failed to upload image to Cloudinary', error as Error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to upload image'
      };
    }
  }

  public async uploadBase64Image(
    base64Data: string,
    options: UploadOptions = {}
  ): Promise<CloudinaryUploadResult> {
    if (!this.isConfigured) {
      return {
        success: false,
        error: 'Cloudinary is not configured. Please check environment variables.'
      };
    }

    try {
      const uploadOptions: any = {
        resource_type: options.resourceType || 'image',
        folder: options.folder || 'artifex/generations',
        public_id: options.publicId,
        format: options.format,
        quality: options.quality || 'auto',
        transformation: options.transformation
      };

      // Add dimensions if specified
      if (options.width) uploadOptions.width = options.width;
      if (options.height) uploadOptions.height = options.height;
      if (options.crop) uploadOptions.crop = options.crop;

      // Remove undefined values
      Object.keys(uploadOptions).forEach(key => {
        if (uploadOptions[key] === undefined) {
          delete uploadOptions[key];
        }
      });

      const result = await cloudinary.uploader.upload(base64Data, uploadOptions);

      logger.info('Base64 image uploaded to Cloudinary successfully', {
        publicId: result.public_id,
        bytes: result.bytes,
        format: result.format
      });

      return {
        success: true,
        publicId: result.public_id,
        secureUrl: result.secure_url,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes
      };

    } catch (error) {
      logger.error('Failed to upload base64 image to Cloudinary', error as Error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to upload image'
      };
    }
  }

  public async deleteImage(publicId: string): Promise<{ success: boolean; error?: string }> {
    if (!this.isConfigured) {
      return {
        success: false,
        error: 'Cloudinary is not configured. Please check environment variables.'
      };
    }

    try {
      const result = await cloudinary.uploader.destroy(publicId);
      
      if (result.result === 'ok') {
        logger.info('Image deleted from Cloudinary successfully', { publicId });
        return { success: true };
      } else {
        logger.warn('Failed to delete image from Cloudinary', { publicId, result });
        return { success: false, error: 'Failed to delete image' };
      }
    } catch (error) {
      logger.error('Failed to delete image from Cloudinary', error as Error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete image'
      };
    }
  }

  public generateUrl(publicId: string, transformation?: any): string {
    if (!this.isConfigured) {
      return '';
    }

    return cloudinary.url(publicId, {
      secure: true,
      transformation: transformation
    });
  }

  public generateThumbnailUrl(publicId: string, width = 300, height = 300): string {
    return this.generateUrl(publicId, {
      width,
      height,
      crop: 'fill',
      quality: 'auto',
      format: 'auto'
    });
  }

  public isReady(): boolean {
    return this.isConfigured;
  }
}

// Export singleton instance
export const cloudinaryService = CloudinaryService.getInstance();