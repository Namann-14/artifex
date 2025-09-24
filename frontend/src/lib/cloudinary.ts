// Cloudinary configuration for frontend
export const cloudinaryConfig = {
  cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '',
  apiKey: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY || '',
};

// Cloudinary URL builder
export const buildCloudinaryUrl = (publicId: string, transformations?: string) => {
  if (!cloudinaryConfig.cloudName || !publicId) {
    return '';
  }

  const baseUrl = `https://res.cloudinary.com/${cloudinaryConfig.cloudName}/image/upload`;
  
  if (transformations) {
    return `${baseUrl}/${transformations}/${publicId}`;
  }
  
  return `${baseUrl}/${publicId}`;
};

// Common transformations
export const cloudinaryTransforms = {
  thumbnail: 'w_300,h_300,c_fill,q_auto,f_auto',
  medium: 'w_600,h_600,c_fit,q_auto,f_auto',
  large: 'w_1200,h_1200,c_fit,q_auto,f_auto',
  optimized: 'q_auto,f_auto',
};

// Helper function to get optimized image URL
export const getOptimizedImageUrl = (
  publicId: string, 
  size: 'thumbnail' | 'medium' | 'large' | 'optimized' = 'optimized'
) => {
  return buildCloudinaryUrl(publicId, cloudinaryTransforms[size]);
};