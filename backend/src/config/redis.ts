import Redis from 'ioredis';
import { config } from './env';
import { logger } from '../utils/logger';

/**
 * Redis Configuration and Connection Management
 * Handles connection to Redis for caching, session storage, and job queues
 */

// Redis connection options
const redisOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: 3,
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  reconnectOnError: (err: Error) => {
    const targetError = 'READONLY';
    if (err.message.includes(targetError)) {
      // Only reconnect when the error contains "READONLY"
      return true;
    }
    return false;
  },
};

// Create Redis client for general use
export const redisClient = new Redis(redisOptions);

// Create separate Redis client for subscriptions (required by Bull)
export const redisSubscriber = new Redis(redisOptions);

// Connection event handlers
redisClient.on('connect', () => {
  logger.info('✅ Redis client connected');
});

redisClient.on('ready', () => {
  logger.info('✅ Redis client ready');
});

redisClient.on('error', (error) => {
  logger.error('❌ Redis client error:', error);
});

redisClient.on('close', () => {
  logger.warn('⚠️ Redis client connection closed');
});

redisSubscriber.on('connect', () => {
  logger.info('✅ Redis subscriber connected');
});

redisSubscriber.on('error', (error) => {
  logger.error('❌ Redis subscriber error:', error);
});

/**
 * Test Redis connection
 */
export const testRedisConnection = async (): Promise<boolean> => {
  try {
    const result = await redisClient.ping();
    if (result === 'PONG') {
      logger.info('✅ Redis connection test successful');
      return true;
    }
    return false;
  } catch (error) {
    logger.error('❌ Redis connection test failed:', error);
    return false;
  }
};

/**
 * Close Redis connections gracefully
 */
export const closeRedisConnections = async (): Promise<void> => {
  try {
    await redisClient.quit();
    await redisSubscriber.quit();
    logger.info('✅ Redis connections closed gracefully');
  } catch (error) {
    logger.error('❌ Error closing Redis connections:', error);
  }
};

/**
 * Cache utility functions
 */
export class RedisCache {
  /**
   * Set a value in cache with optional TTL
   */
  static async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    try {
      const serializedValue = JSON.stringify(value);
      if (ttlSeconds) {
        await redisClient.setex(key, ttlSeconds, serializedValue);
      } else {
        await redisClient.set(key, serializedValue);
      }
    } catch (error) {
      logger.error(`Error setting cache key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Get a value from cache
   */
  static async get<T>(key: string): Promise<T | null> {
    try {
      const value = await redisClient.get(key);
      if (!value) return null;
      return JSON.parse(value) as T;
    } catch (error) {
      logger.error(`Error getting cache key ${key}:`, error);
      return null;
    }
  }

  /**
   * Delete a key from cache
   */
  static async del(key: string): Promise<void> {
    try {
      await redisClient.del(key);
    } catch (error) {
      logger.error(`Error deleting cache key ${key}:`, error);
    }
  }

  /**
   * Delete multiple keys matching a pattern
   */
  static async delPattern(pattern: string): Promise<void> {
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(...keys);
      }
    } catch (error) {
      logger.error(`Error deleting cache pattern ${pattern}:`, error);
    }
  }

  /**
   * Check if key exists
   */
  static async exists(key: string): Promise<boolean> {
    try {
      const result = await redisClient.exists(key);
      return result === 1;
    } catch (error) {
      logger.error(`Error checking cache key ${key}:`, error);
      return false;
    }
  }

  /**
   * Set expiration on a key
   */
  static async expire(key: string, ttlSeconds: number): Promise<void> {
    try {
      await redisClient.expire(key, ttlSeconds);
    } catch (error) {
      logger.error(`Error setting expiration on key ${key}:`, error);
    }
  }

  /**
   * Increment a counter
   */
  static async incr(key: string): Promise<number> {
    try {
      return await redisClient.incr(key);
    } catch (error) {
      logger.error(`Error incrementing key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Get TTL of a key
   */
  static async ttl(key: string): Promise<number> {
    try {
      return await redisClient.ttl(key);
    } catch (error) {
      logger.error(`Error getting TTL for key ${key}:`, error);
      return -1;
    }
  }
}

/**
 * Session storage utilities
 */
export class RedisSession {
  private static readonly SESSION_PREFIX = 'session:';
  private static readonly DEFAULT_TTL = 86400; // 24 hours

  /**
   * Store session data
   */
  static async set(sessionId: string, data: any, ttlSeconds?: number): Promise<void> {
    const key = `${this.SESSION_PREFIX}${sessionId}`;
    await RedisCache.set(key, data, ttlSeconds || this.DEFAULT_TTL);
  }

  /**
   * Get session data
   */
  static async get<T>(sessionId: string): Promise<T | null> {
    const key = `${this.SESSION_PREFIX}${sessionId}`;
    return await RedisCache.get<T>(key);
  }

  /**
   * Delete session
   */
  static async del(sessionId: string): Promise<void> {
    const key = `${this.SESSION_PREFIX}${sessionId}`;
    await RedisCache.del(key);
  }

  /**
   * Extend session TTL
   */
  static async extend(sessionId: string, ttlSeconds?: number): Promise<void> {
    const key = `${this.SESSION_PREFIX}${sessionId}`;
    await RedisCache.expire(key, ttlSeconds || this.DEFAULT_TTL);
  }
}

export default redisClient;
