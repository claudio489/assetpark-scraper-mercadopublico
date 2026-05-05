"use strict";
// ==========================================
// EXTRACTOR DETALLE — Scrapea ficha HTML de licitación
// ==========================================
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractDetalleLicitacion = extractDetalleLicitacion;
const https = __importStar(require("https"));
function httpGet(url, timeoutMs = 15000) {
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
async function extractDetalleLicitacion(url) {
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
        const pdfs = [];
        let m;
        while ((m = pdfRegex.exec(html)) !== null) {
            let pdfUrl = m[1];
            if (pdfUrl.startsWith('/'))
                pdfUrl = `https://www.mercadopublico.cl${pdfUrl}`;
            if (!pdfUrl.startsWith('http'))
                pdfUrl = `https://www.mercadopublico.cl/${pdfUrl}`;
            if (!pdfs.includes(pdfUrl))
                pdfs.push(pdfUrl);
        }
        return { id, title, entity, region, closingDate, amount, status: '', category: '', description: title, pdfs, rawHtml: html.substring(0, 5000) };
    }
    catch (err) {
        console.error('[Extractor] Error:', err.message);
        return null;
    }
}
