'use client';

import { AuthHeader } from '@/components/auth/auth-header';
import { useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader } from '@/components/ai-elements/loader';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Video as VideoIcon, 
  Upload,
  Wand2,
  Download,
  X,
  Play,
  AlertCircle
} from 'lucide-react';

export default function VideoGenerationPage() {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Video generation parameters
  const [imageUrl, setImageUrl] = useState('');
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [duration, setDuration] = useState<'5' | '10'>('5');
  const [cfgScale, setCfgScale] = useState(0.5);
  
  // Result state
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [generationStatus, setGenerationStatus] = useState<string>('');

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image size must be less than 10MB');
      return;
    }

    setUploadedImage(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    
    setError(null);
  };

  const clearImage = () => {
    setUploadedImage(null);
    setImagePreview(null);
    setImageUrl('');
    setError(null);
  };

  const handleGenerateVideo = async () => {
    if (!imageUrl && !uploadedImage) {
      setError('Please provide an image URL or upload an image');
      return;
    }

    setLoading(true);
    setError(null);
    setVideoUrl(null);
    setGenerationStatus('Initializing video generation...');

    try {
      const token = await getToken();
      
      if (!token) {
        throw new Error('Please sign in to generate videos');
      }

      let finalImageUrl = imageUrl;

      // If an image was uploaded, we need to convert it to a publicly accessible URL
      // We'll use the image preview (base64) directly, and the backend will upload it to Cloudinary
      if (uploadedImage && imagePreview) {
        setGenerationStatus('Preparing image...');
        finalImageUrl = imagePreview; // Send base64 data URL
        console.log('Using uploaded image (base64)');
      } else if (imageUrl) {
        // Validate that it's a direct image URL
        try {
          const url = new URL(imageUrl);
          const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
          const hasImageExtension = imageExtensions.some(ext => 
            url.pathname.toLowerCase().endsWith(ext)
          );
          
          if (!hasImageExtension) {
            throw new Error(
              'Please provide a direct link to an image file (ending with .jpg, .png, etc.), ' +
              'not a search result page or webpage URL.'
            );
          }
        } catch (err: any) {
          if (err.message.includes('direct link')) {
            throw err;
          }
          throw new Error('Invalid URL format. Please enter a valid image URL.');
        }
      }

      if (!finalImageUrl) {
        throw new Error('No image URL available');
      }

      setGenerationStatus('Generating video... This may take 1-2 minutes.');

      // Generate video
      const response = await fetch('http://localhost:3001/api/v1/generate/image-to-video', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl: finalImageUrl,
          prompt: prompt || undefined,
          negativePrompt: negativePrompt || undefined,
          duration,
          cfgScale,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error('Video generation failed:', data);
        throw new Error(data.message || data.error || `Failed to generate video (${response.status})`);
      }

      if (data.success && data.data?.videoUrl) {
        setVideoUrl(data.data.videoUrl);
        setGenerationStatus('Video generated successfully!');
      } else {
        throw new Error('Video generation failed: No video URL returned');
      }

    } catch (err: any) {
      console.error('Video generation error:', err);
      
      // Provide more helpful error messages
      let errorMessage = err.message || 'Failed to generate video';
      
      // Keep the detailed error message as-is if it contains our helpful information
      if (!errorMessage.includes('Common reasons') && 
          !errorMessage.includes('API Credits') &&
          (errorMessage.includes('Unknown error') || errorMessage.includes('FAILED'))) {
        errorMessage = 'Video generation failed. This could be due to:\n' +
                      '• API quota or credit limits\n' +
                      '• Image format or quality issues\n' +
                      '• Unsupported image characteristics\n\n' +
                      'Please check the console for detailed error information.';
      }
      
      setError(errorMessage);
      setGenerationStatus('');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (videoUrl) {
      const a = document.createElement('a');
      a.href = videoUrl;
      a.download = `video_${Date.now()}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AuthHeader />
      
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2 flex items-center gap-2">
            <VideoIcon className="w-10 h-10 text-primary" />
            Image to Video Generation
          </h1>
          <p className="text-muted-foreground">
            Transform your images into dynamic videos with AI-powered animation
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel - Input */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Image Source</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Image URL Input */}
                <div className="space-y-2">
                  <Label htmlFor="imageUrl">Image URL</Label>
                  <Input
                    id="imageUrl"
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    disabled={loading || !!uploadedImage}
                  />
                  <p className="text-xs text-muted-foreground">
                    Must be a direct link to an image file (.jpg, .png, etc.)
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex-1 border-t border-border" />
                  <span className="text-sm text-muted-foreground">OR</span>
                  <div className="flex-1 border-t border-border" />
                </div>

                {/* Image Upload */}
                <div className="space-y-2">
                  <Label>Upload Image</Label>
                  {imagePreview ? (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-48 object-cover rounded-lg border border-border"
                      />
                      <Button
                        size="icon"
                        variant="destructive"
                        className="absolute top-2 right-2"
                        onClick={clearImage}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={loading || !!imageUrl}
                        className="hidden"
                        id="imageUpload"
                      />
                      <label htmlFor="imageUpload" className="cursor-pointer">
                        <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          Click to upload an image
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          PNG, JPG up to 10MB
                        </p>
                      </label>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Video Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Prompt */}
                <div className="space-y-2">
                  <Label htmlFor="prompt">Prompt (Optional)</Label>
                  <Textarea
                    id="prompt"
                    placeholder="Describe the video motion or transformation..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    disabled={loading}
                    rows={3}
                  />
                </div>

                {/* Negative Prompt */}
                <div className="space-y-2">
                  <Label htmlFor="negativePrompt">Negative Prompt (Optional)</Label>
                  <Textarea
                    id="negativePrompt"
                    placeholder="What to avoid in the video..."
                    value={negativePrompt}
                    onChange={(e) => setNegativePrompt(e.target.value)}
                    disabled={loading}
                    rows={2}
                  />
                </div>

                {/* Duration */}
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration</Label>
                  <Select 
                    value={duration} 
                    onValueChange={(value: '5' | '10') => setDuration(value)}
                    disabled={loading}
                  >
                    <SelectTrigger id="duration">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 seconds</SelectItem>
                      <SelectItem value="10">10 seconds</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* CFG Scale */}
                <div className="space-y-2">
                  <Label htmlFor="cfgScale">CFG Scale: {cfgScale}</Label>
                  <input
                    id="cfgScale"
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={cfgScale}
                    onChange={(e) => setCfgScale(parseFloat(e.target.value))}
                    disabled={loading}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Controls how much the video follows the prompt (0-1)
                  </p>
                </div>

                {/* Generate Button */}
                <Button
                  onClick={handleGenerateVideo}
                  disabled={loading || (!imageUrl && !uploadedImage)}
                  className="w-full"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader className="mr-2" />
                      Generating Video...
                    </>
                  ) : (
                    <>
                      <Wand2 className="mr-2 w-4 h-4" />
                      Generate Video
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Output */}
          <div className="space-y-6">
            <Card className="min-h-[400px]">
              <CardHeader>
                <CardTitle>Generated Video</CardTitle>
              </CardHeader>
              <CardContent>
                {error && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="whitespace-pre-line">{error}</AlertDescription>
                  </Alert>
                )}

                {generationStatus && !error && (
                  <Alert className="mb-4">
                    <AlertDescription className="flex items-center gap-2">
                      {loading && <Loader />}
                      {generationStatus}
                    </AlertDescription>
                  </Alert>
                )}

                {videoUrl ? (
                  <div className="space-y-4">
                    <div className="relative bg-black rounded-lg overflow-hidden">
                      <video
                        src={videoUrl}
                        controls
                        className="w-full"
                        autoPlay
                        loop
                      >
                        Your browser does not support the video tag.
                      </video>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={handleDownload}
                        className="flex-1"
                        variant="outline"
                      >
                        <Download className="mr-2 w-4 h-4" />
                        Download Video
                      </Button>
                      <Button
                        onClick={() => window.open(videoUrl, '_blank')}
                        className="flex-1"
                        variant="outline"
                      >
                        <Play className="mr-2 w-4 h-4" />
                        Open in New Tab
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <VideoIcon className="w-24 h-24 text-muted-foreground mb-4 opacity-50" />
                    <p className="text-muted-foreground">
                      Your generated video will appear here
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Upload an image and click "Generate Video" to start
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Info Card */}
            <Card>
              <CardHeader>
                <CardTitle>Tips & Guidelines</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p><strong>✓ For best results:</strong></p>
                <p>• Upload an image directly (recommended)</p>
                <p>• Or use a direct image URL ending in .jpg, .png, etc.</p>
                <p>• Avoid search result pages or web page URLs</p>
                <p className="pt-2"><strong>✓ Generation tips:</strong></p>
                <p>• Use high-quality, clear images</p>
                <p>• Describe desired motion in the prompt</p>
                <p>• Video generation takes 1-2 minutes</p>
                <p>• Higher CFG scale = stronger prompt influence</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
