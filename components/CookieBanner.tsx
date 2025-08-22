import React, { useState, useEffect } from 'react';
import { getCookieConsent, setCookieConsent, trackEvent } from '../services/cookieService';

const CookieBanner: React.FC = () => {
    const [showBanner, setShowBanner] = useState(false);

    useEffect(() => {
        // Check if user has already given consent
        const cookieConsent = getCookieConsent();
        if (!cookieConsent) {
            // Show banner after a short delay for better UX
            const timer = setTimeout(() => {
                setShowBanner(true);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleAcceptAll = () => {
        setCookieConsent('all');
        setShowBanner(false);
        trackEvent('cookie_consent_accepted', { type: 'all' });
        
        // Initialize analytics if accepted
        if (typeof window !== 'undefined') {
            // Analytics initialized - user accepted all cookies
        }
    };

    const handleAcceptEssential = () => {
        setCookieConsent('essential');
        setShowBanner(false);
        trackEvent('cookie_consent_accepted', { type: 'essential' });
    };

    const handleRejectAll = () => {
        setCookieConsent('rejected');
        setShowBanner(false);
        trackEvent('cookie_consent_rejected');
        
        // Clear any existing analytics cookies
        if (typeof document !== 'undefined') {
            document.cookie.split(";").forEach((c) => {
                const eqPos = c.indexOf("=");
                const name = eqPos > -1 ? c.substr(0, eqPos) : c;
                if (name.trim().startsWith('_ga') || name.trim().startsWith('_gt')) {
                    document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
                }
            });
        }
    };

    if (!showBanner) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-sm border-t border-slate-700/50 p-4 animate-slide-up">
            <div className="container max-w-6xl mx-auto">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                    <div className="flex-1">
                        <h3 className="heading-h3 text-white text-lg mb-2">
                            🍪 Gestione Cookie e Privacy
                        </h3>
                        <div className="space-y-2 max-w-2xl">
                            <p className="body text-slate-300">
                                Rispettiamo la tua privacy. Utilizziamo cookie essenziali per il funzionamento del sito 
                                e cookie analitici per migliorare la tua esperienza.
                            </p>
                            <div className="body-sm text-slate-400 space-y-1">
                                <p><strong>• Cookie Essenziali:</strong> Necessari per il funzionamento base (sempre attivi)</p>
                                <p><strong>• Cookie Analitici:</strong> Ci aiutano a capire come migliorare il servizio</p>
                                <p><strong>• Nessun Tracking:</strong> Non vendiamo i tuoi dati a terze parti</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 min-w-fit">
                        <button
                            onClick={handleRejectAll}
                            className="body px-4 py-2 text-slate-400 hover:text-white border border-slate-600 rounded-lg hover:border-slate-500 transition-colors"
                        >
                            Rifiuta Tutto
                        </button>
                        <button
                            onClick={handleAcceptEssential}
                            className="body px-4 py-2 text-slate-300 hover:text-white bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-lg transition-colors"
                        >
                            Solo Essenziali
                        </button>
                        <button
                            onClick={handleAcceptAll}
                            className="body px-4 py-2 text-white bg-cyan-500 hover:bg-cyan-600 rounded-lg font-medium transition-colors"
                        >
                            Accetta Tutto
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CookieBanner;
