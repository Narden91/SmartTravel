
import { SalaryCalculatorInputs, SalaryCalculationResults, ContractType } from '../types';

// Data sourced from prompt for 2025 calculations
const INPS_ALIQUOTA_DIPENDENTE = 0.0919;
const IRPEF_BRACKETS = [
    { limit: 28000, rate: 0.23 },
    { limit: 50000, rate: 0.35 },
    { limit: Infinity, rate: 0.43 },
];
const NO_TAX_AREA = 8500;

// Simplified Regional and Communal tax rates (averages)
const REGIONAL_TAX_RATES: { [key: string]: number } = {
    "Lombardia": 0.0123,
    "Lazio": 0.0173,
    "Campania": 0.0203,
    "Sicilia": 0.0123,
    "Veneto": 0.0123,
    // Add other regions or use a default
};
const DEFAULT_REGIONAL_TAX = 0.017; // Average if not specified

const getDetrazioneLavoroDipendente = (reddito: number, contractType: ContractType): number => {
    if (reddito <= 15000) {
        const baseDetrazione = 1955;
        // Minimum guaranteed is different for fixed-term
        const minDetrazione = contractType === 'determinato' ? 1380 : 690;
        return Math.max(minDetrazione, baseDetrazione);
    }
    if (reddito <= 28000) {
        return 1910 + 1190 * ((28000 - reddito) / 13000);
    }
    if (reddito <= 50000) {
        return 1910 * ((50000 - reddito) / 22000);
    }
    return 0;
};

// Simplified children deduction. Real calculation is more complex (Assegno Unico).
// This serves as a placeholder for tax reduction.
const getDetrazioniFamiliari = (figli: number, altri: number): number => {
    // Highly simplified model. This doesn't reflect Assegno Unico but represents a tax benefit.
    const DETRAZIONE_MENSILE_FIGLIO = 50;
    const DETRAZIONE_MENSILE_ALTRO_FAMILIARE = 45;
    return (figli * DETRAZIONE_MENSILE_FIGLIO + altri * DETRAZIONE_MENSILE_ALTRO_FAMILIARE) * 12;
};

export const calculateNetSalary = (inputs: SalaryCalculatorInputs): SalaryCalculationResults => {
    const getNum = (val: string) => parseFloat(val) || 0;

    const ral = getNum(inputs.ral);
    const figliACarico = getNum(inputs.figliACarico);
    const altriFamiliariACarico = getNum(inputs.altriFamiliariACarico);

    // 1. Calculate INPS Contributions
    const contributiINPS = ral * INPS_ALIQUOTA_DIPENDENTE;
    
    // 2. Calculate IRPEF Taxable Income
    const redditoImponibileIRPEF = ral - contributiINPS;

    // 3. Check for No Tax Area
    if (redditoImponibileIRPEF <= NO_TAX_AREA) {
        return {
            ral,
            nettoAnnuale: redditoImponibileIRPEF,
            nettoMensile: redditoImponibileIRPEF / parseInt(inputs.mensilita),
            contributiINPS,
            irpefLorda: 0,
            irpefNetta: 0,
            detrazioniLavoro: 0,
            addizionaleRegionale: 0,
            addizionaleComunale: 0,
            totaleImposte: 0,
        };
    }

    // 4. Calculate Gross IRPEF
    let irpefLorda = 0;
    let remainingIncome = redditoImponibileIRPEF;
    let previousLimit = 0;
    for (const bracket of IRPEF_BRACKETS) {
        if (remainingIncome > 0) {
            const taxableInBracket = Math.min(remainingIncome, bracket.limit - previousLimit);
            irpefLorda += taxableInBracket * bracket.rate;
            remainingIncome -= taxableInBracket;
            previousLimit = bracket.limit;
        }
    }

    // 5. Calculate Deductions
    const detrazioniLavoro = getDetrazioneLavoroDipendente(redditoImponibileIRPEF, inputs.contractType);
    const detrazioniFamiliari = getDetrazioniFamiliari(figliACarico, altriFamiliariACarico);
    const detrazioniTotali = detrazioniLavoro + detrazioniFamiliari;
    
    // 6. Calculate Net IRPEF
    const irpefNetta = Math.max(0, irpefLorda - detrazioniTotali);

    // 7. Calculate Regional and Communal Surcharges
    const regionalTaxRate = REGIONAL_TAX_RATES[inputs.regione] || DEFAULT_REGIONAL_TAX;
    const addizionaleRegionale = redditoImponibileIRPEF * regionalTaxRate;
    const addizionaleComunale = redditoImponibileIRPEF * (getNum(inputs.addizionaleComunale) / 100);

    // 8. Calculate Final Net Salary
    const totaleImposte = irpefNetta + addizionaleRegionale + addizionaleComunale;
    const nettoAnnuale = ral - contributiINPS - totaleImposte;
    const nettoMensile = nettoAnnuale / parseInt(inputs.mensilita);

    return {
        ral,
        nettoAnnuale,
        nettoMensile,
        contributiINPS,
        irpefLorda,
        irpefNetta,
        detrazioniLavoro,
        addizionaleRegionale,
        addizionaleComunale,
        totaleImposte,
    };
};
