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
    // Pattern for destination inputs (allows letters, spaces, accents, hyphens, apostrophes, periods, commas)
    destinationSanitizePattern: /[<>"\/\\{}|\[\]`^]/g,
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
 * Input sanitization utility for destination fields (allows spaces and common characters)
 */
export const sanitizeDestinationInput = (input: string): string => {
  return input
    .substring(0, securityConfig.validation.maxInputLength)
    .replace(securityConfig.validation.destinationSanitizePattern, '');
};

/**
 * Input sanitization utility for destination fields when submitting (trims spaces)
 */
export const sanitizeDestinationInputForSubmit = (input: string): string => {
  return input
    .trim()
    .substring(0, securityConfig.validation.maxInputLength)
    .replace(securityConfig.validation.destinationSanitizePattern, '');
};

/**
 * Format destination name to proper title case
 * Handles special cases for Italian and international city names
 */
export const formatDestinationName = (input: string): string => {
  if (!input || input.trim().length === 0) return input;
  
  // Words that should remain lowercase (articles, prepositions, etc.)
  const lowercaseWords = new Set([
    'di', 'da', 'del', 'della', 'delle', 'dei', 'degli', 'dal', 'dalla', 'dalle',
    'al', 'alla', 'alle', 'ai', 'agli', 'in', 'con', 'su', 'per', 'tra', 'fra',
    'lo', 'la', 'le', 'il', 'i', 'gli', 'un', 'una', 'uno',
    'of', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'with',
    'by', 'from', 'up', 'about', 'into', 'over', 'after', 'de', 'du', 'des',
    'le', 'la', 'les', 'et', 'ou', 'dans', 'sur', 'avec', 'pour', 'par'
  ]);
  
  // Words that should remain uppercase
  const uppercaseWords = new Set([
    'usa', 'uk', 'uae', 'eu', 'usa', 'urss', 'rsa'
  ]);
  
  return input
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((word, index) => {
      // Remove any non-letter characters for checking, but keep them in the result
      const cleanWord = word.replace(/[^a-zA-ZàáâäèéêëìíîïòóôöùúûüñçÀÁÂÄÈÉÊËÌÍÎÏÒÓÔÖÙÚÛÜÑÇ]/g, '');
      
      // First word is always capitalized
      if (index === 0) {
        return word.charAt(0).toUpperCase() + word.slice(1);
      }
      
      // Check if it's a word that should remain uppercase
      if (uppercaseWords.has(cleanWord.toLowerCase())) {
        return word.toUpperCase();
      }
      
      // Check if it's a word that should remain lowercase (except if it's the first word)
      if (lowercaseWords.has(cleanWord.toLowerCase())) {
        return word.toLowerCase();
      }
      
      // Handle special cases for Italian cities
      if (cleanWord.toLowerCase() === 'san' || cleanWord.toLowerCase() === 'sant' || cleanWord.toLowerCase() === 'santa') {
        return word.charAt(0).toUpperCase() + word.slice(1);
      }
      
      // Default: capitalize first letter
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
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
