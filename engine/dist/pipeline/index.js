"use strict";
// ==========================================
// PIPELINE - Orquestador del flujo completo
// scrape → normalize → score → output
// ==========================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.runPipeline = runPipeline;
exports.calculateStats = calculateStats;
const scraper_1 = require("../scraper");
const normalizer_1 = require("../normalizer");
const scoring_1 = require("../scoring");
/**
 * Ejecuta el pipeline completo:
 * scrape → normalize → score → output
 */
async function runPipeline(config) {
    const { profile, sources, limit } = config;
    // 1. SCRAPE (con keywords del perfil para filtrar)
    const raw = await (0, scraper_1.scrapeOpportunities)({ sources, limit, profileKeywords: profile.keywords });
    // 2. NORMALIZE
    const normalized = (0, normalizer_1.normalizeOpportunities)(raw);
    // 3. SCORE
    const scored = (0, scoring_1.scoreOpportunities)(normalized, profile);
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
function calculateStats(opportunities) {
    const total = opportunities.length;
    const alta = opportunities.filter(o => o.priority === 'alta').length;
    const media = opportunities.filter(o => o.priority === 'media').length;
    const baja = opportunities.filter(o => o.priority === 'baja').length;
    const averageScore = total > 0
        ? opportunities.reduce((sum, o) => sum + o.score, 0) / total
        : 0;
    const byRegion = {};
    const bySource = {};
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
