// API request logging helper for automatic activity tracking
import { NextRequest, NextResponse } from 'next/server';
import { logActivity, ActivityType } from './activity';
import { db } from './db';

type RouteHandler = (req: NextRequest, context?: any) => Promise<NextResponse>;

interface LoggingOptions {
  type?: ActivityType;
  includeBody?: boolean;
  includeResponse?: boolean;
}

/**
 * Wrap an API route handler to automatically log activity
 * 
 * Usage:
 * ```ts
 * export const GET = withActivityLogging(async (req) => {
 *   // your handler code
 *   return NextResponse.json({ ... });
 * });
 * ```
 */
export function withActivityLogging(
  handler: RouteHandler,
  options: LoggingOptions = {}
): RouteHandler {
  return async (req: NextRequest, context?: any) => {
    const startTime = Date.now();
    const url = new URL(req.url);
    const endpoint = url.pathname;
    const method = req.method;
    
    // Extract API key
    const authHeader = req.headers.get('authorization');
    const apiKey = authHeader?.replace('Bearer ', '') || undefined;
    
    // Get agent info if API key provided
    const agent = apiKey ? db.getAgentByApiKey(apiKey) : null;
    
    // Try to get request body for POST/PUT
    let requestBody: Record<string, unknown> | undefined;
    if (options.includeBody && ['POST', 'PUT', 'PATCH'].includes(method)) {
      try {
        const clonedReq = req.clone();
        requestBody = await clonedReq.json();
        // Redact sensitive fields
        if (requestBody) {
          requestBody = redactSensitive(requestBody);
        }
      } catch {
        // Body not JSON or empty
      }
    }
    
    let response: NextResponse;
    let error: string | undefined;
    
    try {
      response = await handler(req, context);
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error';
      response = NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      );
    }
    
    const durationMs = Date.now() - startTime;
    const statusCode = response.status;
    
    // Get response preview if enabled
    let responsePreview: string | undefined;
    if (options.includeResponse) {
      try {
        const clonedRes = response.clone();
        const body = await clonedRes.text();
        responsePreview = body.substring(0, 500);
      } catch {
        // Can't read response
      }
    }
    
    // Determine activity type
    let type: ActivityType = options.type || 'api_call';
    if (statusCode >= 400) {
      type = 'error';
    } else if (endpoint.includes('/deposit')) {
      type = 'deposit';
    } else if (endpoint.includes('/withdraw')) {
      type = 'withdraw';
    } else if (endpoint.includes('/borrow')) {
      type = 'borrow';
    } else if (endpoint.includes('/repay')) {
      type = 'repay';
    } else if (endpoint.includes('/swap')) {
      type = 'swap';
    }
    
    // Log the activity
    logActivity({
      type,
      apiKey,
      agentId: agent?.id,
      endpoint,
      method,
      statusCode,
      durationMs,
      requestBody,
      responsePreview,
      error,
      ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
      userAgent: req.headers.get('user-agent') || undefined,
    });
    
    // Update agent request count
    if (apiKey && agent) {
      db.incrementRequestCount(apiKey);
    }
    
    return response;
  };
}

/**
 * Manual logging for custom events
 */
export function logApiCall(
  req: NextRequest,
  statusCode: number,
  options: {
    type?: ActivityType;
    error?: string;
    metadata?: Record<string, unknown>;
    durationMs?: number;
  } = {}
) {
  const url = new URL(req.url);
  const authHeader = req.headers.get('authorization');
  const apiKey = authHeader?.replace('Bearer ', '') || undefined;
  const agent = apiKey ? db.getAgentByApiKey(apiKey) : null;
  
  logActivity({
    type: options.type || (statusCode >= 400 ? 'error' : 'api_call'),
    apiKey,
    agentId: agent?.id,
    endpoint: url.pathname,
    method: req.method,
    statusCode,
    durationMs: options.durationMs,
    error: options.error,
    metadata: options.metadata,
    ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
    userAgent: req.headers.get('user-agent') || undefined,
  });
}

/**
 * Redact sensitive fields from request body
 */
function redactSensitive(obj: Record<string, unknown>): Record<string, unknown> {
  const sensitiveKeys = ['password', 'secret', 'token', 'key', 'privateKey', 'seed', 'mnemonic'];
  const result: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (sensitiveKeys.some(s => key.toLowerCase().includes(s))) {
      result[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      result[key] = redactSensitive(value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }
  
  return result;
}
