// Cookie management utilities
export type CookieConsentType = 'all' | 'essential' | 'rejected' | null;

export const getCookieConsent = (): CookieConsentType => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('cookieConsent') as CookieConsentType;
};

export const setCookieConsent = (consent: CookieConsentType) => {
    if (typeof window === 'undefined') return;
    
    if (consent) {
        localStorage.setItem('cookieConsent', consent);
        setEssentialCookie('cookieConsentDate', new Date().toISOString(), 365);
        
        // If user rejected or only accepted essential, clear non-essential cookies
        if (consent === 'rejected' || consent === 'essential') {
            clearNonEssentialCookies();
        }
    } else {
        localStorage.removeItem('cookieConsent');
        clearNonEssentialCookies();
    }
};

export const hasConsentForAnalytics = (): boolean => {
    const consent = getCookieConsent();
    return consent === 'all';
};

export const hasConsentForEssential = (): boolean => {
    const consent = getCookieConsent();
    return consent === 'all' || consent === 'essential';
};

// Analytics wrapper that respects cookie consent
export const trackEvent = (eventName: string, properties?: Record<string, any>) => {
    if (!hasConsentForAnalytics()) {
        return; // Analytics tracking blocked by cookie consent
    }
    
    // Here you would integrate with your analytics service
    // For example: gtag('event', eventName, properties);
    // Analytics event tracked: eventName, properties
    
    // Store analytics data locally if needed
    try {
        const analyticsData = JSON.parse(localStorage.getItem('smartadvisor_analytics') || '[]');
        analyticsData.push({
            event: eventName,
            properties,
            timestamp: new Date().toISOString()
        });
        
        // Keep only last 100 events
        if (analyticsData.length > 100) {
            analyticsData.splice(0, analyticsData.length - 100);
        }
        
        localStorage.setItem('smartadvisor_analytics', JSON.stringify(analyticsData));
    } catch (error) {
        // Could not store analytics data - silently fail
    }
};

// Essential cookies (always allowed)
export const setEssentialCookie = (name: string, value: string, days: number = 30) => {
    if (typeof document === 'undefined') return;
    
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;secure;samesite=strict`;
};

export const getEssentialCookie = (name: string): string | null => {
    if (typeof document === 'undefined') return null;
    
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    
    return null;
};

// Clear all non-essential cookies
export const clearNonEssentialCookies = () => {
    if (typeof document === 'undefined') return;
    
    // Clear analytics and tracking cookies
    const cookiesToClear = ['_ga', '_gid', '_gat', '_gtag', '_fbp', '_fbc'];
    
    cookiesToClear.forEach(cookieName => {
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${window.location.hostname}`;
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    });
    
    // Clear analytics data from localStorage
    try {
        localStorage.removeItem('smartadvisor_analytics');
    } catch (error) {
        // Could not clear analytics data - silently fail
    }
};

// Get cookie preferences summary
export const getCookiePreferences = () => {
    const consent = getCookieConsent();
    return {
        consent,
        essential: true, // Always true
        analytics: hasConsentForAnalytics(),
        functional: hasConsentForEssential(),
        lastUpdated: getEssentialCookie('cookieConsentDate') || 'Not set'
    };
};
