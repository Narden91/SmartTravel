// services/cityAutocompleteService.ts
import { CityResult, searchDestinations, getInitialSuggestions } from './cityService';

// Enhanced interfaces
export interface EnhancedCityResult extends CityResult {
  coordinates?: [number, number]; // [latitude, longitude]
  source: 'local' | 'api' | 'cache';
  confidence: number; // 0-100
  timestamp?: number;
}

export interface AutocompleteOptions {
  maxResults?: number;
  useExternalAPI?: boolean;
  cacheTimeout?: number; // milliseconds
  fallbackToLocal?: boolean;
  minQueryLength?: number;
}

// In-memory cache with TTL
class CacheManager {
  private cache = new Map<string, { data: EnhancedCityResult[]; timestamp: number }>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes

  set(key: string, data: EnhancedCityResult[], ttl: number = this.defaultTTL): void {
    this.cache.set(key, {
      data: data.map(item => ({ ...item, timestamp: Date.now() })),
      timestamp: Date.now() + ttl
    });
  }

  get(key: string): EnhancedCityResult[] | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.timestamp) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  clear(): void {
    this.cache.clear();
  }

  // Clean expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.timestamp) {
        this.cache.delete(key);
      }
    }
  }
}

// Global cache instance
const cache = new CacheManager();

// Cleanup cache every 10 minutes
setInterval(() => cache.cleanup(), 10 * 60 * 1000);

// Rate limiter for API calls
class RateLimiter {
  private requests = new Map<string, number[]>();
  private maxRequests = 20; // 20 requests per minute (conservative for Nominatim)
  private windowMs = 60 * 1000; // 1 minute

  canMakeRequest(key: string = 'default'): boolean {
    const now = Date.now();
    const requests = this.requests.get(key) || [];
    
    // Remove old requests
    const validRequests = requests.filter(time => now - time < this.windowMs);
    
    if (validRequests.length >= this.maxRequests) {
      return false;
    }
    
    validRequests.push(now);
    this.requests.set(key, validRequests);
    return true;
  }

  getRetryAfter(key: string = 'default'): number {
    const requests = this.requests.get(key) || [];
    if (requests.length === 0) return 0;
    
    const oldestRequest = Math.min(...requests);
    const retryAfter = this.windowMs - (Date.now() - oldestRequest);
    return Math.max(0, Math.ceil(retryAfter / 1000));
  }
}

const rateLimiter = new RateLimiter();

// Enhanced error handling
class AutocompleteError extends Error {
  constructor(
    message: string,
    public code: string,
    public retryable: boolean = false,
    public retryAfter?: number
  ) {
    super(message);
    this.name = 'AutocompleteError';
  }
}

// External API integration
async function fetchFromExternalAPI(
  query: string, 
  options: AutocompleteOptions
): Promise<EnhancedCityResult[]> {
  const { maxResults = 8 } = options;

  // Check rate limiting
  if (!rateLimiter.canMakeRequest()) {
    const retryAfter = rateLimiter.getRetryAfter();
    throw new AutocompleteError(
      'Rate limit exceeded',
      'RATE_LIMIT_EXCEEDED',
      true,
      retryAfter
    );
  }

  try {
    // Use OpenStreetMap Nominatim API (CORS-enabled, free)
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    // For development, use proxy. For production (GitHub Pages), use direct API with CORS support
    const apiUrl = isDevelopment 
      ? `/api/geocoding/search?name=${encodeURIComponent(query)}&count=${maxResults}&language=it&format=json`
      : `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=${Math.min(maxResults, 10)}&accept-language=it&addressdetails=1&extratags=1&namedetails=1`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout for external API

    const headers: HeadersInit = {
      'Accept': 'application/json',
    };

    // Add User-Agent for Nominatim (required by their usage policy)
    if (!isDevelopment) {
      // Note: User-Agent cannot be set from browser, but Nominatim accepts requests without it from browsers
    }

    const response = await fetch(apiUrl, {
      signal: controller.signal,
      headers,
      method: 'GET',
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 429) {
        throw new AutocompleteError(
          'API rate limit exceeded',
          'API_RATE_LIMIT',
          true,
          60
        );
      }
      throw new AutocompleteError(
        `API request failed: ${response.status}`,
        'API_ERROR',
        response.status >= 500
      );
    }

    const data = await response.json();
    
    // Handle different API response formats
    let results: any[] = [];
    
    if (isDevelopment) {
      // Development proxy response format
      results = data.results || [];
    } else {
      // Nominatim response format
      results = Array.isArray(data) ? data : [];
    }
    
    return results.map((item: any) => {
      // Handle Nominatim format
      if (!isDevelopment) {
        const displayName = item.display_name || item.name || '';
        const nameParts = displayName.split(',').map((part: string) => part.trim());
        
        // Extract city and country from display_name
        const city = item.name || nameParts[0] || '';
        const country = nameParts[nameParts.length - 1] || '';
        
        // Determine type based on OSM data
        let type: 'city' | 'country' | 'region' = 'city';
        if (item.class === 'place') {
          if (['country'].includes(item.type)) {
            type = 'country';
          } else if (['state', 'region', 'province'].includes(item.type)) {
            type = 'region';
          }
        }
        
        // Calculate popularity based on importance score
        const importance = parseFloat(item.importance || '0');
        const popularity = Math.min(10, Math.max(1, Math.round(importance * 10)));
        
        return {
          name: city,
          country: country,
          displayName: `${city}${country && country !== city ? `, ${country}` : ''}`,
          type,
          popularity,
          coordinates: item.lat && item.lon ? [parseFloat(item.lat), parseFloat(item.lon)] as [number, number] : undefined,
          source: 'api' as const,
          confidence: Math.min(95, 70 + (importance * 25)), // Convert importance to confidence
        };
      } else {
        // Development proxy format (kept for consistency)
        return {
          name: item.name,
          country: item.country || '',
          displayName: item.displayName || `${item.name}${item.country ? `, ${item.country}` : ''}`,
          type: item.type || 'city',
          popularity: item.popularity || 5,
          coordinates: item.coordinates,
          source: 'api' as const,
          confidence: 85,
        };
      }
    }).slice(0, maxResults); // Ensure we don't exceed maxResults

  } catch (error) {
    if (error instanceof AutocompleteError) {
      throw error;
    }

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new AutocompleteError(
          'Request timeout',
          'TIMEOUT',
          true
        );
      }
      
      throw new AutocompleteError(
        'Network error',
        'NETWORK_ERROR',
        true
      );
    }

    throw new AutocompleteError(
      'Unknown error occurred',
      'UNKNOWN_ERROR',
      false
    );
  }
}

// Main autocomplete function
export async function getAutocompleteResults(
  query: string,
  options: AutocompleteOptions = {}
): Promise<{
  results: EnhancedCityResult[];
  source: 'local' | 'api' | 'cache' | 'mixed';
  error?: AutocompleteError;
  fromCache: boolean;
}> {
  const {
    maxResults = 8,
    useExternalAPI = true,
    cacheTimeout = 5 * 60 * 1000, // 5 minutes
    fallbackToLocal = true,
    minQueryLength = 2
  } = options;

  // Input validation
  if (!query || query.trim().length < minQueryLength) {
    const localResults = getInitialSuggestions(maxResults).map(item => ({
      ...item,
      source: 'local' as const,
      confidence: 100
    }));
    
    return {
      results: localResults,
      source: 'local',
      fromCache: false
    };
  }

  const sanitizedQuery = query.trim().toLowerCase();
  const cacheKey = `autocomplete:${sanitizedQuery}:${maxResults}`;

  // Check cache first
  const cachedResults = cache.get(cacheKey);
  if (cachedResults) {
    return {
      results: cachedResults,
      source: 'cache',
      fromCache: true
    };
  }

  // Get local results (always available)
  const localResults = searchDestinations(query, { maxResults }).map(item => ({
    ...item,
    source: 'local' as const,
    confidence: 90
  }));

  // If external API is disabled or we have good local results, return local only
  if (!useExternalAPI || localResults.length >= maxResults) {
    const enhancedLocalResults = localResults.slice(0, maxResults);
    cache.set(cacheKey, enhancedLocalResults, cacheTimeout);
    
    return {
      results: enhancedLocalResults,
      source: 'local',
      fromCache: false
    };
  }

  // Try external API
  try {
    const apiResults = await fetchFromExternalAPI(query, options);
    
    // Merge and deduplicate results
    const allResults = [...localResults, ...apiResults];
    const deduplicatedResults = deduplicateResults(allResults);
    
    // Sort by confidence and popularity
    const sortedResults = deduplicatedResults
      .sort((a, b) => {
        // Prioritize local exact matches
        if (a.source === 'local' && b.source === 'api' && a.confidence === 100) {
          return -1;
        }
        if (b.source === 'local' && a.source === 'api' && b.confidence === 100) {
          return 1;
        }
        
        // Then sort by confidence and popularity
        const confidenceDiff = b.confidence - a.confidence;
        if (confidenceDiff !== 0) return confidenceDiff;
        
        return (b.popularity || 0) - (a.popularity || 0);
      })
      .slice(0, maxResults);

    cache.set(cacheKey, sortedResults, cacheTimeout);

    return {
      results: sortedResults,
      source: localResults.length > 0 ? 'mixed' : 'api',
      fromCache: false
    };

  } catch (error) {
    // Fallback to local results on API error
    if (fallbackToLocal && localResults.length > 0) {
      const enhancedLocalResults = localResults.slice(0, maxResults);
      cache.set(cacheKey, enhancedLocalResults, cacheTimeout);
      
      return {
        results: enhancedLocalResults,
        source: 'local',
        error: error instanceof AutocompleteError ? error : undefined,
        fromCache: false
      };
    }

    // No local results and API failed
    throw error;
  }
}

// Utility function to deduplicate results
function deduplicateResults(results: EnhancedCityResult[]): EnhancedCityResult[] {
  const seen = new Set<string>();
  const deduplicated: EnhancedCityResult[] = [];

  for (const result of results) {
    const key = `${result.name.toLowerCase()}-${result.country.toLowerCase()}`;
    
    if (!seen.has(key)) {
      seen.add(key);
      deduplicated.push(result);
    } else {
      // If we already have this city, prefer the one with higher confidence
      const existingIndex = deduplicated.findIndex(
        r => `${r.name.toLowerCase()}-${r.country.toLowerCase()}` === key
      );
      
      if (existingIndex !== -1 && result.confidence > deduplicated[existingIndex].confidence) {
        deduplicated[existingIndex] = result;
      }
    }
  }

  return deduplicated;
}

// Utility function to clear cache (useful for testing)
export function clearAutocompleteCache(): void {
  cache.clear();
}

// Performance monitoring
export function getAutocompleteStats(): {
  cacheSize: number;
  rateLimitStatus: { canMakeRequest: boolean; retryAfter: number };
} {
  return {
    cacheSize: cache['cache'].size,
    rateLimitStatus: {
      canMakeRequest: rateLimiter.canMakeRequest(),
      retryAfter: rateLimiter.getRetryAfter()
    }
  };
}

export default {
  getAutocompleteResults,
  clearAutocompleteCache,
  getAutocompleteStats,
  AutocompleteError
};
