import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory rate limiting (for hackathon)
// In production, use Upstash Redis
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 100; // 100 requests per minute

function rateLimit(identifier: string): { success: boolean; remaining: number } {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return { success: true, remaining: RATE_LIMIT_MAX - 1 };
  }
  
  if (record.count >= RATE_LIMIT_MAX) {
    return { success: false, remaining: 0 };
  }
  
  record.count++;
  return { success: true, remaining: RATE_LIMIT_MAX - record.count };
}

// Protected API paths that require authentication
const PROTECTED_PATHS = [
  '/api/v1/jupiter/swap',
  '/api/v1/kamino/deposit',
  '/api/v1/kamino/borrow',
];

// Next.js 16 proxy function (previously middleware)
export default async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Skip non-API routes
  if (!path.startsWith('/api/')) {
    return NextResponse.next();
  }
  
  // Get identifier for rate limiting (API key or IP)
  const apiKey = request.headers.get('x-api-key') || request.headers.get('authorization')?.replace('Bearer ', '');
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
             request.headers.get('x-real-ip') || 
             'unknown';
  const identifier = apiKey || ip;
  
  // Apply rate limiting
  const { success: rateLimitOk, remaining } = rateLimit(identifier);
  
  if (!rateLimitOk) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Rate limit exceeded. Please wait before making more requests.',
        retryAfter: 60 
      },
      { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': RATE_LIMIT_MAX.toString(),
          'X-RateLimit-Remaining': '0',
          'Retry-After': '60',
        }
      }
    );
  }
  
  // Check if path requires authentication
  const isProtected = PROTECTED_PATHS.some(p => path.startsWith(p));
  
  if (isProtected) {
    if (!apiKey) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'API key required. Include x-api-key header or Authorization: Bearer <key>',
          docs: 'https://solskill.ai/skill.md'
        },
        { status: 401 }
      );
    }
    
    // Validate API key format
    if (!apiKey.startsWith('solskill_') || apiKey.length < 40) {
      return NextResponse.json(
        { success: false, error: 'Invalid API key format' },
        { status: 401 }
      );
    }
    
    // Note: Full validation against DB happens in the route handler
    // because proxy runs on edge and can't access file system
  }
  
  // Add rate limit headers to response
  const response = NextResponse.next();
  response.headers.set('X-RateLimit-Limit', RATE_LIMIT_MAX.toString());
  response.headers.set('X-RateLimit-Remaining', remaining.toString());
  
  return response;
}

export const config = {
  matcher: '/api/:path*',
};
