export interface DetalleLicitacion {
    id: string;
    title: string;
    entity: string;
    region: string;
    closingDate: string;
    amount: number;
    status: string;
    category: string;
    description: string;
    pdfs: string[];
    rawHtml?: string;
}
/**
 * Extrae detalle de una ficha de licitación en MercadoPublico.cl
 */
export declare function extractDetalleLicitacion(url: string): Promise<DetalleLicitacion | null>;
