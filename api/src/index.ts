// ==========================================
// API REST - Licitaciones Intelligence
// Endpoints simples, sin auth, sin tRPC, sin sesiones
// ==========================================

import express, { Request, Response } from 'express';
import cors from 'cors';
import {
  runPipeline,
  calculateStats,
  getProfile,
  listProfiles,
  saveProfile,
  PipelineResult,
  PortfolioItem,
  PortfolioCategory,
  PORTFOLIO_CATEGORIES
} from '../../engine/dist';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({ origin: true, credentials: false }));
app.use(express.json());

// Servir frontend estático en producción
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('../frontend/dist'));
}

// Cache en memoria de la última ejecución
let lastRunResult: PipelineResult | null = null;
let activeProfileId = 'buceo';

// ==========================================
// ENDPOINTS
// ==========================================

/**
 * GET /api/opportunities
 * Retorna las licitaciones enriquecidas de la última ejecución
 * Query params: ?profileId=string&priority=alta|media|baja
 */
app.get('/api/opportunities', (req: Request, res: Response) => {
  const { profileId, priority } = req.query;
  
  const targetProfile = profileId
    ? getProfile(profileId as string)
    : getProfile(activeProfileId);
  
  if (!lastRunResult && !targetProfile) {
    res.status(400).json({ error: 'No hay datos. Ejecute POST /api/opportunities/run primero.' });
    return;
  }
  
  let opportunities = lastRunResult?.opportunities || [];
  
  // Si se solicita un profile diferente, regenerar
  if (targetProfile && (!lastRunResult || lastRunResult.profileId !== targetProfile.id)) {
    res.status(400).json({ error: 'Profile no ejecutado. Use POST /api/opportunities/run' });
    return;
  }
  
  if (priority && typeof priority === 'string') {
    opportunities = opportunities.filter(o => o.priority === priority);
  }
  
  res.json({
    success: true,
    count: opportunities.length,
    profileId: activeProfileId,
    opportunities
  });
});

/**
 * GET /api/opportunities/stats
 * Calcula estadísticas desde el array de oportunidades (misma fuente)
 */
app.get('/api/opportunities/stats', (req: Request, res: Response) => {
  if (!lastRunResult) {
    res.status(400).json({ error: 'No hay datos. Ejecute POST /api/opportunities/run primero.' });
    return;
  }
  
  const stats = calculateStats(lastRunResult.opportunities);
  
  res.json({
    success: true,
    profileId: lastRunResult.profileId,
    runAt: lastRunResult.runAt,
    stats
  });
});

/**
 * POST /api/opportunities/run
 * Ejecuta el pipeline completo: scrape → normalize → score
 * Body opcional: { profileId: string }
 */
app.post('/api/opportunities/run', async (req: Request, res: Response) => {
  const { profileId, limit } = req.body || {};
  
  const targetId = profileId || activeProfileId;
  const profile = getProfile(targetId);
  
  if (!profile) {
    res.status(404).json({
      error: `Profile '${targetId}' no encontrado`,
      availableProfiles: listProfiles().map(p => ({ id: p.id, name: p.name }))
    });
    return;
  }
  
  activeProfileId = targetId;
  
  try {
    // Timeout global: si el pipeline tarda mas de 12s, abortamos
    const TIMEOUT_MS = 12000;
    const pipelinePromise = runPipeline({
      profile,
      limit: limit || 50
    });
    
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Pipeline timeout')), TIMEOUT_MS);
    });
    
    const result = await Promise.race([pipelinePromise, timeoutPromise]);
    
    lastRunResult = result;
    
    res.json({
      success: true,
      profileId: profile.id,
      profileName: profile.name,
      runAt: result.runAt,
      summary: {
        total: result.total,
        alta: result.alta,
        media: result.media,
        baja: result.baja,
        averageScore: result.averageScore
      },
      opportunities: result.opportunities
    });
  } catch (error) {
    console.error('[API] Pipeline error:', error);
    // Si hay error, devolvemos mock data para que el usuario vea algo
    const mockResult = runPipeline({ profile, limit: 10 });
    // mockResult es Promise... pero en realidad el mock es sincrono
    // Mejor devolver error con data vacia o mock
    res.json({
      success: true,
      profileId: profile.id,
      profileName: profile.name,
      runAt: new Date().toISOString(),
      summary: { total: 0, alta: 0, media: 0, baja: 0, averageScore: 0 },
      opportunities: [],
      warning: 'Servicio de MercadoPublico no disponible. Intente mas tarde.'
    });
  }
});

/**
 * GET /api/profiles
 * Lista todos los perfiles disponibles
 */
app.get('/api/profiles', (_req: Request, res: Response) => {
  const profiles = listProfiles();
  res.json({
    success: true,
    count: profiles.length,
    profiles: profiles.map(p => ({
      id: p.id,
      name: p.name,
      rubros: p.rubros,
      keywords: p.keywords,
      regions: p.regions
    }))
  });
});

/**
 * POST /api/profiles
 * Crea o actualiza un perfil
 */
app.post('/api/profiles', (req: Request, res: Response) => {
  const profile = req.body;
  
  if (!profile.id || !profile.name) {
    res.status(400).json({ error: 'Se requiere id y name' });
    return;
  }
  
  const saved = saveProfile(profile);
  res.json({ success: true, profile: saved });
});

/**
 * Health check
 */
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'licitaciones-intelligence-api', version: '2.0.0' });
});

// Servir frontend estático siempre
app.use(express.static('../frontend'));
app.get('*', (_req, res) => {
  res.sendFile('index.html', { root: '../frontend' });
});

// ==========================================
// PORTFOLIO - Guardar licitaciones para postulación
// ==========================================

const portfolio = new Map<string, PortfolioItem>();

/**
 * GET /api/portfolio
 * Lista todas las licitaciones guardadas
 * Query: ?category=Construcción|Montaje|...&profileId=xxx para filtrar
 */
app.get('/api/portfolio', (req: Request, res: Response) => {
  const { category, profileId } = req.query;
  let items = Array.from(portfolio.values()).sort(
    (a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
  );
  
  if (category && typeof category === 'string') {
    items = items.filter(i => i.category === category);
  }
  
  if (profileId && typeof profileId === 'string') {
    items = items.filter(i => i.profileId === profileId);
  }
  
  res.json({
    success: true,
    count: items.length,
    categories: PORTFOLIO_CATEGORIES,
    items
  });
});

/**
 * GET /api/portfolio/stats
 * Estadísticas del portfolio por categoría
 */
app.get('/api/portfolio/stats', (_req: Request, res: Response) => {
  const items = Array.from(portfolio.values());
  const byCategory: Record<string, number> = {};
  const byPriority: Record<string, number> = {};
  
  for (const item of items) {
    byCategory[item.category] = (byCategory[item.category] || 0) + 1;
    byPriority[item.priority] = (byPriority[item.priority] || 0) + 1;
  }
  
  res.json({
    success: true,
    total: items.length,
    byCategory,
    byPriority,
    averageScore: items.length > 0
      ? Math.round(items.reduce((s, i) => s + i.score, 0) / items.length)
      : 0
  });
});

/**
 * POST /api/portfolio
 * Guarda una licitación en el portfolio
 * Body: { opportunity, category, notes?, profileId?, profileName? }
 */
app.post('/api/portfolio', (req: Request, res: Response) => {
  const { opportunity, category, notes, profileId, profileName } = req.body || {};
  
  if (!opportunity || !opportunity.id) {
    res.status(400).json({ error: 'Se requiere opportunity con id' });
    return;
  }
  
  const validCategory: PortfolioCategory = PORTFOLIO_CATEGORIES.includes(category)
    ? category
    : 'Sin categoría';
  
  const item: PortfolioItem = {
    id: `${opportunity.id}-${Date.now()}`,
    opportunityId: opportunity.id,
    title: opportunity.title || '',
    entity: opportunity.entity || '',
    region: opportunity.region || '',
    amount: opportunity.amount || 0,
    url: opportunity.url || '',
    date: opportunity.date || '',
    status: opportunity.status || '',
    category: validCategory,
    description: opportunity.description || '',
    score: opportunity.score || 50,
    priority: opportunity.priority || 'media',
    matchedKeywords: opportunity.matchedKeywords || [],
    matchScore: opportunity.matchScore || 0,
    aiScore: opportunity.aiScore,
    source: opportunity.source || '',
    savedAt: new Date().toISOString(),
    notes: notes || '',
    profileId: profileId || '',
    profileName: profileName || ''
  };
  
  portfolio.set(item.id, item);
  
  res.json({
    success: true,
    message: 'Licitación guardada en portfolio',
    item
  });
});

/**
 * PUT /api/portfolio/:id/score
 * Actualiza el puntaje de una licitación guardada
 * Body: { score: number }
 */
app.put('/api/portfolio/:id/score', (req: Request, res: Response) => {
  const { id } = req.params;
  const { score } = req.body || {};
  
  const item = portfolio.get(id);
  if (!item) {
    res.status(404).json({ error: 'Item no encontrado en portfolio' });
    return;
  }
  
  const newScore = typeof score === 'number' ? clampScore(score) : item.score;
  const newPriority = scoreToPriority(newScore);
  
  const updated: PortfolioItem = {
    ...item,
    score: newScore,
    priority: newPriority
  };
  
  portfolio.set(id, updated);
  
  res.json({
    success: true,
    message: 'Puntaje actualizado',
    item: updated
  });
});

/**
 * PUT /api/portfolio/:id/category
 * Cambia la categoría de una licitación guardada
 * Body: { category: string }
 */
app.put('/api/portfolio/:id/category', (req: Request, res: Response) => {
  const { id } = req.params;
  const { category } = req.body || {};
  
  const item = portfolio.get(id);
  if (!item) {
    res.status(404).json({ error: 'Item no encontrado en portfolio' });
    return;
  }
  
  const validCategory: PortfolioCategory = PORTFOLIO_CATEGORIES.includes(category)
    ? category
    : item.category;
  
  const updated: PortfolioItem = { ...item, category: validCategory };
  portfolio.set(id, updated);
  
  res.json({
    success: true,
    message: 'Categoría actualizada',
    item: updated
  });
});

/**
 * PUT /api/portfolio/:id/notes
 * Actualiza notas de una licitación guardada
 * Body: { notes: string }
 */
app.put('/api/portfolio/:id/notes', (req: Request, res: Response) => {
  const { id } = req.params;
  const { notes } = req.body || {};
  
  const item = portfolio.get(id);
  if (!item) {
    res.status(404).json({ error: 'Item no encontrado en portfolio' });
    return;
  }
  
  const updated: PortfolioItem = { ...item, notes: notes || '' };
  portfolio.set(id, updated);
  
  res.json({
    success: true,
    message: 'Notas actualizadas',
    item: updated
  });
});

/**
 * DELETE /api/portfolio/:id
 * Elimina una licitación del portfolio
 */
app.delete('/api/portfolio/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  
  if (!portfolio.has(id)) {
    res.status(404).json({ error: 'Item no encontrado' });
    return;
  }
  
  portfolio.delete(id);
  
  res.json({
    success: true,
    message: 'Licitación eliminada del portfolio'
  });
});

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, score));
}

function scoreToPriority(score: number): 'alta' | 'media' | 'baja' {
  if (score >= 80) return 'alta';
  if (score >= 60) return 'media';
  return 'baja';
}

/**
 * PUT /api/portfolio/:id/profile
 * Cambia el perfil asignado a una licitación guardada
 * Body: { profileId: string, profileName?: string }
 */
app.put('/api/portfolio/:id/profile', (req: Request, res: Response) => {
  const { id } = req.params;
  const { profileId, profileName } = req.body || {};
  
  const item = portfolio.get(id);
  if (!item) {
    res.status(404).json({ error: 'Item no encontrado en portfolio' });
    return;
  }
  
  const updated: PortfolioItem = {
    ...item,
    profileId: typeof profileId === 'string' ? profileId : item.profileId,
    profileName: typeof profileName === 'string' ? profileName : item.profileName
  };
  portfolio.set(id, updated);
  
  res.json({
    success: true,
    message: 'Perfil asignado actualizado',
    item: updated
  });
});

export function startServer(): void {
  app.listen(PORT, () => {
    console.log(`🚀 Licitaciones API corriendo en http://localhost:${PORT}`);
    console.log(`📋 Endpoints disponibles:`);
    console.log(`   GET  /api/health`);
    console.log(`   GET  /api/profiles`);
    console.log(`   POST /api/profiles`);
    console.log(`   GET  /api/opportunities`);
    console.log(`   GET  /api/opportunities/stats`);
    console.log(`   POST /api/opportunities/run`);
    console.log(`   GET  /api/portfolio`);
    console.log(`   GET  /api/portfolio/stats`);
    console.log(`   POST /api/portfolio`);
    console.log(`   PUT  /api/portfolio/:id/score`);
    console.log(`   PUT  /api/portfolio/:id/category`);
    console.log(`   PUT  /api/portfolio/:id/notes`);
    console.log(`   DELETE /api/portfolio/:id`);
  });
}

export { app };

// Arrancar servidor cuando este archivo se ejecuta directamente
startServer();
