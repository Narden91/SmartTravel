/**
 * Rate Limiting and API Abuse Protection Service
 * 
 * This service implements multiple layers of protection:
 * 1. Request frequency limits (requests per minute/hour)
 * 2. Token bucket algorithm for burst protection
 * 3. IP-based tracking and blocking
 * 4. Request size validation
 * 5. Suspicious pattern detection
 * 6. Circuit breaker for API protection
 */

interface RequestLog {
    timestamp: number;
    ip: string;
    size: number;
    endpoint: string;
}

interface RateLimitConfig {
    maxRequestsPerMinute: number;
    maxRequestsPerHour: number;
    maxRequestSize: number; // in bytes
    bucketCapacity: number;
    refillRate: number; // tokens per second
    blockDurationMinutes: number;
    suspiciousThreshold: number; // requests in short time that trigger investigation
}

interface CircuitBreakerState {
    failures: number;
    lastFailureTime: number;
    state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
}

class RateLimitService {
    private static instance: RateLimitService;
    private requestLogs: Map<string, RequestLog[]> = new Map();
    private tokenBuckets: Map<string, { tokens: number; lastRefill: number }> = new Map();
    private blockedIPs: Map<string, number> = new Map();
    private circuitBreaker: CircuitBreakerState = {
        failures: 0,
        lastFailureTime: 0,
        state: 'CLOSED'
    };

    private config: RateLimitConfig = {
        maxRequestsPerMinute: 10,
        maxRequestsPerHour: 100,
        maxRequestSize: 50000, // 50KB
        bucketCapacity: 20,
        refillRate: 0.5, // 0.5 tokens per second = 30 per minute
        blockDurationMinutes: 15,
        suspiciousThreshold: 5 // 5 requests in 10 seconds
    };

    private constructor() {
        // Clean up old logs every 5 minutes
        setInterval(() => this.cleanupOldLogs(), 5 * 60 * 1000);
        // Update circuit breaker state every minute
        setInterval(() => this.updateCircuitBreaker(), 60 * 1000);
    }

    public static getInstance(): RateLimitService {
        if (!RateLimitService.instance) {
            RateLimitService.instance = new RateLimitService();
        }
        return RateLimitService.instance;
    }

    /**
     * Get client IP address (simulated for client-side)
     * In a real implementation, this would be handled server-side
     */
    private getClientIP(): string {
        // For client-side, we'll use a combination of factors to create a unique identifier
        const factors = [
            navigator.userAgent,
            navigator.language,
            screen.width + 'x' + screen.height,
            Intl.DateTimeFormat().resolvedOptions().timeZone
        ];
        
        // Create a simple hash of the factors
        let hash = 0;
        const combined = factors.join('|');
        for (let i = 0; i < combined.length; i++) {
            const char = combined.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        
        return `client_${Math.abs(hash)}`;
    }

    /**
     * Check if an IP is currently blocked
     */
    private isIPBlocked(ip: string): boolean {
        const blockExpiry = this.blockedIPs.get(ip);
        if (!blockExpiry) return false;
        
        if (Date.now() > blockExpiry) {
            this.blockedIPs.delete(ip);
            return false;
        }
        
        return true;
    }

    /**
     * Block an IP address for the configured duration
     */
    private blockIP(ip: string): void {
        const blockUntil = Date.now() + (this.config.blockDurationMinutes * 60 * 1000);
        this.blockedIPs.set(ip, blockUntil);
        console.warn(`[RateLimit] IP ${ip} blocked until ${new Date(blockUntil).toISOString()}`);
    }

    /**
     * Implement token bucket algorithm for burst protection
     */
    private checkTokenBucket(ip: string): boolean {
        const now = Date.now();
        let bucket = this.tokenBuckets.get(ip);
        
        if (!bucket) {
            bucket = { tokens: this.config.bucketCapacity, lastRefill: now };
            this.tokenBuckets.set(ip, bucket);
        }
        
        // Refill tokens based on time passed
        const timePassed = (now - bucket.lastRefill) / 1000; // seconds
        const tokensToAdd = timePassed * this.config.refillRate;
        bucket.tokens = Math.min(this.config.bucketCapacity, bucket.tokens + tokensToAdd);
        bucket.lastRefill = now;
        
        // Check if we have tokens available
        if (bucket.tokens >= 1) {
            bucket.tokens -= 1;
            return true;
        }
        
        return false;
    }

    /**
     * Check for suspicious patterns in request timing
     */
    private checkSuspiciousPatterns(ip: string, logs: RequestLog[]): boolean {
        const now = Date.now();
        const recentRequests = logs.filter(log => (now - log.timestamp) < 10000); // Last 10 seconds
        
        if (recentRequests.length >= this.config.suspiciousThreshold) {
            console.warn(`[RateLimit] Suspicious pattern detected for IP ${ip}: ${recentRequests.length} requests in 10 seconds`);
            return true;
        }
        
        // Check for unusual request sizes
        const avgSize = logs.length > 0 ? logs.reduce((sum, log) => sum + log.size, 0) / logs.length : 0;
        const lastRequest = logs[logs.length - 1];
        if (lastRequest && lastRequest.size > avgSize * 3 && lastRequest.size > 10000) {
            console.warn(`[RateLimit] Unusual request size detected: ${lastRequest.size} bytes`);
            return true;
        }
        
        return false;
    }

    /**
     * Update circuit breaker state based on recent failures
     */
    private updateCircuitBreaker(): void {
        const now = Date.now();
        const timeSinceLastFailure = now - this.circuitBreaker.lastFailureTime;
        
        switch (this.circuitBreaker.state) {
            case 'OPEN':
                // After 5 minutes, try half-open
                if (timeSinceLastFailure > 5 * 60 * 1000) {
                    this.circuitBreaker.state = 'HALF_OPEN';
                    console.log('[RateLimit] Circuit breaker moving to HALF_OPEN state');
                }
                break;
            case 'HALF_OPEN':
                // After 10 minutes without failures, close the circuit
                if (timeSinceLastFailure > 10 * 60 * 1000) {
                    this.circuitBreaker.state = 'CLOSED';
                    this.circuitBreaker.failures = 0;
                    console.log('[RateLimit] Circuit breaker CLOSED - service recovered');
                }
                break;
        }
    }

    /**
     * Record an API failure for circuit breaker
     */
    public recordFailure(): void {
        this.circuitBreaker.failures++;
        this.circuitBreaker.lastFailureTime = Date.now();
        
        if (this.circuitBreaker.failures >= 5 && this.circuitBreaker.state === 'CLOSED') {
            this.circuitBreaker.state = 'OPEN';
            console.warn('[RateLimit] Circuit breaker OPEN - too many failures');
        } else if (this.circuitBreaker.state === 'HALF_OPEN') {
            this.circuitBreaker.state = 'OPEN';
            console.warn('[RateLimit] Circuit breaker back to OPEN - failure during recovery');
        }
    }

    /**
     * Check if the circuit breaker allows requests
     */
    public isCircuitBreakerOpen(): boolean {
        return this.circuitBreaker.state === 'OPEN';
    }

    /**
     * Main rate limiting check
     */
    public async checkRateLimit(requestSize: number, endpoint: string = 'api'): Promise<{ allowed: boolean; reason?: string; retryAfter?: number }> {
        const ip = this.getClientIP();
        const now = Date.now();

        // Check circuit breaker first
        if (this.isCircuitBreakerOpen()) {
            return {
                allowed: false,
                reason: 'Service temporarily unavailable due to high error rate. Please try again later.',
                retryAfter: 300 // 5 minutes
            };
        }

        // Check if IP is blocked
        if (this.isIPBlocked(ip)) {
            const blockExpiry = this.blockedIPs.get(ip)!;
            return {
                allowed: false,
                reason: 'Your IP address has been temporarily blocked due to excessive requests.',
                retryAfter: Math.ceil((blockExpiry - now) / 1000)
            };
        }

        // Check request size
        if (requestSize > this.config.maxRequestSize) {
            console.warn(`[RateLimit] Request size too large: ${requestSize} bytes`);
            return {
                allowed: false,
                reason: 'Request payload too large. Please reduce the amount of data being sent.'
            };
        }

        // Get or create request logs for this IP
        let logs = this.requestLogs.get(ip) || [];
        
        // Check token bucket (burst protection)
        if (!this.checkTokenBucket(ip)) {
            return {
                allowed: false,
                reason: 'Too many requests too quickly. Please wait a moment and try again.',
                retryAfter: 60
            };
        }

        // Check rate limits
        const oneMinuteAgo = now - 60 * 1000;
        const oneHourAgo = now - 60 * 60 * 1000;
        
        const requestsLastMinute = logs.filter(log => log.timestamp > oneMinuteAgo).length;
        const requestsLastHour = logs.filter(log => log.timestamp > oneHourAgo).length;

        if (requestsLastMinute >= this.config.maxRequestsPerMinute) {
            return {
                allowed: false,
                reason: 'Rate limit exceeded: too many requests per minute.',
                retryAfter: 60
            };
        }

        if (requestsLastHour >= this.config.maxRequestsPerHour) {
            return {
                allowed: false,
                reason: 'Rate limit exceeded: too many requests per hour.',
                retryAfter: 3600
            };
        }

        // Check for suspicious patterns
        if (this.checkSuspiciousPatterns(ip, logs)) {
            this.blockIP(ip);
            return {
                allowed: false,
                reason: 'Suspicious activity detected. Your IP has been temporarily blocked.',
                retryAfter: this.config.blockDurationMinutes * 60
            };
        }

        // Log this request
        const requestLog: RequestLog = {
            timestamp: now,
            ip,
            size: requestSize,
            endpoint
        };
        
        logs.push(requestLog);
        this.requestLogs.set(ip, logs);

        return { allowed: true };
    }

    /**
     * Clean up old request logs to prevent memory leaks
     */
    private cleanupOldLogs(): void {
        const cutoff = Date.now() - 2 * 60 * 60 * 1000; // Keep logs for 2 hours
        
        for (const [ip, logs] of this.requestLogs.entries()) {
            const filteredLogs = logs.filter(log => log.timestamp > cutoff);
            if (filteredLogs.length === 0) {
                this.requestLogs.delete(ip);
            } else {
                this.requestLogs.set(ip, filteredLogs);
            }
        }

        // Clean up old token buckets
        for (const [ip, bucket] of this.tokenBuckets.entries()) {
            if (Date.now() - bucket.lastRefill > 2 * 60 * 60 * 1000) {
                this.tokenBuckets.delete(ip);
            }
        }

        // Clean up expired IP blocks
        for (const [ip, expiry] of this.blockedIPs.entries()) {
            if (Date.now() > expiry) {
                this.blockedIPs.delete(ip);
            }
        }
    }

    /**
     * Get current rate limit status for debugging
     */
    public getStatus(): {
        currentIP: string;
        isBlocked: boolean;
        requestsLastMinute: number;
        requestsLastHour: number;
        tokensAvailable: number;
        circuitBreakerState: string;
    } {
        const ip = this.getClientIP();
        const now = Date.now();
        const logs = this.requestLogs.get(ip) || [];
        const bucket = this.tokenBuckets.get(ip);
        
        return {
            currentIP: ip,
            isBlocked: this.isIPBlocked(ip),
            requestsLastMinute: logs.filter(log => (now - log.timestamp) < 60 * 1000).length,
            requestsLastHour: logs.filter(log => (now - log.timestamp) < 60 * 60 * 1000).length,
            tokensAvailable: bucket ? Math.floor(bucket.tokens) : this.config.bucketCapacity,
            circuitBreakerState: this.circuitBreaker.state
        };
    }

    /**
     * Reset rate limits for current client (for testing/debugging)
     */
    public reset(): void {
        const ip = this.getClientIP();
        this.requestLogs.delete(ip);
        this.tokenBuckets.delete(ip);
        this.blockedIPs.delete(ip);
        console.log(`[RateLimit] Reset rate limits for IP ${ip}`);
    }
}

export default RateLimitService;
