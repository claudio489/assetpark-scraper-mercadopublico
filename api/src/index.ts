// ==========================================
// API - Backend proxy para AssetPark Scraper
// Scrapea MercadoPublico.cl y devuelve datos enriquecidos
// ==========================================

import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;
const TICKET = process.env.MP_TICKET || '8BBCAB7E-0911-4E40-BD68-C56A0A33FF78';
const MP_API = 'https://api.mercadopublico.cl/servicios/v1/publico';

// ==========================================
// PROFILES
// ==========================================
const PROFILES = [
  { id: 'buceo', name: 'Importación Equipo de Buceo', keywords: ['buceo','submarino','subacuatico','equipo de buceo'] },
  { id: 'constructora', name: 'Constructora / Obras Civiles', keywords: ['construccion','obra','infraestructura','edificacion','puente','pavimentacion'] },
  { id: 'tecnologia', name: 'Tecnología / Software / TI', keywords: ['software','tecnologia','sistema','desarrollo','programacion','ciberseguridad'] },
  { id: 'salud', name: 'Salud / Insumos Médicos', keywords: ['salud','hospital','insumos medicos','medicamentos','equipamiento medico'] },
  { id: 'general', name: 'Perfil General', keywords: [] },
  { id: 'imprenta', name: 'Imprenta / Gráfica / Publicidad', keywords: ['imprenta','impresion','pvc','banner','gigantografia','letrero','autoadhesivo','troquelado','offset','digital'] }
];

// ==========================================
// UTILS - HTTP con timeout
// ==========================================
function httpGet(url: string, timeoutMs = 20000): Promise<any> {
  return new Promise((resolve, reject) => {
    const https = require('https');
    const req = https.get(url, { headers: { 'User-Agent': 'AssetPark-Scraper/1.0' } }, (res: any) => {
      let data = '';
      res.on('data', (chunk: any) => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { reject(new Error('JSON invalido')); }
      });
    });
    req.on('error', (e: any) => reject(e));
    req.setTimeout(timeoutMs, () => { req.destroy(); reject(new Error('Timeout HTTP')); });
  });
}

function parseRegion(regionRaw: string | undefined): string {
  if (!regionRaw) return 'No especificada';
  return regionRaw.replace(/^Region\s*/i, '').replace(/^del?\s*/i, '').replace(/^de\s*/i, '').trim();
}

function fmtAmount(amount: number): string {
  if (!amount || amount <= 0) return 'No disp.';
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(amount);
}

// ==========================================
// SCRAPER - Lista básica de MercadoPublico
// ==========================================
async function scrapeMercadoPublico(profileKeywords: string[], limit = 20): Promise<any[]> {
  try {
    const url = `${MP_API}/licitaciones.json?estado=activas&ticket=${TICKET}`;
    const data = await httpGet(url, 20000);
    
    if (!data.Listado || !Array.isArray(data.Listado) || data.Listado.length === 0) {
      console.log('[Scraper] API vacia');
      return [];
    }
    
    let list = data.Listado;
    
    // Filtrar por keywords
    if (profileKeywords.length > 0) {
      const kw = profileKeywords.map(k => k.toLowerCase());
      list = list.filter((lic: any) => {
        const text = `${lic.Nombre || ''} ${lic.Descripcion || ''}`.toLowerCase();
        return kw.some(w => text.includes(w));
      });
    }
    
    return list.slice(0, limit).map((lic: any) => {
      const comprador = lic.Comprador || {};
      const fechas = lic.Fechas || {};
      return {
        id: lic.CodigoExterno || '',
        title: lic.Nombre || '',
        description: lic.Nombre || '',
        entity: comprador.NombreOrganismo || comprador.NombreUnidad || 'Organismo no especificado',
        region: parseRegion(comprador.RegionUnidad),
        amount: typeof lic.MontoEstimado === 'number' ? lic.MontoEstimado : 0,
        date: (fechas.FechaPublicacion || '').split('T')[0],
        closingDate: (fechas.FechaCierre || lic.FechaCierre || '').split('T')[0],
        status: lic.Estado || 'Publicada',
        category: lic.Tipo || 'General',
        url: `https://www.mercadopublico.cl/BuscarLicitacion/Home/Licitacion/${encodeURIComponent(lic.CodigoExterno || '')}`,
        source: 'MercadoPublico'
      };
    });
  } catch (err) {
    console.log('[Scraper] Error:', (err as Error).message);
    return [];
  }
}

// ==========================================
// SCORING
// ==========================================
function calculateScore(title: string, description: string, keywords: string[]) {
  const text = (title + ' ' + description).toLowerCase();
  const matched: string[] = [];
  let score = 0;
  for (const k of keywords) {
    if (text.includes(k.toLowerCase())) {
      matched.push(k);
      score += 3;
    }
  }
  score = Math.min(100, score);
  const priority = score >= 80 ? 'alta' : score >= 60 ? 'media' : 'baja';
  return { score, priority, matchedKeywords: matched, matchScore: score };
}

// ==========================================
// PORTFOLIO (in-memory)
// ==========================================
const portfolio = new Map<string, any>();
const PORTFOLIO_CATEGORIES = ['Construcción', 'Montaje', 'Mantención', 'Suministro EPP', 'Software a la medida'];

function scoreToPriority(score: number): string {
  if (score >= 80) return 'alta';
  if (score >= 60) return 'media';
  return 'baja';
}

// ==========================================
// ENDPOINTS
// ==========================================

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'assetpark-scraper', version: '3.1.0' });
});

app.get('/api/health/external', async (_req: Request, res: Response) => {
  try {
    const data = await httpGet(`${MP_API}/licitaciones.json?estado=activas&ticket=${TICKET}`, 10000);
    const count = data.Listado?.length || 0;
    res.json({ success: true, mercadoPublico: true, count, message: `Conectado - ${count} activas` });
  } catch (err) {
    res.json({ success: false, mercadoPublico: false, message: (err as Error).message });
  }
});

app.get('/api/profiles', (_req: Request, res: Response) => {
  res.json({ success: true, profiles: PROFILES });
});

app.get('/api/profile/:id', (req: Request, res: Response) => {
  const p = PROFILES.find(x => x.id === req.params.id);
  if (!p) { res.status(404).json({ error: 'No encontrado' }); return; }
  res.json({ success: true, profile: p });
});

// ---- PIPELINE ----

let lastResult: any = null;

app.post('/api/opportunities/run', async (req: Request, res: Response) => {
  const { profileId = 'general', limit = 20 } = req.body || {};
  const profile = PROFILES.find(p => p.id === profileId) || PROFILES[4];
  
  console.log(`[API] Pipeline iniciado - perfil: ${profile.id}`);
  
  try {
    // Timeout global de 30 segundos
    const pipelinePromise = scrapeMercadoPublico(profile.keywords, limit);
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Pipeline timeout')), 30000);
    });
    
    const raw = await Promise.race([pipelinePromise, timeoutPromise]);
    
    // Scoring
    const opportunities = raw.map((op: any) => {
      const sc = calculateScore(op.title, op.description, profile.keywords);
      return { ...op, score: sc.score || 50, priority: sc.priority, matchScore: sc.matchScore, matchedKeywords: sc.matchedKeywords };
    });
    
    const stats = {
      total: opportunities.length,
      alta: opportunities.filter((o: any) => o.priority === 'alta').length,
      media: opportunities.filter((o: any) => o.priority === 'media').length,
      baja: opportunities.filter((o: any) => o.priority === 'baja').length,
      averageScore: opportunities.length > 0 ? Math.round(opportunities.reduce((s: number, o: any) => s + o.score, 0) / opportunities.length) : 0
    };
    
    lastResult = { profileId, runAt: new Date().toISOString(), stats, opportunities };
    
    res.json({ success: true, profileId: profile.id, profileName: profile.name, ...stats, opportunities });
    console.log(`[API] Pipeline OK - ${opportunities.length} oportunidades`);
    
  } catch (error) {
    console.error('[API] Pipeline error:', (error as Error).message);
    // Devolver resultado vacio para que el frontend no se quede colgado
    res.json({
      success: true,
      profileId: profile.id,
      profileName: profile.name,
      total: 0, alta: 0, media: 0, baja: 0, averageScore: 0,
      opportunities: [],
      warning: `Error: ${(error as Error).message}. MercadoPublico puede estar bloqueando requests desde cloud.`
    });
  }
});

app.get('/api/opportunities', (_req: Request, res: Response) => {
  if (!lastResult) {
    res.json({ success: true, count: 0, opportunities: [], warning: 'Ejecute POST /api/opportunities/run primero' });
    return;
  }
  res.json({ success: true, count: lastResult.opportunities.length, profileId: lastResult.profileId, opportunities: lastResult.opportunities });
});

app.get('/api/opportunities/stats', (_req: Request, res: Response) => {
  if (!lastResult) {
    res.json({ success: true, stats: { total: 0, alta: 0, media: 0, baja: 0, averageScore: 0 } });
    return;
  }
  res.json({ success: true, stats: lastResult.stats });
});

// ---- PORTFOLIO ----

app.get('/api/portfolio', (req: Request, res: Response) => {
  const { category, profileId } = req.query;
  let items = Array.from(portfolio.values()).sort((a: any, b: any) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
  if (category && typeof category === 'string') items = items.filter((i: any) => i.category === category);
  if (profileId && typeof profileId === 'string') items = items.filter((i: any) => i.profileId === profileId);
  res.json({ success: true, count: items.length, categories: PORTFOLIO_CATEGORIES, items });
});

app.get('/api/portfolio/stats', (_req: Request, res: Response) => {
  const items = Array.from(portfolio.values());
  const byCategory: Record<string, number> = {};
  const byPriority: Record<string, number> = {};
  for (const item of items) {
    byCategory[item.category] = (byCategory[item.category] || 0) + 1;
    byPriority[item.priority] = (byPriority[item.priority] || 0) + 1;
  }
  res.json({ success: true, total: items.length, byCategory, byPriority, averageScore: items.length > 0 ? Math.round(items.reduce((s: number, i: any) => s + i.score, 0) / items.length) : 0 });
});

app.post('/api/portfolio', (req: Request, res: Response) => {
  const { opportunity, category, notes, profileId, profileName } = req.body || {};
  if (!opportunity || !opportunity.id) { res.status(400).json({ error: 'Falta opportunity.id' }); return; }
  const validCat = PORTFOLIO_CATEGORIES.includes(category) ? category : 'Sin categoría';
  const item = {
    id: `${opportunity.id}-${Date.now()}`,
    opportunityId: opportunity.id,
    title: opportunity.title || '',
    entity: opportunity.entity || '',
    region: opportunity.region || '',
    amount: opportunity.amount || 0,
    url: opportunity.url || '',
    date: opportunity.date || '',
    status: opportunity.status || '',
    category: validCat,
    description: opportunity.description || '',
    score: opportunity.score || 50,
    priority: scoreToPriority(opportunity.score || 50),
    matchedKeywords: opportunity.matchedKeywords || [],
    matchScore: opportunity.matchScore || 0,
    source: opportunity.source || '',
    savedAt: new Date().toISOString(),
    notes: notes || '',
    profileId: profileId || '',
    profileName: profileName || ''
  };
  portfolio.set(item.id, item);
  res.json({ success: true, item });
});

app.put('/api/portfolio/:id/score', (req: Request, res: Response) => {
  const item = portfolio.get(req.params.id);
  if (!item) { res.status(404).json({ error: 'No encontrado' }); return; }
  const ns = typeof req.body.score === 'number' ? Math.max(0, Math.min(100, req.body.score)) : item.score;
  const updated = { ...item, score: ns, priority: scoreToPriority(ns) };
  portfolio.set(req.params.id, updated);
  res.json({ success: true, item: updated });
});

app.put('/api/portfolio/:id/category', (req: Request, res: Response) => {
  const item = portfolio.get(req.params.id);
  if (!item) { res.status(404).json({ error: 'No encontrado' }); return; }
  const validCat = PORTFOLIO_CATEGORIES.includes(req.body.category) ? req.body.category : item.category;
  const updated = { ...item, category: validCat };
  portfolio.set(req.params.id, updated);
  res.json({ success: true, item: updated });
});

app.put('/api/portfolio/:id/profile', (req: Request, res: Response) => {
  const item = portfolio.get(req.params.id);
  if (!item) { res.status(404).json({ error: 'No encontrado' }); return; }
  const updated = { ...item, profileId: req.body.profileId || item.profileId, profileName: req.body.profileName || item.profileName };
  portfolio.set(req.params.id, updated);
  res.json({ success: true, item: updated });
});

app.delete('/api/portfolio/:id', (req: Request, res: Response) => {
  if (!portfolio.has(req.params.id)) { res.status(404).json({ error: 'No encontrado' }); return; }
  portfolio.delete(req.params.id);
  res.json({ success: true, message: 'Eliminado' });
});

// ==========================================
// STATIC
// ==========================================
app.use(express.static(path.join(__dirname, '../../frontend')));
app.get('*', (_req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '../../frontend/index.html'));
});

// ==========================================
// START
// ==========================================
app.listen(PORT, () => {
  console.log(`🚀 AssetPark API en puerto ${PORT}`);
  console.log(`📋 /api/health | /api/health/external | /api/profiles | /api/opportunities/run | /api/portfolio/*`);
});
