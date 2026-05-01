import { RawOpportunity } from '../types';
/**
 * Scrapea licitaciones activas de MercadoPublico.cl
 * Hace detalle por cada una para obtener fecha, region, organismo completos
 */
export declare function scrapeOpportunities(options?: {
    sources?: string[];
    limit?: number;
    profileKeywords?: string[];
}): Promise<RawOpportunity[]>;
export declare function registerSource(_name: string, _fetcher: () => Promise<RawOpportunity[]>): void;
