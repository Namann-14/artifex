'use client';

/**
 * Example Component: Async Image Generation with Real-Time Progress
 * 
 * This demonstrates how to use the new async generation endpoints
 * with WebSocket progress tracking.
 * 
 * To integrate into chat/page.tsx:
 * 1. Import this component
 * 2. Replace the synchronous fetch calls with the async pattern shown here
 * 3. Use GenerationProgressTracker to show real-time updates
 */

import { useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GenerationProgressTracker } from './progress-tracker';
import { Wand2 } from 'lucide-react';

export const AsyncGenerationExample = () => {
  const { getToken } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [jobId, setJobId] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAsyncGeneration = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setJobId(null);

    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Not authenticated');
      }

      // Submit async job
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'}/generate/text-to-image/async`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            prompt,
            aspectRatio: '16:9',
            style: 'realistic',
            quality: 'hd',
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      const data = await response.json();
      
      if (data.success && data.jobId) {
        // Set job ID to start tracking progress
        setJobId(data.jobId);
        console.log('Job queued:', data.jobId);
      } else {
        throw new Error(data.message || 'Failed to queue job');
      }

    } catch (err: any) {
      console.error('Failed to queue generation:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const handleComplete = (generationResult: any) => {
    console.log('Generation completed!', generationResult);
    setResult(generationResult);
    setLoading(false);
    setJobId(null);
  };

  const handleError = (errorMessage: string) => {
    console.error('Generation failed:', errorMessage);
    setError(errorMessage);
    setLoading(false);
    setJobId(null);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Async Image Generation (with Real-Time Progress)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter your prompt..."
              disabled={loading}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !loading) {
                  handleAsyncGeneration();
                }
              }}
            />
            <Button
              onClick={handleAsyncGeneration}
              disabled={loading || !prompt.trim()}
            >
              <Wand2 className="h-4 w-4 mr-2" />
              Generate
            </Button>
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded text-sm text-destructive">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Real-time progress tracker */}
      {jobId && (
        <GenerationProgressTracker
          jobId={jobId}
          onComplete={handleComplete}
          onError={handleError}
        />
      )}

      {/* Display result */}
      {result && result.data?.images && result.data.images.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Images</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {result.data.images.map((image: any, index: number) => (
                <div key={index} className="space-y-2">
                  <img
                    src={image.url}
                    alt={`Generated ${index + 1}`}
                    className="w-full rounded-lg border"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" asChild>
                      <a href={image.url} download target="_blank">
                        Download
                      </a>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Integration Notes */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-sm">Integration Notes</CardTitle>
        </CardHeader>
        <CardContent className="text-xs space-y-2">
          <p>✅ <strong>Real-time Progress</strong>: Users see live updates via WebSocket</p>
          <p>✅ <strong>Non-blocking</strong>: Server returns immediately, job runs in background</p>
          <p>✅ <strong>Priority Queue</strong>: Pro users get faster processing</p>
          <p>✅ <strong>Retry Logic</strong>: Failed jobs automatically retry</p>
          <p>✅ <strong>Multi-device</strong>: Progress syncs across all user devices</p>
          
          <details className="mt-4">
            <summary className="cursor-pointer font-semibold">View Code Pattern</summary>
            <pre className="mt-2 p-2 bg-background rounded text-xs overflow-auto">
{`// 1. Submit async job
const response = await fetch('/api/v1/generate/text-to-image/async', {
  method: 'POST',
  body: JSON.stringify({ prompt, ...params })
});
const { jobId } = await response.json();

// 2. Track progress with component
<GenerationProgressTracker 
  jobId={jobId}
  onComplete={(result) => console.log('Done!', result)}
/>`}
            </pre>
          </details>
        </CardContent>
      </Card>
    </div>
  );
};

export default AsyncGenerationExample;
