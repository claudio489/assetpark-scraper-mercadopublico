"use strict";
// ==========================================
// EXTRACTOR PDF — Descarga y extrae texto
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
exports.extractPdfText = extractPdfText;
const https = __importStar(require("https"));
const fs = __importStar(require("fs"));
function downloadFile(url, destPath, timeoutMs = 30000) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(destPath);
        https.get(url, { headers: { 'User-Agent': 'AssetPark-Scraper/1.0' }, timeout: timeoutMs }, (res) => {
            if (res.statusCode !== 200) {
                reject(new Error(`HTTP ${res.statusCode}`));
                return;
            }
            res.pipe(file);
            file.on('finish', () => { file.close(); resolve(); });
        }).on('error', (e) => { fs.unlink(destPath, () => { }); reject(e); });
    });
}
/**
 * Extrae texto de PDF (sin pdf-parse, sin deps externas pesadas)
 * Usa heurística simple para extraer texto de PDF stream
 */
async function extractPdfText(pdfUrl) {
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
                        if (inner.length > 3)
                            text += inner + ' ';
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
    }
    catch (err) {
        return { url: pdfUrl, text: '', pages: 0, success: false, error: err.message };
    }
}
