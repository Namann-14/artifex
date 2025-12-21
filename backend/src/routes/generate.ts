import express from 'express';
import { imageGenerationController } from '../controllers/imageGeneration';
import { 
  uploadSingleImage, 
  uploadMultipleImages, 
  cleanupUploadedFiles, 
  validateSubscriptionLimits 
} from '../middleware/imageGeneration';
import { validateRequest } from '../middleware/validation';
import { requireAuthentication } from '../middleware/auth';
import { 
  textToImageSchema,
  imageToImageSchema,
  multiImageSchema,
  refineImageSchema
} from '../validation/imageGeneration';

const router = express.Router();

// Apply authentication middleware to all image generation routes
router.use(requireAuthentication);

/**
 * @route POST /api/generate/text-to-image
 * @description Generate image from text prompt
 * @access Private
 */
router.post('/text-to-image', 
  imageGenerationController.textToImage.bind(imageGenerationController)
);

// Image-to-image route removed - feature deprecated

/**
 * @route POST /api/generate/multi-image
 * @description Compose multiple images into single output
 * @access Private
 */
router.post('/multi-image',
  validateSubscriptionLimits,
  uploadMultipleImages,
  validateRequest(multiImageSchema),
  cleanupUploadedFiles,
  imageGenerationController.multiImageComposition.bind(imageGenerationController)
);

/**
 * @route POST /api/generate/refine
 * @description Refine existing image with detailed adjustments
 * @access Private
 */
router.post('/refine',
  validateSubscriptionLimits,
  uploadSingleImage,
  validateRequest(refineImageSchema),
  cleanupUploadedFiles,
  imageGenerationController.refineImage.bind(imageGenerationController)
);

/**
 * @route GET /api/generate/history
 * @description Get user's generation history
 * @access Private
 */
router.get('/history',
  imageGenerationController.getGenerationHistory.bind(imageGenerationController)
);

/**
 * @route GET /api/generate/quota
 * @description Get user's current quota status
 * @access Private
 */
router.get('/quota',
  imageGenerationController.getQuotaStatus.bind(imageGenerationController)
);

/**
 * @route POST /api/generate/enhance-prompt
 * @description Enhance a prompt using Gemini AI for better image generation
 * @access Private
 */
router.post('/enhance-prompt',
  imageGenerationController.enhancePrompt.bind(imageGenerationController)
);

/**
 * @route POST /api/generate/image-to-video
 * @description Generate video from image
 * @access Private
 */
router.post('/image-to-video',
  imageGenerationController.imageToVideo.bind(imageGenerationController)
);

/**
 * @route POST /api/generate/text-to-image/async
 * @description Queue text-to-image generation job for async processing
 * @access Private
 */
router.post('/text-to-image/async',
  imageGenerationController.textToImageAsync.bind(imageGenerationController)
);

/**
 * @route POST /api/generate/image-to-video/async
 * @description Queue video generation job for async processing
 * @access Private
 */
router.post('/image-to-video/async',
  imageGenerationController.imageToVideoAsync.bind(imageGenerationController)
);

/**
 * @route GET /api/generate/job/:jobId/status
 * @description Get status of a queued job
 * @access Private
 */
router.get('/job/:jobId/status',
  imageGenerationController.getJobStatusEndpoint.bind(imageGenerationController)
);

export default router;