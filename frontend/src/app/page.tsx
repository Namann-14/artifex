'use client';

import { AuthHeader } from '@/components/auth/auth-header';
import { useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader } from '@/components/ai-elements/loader';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Wand2, 
  Image as ImageIcon, 
  RefreshCw, 
  Download,
  Copy,
  Check 
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  data?: any;
}

const ChatBotDemo = () => {
  const { getToken } = useAuth();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

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
    setInput('');
    setLoading(true);
    setError(null);

    try {
      // Get authentication token from Clerk
      const token = await getToken();
      
      if (!token) {
        throw new Error('Not authenticated. Please sign in first.');
      }

      const response = await fetch('http://localhost:3001/api/v1/generate/text-to-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          prompt: input.trim(),
          aspectRatio: '1:1', // Standard square format
          style: 'realistic',
          quality: 'standard',
          negativePrompt: 'blurry, low quality, distorted',
          seed: Math.floor(Math.random() * 100000)
        }),
      });

      const result = await response.json();

      console.log('API Response:', result);

      if (!response.ok || !result.success) {
        throw new Error(result.message || result.error || 'Generation failed');
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: result.message || 'Image generated successfully!',
        timestamp: new Date(),
        data: result.data,
      };

      setMessages(prev => [...prev, assistantMessage]);

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
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Describe the image you want to generate... (e.g., 'A majestic mountain landscape at sunset with snow-capped peaks')"
                  className="min-h-[100px] resize-none"
                  disabled={loading}
                />
                <div className="flex gap-2">
                  <Button 
                    type="submit" 
                    disabled={loading || !input.trim()}
                    className="flex-1"
                  >
                    {loading ? (
                      <>
                        <Loader />
                        <span className="ml-2">Generating...</span>
                      </>
                    ) : (
                      <>
                        <ImageIcon className="h-4 w-4 mr-2" />
                        Generate Image
                      </>
                    )}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => {
                      setInput('');
                      setError(null);
                    }}
                    disabled={loading}
                  >
                    Clear
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