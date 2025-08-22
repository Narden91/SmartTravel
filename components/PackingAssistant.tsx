import React, { useState } from 'react';
import { ArrowLeftIcon, BackpackIcon, ShirtIcon, FirstAidIcon, SparklesIcon, CheckIcon, DownloadIcon } from './icons';
import { PackingAssistantInputs, PackingResults, PackingItem } from '../types';
import { getPackingList } from '../services/geminiService';
import { searchDestinations, getPopularDestinations, CityResult } from '../services/cityService';
import { sanitizeInput } from '../security.config';

interface PackingAssistantProps {
    onBack: () => void;
}

const PackingAssistant: React.FC<PackingAssistantProps> = ({ onBack }) => {
    const [inputs, setInputs] = useState<PackingAssistantInputs>({
        destination: '',
        startDate: '',
        endDate: '',
        gender: 'not-specified'
    });
    const [results, setResults] = useState<PackingResults | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // City suggestions state
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [suggestions, setSuggestions] = useState<CityResult[]>([]);
    const [inputFocused, setInputFocused] = useState(false);

    const handleInputChange = (field: keyof PackingAssistantInputs, value: string) => {
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

    const handleGenerateList = async () => {
        // Validate and sanitize inputs
        const sanitizedDestination = sanitizeInput(inputs.destination.trim());
        
        if (!sanitizedDestination || !inputs.startDate || !inputs.endDate || !inputs.gender) {
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
            const packingInputs = {
                ...inputs,
                destination: sanitizedDestination
            };
            const packingList = await getPackingList(packingInputs);
            setResults(packingList);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Errore durante la generazione della lista';
            setError(errorMessage);
            if (process.env.NODE_ENV === 'development') {
                console.error('Packing list error:', err);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setInputs({ destination: '', startDate: '', endDate: '', gender: 'not-specified' });
        setResults(null);
        setError(null);
        setShowSuggestions(false);
        setSuggestions([]);
    };

    // Generate markdown for export
    const generateMarkdown = (): string => {
        if (!results) return '';

        const genderText = results.gender === 'man' ? 'Uomo' : 
                          results.gender === 'woman' ? 'Donna' : 
                          results.gender === 'other' ? 'Altro' : 'Non specificato';

        let markdown = `# Lista Bagaglio per ${results.destination}\n\n`;
        markdown += `**Periodo:** ${results.period}\n`;
        markdown += `**Genere:** ${genderText}\n\n`;

        // Packing list by category
        Object.entries(groupedItems).forEach(([category, items]) => {
            const categoryTitle = getCategoryTitle(category);
            markdown += `## ${categoryTitle}\n\n`;
            
            items.forEach((item) => {
                const priorityText = getPriorityText(item.priority);
                markdown += `- [ ] **${item.item}** (${priorityText})\n`;
                markdown += `  - Quantità: ${item.quantity}\n`;
                markdown += `  - Motivo: ${item.reason}\n\n`;
            });
        });

        // Health recommendations
        markdown += `## Raccomandazioni Sanitarie\n\n`;
        
        if (results.healthRecommendations.vaccines.length > 0) {
            markdown += `### Vaccini\n\n`;
            results.healthRecommendations.vaccines.forEach(vaccine => {
                markdown += `- ${vaccine}\n`;
            });
            markdown += `\n`;
        }

        if (results.healthRecommendations.medications.length > 0) {
            markdown += `### Medicinali\n\n`;
            results.healthRecommendations.medications.forEach(medication => {
                markdown += `- ${medication}\n`;
            });
            markdown += `\n`;
        }

        if (results.healthRecommendations.healthTips.length > 0) {
            markdown += `### Consigli Salute\n\n`;
            results.healthRecommendations.healthTips.forEach(tip => {
                markdown += `- ${tip}\n`;
            });
            markdown += `\n`;
        }

        // Travel documents
        if (results.travelDocuments.length > 0) {
            markdown += `## Documenti di Viaggio\n\n`;
            results.travelDocuments.forEach(document => {
                markdown += `- [ ] ${document}\n`;
            });
            markdown += `\n`;
        }

        // AI suggestions
        if (results.aiSuggestions) {
            markdown += `## Suggerimenti AI\n\n`;
            markdown += `${results.aiSuggestions}\n\n`;
        }

        markdown += `---\n\n`;
        markdown += `*Generato da SmartTravel il ${new Date().toLocaleDateString('it-IT')}*\n`;

        return markdown;
    };

    // Export markdown function
    const exportToMarkdown = () => {
        const markdown = generateMarkdown();
        const blob = new Blob([markdown], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `bagaglio-${results?.destination?.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.md`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    // Group packing items by category
    const groupedItems = results?.packingList.reduce((acc, item) => {
        if (!acc[item.category]) {
            acc[item.category] = [];
        }
        acc[item.category].push(item);
        return acc;
    }, {} as Record<string, PackingItem[]>) || {};

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'clothing':
                return <ShirtIcon className="w-5 h-5" />;
            case 'health':
                return <FirstAidIcon className="w-5 h-5" />;
            case 'electronics':
                return <SparklesIcon className="w-5 h-5" />;
            default:
                return <BackpackIcon className="w-5 h-5" />;
        }
    };

    const getCategoryTitle = (category: string) => {
        switch (category) {
            case 'clothing':
                return 'Abbigliamento';
            case 'electronics':
                return 'Elettronica';
            case 'health':
                return 'Salute e Igiene';
            case 'documents':
                return 'Documenti';
            case 'accessories':
                return 'Accessori';
            default:
                return 'Altri';
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'essential':
                return 'bg-red-100 text-red-800';
            case 'recommended':
                return 'bg-yellow-100 text-yellow-800';
            case 'optional':
                return 'bg-green-100 text-green-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getPriorityText = (priority: string) => {
        switch (priority) {
            case 'essential':
                return 'Essenziale';
            case 'recommended':
                return 'Consigliato';
            case 'optional':
                return 'Opzionale';
            default:
                return priority;
        }
    };

    return (
        <div className="min-h-screen pt-20 pb-12 relative">
            {/* Packing Assistant Background */}
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
            <div className="fixed inset-0 z-0 bg-gradient-to-b from-green-50/90 via-white/85 to-teal-50/90" />
            
            <div className="container relative z-10">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <button 
                        onClick={onBack}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg glass-effect hover:bg-white/30 transition-all duration-200"
                    >
                        <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
                        <span className="body" style={{color: '#4b5563'}}>Torna alla Home</span>
                    </button>
                </div>

                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-12">
                        <BackpackIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <h1 className="heading-h1 mb-4" style={{color: '#1f2937'}}>Assistente Preparazione</h1>
                        <p className="body-lg max-w-2xl mx-auto" style={{color: '#4b5563'}}>
                            Inserisci le informazioni del tuo viaggio per ricevere una lista personalizzata di cosa portare
                        </p>
                    </div>

                    {/* Input Form */}
                    <div className="travel-card p-8 mb-8">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
                            <div>
                                <label className="block body-sm font-semibold mb-2" style={{color: '#374151'}}>
                                    Genere
                                </label>
                                <select
                                    value={inputs.gender}
                                    onChange={(e) => handleInputChange('gender', e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                                >
                                    <option value="man">Uomo</option>
                                    <option value="woman">Donna</option>
                                    <option value="other">Altro</option>
                                    <option value="not-specified">Non specificato</option>
                                </select>
                            </div>
                        </div>
                        
                        <div className="flex gap-4 mt-6">
                            <button
                                onClick={handleGenerateList}
                                disabled={isLoading}
                                className="flex-1 bg-gradient-to-r from-green-500 to-teal-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-green-600 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Generando Lista...
                                    </>
                                ) : (
                                    <>
                                        <BackpackIcon className="w-5 h-5" />
                                        Genera Lista
                                    </>
                                )}
                            </button>
                            {results && (
                                <button
                                    onClick={resetForm}
                                    className="px-6 py-3 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-all duration-200"
                                >
                                    Nuova Lista
                                </button>
                            )}
                            {results && (
                                <button
                                    onClick={exportToMarkdown}
                                    className="px-6 py-3 rounded-lg bg-purple-500 text-white hover:bg-purple-600 transition-all duration-200 flex items-center gap-2"
                                >
                                    <DownloadIcon className="w-5 h-5" />
                                    Esporta per Notion
                                </button>
                            )}
                        </div>

                        {/* Error Display */}
                        {error && (
                            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
                                <p className="font-medium" style={{color: '#dc2626'}}>{error}</p>
                            </div>
                        )}
                    </div>

                    {/* Results */}
                    {results && (
                        <div className="space-y-6">
                            {/* Header */}
                            <div className="p-6 bg-gradient-to-r from-green-500 to-teal-500 text-white border-none rounded-2xl shadow-lg">
                                <h2 className="text-2xl font-bold mb-2" style={{color: 'white'}}>Lista Bagaglio per {results.destination}</h2>
                                <p className="font-medium" style={{color: 'white'}}>Periodo: {results.period}</p>
                                <p className="font-medium" style={{color: 'white'}}>Genere: {results.gender === 'man' ? 'Uomo' : results.gender === 'woman' ? 'Donna' : results.gender === 'other' ? 'Altro' : 'Non specificato'}</p>
                            </div>

                            {/* Packing List by Category */}
                            <div className="grid gap-6">
                                {Object.entries(groupedItems).map(([category, items]) => (
                                    <div key={category} className="travel-card p-6">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                                                {getCategoryIcon(category)}
                                            </div>
                                            <h3 className="heading-h3" style={{color: '#1f2937'}}>{getCategoryTitle(category)}</h3>
                                            <span className="body-sm" style={{color: '#6b7280'}}>({items.length} oggetti)</span>
                                        </div>
                                        <div className="grid md:grid-cols-2 gap-4">
                                            {items.map((item, index) => (
                                                <div key={index} className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                                                    <CheckIcon className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="font-semibold" style={{color: '#1f2937'}}>{item.item}</span>
                                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(item.priority)}`}>
                                                                {getPriorityText(item.priority)}
                                                            </span>
                                                        </div>
                                                        <div className="text-sm mb-1" style={{color: '#4b5563'}}>Quantità: {item.quantity}</div>
                                                        <div className="text-sm" style={{color: '#374151'}}>{item.reason}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Health Recommendations */}
                            <div className="travel-card p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-red-100 rounded-lg">
                                        <FirstAidIcon className="w-6 h-6 text-red-600" />
                                    </div>
                                    <h3 className="heading-h3" style={{color: '#1f2937'}}>Raccomandazioni Sanitarie</h3>
                                </div>
                                <div className="grid md:grid-cols-3 gap-6">
                                    <div>
                                        <h4 className="font-semibold mb-2" style={{color: '#1f2937'}}>Vaccini</h4>
                                        <ul className="space-y-1">
                                            {results.healthRecommendations.vaccines.map((vaccine, index) => (
                                                <li key={index} className="text-sm flex items-start gap-2" style={{color: '#374151'}}>
                                                    <div className="w-2 h-2 bg-red-500 rounded-full mt-1.5 flex-shrink-0"></div>
                                                    {vaccine}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold mb-2" style={{color: '#1f2937'}}>Medicinali</h4>
                                        <ul className="space-y-1">
                                            {results.healthRecommendations.medications.map((medication, index) => (
                                                <li key={index} className="text-sm flex items-start gap-2" style={{color: '#374151'}}>
                                                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-1.5 flex-shrink-0"></div>
                                                    {medication}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold mb-2" style={{color: '#1f2937'}}>Consigli Salute</h4>
                                        <ul className="space-y-1">
                                            {results.healthRecommendations.healthTips.map((tip, index) => (
                                                <li key={index} className="text-sm flex items-start gap-2" style={{color: '#374151'}}>
                                                    <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5 flex-shrink-0"></div>
                                                    {tip}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            {/* Travel Documents */}
                            <div className="travel-card p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <SparklesIcon className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <h3 className="heading-h3" style={{color: '#1f2937'}}>Documenti di Viaggio</h3>
                                </div>
                                <div className="grid md:grid-cols-2 gap-4">
                                    {results.travelDocuments.map((document, index) => (
                                        <div key={index} className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                                            <CheckIcon className="w-5 h-5 text-blue-600 flex-shrink-0" />
                                            <span style={{color: '#374151'}}>{document}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* AI Suggestions */}
                            <div className="travel-card p-6 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-purple-100 rounded-lg">
                                        <SparklesIcon className="w-6 h-6 text-purple-600" />
                                    </div>
                                    <h3 className="heading-h3" style={{color: '#1f2937'}}>Suggerimenti AI</h3>
                                </div>
                                <p className="body leading-relaxed" style={{color: '#374151'}}>{results.aiSuggestions}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PackingAssistant;
