// Twitter verification utilities for SolSkill
// Uses Twitter API v2 with bearer token

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

interface TweetData {
  id: string;
  text: string;
  authorId: string;
  authorUsername: string;
  authorName: string;
  createdAt: string;
}

interface VerificationResult {
  success: boolean;
  error?: string;
  tweetData?: TweetData;
  containsCode?: boolean;
}

// Load Twitter credentials
function getTwitterBearerToken(): string | null {
  const credPath = join(process.env.HOME || '', '.config/twitter/credentials.json');
  
  if (!existsSync(credPath)) {
    // Try environment variable as fallback
    return process.env.TWITTER_BEARER_TOKEN || null;
  }
  
  try {
    const creds = JSON.parse(readFileSync(credPath, 'utf-8'));
    return creds.bearerToken || null;
  } catch {
    return process.env.TWITTER_BEARER_TOKEN || null;
  }
}

// Extract tweet ID from various Twitter URL formats
export function extractTweetId(urlOrId: string): string | null {
  // If it's already just an ID
  if (/^\d+$/.test(urlOrId)) {
    return urlOrId;
  }
  
  // Various Twitter/X URL formats
  const patterns = [
    /twitter\.com\/\w+\/status\/(\d+)/,
    /x\.com\/\w+\/status\/(\d+)/,
    /mobile\.twitter\.com\/\w+\/status\/(\d+)/,
    /vxtwitter\.com\/\w+\/status\/(\d+)/,
    /fxtwitter\.com\/\w+\/status\/(\d+)/,
  ];
  
  for (const pattern of patterns) {
    const match = urlOrId.match(pattern);
    if (match) return match[1];
  }
  
  return null;
}

// Verify tweet via Twitter API v2
export async function verifyTweetViaApi(tweetUrl: string, verificationCode: string): Promise<VerificationResult> {
  const bearerToken = getTwitterBearerToken();
  
  if (!bearerToken) {
    return {
      success: false,
      error: 'Twitter API credentials not configured'
    };
  }
  
  const tweetId = extractTweetId(tweetUrl);
  if (!tweetId) {
    return {
      success: false,
      error: 'Invalid tweet URL format'
    };
  }
  
  try {
    // Twitter API v2 - Get tweet with author expansion
    const url = `https://api.twitter.com/2/tweets/${tweetId}?expansions=author_id&user.fields=username,name&tweet.fields=created_at,text`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${bearerToken}`,
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      if (response.status === 404) {
        return {
          success: false,
          error: 'Tweet not found'
        };
      }
      
      if (response.status === 401) {
        return {
          success: false,
          error: 'Twitter API authentication failed'
        };
      }
      
      return {
        success: false,
        error: `Twitter API error: ${response.status} - ${errorData.detail || 'Unknown error'}`
      };
    }
    
    const data = await response.json();
    
    if (!data.data) {
      return {
        success: false,
        error: 'Tweet not found or deleted'
      };
    }
    
    const tweet = data.data;
    const author = data.includes?.users?.[0];
    
    if (!author) {
      return {
        success: false,
        error: 'Could not retrieve tweet author information'
      };
    }
    
    const tweetData: TweetData = {
      id: tweet.id,
      text: tweet.text,
      authorId: author.id,
      authorUsername: author.username,
      authorName: author.name,
      createdAt: tweet.created_at,
    };
    
    // Check if verification code is in the tweet
    const containsCode = tweet.text.toLowerCase().includes(verificationCode.toLowerCase());
    
    return {
      success: true,
      tweetData,
      containsCode,
    };
    
  } catch (error) {
    console.error('Twitter API error:', error);
    return {
      success: false,
      error: `Failed to verify tweet: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

// Fallback: Try to scrape tweet via nitter or syndication
export async function verifyTweetViaScraping(tweetUrl: string, verificationCode: string): Promise<VerificationResult> {
  const tweetId = extractTweetId(tweetUrl);
  if (!tweetId) {
    return {
      success: false,
      error: 'Invalid tweet URL format'
    };
  }
  
  // Try Twitter's syndication API (public, no auth needed)
  try {
    const syndicationUrl = `https://cdn.syndication.twimg.com/tweet-result?id=${tweetId}&token=0`;
    
    const response = await fetch(syndicationUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SolSkillBot/1.0)',
      }
    });
    
    if (!response.ok) {
      throw new Error(`Syndication API returned ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.text || !data.user) {
      return {
        success: false,
        error: 'Could not parse tweet data'
      };
    }
    
    const tweetData: TweetData = {
      id: tweetId,
      text: data.text,
      authorId: data.user.id_str || '',
      authorUsername: data.user.screen_name,
      authorName: data.user.name,
      createdAt: data.created_at || new Date().toISOString(),
    };
    
    const containsCode = data.text.toLowerCase().includes(verificationCode.toLowerCase());
    
    return {
      success: true,
      tweetData,
      containsCode,
    };
    
  } catch (error) {
    console.error('Scraping fallback failed:', error);
    return {
      success: false,
      error: 'Could not verify tweet (API and fallback methods failed)'
    };
  }
}

// Main verification function - tries API first, then fallback
export async function verifyTweet(tweetUrl: string, verificationCode: string): Promise<VerificationResult> {
  // Try official API first
  const apiResult = await verifyTweetViaApi(tweetUrl, verificationCode);
  
  if (apiResult.success) {
    return apiResult;
  }
  
  // If API fails (but not due to invalid URL), try fallback
  if (apiResult.error && !apiResult.error.includes('Invalid tweet URL')) {
    console.log('Twitter API failed, trying fallback:', apiResult.error);
    return verifyTweetViaScraping(tweetUrl, verificationCode);
  }
  
  return apiResult;
}
