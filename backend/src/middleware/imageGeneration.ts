import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import { logger } from '../utils/logger';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    subscriptionStatus?: string;
  };
}

// Create uploads and temp directories if they don't exist
const uploadsDir = path.join(__dirname, '../../uploads');
const tempDir = path.join(__dirname, '../../public/temp');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Configure multer storage for temporary files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempDir); // Store in temp directory
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${extension}`);
  }
});

// File filter for images
const imageFileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, and WebP images are allowed'));
  }
};

// Get subscription-based file size limits
const getFileSizeLimit = (subscriptionStatus?: string): number => {
  switch (subscriptionStatus) {
    case 'pro':
      return 50 * 1024 * 1024; // 50MB
    case 'plus':
      return 20 * 1024 * 1024; // 20MB
    case 'free':
    default:
      return 10 * 1024 * 1024; // 10MB
  }
};

// Get subscription-based file count limits
const getFileCountLimit = (subscriptionStatus?: string): number => {
  switch (subscriptionStatus) {
    case 'pro':
      return 10;
    case 'plus':
      return 5;
    case 'free':
    default:
      return 3;
  }
};

// Dynamic multer configuration based on user subscription
const createMulterUpload = (req: AuthenticatedRequest) => {
  const fileSize = getFileSizeLimit(req.user?.subscriptionStatus);
  
  return multer({
    storage,
    fileFilter: imageFileFilter,
    limits: {
      fileSize,
      files: getFileCountLimit(req.user?.subscriptionStatus)
    }
  });
};

/**
 * Middleware for single image upload (image-to-image, refine)
 */
export const uploadSingleImage = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  try {
    const upload = createMulterUpload(req);
    const singleUpload = upload.single('sourceImage');

    singleUpload(req, res, (error) => {
      // use an async IIFE so the Multer callback remains synchronous (returns void)
      (async () => {
        if (error) {
          if (error instanceof multer.MulterError) {
            if (error.code === 'LIMIT_FILE_SIZE') {
              res.status(400).json({
                success: false,
                message: `File size exceeds limit of ${getFileSizeLimit(req.user?.subscriptionStatus) / (1024 * 1024)}MB`
              });
              return;
            }
            if (error.code === 'LIMIT_FILE_COUNT') {
              res.status(400).json({
                success: false,
                message: 'Too many files uploaded'
              });
              return;
            }
          }

          logger.error('File upload error', error);
          res.status(400).json({
            success: false,
            message: error.message || 'File upload failed'
          });
          return;
        }

        if (!req.file) {
          res.status(400).json({
            success: false,
            message: 'No image file provided'
          });
          return;
        }

        // Validate image dimensions and format
        try {
          const metadata = await sharp(req.file.path).metadata();

          // Check minimum dimensions
          if (!metadata.width || !metadata.height || metadata.width < 64 || metadata.height < 64) {
            // Clean up uploaded file
            fs.unlinkSync(req.file.path);
            res.status(400).json({
              success: false,
              message: 'Image must be at least 64x64 pixels'
            });
            return;
          }

          // Check maximum dimensions based on subscription
          const maxDimension = req.user?.subscriptionStatus === 'pro' ? 4096 : 
                              req.user?.subscriptionStatus === 'plus' ? 2048 : 1024;

          if (metadata.width > maxDimension || metadata.height > maxDimension) {
            // Clean up uploaded file
            fs.unlinkSync(req.file.path);
            res.status(400).json({
              success: false,
              message: `Image dimensions must not exceed ${maxDimension}x${maxDimension} pixels`
            });
            return;
          }

          logger.info('Single image uploaded successfully', {
            filename: req.file.filename,
            size: req.file.size,
            dimensions: `${metadata.width}x${metadata.height}`,
            userId: req.user?.id
          });

          next();
          return;
        } catch (imageError) {
          // Clean up uploaded file if validation fails
          if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
          }

          logger.error('Image validation error', imageError as Error);
          res.status(400).json({
            success: false,
            message: 'Invalid image file'
          });
          return;
        }
      })().catch((e) => {
        logger.error('Upload processing error', e as Error);
        res.status(500).json({ success: false, message: 'Internal server error during file upload' });
      });
    });
  } catch (error) {
    logger.error('Upload middleware error', error as Error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during file upload'
    });
  }
};

/**
 * Middleware for multiple image upload (multi-image composition)
 */
export const uploadMultipleImages = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  try {
    const upload = createMulterUpload(req);
    const multipleUpload = upload.array('images', getFileCountLimit(req.user?.subscriptionStatus));

    multipleUpload(req, res, (error) => {
      (async () => {
        if (error) {
          if (error instanceof multer.MulterError) {
            if (error.code === 'LIMIT_FILE_SIZE') {
              res.status(400).json({
                success: false,
                message: `File size exceeds limit of ${getFileSizeLimit(req.user?.subscriptionStatus) / (1024 * 1024)}MB`
              });
              return;
            }
            if (error.code === 'LIMIT_FILE_COUNT') {
              res.status(400).json({
                success: false,
                message: `Too many files uploaded. Maximum allowed: ${getFileCountLimit(req.user?.subscriptionStatus)}`
              });
              return;
            }
          }

          logger.error('Multiple file upload error', error);
          res.status(400).json({
            success: false,
            message: error.message || 'File upload failed'
          });
          return;
        }

        const files = req.files as Express.Multer.File[];

        if (!files || files.length === 0) {
          res.status(400).json({
            success: false,
            message: 'No image files provided'
          });
          return;
        }

      if (files.length < 2) {
        // Clean up uploaded files
        files.forEach(file => {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        });
        
        return res.status(400).json({
          success: false,
          message: 'At least 2 images are required for composition'
        });
      }

      // Validate all uploaded images
      try {
        const maxDimension = req.user?.subscriptionStatus === 'pro' ? 4096 : 
                            req.user?.subscriptionStatus === 'plus' ? 2048 : 1024;

        for (const file of files) {
          const metadata = await sharp(file.path).metadata();
          
          // Check minimum dimensions
          if (!metadata.width || !metadata.height || metadata.width < 64 || metadata.height < 64) {
            // Clean up all uploaded files
            files.forEach(f => {
              if (fs.existsSync(f.path)) {
                fs.unlinkSync(f.path);
              }
            });
            
            return res.status(400).json({
              success: false,
              message: 'All images must be at least 64x64 pixels'
            });
          }

          // Check maximum dimensions
          if (metadata.width > maxDimension || metadata.height > maxDimension) {
            // Clean up all uploaded files
            files.forEach(f => {
              if (fs.existsSync(f.path)) {
                fs.unlinkSync(f.path);
              }
            });
            
            return res.status(400).json({
              success: false,
              message: `All images must not exceed ${maxDimension}x${maxDimension} pixels`
            });
          }
        }

          logger.info('Multiple images uploaded successfully', {
            count: files.length,
            sizes: files.map(f => f.size),
            userId: req.user?.id
          });

          next();
          return;
        } catch (imageError) {
        // Clean up uploaded files if validation fails
        files.forEach(file => {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        });
        
          logger.error('Multiple image validation error', imageError as Error);
          res.status(400).json({
            success: false,
            message: 'One or more invalid image files'
          });
          return;
        }
      })().catch((e) => {
        logger.error('Multiple upload processing error', e as Error);
        res.status(500).json({ success: false, message: 'Internal server error during file upload' });
      });
    });
  } catch (error) {
    logger.error('Multiple upload middleware error', error as Error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during file upload'
    });
  }
};

/**
 * Middleware to clean up uploaded files after processing
 */
export const cleanupUploadedFiles = (req: Request, res: Response, next: NextFunction) => {
  const originalSend = res.send.bind(res);
  
  res.send = function(body: any) {
    // Clean up single file
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
      logger.debug('Cleaned up uploaded file', { path: req.file.path });
    }
    
    // Clean up multiple files
    const files = req.files as Express.Multer.File[];
    if (files && Array.isArray(files)) {
      files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
          logger.debug('Cleaned up uploaded file', { path: file.path });
        }
      });
    }
    
    return originalSend(body);
  };
  
  next();
};

/**
 * Middleware to validate subscription limits for image generation
 */
export const validateSubscriptionLimits = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    const subscriptionStatus = req.user?.subscriptionStatus;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    // Simple quota check - in a real implementation, this would check the database
    const quotaCheck = {
      allowed: true,
      remaining: 10,
      message: 'Quota available'
    };

    // Add quota info to request for use in controllers
    (req as any).quotaInfo = quotaCheck;

    logger.info('Subscription limits validated', {
      userId,
      subscriptionStatus,
      remaining: quotaCheck.remaining
    });

    next();
    return;
  } catch (error) {
    logger.error('Subscription validation error', error as Error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during subscription validation'
    });
    return;
  }
};

export default {
  uploadSingleImage,
  uploadMultipleImages,
  cleanupUploadedFiles,
  validateSubscriptionLimits
};