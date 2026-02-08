// Simple in-memory rate limiter for SolSkill API
// For production, use Redis or similar

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  const entries = Array.from(rateLimitStore.entries());
  for (const [key, entry] of entries) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Clean every minute

export interface RateLimitConfig {
  windowMs: number;  // Time window in milliseconds
  maxRequests: number;  // Max requests per window
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfterMs?: number;
}

// Check and update rate limit
export function checkRateLimit(
  identifier: string, 
  config: RateLimitConfig = { windowMs: 60000, maxRequests: 10 }
): RateLimitResult {
  const now = Date.now();
  const key = `rate:${identifier}`;
  
  let entry = rateLimitStore.get(key);
  
  // If no entry or window expired, create new
  if (!entry || entry.resetAt < now) {
    entry = {
      count: 1,
      resetAt: now + config.windowMs,
    };
    rateLimitStore.set(key, entry);
    
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt: entry.resetAt,
    };
  }
  
  // Check if limit exceeded
  if (entry.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
      retryAfterMs: entry.resetAt - now,
    };
  }
  
  // Increment counter
  entry.count++;
  rateLimitStore.set(key, entry);
  
  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetAt: entry.resetAt,
  };
}

// Rate limit configs for different endpoints
export const RATE_LIMITS = {
  // Agent registration: 5 per minute per IP
  REGISTER: { windowMs: 60000, maxRequests: 5 },
  
  // Tweet verification: 10 per minute per IP (more lenient for retries)
  VERIFY: { windowMs: 60000, maxRequests: 10 },
  
  // API calls: 100 per minute per API key
  API_CALLS: { windowMs: 60000, maxRequests: 100 },
  
  // Claim: 3 per minute per IP (prevent claim flooding)
  CLAIM: { windowMs: 60000, maxRequests: 3 },
};

// Get client IP from request (handles proxies)
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  
  // Fallback - in development this might be empty
  return 'unknown';
}
