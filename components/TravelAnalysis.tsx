import React, { useState } from 'react';
import { ArrowLeftIcon, MapIcon, CalendarIcon, SunIcon, CurrencyIcon, SparklesIcon, CheckIcon } from './icons';
import { TravelAnalysisInputs, TravelAnalysisResults } from '../types';
import { getTravelAnalysis } from '../services/geminiService';
import { searchDestinations, getPopularDestinations, CityResult } from '../services/cityService';

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
        setInputs(prev => ({ ...prev, [field]: value }));
        
        // Handle city suggestions for destination field
        if (field === 'destination') {
            if (value.trim().length >= 2) {
                const newSuggestions = searchDestinations(value, { maxResults: 6 });
                setSuggestions(newSuggestions);
                setShowSuggestions(true);
            } else if (value.trim().length === 0) {
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
        if (!inputs.destination || !inputs.startDate || !inputs.endDate) {
            setError('Inserisci tutti i campi richiesti');
            return;
        }

        if (new Date(inputs.endDate) <= new Date(inputs.startDate)) {
            setError('La data di fine deve essere successiva alla data di inizio');
            return;
        }

        setIsLoading(true);
        setError(null);
        
        try {
            const analysis = await getTravelAnalysis(inputs);
            setResults(analysis);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Errore durante l\'analisi del viaggio';
            setError(errorMessage);
            console.error('Travel analysis error:', err);
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
        <div className="min-h-screen pt-20 pb-12">
            <div className="container">
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
                            <div className="travel-card p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <SunIcon className="w-6 h-6 text-yellow-500" />
                                    <h3 className="heading-h3" style={{color: '#1f2937'}}>Panoramica Meteo</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="text-center">
                                        <div className="text-3xl font-bold text-blue-600 mb-1">
                                            {results.weatherOverview.averageTemp}°C
                                        </div>
                                        <div className="body-sm mb-1" style={{color: '#4b5563'}}>Temperatura Media</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="body mb-1" style={{color: '#1f2937'}}>
                                            {results.weatherOverview.description}
                                        </div>
                                        <div className="body-sm" style={{color: '#4b5563'}}>Condizioni</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="body mb-1" style={{color: '#1f2937'}}>
                                            {results.weatherOverview.precipitation}
                                        </div>
                                        <div className="body-sm" style={{color: '#4b5563'}}>Precipitazioni</div>
                                    </div>
                                </div>
                            </div>

                            {/* Cost Analysis */}
                            <div className="travel-card p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <CurrencyIcon className="w-6 h-6 text-green-500" />
                                    <h3 className="heading-h3" style={{color: '#1f2937'}}>Analisi Costi</h3>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div>
                                        <div className="body-sm mb-1" style={{color: '#4b5563'}}>Alloggio</div>
                                        <div className="font-semibold" style={{color: '#1f2937'}}>{results.costAnalysis.accommodation}</div>
                                    </div>
                                    <div>
                                        <div className="body-sm mb-1" style={{color: '#4b5563'}}>Cibo</div>
                                        <div className="font-semibold" style={{color: '#1f2937'}}>{results.costAnalysis.food}</div>
                                    </div>
                                    <div>
                                        <div className="body-sm mb-1" style={{color: '#4b5563'}}>Trasporti</div>
                                        <div className="font-semibold" style={{color: '#1f2937'}}>{results.costAnalysis.transport}</div>
                                    </div>
                                    <div>
                                        <div className="body-sm mb-1" style={{color: '#4b5563'}}>Attività</div>
                                        <div className="font-semibold" style={{color: '#1f2937'}}>{results.costAnalysis.activities}</div>
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
