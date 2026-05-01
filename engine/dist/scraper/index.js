"use strict";
// ==========================================
// SCRAPER - Consume API real de MercadoPublico.cl
// Hace detalle por licitacion para traer fecha, region, organismo
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
function httpGet(url, timeoutMs = 10000) {
    return new Promise((resolve, reject) => {
        const req = https.get(url, (res) => {
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
        });
        req.on('error', reject);
        req.setTimeout(timeoutMs, () => {
            req.destroy();
            reject(new Error('Timeout'));
        });
    });
}
/**
 * Obtiene el DETALLE completo de una licitacion (con fechas, region, organismo)
 */
async function getLicitacionDetalle(codigo) {
    try {
        const url = `${API_BASE}/licitaciones.json?codigo=${encodeURIComponent(codigo)}&ticket=${TICKET}`;
        const data = await httpGet(url);
        if (data.Listado && data.Listado.length > 0) {
            return data.Listado[0];
        }
        return null;
    }
    catch {
        return null;
    }
}
function parseRegion(regionRaw) {
    if (!regionRaw)
        return 'No especificada';
    return regionRaw
        .replace(/^Region del?\s*/i, '')
        .replace(/^de\s*/i, '')
        .replace(/^Region de los\s*/i, '')
        .replace(/^Region de la\s*/i, '')
        .replace(/^Region de\s*/i, '')
        .replace(/^Region\s*/i, '')
        .trim();
}
function mapToOpportunity(lic) {
    const fechas = lic.Fechas || {};
    const comprador = lic.Comprador || {};
    const fechaPub = fechas.FechaPublicacion
        ? fechas.FechaPublicacion.split('T')[0]
        : (fechas.FechaCreacion ? fechas.FechaCreacion.split('T')[0] : '');
    const fechaCierre = fechas.FechaCierre
        ? fechas.FechaCierre.split('T')[0]
        : '';
    const region = parseRegion(comprador.RegionUnidad);
    const organismo = comprador.NombreOrganismo || comprador.NombreUnidad || 'Organismo no especificado';
    // Monto: la API no lo expone para licitaciones en curso (VisibilidadMonto=0)
    // Solo se revela despues de adjudicacion
    const monto = typeof lic.MontoEstimado === 'number' ? lic.MontoEstimado : 0;
    return {
        codigo: lic.CodigoExterno || '',
        nombre: lic.Nombre || '',
        organismo,
        region,
        monto,
        fecha_publicacion: fechaPub,
        fecha_cierre: fechaCierre,
        estado: lic.Estado || 'Publicada',
        categoria: lic.Tipo || 'General',
        url: `https://www.mercadopublico.cl/BuscarLicitacion/Home/Licitacion/${encodeURIComponent(lic.CodigoExterno || '')}`,
        descripcion: lic.Descripcion || lic.Nombre || '',
        fuente: 'MercadoPublico'
    };
}
/**
 * Scrapea licitaciones activas de MercadoPublico.cl
 * Hace detalle por cada una para obtener fecha, region, organismo completos
 */
async function scrapeOpportunities(options) {
    const { limit = 20, profileKeywords = [] } = options || {};
    try {
        // 1. Obtener listado basico
        const listUrl = `${API_BASE}/licitaciones.json?estado=activas&ticket=${TICKET}`;
        const listData = await httpGet(listUrl);
        if (!listData.Listado || listData.Listado.length === 0) {
            console.log('[Scraper] API sin datos, usando mock');
            return getMockData(limit, profileKeywords);
        }
        let basicList = listData.Listado;
        // 2. Filtrar por keywords si existen
        if (profileKeywords.length > 0) {
            const keywords = profileKeywords.map(k => k.toLowerCase());
            basicList = basicList.filter((lic) => {
                const text = `${lic.Nombre || ''}`.toLowerCase();
                return keywords.some(kw => text.includes(kw));
            });
            if (basicList.length === 0) {
                console.log(`[Scraper] Ninguna licitacion coincide con keywords: ${profileKeywords.join(', ')}`);
                console.log('[Scraper] Usando todas las licitaciones disponibles');
                basicList = listData.Listado;
            }
        }
        // 3. Limitar cantidad (detalle es lento)
        basicList = basicList.slice(0, limit);
        // 4. Obtener detalle de cada una
        console.log(`[Scraper] Obteniendo detalle de ${basicList.length} licitaciones...`);
        const results = [];
        for (const basic of basicList) {
            const detalle = await getLicitacionDetalle(basic.CodigoExterno);
            if (detalle) {
                results.push(mapToOpportunity(detalle));
            }
            else {
                // Si falla el detalle, usar datos basicos
                results.push({
                    codigo: basic.CodigoExterno || '',
                    nombre: basic.Nombre || '',
                    organismo: 'Organismo no especificado',
                    region: 'No especificada',
                    monto: 0,
                    fecha_publicacion: basic.FechaCierre ? '' : '',
                    fecha_cierre: basic.FechaCierre || '',
                    estado: basic.CodigoEstado === 5 ? 'Publicada' : 'Cerrada',
                    categoria: 'General',
                    url: `https://www.mercadopublico.cl/BuscarLicitacion/Home/Licitacion/${encodeURIComponent(basic.CodigoExterno || '')}`,
                    descripcion: basic.Nombre || '',
                    fuente: 'MercadoPublico'
                });
            }
        }
        // 5. Eliminar duplicados y vacios
        const seen = new Set();
        const unique = results.filter(r => {
            if (!r.codigo || seen.has(r.codigo))
                return false;
            seen.add(r.codigo);
            return true;
        });
        console.log(`[Scraper] ${unique.length} licitaciones con detalle completo`);
        // 6. Si filtramos por keywords y no hay resultados, advertir
        if (profileKeywords.length > 0) {
            const kw = profileKeywords.map(k => k.toLowerCase());
            const matched = unique.filter(opp => {
                const text = `${opp.nombre} ${opp.descripcion}`.toLowerCase();
                return kw.some(w => text.includes(w));
            });
            if (matched.length === 0) {
                console.log(`[ADVERTENCIA] MercadoPublico.cl no tiene licitaciones para: ${profileKeywords.join(', ')}`);
                console.log('[ADVERTENCIA] Mostrando todas las licitaciones activas disponibles');
            }
        }
        return unique;
    }
    catch (err) {
        console.log('[Scraper] Error:', err.message);
        return getMockData(limit, profileKeywords);
    }
}
function getMockData(limit, keywords) {
    const all = [
        { codigo: '1509-5-L114', nombre: 'Insumos Medicos y Medicamentos', organismo: 'Hospital Clinico San Borja Arriaran', region: 'Metropolitana', monto: 89000000, fecha_publicacion: '2026-04-28', fecha_cierre: '2026-06-15', estado: 'Publicada', categoria: 'LI', url: 'https://www.mercadopublico.cl', descripcion: 'Adquisicion de insumos medicos y medicamentos para hospital', fuente: 'MercadoPublico' },
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
function registerSource(_name, _fetcher) {
    // placeholder
}
