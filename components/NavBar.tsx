import React, { useMemo } from 'react';
import { LogoIcon, MapIcon, BackpackIcon, HomeIcon } from './icons';

interface NavBarProps {
    currentView: 'home' | 'travelAnalysis' | 'packingAssistant';
    onNavigateToHome: () => void;
    onNavigateToTravelAnalysis: () => void;
    onNavigateToPackingAssistant: () => void;
}

const NavBar: React.FC<NavBarProps> = ({ 
    currentView, 
    onNavigateToHome, 
    onNavigateToTravelAnalysis, 
    onNavigateToPackingAssistant
}) => {
    const navItems = useMemo(() => [
        {
            id: 'travelAnalysis' as const,
            label: 'Analisi Destinazione',
            icon: MapIcon,
            onClick: onNavigateToTravelAnalysis
        },
        {
            id: 'packingAssistant' as const,
            label: 'Assistente Preparazione',
            icon: BackpackIcon,
            onClick: onNavigateToPackingAssistant
        }
    ], [onNavigateToTravelAnalysis, onNavigateToPackingAssistant]);

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 glass-effect border-b border-white/20">
            <div className="container">
                <div className="flex items-center py-4">
                    {/* Logo/Brand - Left side */}
                    <button
                        onClick={onNavigateToHome}
                        className="flex items-center gap-3 group transition-all duration-200 hover:scale-105"
                    >
                        <LogoIcon className="w-8 h-8 text-blue-500 group-hover:text-blue-600 transition-colors" />
                        <span className="heading-h3 text-gray-800 text-xl group-hover:text-blue-600 transition-colors">
                            SmartTravel
                        </span>
                    </button>

                    {/* Spacer */}
                    <div className="flex-1"></div>

                    {/* Navigation Items - Right side */}
                    <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
                        {/* Home Button */}
                        <button
                            onClick={onNavigateToHome}
                            className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 lg:px-4 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 ${
                                currentView === 'home'
                                    ? 'bg-blue-500 text-white shadow-blue-500/20 shadow-lg'
                                    : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
                            }`}
                        >
                            <HomeIcon className="w-5 h-5" />
                            <span className="body hidden lg:inline">Home</span>
                        </button>

                        {/* Navigation Items */}
                        {navItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={item.onClick}
                                className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 lg:px-4 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 ${
                                    currentView === item.id
                                        ? item.id === 'travelAnalysis' 
                                            ? 'bg-blue-500 text-white shadow-blue-500/20 shadow-lg'
                                            : 'bg-green-500 text-white shadow-green-500/20 shadow-lg'
                                        : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
                                }`}
                            >
                                <item.icon className="w-5 h-5" />
                                <span className="body hidden lg:inline">{item.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default React.memo(NavBar);
