import { RawOpportunity } from '../types';
/**
 * Datos simulados de licitaciones reales (formato MercadoPublico.cl)
 * En producción, esto se reemplaza por fetch real a la API del estado
 */
declare const MOCK_DATABASE: RawOpportunity[];
/**
 * Simula la extracción de datos desde una fuente externa
 * En producción, esto haría fetch() a la API real de MercadoPublico
 */
export declare function scrapeOpportunities(options?: {
    sources?: string[];
    limit?: number;
}): Promise<RawOpportunity[]>;
/**
 * Permite agregar fuentes adicionales en runtime
 */
export declare function registerSource(name: string, fetcher: () => Promise<RawOpportunity[]>): void;
export { MOCK_DATABASE };
