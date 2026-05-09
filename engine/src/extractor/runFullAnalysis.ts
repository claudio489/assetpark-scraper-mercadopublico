// ==========================================
// ORQUESTADOR — Ejecuta análisis completo de licitación
// ==========================================

import { extractDetalleLicitacion } from './mercadopublicoDetalle';
import { extractPdfText } from './pdfExtractor';
import { analyzeLicitacion, AnalysisProfile } from '../analyzer/analyzeLicitacion';

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
  pdfTexts: { url: string; text: string; pages: number; success: boolean; error?: string }[];
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
export async function runFullAnalysis(url: string, profile: AnalysisProfile): Promise<FullAnalysisResult | null> {
  // 1. Extraer detalle HTML
  const detalle = await extractDetalleLicitacion(url);
  if (!detalle) {
    console.error('[Orquestador] No se pudo extraer detalle de', url);
    return null;
  }
  
  // 2. Descargar y extraer PDFs
  const pdfTexts = [];
  for (const pdfUrl of detalle.pdfs.slice(0, 3)) { // máx 3 PDFs
    const result = await extractPdfText(pdfUrl);
    pdfTexts.push(result);
  }
  
  // 3. Concatenar texto de todos los PDFs
  const fullText = pdfTexts
    .filter(p => p.success)
    .map(p => p.text)
    .join('\n\n');
  
  // Si no hay PDFs, usar el título/descripción como fallback
  const analysisText = fullText.length > 100 ? fullText : `${detalle.title} ${detalle.description}`;
  
  // 4. Analizar
  const analysis = analyzeLicitacion(analysisText, profile);
  
  return {
    id: detalle.id,
    title: detalle.title,
    entity: detalle.entity,
    region: detalle.region,
    closingDate: detalle.closingDate,
    amount: detalle.amount,
    status: detalle.status,
    category: detalle.category,
    description: detalle.description,
    url,
    pdfs: detalle.pdfs,
    pdfTexts,
    analysis
  };
}
