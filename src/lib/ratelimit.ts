import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Create Redis client (only if env vars are set)
function getRedisClient(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  
  if (!url || !token) {
    console.warn('Upstash Redis not configured - rate limiting disabled');
    return null;
  }
  
  return new Redis({ url, token });
}

const redis = getRedisClient();

// Rate limiter for upload endpoint: 5 uploads per hour per IP
export const uploadRatelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '1 h'),
      analytics: true,
      prefix: 'ratelimit:upload',
    })
  : null;

// Rate limiter for Runway API: 10 requests per minute globally
export const runwayRatelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '1 m'),
      analytics: true,
      prefix: 'ratelimit:runway',
    })
  : null;

// Rate limiter for checkout: 10 attempts per hour per IP
export const checkoutRatelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '1 h'),
      analytics: true,
      prefix: 'ratelimit:checkout',
    })
  : null;

// Helper to check rate limit
export async function checkRateLimit(
  limiter: Ratelimit | null,
  identifier: string
): Promise<{ success: boolean; remaining?: number; reset?: Date }> {
  if (!limiter) {
    // Rate limiting disabled, allow all
    return { success: true };
  }
  
  const result = await limiter.limit(identifier);
  
  return {
    success: result.success,
    remaining: result.remaining,
    reset: new Date(result.reset),
  };
}

// Get client IP from request
export function getClientIP(request: Request): string {
  // Check various headers for the real IP
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }
  
  // Fallback
  return 'unknown';
}

