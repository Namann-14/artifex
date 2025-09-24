import 'dotenv/config'; // Load environment variables first
import { cloudinaryService } from '../services/cloudinaryService';

async function testCloudinary() {
  console.log('Testing Cloudinary service...');
  
  // Check environment variables
  console.log('Environment variables:', {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || 'undefined',
    apiKey: process.env.CLOUDINARY_API_KEY || 'undefined',
    apiSecret: process.env.CLOUDINARY_API_SECRET ? '[SET]' : 'undefined'
  });
  
  // Test if Cloudinary is ready
  console.log('Is Cloudinary ready?', cloudinaryService.isReady());
  
  // Test simple upload
  const testImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
  
  try {
    const result = await cloudinaryService.uploadBase64Image(testImageBase64, {
      folder: 'artifex/test',
      publicId: `test-${Date.now()}`
    });
    
    console.log('Upload result:', result);
  } catch (error) {
    console.error('Upload error:', error);
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  testCloudinary();
}

export { testCloudinary };