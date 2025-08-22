import { useState, useMemo, useCallback } from 'react';
import { View } from '../types';

export const useNavigation = () => {
    const [view, setView] = useState<View>('home');

    // Memoize navigation handlers to prevent unnecessary re-renders
    const navigationHandlers = useMemo(() => ({
        toHome: () => setView('home'),
        toTravelAnalysis: () => setView('travelAnalysis'),
        toPackingAssistant: () => setView('packingAssistant'),
    }), []);

    // Individual navigation functions for component props
    const goToHome = useCallback(() => setView('home'), []);
    const goToTravelAnalysis = useCallback(() => setView('travelAnalysis'), []);
    const goToPackingAssistant = useCallback(() => setView('packingAssistant'), []);

    return {
        // Current state
        currentView: view,
        
        // Navigation handlers object (for bulk operations)
        navigationHandlers,
        
        // Individual navigation functions (for component props)
        goToHome,
        goToTravelAnalysis,
        goToPackingAssistant
    };
};
