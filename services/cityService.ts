// City search suggestions service
// Provides autocomplete functionality for destination input

export interface CityResult {
    name: string;
    country: string;
    displayName: string;
    type: 'city' | 'country' | 'region';
    popularity: number; // 1-10 scale for sorting
}

// Popular destinations database - could be replaced with external API
const POPULAR_DESTINATIONS: CityResult[] = [
    // European Cities
    { name: 'Roma', country: 'Italia', displayName: 'Roma, Italia', type: 'city', popularity: 10 },
    { name: 'Milano', country: 'Italia', displayName: 'Milano, Italia', type: 'city', popularity: 9 },
    { name: 'Venezia', country: 'Italia', displayName: 'Venezia, Italia', type: 'city', popularity: 9 },
    { name: 'Firenze', country: 'Italia', displayName: 'Firenze, Italia', type: 'city', popularity: 9 },
    { name: 'Napoli', country: 'Italia', displayName: 'Napoli, Italia', type: 'city', popularity: 8 },
    { name: 'Palermo', country: 'Italia', displayName: 'Palermo, Italia', type: 'city', popularity: 7 },
    { name: 'Bologna', country: 'Italia', displayName: 'Bologna, Italia', type: 'city', popularity: 7 },
    { name: 'Torino', country: 'Italia', displayName: 'Torino, Italia', type: 'city', popularity: 7 },
    
    { name: 'Parigi', country: 'Francia', displayName: 'Parigi, Francia', type: 'city', popularity: 10 },
    { name: 'Londra', country: 'Regno Unito', displayName: 'Londra, Regno Unito', type: 'city', popularity: 10 },
    { name: 'Barcellona', country: 'Spagna', displayName: 'Barcellona, Spagna', type: 'city', popularity: 9 },
    { name: 'Madrid', country: 'Spagna', displayName: 'Madrid, Spagna', type: 'city', popularity: 9 },
    { name: 'Amsterdam', country: 'Paesi Bassi', displayName: 'Amsterdam, Paesi Bassi', type: 'city', popularity: 9 },
    { name: 'Berlino', country: 'Germania', displayName: 'Berlino, Germania', type: 'city', popularity: 8 },
    { name: 'Monaco', country: 'Germania', displayName: 'Monaco, Germania', type: 'city', popularity: 8 },
    { name: 'Vienna', country: 'Austria', displayName: 'Vienna, Austria', type: 'city', popularity: 8 },
    { name: 'Praga', country: 'Repubblica Ceca', displayName: 'Praga, Repubblica Ceca', type: 'city', popularity: 8 },
    { name: 'Budapest', country: 'Ungheria', displayName: 'Budapest, Ungheria', type: 'city', popularity: 8 },
    { name: 'Lisbona', country: 'Portogallo', displayName: 'Lisbona, Portogallo', type: 'city', popularity: 8 },
    { name: 'Dublino', country: 'Irlanda', displayName: 'Dublino, Irlanda', type: 'city', popularity: 7 },
    { name: 'Edimburgo', country: 'Scozia', displayName: 'Edimburgo, Scozia', type: 'city', popularity: 7 },
    { name: 'Stoccolma', country: 'Svezia', displayName: 'Stoccolma, Svezia', type: 'city', popularity: 7 },
    { name: 'Copenaghen', country: 'Danimarca', displayName: 'Copenaghen, Danimarca', type: 'city', popularity: 7 },
    { name: 'Oslo', country: 'Norvegia', displayName: 'Oslo, Norvegia', type: 'city', popularity: 6 },
    { name: 'Helsinki', country: 'Finlandia', displayName: 'Helsinki, Finlandia', type: 'city', popularity: 6 },
    { name: 'Zurigo', country: 'Svizzera', displayName: 'Zurigo, Svizzera', type: 'city', popularity: 7 },
    { name: 'Atene', country: 'Grecia', displayName: 'Atene, Grecia', type: 'city', popularity: 8 },
    { name: 'Istanbul', country: 'Turchia', displayName: 'Istanbul, Turchia', type: 'city', popularity: 8 },
    
    // North America
    { name: 'New York', country: 'Stati Uniti', displayName: 'New York, Stati Uniti', type: 'city', popularity: 10 },
    { name: 'Los Angeles', country: 'Stati Uniti', displayName: 'Los Angeles, Stati Uniti', type: 'city', popularity: 9 },
    { name: 'San Francisco', country: 'Stati Uniti', displayName: 'San Francisco, Stati Uniti', type: 'city', popularity: 8 },
    { name: 'Las Vegas', country: 'Stati Uniti', displayName: 'Las Vegas, Stati Uniti', type: 'city', popularity: 8 },
    { name: 'Miami', country: 'Stati Uniti', displayName: 'Miami, Stati Uniti', type: 'city', popularity: 8 },
    { name: 'Chicago', country: 'Stati Uniti', displayName: 'Chicago, Stati Uniti', type: 'city', popularity: 7 },
    { name: 'Toronto', country: 'Canada', displayName: 'Toronto, Canada', type: 'city', popularity: 7 },
    { name: 'Vancouver', country: 'Canada', displayName: 'Vancouver, Canada', type: 'city', popularity: 7 },
    { name: 'Montreal', country: 'Canada', displayName: 'Montreal, Canada', type: 'city', popularity: 6 },
    
    // Asia
    { name: 'Tokyo', country: 'Giappone', displayName: 'Tokyo, Giappone', type: 'city', popularity: 10 },
    { name: 'Bangkok', country: 'Tailandia', displayName: 'Bangkok, Tailandia', type: 'city', popularity: 9 },
    { name: 'Singapore', country: 'Singapore', displayName: 'Singapore', type: 'city', popularity: 9 },
    { name: 'Hong Kong', country: 'Cina', displayName: 'Hong Kong, Cina', type: 'city', popularity: 9 },
    { name: 'Seoul', country: 'Corea del Sud', displayName: 'Seoul, Corea del Sud', type: 'city', popularity: 8 },
    { name: 'Kyoto', country: 'Giappone', displayName: 'Kyoto, Giappone', type: 'city', popularity: 8 },
    { name: 'Osaka', country: 'Giappone', displayName: 'Osaka, Giappone', type: 'city', popularity: 7 },
    { name: 'Kuala Lumpur', country: 'Malesia', displayName: 'Kuala Lumpur, Malesia', type: 'city', popularity: 7 },
    { name: 'Mumbai', country: 'India', displayName: 'Mumbai, India', type: 'city', popularity: 7 },
    { name: 'Delhi', country: 'India', displayName: 'Delhi, India', type: 'city', popularity: 7 },
    { name: 'Dubai', country: 'Emirati Arabi Uniti', displayName: 'Dubai, Emirati Arabi Uniti', type: 'city', popularity: 9 },
    { name: 'Doha', country: 'Qatar', displayName: 'Doha, Qatar', type: 'city', popularity: 6 },
    
    // Oceania
    { name: 'Sydney', country: 'Australia', displayName: 'Sydney, Australia', type: 'city', popularity: 9 },
    { name: 'Melbourne', country: 'Australia', displayName: 'Melbourne, Australia', type: 'city', popularity: 8 },
    { name: 'Auckland', country: 'Nuova Zelanda', displayName: 'Auckland, Nuova Zelanda', type: 'city', popularity: 7 },
    
    // South America
    { name: 'Rio de Janeiro', country: 'Brasile', displayName: 'Rio de Janeiro, Brasile', type: 'city', popularity: 9 },
    { name: 'Buenos Aires', country: 'Argentina', displayName: 'Buenos Aires, Argentina', type: 'city', popularity: 8 },
    { name: 'São Paulo', country: 'Brasile', displayName: 'São Paulo, Brasile', type: 'city', popularity: 7 },
    { name: 'Lima', country: 'Perù', displayName: 'Lima, Perù', type: 'city', popularity: 7 },
    { name: 'Santiago', country: 'Cile', displayName: 'Santiago, Cile', type: 'city', popularity: 6 },
    
    // Africa
    { name: 'Il Cairo', country: 'Egitto', displayName: 'Il Cairo, Egitto', type: 'city', popularity: 8 },
    { name: 'Marrakech', country: 'Marocco', displayName: 'Marrakech, Marocco', type: 'city', popularity: 8 },
    { name: 'Città del Capo', country: 'Sudafrica', displayName: 'Città del Capo, Sudafrica', type: 'city', popularity: 8 },
    { name: 'Casablanca', country: 'Marocco', displayName: 'Casablanca, Marocco', type: 'city', popularity: 6 },
    
    // Popular Countries for broader searches
    { name: 'Italia', country: 'Europa', displayName: 'Italia', type: 'country', popularity: 10 },
    { name: 'Francia', country: 'Europa', displayName: 'Francia', type: 'country', popularity: 10 },
    { name: 'Spagna', country: 'Europa', displayName: 'Spagna', type: 'country', popularity: 9 },
    { name: 'Grecia', country: 'Europa', displayName: 'Grecia', type: 'country', popularity: 9 },
    { name: 'Giappone', country: 'Asia', displayName: 'Giappone', type: 'country', popularity: 9 },
    { name: 'Tailandia', country: 'Asia', displayName: 'Tailandia', type: 'country', popularity: 9 },
    { name: 'Stati Uniti', country: 'Nord America', displayName: 'Stati Uniti', type: 'country', popularity: 10 },
    { name: 'Regno Unito', country: 'Europa', displayName: 'Regno Unito', type: 'country', popularity: 9 },
    { name: 'Germania', country: 'Europa', displayName: 'Germania', type: 'country', popularity: 8 },
    { name: 'Australia', country: 'Oceania', displayName: 'Australia', type: 'country', popularity: 8 },
    { name: 'Brasile', country: 'Sud America', displayName: 'Brasile', type: 'country', popularity: 8 },
    { name: 'Canada', country: 'Nord America', displayName: 'Canada', type: 'country', popularity: 8 },
];

// Text matching utility functions
const normalizeText = (text: string): string => {
    return text
        .toLowerCase()
        .normalize('NFD') // Decompose accented characters
        .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
        .replace(/[^\w\s]/g, '') // Remove special characters
        .trim();
};

const fuzzyMatch = (query: string, target: string): number => {
    const normalizedQuery = normalizeText(query);
    const normalizedTarget = normalizeText(target);
    
    // Exact match gets highest score
    if (normalizedTarget === normalizedQuery) {
        return 100;
    }
    
    // Starts with query gets high score
    if (normalizedTarget.startsWith(normalizedQuery)) {
        return 90;
    }
    
    // Contains query gets medium score
    if (normalizedTarget.includes(normalizedQuery)) {
        return 70;
    }
    
    // Check for word matches
    const queryWords = normalizedQuery.split(/\s+/);
    const targetWords = normalizedTarget.split(/\s+/);
    
    let wordMatches = 0;
    for (const queryWord of queryWords) {
        for (const targetWord of targetWords) {
            if (targetWord.startsWith(queryWord) || targetWord.includes(queryWord)) {
                wordMatches++;
                break;
            }
        }
    }
    
    if (wordMatches > 0) {
        return Math.min(60, 30 + (wordMatches / queryWords.length) * 30);
    }
    
    return 0;
};

export interface SearchSuggestionsOptions {
    maxResults?: number;
    includeCountries?: boolean;
    minScore?: number;
}

export const searchDestinations = (
    query: string, 
    options: SearchSuggestionsOptions = {}
): CityResult[] => {
    const {
        maxResults = 8,
        includeCountries = true,
        minScore = 50 // Increased minimum score for better matches
    } = options;
    
    if (!query || query.trim().length < 2) {
        // Return empty array when no query - don't show suggestions for empty input
        return [];
    }
    
    const trimmedQuery = query.trim();
    
    // Calculate scores for all destinations
    const scoredResults = POPULAR_DESTINATIONS
        .map(destination => {
            // Check matches in name, country, and display name
            const nameScore = fuzzyMatch(trimmedQuery, destination.name);
            const countryScore = fuzzyMatch(trimmedQuery, destination.country);
            const displayScore = fuzzyMatch(trimmedQuery, destination.displayName);
            
            // Take the best score
            const bestScore = Math.max(nameScore, countryScore, displayScore);
            
            // Only add small popularity bonus for exact matches or very good matches
            const popularityBonus = bestScore >= 70 ? destination.popularity : 0;
            const finalScore = bestScore + popularityBonus;
            
            return {
                ...destination,
                score: finalScore
            };
        })
        .filter(result => {
            // Filter by score threshold and type preferences
            return result.score >= minScore && 
                   (includeCountries || result.type === 'city');
        })
        .sort((a, b) => {
            // Sort by score first, then by popularity
            if (b.score !== a.score) {
                return b.score - a.score;
            }
            return b.popularity - a.popularity;
        })
        .slice(0, maxResults);
    
    return scoredResults.map(({ score, ...destination }) => destination);
};

// Get popular destinations for initial display
export const getPopularDestinations = (limit: number = 6): CityResult[] => {
    return POPULAR_DESTINATIONS
        .filter(dest => dest.type === 'city') // Only cities for popular suggestions
        .sort((a, b) => b.popularity - a.popularity)
        .slice(0, limit);
};

// Get destinations when no search is performed but user focuses on input
export const getInitialSuggestions = (limit: number = 6): CityResult[] => {
    return POPULAR_DESTINATIONS
        .filter(dest => dest.type === 'city' && dest.popularity >= 8) // Only highly popular cities
        .sort((a, b) => b.popularity - a.popularity)
        .slice(0, limit);
};

// Get destinations by region/continent
export const getDestinationsByRegion = (region: string): CityResult[] => {
    const regionMap: { [key: string]: string[] } = {
        'europa': ['Italia', 'Francia', 'Spagna', 'Germania', 'Regno Unito', 'Paesi Bassi', 'Austria', 'Repubblica Ceca', 'Ungheria', 'Portogallo', 'Irlanda', 'Scozia', 'Svezia', 'Danimarca', 'Norvegia', 'Finlandia', 'Svizzera', 'Grecia', 'Turchia'],
        'asia': ['Giappone', 'Tailandia', 'Singapore', 'Cina', 'Corea del Sud', 'Malesia', 'India', 'Emirati Arabi Uniti', 'Qatar'],
        'america': ['Stati Uniti', 'Canada', 'Brasile', 'Argentina', 'Perù', 'Cile'],
        'oceania': ['Australia', 'Nuova Zelanda'],
        'africa': ['Egitto', 'Marocco', 'Sudafrica']
    };
    
    const normalizedRegion = normalizeText(region);
    const countries = regionMap[normalizedRegion] || [];
    
    return POPULAR_DESTINATIONS.filter(dest => 
        countries.includes(dest.country) && dest.type === 'city'
    ).sort((a, b) => b.popularity - a.popularity);
};

// Export additional utility for checking if destination exists
export const validateDestination = (destination: string): boolean => {
    const normalizedDest = normalizeText(destination);
    return POPULAR_DESTINATIONS.some(dest => 
        normalizeText(dest.name) === normalizedDest || 
        normalizeText(dest.displayName) === normalizedDest
    );
};

export default {
    searchDestinations,
    getPopularDestinations,
    getInitialSuggestions,
    getDestinationsByRegion,
    validateDestination
};
