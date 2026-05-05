"use strict";
// ==========================================
// ORQUESTADOR — Ejecuta análisis completo de licitación
// ==========================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.runFullAnalysis = runFullAnalysis;
const mercadopublicoDetalle_1 = require("./mercadopublicoDetalle");
const pdfExtractor_1 = require("./pdfExtractor");
const analyzeLicitacion_1 = require("../analyzer/analyzeLicitacion");
/**
 * Ejecuta análisis completo de una licitación
 */
async function runFullAnalysis(url, profile) {
    // 1. Extraer detalle HTML
    const detalle = await (0, mercadopublicoDetalle_1.extractDetalleLicitacion)(url);
    if (!detalle) {
        console.error('[Orquestador] No se pudo extraer detalle de', url);
        return null;
    }
    // 2. Descargar y extraer PDFs
    const pdfTexts = [];
    for (const pdfUrl of detalle.pdfs.slice(0, 3)) { // máx 3 PDFs
        const result = await (0, pdfExtractor_1.extractPdfText)(pdfUrl);
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
    const analysis = (0, analyzeLicitacion_1.analyzeLicitacion)(analysisText, profile);
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
