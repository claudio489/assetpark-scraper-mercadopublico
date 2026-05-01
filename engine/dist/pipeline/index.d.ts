import { PipelineConfig, PipelineResult, ScoredOpportunity } from '../types';
/**
 * Ejecuta el pipeline completo:
 * scrape → normalize → score → output
 */
export declare function runPipeline(config: PipelineConfig): Promise<PipelineResult>;
/**
 * Calcula estadísticas desde el array de oportunidades
 * (NO depende de otra fuente de datos)
 */
export declare function calculateStats(opportunities: ScoredOpportunity[]): {
    total: number;
    alta: number;
    media: number;
    baja: number;
    averageScore: number;
    byRegion: Record<string, number>;
    bySource: Record<string, number>;
};
