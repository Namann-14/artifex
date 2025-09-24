import { Router, Request, Response } from 'express';
import { cloudinaryService } from '../services/cloudinaryService';
import fs from 'fs';
import path from 'path';

const router = Router();

/**
 * Test Cloudinary configuration and upload functionality
 */
router.get('/test', async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('Testing Cloudinary configuration...');
    
    // Check if Cloudinary is ready
    const isReady = cloudinaryService.isReady();
    console.log('Cloudinary ready status:', isReady);
    
    if (!isReady) {
      res.status(500).json({
        success: false,
        message: 'Cloudinary is not configured properly',
        isReady: false
      });
      return;
    }

    // Create a simple test image (1x1 pixel red PNG)
    const testImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
    
    console.log('Attempting to upload test image to Cloudinary...');
    
    const uploadResult = await cloudinaryService.uploadBase64Image(testImageBase64, {
      folder: 'artifex/test',
      publicId: `test-${Date.now()}`
    });
    
    console.log('Cloudinary upload result:', uploadResult);

    res.json({
      success: true,
      message: 'Cloudinary test completed',
      isReady,
      uploadResult
    });

  } catch (error) {
    console.error('Cloudinary test error:', error);
    res.status(500).json({
      success: false,
      message: 'Cloudinary test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Test environment variables
 */
router.get('/env', (req: Request, res: Response) => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  res.json({
    cloudName: cloudName ? 'Set' : 'Missing',
    apiKey: apiKey ? 'Set' : 'Missing',
    apiSecret: apiSecret ? 'Set' : 'Missing',
    actualValues: {
      cloudName: cloudName || 'undefined',
      apiKey: apiKey || 'undefined',
      apiSecret: apiSecret ? '[HIDDEN]' : 'undefined'
    }
  });
});

/**
 * Test the full image generation and upload process
 */
router.post('/generate-and-upload', async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('Testing full image generation and upload process...');
    
    // Create a mock image (simulating what Gemini returns)
    const mockImage = {
      id: `test_${Date.now()}`,
      url: `http://localhost:3001/uploads/test-image-${Date.now()}.png`,
      width: 512,
      height: 512,
      format: 'png',
      size: 1024,
      metadata: {
        prompt: 'Test image',
        generatedAt: new Date().toISOString()
      }
    };
    
    // Create a test image file (simple 1x1 red pixel)
    const testImageBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, 0x89, 0x00, 0x00, 0x00,
      0x0D, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9C, 0x62, 0xF8, 0x0F, 0x00, 0x01,
      0x01, 0x01, 0x00, 0x18, 0xDD, 0x8D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49,
      0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
    ]);
    
    // Save the test image to uploads directory
    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    const filename = `test-image-${Date.now()}.png`;
    const filePath = path.join(uploadsDir, filename);
    fs.writeFileSync(filePath, testImageBuffer);
    
    mockImage.url = `http://localhost:3001/uploads/${filename}`;
    
    console.log('Created mock image:', mockImage);
    
    // Import the orchestrator function to test
    const { ImageGenerationOrchestrator } = await import('../services/imageGenerationOrchestrator');
    const orchestrator = new ImageGenerationOrchestrator();
    
    // Test the processGeneratedImages function directly
    const processedImages = await (orchestrator as any).processGeneratedImages([mockImage], 'free');
    
    console.log('Processed images result:', processedImages);
    
    // Clean up the test file
    try {
      fs.unlinkSync(filePath);
    } catch (cleanupError) {
      console.warn('Failed to clean up test file:', cleanupError);
    }
    
    res.json({
      success: true,
      message: 'Image generation and upload test completed',
      mockImage,
      processedImages
    });
    
  } catch (error) {
    console.error('Generate and upload test error:', error);
    res.status(500).json({
      success: false,
      message: 'Generate and upload test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;