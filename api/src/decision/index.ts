// ==========================================
// DECISION ENGINE v5.1 — Export central
// Capa adicional sobre v5.0 (no invasiva)
// ==========================================
export * from './types';
export { EXECUTORS } from './executors';
export { normalizeOpportunity } from './normalizer';
export { analyzeOpportunity } from './engine';
export { getBestExecutor, rankOpportunities, checkCapacity } from './matcher';
