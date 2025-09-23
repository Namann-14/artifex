import { clerkMiddleware, requireAuth, getAuth } from '@clerk/express';
import { Request, Response, NextFunction } from 'express';
import type { User } from '@clerk/backend';
import { config } from '../config/env';
import { UnauthorizedError, ForbiddenError } from './errorHandler';
import { logger } from '../utils/logger';
import jwt from 'jsonwebtoken';

// Configure Clerk middleware
export const clerkAuth = clerkMiddleware({
  secretKey: config.CLERK_SECRET_KEY,
  publishableKey: config.CLERK_PUBLISHABLE_KEY,
});

// Extend Express Request interface for Clerk
declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId?: string | null;
        user?: User;
        sessionId?: string | null;
        getToken?: () => Promise<string | null>;
      };
      user?: {
        id: string;
        subscriptionStatus?: string;
      };
    }
  }
}

// Middleware to require authentication - using proper Clerk verification
export const requireAuthentication = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Authentication required - no token provided');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    console.log('Token received:', token.substring(0, 50) + '...');
    
    // Use Clerk's built-in token verification
    try {
      // First try to get auth from Clerk middleware that should have already run
      const auth = getAuth(req);
      
      if (!auth.userId) {
        // If Clerk middleware didn't set auth, try manual verification
        const { verifyToken } = await import('@clerk/backend');
        
        const payload = await verifyToken(token, {
          secretKey: config.CLERK_SECRET_KEY,
        });
        
        console.log('Token verified successfully:', {
          sub: payload.sub,
          sid: payload.sid,
          exp: payload.exp
        });
        
        // Set up req.auth with verified token data
        (req as any).auth = {
          userId: payload.sub,
          sessionId: payload.sid,
          getToken: async () => token,
        };
      } else {
        // Use auth from Clerk middleware
        (req as any).auth = {
          userId: auth.userId,
          sessionId: auth.sessionId,
          getToken: async () => token,
        };
        
        console.log('Using Clerk middleware auth:', {
          userId: auth.userId,
          sessionId: auth.sessionId
        });
      }
      
      if (!(req as any).auth?.userId) {
        throw new UnauthorizedError('Invalid token - no user ID');
      }
      
      next();
      return;
      
    } catch (tokenError) {
      console.error('Token verification error:', tokenError);
      throw new UnauthorizedError('Invalid or expired token');
    }
    
  } catch (error) {
    logger.error('Authentication error:', error as Error);
    if (error instanceof UnauthorizedError) {
      res.status(401).json({ 
        success: false,
        message: (error as Error).message 
      });
      return;
    }
    res.status(401).json({ 
      success: false, 
      message: 'Authentication required' 
    });
    return;
  }
};

// Middleware to validate user and add to request
export const validateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.auth?.userId) {
      throw new UnauthorizedError('User not authenticated');
    }

    // User information is available through req.auth
    logger.info('User authenticated', {
      userId: req.auth.userId,
      sessionId: req.auth.sessionId,
    });

    next();
  } catch (error) {
    next(error);
  }
};

// Middleware to check user role
export const requireRole = (roles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.auth?.userId) {
        throw new UnauthorizedError('Authentication required');
      }

      // In a real implementation, you would fetch user role from your database
      // For now, we'll assume all authenticated users have 'user' role
      const userRole = 'user'; // This should be fetched from your user database

      if (!roles.includes(userRole)) {
        throw new ForbiddenError(`Access denied. Required roles: ${roles.join(', ')}`);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Middleware to validate subscription tier
export const requireSubscription = (tiers: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.auth?.userId) {
        throw new UnauthorizedError('Authentication required');
      }

      // In a real implementation, you would fetch subscription from your database
      // For now, we'll assume all users have 'free' tier
      const subscriptionTier = 'free'; // This should be fetched from your user database

      if (!tiers.includes(subscriptionTier)) {
        throw new ForbiddenError(`Access denied. Required subscription: ${tiers.join(', ')}`);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Helper to get authenticated user ID
export const getAuthenticatedUserId = (req: Request): string => {
  if (!req.auth?.userId) {
    throw new UnauthorizedError('User not authenticated');
  }
  return req.auth.userId;
};

// Helper to get user token
export const getUserToken = async (req: Request): Promise<string | null> => {
  if (!req.auth?.getToken) {
    return null;
  }
  
  try {
    return await req.auth.getToken();
  } catch (error) {
    logger.error('Error getting user token:', error as Error);
    return null;
  }
};

// Optional authentication middleware (doesn't throw if not authenticated)
export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  // Just pass through - user might or might not be authenticated
  next();
};