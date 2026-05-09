// ==========================================
// EXTRACTOR DETALLE — Scrapea ficha HTML de licitación
// ==========================================

import * as https from 'https';

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

function httpGet(url: string, timeoutMs = 15000): Promise<string> {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': 'AssetPark-Scraper/1.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.setTimeout(timeoutMs, () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

/**
 * Extrae detalle de una ficha de licitación en MercadoPublico.cl
 */
export async function extractDetalleLicitacion(url: string): Promise<DetalleLicitacion | null> {
  try {
    const html = await httpGet(url, 15000);
    
    // Extraer título
    const titleMatch = html.match(/<title>(.*?)<\/title>/i) || html.match(/Nombre\s*:\s*<\/td>\s*<td[^>]*>(.*?)<\/td>/is) || html.match(/class="[^"]*titulo[^"]*"[^>]*>(.*?)<\/h/is);
    const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : '';
    
    // Extraer entidad
    const entityMatch = html.match(/Organismo\s*:\s*<\/td>\s*<td[^>]*>(.*?)<\/td>/is) || html.match(/NombreOrganismo[^>]*>(.*?)<\/span>/i);
    const entity = entityMatch ? entityMatch[1].replace(/<[^>]+>/g, '').trim() : '';
    
    // Extraer región
    const regionMatch = html.match(/Regi[oó]n\s*:\s*<\/td>\s*<td[^>]*>(.*?)<\/td>/is) || html.match(/RegionUnidad[^>]*>(.*?)<\/span>/i);
    const region = regionMatch ? regionMatch[1].replace(/<[^>]+>/g, '').trim() : '';
    
    // Extraer fecha cierre
    const dateMatch = html.match(/Cierre\s*:\s*<\/td>\s*<td[^>]*>(.*?)<\/td>/is) || html.match(/FechaCierre[^>]*>(.*?)<\/span>/i);
    const closingDate = dateMatch ? dateMatch[1].replace(/<[^>]+>/g, '').trim() : '';
    
    // Extraer monto
    const amountMatch = html.match(/Monto\s*:\s*<\/td>\s*<td[^>]*>.*?([\d.]+)/is) || html.match(/MontoEstimado[^>]*>([\d.]+)/);
    const amount = amountMatch ? parseInt(amountMatch[1].replace(/\./g, ''), 10) : 0;
    
    // Extraer código
    const codeMatch = html.match(/C[oó]digo\s*:\s*<\/td>\s*<td[^>]*>(.*?)<\/td>/is) || html.match(/CodigoExterno[^>]*>(.*?)<\/span>/i);
    const id = codeMatch ? codeMatch[1].replace(/<[^>]+>/g, '').trim() : '';
    
    // Extraer PDFs
    const pdfRegex = /href="([^"]*\.(?:pdf|PDF))"/g;
    const pdfs: string[] = [];
    let m;
    while ((m = pdfRegex.exec(html)) !== null) {
      let pdfUrl = m[1];
      if (pdfUrl.startsWith('/')) pdfUrl = `https://www.mercadopublico.cl${pdfUrl}`;
      if (!pdfUrl.startsWith('http')) pdfUrl = `https://www.mercadopublico.cl/${pdfUrl}`;
      if (!pdfs.includes(pdfUrl)) pdfs.push(pdfUrl);
    }
    
    return { id, title, entity, region, closingDate, amount, status: '', category: '', description: title, pdfs, rawHtml: html.substring(0, 5000) };
  } catch (err) {
    console.error('[Extractor] Error:', (err as Error).message);
    return null;
  }
}
