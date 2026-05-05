import { RawOpportunity } from '../types';
/**
 * Test rapido de conexion
 */
export declare function testConnection(): Promise<{
    ok: boolean;
    message: string;
    count?: number;
}>;
/**
 * Scrapea licitaciones activas - Version OPTIMIZADA
 * Usa SOLO la lista basica (1 llamada HTTP). No hace detalle por item.
 */
export declare function scrapeOpportunities(options?: {
    sources?: string[];
    limit?: number;
    profileKeywords?: string[];
}): Promise<RawOpportunity[]>;
export declare function registerSource(_name: string, _fetcher: () => Promise<RawOpportunity[]>): void;
