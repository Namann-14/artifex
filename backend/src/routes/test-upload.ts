import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Simple test endpoint to verify routes are working
router.get('/status', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Test routes are working!',
    endpoints: ['/upload', '/image-to-image'],
    timestamp: new Date().toISOString()
  });
});

// Create temp directory if it doesn't exist
const tempDir = path.join(__dirname, '../../public/temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Simple multer configuration for testing
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, `test-${uniqueSuffix}${extension}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

/**
 * Test upload endpoint - just saves the file
 */
router.post('/upload', upload.single('testImage'), (req, res) => {
  console.log('Test upload route hit');
  console.log('File received:', req.file ? 'Yes' : 'No');
  console.log('Body:', req.body);
  
  if (req.file) {
    console.log('File details:', {
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      path: req.file.path
    });
    
    res.json({
      success: true,
      message: 'File uploaded successfully',
      file: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        path: req.file.path
      }
    });
  } else {
    res.status(400).json({
      success: false,
      message: 'No file received'
    });
  }
});

/**
 * Test image-to-image endpoint - simplified version
 */
router.post('/image-to-image', upload.single('sourceImage'), async (req, res): Promise<void> => {
  console.log('Test image-to-image route hit');
  console.log('File received:', req.file ? 'Yes' : 'No');
  console.log('Body params:', {
    prompt: req.body.prompt,
    transformationType: req.body.transformationType,
    strength: req.body.strength,
    negativePrompt: req.body.negativePrompt
  });
  
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        message: 'No source image provided'
      });
      return;
    }

    if (!req.body.prompt) {
      res.status(400).json({
        success: false,
        message: 'No prompt provided'
      });
      return;
    }

    console.log('File details:', {
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      path: req.file.path,
      mimetype: req.file.mimetype
    });

    // Import the Gemini service
    const GeminiImageService = (await import('../services/geminiService')).default;
    const geminiService = new GeminiImageService();
    
    // Read the uploaded image file
    const imageBuffer = fs.readFileSync(req.file.path);
    
    // Call the image-to-image generation
    const result = await geminiService.imageToImage({
      inputImage: imageBuffer,
      inputImageType: req.file.mimetype,
      imagePath: req.file.path,
      prompt: req.body.prompt || 'Transform this image',
      quality: 'standard' as any,
      aspectRatio: '1:1' as any,
      subscriptionTier: 'free' as any,
      userId: 'test-user'
    });

    // Clean up the temporary file
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
      console.log('Temporary file cleaned up:', req.file.path);
    }

    res.json({
      success: true,
      message: 'Image transformation completed successfully',
      data: result
    });

  } catch (error: any) {
    console.error('Test image-to-image error:', error);
    
    // Clean up the temporary file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
      console.log('Temporary file cleaned up after error:', req.file.path);
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Image transformation failed'
    });
  }
});

export default router;