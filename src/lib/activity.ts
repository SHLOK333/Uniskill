// Activity logging system for SolSkill API
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const DATA_DIR = join(process.cwd(), '.data');
const ACTIVITIES_FILE = join(DATA_DIR, 'activities.json');

// Activity types
export type ActivityType = 
  | 'api_call'
  | 'wallet_created'
  | 'deposit'
  | 'withdraw'
  | 'borrow'
  | 'repay'
  | 'swap'
  | 'agent_registered'
  | 'agent_verified'
  | 'error';

export interface Activity {
  id: string;
  timestamp: string;
  type: ActivityType;
  apiKey?: string;
  agentId?: string;
  endpoint: string;
  method: string;
  statusCode: number;
  durationMs?: number;
  requestBody?: Record<string, unknown>;
  responsePreview?: string;
  error?: string;
  metadata?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
}

// Ensure data directory exists
function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

// Load activities from file
function loadActivities(): Activity[] {
  ensureDataDir();
  if (!existsSync(ACTIVITIES_FILE)) {
    return [];
  }
  try {
    const data = JSON.parse(readFileSync(ACTIVITIES_FILE, 'utf-8'));
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

// Save activities to file
function saveActivities(activities: Activity[]) {
  ensureDataDir();
  writeFileSync(ACTIVITIES_FILE, JSON.stringify(activities, null, 2));
}

// Generate unique ID
function generateId(): string {
  return `act_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Log an activity
 */
export function logActivity(activity: Omit<Activity, 'id' | 'timestamp'>): Activity {
  const activities = loadActivities();
  
  const newActivity: Activity = {
    id: generateId(),
    timestamp: new Date().toISOString(),
    ...activity,
  };
  
  // Keep only last 10000 activities to prevent file bloat
  if (activities.length >= 10000) {
    activities.shift();
  }
  
  activities.push(newActivity);
  saveActivities(activities);
  
  return newActivity;
}

/**
 * Get activities with optional filters
 */
export function getActivities(options: {
  limit?: number;
  offset?: number;
  type?: ActivityType;
  apiKey?: string;
  agentId?: string;
  startDate?: string;
  endDate?: string;
  endpoint?: string;
  method?: string;
  minStatus?: number;
  maxStatus?: number;
} = {}): { activities: Activity[]; total: number } {
  let activities = loadActivities();
  
  // Apply filters
  if (options.type) {
    activities = activities.filter(a => a.type === options.type);
  }
  
  if (options.apiKey) {
    activities = activities.filter(a => a.apiKey === options.apiKey);
  }
  
  if (options.agentId) {
    activities = activities.filter(a => a.agentId === options.agentId);
  }
  
  if (options.endpoint) {
    const endpoint = options.endpoint;
    activities = activities.filter(a => a.endpoint.includes(endpoint));
  }
  
  if (options.method) {
    const method = options.method;
    activities = activities.filter(a => a.method.toUpperCase() === method.toUpperCase());
  }
  
  if (options.startDate) {
    const start = new Date(options.startDate).getTime();
    activities = activities.filter(a => new Date(a.timestamp).getTime() >= start);
  }
  
  if (options.endDate) {
    const end = new Date(options.endDate).getTime();
    activities = activities.filter(a => new Date(a.timestamp).getTime() <= end);
  }
  
  if (options.minStatus !== undefined) {
    activities = activities.filter(a => a.statusCode >= options.minStatus!);
  }
  
  if (options.maxStatus !== undefined) {
    activities = activities.filter(a => a.statusCode <= options.maxStatus!);
  }
  
  // Sort by timestamp descending (most recent first)
  activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  
  const total = activities.length;
  
  // Apply pagination
  const offset = options.offset || 0;
  const limit = options.limit || 50;
  activities = activities.slice(offset, offset + limit);
  
  return { activities, total };
}

/**
 * Get activity statistics
 */
export function getActivityStats(apiKey?: string): {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  byEndpoint: Record<string, number>;
  byType: Record<string, number>;
  last24h: number;
  last7d: number;
  avgDurationMs: number;
} {
  let activities = loadActivities();
  
  if (apiKey) {
    activities = activities.filter(a => a.apiKey === apiKey);
  }
  
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  
  const byEndpoint: Record<string, number> = {};
  const byType: Record<string, number> = {};
  let totalDuration = 0;
  let durationCount = 0;
  
  for (const activity of activities) {
    // Count by endpoint
    byEndpoint[activity.endpoint] = (byEndpoint[activity.endpoint] || 0) + 1;
    
    // Count by type
    byType[activity.type] = (byType[activity.type] || 0) + 1;
    
    // Sum durations
    if (activity.durationMs) {
      totalDuration += activity.durationMs;
      durationCount++;
    }
  }
  
  return {
    totalRequests: activities.length,
    successfulRequests: activities.filter(a => a.statusCode >= 200 && a.statusCode < 300).length,
    failedRequests: activities.filter(a => a.statusCode >= 400).length,
    byEndpoint,
    byType,
    last24h: activities.filter(a => now - new Date(a.timestamp).getTime() < day).length,
    last7d: activities.filter(a => now - new Date(a.timestamp).getTime() < 7 * day).length,
    avgDurationMs: durationCount > 0 ? Math.round(totalDuration / durationCount) : 0,
  };
}

/**
 * Clear old activities (keep last N days)
 */
export function clearOldActivities(daysToKeep: number = 30): number {
  const activities = loadActivities();
  const cutoff = Date.now() - daysToKeep * 24 * 60 * 60 * 1000;
  
  const filtered = activities.filter(a => new Date(a.timestamp).getTime() >= cutoff);
  const removed = activities.length - filtered.length;
  
  saveActivities(filtered);
  return removed;
}
