import { NormalizedOpportunity, ScoredOpportunity, ClientProfile, Priority } from '../types';
/**
 * Scoring unificado:
 * score = aiScore || matchScore || 50
 *
 * Prioridades:
 * >= 80 → alta
 * 60-79 → media
 * < 60  → baja
 */
export declare function scoreOpportunities(opportunities: NormalizedOpportunity[], profile: ClientProfile): ScoredOpportunity[];
export declare function scoreSingle(opportunity: NormalizedOpportunity, profile: ClientProfile): ScoredOpportunity;
declare function scoreToPriority(score: number): Priority;
declare function clampScore(score: number): number;
export { scoreToPriority, clampScore };
