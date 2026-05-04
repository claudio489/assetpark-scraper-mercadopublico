"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBestExecutor = getBestExecutor;
exports.rankOpportunities = rankOpportunities;
exports.checkCapacity = checkCapacity;
const engine_1 = require("./engine");
function getBestExecutor(op, executors) {
    const decision = (0, engine_1.analyzeOpportunity)(op, executors);
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
function rankOpportunities(ops, executors, topN) {
    const results = ops.map(op => getBestExecutor(op, executors));
    // Filtrar REJECT al fondo, ordenar por score descendente
    results.sort((a, b) => {
        if (a.decision === 'REJECT' && b.decision !== 'REJECT')
            return 1;
        if (a.decision !== 'REJECT' && b.decision === 'REJECT')
            return -1;
        return b.score - a.score;
    });
    return topN ? results.slice(0, topN) : results;
}
// Simular capacidad total: cuantas oportunidades puede ejecutar cada executor
function checkCapacity(executors, assigned) {
    const remaining = {};
    for (const ex of executors) {
        const used = assigned[ex.id] || 0;
        remaining[ex.id] = Math.max(0, ex.capacity - used);
    }
    return remaining;
}
