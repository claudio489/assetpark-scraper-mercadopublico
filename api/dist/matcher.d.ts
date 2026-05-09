import { Opportunity, Executor } from './types';
export interface MatchResult {
    opportunity: Opportunity;
    executor: Executor | null;
    score: number;
    profit: number;
    risk: number;
    decision: string;
}
export declare function getBestExecutor(op: Opportunity, executors: Executor[]): MatchResult;
export declare function rankOpportunities(ops: Opportunity[], executors: Executor[], topN?: number): MatchResult[];
export declare function checkCapacity(executors: Executor[], assigned: Record<string, number>): Record<string, number>;
