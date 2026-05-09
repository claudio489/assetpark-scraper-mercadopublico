"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeOpportunity = analyzeOpportunity;
// Sigmoide: mapea cualquier numero a (0,1)
function sigmoid(x) {
    return 1 / (1 + Math.exp(-x));
}
// 1. Probabilidad de exito basada en score v5.0 + urgencia + complejidad
function calcProbabilitySuccess(op) {
    // scoreV50 -> z-score centrado en 50
    const scoreFactor = (op.scoreV50 - 50) / 25; // -2 a +2
    // urgencia: mas urgente = menos tiempo para preparar = menor prob
    const urgencyFactor = (op.urgency - 50) / 100; // -0.5 a +0.5
    // complejidad: mas complejo = mas riesgo de no cumplir bases
    const complexityFactor = (op.complexity - 50) / 100; // -0.5 a +0.5
    // recomendacion v5.0 como prior
    let recBonus = 0;
    if (op.recommendationV50 === 'POSTULAR')
        recBonus = 0.5;
    else if (op.recommendationV50 === 'EVALUAR')
        recBonus = 0.1;
    else
        recBonus = -0.3;
    const z = scoreFactor - (urgencyFactor * 0.3) - (complexityFactor * 0.2) + recBonus;
    return Math.max(0.05, Math.min(0.98, sigmoid(z)));
}
// 2. Fit de ejecucion entre oportunidad y executor
function calcFit(op, ex) {
    // A) Match de industria
    const industryMatch = ex.industries.includes(op.industry) ? 1.0 : 0.0;
    if (industryMatch === 0)
        return 0; // no fit si no esta en la industria
    // B) Rango de monto
    let amountFit = 1.0;
    if (op.value > 0) {
        if (op.value < ex.minAmount)
            amountFit = 0.2;
        else if (op.value > ex.maxAmount)
            amountFit = 0.1;
        else {
            // Dentro del rango: mejor en la mitad superior del rango
            const mid = (ex.minAmount + ex.maxAmount) / 2;
            amountFit = op.value >= mid ? 1.0 : 0.7;
        }
    }
    else {
        // Monto oculto: neutral para internos, penalizado para partners/suppliers
        amountFit = ex.type === 'internal' ? 0.6 : 0.3;
    }
    // C) Capacidad disponible (simulada)
    const capacityFit = ex.capacity / 20; // normalizado a ~0-1
    // D) Tasa de exito historico como proxy de fit
    const successFit = ex.successRate;
    // Fit ponderado
    const fit = (industryMatch * 0.35 +
        amountFit * 0.30 +
        capacityFit * 0.15 +
        successFit * 0.20);
    return Math.max(0, Math.min(1, fit));
}
// 3. Valor esperado: V = P * margin * fit * value
function calcExpectedProfit(op, ex, prob, fit) {
    const margin = ex.margin;
    const value = op.value || 0;
    // Si monto es 0, estimamos valor esperado basado en optimal del rubro
    const estimatedValue = value > 0 ? value : estimateValueByIndustry(op.industry);
    return Math.round(prob * margin * fit * estimatedValue);
}
function estimateValueByIndustry(industry) {
    const defaults = {
        constructora: 100_000_000,
        hormigon: 15_000_000,
        tecnologia: 10_000_000,
        salud: 20_000_000,
        imprenta: 3_000_000,
        buceo: 2_000_000,
        general: 5_000_000
    };
    return defaults[industry] || 5_000_000;
}
// 4. Riesgo estructurado
function calcRisk(op, ex) {
    // w1: financial — monto desconocido o fuera de rango
    let financialRisk = 0;
    if (op.value === 0)
        financialRisk = 70; // monto oculto = alto riesgo
    else if (op.value < ex.minAmount)
        financialRisk = 50;
    else if (op.value > ex.maxAmount)
        financialRisk = 60;
    else
        financialRisk = 20;
    // w2: technical — complejidad del proyecto
    const technicalRisk = op.complexity;
    // w3: time — poco tiempo para postular
    const timeRisk = op.urgency > 80 ? 80 : op.urgency > 50 ? 50 : 20;
    // w4: execution — depende del tipo de executor
    const executionRisk = ex.type === 'internal' ? 20 : ex.type === 'partner' ? 40 : 50;
    // Ponderacion
    const risk = (financialRisk * 0.30 +
        technicalRisk * 0.20 +
        timeRisk * 0.30 +
        executionRisk * 0.20);
    return Math.round(risk);
}
// 5. Score final: S = alpha*V + beta*Fit - gamma*R
function calcDecisionValue(expectedProfit, fit, risk, op) {
    const alpha = 0.000001; // escalar profit a rango 0-100
    const beta = 35; // peso del fit
    const gamma = 0.4; // penalizacion del riesgo
    // Normalizar profit a escala comparable
    const profitNorm = Math.min(100, expectedProfit * alpha);
    const fitNorm = fit * beta;
    const riskPenalty = risk * gamma;
    let s = profitNorm + fitNorm - riskPenalty;
    // Boost para POSTULAR v5.0
    if (op.recommendationV50 === 'POSTULAR')
        s += 10;
    // Penalizacion para EVITAR v5.0
    if (op.recommendationV50 === 'EVITAR')
        s -= 15;
    return Math.max(0, Math.min(100, Math.round(s)));
}
// Decision binaria basada en score
function calcDecision(score, prob, risk, ex) {
    if (score >= 70 && prob >= 0.6 && risk <= 50) {
        return ex.type === 'internal' ? 'ACCEPT' : 'PARTNER';
    }
    if (score >= 50 && prob >= 0.4 && risk <= 65) {
        return 'MONITOR';
    }
    if (score < 30 || prob < 0.2 || risk > 80) {
        return 'REJECT';
    }
    return 'MONITOR';
}
// ==========================================
// API PUBLICA
// ==========================================
function analyzeOpportunity(op, executors) {
    // 1. Probabilidad de exito
    const prob = calcProbabilitySuccess(op);
    // 2 & 3 & 4: Evaluar contra cada executor y elegir el mejor
    let bestExecutor = null;
    let bestFit = -1;
    let bestProfit = 0;
    let bestRisk = 100;
    const reasons = [];
    for (const ex of executors) {
        const fit = calcFit(op, ex);
        if (fit === 0)
            continue; // no aplica
        const profit = calcExpectedProfit(op, ex, prob, fit);
        const risk = calcRisk(op, ex);
        // Score compuesto para elegir mejor executor
        const exScore = (prob * 30) + (fit * 30) + (profit / 1_000_000) - (risk * 0.3);
        if (exScore > bestFit) {
            bestFit = exScore;
            bestExecutor = ex;
            bestProfit = profit;
            bestRisk = risk;
        }
    }
    if (!bestExecutor) {
        // No hay executor adecuado
        return {
            probabilitySuccess: prob,
            fitScore: 0,
            expectedProfit: 0,
            riskScore: 100,
            decisionValue: 0,
            decision: 'REJECT',
            bestExecutorId: 'none',
            bestExecutorName: 'Sin executor adecuado',
            reasoning: ['Ninguna entidad ejecutora cubre este rubro/monto']
        };
    }
    // 5. Score final
    const decisionValue = calcDecisionValue(bestProfit, calcFit(op, bestExecutor), bestRisk, op);
    const decision = calcDecision(decisionValue, prob, bestRisk, bestExecutor);
    // Reasoning
    reasons.push(`Probabilidad de exito: ${(prob * 100).toFixed(1)}%`);
    reasons.push(`Fit con ${bestExecutor.name}: ${(calcFit(op, bestExecutor) * 100).toFixed(0)}%`);
    reasons.push(`Ganancia estimada: $${(bestProfit / 1_000_000).toFixed(1)}M`);
    reasons.push(`Riesgo: ${bestRisk}/100`);
    reasons.push(`Executor: ${bestExecutor.type === 'internal' ? 'Interno' : bestExecutor.type === 'partner' ? 'Partner' : 'Supplier'}`);
    return {
        probabilitySuccess: prob,
        fitScore: calcFit(op, bestExecutor),
        expectedProfit: bestProfit,
        riskScore: bestRisk,
        decisionValue,
        decision,
        bestExecutorId: bestExecutor.id,
        bestExecutorName: bestExecutor.name,
        reasoning: reasons
    };
}
