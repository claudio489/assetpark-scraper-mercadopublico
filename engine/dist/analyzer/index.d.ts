export interface BusinessCriteria {
    minAmount: number;
    optimalAmount: number;
    maxCompetitors: number;
    sameWinnerThreshold: number;
}
export interface HistoricalPattern {
    totalAdjudicated: number;
    uniqueWinners: number;
    sameWinnerCount: number;
    mostFrequentWinner: string;
    averageBidders: number;
    winRateEstimate: number;
    reasons: string[];
    competitionScore: number;
}
export interface AnalyticScore {
    baseScore: number;
    businessScore: number;
    competitionScore: number;
    finalScore: number;
    recommendation: 'POSTULAR' | 'EVALUAR' | 'EVITAR';
    reasons: string[];
}
export declare const BUSINESS_CRITERIA: Record<string, BusinessCriteria>;
/**
 * Calcula score de negocio basado en monto y viabilidad
 */
export declare function calculateBusinessScore(amount: number, criteria: BusinessCriteria): {
    score: number;
    reasons: string[];
};
/**
 * Analiza competencia histórica de un organismo
 */
export declare function analyzeCompetition(adjudicated: any[], organismoName: string): HistoricalPattern & {
    competitionScore: number;
    reasons: string[];
};
/**
 * Score final combinado
 */
export declare function calculateAnalyticScore(baseScore: number, amount: number, profileId: string, historicalPattern: HistoricalPattern): AnalyticScore;
