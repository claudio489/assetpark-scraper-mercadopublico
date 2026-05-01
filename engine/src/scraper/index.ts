// ==========================================
// SCRAPER - MercadoPublico.cl - Version optimizada
// Usa lista basica (1 llamada rapida) en vez de detalle por item (50 llamadas lentas)
// Token: 8BBCAB7E-0911-4E40-BD68-C56A0A33FF78
// ==========================================

import { RawOpportunity } from '../types';
import * as https from 'https';

const TICKET = '8BBCAB7E-0911-4E40-BD68-C56A0A33FF78';
const API_BASE = 'https://api.mercadopublico.cl/servicios/v1/publico';

function httpGet(url: string, timeoutMs = 20000): Promise<any> {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': 'AssetPark-Scraper/1.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { reject(new Error('JSON invalido: ' + (e as Error).message)); }
      });
    });
    req.on('error', reject);
    req.setTimeout(timeoutMs, () => { req.destroy(); reject(new Error('Timeout HTTP ' + timeoutMs + 'ms')); });
  });
}

function parseRegion(regionRaw: string | undefined): string {
  if (!regionRaw) return 'No especificada';
  return regionRaw
    .replace(/^Region del?\s*/i, '')
    .replace(/^de\s*/i, '')
    .replace(/^Region de los\s*/i, '')
    .replace(/^Region de la\s*/i, '')
    .replace(/^Region de\s*/i, '')
    .replace(/^Region\s*/i, '')
    .trim();
}

/**
 * Mapea un item de la lista basica de MercadoPublico a RawOpportunity
 * La lista basica ya incluye: CodigoExterno, Nombre, Estado, CodigoEstado, FechaCierre,
 * Comprador.NombreOrganismo, Comprador.RegionUnidad, etc.
 */
function mapListItemToOpportunity(lic: any): RawOpportunity {
  const comprador = lic.Comprador || {};
  const fechas = lic.Fechas || {};
  const fechaPub = fechas.FechaPublicacion ? fechas.FechaPublicacion.split('T')[0] : '';
  const fechaCierre = fechas.FechaCierre ? fechas.FechaCierre.split('T')[0] : (lic.FechaCierre || '');
  const region = parseRegion(comprador.RegionUnidad);
  const organismo = comprador.NombreOrganismo || comprador.NombreUnidad || 'Organismo no especificado';

  return {
    codigo: lic.CodigoExterno || '',
    nombre: lic.Nombre || '',
    organismo,
    region,
    monto: typeof lic.MontoEstimado === 'number' ? lic.MontoEstimado : 0,
    fecha_publicacion: fechaPub,
    fecha_cierre: fechaCierre,
    estado: lic.Estado || (lic.CodigoEstado === 5 ? 'Publicada' : 'Cerrada'),
    categoria: lic.Tipo || 'General',
    url: `https://www.mercadopublico.cl/Procurement/Modules/RFB/DetailsAcquisition.aspx?idlicitacion=${encodeURIComponent(lic.CodigoExterno || '')}`,
    descripcion: lic.Nombre || '',
    fuente: 'MercadoPublico'
  };
}

/**
 * Test rapido de conexion
 */
export async function testConnection(): Promise<{ ok: boolean; message: string; count?: number }> {
  try {
    const url = `${API_BASE}/licitaciones.json?estado=activas&ticket=${TICKET}`;
    const data = await httpGet(url, 8000);
    if (data.Listado && Array.isArray(data.Listado)) {
      return { ok: true, message: 'Conectado', count: data.Listado.length };
    }
    return { ok: false, message: 'API respondio sin datos' };
  } catch (err) {
    return { ok: false, message: (err as Error).message };
  }
}

/**
 * Scrapea licitaciones activas - Version OPTIMIZADA
 * Usa SOLO la lista basica (1 llamada HTTP). No hace detalle por item.
 */
export async function scrapeOpportunities(options?: { sources?: string[]; limit?: number; profileKeywords?: string[] }): Promise<RawOpportunity[]> {
  const { limit = 20, profileKeywords = [] } = options || {};

  console.log(`[Scraper] Iniciando - keywords: [${profileKeywords.join(', ')}]`);

  try {
    const listUrl = `${API_BASE}/licitaciones.json?estado=activas&ticket=${TICKET}`;
    console.log(`[Scraper] GET lista: ${listUrl.split('ticket=')[0]}...`);
    
    const listData = await httpGet(listUrl, 20000);

    if (!listData.Listado || !Array.isArray(listData.Listado) || listData.Listado.length === 0) {
      console.log('[Scraper] API sin datos en lista basica');
      return [];
    }

    console.log(`[Scraper] Lista basica: ${listData.Listado.length} licitaciones totales`);

    // Filtrar por keywords del perfil
    let filteredList = listData.Listado;
    if (profileKeywords.length > 0) {
      const keywords = profileKeywords.map(k => k.toLowerCase());
      filteredList = listData.Listado.filter((lic: any) => {
        const text = `${lic.Nombre || ''} ${lic.Descripcion || ''}`.toLowerCase();
        return keywords.some(kw => text.includes(kw));
      });
      console.log(`[Scraper] Filtradas por keywords: ${filteredList.length} de ${listData.Listado.length}`);
    }

    // Limitar
    const limited = filteredList.slice(0, limit);
    console.log(`[Scraper] Mapeando ${limited.length} licitaciones`);

    const results = limited.map(mapListItemToOpportunity);

    // Deduplicar por codigo
    const seen = new Set<string>();
    const unique = results.filter((r: RawOpportunity) => {
      if (!r.codigo || seen.has(r.codigo)) return false;
      seen.add(r.codigo);
      return true;
    });

    console.log(`[Scraper] Resultado final: ${unique.length} licitaciones`);
    return unique;

  } catch (err) {
    console.log(`[Scraper] Error: ${(err as Error).message}`);
    return [];
  }
}

export function registerSource(_name: string, _fetcher: () => Promise<RawOpportunity[]>): void {
  // placeholder
}
