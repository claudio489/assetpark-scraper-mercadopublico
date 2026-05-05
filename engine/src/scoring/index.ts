// ==========================================
// SCORING - Motor de puntuación unificado
// ==========================================

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
export function scoreOpportunities(
  opportunities: NormalizedOpportunity[],
  profile: ClientProfile
): ScoredOpportunity[] {
  return opportunities.map(opp => scoreSingle(opp, profile));
}

export function scoreSingle(
  opportunity: NormalizedOpportunity,
  profile: ClientProfile
): ScoredOpportunity {
  const matchScore = calculateMatchScore(opportunity, profile);
  const aiScore = simulateAIScore(opportunity, profile);
  
  // score = aiScore || matchScore || 50
  const score = aiScore ?? matchScore ?? 50;
  const priority = scoreToPriority(score);
  const matchedKeywords = findMatchedKeywords(opportunity, profile);
  
  return {
    ...opportunity,
    score,
    priority,
    matchedKeywords,
    matchScore,
    aiScore: aiScore ?? undefined
  };
}

function calculateMatchScore(opp: NormalizedOpportunity, profile: ClientProfile): number {
  let score = 0;
  const text = `${opp.title} ${opp.description} ${opp.category}`.toLowerCase();
  
  // Match de keywords (0-40 puntos)
  const keywordMatches = profile.keywords.filter(kw => text.includes(kw.toLowerCase()));
  score += Math.min(40, keywordMatches.length * 10);
  
  // Match de rubros (0-25 puntos)
  const rubroMatches = profile.rubros.filter(r => text.includes(r.toLowerCase()));
  score += Math.min(25, rubroMatches.length * 12);
  
  // Match de región (0-20 puntos)
  if (profile.regions.length === 0 || profile.regions.includes('Todas')) {
    score += 20;
  } else {
    const regionMatch = profile.regions.some(r => 
      opp.region.toLowerCase().includes(r.toLowerCase())
    );
    if (regionMatch) score += 20;
  }
  
  // Match de monto (0-15 puntos)
  if (profile.minAmount !== undefined && opp.amount < profile.minAmount) {
    score -= 10;
  }
  if (profile.maxAmount !== undefined && opp.amount > profile.maxAmount) {
    score -= 10;
  }
  if ((profile.minAmount === undefined || opp.amount >= profile.minAmount) &&
      (profile.maxAmount === undefined || opp.amount <= profile.maxAmount)) {
    score += 15;
  }
  
  // Penalización por keywords excluidas (-20 puntos)
  if (profile.excludedKeywords) {
    const excludedMatch = profile.excludedKeywords.filter(ek => text.includes(ek.toLowerCase()));
    score -= excludedMatch.length * 20;
  }
  
  return clampScore(score);
}

/**
 * Simula scoring de IA (en producción: llamada a LLM/API de embeddings)
 * Retorna null si no hay servicio de IA configurado
 */
function simulateAIScore(opp: NormalizedOpportunity, profile: ClientProfile): number | null {
  // En un sistema real, aquí iría:
  // const embedding = await getEmbedding(opp.title + opp.description);
  // const profileEmbedding = await getEmbedding(profile.keywords.join(' '));
  // return cosineSimilarity(embedding, profileEmbedding) * 100;
  
  // Para esta implementación, simulamos un boost basado en coincidencias profundas
  const text = `${opp.title} ${opp.description}`.toLowerCase();
  const allTerms = [...profile.keywords, ...profile.rubros].map(t => t.toLowerCase());
  
  // Simulación: si hay muchas coincidencias, la "IA" detecta alta relevancia
  const deepMatches = allTerms.filter(t => text.includes(t)).length;
  if (deepMatches >= 4) return 85 + Math.floor(Math.random() * 10);
  if (deepMatches >= 2) return 65 + Math.floor(Math.random() * 15);
  
  // Cuando no hay servicio de IA real, retornamos null para que use matchScore
  return null;
}

function scoreToPriority(score: number): Priority {
  if (score >= 80) return 'alta';
  if (score >= 60) return 'media';
  return 'baja';
}

function findMatchedKeywords(opp: NormalizedOpportunity, profile: ClientProfile): string[] {
  const text = `${opp.title} ${opp.description} ${opp.category}`.toLowerCase();
  const allTerms = [...new Set([...profile.keywords, ...profile.rubros])];
  return allTerms.filter(t => text.includes(t.toLowerCase()));
}

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, score));
}

export { scoreToPriority, clampScore };
