'use client';

import { AuthHeader } from '@/components/auth/auth-header';
import { useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { APIClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader } from '@/components/ai-elements/loader';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { 
  Wand2, 
  Image as ImageIcon, 
  RefreshCw, 
  Download,
  Copy,
  Check,
  Shuffle,
  Upload,
  X
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  data?: any;
}

// Test Upload Component


const TestImageToImage = () => {
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<string>('');
  const [prompt, setPrompt] = useState('Make this image more vibrant and colorful');

  const handleImageToImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setResult('');

    try {
      const formData = new FormData();
      formData.append('sourceImage', file);
      formData.append('prompt', prompt);

      console.log('Sending image-to-image request with prompt:', prompt);
      
      const response = await fetch('http://localhost:3001/api/test/image-to-image', {
        method: 'POST',
        body: formData,
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers.get('content-type'));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error:', errorText);
        setResult(`❌ HTTP Error ${response.status}: ${errorText}`);
        return;
      }

      const data = await response.json();
      
      if (data.success) {
        setResult(`✅ Image-to-image successful! Generated ${data.data?.images?.length || 1} image(s)`);
        console.log('Image-to-image result:', data);
      } else {
        setResult(`❌ Image-to-image failed: ${data.message || data.error}`);
      }
    } catch (error) {
      console.error('Image-to-image error:', error);
      setResult(`❌ Error: ${error}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>🎨 Test Image-to-Image</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Input
            type="text"
            placeholder="Enter transformation prompt..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={uploading}
          />
          <Input
            type="file"
            accept="image/*"
            onChange={handleImageToImage}
            disabled={uploading}
          />
          {uploading && <p>Processing image...</p>}
          {result && <p className="text-sm">{result}</p>}
        </div>
      </CardContent>
    </Card>
  );
};

const ChatBotDemo = () => {
  const { getToken } = useAuth();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  
  // Image generation parameters
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [style, setStyle] = useState('realistic');
  const [quality, setQuality] = useState('standard');
  const [negativePrompt, setNegativePrompt] = useState('blurry, low quality, distorted');
  const [useRandomSeed, setUseRandomSeed] = useState(true);
  const [customSeed, setCustomSeed] = useState('');
  
  // Image upload state
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const originalInput = input.trim();
    setInput('');
    setLoading(true);
    setError(null);

    try {
      // Determine if this should be image-to-image or text-to-image
      const isImageToImage = uploadedImage !== null;
      await handleSubmitWithImage(isImageToImage);

      // Clear uploaded image after successful generation
      if (uploadedImage) {
        removeUploadedImage();
      }

    } catch (err: any) {
      console.error('Generation error:', err);
      setError(err.message || 'Failed to generate image');
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Sorry, I encountered an error: ${err.message || 'Unknown error'}`,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
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
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      setError(null);
    }
  };

  const removeUploadedImage = () => {
    setUploadedImage(null);
    setImagePreview(null);
  };

  const handleSubmitWithImage = async (isImageToImage: boolean = false) => {
    try {
      const token = await getToken();
      
      if (!token) {
        throw new Error('Not authenticated. Please sign in first.');
      }

      if (isImageToImage && !uploadedImage) {
        throw new Error('Please upload an image for image-to-image generation');
      }

      let result;

      if (isImageToImage && uploadedImage) {
        // Use working direct image-to-image approach
        const formData = new FormData();
        formData.append('sourceImage', uploadedImage);
        formData.append('prompt', input.trim());
        
        console.log('Sending image-to-image request with prompt:', input.trim());
        
        const response = await fetch('http://localhost:3001/api/test/image-to-image', {
          method: 'POST',
          body: formData,
        });

        console.log('Response status:', response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Response error:', errorText);
          throw new Error(`HTTP Error ${response.status}: ${errorText}`);
        }

        result = await response.json();
        console.log('Image-to-Image API Response:', result);
      } else {
        // Use regular text-to-image generation
        const response = await fetch('http://localhost:3001/api/v1/generate/text-to-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            prompt: input.trim(),
            aspectRatio,
            style,
            quality,
            negativePrompt: negativePrompt.trim() || undefined,
            seed: useRandomSeed ? 
              Math.floor(Math.random() * 1000000) + Date.now() % 100000 : 
              (parseInt(customSeed) || Math.floor(Math.random() * 1000000))
          }),
        });

        result = await response.json();
        console.log('Text-to-Image API Response:', result);

        if (!response.ok || !result.success) {
          throw new Error(result.message || result.error || 'Generation failed');
        }
      }

      if (!result.success) {
        throw new Error(result.message || result.error || 'Generation failed');
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: result.message || `${isImageToImage ? 'Image transformation' : 'Image generation'} completed successfully!`,
        timestamp: new Date(),
        data: result.data,
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (err: any) {
      console.error('Generation error:', err);
      throw err; // Re-throw to be handled by calling function
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <AuthHeader />
      
      <div className="flex-1 max-w-4xl mx-auto p-6 w-full">
        <div className="flex flex-col h-full">
          
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Artifex AI Image Generator
            </h1>
            <p className="text-muted-foreground">
              Describe the image you want to create and I'll generate it for you
            </p>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto space-y-4 mb-6">
            {messages.length === 0 && (
              <div className="text-center py-12">
                <Wand2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  Start by describing the image you'd like to generate
                </p>
              </div>
            )}

            {messages.map((message) => (
              <Card key={message.id} className={message.role === 'user' ? 'ml-12' : 'mr-12'}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Badge variant={message.role === 'user' ? 'default' : 'secondary'}>
                      {message.role === 'user' ? 'You' : 'Artifex AI'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {message.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="mb-3">{message.content}</p>
                  
                  {message.data && (
                    <div className="space-y-3">
                      {message.data.images && message.data.images.length > 0 && (
                        <div className="space-y-3">
                          {message.data.images.map((image: any, index: number) => (
                            <div key={image.id || index} className="border rounded-lg p-2 bg-muted/20">
                              <img 
                                src={image.url} 
                                alt={`Generated image ${index + 1}`}
                                className="w-full max-w-md mx-auto rounded"
                              />
                              <div className="flex gap-2 mt-2">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => copyToClipboard(image.url, `${message.id}-${index}`)}
                                >
                                  {copied === `${message.id}-${index}` ? (
                                    <Check className="h-4 w-4" />
                                  ) : (
                                    <Copy className="h-4 w-4" />
                                  )}
                                  Copy URL
                                </Button>
                                <Button size="sm" variant="outline" asChild>
                                  <a href={image.url} download target="_blank">
                                    <Download className="h-4 w-4 mr-1" />
                                    Download
                                  </a>
                                </Button>
                              </div>
                              {image.width && image.height && (
                                <div className="text-xs text-muted-foreground mt-2">
                                  {image.width}×{image.height} • {image.format?.toUpperCase() || 'IMAGE'}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {message.data.metadata && (
                        <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
                          <strong>Generation Details:</strong> {JSON.stringify(message.data.metadata, null, 2)}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {loading && (
              <Card className="mr-12">
                <CardContent className="py-6">
                  <div className="flex items-center gap-3">
                    <Loader />
                    <span>Generating your image...</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <Alert className="mb-4 border-destructive">
              <AlertDescription className="text-destructive">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Input Form */}
          <Card>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Image Upload Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Upload Image (Optional)</span>
                    <span className="text-xs text-muted-foreground">
                      {uploadedImage ? 'Image-to-Image Mode' : 'Text-to-Image Mode'}
                    </span>
                  </div>
                  
                  {!imagePreview ? (
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="image-upload"
                        disabled={loading}
                      />
                      <label
                        htmlFor="image-upload"
                        className="flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors rounded-lg p-4"
                      >
                        <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                        <span className="text-sm text-muted-foreground">
                          Click to upload an image for transformation
                        </span>
                        <span className="text-xs text-muted-foreground mt-1">
                          Supports JPG, PNG, WebP (max 10MB)
                        </span>
                      </label>
                    </div>
                  ) : (
                    <div className="relative border rounded-lg p-3 bg-muted/20">
                      <div className="flex items-start gap-3">
                        <img
                          src={imagePreview}
                          alt="Uploaded preview"
                          className="w-20 h-20 object-cover rounded"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{uploadedImage?.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {uploadedImage && (uploadedImage.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Ready for image-to-image transformation
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={removeUploadedImage}
                          disabled={loading}
                          className="h-8 w-8 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={
                      uploadedImage 
                        ? "Describe how you want to transform the uploaded image... (e.g., 'Make it look like a painting', 'Change it to nighttime')"
                        : "Describe the image you want to generate... (e.g., 'A majestic mountain landscape at sunset with snow-capped peaks')"
                    }
                    className="min-h-[100px] resize-none"
                    disabled={loading}
                  />
                </div>

                {/* Generation Parameters */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <span className="text-sm font-medium">Aspect Ratio</span>
                    <Select value={aspectRatio} onValueChange={setAspectRatio} disabled={loading}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1:1">Square (1:1)</SelectItem>
                        <SelectItem value="16:9">Landscape (16:9)</SelectItem>
                        <SelectItem value="9:16">Portrait (9:16)</SelectItem>
                        <SelectItem value="4:3">Classic (4:3)</SelectItem>
                        <SelectItem value="3:2">Photo (3:2)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <span className="text-sm font-medium">Style</span>
                    <Select value={style} onValueChange={setStyle} disabled={loading}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="realistic">Realistic</SelectItem>
                        <SelectItem value="artistic">Artistic</SelectItem>
                        <SelectItem value="cartoon">Cartoon</SelectItem>
                        <SelectItem value="anime">Anime</SelectItem>
                        <SelectItem value="abstract">Abstract</SelectItem>
                        <SelectItem value="vintage">Vintage</SelectItem>
                        <SelectItem value="modern">Modern</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <span className="text-sm font-medium">Quality</span>
                    <Select value={quality} onValueChange={setQuality} disabled={loading}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="hd">HD</SelectItem>
                        <SelectItem value="ultra">Ultra</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Negative Prompt */}
                <div className="space-y-2">
                  <span className="text-sm font-medium">What to avoid (Optional)</span>
                  <Input
                    value={negativePrompt}
                    onChange={(e) => setNegativePrompt(e.target.value)}
                    placeholder="e.g., blurry, low quality, distorted, text, watermark"
                    disabled={loading}
                    className="text-sm"
                  />
                </div>

                {/* Seed Control */}
                <div className="space-y-2">
                  <span className="text-sm font-medium">Randomness Control</span>
                  <div className="flex gap-2 items-center">
                    <input
                      type="checkbox"
                      id="randomSeed"
                      checked={useRandomSeed}
                      onChange={(e) => setUseRandomSeed(e.target.checked)}
                      disabled={loading}
                      className="h-4 w-4"
                    />
                    <label htmlFor="randomSeed" className="text-sm">Always generate different images</label>
                  </div>
                  {!useRandomSeed && (
                    <div className="flex gap-2">
                      <Input
                        value={customSeed}
                        onChange={(e) => setCustomSeed(e.target.value)}
                        placeholder="Enter custom seed (optional)"
                        disabled={loading}
                        className="text-sm flex-1"
                        type="number"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setCustomSeed(Math.floor(Math.random() * 1000000).toString())}
                        disabled={loading}
                        className="px-3"
                      >
                        <Shuffle className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button 
                    type="submit" 
                    disabled={loading || !input.trim()}
                    className="flex-1"
                  >
                    {loading ? (
                      <>
                        <Loader />
                        <span className="ml-2">
                          {uploadedImage ? 'Transforming...' : 'Generating...'}
                        </span>
                      </>
                    ) : (
                      <>
                        <ImageIcon className="h-4 w-4 mr-2" />
                        {uploadedImage ? 'Transform Image' : 'Generate Image'}
                      </>
                    )}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => {
                      setInput('');
                      setError(null);
                      removeUploadedImage();
                    }}
                    disabled={loading}
                  >
                    Clear All
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ChatBotDemo;