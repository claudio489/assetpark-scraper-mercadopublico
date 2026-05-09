// ==========================================
// PIPELINE - Orquestador del flujo completo
// scrape → normalize → score → output
// ==========================================

import { PipelineConfig, PipelineResult, ScoredOpportunity, Opportunity } from '../types';
import { scrapeOpportunities } from '../scraper';
import { normalizeOpportunities } from '../normalizer';
import { scoreOpportunities } from '../scoring';

/**
 * Ejecuta el pipeline completo:
 * scrape → normalize → score → output
 */
export async function runPipeline(config: PipelineConfig): Promise<PipelineResult> {
  const { profile, sources, limit } = config;
  
  // 1. SCRAPE (con keywords del perfil para filtrar)
  const raw = await scrapeOpportunities({ sources, limit, profileKeywords: profile.keywords });
  
  // 2. NORMALIZE
  const normalized = normalizeOpportunities(raw);
  
  // 3. SCORE
  let scored = scoreOpportunities(normalized, profile);
  
  // 3.5 FILTROS AVANZADOS (region + monto del perfil)
  if (profile.regions && profile.regions.length > 0) {
    const before = scored.length;
    scored = scored.filter(o => profile.regions!.some(r => o.region.toLowerCase().includes(r.toLowerCase())));
    console.log(`[PIPELINE] Filtro region: ${before} → ${scored.length} (${profile.regions.join(', ')})`);
  }
  if (profile.minAmount || profile.maxAmount) {
    const before = scored.length;
    const min = profile.minAmount || 0;
    const max = profile.maxAmount || Infinity;
    scored = scored.filter(o => o.amount >= min && o.amount <= max);
    console.log(`[PIPELINE] Filtro monto ${min}-${max}: ${before} → ${scored.length}`);
  }
  
  // 4. OUTPUT
  const opportunities = scored.sort((a, b) => b.score - a.score);
  
  const alta = opportunities.filter(o => o.priority === 'alta').length;
  const media = opportunities.filter(o => o.priority === 'media').length;
  const baja = opportunities.filter(o => o.priority === 'baja').length;
  const averageScore = opportunities.length > 0
    ? opportunities.reduce((sum, o) => sum + o.score, 0) / opportunities.length
    : 0;
  
  return {
    opportunities,
    total: opportunities.length,
    alta,
    media,
    baja,
    averageScore: Math.round(averageScore),
    runAt: new Date().toISOString(),
    profileId: profile.id
  };
}

/**
 * Calcula estadísticas desde el array de oportunidades
 * (NO depende de otra fuente de datos)
 */
export function calculateStats(opportunities: Opportunity[]) {
  const total = opportunities.length;
  const alta = opportunities.filter(o => o.priority === 'alta').length;
  const media = opportunities.filter(o => o.priority === 'media').length;
  const baja = opportunities.filter(o => o.priority === 'baja').length;
  
  const averageScore = total > 0
    ? opportunities.reduce((sum, o) => sum + o.score, 0) / total
    : 0;
  
  const byRegion: Record<string, number> = {};
  const bySource: Record<string, number> = {};
  
  for (const opp of opportunities) {
    byRegion[opp.region] = (byRegion[opp.region] || 0) + 1;
    bySource[opp.source] = (bySource[opp.source] || 0) + 1;
  }
  
  return {
    total,
    alta,
    media,
    baja,
    averageScore: Math.round(averageScore),
    byRegion,
    bySource
  };
}
