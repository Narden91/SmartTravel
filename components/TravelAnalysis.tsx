import React, { useState } from 'react';
import { ArrowLeftIcon, MapIcon, SunIcon, CloudIcon, ThermometerIcon, DropletIcon, WindIcon, CurrencyIcon, HotelIcon, ForkKnifeIcon, CarIcon, TicketIcon, WalletIcon, SparklesIcon, CheckIcon } from './icons';
import { TravelAnalysisInputs, TravelAnalysisResults } from '../types';
import { getTravelAnalysis } from '../services/geminiService';
import { searchDestinations, getPopularDestinations, CityResult } from '../services/cityService';
import { sanitizeInput } from '../security.config';

interface TravelAnalysisProps {
    onBack: () => void;
}

const TravelAnalysis: React.FC<TravelAnalysisProps> = ({ onBack }) => {
    const [inputs, setInputs] = useState<TravelAnalysisInputs>({
        destination: '',
        startDate: '',
        endDate: ''
    });
    const [results, setResults] = useState<TravelAnalysisResults | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // City suggestions state
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [suggestions, setSuggestions] = useState<CityResult[]>([]);
    const [inputFocused, setInputFocused] = useState(false);

    const handleInputChange = (field: keyof TravelAnalysisInputs, value: string) => {
        // Sanitize input for security
        const sanitizedValue = field === 'destination' ? sanitizeInput(value) : value;
        setInputs(prev => ({ ...prev, [field]: sanitizedValue }));
        
        // Handle city suggestions for destination field
        if (field === 'destination') {
            if (sanitizedValue.trim().length >= 2) {
                const newSuggestions = searchDestinations(sanitizedValue, { maxResults: 6 });
                setSuggestions(newSuggestions);
                setShowSuggestions(true);
            } else if (sanitizedValue.trim().length === 0) {
                setSuggestions(getPopularDestinations(6));
                setShowSuggestions(inputFocused);
            } else {
                setShowSuggestions(false);
            }
        }
    };

    const handleDestinationFocus = () => {
        setInputFocused(true);
        if (inputs.destination.trim().length === 0) {
            setSuggestions(getPopularDestinations(6));
            setShowSuggestions(true);
        } else if (suggestions.length > 0) {
            setShowSuggestions(true);
        }
    };

    const handleDestinationBlur = () => {
        setInputFocused(false);
        // Delay hiding suggestions to allow for clicks
        setTimeout(() => setShowSuggestions(false), 200);
    };

    const handleSuggestionClick = (suggestion: CityResult) => {
        setInputs(prev => ({ ...prev, destination: suggestion.displayName }));
        setShowSuggestions(false);
    };

    const handleAnalyze = async () => {
        // Validate and sanitize inputs
        const sanitizedDestination = sanitizeInput(inputs.destination.trim());
        
        if (!sanitizedDestination || !inputs.startDate || !inputs.endDate) {
            setError('Inserisci tutti i campi richiesti');
            return;
        }

        // Validate destination length (additional security check)
        if (sanitizedDestination.length < 2 || sanitizedDestination.length > 100) {
            setError('La destinazione deve essere tra 2 e 100 caratteri');
            return;
        }

        // Validate dates
        const startDate = new Date(inputs.startDate);
        const endDate = new Date(inputs.endDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (endDate <= startDate) {
            setError('La data di fine deve essere successiva alla data di inizio');
            return;
        }

        if (startDate < today) {
            setError('La data di partenza non può essere nel passato');
            return;
        }

        // Validate trip duration (max 1 year for security/reasonableness)
        const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays > 365) {
            setError('La durata del viaggio non può superare un anno');
            return;
        }

        setIsLoading(true);
        setError(null);
        
        try {
            // Use sanitized destination
            const analysisInputs = {
                ...inputs,
                destination: sanitizedDestination
            };
            const analysis = await getTravelAnalysis(analysisInputs);
            setResults(analysis);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Errore durante l\'analisi del viaggio';
            setError(errorMessage);
            if (process.env.NODE_ENV === 'development') {
                console.error('Travel analysis error:', err);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setInputs({ destination: '', startDate: '', endDate: '' });
        setResults(null);
        setError(null);
        setShowSuggestions(false);
        setSuggestions([]);
    };

    return (
        <div className="min-h-screen pt-20 pb-12 relative">
            {/* Travel Analysis Background */}
            <div 
                className="fixed inset-0 z-0"
                style={{
                    backgroundImage: 'url(/travel.jpg)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    backgroundAttachment: 'fixed',
                    opacity: 0.08
                }}
            />
            <div className="fixed inset-0 z-0 bg-gradient-to-b from-blue-50/90 via-white/85 to-indigo-50/90" />
            
            <div className="container relative z-10">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <button 
                        onClick={onBack}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg glass-effect hover:bg-white/30 transition-all duration-200"
                    >
                        <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
                        <span className="body text-gray-600">Torna alla Home</span>
                    </button>
                </div>

                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-12">
                        <MapIcon className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                        <h1 className="heading-h1 mb-4" style={{color: '#1f2937'}}>Analisi Destinazione</h1>
                        <p className="body-lg max-w-2xl mx-auto" style={{color: '#4b5563'}}>
                            Inserisci la tua destinazione e le date per ricevere un'analisi completa di meteo, prezzi e consigli personalizzati
                        </p>
                    </div>

                    {/* Input Form */}
                    <div className="travel-card p-8 mb-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Destination Input with Suggestions */}
                            <div className="relative">
                                <label className="block body-sm font-semibold mb-2" style={{color: '#374151'}}>
                                    Destinazione
                                </label>
                                <input
                                    type="text"
                                    value={inputs.destination}
                                    onChange={(e) => handleInputChange('destination', e.target.value)}
                                    onFocus={handleDestinationFocus}
                                    onBlur={handleDestinationBlur}
                                    placeholder="Es. Roma, Italia"
                                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                                />
                                
                                {/* City Suggestions Dropdown */}
                                {showSuggestions && suggestions.length > 0 && (
                                    <div className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-64 overflow-y-auto">
                                        {suggestions.map((suggestion, index) => (
                                            <button
                                                key={`${suggestion.name}-${index}`}
                                                type="button"
                                                onClick={() => handleSuggestionClick(suggestion)}
                                                className="w-full px-4 py-3 text-left hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors duration-150 flex items-center gap-3"
                                            >
                                                <div className={`w-2 h-2 rounded-full ${suggestion.type === 'city' ? 'bg-blue-500' : 'bg-purple-500'}`}></div>
                                                <div>
                                                    <div className="font-medium text-gray-900 text-sm">{suggestion.displayName}</div>
                                                    <div className="text-xs text-gray-500">{suggestion.type === 'city' ? 'Città' : 'Paese'}</div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            
                            <div>
                                <label className="block body-sm font-semibold mb-2" style={{color: '#374151'}}>
                                    Data Partenza
                                </label>
                                <input
                                    type="date"
                                    value={inputs.startDate}
                                    onChange={(e) => handleInputChange('startDate', e.target.value)}
                                    min={new Date().toISOString().split('T')[0]}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block body-sm font-semibold mb-2" style={{color: '#374151'}}>
                                    Data Ritorno
                                </label>
                                <input
                                    type="date"
                                    value={inputs.endDate}
                                    onChange={(e) => handleInputChange('endDate', e.target.value)}
                                    min={inputs.startDate || new Date().toISOString().split('T')[0]}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                                />
                            </div>
                        </div>
                        
                        <div className="flex gap-4 mt-6">
                            <button
                                onClick={handleAnalyze}
                                disabled={isLoading}
                                className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Analizzando...
                                    </>
                                ) : (
                                    <>
                                        <SparklesIcon className="w-5 h-5" />
                                        Analizza Destinazione
                                    </>
                                )}
                            </button>
                            {results && (
                                <button
                                    onClick={resetForm}
                                    className="px-6 py-3 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-all duration-200"
                                >
                                    Nuova Ricerca
                                </button>
                            )}
                        </div>

                        {/* Error Display */}
                        {error && (
                            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
                                <p className="text-red-700 font-medium">{error}</p>
                            </div>
                        )}
                    </div>

                    {/* Results */}
                    {results && (
                        <div className="space-y-6">
                            {/* Header with destination info */}
                            <div className="p-6 bg-gradient-to-r from-blue-500 to-purple-500 text-white border-none rounded-2xl shadow-lg">
                                <h2 className="text-2xl font-bold mb-2" style={{color: 'white'}}>Analisi per {results.destination}</h2>
                                <p className="font-medium" style={{color: 'white'}}>Periodo: {results.period}</p>
                                <div className="mt-4 flex items-center gap-2">
                                    {results.bestTimeToVisit ? (
                                        <>
                                            <CheckIcon className="w-5 h-5 text-green-300" />
                                            <span className="text-green-300 font-medium">Periodo ottimale per visitare</span>
                                        </>
                                    ) : (
                                        <>
                                            <div className="w-5 h-5 border-2 border-yellow-300 rounded-full flex items-center justify-center">
                                                <div className="w-2 h-2 bg-yellow-300 rounded-full"></div>
                                            </div>
                                            <span className="text-yellow-300 font-medium">Periodo con alcune limitazioni</span>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Weather Overview */}
                            <div className="travel-card p-6 bg-gradient-to-br from-yellow-50 to-blue-50 border-yellow-200">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full shadow-lg">
                                        <SunIcon className="w-8 h-8 text-white" />
                                    </div>
                                    <h3 className="heading-h3" style={{color: '#1f2937'}}>Panoramica Meteo</h3>
                                    <div className="ml-auto flex gap-4">
                                        <CloudIcon className="w-5 h-5 text-blue-400" />
                                        <WindIcon className="w-5 h-5 text-gray-400" />
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="text-center p-4 bg-white/60 rounded-xl shadow-sm border border-blue-100">
                                        <div className="flex items-center justify-center gap-2 mb-3">
                                            <ThermometerIcon className="w-6 h-6 text-red-500" />
                                            <span className="text-sm font-medium text-gray-600">Temperatura</span>
                                        </div>
                                        <div className="text-4xl font-bold text-blue-600 mb-2">
                                            {results.weatherOverview.averageTemp}°C
                                        </div>
                                        <div className="body-sm text-gray-500">Media giornaliera</div>
                                    </div>
                                    
                                    <div className="text-center p-4 bg-white/60 rounded-xl shadow-sm border border-blue-100">
                                        <div className="flex items-center justify-center gap-2 mb-3">
                                            <CloudIcon className="w-6 h-6 text-blue-500" />
                                            <span className="text-sm font-medium text-gray-600">Condizioni</span>
                                        </div>
                                        <div className="text-lg font-semibold text-gray-800 mb-2">
                                            {results.weatherOverview.description}
                                        </div>
                                        <div className="body-sm text-gray-500">Clima generale</div>
                                    </div>
                                    
                                    <div className="text-center p-4 bg-white/60 rounded-xl shadow-sm border border-blue-100">
                                        <div className="flex items-center justify-center gap-2 mb-3">
                                            <DropletIcon className="w-6 h-6 text-cyan-500" />
                                            <span className="text-sm font-medium text-gray-600">Precipitazioni</span>
                                        </div>
                                        <div className="text-lg font-semibold text-gray-800 mb-2">
                                            {results.weatherOverview.precipitation}
                                        </div>
                                        <div className="body-sm text-gray-500">Probabilità pioggia</div>
                                    </div>
                                </div>
                                
                                {/* Weather tip section */}
                                <div className="mt-6 p-4 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-lg border border-blue-200">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-white rounded-lg shadow-sm">
                                            <SunIcon className="w-5 h-5 text-yellow-500" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-gray-800 mb-1">💡 Consiglio Meteo</h4>
                                            <p className="text-sm text-gray-600">
                                                {results.weatherOverview.averageTemp && Number(results.weatherOverview.averageTemp) > 25
                                                    ? "Temperature elevate: porta abbigliamento leggero, protezione solare e mantieniti idratato!"
                                                    : results.weatherOverview.averageTemp && Number(results.weatherOverview.averageTemp) < 10
                                                    ? "Temperature fresche: porta abbigliamento caldo a strati e non dimenticare una giacca!"
                                                    : "Temperature moderate: ideali per escursioni e attività all'aperto. Porta un mix di abbigliamento!"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Cost Analysis */}
                            <div className="travel-card p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-3 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full shadow-lg">
                                        <CurrencyIcon className="w-8 h-8 text-white" />
                                    </div>
                                    <h3 className="heading-h3" style={{color: '#1f2937'}}>Analisi Costi</h3>
                                    <div className="ml-auto flex gap-2">
                                        <WalletIcon className="w-5 h-5 text-green-400" />
                                        <TicketIcon className="w-5 h-5 text-blue-400" />
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="text-center p-4 bg-white/60 rounded-xl shadow-sm border border-green-100">
                                        <div className="flex items-center justify-center gap-2 mb-3">
                                            <HotelIcon className="w-6 h-6 text-blue-600" />
                                            <span className="text-sm font-medium text-gray-600">Alloggio</span>
                                        </div>
                                        <div className="text-lg font-bold text-green-600 mb-1">
                                            {results.costAnalysis.accommodation}
                                        </div>
                                        <div className="body-sm text-gray-500">per notte</div>
                                    </div>
                                    
                                    <div className="text-center p-4 bg-white/60 rounded-xl shadow-sm border border-green-100">
                                        <div className="flex items-center justify-center gap-2 mb-3">
                                            <ForkKnifeIcon className="w-6 h-6 text-orange-500" />
                                            <span className="text-sm font-medium text-gray-600">Cibo</span>
                                        </div>
                                        <div className="text-lg font-bold text-green-600 mb-1">
                                            {results.costAnalysis.food}
                                        </div>
                                        <div className="body-sm text-gray-500">al giorno</div>
                                    </div>
                                    
                                    <div className="text-center p-4 bg-white/60 rounded-xl shadow-sm border border-green-100">
                                        <div className="flex items-center justify-center gap-2 mb-3">
                                            <CarIcon className="w-6 h-6 text-purple-600" />
                                            <span className="text-sm font-medium text-gray-600">Trasporti</span>
                                        </div>
                                        <div className="text-lg font-bold text-green-600 mb-1">
                                            {results.costAnalysis.transport}
                                        </div>
                                        <div className="body-sm text-gray-500">al giorno</div>
                                    </div>
                                    
                                    <div className="text-center p-4 bg-white/60 rounded-xl shadow-sm border border-green-100">
                                        <div className="flex items-center justify-center gap-2 mb-3">
                                            <TicketIcon className="w-6 h-6 text-indigo-600" />
                                            <span className="text-sm font-medium text-gray-600">Attività</span>
                                        </div>
                                        <div className="text-lg font-bold text-green-600 mb-1">
                                            {results.costAnalysis.activities}
                                        </div>
                                        <div className="body-sm text-gray-500">al giorno</div>
                                    </div>
                                </div>
                                
                                {/* Budget tip section */}
                                <div className="mt-6 p-4 bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg border border-green-200">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-white rounded-lg shadow-sm">
                                            <WalletIcon className="w-5 h-5 text-green-500" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-gray-800 mb-1">💰 Consiglio Budget</h4>
                                            <p className="text-sm text-gray-600">
                                                Aggiungi sempre un 10-20% extra al budget preventivato per spese impreviste e souvenir. 
                                                Considera di portare contanti per i mercati locali e piccoli negozi.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Recommendations */}
                            <div className="travel-card p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <SparklesIcon className="w-6 h-6 text-purple-600" />
                                    <h3 className="heading-h3" style={{color: '#1f2937'}}>Raccomandazioni</h3>
                                </div>
                                <div className="grid md:grid-cols-2 gap-4">
                                    {results.recommendations.map((recommendation, index) => (
                                        <div key={index} className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                                            <CheckIcon className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                                            <span className="body" style={{color: '#374151'}}>{recommendation}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* AI Analysis */}
                            <div className="travel-card p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
                                <div className="flex items-center gap-3 mb-4">
                                    <SparklesIcon className="w-6 h-6 text-indigo-600" />
                                    <h3 className="heading-h3" style={{color: '#1f2937'}}>Analisi Dettagliata AI</h3>
                                </div>
                                <p className="body leading-relaxed" style={{color: '#374151'}}>{results.aiAnalysis}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TravelAnalysis;
