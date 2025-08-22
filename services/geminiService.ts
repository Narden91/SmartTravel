
import { GoogleGenAI, Type } from "@google/genai";
import { TravelAnalysisInputs, TravelAnalysisResults, PackingAssistantInputs, PackingResults } from '../types';
import { isDomainAllowed, sanitizeDestinationInputForSubmit } from '../security.config';
import RateLimitService from './rateLimitService';

// Get API key from environment variables (supports both development and production)
// Use process.env for Node.js environment (defined in vite.config.ts) as fallback
const apiKey = process.env.VITE_GEMINI_API_KEY;

// Security: Only log API key status in development mode, never expose actual key
if (process.env.NODE_ENV === 'development') {
    console.log('[GeminiService] Environment check:', {
        hasApiKey: !!apiKey,
        nodeEnv: process.env.NODE_ENV
    });
}

if (!apiKey) {
    if (process.env.NODE_ENV === 'development') {
        console.warn("Gemini API key not found. Using mock responses. Set VITE_GEMINI_API_KEY environment variable for real functionality.");
    }
}

// Validate API endpoint domain for security
const GEMINI_API_DOMAIN = 'https://generativelanguage.googleapis.com';
if (apiKey && !isDomainAllowed(GEMINI_API_DOMAIN)) {
    throw new Error("Gemini API domain not allowed by security policy.");
}

const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

// Initialize rate limiting service
const rateLimitService = RateLimitService.getInstance();

// Enhanced error handling with retry logic
class APIError extends Error {
    constructor(
        message: string,
        public statusCode?: number,
        public retryAfter?: number,
        public isRateLimited?: boolean
    ) {
        super(message);
        this.name = 'APIError';
    }
}

// Request retry utility with exponential backoff
const retryWithBackoff = async <T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
): Promise<T> => {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error as Error;
            
            // Don't retry rate limit errors or client errors
            if (error instanceof APIError && (error.isRateLimited || (error.statusCode && error.statusCode >= 400 && error.statusCode < 500))) {
                throw error;
            }
            
            if (attempt === maxRetries) {
                rateLimitService.recordFailure();
                throw lastError;
            }
            
            // Exponential backoff with jitter
            const delay = Math.min(baseDelay * Math.pow(2, attempt) + Math.random() * 1000, 30000);
            if (process.env.NODE_ENV === 'development') {
                console.warn(`[GeminiService] Attempt ${attempt + 1} failed, retrying in ${delay}ms:`, error.message);
            }
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    
    throw lastError!;
};

// Travel Analysis Schema
const travelAnalysisSchema = {
    type: Type.OBJECT,
    properties: {
        weatherOverview: {
            type: Type.OBJECT,
            properties: {
                averageTemp: { type: Type.NUMBER, description: "Temperatura media in Celsius" },
                description: { type: Type.STRING, description: "Descrizione generale del tempo" },
                precipitation: { type: Type.STRING, description: "Probabilità di precipitazioni" }
            },
            required: ['averageTemp', 'description', 'precipitation']
        },
        costAnalysis: {
            type: Type.OBJECT,
            properties: {
                accommodation: { type: Type.STRING, description: "Range costi alloggio per notte" },
                food: { type: Type.STRING, description: "Range costi cibo al giorno" },
                transport: { type: Type.STRING, description: "Range costi trasporti al giorno" },
                activities: { type: Type.STRING, description: "Range costi attività al giorno" }
            },
            required: ['accommodation', 'food', 'transport', 'activities']
        },
        bestTimeToVisit: {
            type: Type.BOOLEAN,
            description: "True se il periodo è ottimale per visitare la destinazione"
        },
        recommendations: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Lista di raccomandazioni pratiche per il viaggio"
        },
        aiAnalysis: {
            type: Type.STRING,
            description: "Analisi dettagliata e consigli personalizzati per il viaggio"
        }
    },
    required: ['weatherOverview', 'costAnalysis', 'bestTimeToVisit', 'recommendations', 'aiAnalysis']
};

// Packing Schema
const packingSchema = {
    type: Type.OBJECT,
    properties: {
        packingList: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    category: { 
                        type: Type.STRING, 
                        enum: ['clothing', 'electronics', 'health', 'documents', 'accessories', 'other'],
                        description: "Categoria dell'oggetto" 
                    },
                    item: { type: Type.STRING, description: "Nome dell'oggetto" },
                    quantity: { type: Type.NUMBER, description: "Quantità consigliata" },
                    priority: { 
                        type: Type.STRING, 
                        enum: ['essential', 'recommended', 'optional'],
                        description: "Priorità dell'oggetto" 
                    },
                    reason: { type: Type.STRING, description: "Motivazione per includere l'oggetto" }
                },
                required: ['category', 'item', 'quantity', 'priority', 'reason']
            }
        },
        healthRecommendations: {
            type: Type.OBJECT,
            properties: {
                vaccines: { 
                    type: Type.ARRAY, 
                    items: { type: Type.STRING },
                    description: "Vaccini consigliati o obbligatori" 
                },
                medications: { 
                    type: Type.ARRAY, 
                    items: { type: Type.STRING },
                    description: "Medicinali consigliati da portare" 
                },
                healthTips: { 
                    type: Type.ARRAY, 
                    items: { type: Type.STRING },
                    description: "Consigli generali per la salute" 
                }
            },
            required: ['vaccines', 'medications', 'healthTips']
        },
        travelDocuments: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Lista documenti necessari per il viaggio"
        },
        aiSuggestions: {
            type: Type.STRING,
            description: "Consigli personalizzati e suggerimenti aggiuntivi dall'AI"
        }
    },
    required: ['packingList', 'healthRecommendations', 'travelDocuments', 'aiSuggestions']
};

// Mock data generators for when API key is not available
const generateMockTravelAnalysis = (inputs: TravelAnalysisInputs): TravelAnalysisResults => {
    const destinations = {
        'roma': { temp: 25, weather: 'Soleggiato con possibili acquazzoni pomeridiani', accommodation: '€70-180/notte' },
        'parigi': { temp: 18, weather: 'Variabile con possibili piogge', accommodation: '€90-250/notte' },
        'londra': { temp: 15, weather: 'Nuvoloso con piogge frequenti', accommodation: '€100-300/notte' },
        'bangkok': { temp: 32, weather: 'Caldo e umido con monsoni', accommodation: '€25-80/notte' },
        'tokyo': { temp: 22, weather: 'Mite con alta umidità', accommodation: '€60-200/notte' }
    };

    const destKey = inputs.destination.toLowerCase();
    const destData = destinations[destKey as keyof typeof destinations] || destinations['roma'];

    return {
        destination: inputs.destination,
        period: `${inputs.startDate} - ${inputs.endDate}`,
        weatherOverview: {
            averageTemp: destData.temp,
            description: destData.weather,
            precipitation: '25-40% di probabilità'
        },
        costAnalysis: {
            accommodation: destData.accommodation,
            food: '€20-50/giorno',
            transport: '€10-25/giorno',
            activities: '€15-45/giorno'
        },
        bestTimeToVisit: destData.temp > 15 && destData.temp < 30,
        recommendations: [
            'Prenota alloggi in anticipo per migliori tariffe',
            'Controlla il meteo prima della partenza',
            'Porta sempre un ombrello o impermeabile',
            'Scarica app offline per mappe e traduzioni'
        ],
        aiAnalysis: `${inputs.destination} è una destinazione interessante per il periodo selezionato. Il clima è ${destData.temp > 20 ? 'favorevole' : 'fresco'} con temperature attorno ai ${destData.temp}°C. Ti consiglio di prenotare in anticipo e prepararti per ${destData.weather.toLowerCase()}.`
    };
};

const generateMockPackingList = (inputs: PackingAssistantInputs): PackingResults => {
    const baseItems = [
        { category: 'clothing', item: 'T-shirt comode', quantity: 3, priority: 'essential', reason: 'Abbigliamento base per clima temperato' },
        { category: 'clothing', item: 'Pantaloni lunghi', quantity: 2, priority: 'essential', reason: 'Per serate e luoghi formali' },
        { category: 'clothing', item: 'Giacca leggera', quantity: 1, priority: 'recommended', reason: 'Per serate fresche e pioggia' },
        { category: 'electronics', item: 'Caricatore universale', quantity: 1, priority: 'essential', reason: 'Per ricaricare dispositivi' },
        { category: 'electronics', item: 'Power bank', quantity: 1, priority: 'recommended', reason: 'Per lunghe giornate fuori' },
        { category: 'health', item: 'Kit primo soccorso', quantity: 1, priority: 'recommended', reason: 'Per piccole emergenze' },
        { category: 'health', item: 'Protezione solare', quantity: 1, priority: 'essential', reason: 'Protezione UV' },
        { category: 'documents', item: 'Passaporto', quantity: 1, priority: 'essential', reason: 'Documento di viaggio obbligatorio' },
        { category: 'documents', item: 'Assicurazione viaggio', quantity: 1, priority: 'recommended', reason: 'Copertura medica' }
    ];

    return {
        destination: inputs.destination,
        period: `${inputs.startDate} - ${inputs.endDate}`,
        gender: inputs.gender,
        packingList: baseItems as any,
        healthRecommendations: {
            vaccines: ['Nessun vaccino obbligatorio per destinazioni EU', 'Verifica tetano aggiornato'],
            medications: ['Paracetamolo', 'Antidiarroico', 'Antistaminico'],
            healthTips: [
                'Mantieni idratazione costante',
                'Usa protezione solare',
                'Evita cibi crudi se viaggi in paesi tropicali'
            ]
        },
        travelDocuments: [
            'Passaporto valido',
            'Carta d\'identità EU',
            'Assicurazione sanitaria',
            'Prenotazioni hotel',
            'Biglietti trasporto'
        ],
        aiSuggestions: `Per il tuo viaggio a ${inputs.destination}, ho preparato una lista essenziale. Ricorda di controllare i requisiti d'ingresso specifici del paese e di informare la banca dei tuoi spostamenti.`
    };
};

export const getTravelAnalysis = async (inputs: TravelAnalysisInputs): Promise<TravelAnalysisResults> => {
    // If no API key, return mock data
    if (!apiKey || !ai) {
        if (process.env.NODE_ENV === 'development') {
            console.log('[GeminiService] Using mock travel analysis data');
        }
        return generateMockTravelAnalysis(inputs);
    }

    const requestSize = JSON.stringify(inputs).length;
    const rateLimitCheck = await rateLimitService.checkRateLimit(requestSize, 'gemini-api');
    
    if (!rateLimitCheck.allowed) {
        const error = new APIError(
            rateLimitCheck.reason || 'Rate limit exceeded',
            429,
            rateLimitCheck.retryAfter,
            true
        );
        throw error;
    }

    const { destination, startDate, endDate } = inputs;
    const sanitizedDestination = sanitizeDestinationInputForSubmit(destination);

    const prompt = `
        Agisci come un esperto consulente di viaggi. Analizza la destinazione ${sanitizedDestination} per il periodo dal ${startDate} al ${endDate}.

        Fornisci un'analisi completa che includa:

        1. **Panoramica Meteo**: Temperatura media, condizioni generali del tempo, probabilità di precipitazioni per il periodo specifico.

        2. **Analisi Costi** (in EUR):
           - Range costi alloggio per notte
           - Range costi cibo al giorno
           - Range costi trasporti locali al giorno
           - Range costi attività/attrazioni al giorno

        3. **Valutazione Periodo**: Determina se questo è un periodo ottimale per visitare la destinazione considerando clima, eventi stagionali, affollamento turistico.

        4. **Raccomandazioni Pratiche**: Lista di 3-5 consigli specifici per questo viaggio.

        5. **Analisi Dettagliata**: Un paragrafo con analisi approfondita, consigli personalizzati e informazioni utili specifiche per il periodo e la destinazione.

        Considera fattori come stagionalità, eventi locali, condizioni meteo tipiche, prezzi stagionali, e l'esperienza turistica generale.

        Fornisci la risposta in formato JSON secondo lo schema definito.
    `;

    try {
        const response = await retryWithBackoff(async () => {
            const result = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: travelAnalysisSchema,
                    temperature: 0.4,
                },
            });
            
            rateLimitService.recordFailure(); // Reset failure count on success
            return result;
        });

        const jsonText = response.text?.trim();
        if (!jsonText) {
            throw new Error("Il modello AI ha restituito una risposta vuota. Riprova.");
        }
        
        const cleanedJsonText = jsonText.replace(/^```json\s*|```$/g, '');
        const parsedResponse = JSON.parse(cleanedJsonText);

        return {
            destination: sanitizedDestination,
            period: `${startDate} - ${endDate}`,
            ...parsedResponse
        } as TravelAnalysisResults;

    } catch (error) {
        rateLimitService.recordFailure();
        
        if (error instanceof APIError) {
            throw error;
        }
        
        if (error instanceof SyntaxError) {
            throw new APIError("Il modello AI ha restituito una risposta malformata. Riprova.", 422);
        }
        
        const message = error instanceof Error ? error.message : "Errore sconosciuto";
        
        if (message.includes('quota') || message.includes('rate') || message.includes('limit')) {
            throw new APIError("Limite di richieste API raggiunto. Riprova tra qualche minuto.", 429, 300, true);
        }
        
        throw new APIError("Non è stato possibile contattare il servizio AI. Riprova più tardi.", 503);
    }
};

export const getPackingList = async (inputs: PackingAssistantInputs): Promise<PackingResults> => {
    // If no API key, return mock data
    if (!apiKey || !ai) {
        if (process.env.NODE_ENV === 'development') {
            console.log('[GeminiService] Using mock packing list data');
        }
        return generateMockPackingList(inputs);
    }

    const requestSize = JSON.stringify(inputs).length;
    const rateLimitCheck = await rateLimitService.checkRateLimit(requestSize, 'gemini-api');
    
    if (!rateLimitCheck.allowed) {
        const error = new APIError(
            rateLimitCheck.reason || 'Rate limit exceeded',
            429,
            rateLimitCheck.retryAfter,
            true
        );
        throw error;
    }

    const { destination, startDate, endDate, gender } = inputs;
    const sanitizedDestination = sanitizeDestinationInputForSubmit(destination);
    const duration = Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24));

    const prompt = `
        Agisci come un esperto consulente di viaggi specializzato nella preparazione bagagli. 

        Crea una lista dettagliata per un viaggio a ${sanitizedDestination} dal ${startDate} al ${endDate} (${duration} giorni) per una persona di genere ${gender === 'man' ? 'maschile' : gender === 'woman' ? 'femminile' : 'non specificato'}.

        La lista deve includere:

        1. **Lista Bagaglio Categorizzata**:
           - Abbigliamento (considera clima, durata, attività tipiche)
           - Elettronica (adattatori, caricatori, dispositivi)
           - Salute e igiene (medicinali, prodotti personali)
           - Documenti (passaporto, visti, assicurazioni)
           - Accessori (borse, scarpe, oggetti utili)
           
           Per ogni oggetto specifica:
           - Categoria esatta (clothing, electronics, health, documents, accessories, other)
           - Nome dell'oggetto
           - Quantità raccomandata
           - Priorità (essential, recommended, optional)
           - Motivazione specifica per quella destinazione/periodo

        2. **Raccomandazioni Sanitarie**:
           - Vaccini richiesti o consigliati
           - Medicinali da portare
           - Consigli per la salute specifici per la destinazione

        3. **Documenti di Viaggio**: Lista completa documenti necessari

        4. **Suggerimenti AI**: Consigli personalizzati aggiuntivi

        Considera fattori come: clima locale, stagione, cultura locale, attività tipiche, durata del viaggio, standard sanitari del paese.

        Fornisci la risposta in formato JSON secondo lo schema definito.
    `;

    try {
        const response = await retryWithBackoff(async () => {
            const result = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: packingSchema,
                    temperature: 0.4,
                },
            });
            
            rateLimitService.recordFailure(); // Reset failure count on success
            return result;
        });

        const jsonText = response.text?.trim();
        if (!jsonText) {
            throw new Error("Il modello AI ha restituito una risposta vuota. Riprova.");
        }
        
        const cleanedJsonText = jsonText.replace(/^```json\s*|```$/g, '');
        const parsedResponse = JSON.parse(cleanedJsonText);

        return {
            destination: sanitizedDestination,
            period: `${startDate} - ${endDate}`,
            gender: inputs.gender,
            ...parsedResponse
        } as PackingResults;

    } catch (error) {
        rateLimitService.recordFailure();
        
        if (error instanceof APIError) {
            throw error;
        }
        
        if (error instanceof SyntaxError) {
            throw new APIError("Il modello AI ha restituito una risposta malformata. Riprova.", 422);
        }
        
        const message = error instanceof Error ? error.message : "Errore sconosciuto";
        
        if (message.includes('quota') || message.includes('rate') || message.includes('limit')) {
            throw new APIError("Limite di richieste API raggiunto. Riprova tra qualche minuto.", 429, 300, true);
        }
        
        throw new APIError("Non è stato possibile contattare il servizio AI. Riprova più tardi.", 503);
    }
};
