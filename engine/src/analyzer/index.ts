// ==========================================
// ANALYZER - Capa de analíticas avanzadas
// Scoring con criterios de negocio DYG
// ==========================================

export interface BusinessCriteria {
  minAmount: number;        // Monto mínimo operativo para el rubro
  optimalAmount: number;    // Monto ideal
  maxCompetitors: number;   // Máx competidores aceptables
  sameWinnerThreshold: number; // % de veces que el mismo ganador = alerta
}

export interface HistoricalPattern {
  totalAdjudicated: number;
  uniqueWinners: number;
  sameWinnerCount: number;
  mostFrequentWinner: string;
  averageBidders: number;
  winRateEstimate: number;  // 0-100 probabilidad de ganar
  reasons: string[];
  competitionScore: number;
}

export interface AnalyticScore {
  baseScore: number;        // Match de keywords 0-100
  businessScore: number;    // Criterios de negocio 0-100
  competitionScore: number; // Análisis de competencia 0-100
  finalScore: number;       // Ponderado 0-100
  recommendation: 'POSTULAR' | 'EVALUAR' | 'EVITAR';
  reasons: string[];
}

// Criterios de negocio por rubro (en CLP)
export const BUSINESS_CRITERIA: Record<string, BusinessCriteria> = {
  constructora: { minAmount: 10_000_000, optimalAmount: 500_000_000, maxCompetitors: 8, sameWinnerThreshold: 60 },
  tecnologia:   { minAmount: 2_000_000,   optimalAmount: 50_000_000,  maxCompetitors: 5, sameWinnerThreshold: 70 },
  salud:        { minAmount: 5_000_000,   optimalAmount: 100_000_000, maxCompetitors: 6, sameWinnerThreshold: 65 },
  buceo:        { minAmount: 1_000_000,   optimalAmount: 10_000_000,  maxCompetitors: 3, sameWinnerThreshold: 80 },
  imprenta:     { minAmount: 500_000,      optimalAmount: 20_000_000,  maxCompetitors: 7, sameWinnerThreshold: 60 },
  general:      { minAmount: 100_000,      optimalAmount: 1_000_000,   maxCompetitors: 10, sameWinnerThreshold: 50 }
};

/**
 * Calcula score de negocio basado en monto y viabilidad
 */
export function calculateBusinessScore(amount: number, criteria: BusinessCriteria): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 50; // Base

  if (amount === 0) {
    reasons.push('Monto no visible (licitación activa)');
    score = 40;
  } else if (amount < criteria.minAmount) {
    reasons.push(`Monto ${fmtAmount(amount)} está por debajo del mínimo operativo ${fmtAmount(criteria.minAmount)}`);
    score = 20;
  } else if (amount >= criteria.optimalAmount) {
    reasons.push(`Monto ${fmtAmount(amount)} supera el óptimo ${fmtAmount(criteria.optimalAmount)}`);
    score = 95;
  } else {
    // Proporcional entre min y optimal
    const ratio = (amount - criteria.minAmount) / (criteria.optimalAmount - criteria.minAmount);
    score = 50 + Math.round(ratio * 45);
    reasons.push(`Monto ${fmtAmount(amount)} dentro de rango operativo`);
  }

  return { score: Math.min(100, score), reasons };
}

/**
 * Analiza competencia histórica de un organismo
 */
export function analyzeCompetition(
  adjudicated: any[],
  organismoName: string
): HistoricalPattern & { competitionScore: number; reasons: string[] } {
  const reasons: string[] = [];

  if (!adjudicated || adjudicated.length === 0) {
    return {
      totalAdjudicated: 0,
      uniqueWinners: 0,
      sameWinnerCount: 0,
      mostFrequentWinner: '',
      averageBidders: 0,
      winRateEstimate: 50, // Desconocido = neutral
      competitionScore: 50,
      reasons: ['Sin historial de adjudicaciones disponible']
    };
  }

  // Contar ganadores
  const winnerCounts: Record<string, number> = {};
  let totalBidders = 0;
  for (const adj of adjudicated) {
    const winner = adj.adjudicacion?.NombreProveedor || 'Desconocido';
    winnerCounts[winner] = (winnerCounts[winner] || 0) + 1;
    totalBidders += adj.adjudicacion?.NumeroOferentes || 0;
  }

  const uniqueWinners = Object.keys(winnerCounts).length;
  const totalAdjudicated = adjudicated.length;
  const sortedWinners = Object.entries(winnerCounts).sort((a, b) => b[1] - a[1]);
  const mostFrequentWinner = sortedWinners[0]?.[0] || '';
  const sameWinnerCount = sortedWinners[0]?.[1] || 0;
  const sameWinnerPct = totalAdjudicated > 0 ? (sameWinnerCount / totalAdjudicated) * 100 : 0;
  const averageBidders = totalAdjudicated > 0 ? Math.round(totalBidders / totalAdjudicated) : 0;

  // Calcular probabilidad de éxito
  let winRateEstimate = 50;
  let competitionScore = 50;

  if (sameWinnerPct > 70) {
    winRateEstimate = 15;
    competitionScore = 20;
    reasons.push(`ALERTA: "${mostFrequentWinner}" gana el ${Math.round(sameWinnerPct)}% de las licitaciones de este organismo. Posible preferencia/cartel.`);
  } else if (sameWinnerPct > 50) {
    winRateEstimate = 30;
    competitionScore = 35;
    reasons.push(`Precaución: "${mostFrequentWinner}" domina con ${Math.round(sameWinnerPct)}% de ganadas.`);
  } else if (uniqueWinners >= 5) {
    winRateEstimate = 60;
    competitionScore = 70;
    reasons.push(`Competencia diversa: ${uniqueWinners} ganadores distintos en ${totalAdjudicated} licitaciones.`);
  } else {
    winRateEstimate = 45;
    competitionScore = 55;
    reasons.push(`Competencia moderada: pocos ganadores históricos.`);
  }

  if (averageBidders <= 2) {
    reasons.push(`Baja competencia: ${averageBidders} oferentes promedio. Oportunidad.`);
    winRateEstimate += 15;
    competitionScore += 15;
  } else if (averageBidders >= 8) {
    reasons.push(`Alta competencia: ${averageBidders} oferentes promedio.`);
    winRateEstimate -= 15;
    competitionScore -= 15;
  }

  return {
    totalAdjudicated,
    uniqueWinners,
    sameWinnerCount,
    mostFrequentWinner,
    averageBidders,
    winRateEstimate: Math.max(5, Math.min(95, winRateEstimate)),
    competitionScore: Math.max(10, Math.min(100, competitionScore)),
    reasons
  };
}

/**
 * Score final combinado
 */
export function calculateAnalyticScore(
  baseScore: number,
  amount: number,
  profileId: string,
  historicalPattern: HistoricalPattern
): AnalyticScore {
  const criteria = BUSINESS_CRITERIA[profileId] || BUSINESS_CRITERIA.general;
  const biz = calculateBusinessScore(amount, criteria);
  const comp = analyzeCompetition([], ''); // Placeholder, se inyecta desde API

  // Ponderación: 40% base + 35% negocio + 25% competencia
  const finalScore = Math.round(
    baseScore * 0.40 +
    biz.score * 0.35 +
    historicalPattern.winRateEstimate * 0.25
  );

  const allReasons = [...biz.reasons, ...historicalPattern.reasons];

  let recommendation: 'POSTULAR' | 'EVALUAR' | 'EVITAR';
  if (finalScore >= 75 && biz.score >= 60 && historicalPattern.winRateEstimate >= 50) {
    recommendation = 'POSTULAR';
    allReasons.push('✅ RECOMENDACIÓN: Postular. Alta probabilidad de éxito.');
  } else if (finalScore >= 50 && biz.score >= 40) {
    recommendation = 'EVALUAR';
    allReasons.push('⚠️ RECOMENDACIÓN: Evaluar con cuidado. Revisar pliegos y competencia.');
  } else {
    recommendation = 'EVITAR';
    allReasons.push('❌ RECOMENDACIÓN: Evitar. Baja probabilidad o monto insuficiente.');
  }

  return {
    baseScore,
    businessScore: biz.score,
    competitionScore: historicalPattern.winRateEstimate,
    finalScore,
    recommendation,
    reasons: allReasons
  };
}

function fmtAmount(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)} mil millones`;
  if (n >= 1_000_000) return `$${Math.round(n / 1_000_000)} millones`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)} mil`;
  return `$${n}`;
}
