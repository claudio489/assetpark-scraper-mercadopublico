// ==========================================
// EXTRACTOR PDF — Descarga y extrae texto
// ==========================================

import * as https from 'https';
import * as fs from 'fs';
import * as path from 'path';

export interface PdfExtractResult {
  url: string;
  text: string;
  pages: number;
  success: boolean;
  error?: string;
}

function downloadFile(url: string, destPath: string, timeoutMs = 30000): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    https.get(url, { headers: { 'User-Agent': 'AssetPark-Scraper/1.0' }, timeout: timeoutMs }, (res) => {
      if (res.statusCode !== 200) { reject(new Error(`HTTP ${res.statusCode}`)); return; }
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    }).on('error', (e) => { fs.unlink(destPath, () => {}); reject(e); });
  });
}

/**
 * Extrae texto de PDF (sin pdf-parse, sin deps externas pesadas)
 * Usa heurística simple para extraer texto de PDF stream
 */
export async function extractPdfText(pdfUrl: string): Promise<PdfExtractResult> {
  try {
    // Descargar a temp
    const tmpFile = `/tmp/pdf_${Date.now()}.pdf`;
    await downloadFile(pdfUrl, tmpFile);
    
    const buffer = fs.readFileSync(tmpFile);
    const content = buffer.toString('utf-8', 0, Math.min(buffer.length, 500 * 1024)); // primeros 500KB
    
    // Extraer texto de objetos stream / BT ... ET
    let text = '';
    const textRegex = /\(([^)]{3,200})\)/g; // cadenas entre paréntesis
    let match;
    while ((match = textRegex.exec(content)) !== null) {
      text += match[1] + ' ';
    }
    
    // Si no hay texto extraído, intentar con streams
    if (text.length < 100) {
      const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
      while ((match = streamRegex.exec(content)) !== null) {
        const stream = match[1];
        const subMatch = stream.match(/\(([^)]{3,200})\)/g);
        if (subMatch) {
          subMatch.forEach(m => {
            const inner = m.slice(1, -1);
            if (inner.length > 3) text += inner + ' ';
          });
        }
      }
    }
    
    // Limpiar
    text = text
      .replace(/\\n/g, ' ')
      .replace(/\\r/g, ' ')
      .replace(/\\t/g, ' ')
      .replace(/\\\(/g, '(')
      .replace(/\\\)/g, ')')
      .replace(/\s+/g, ' ')
      .trim();
    
    fs.unlinkSync(tmpFile);
    
    return { url: pdfUrl, text, pages: Math.max(1, Math.round(text.length / 3000)), success: true };
  } catch (err) {
    return { url: pdfUrl, text: '', pages: 0, success: false, error: (err as Error).message };
  }
}
