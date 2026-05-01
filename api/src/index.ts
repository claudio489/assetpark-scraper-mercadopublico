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
  PipelineResult
} from '../../engine/dist';

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

// Middleware
app.use(cors());
app.use(express.json());

// Cache en memoria de la Ãºltima ejecuciÃ³n
let lastRunResult: PipelineResult | null = null;
let activeProfileId = 'tecnologia';

// ==========================================
// ENDPOINTS
// ==========================================

/**
 * GET /api/opportunities
 * Retorna las licitaciones enriquecidas de la Ãºltima ejecuciÃ³n
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
 * Calcula estadÃ­sticas desde el array de oportunidades (misma fuente)
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
 * Ejecuta el pipeline completo: scrape â†’ normalize â†’ score
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
    const result = await runPipeline({
      profile,
      limit: limit || 50
    });
    
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
    res.status(500).json({
      error: 'Error ejecutando pipeline',
      message: error instanceof Error ? error.message : 'Error desconocido'
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
  res.json({ status: 'ok', service: 'licitaciones-intelligence-api', version: '1.0.0' });
});

// ==========================================
// START
// ==========================================

export function startServer(): void {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`ðŸš€ Licitaciones API corriendo en http://localhost:${PORT}`);
    console.log(`ðŸ“‹ Endpoints disponibles:`);
    console.log(`   GET  /api/health`);
    console.log(`   GET  /api/profiles`);
    console.log(`   POST /api/profiles`);
    console.log(`   GET  /api/opportunities`);
    console.log(`   GET  /api/opportunities/stats`);
    console.log(`   POST /api/opportunities/run`);
  });
}

export { app };

// Arrancar servidor cuando este archivo se ejecuta directamente
startServer();
