// api/geocoding.ts - Serverless function for Vercel/Netlify
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Rate limiting in-memory store (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Rate limiting configuration
const RATE_LIMIT = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 30, // 30 requests per minute per IP
};

// Simple rate limiter
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const key = `rate_limit:${ip}`;
  
  let record = rateLimitStore.get(key);
  
  if (!record || now > record.resetTime) {
    // Reset or create new record
    record = { count: 1, resetTime: now + RATE_LIMIT.windowMs };
    rateLimitStore.set(key, record);
    return true;
  }
  
  if (record.count >= RATE_LIMIT.maxRequests) {
    return false;
  }
  
  record.count++;
  return true;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', 'https://narden91.github.io');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  
  // Rate limiting
  const clientIP = req.headers['x-forwarded-for'] as string || 
                   req.headers['x-real-ip'] as string || 
                   'unknown';
  
  if (!checkRateLimit(clientIP)) {
    res.status(429).json({ 
      error: 'Rate limit exceeded',
      retryAfter: Math.ceil(RATE_LIMIT.windowMs / 1000)
    });
    return;
  }
  
  try {
    const { q: query, count = '8', language = 'it' } = req.query;
    
    if (!query || typeof query !== 'string') {
      res.status(400).json({ error: 'Query parameter is required' });
      return;
    }
    
    // Input validation
    if (query.length < 2 || query.length > 100) {
      res.status(400).json({ error: 'Query must be between 2 and 100 characters' });
      return;
    }
    
    // Sanitize query
    const sanitizedQuery = query.replace(/[^\w\s\-\.,]/g, '').trim();
    
    if (!sanitizedQuery) {
      res.status(400).json({ error: 'Invalid query format' });
      return;
    }
    
    // Call Open-Meteo Geocoding API
    const apiUrl = new URL('https://geocoding-api.open-meteo.com/v1/search');
    apiUrl.searchParams.set('name', sanitizedQuery);
    apiUrl.searchParams.set('count', String(Math.min(parseInt(count as string) || 8, 20)));
    apiUrl.searchParams.set('language', language as string);
    apiUrl.searchParams.set('format', 'json');
    
    const response = await fetch(apiUrl.toString(), {
      headers: {
        'User-Agent': 'SmartTravel/1.0 (contact@yourapp.com)',
      },
      // Timeout for external API
      signal: AbortSignal.timeout(5000)
    });
    
    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Transform API response to our format
    const results = (data.results || []).map((item: any) => ({
      name: item.name,
      country: item.country || '',
      displayName: `${item.name}${item.admin1 ? `, ${item.admin1}` : ''}${item.country ? `, ${item.country}` : ''}`,
      type: item.feature_code === 'PPLC' ? 'city' : 
            item.feature_code?.startsWith('PPL') ? 'city' : 'region',
      popularity: item.population ? Math.min(10, Math.max(1, Math.log10(item.population))) : 5,
      coordinates: [item.latitude, item.longitude],
      source: 'open-meteo'
    }));
    
    // Cache headers
    res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 hour cache
    res.status(200).json({ results, cached: false });
    
  } catch (error) {
    console.error('Geocoding API error:', error);
    
    if (error instanceof Error && error.name === 'AbortError') {
      res.status(408).json({ error: 'Request timeout' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
