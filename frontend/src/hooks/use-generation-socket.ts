'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@clerk/nextjs';

/**
 * WebSocket Hook for Real-Time Generation Progress
 * Connects to backend Socket.IO server and tracks job progress
 */

export interface GenerationProgress {
  jobId: string;
  userId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  message: string;
  estimatedTime?: number;
  metadata?: any;
  timestamp: string;
}

export interface GenerationComplete {
  jobId: string;
  userId: string;
  status: 'completed';
  progress: 100;
  message: string;
  result: any;
  timestamp: string;
}

export interface GenerationError {
  jobId: string;
  userId: string;
  status: 'failed';
  progress: number;
  message: string;
  error: {
    message: string;
    code: string;
    details?: any;
  };
  timestamp: string;
}

export interface UseGenerationSocketOptions {
  onProgress?: (data: GenerationProgress) => void;
  onComplete?: (data: GenerationComplete) => void;
  onError?: (data: GenerationError) => void;
  autoConnect?: boolean;
}

export const useGenerationSocket = (options: UseGenerationSocketOptions = {}) => {
  const { userId, getToken } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [activeJobs, setActiveJobs] = useState<Map<string, GenerationProgress>>(new Map());
  
  const socketRef = useRef<Socket | null>(null);
  const optionsRef = useRef(options);
  
  // Update options ref when they change
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  // Connect to WebSocket
  const connect = useCallback(async () => {
    if (socketRef.current?.connected) {
      console.log('Already connected to WebSocket');
      return;
    }

    if (!userId) {
      console.warn('Cannot connect to WebSocket: No user ID');
      return;
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
      const socketUrl = apiUrl.replace('/api/v1', '');

      console.log('Connecting to WebSocket:', socketUrl);

      const newSocket = io(socketUrl, {
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 10000,
      });

      socketRef.current = newSocket;
      setSocket(newSocket);

      // Connection event handlers
      newSocket.on('connect', () => {
        console.log('✅ WebSocket connected:', newSocket.id);
        setConnected(true);
        
        // Authenticate with userId
        if (userId) {
          newSocket.emit('authenticate', userId);
        }
      });

      newSocket.on('authenticated', (data: any) => {
        console.log('✅ WebSocket authenticated:', data);
        setAuthenticated(true);
      });

      newSocket.on('disconnect', (reason: string) => {
        console.log('⚠️ WebSocket disconnected:', reason);
        setConnected(false);
        setAuthenticated(false);
      });

      newSocket.on('connect_error', (error: Error) => {
        console.error('❌ WebSocket connection error:', error.message);
      });

      newSocket.on('error', (error: Error) => {
        console.error('❌ WebSocket error:', error);
      });

      // Generation event handlers
      newSocket.on('generation:progress', (data: GenerationProgress) => {
        console.log('📊 Progress update:', data);
        setActiveJobs(prev => new Map(prev).set(data.jobId, data));
        optionsRef.current.onProgress?.(data);
      });

      newSocket.on('generation:complete', (data: GenerationComplete) => {
        console.log('✅ Generation complete:', data);
        setActiveJobs(prev => {
          const newMap = new Map(prev);
          newMap.delete(data.jobId);
          return newMap;
        });
        optionsRef.current.onComplete?.(data);
      });

      newSocket.on('generation:error', (data: GenerationError) => {
        console.error('❌ Generation error:', data);
        setActiveJobs(prev => {
          const newMap = new Map(prev);
          newMap.delete(data.jobId);
          return newMap;
        });
        optionsRef.current.onError?.(data);
      });

      // Quota and subscription updates
      newSocket.on('quota:update', (data: any) => {
        console.log('📈 Quota update:', data);
      });

      newSocket.on('subscription:update', (data: any) => {
        console.log('💎 Subscription update:', data);
      });

    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
    }
  }, [userId]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      console.log('Disconnecting from WebSocket');
      socketRef.current.disconnect();
      socketRef.current = null;
      setSocket(null);
      setConnected(false);
      setAuthenticated(false);
      setActiveJobs(new Map());
    }
  }, []);

  // Subscribe to a specific job
  const subscribeToJob = useCallback((jobId: string) => {
    if (socketRef.current?.connected) {
      console.log('Subscribing to job:', jobId);
      socketRef.current.emit('subscribe:job', jobId);
    }
  }, []);

  // Unsubscribe from a specific job
  const unsubscribeFromJob = useCallback((jobId: string) => {
    if (socketRef.current?.connected) {
      console.log('Unsubscribing from job:', jobId);
      socketRef.current.emit('unsubscribe:job', jobId);
    }
  }, []);

  // Request job status
  const requestJobStatus = useCallback((jobId: string) => {
    if (socketRef.current?.connected) {
      console.log('Requesting job status:', jobId);
      socketRef.current.emit('request:job-status', jobId);
    }
  }, []);

  // Auto-connect on mount if enabled
  useEffect(() => {
    if (options.autoConnect !== false && userId) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [userId, options.autoConnect, connect, disconnect]);

  return {
    socket,
    connected,
    authenticated,
    activeJobs: Array.from(activeJobs.values()),
    connect,
    disconnect,
    subscribeToJob,
    unsubscribeFromJob,
    requestJobStatus,
  };
};

/**
 * Hook to track a specific generation job
 */
export const useGenerationJob = (jobId: string | null) => {
  const [status, setStatus] = useState<GenerationProgress | null>(null);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  const { subscribeToJob, unsubscribeFromJob, connected } = useGenerationSocket({
    onProgress: (data) => {
      if (data.jobId === jobId) {
        setStatus(data);
        setError(null);
      }
    },
    onComplete: (data) => {
      if (data.jobId === jobId) {
        setStatus(data);
        setResult(data.result);
        setIsComplete(true);
        setError(null);
      }
    },
    onError: (data) => {
      if (data.jobId === jobId) {
        setStatus(data);
        setError(data.error.message);
        setIsComplete(true);
      }
    },
  });

  useEffect(() => {
    if (jobId && connected) {
      subscribeToJob(jobId);
      return () => unsubscribeFromJob(jobId);
    }
  }, [jobId, connected, subscribeToJob, unsubscribeFromJob]);

  return {
    status,
    result,
    error,
    isComplete,
    progress: status?.progress || 0,
  };
};

export default useGenerationSocket;
