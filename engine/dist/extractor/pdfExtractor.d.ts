export interface PdfExtractResult {
    url: string;
    text: string;
    pages: number;
    success: boolean;
    error?: string;
}
/**
 * Extrae texto de PDF (sin pdf-parse, sin deps externas pesadas)
 * Usa heurística simple para extraer texto de PDF stream
 */
export declare function extractPdfText(pdfUrl: string): Promise<PdfExtractResult>;
