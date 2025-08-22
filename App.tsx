import React from 'react';
import { useNavigation } from './hooks/useNavigation';
import TravelAnalysis from './components/TravelAnalysis';
import PackingAssistant from './components/PackingAssistant';
import HomePage from './components/HomePage';
import Footer from './components/Footer';
import CookieBanner from './components/CookieBanner';
import NavBar from './components/NavBar';
import RateLimitStatus from './components/RateLimitStatus';

const App: React.FC = () => {
  const {
    currentView,
    goToHome,
    goToTravelAnalysis,
    goToPackingAssistant
  } = useNavigation();

  const renderContent = () => {
    switch(currentView) {
      case 'home':
        return (
          <HomePage 
            onNavigateToTravelAnalysis={goToTravelAnalysis}
            onNavigateToPackingAssistant={goToPackingAssistant}
          />
        );
      case 'travelAnalysis':
        return <TravelAnalysis onBack={goToHome} />;
      case 'packingAssistant':
        return <PackingAssistant onBack={goToHome} />;
      default:
        return (
          <HomePage 
            onNavigateToTravelAnalysis={goToTravelAnalysis}
            onNavigateToPackingAssistant={goToPackingAssistant}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <NavBar 
        currentView={currentView}
        onNavigateToHome={goToHome}
        onNavigateToTravelAnalysis={goToTravelAnalysis}
        onNavigateToPackingAssistant={goToPackingAssistant}
      />
      
      <main className="relative">
        {renderContent()}
      </main>
      
      <CookieBanner />
      <RateLimitStatus />
    </div>
  );
};

export default App;
