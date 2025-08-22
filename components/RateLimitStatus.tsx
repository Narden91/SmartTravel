import React, { useState, useEffect } from 'react';
import RateLimitService from '../services/rateLimitService';

interface RateLimitStatusProps {
    show?: boolean;
}

const RateLimitStatus: React.FC<RateLimitStatusProps> = ({ show = false }) => {
    const [status, setStatus] = useState<any>(null);
    const [isVisible, setIsVisible] = useState(show);

    useEffect(() => {
        if (isVisible) {
            const updateStatus = () => {
                const rateLimitService = RateLimitService.getInstance();
                setStatus(rateLimitService.getStatus());
            };

            updateStatus();
            const interval = setInterval(updateStatus, 1000);

            return () => clearInterval(interval);
        }
    }, [isVisible]);

    // Toggle visibility with keyboard shortcut (Ctrl+Shift+R)
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.ctrlKey && event.shiftKey && event.key === 'R') {
                setIsVisible(prev => !prev);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    if (!isVisible || !status) return null;

    const getStatusColor = (value: number, threshold: number) => {
        if (value >= threshold * 0.8) return 'text-red-400';
        if (value >= threshold * 0.6) return 'text-yellow-400';
        return 'text-green-400';
    };

    const getCircuitBreakerColor = (state: string) => {
        switch (state) {
            case 'OPEN': return 'text-red-400';
            case 'HALF_OPEN': return 'text-yellow-400';
            case 'CLOSED': return 'text-green-400';
            default: return 'text-gray-400';
        }
    };

    return (
        <div className="fixed bottom-4 right-4 bg-slate-800/95 backdrop-blur-sm border border-slate-600 rounded-lg p-4 text-xs font-mono z-50 min-w-72">
            <div className="flex items-center justify-between mb-3">
                <h4 className="text-cyan-400 font-semibold">Rate Limit Status</h4>
                <button 
                    onClick={() => setIsVisible(false)}
                    className="text-slate-400 hover:text-white transition-colors"
                >
                    ×
                </button>
            </div>
            
            <div className="space-y-2">
                <div className="flex justify-between">
                    <span className="text-slate-300">Client ID:</span>
                    <span className="text-white">{status.currentIP}</span>
                </div>
                
                <div className="flex justify-between">
                    <span className="text-slate-300">Blocked:</span>
                    <span className={status.isBlocked ? 'text-red-400' : 'text-green-400'}>
                        {status.isBlocked ? 'YES' : 'NO'}
                    </span>
                </div>
                
                <div className="flex justify-between">
                    <span className="text-slate-300">Requests/min:</span>
                    <span className={getStatusColor(status.requestsLastMinute, 10)}>
                        {status.requestsLastMinute}/10
                    </span>
                </div>
                
                <div className="flex justify-between">
                    <span className="text-slate-300">Requests/hour:</span>
                    <span className={getStatusColor(status.requestsLastHour, 100)}>
                        {status.requestsLastHour}/100
                    </span>
                </div>
                
                <div className="flex justify-between">
                    <span className="text-slate-300">Tokens:</span>
                    <span className={getStatusColor(20 - status.tokensAvailable, 20)}>
                        {status.tokensAvailable}/20
                    </span>
                </div>
                
                <div className="flex justify-between">
                    <span className="text-slate-300">Circuit:</span>
                    <span className={getCircuitBreakerColor(status.circuitBreakerState)}>
                        {status.circuitBreakerState}
                    </span>
                </div>
            </div>
            
            <div className="mt-3 pt-2 border-t border-slate-700">
                <button
                    onClick={() => {
                        RateLimitService.getInstance().reset();
                        setStatus(RateLimitService.getInstance().getStatus());
                    }}
                    className="text-cyan-400 hover:text-cyan-300 transition-colors text-xs"
                >
                    Reset Limits
                </button>
                <div className="text-slate-500 text-xs mt-1">
                    Press Ctrl+Shift+R to toggle
                </div>
            </div>
        </div>
    );
};

export default RateLimitStatus;
