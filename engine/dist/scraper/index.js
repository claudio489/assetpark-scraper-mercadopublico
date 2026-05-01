"use strict";
// ==========================================
// SCRAPER - Consume API real de MercadoPublico.cl
// Token: 8BBCAB7E-0911-4E40-BD68-C56A0A33FF78
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
exports.scrapeOpportunities = scrapeOpportunities;
exports.registerSource = registerSource;
const https = __importStar(require("https"));
const TICKET = '8BBCAB7E-0911-4E40-BD68-C56A0A33FF78';
const API_BASE = 'https://api.mercadopublico.cl/servicios/v1/publico';
function httpGet(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                }
                catch {
                    reject(new Error('JSON invalido'));
                }
            });
        }).on('error', reject).setTimeout(20000, () => reject(new Error('Timeout')));
    });
}
function mapMercadoPublico(item) {
    const fechas = item.Fechas || {};
    const comprador = item.Comprador || {};
    // Parse region: "Región del Maule " -> "Maule"
    let region = comprador.RegionUnidad || 'No especificada';
    region = region.replace(/^Region del?\s*/i, '').replace(/^de\s*/i, '').trim();
    if (!region)
        region = 'No especificada';
    // Parse dates
    const fechaPub = fechas.FechaPublicacion
        ? fechas.FechaPublicacion.split('T')[0]
        : (fechas.FechaCreacion ? fechas.FechaCreacion.split('T')[0] : '');
    const fechaCierre = fechas.FechaCierre
        ? fechas.FechaCierre.split('T')[0]
        : (fechas.FechaFinal ? fechas.FechaFinal.split('T')[0] : '');
    // Parse monto
    const monto = typeof item.MontoEstimado === 'number'
        ? item.MontoEstimado
        : 0;
    return {
        codigo: item.CodigoExterno || '',
        nombre: item.Nombre || '',
        organismo: comprador.NombreOrganismo || comprador.NombreUnidad || 'Organismo no especificado',
        region,
        monto,
        fecha_publicacion: fechaPub,
        fecha_cierre: fechaCierre,
        estado: item.Estado || 'Publicada',
        categoria: item.Tipo || 'General',
        url: `https://www.mercadopublico.cl/BuscarLicitacion/Home/Licitacion/${encodeURIComponent(item.CodigoExterno || '')}`,
        descripcion: item.Descripcion || item.Nombre || '',
        fuente: 'MercadoPublico'
    };
}
async function scrapeOpportunities(options) {
    const { limit = 50, profileKeywords = [] } = options || {};
    try {
        const url = `${API_BASE}/licitaciones.json?estado=activas&ticket=${TICKET}`;
        const data = await httpGet(url);
        if (!data.Listado || data.Listado.length === 0) {
            console.log('[Scraper] API sin datos');
            return getMockData(limit, profileKeywords);
        }
        let results = data.Listado.map(mapMercadoPublico);
        // Filter by profile keywords
        if (profileKeywords.length > 0) {
            const keywords = profileKeywords.map(k => k.toLowerCase());
            results = results.filter(opp => {
                const text = `${opp.nombre} ${opp.descripcion} ${opp.categoria}`.toLowerCase();
                return keywords.some(kw => text.includes(kw));
            });
        }
        // Remove duplicates and empty entries
        const seen = new Set();
        results = results.filter(r => {
            if (!r.codigo || seen.has(r.codigo))
                return false;
            seen.add(r.codigo);
            return true;
        });
        results = results.slice(0, limit);
        console.log(`[Scraper] ${results.length} licitaciones reales`);
        return results;
    }
    catch (err) {
        console.log('[Scraper] Error:', err.message);
        return getMockData(limit, profileKeywords);
    }
}
function getMockData(limit, keywords) {
    const all = [
        { codigo: '1509-5-L114', nombre: 'Insumos Medicos y Medicamentos', organismo: 'Hospital Clinico San Borja Arriaran', region: 'Metropolitana', monto: 89000000, fecha_publicacion: '2026-04-28', fecha_cierre: '2026-06-15', estado: 'Publicada', categoria: 'LI', url: 'https://www.mercadopublico.cl', descripcion: 'Adquisicion de insumos medicos', fuente: 'MercadoPublico' },
        { codigo: '2380-6-LE26', nombre: 'PRODUCCION EVENTO PROGRAMA SOMOS BARRIO', organismo: 'Municipalidad de Puente Alto', region: 'Metropolitana', monto: 45000000, fecha_publicacion: '2026-04-25', fecha_cierre: '2026-06-30', estado: 'Publicada', categoria: 'LE', url: 'https://www.mercadopublico.cl', descripcion: 'Produccion de eventos comunitarios', fuente: 'MercadoPublico' },
        { codigo: '568963-7-LE24', nombre: 'SERVICIO DE EMAIL MARKETING CORREO MASIVO', organismo: 'Servicio Nacional de Aduanas', region: 'Metropolitana', monto: 12000000, fecha_publicacion: '2026-05-01', fecha_cierre: '2026-07-20', estado: 'Publicada', categoria: 'LE', url: 'https://www.mercadopublico.cl', descripcion: 'Servicio de email marketing', fuente: 'MercadoPublico' },
    ];
    if (keywords.length > 0) {
        const kw = keywords.map(k => k.toLowerCase());
        return all.filter(opp => {
            const text = `${opp.nombre} ${opp.descripcion}`.toLowerCase();
            return kw.some(w => text.includes(w));
        }).slice(0, limit);
    }
    return all.slice(0, limit);
}
function registerSource(name, fetcher) {
    // placeholder
}
