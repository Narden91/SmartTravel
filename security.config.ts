/**
 * Security Configuration
 * 
 * This file centralizes all security-related configurations for the Smart Advisor application.
 * It includes Content Security Policy, security headers, and other security best practices.
 */

export const securityConfig = {
  // Content Security Policy directives
  csp: {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://fonts.googleapis.com"],
    'style-src': ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://fonts.gstatic.com"],
    'font-src': ["'self'", "https://fonts.gstatic.com", "data:"],
    'img-src': ["'self'", "data:", "blob:", "https:"],
    'connect-src': ["'self'", "https://generativelanguage.googleapis.com"],
    'frame-src': ["'none'"],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
    'upgrade-insecure-requests': []
  },

  // Security headers
  headers: {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
  },

  // Permissions Policy (Feature Policy)
  permissionsPolicy: {
    geolocation: [],
    microphone: [],
    camera: [],
    payment: [],
    usb: [],
    magnetometer: [],
    gyroscope: [],
    accelerometer: []
  },

  // Allowed external domains for API calls
  allowedDomains: [
    'generativelanguage.googleapis.com', // Gemini AI API
    'fonts.googleapis.com',              // Google Fonts
    'fonts.gstatic.com'                  // Google Fonts assets
  ],

  // Security validation patterns
  validation: {
    // Input sanitization patterns
    sanitizePattern: /[<>'"&]/g,
    numericPattern: /^[0-9.]*$/,
    maxInputLength: 100,
    maxPortfolioItems: 20,
    
    // Allowed file types (if file upload is ever added)
    allowedFileTypes: ['application/json', 'text/csv'],
    maxFileSize: 1024 * 1024 // 1MB
  }
};

/**
 * Generate CSP string from configuration
 */
export const generateCSPString = (): string => {
  return Object.entries(securityConfig.csp)
    .map(([directive, sources]) => {
      if (sources.length === 0) {
        return directive.replace('-', '-');
      }
      return `${directive} ${sources.join(' ')}`;
    })
    .join('; ');
};

/**
 * Generate Permissions Policy string from configuration
 */
export const generatePermissionsPolicyString = (): string => {
  return Object.entries(securityConfig.permissionsPolicy)
    .map(([feature, allowlist]) => {
      const origins = allowlist.length > 0 ? allowlist.join(' ') : '';
      return `${feature}=(${origins})`;
    })
    .join(', ');
};

/**
 * Input sanitization utility
 */
export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .substring(0, securityConfig.validation.maxInputLength)
    .replace(securityConfig.validation.sanitizePattern, '');
};

/**
 * Validate numeric input
 */
export const validateNumericInput = (value: string, min: number = 0, max: number = Infinity): boolean => {
  const sanitized = value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
  const num = parseFloat(sanitized);
  return !isNaN(num) && num >= min && num <= max;
};

/**
 * Check if domain is allowed for external requests
 */
export const isDomainAllowed = (url: string): boolean => {
  try {
    const domain = new URL(url).hostname;
    return securityConfig.allowedDomains.includes(domain);
  } catch {
    return false;
  }
};
