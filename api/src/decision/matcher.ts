// ==========================================
// DECISION ENGINE v5.1 - Matching Engine
// Empareja oportunidad con mejor executor
// ==========================================
import { Opportunity, Executor } from './types';
import { analyzeOpportunity } from './engine';

export interface MatchResult {
  opportunity: Opportunity;
  executor: Executor | null;
  score: number; // decisionValue
  profit: number;
  risk: number;
  decision: string;
}

export function getBestExecutor(op: Opportunity, executors: Executor[]): MatchResult {
  const decision = analyzeOpportunity(op, executors);
  const bestEx = executors.find(e => e.id === decision.bestExecutorId) || null;

  return {
    opportunity: op,
    executor: bestEx,
    score: decision.decisionValue,
    profit: decision.expectedProfit,
    risk: decision.riskScore,
    decision: decision.decision
  };
}

// Ranking global de oportunidades por decisionValue
export function rankOpportunities(ops: Opportunity[], executors: Executor[], topN?: number): MatchResult[] {
  const results = ops.map(op => getBestExecutor(op, executors));
  // Filtrar REJECT al fondo, ordenar por score descendente
  results.sort((a, b) => {
    if (a.decision === 'REJECT' && b.decision !== 'REJECT') return 1;
    if (a.decision !== 'REJECT' && b.decision === 'REJECT') return -1;
    return b.score - a.score;
  });
  return topN ? results.slice(0, topN) : results;
}

// Simular capacidad total: cuantas oportunidades puede ejecutar cada executor
export function checkCapacity(executors: Executor[], assigned: Record<string, number>): Record<string, number> {
  const remaining: Record<string, number> = {};
  for (const ex of executors) {
    const used = assigned[ex.id] || 0;
    remaining[ex.id] = Math.max(0, ex.capacity - used);
  }
  return remaining;
}
