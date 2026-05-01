export interface AnalysisResult {
    requisitos_clave: string[];
    riesgo: 'alto' | 'medio' | 'bajo';
    complejidad: 'alta' | 'media' | 'baja';
    recomendacion: 'postular' | 'evaluar' | 'descartar';
    justificacion: string;
}
export interface AnalysisProfile {
    keywords: string[];
    regiones: string[];
    excludedKeywords: string[];
}
/**
 * Analiza texto de bases de licitación
 */
export declare function analyzeLicitacion(text: string, profile: AnalysisProfile): AnalysisResult;
