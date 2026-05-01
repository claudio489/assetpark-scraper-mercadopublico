import { AnalysisProfile } from '../analyzer/analyzeLicitacion';
export interface FullAnalysisResult {
    id: string;
    title: string;
    entity: string;
    region: string;
    closingDate: string;
    amount: number;
    status: string;
    category: string;
    description: string;
    url: string;
    pdfs: string[];
    pdfTexts: {
        url: string;
        text: string;
        pages: number;
        success: boolean;
        error?: string;
    }[];
    analysis: {
        requisitos_clave: string[];
        riesgo: string;
        complejidad: string;
        recomendacion: string;
        justificacion: string;
    };
}
/**
 * Ejecuta análisis completo de una licitación
 */
export declare function runFullAnalysis(url: string, profile: AnalysisProfile): Promise<FullAnalysisResult | null>;
