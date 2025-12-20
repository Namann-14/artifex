'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Loader } from '@/components/ai-elements/loader';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';
import { useGenerationJob } from '@/hooks/use-generation-socket';

interface GenerationProgressTrackerProps {
  jobId: string;
  onComplete?: (result: any) => void;
  onError?: (error: string) => void;
}

export const GenerationProgressTracker = ({ 
  jobId, 
  onComplete, 
  onError 
}: GenerationProgressTrackerProps) => {
  const { status, result, error, isComplete, progress } = useGenerationJob(jobId);
  const [showComplete, setShowComplete] = useState(false);

  useEffect(() => {
    if (isComplete && result) {
      setShowComplete(true);
      onComplete?.(result);
    } else if (isComplete && error) {
      onError?.(error);
    }
  }, [isComplete, result, error, onComplete, onError]);

  if (!status) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-6">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Loader />
            <span className="text-sm">Connecting to generation service...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusIcon = () => {
    if (error) {
      return <XCircle className="h-5 w-5 text-destructive" />;
    }
    if (showComplete) {
      return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    }
    if (status.status === 'queued') {
      return <Clock className="h-5 w-5 text-yellow-500" />;
    }
    return <Loader />;
  };

  const getStatusColor = () => {
    if (error) return 'destructive';
    if (showComplete) return 'default';
    if (status.status === 'queued') return 'secondary';
    return 'default';
  };

  return (
    <Card>
      <CardContent className="py-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getStatusIcon()}
              <div>
                <p className="font-medium">
                  {error ? 'Generation Failed' : showComplete ? 'Generation Complete!' : 'Generating...'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {status.message}
                </p>
              </div>
            </div>
            <Badge variant={getStatusColor()}>
              {status.status}
            </Badge>
          </div>

          {/* Progress Bar */}
          {!isComplete && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{progress}% Complete</span>
                {status.estimatedTime && (
                  <span>~{Math.ceil(status.estimatedTime / 1000)}s remaining</span>
                )}
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Metadata */}
          {status.metadata && (
            <div className="text-xs text-muted-foreground">
              <details>
                <summary className="cursor-pointer hover:text-foreground">
                  View Details
                </summary>
                <pre className="mt-2 p-2 bg-muted rounded overflow-auto max-h-40">
                  {JSON.stringify(status.metadata, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default GenerationProgressTracker;
