import React, { useMemo } from 'react';
import { LogoIcon } from './icons';

interface FooterProps {
    onNavigateToTravelAnalysis?: () => void;
    onNavigateToPackingAssistant?: () => void;
    onNavigateToHome?: () => void;
}

const Footer: React.FC<FooterProps> = ({ 
    onNavigateToTravelAnalysis, 
    onNavigateToPackingAssistant, 
    onNavigateToHome
}) => {
    const currentYear = useMemo(() => new Date().getFullYear(), []);

    return (
        <footer className="section bg-transparent border-t border-white/20 relative z-10">
            <div className="container">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
                    {/* Brand Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <LogoIcon className="w-8 h-8 text-blue-500" />
                            <span className="heading-h3 text-gray-800 text-xl">SmartTravel</span>
                        </div>
                        <p className="body text-gray-600 max-w-xs">
                            Il tuo compagno di viaggio intelligente per esplorare il mondo con sicurezza e preparazione.
                        </p>
                    </div>

                    {/* Tools Section */}
                    <div className="space-y-4">
                        <h4 className="heading-h3 text-gray-800 text-lg">Strumenti</h4>
                        <ul className="space-y-2">
                            <li>
                                <button 
                                    onClick={onNavigateToTravelAnalysis}
                                    className="body text-gray-600 hover:text-blue-600 transition-colors cursor-pointer text-left"
                                >
                                    Analisi Destinazione
                                </button>
                            </li>
                            <li>
                                <button 
                                    onClick={onNavigateToPackingAssistant}
                                    className="body text-gray-600 hover:text-green-600 transition-colors cursor-pointer text-left"
                                >
                                    Assistente Preparazione
                                </button>
                            </li>
                        </ul>
                    </div>

                    {/* Info Section */}
                    <div className="space-y-4">
                        <h4 className="heading-h3 text-gray-800 text-lg">Privacy & Dati</h4>
                        <div className="space-y-3 text-gray-600">
                            <p className="body-sm">
                                <strong className="text-gray-800">Privacy:</strong> I tuoi dati vengono elaborati localmente. 
                                Non raccogliamo informazioni personali sensibili.
                            </p>
                            <p className="body-sm">
                                <strong className="text-gray-800">Cookie:</strong> Utilizziamo solo cookie essenziali per 
                                il funzionamento del sito e per migliorare l'esperienza utente.
                            </p>
                            <p className="body-sm">
                                <strong className="text-gray-800">AI:</strong> Powered by Gemini per consigli 
                                di viaggio personalizzati e aggiornati.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Bottom Section */}
                <div className="mt-8 pt-8 border-t border-gray-200">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                        <p className="body-sm text-gray-500">
                            © {currentYear} SmartTravel. Tutti i diritti riservati.
                        </p>
                        <p className="body-sm text-gray-500">
                            Fatto con ❤️ per i tuoi viaggi
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default React.memo(Footer);
