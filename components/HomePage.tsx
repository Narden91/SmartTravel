
import React from 'react';
import { LogoIcon, MapIcon, BackpackIcon } from './icons';
import Footer from './Footer';

interface HomePageProps {
    onNavigateToTravelAnalysis: () => void;
    onNavigateToPackingAssistant: () => void;
}

const ToolCard: React.FC<{
    icon: React.FC<React.SVGProps<SVGSVGElement>>;
    title: string;
    description: string;
    onClick: () => void;
    gradient: string;
}> = ({ icon: Icon, title, description, onClick, gradient }) => (
    <button
        onClick={onClick}
        className="travel-card p-8 rounded-2xl text-left w-full h-full flex flex-col transform hover:-translate-y-2 animate-slide-up group"
    >
        <div className="flex items-center gap-4 mb-6">
            <div className={`${gradient} p-4 rounded-2xl shadow-lg group-hover:scale-110 transition-all duration-300`}>
                <Icon className="w-8 h-8 text-white" />
            </div>
            <h3 className="heading-h3 text-gray-800 text-2xl">
                {title}
            </h3>
        </div>
        <p className="body text-gray-600 leading-relaxed flex-grow">
            {description}
        </p>
        <div className="mt-6 text-blue-600 font-semibold flex items-center gap-2 group-hover:text-blue-700 transition-colors">
            <span className="body">Inizia il Viaggio</span>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 group-hover:translate-x-1 transition-transform">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25 21 12m0 0-3.75 3.75M21 12H3" />
            </svg>
        </div>
    </button>
);

const HomePage: React.FC<HomePageProps> = ({ onNavigateToTravelAnalysis, onNavigateToPackingAssistant }) => {
    return (
        <div className="min-h-screen flex flex-col pt-20 relative">
            {/* Seamless Background System */}
            <div 
                className="fixed inset-0 z-0"
                style={{
                    backgroundImage: 'url(/travel.jpg)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    backgroundAttachment: 'fixed',
                    opacity: 0.15
                }}
            />
            <div className="fixed inset-0 z-0 bg-gradient-to-b from-blue-50/85 via-white/75 to-purple-50/85" />
            
            {/* Hero Section */}
            <section className="section-lg flex items-center justify-center relative overflow-hidden z-10">
                {/* Background decorative elements */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-blue-200 rounded-full opacity-30 animate-float"></div>
                    <div className="absolute top-3/4 right-1/4 w-24 h-24 bg-green-200 rounded-full opacity-30 animate-float" style={{animationDelay: '2s'}}></div>
                    <div className="absolute top-1/2 right-1/3 w-16 h-16 bg-purple-200 rounded-full opacity-30 animate-float" style={{animationDelay: '4s'}}></div>
                </div>
                
                <div className="container relative z-10">
                    <div className="text-center animate-fade-in">
                        <LogoIcon className="w-20 h-20 text-blue-500 mx-auto mb-6 animate-float" />
                        <h1 className="heading-display text-gradient tracking-tight mb-6">
                            Il Tuo <span className="text-green-500">Compagno di Viaggio</span> Intelligente
                        </h1>
                        <p className="body-lg max-w-3xl mx-auto text-gray-700 leading-8">
                            Scopri il mondo con SmartTravel. Analizza destinazioni, ottieni consigli personalizzati e prepara i tuoi viaggi con l'aiuto dell'intelligenza artificiale.
                        </p>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="section relative z-10">
                <div className="container">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                        <ToolCard
                            icon={MapIcon}
                            title="Analisi Destinazione"
                            description="Inserisci una destinazione e le date del viaggio. L'IA analizzerà meteo, prezzi medi, e ti dirà se è il periodo migliore per visitare quel luogo. Ricevi consigli personalizzati per ottimizzare la tua esperienza di viaggio."
                            onClick={onNavigateToTravelAnalysis}
                            gradient="bg-gradient-to-br from-blue-400 to-blue-600"
                        />
                        <ToolCard
                            icon={BackpackIcon}
                            title="Assistente Preparazione"
                            description="Specifica destinazione, date e genere. Ricevi una lista completa di cosa portare: abbigliamento, elettronica, medicinali, vaccini e documenti necessari. Non dimenticare mai nulla!"
                            onClick={onNavigateToPackingAssistant}
                            gradient="bg-gradient-to-br from-green-400 to-green-600"
                        />
                    </div>
                </div>
            </section>

            {/* Info Section */}
            <section className="section-sm relative z-10">
                <div className="container">
                    <div className="text-center max-w-4xl mx-auto">
                        <h2 className="heading-h2 text-gray-800 mb-6">
                            Viaggia con Sicurezza e Preparazione
                        </h2>
                        <p className="body-lg text-gray-600 leading-8">
                            SmartTravel utilizza l'intelligenza artificiale per fornirti informazioni aggiornate e consigli personalizzati. 
                            Che tu stia pianificando una fuga weekend o un'avventura intercontinentale, ti aiuteremo a preparare tutto nel dettaglio.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                            <div className="text-center">
                                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-blue-600">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
                                    </svg>
                                </div>
                                <h4 className="heading-h3 text-gray-800 text-lg mb-2">Meteo e Clima</h4>
                                <p className="body-sm text-gray-600">Informazioni meteorologiche dettagliate per pianificare al meglio</p>
                            </div>
                            <div className="text-center">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-green-600">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                    </svg>
                                </div>
                                <h4 className="heading-h3 text-gray-800 text-lg mb-2">Analisi Prezzi</h4>
                                <p className="body-sm text-gray-600">Stime sui costi di viaggio per gestire il budget</p>
                            </div>
                            <div className="text-center">
                                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-purple-600">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
                                    </svg>
                                </div>
                                <h4 className="heading-h3 text-gray-800 text-lg mb-2">Consigli Personalizzati</h4>
                                <p className="body-sm text-gray-600">Suggerimenti basati su IA per ogni tipo di viaggio</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <div className="relative z-10">
                <Footer 
                    onNavigateToTravelAnalysis={onNavigateToTravelAnalysis}
                    onNavigateToPackingAssistant={onNavigateToPackingAssistant}
                    onNavigateToHome={() => {}}
                />
            </div>
        </div>
    );
};

export default React.memo(HomePage);
