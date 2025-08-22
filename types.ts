
export type View = 'home' | 'travelAnalysis' | 'packingAssistant';

// --- TRAVEL ANALYSIS INPUTS ---

export interface TravelAnalysisInputs {
    destination: string;
    startDate: string;
    endDate: string;
}

export interface TravelAnalysisResults {
    destination: string;
    period: string;
    weatherOverview: {
        averageTemp: number;
        description: string;
        precipitation: string;
    };
    costAnalysis: {
        accommodation: string;
        food: string;
        transport: string;
        activities: string;
    };
    bestTimeToVisit: boolean;
    recommendations: string[];
    aiAnalysis: string;
}

// --- PACKING ASSISTANT INPUTS ---

export interface PackingAssistantInputs {
    destination: string;
    startDate: string;
    endDate: string;
    gender: 'man' | 'woman' | 'other' | 'not-specified';
}

export interface PackingItem {
    category: 'clothing' | 'electronics' | 'health' | 'documents' | 'accessories' | 'other';
    item: string;
    quantity: number;
    priority: 'essential' | 'recommended' | 'optional';
    reason: string;
}

export interface PackingResults {
    destination: string;
    period: string;
    gender: string;
    packingList: PackingItem[];
    healthRecommendations: {
        vaccines: string[];
        medications: string[];
        healthTips: string[];
    };
    travelDocuments: string[];
    aiSuggestions: string;
}

// Legacy types for backward compatibility (to be removed)
export type FinancialProduct = 'Prestito' | 'Finanziaria' | 'Mutuo';

export interface PortfolioItem {
    id: string;
    name: string;
    amount: string;
    returnRate: string;
}

export interface AllLoanInputs {
    capitale: string;
    tan: string;
    durataMesi: string;
    speseIstruttoria: string;
    costiAssicurativi: string;
    speseIncassoRata: string;
    premioAssicurativo: string; // Mensile
    commissioniIntermediazione: string;
    speseGestionePratica: string;
    spread: string;
    parametroRiferimento: string;
    costiNotarili: string;
    assicurazioneObbligatoria: string; // Mensile
    impostaSostitutiva: string;
    
    liquidSavings: string;
    portfolio: PortfolioItem[];
}

// --- LOAN CALC CALCULATIONS ---

export interface PrestitoCalculations {
  rataMensile: number;
  costoTotaleInteressi: number;
  costoFinale: number;
}

export interface FinanziariaCalculations {
  rataMensile: number;
  costoAssicurativoTotale: number;
  costoFinale: number;
}

export interface MutuoCalculations {
  tanEffettivo: number;
  rataMensile: number;
  interessiTotali: number;
  costoFinale: number;
}

export type LoanCalculations = PrestitoCalculations | FinanziariaCalculations | MutuoCalculations;


// --- LOAN CALC AI & CHART ---

export interface FinancialAdvice {
  recommendation: 'PRESTITO' | 'RISPARMI' | 'INDOCISO';
  summary: string;
  detailedAnalysis: string;
  projectedInvestmentGrowth: number;
}

export interface ChartData {
  name: string;
  'Costo Finale Totale': number;
  'Guadagno da Investimento': number;
}

// --- SALARY CALCULATOR ---

export type ContractType = 'indeterminato' | 'determinato' | 'apprendistato';

export interface SalaryCalculatorInputs {
    ral: string;
    mensilita: '12' | '13' | '14';
    regione: string;
    addizionaleComunale: string;
    contractType: ContractType;
    figliACarico: string;
    altriFamiliariACarico: string;
}

export interface SalaryCalculationResults {
    ral: number;
    nettoAnnuale: number;
    nettoMensile: number;
    contributiINPS: number;
    irpefLorda: number;
    irpefNetta: number;
    detrazioniLavoro: number;
    addizionaleRegionale: number;
    addizionaleComunale: number;
    totaleImposte: number;
}
