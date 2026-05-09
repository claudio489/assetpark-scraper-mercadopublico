// ==========================================
// API v5.1 - AssetPark Scraper MercadoPublico
// Persistencia historica 30 dias + Novedades + Multi-request + Decision Engine
// ==========================================

import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import {
  normalizeOpportunity, analyzeOpportunity, EXECUTORS,
  getBestExecutor, rankOpportunities
} from './decision';
import { getActions, hideOpportunity, restoreOpportunity, saveOpportunity, removeSaved } from './userActions';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = parseInt(process.env.PORT || '3001', 10);
const TICKET = process.env.MP_TICKET || '8BBCAB7E-0911-4E40-BD68-C56A0A33FF78';
const MP_API = 'https://api.mercadopublico.cl/servicios/v1/publico';
const DATA_DIR = path.join(process.cwd(), 'data');
const HIST_FILE = path.join(DATA_DIR, 'historial.json');
const MAX_HIST_DAYS = 30;

// ---- AUTH CONFIG ----
const JWT_SECRET = process.env.JWT_SECRET || 'assetpark-dev-secret-2024';
const JWT_EXPIRES = '24h';
const USERS_FILE = path.join(DATA_DIR, 'users.json');

interface User {
  id: string;
  email: string;
  password: string;
  profile: string;
  name: string;
}

function loadUsers(): User[] {
  try {
    if (fs.existsSync(USERS_FILE)) {
      return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
    }
  } catch (e) { console.error('[AUTH] Error cargando users:', (e as Error).message); }
  return [];
}

// Extender Request para user logueado
declare global {
  namespace Express {
    interface Request {
      user?: { id: string; email: string; profile: string; name: string };
    }
  }
}

// Asegurar directorio de datos existe
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// ==========================================
// HISTORIAL PERSISTENTE (disco)
// Estructura: { [id]: { ...licitacion, firstSeen, lastSeen, profiles:[] } }
// ==========================================
interface HistEntry {
  id: string;
  title: string;
  description: string;
  entity: string;
  region: string;
  amount: number;
  date: string;
  closingDate: string;
  status: string;
  category: string;
  url: string;
  source: string;
  firstSeen: string;
  lastSeen: string;
  profiles: string[];
  score?: number;
  priority?: string;
  recommendation?: string;
  businessScore?: number;
  businessReasons?: string[];
  matchedKeywords?: string[];
}

let historial: Record<string, HistEntry> = {};

function loadHistorial() {
  try {
    if (fs.existsSync(HIST_FILE)) {
      const raw = fs.readFileSync(HIST_FILE, 'utf-8');
      historial = JSON.parse(raw);
      const keys = Object.keys(historial);
      console.log(`[HIST] ${keys.length} licitaciones cargadas`);
      // Purge viejas (>30 dias)
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - MAX_HIST_DAYS);
      let purged = 0;
      for (const k of keys) {
        const last = new Date(historial[k].lastSeen);
        if (last < cutoff) { delete historial[k]; purged++; }
      }
      if (purged > 0) {
        console.log(`[HIST] Purge: ${purged} licitaciones eliminadas (>${MAX_HIST_DAYS} dias)`);
        saveHistorial();
      }
    }
  } catch (e) {
    console.log('[HIST] Error cargando:', (e as Error).message);
    historial = {};
  }
}

function saveHistorial() {
  try {
    fs.writeFileSync(HIST_FILE, JSON.stringify(historial, null, 0), 'utf-8');
  } catch (e) {
    console.log('[HIST] Error guardando:', (e as Error).message);
  }
}

// Cargar al iniciar
loadHistorial();

// ==========================================
// PROFILES
// ==========================================
interface ProfileDef {
  id: string;
  name: string;
  keywords: string[];
  excluded: string[];
  regions?: string[];
  minAmount?: number;
  maxAmount?: number;
}

const PROFILES: ProfileDef[] = [
  { id: 'constructora', name: 'Constructora / Obras Civiles', keywords: ['construccion','obra civil','obra publica','infraestructura','edificacion','puente','camino','pavimentacion','hormigon','asfalto','movimiento de tierra','demolicion','excavacion','terraplen','estructura','tabiqueria','terminaciones','instalaciones','conservacion','escuela','plaza publica','sede comunitaria','obra gruesa','obra menor','reparacion','mantencion','ampliacion','remodelacion','climatizacion','hvac','aire acondicionado','calefaccion','ventilacion','bomba de calor','eficiencia energetica','inverter','refrigeracion','calefactor','sistema termico','ventilacion mecanica','sistema hvac','montaje industrial','estructura metalica','silo','laboratorio','izaje','soldadura certificada','torque controlado','andamio','andamio multidireccional','estructura gran porte','montaje estructural','cmpc','celulosa','industria forestal','planta industrial','bodega','galpon','centro distribucion','parque industrial','caminos'], excluded: ['medico','hospital','insumos medicos','quirurgico','material esteril','instrumental quirurgico','equipamiento medico','medicamentos','oficina','mueble','computador','impresora','papeleria','software','mobiliario','silla oficina','escritorio','servicio transporte','seguro','consultoria juridica','estudio contable','servicio limpieza','servicio vigilancia','arriendo vehiculo','servicio de buffet','alimentacion','catering','buceo','submarino','deporte acuatico','equipo de buceo','imprenta','impresion offset','banner publicitario','pendon pvc','desarrollo software','aplicacion movil','ciberseguridad','plataforma digital'], regions: ['Maule','Biobio','Araucania'], minAmount: 100000000, maxAmount: 500000000 },
  { id: 'tecnologia', name: 'Tecnologia / Software / TI', keywords: ['software','desarrollo software','sistema informatico','plataforma digital','aplicacion movil','ciberseguridad','hosting cloud','data center','red de datos','telecomunicaciones'], excluded: ['construccion','hormigon','asfalto','medico','hospital'] },
  { id: 'salud', name: 'Salud / Insumos Medicos', keywords: ['insumos medicos','equipamiento medico','medicamentos','material de curacion','material esteril','instrumental quirurgico','equipo de rayos x','tomografo','resonancia magnetica'], excluded: ['oficina','papeleria','computador','mueble','limpieza'] },
  { id: 'imprenta', name: 'Imprenta / Grafica / Publicidad', keywords: ['imprenta','impresion offset','impresion digital','pendon pvc','banner publicitario','gigantografia','letrero luminoso','rotulacion vehicular','troquelado','corte laser','vinilo de corte','serigrafia'], excluded: ['medico','hospital','insumos medicos','quirurgico'] },
  { id: 'hormigon', name: 'Preformado de Hormigon', keywords: ['hormigon','concreto','prefabricado','premezclado','postes','vigas','losas','paneles','adoquines','adoquin','pavimento','intertrabado','tubos','ductos','camara inspeccion','pozos','bordillos','bovedilla','arqueta','base granular','adoquinado','baldosas','canaletas','cunetas','veredas','aceras','placas','elementos preformados'], excluded: ['oficina','mueble','computador','impresora','papeleria','software','camara fotografica'] },
  { id: 'pallets', name: 'Pallets / Logistica / Almacenaje', keywords: ['pallet','palet','pallets','palletizado','palletizacion','estiba','estibado','estibar','transporte de carga','almacenaje','logistica','cadena de suministro','distribucion','carga y descarga','embalaje','envase','contenedor','sku','inventario','bodega','galpon logistico','centro de distribucion','manipulacion de carga','montacargas','elevador','conveyor','conveyors','transportador','racking','rack','anaquel','almacenamiento','despacho','fulfillment','cross docking','embalaje industrial','caja de carton','carton corrugado','exportacion','importacion','aduana','puerto','terminal portuaria','transporte terrestre','camion','flota vehicular','flete','fletamento','consolidacion de carga','desconsolidacion'], excluded: ['medico','hospital','insumos medicos','quirurgico','software','desarrollo software','aplicacion movil','consultoria juridica','estudio contable','seguro'] },
  { id: 'general', name: 'Perfil General', keywords: [], excluded: [] },
  { id: 'buceo', name: 'Importacion Equipo de Buceo', keywords: ['buceo','submarino','subacuatico','buceo tecnico','equipo de buceo','tanque de buceo','regulador de buceo','traje de buceo','mascara de buceo','aletas de buceo','buceo profesional','buceo industrial','escafandra autonoma'], excluded: ['medico','hospital','insumos medicos','paciente','quirurgico'] }
];

// ==========================================
// UTILS
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

function formatDateMP(d: Date): string {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}${mm}${yyyy}`;
}

// Batch promises: ejecuta N promesas en paralelo, espera, sigue con las siguientes N
async function batchPromises<T>(promises: (() => Promise<T>)[], batchSize: number): Promise<T[]> {
  const results: T[] = [];
  for (let i = 0; i < promises.length; i += batchSize) {
    const batch = promises.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(p => p()));
    results.push(...batchResults);
  }
  return results;
}

// ==========================================
// SCRAPER - Multi-request: 30 dias con batching
// ==========================================
async function fetchActivasByDate(fechaStr: string | null, ticket: string): Promise<any[]> {
  try {
    const url = fechaStr
      ? `${MP_API}/licitaciones.json?fecha=${fechaStr}&estado=activas&ticket=${ticket}`
      : `${MP_API}/licitaciones.json?estado=activas&ticket=${ticket}`;
    const data = await httpGet(url, 20000);
    return data.Listado || [];
  } catch { return []; }
}

async function scrapeMercadoPublico(
  profileKeywords: string[],
  excludedKeywords: string[] = [],
  limit = 50
): Promise<any[]> {
  try {
    const requests: (() => Promise<any[]>)[] = [];

    // Request principal
    requests.push(() => fetchActivasByDate(null, TICKET));

    // Requests por los ultimos 30 dias
    for (let i = 1; i <= 30; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const fechaStr = formatDateMP(d);
      requests.push(() => fetchActivasByDate(fechaStr, TICKET));
    }

    // Ejecutar en batches de 5 para no saturar
    const allLists = await batchPromises(requests, 5);
    const totalRaw = allLists.reduce((s, l) => s + l.length, 0);
    console.log(`[Scraper] Total raw: ${totalRaw} licitaciones`);

    // De-duplicar
    const seen = new Set<string>();
    let combined: any[] = [];
    for (const list of allLists) {
      for (const lic of list) {
        const code = lic.CodigoExterno || '';
        if (code && !seen.has(code)) {
          seen.add(code);
          combined.push(lic);
        }
      }
    }
    console.log(`[Scraper] Unicas: ${combined.length}`);

    // Filtrar por keywords positivas
    if (profileKeywords.length > 0) {
      const kw = profileKeywords.map(k => k.toLowerCase());
      const before = combined.length;
      combined = combined.filter((lic: any) => {
        const text = `${lic.Nombre || ''} ${lic.Descripcion || ''}`.toLowerCase();
        return kw.some(w => text.includes(w));
      });
      console.log(`[Scraper] Keywords: ${before} -> ${combined.length}`);
    }

    // Excluir por keywords negativas
    if (excludedKeywords.length > 0) {
      const ex = excludedKeywords.map(k => k.toLowerCase());
      const before = combined.length;
      combined = combined.filter((lic: any) => {
        const text = `${lic.Nombre || ''} ${lic.Descripcion || ''}`.toLowerCase();
        return !ex.some(w => text.includes(w));
      });
      if (before > combined.length) {
        console.log(`[Scraper] Excluidas: ${before - combined.length}`);
      }
    }

    return combined.slice(0, limit).map((lic: any) => {
      const comprador = lic.Comprador || {};
      const fechas = lic.Fechas || {};
      return {
        id: lic.CodigoExterno || '',
        title: lic.Nombre || '',
        description: lic.Descripcion || lic.Nombre || '',
        entity: comprador.NombreOrganismo || comprador.NombreUnidad || 'Organismo no especificado',
        region: parseRegion(comprador.RegionUnidad),
        amount: typeof lic.MontoEstimado === 'number' ? lic.MontoEstimado : 0,
        date: (fechas.FechaPublicacion || '').split('T')[0],
        closingDate: (fechas.FechaCierre || lic.FechaCierre || '').split('T')[0],
        status: lic.Estado || 'Publicada',
        category: lic.Tipo || 'General',
        url: `https://www.mercadopublico.cl/fichaLicitacion.html?idLicitacion=${encodeURIComponent(lic.CodigoExterno || '')}`,
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
  if (keywords.length === 0) {
    return { score: 50, priority: 'media' as const, matchedKeywords: ['General'], matchScore: 50 };
  }
  const text = (title + ' ' + description).toLowerCase();
  const matched: string[] = [];
  for (const k of keywords) {
    if (text.includes(k.toLowerCase())) matched.push(k);
  }
  const matchRate = keywords.length > 0 ? matched.length / keywords.length : 0;
  let score = Math.round(matchRate * 100);
  if (matched.length > 0 && matched.length < keywords.length) {
    score = Math.min(100, score + 12);
  }
  const priority = score >= 80 ? 'alta' : score >= 60 ? 'media' : 'baja';
  return { score, priority, matchedKeywords: matched, matchScore: score };
}

interface BusinessCriteria { minAmount: number; optimalAmount: number; }

const BUSINESS_CRITERIA: Record<string, BusinessCriteria> = {
  constructora: { minAmount: 3_000_000, optimalAmount: 150_000_000 },
  tecnologia:   { minAmount: 2_000_000,   optimalAmount: 50_000_000 },
  salud:        { minAmount: 5_000_000,   optimalAmount: 100_000_000 },
  buceo:        { minAmount: 1_000_000,   optimalAmount: 10_000_000 },
  imprenta:     { minAmount: 500_000,      optimalAmount: 20_000_000 },
  hormigon:     { minAmount: 1_000_000,    optimalAmount: 30_000_000 },
  pallets:      { minAmount: 500_000,       optimalAmount: 15_000_000 },
  general:      { minAmount: 100_000,      optimalAmount: 1_000_000 }
};

function calculateBusinessScore(amount: number, profileId: string): { score: number; reasons: string[] } {
  const criteria = BUSINESS_CRITERIA[profileId] || BUSINESS_CRITERIA.general;
  const reasons: string[] = [];
  let score = 50;
  if (amount === 0) {
    reasons.push('Monto oculto en licitacion activa — revisar en ficha de MercadoPublico');
    score = 60;
  } else if (amount < criteria.minAmount) {
    reasons.push(`Monto ${fmtMoney(amount)} esta por debajo del minimo operativo ${fmtMoney(criteria.minAmount)} para este rubro`);
    score = 20;
  } else if (amount >= criteria.optimalAmount) {
    reasons.push(`Monto ${fmtMoney(amount)} supera el optimo ${fmtMoney(criteria.optimalAmount)}`);
    score = 95;
  } else {
    const ratio = (amount - criteria.minAmount) / (criteria.optimalAmount - criteria.minAmount);
    score = 50 + Math.round(ratio * 45);
    reasons.push(`Monto ${fmtMoney(amount)} dentro de rango operativo`);
  }
  return { score: Math.min(100, score), reasons };
}

function fmtMoney(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)} mil millones`;
  if (n >= 1_000_000) return `$${Math.round(n / 1_000_000)} millones`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)} mil`;
  return `$${n}`;
}

function scoreToPriority(score: number): string {
  if (score >= 80) return 'alta';
  if (score >= 60) return 'media';
  return 'baja';
}

// ==========================================
// PORTFOLIO (in-memory)
// ==========================================
const portfolio = new Map<string, any>();
const PORTFOLIO_CATEGORIES = ['Construccion', 'Montaje', 'Mantencion', 'Suministro EPP', 'Software a la medida'];

// ==========================================
// ENDPOINTS
// ==========================================

app.get('/api/health', (_req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'no-store');
  const histKeys = Object.keys(historial);
  res.json({ status: 'ok', service: 'assetpark-scraper', version: '5.1.0', historialSize: histKeys.length, decisionEngine: true });
});

app.get('/api/health/external', async (_req: Request, res: Response) => {
  try {
    const data = await httpGet(`${MP_API}/licitaciones.json?estado=activas&ticket=${TICKET}`, 10000);
    res.setHeader('Cache-Control', 'no-store');
    res.json({ success: true, mercadoPublico: true, count: data.Listado?.length || 0 });
  } catch (err) {
    res.setHeader('Cache-Control', 'no-store');
    res.json({ success: false, message: (err as Error).message });
  }
});

app.get('/api/profiles', (_req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'no-store');
  res.json({ success: true, profiles: PROFILES });
});

// ---- AUTH MIDDLEWARE (soft mode) ----
function authMiddleware(req: Request, res: Response, next: Function) {
  try {
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    if (!authHeader) return next();
    const token = (authHeader as string).replace(/^Bearer\s+/i, '');
    if (!token) return next();
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (decoded && decoded.id) {
      req.user = { id: decoded.id, email: decoded.email, profile: decoded.profile, name: decoded.name };
    }
  } catch (e) { /* token invalido = anonimo */ }
  next();
}
app.use(authMiddleware);

// ---- AUTH ENDPOINTS ----

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    res.status(400).json({ success: false, error: 'Falta email o password' });
    return;
  }
  const users = loadUsers();
  const user = users.find((u: User) => u.email === email);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    res.status(401).json({ success: false, error: 'Credenciales invalidas' });
    return;
  }
  const token = jwt.sign(
    { id: user.id, email: user.email, profile: user.profile, name: user.name },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  );
  res.setHeader('Cache-Control', 'no-store');
  res.json({ success: true, token, profile: user.profile, name: user.name });
});

app.post('/api/auth/logout', (_req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'no-store');
  res.json({ success: true, message: 'Logout OK - elimina el token en el cliente' });
});

app.get('/api/auth/me', (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'No autenticado' });
    return;
  }
  res.setHeader('Cache-Control', 'no-store');
  res.json({ success: true, user: req.user });
});

// ---- PIPELINE ----

let lastResult: any = null;

app.post('/api/opportunities/run', async (req: Request, res: Response) => {
  const effectiveProfileId = req.user ? (req.user.profile === 'general' ? (req.body?.profileId || 'general') : req.user.profile) : (req.body?.profileId || 'general');
  const { limit = 50 } = req.body || {};
  
  const profile = PROFILES.find(p => p.id === effectiveProfileId) || PROFILES[4];
  const now = new Date().toISOString();

  console.log(`[API] Pipeline v5 - perfil: ${profile.id}, limit: ${limit}`);

  try {
    const pipelinePromise = scrapeMercadoPublico(profile.keywords, (profile as any).excluded || [], limit || 50);
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Pipeline timeout')), 60000); // 60s para 31 requests
    });

    const raw = await Promise.race([pipelinePromise, timeoutPromise]);

    // Scoring
    const opportunities = raw.map((op: any) => {
      const baseSc = calculateScore(op.title, op.description, profile.keywords);
      const bizSc = calculateBusinessScore(op.amount, profile.id);
      const finalScore = Math.round(baseSc.score * 0.60 + bizSc.score * 0.40);
      // Nuevo sistema de recomendacion: solo POSTULAR / EVALUAR / REVISION
      // EVITAR eliminado porque genera rechazo en clientes
      let recommendation: string;
      if (finalScore >= 60) recommendation = 'POSTULAR';
      else if (finalScore >= 35) recommendation = 'EVALUAR';
      else recommendation = 'REVISION'; // antes era EVITAR - ahora es "revisar con cuidado"
      // Perfil General: todo EVALUAR para que el usuario decida manualmente
      if (effectiveProfileId === 'general') recommendation = 'EVALUAR';

      const isNew = !historial[op.id];
      const scored = {
        ...op,
        score: finalScore,
        priority: finalScore >= 80 ? 'alta' : finalScore >= 60 ? 'media' : 'baja',
        matchScore: baseSc.matchScore,
        matchedKeywords: baseSc.matchedKeywords,
        businessScore: bizSc.score,
        businessReasons: bizSc.reasons,
        recommendation,
        isNew,
        // === DECISION ENGINE v5.1 (capa adicional, no invasiva) ===
        v5: {} as any
      };

      // Agregar analisis Decision Engine (solo si hay ejecutoras configuradas)
      try {
        const normalized = normalizeOpportunity({ ...scored, profileId: effectiveProfileId });
        const decision = analyzeOpportunity(normalized, EXECUTORS);
        scored.v5 = {
          decisionValue: decision.decisionValue,
          probabilitySuccess: decision.probabilitySuccess,
          expectedProfit: decision.expectedProfit,
          riskScore: decision.riskScore,
          fitScore: decision.fitScore,
          bestExecutorId: decision.bestExecutorId,
          bestExecutorName: decision.bestExecutorName,
          decision: decision.decision,
          reasoning: decision.reasoning
        };
      } catch (e) {
        scored.v5 = { error: 'Decision engine unavailable' };
      }

      // Guardar en historial persistente
      const existing = historial[op.id];
      if (!existing) {
        historial[op.id] = {
          ...scored,
          firstSeen: now,
          lastSeen: now,
          profiles: [effectiveProfileId]
        };
      } else {
        existing.lastSeen = now;
        existing.status = op.status;
        existing.closingDate = op.closingDate;
        if (!existing.profiles.includes(effectiveProfileId)) existing.profiles.push(effectiveProfileId);
      }

      return scored;
    });

    saveHistorial();

    // Detectar novedades (aparecidas en las ultimas 24h)
    const hace24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const novedades = opportunities.filter((o: any) => {
      const entry = historial[o.id];
      return entry && entry.firstSeen >= hace24h;
    });

    const stats = {
      total: opportunities.length,
      alta: opportunities.filter((o: any) => o.priority === 'alta').length,
      media: opportunities.filter((o: any) => o.priority === 'media').length,
      baja: opportunities.filter((o: any) => o.priority === 'baja').length,
      novedades: novedades.length,
      historialTotal: Object.keys(historial).length
    };

    const actions = getActions();
    const visibleOps = opportunities.filter((o: any) => !actions.hidden.includes(o.id));
    const opsWithSaved = visibleOps.map((o: any) => ({
      ...o,
      isSaved: actions.saved.some((s: any) => s.id === o.id)
    }));
    const visibleStats = {
      ...stats,
      total: visibleOps.length,
      alta: visibleOps.filter((o: any) => o.priority === 'alta').length,
      media: visibleOps.filter((o: any) => o.priority === 'media').length,
      baja: visibleOps.filter((o: any) => o.priority === 'baja').length,
      ocultas: opportunities.length - visibleOps.length
    };

    lastResult = { profileId: effectiveProfileId, runAt: now, stats: visibleStats, opportunities: opsWithSaved };

    res.setHeader('Cache-Control', 'no-store');
    res.json({ success: true, profileId: profile.id, profileName: profile.name, ...visibleStats, opportunities: opsWithSaved });
    console.log(`[API] Pipeline OK - ${visibleOps.length}/${opportunities.length} visibles, ${novedades.length} novedades, ${actions.hidden.length} ocultas, ${actions.saved.length} guardadas`);

  } catch (error) {
    console.error('[API] Pipeline error:', (error as Error).message);
    res.setHeader('Cache-Control', 'no-store');
    res.json({ success: false, error: (error as Error).message });
  }
});

app.get('/api/opportunities', (_req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'no-store');
  if (!lastResult) {
    res.json({ success: true, count: 0, opportunities: [] });
    return;
  }
  res.json({ success: true, ...lastResult });
});

// ---- DEMO ENDPOINT (mock data for frontend development) ----

const DEMO_OPPORTUNITIES = [
  {
    id: "3685-11-L126",
    title: "Construccion de Puente Peatonal Sector Centro",
    entity: "Municipalidad de Concepcion",
    region: "Biobio",
    amount: 185000000,
    source: "MercadoPublico",
    url: "https://www.mercadopublico.cl/fichaLicitacion.html?idLicitacion=3685-11-L126",
    date: "2026-05-01",
    status: "Publicada",
    category: "Obras Civiles",
    description: "Construccion de puente peatonal en sector centro de la ciudad, incluye obras civiles, fundaciones y estructura metalica",
    score: 87,
    priority: "alta",
    matchedKeywords: ["construccion", "obras civiles", "puente"],
    matchScore: 82,
    aiScore: null,
    closingDate: "2026-05-28",
    recommendation: "POSTULAR",
    businessScore: 85,
    businessReasons: ["Monto compatible con capacidad", "Experiencia previa en puentes"],
    isNew: true,
    v5: {
      decisionValue: 0.87,
      probabilitySuccess: 0.85,
      expectedProfit: 25000000,
      riskScore: 2,
      fitScore: 0.92,
      bestExecutorId: "dyg_constructora",
      bestExecutorName: "DYG Constructora",
      decision: "POSTULAR",
      reasoning: ["Match directo en rubro construccion", "Monto estimado compatible", "Plazo adecuado", "Region cercana a operaciones"]
    }
  },
  {
    id: "4821-5-LE26",
    title: "Reparacion y Mantencion Edificio Municipal",
    entity: "Municipalidad de Los Angeles",
    region: "Biobio",
    amount: 42000000,
    source: "MercadoPublico",
    url: "https://www.mercadopublico.cl/fichaLicitacion.html?idLicitacion=4821-5-LE26",
    date: "2026-05-03",
    status: "Publicada",
    category: "Mantencion",
    description: "Reparacion de techumbre, pintura exterior y mantencion general de edificio municipal",
    score: 72,
    priority: "media",
    matchedKeywords: ["reparacion", "mantencion", "edificio"],
    matchScore: 68,
    aiScore: null,
    closingDate: "2026-06-15",
    recommendation: "EVALUAR",
    businessScore: 65,
    businessReasons: ["Monto bajo pero recurrente", "Buena relacion con municipalidad"],
    isNew: true,
    v5: {
      decisionValue: 0.65,
      probabilitySuccess: 0.70,
      expectedProfit: 8000000,
      riskScore: 3,
      fitScore: 0.75,
      bestExecutorId: "dyg_constructora",
      bestExecutorName: "DYG Constructora",
      decision: "EVALUAR",
      reasoning: ["Match en rubro mantencion", "Monto bajo pero recurrente", "Requiere visita tecnica previa"]
    }
  },
  {
    id: "7152-3-L126",
    title: "Construccion Sala de Emergencias Hospital Regional",
    entity: "Servicio de Salud Biobio",
    region: "Biobio",
    amount: 890000000,
    source: "MercadoPublico",
    url: "https://www.mercadopublico.cl/fichaLicitacion.html?idLicitacion=7152-3-L126",
    date: "2026-04-28",
    status: "Publicada",
    category: "Obras Civiles",
    description: "Construccion de nueva sala de emergencias para Hospital Regional, obra mayor con estructura de hormigon y acero",
    score: 78,
    priority: "media",
    matchedKeywords: ["construccion", "obras civiles", "hormigon"],
    matchScore: 74,
    aiScore: null,
    closingDate: "2026-06-30",
    recommendation: "EVALUAR",
    businessScore: 60,
    businessReasons: ["Monto alto requiere garantias", "Experiencia en salud limitada"],
    isNew: false,
    v5: {
      decisionValue: 0.72,
      probabilitySuccess: 0.65,
      expectedProfit: 120000000,
      riskScore: 5,
      fitScore: 0.68,
      bestExecutorId: "dyg_constructora",
      bestExecutorName: "DYG Constructora",
      decision: "EVALUAR",
      reasoning: ["Monto muy alto para capacidad actual", "Experiencia limitada en salud", "Plazo extendido favorable"]
    }
  },
  {
    id: "2934-9-CD26",
    title: "Obras de Pavimentacion Calle Principal Yumbel",
    entity: "Municipalidad de Yumbel",
    region: "Biobio",
    amount: 95000000,
    source: "MercadoPublico",
    url: "https://www.mercadopublico.cl/fichaLicitacion.html?idLicitacion=2934-9-CD26",
    date: "2026-05-04",
    status: "Publicada",
    category: "Obras Civiles",
    description: "Pavimentacion con asfalto de 2.5km de calle principal, incluye obras de evacuacion de aguas lluvias",
    score: 92,
    priority: "alta",
    matchedKeywords: ["obras civiles", "pavimentacion", "asfalto"],
    matchScore: 88,
    aiScore: null,
    closingDate: "2026-05-22",
    recommendation: "POSTULAR",
    businessScore: 90,
    businessReasons: ["Experiencia directa en pavimentacion", "Region de operaciones"],
    isNew: true,
    v5: {
      decisionValue: 0.92,
      probabilitySuccess: 0.90,
      expectedProfit: 18000000,
      riskScore: 2,
      fitScore: 0.95,
      bestExecutorId: "dyg_constructora",
      bestExecutorName: "DYG Constructora",
      decision: "POSTULAR",
      reasoning: ["Match perfecto en rubro pavimentacion", "Experiencia previa comprobada", "Monto ideal para capacidad", "Region de operaciones"]
    }
  },
  {
    id: "5487-2-TI26",
    title: "Suministro e Instalacion de Cercos Perimetrales",
    entity: "Ministerio de Obras Publicas",
    region: "Maule",
    amount: 18000000,
    source: "MercadoPublico",
    url: "https://www.mercadopublico.cl/fichaLicitacion.html?idLicitacion=5487-2-TI26",
    date: "2026-04-15",
    status: "Publicada",
    category: "Construccion",
    description: "Suministro e instalacion de cercos perimetrales en dependencias del ministerio, incluye portones de acceso",
    score: 45,
    priority: "baja",
    matchedKeywords: ["construccion", "instalacion"],
    matchScore: 42,
    aiScore: null,
    closingDate: "2026-05-18",
    recommendation: "REVISION",
    businessScore: 40,
    businessReasons: ["Monto bajo", "Region fuera de cobertura habitual"],
    isNew: false,
    v5: {
      decisionValue: 0.42,
      probabilitySuccess: 0.35,
      expectedProfit: 3500000,
      riskScore: 4,
      fitScore: 0.45,
      bestExecutorId: "dyg_constructora",
      bestExecutorName: "DYG Constructora",
      decision: "REVISION",
      reasoning: ["Region fuera de cobertura habitual", "Monto bajo vs costo de desplazamiento", "Rubro secundario"]
    }
  }
];

app.get('/api/opportunities/demo', (_req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'no-store');
  const stats = {
    total: DEMO_OPPORTUNITIES.length,
    alta: DEMO_OPPORTUNITIES.filter((o: any) => o.priority === 'alta').length,
    media: DEMO_OPPORTUNITIES.filter((o: any) => o.priority === 'media').length,
    baja: DEMO_OPPORTUNITIES.filter((o: any) => o.priority === 'baja').length,
    novedades: 3,
    historialTotal: 5
  };
  res.json({
    success: true,
    profileId: 'constructora',
    profileName: 'Constructora',
    ...stats,
    opportunities: DEMO_OPPORTUNITIES
  });
});

// ---- HISTORIAL (30 dias) ----

app.get('/api/opportunities/historial', (req: Request, res: Response) => {
  const { profileId, search, days = '30' } = req.query;
  const maxDays = parseInt(days as string) || 30;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - maxDays);

  let items = Object.values(historial)
    .filter((h: HistEntry) => new Date(h.lastSeen) >= cutoff)
    .sort((a: HistEntry, b: HistEntry) => new Date(b.firstSeen).getTime() - new Date(a.firstSeen).getTime());

  if (profileId && typeof profileId === 'string') {
    items = items.filter((h: HistEntry) => h.profiles && h.profiles.includes(profileId));
  }

  if (search && typeof search === 'string') {
    const s = search.toLowerCase();
    items = items.filter((h: HistEntry) =>
      (h.title || '').toLowerCase().includes(s) ||
      (h.entity || '').toLowerCase().includes(s) ||
      (h.region || '').toLowerCase().includes(s)
    );
  }

  res.setHeader('Cache-Control', 'no-store');
  res.json({ success: true, count: items.length, maxDays, items });
});

// ---- NOVEDADES (ultimas 24h) ----

app.get('/api/opportunities/novedades', (_req: Request, res: Response) => {
  const hace24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const items = Object.values(historial)
    .filter((h: HistEntry) => h.firstSeen >= hace24h)
    .sort((a: HistEntry, b: HistEntry) => new Date(b.firstSeen).getTime() - new Date(a.firstSeen).getTime());

  res.setHeader('Cache-Control', 'no-store');
  res.json({ success: true, count: items.length, periodo: '24h', items });
});

// ---- POR VENCER (cierran en 7 dias) ----

app.get('/api/opportunities/vencer', (_req: Request, res: Response) => {
  const hoy = new Date();
  const en7dias = new Date();
  en7dias.setDate(en7dias.getDate() + 7);

  const items = Object.values(historial)
    .filter((h: HistEntry) => {
      if (!h.closingDate) return false;
      const cierre = new Date(h.closingDate);
      return cierre >= hoy && cierre <= en7dias;
    })
    .sort((a: HistEntry, b: HistEntry) => new Date(a.closingDate).getTime() - new Date(b.closingDate).getTime());

  res.setHeader('Cache-Control', 'no-store');
  res.json({ success: true, count: items.length, periodo: '7 dias', items });
});

app.get('/api/opportunities/stats', (_req: Request, res: Response) => {
  const ops = lastResult?.opportunities || [];
  const amountsByCategory: Record<string, number> = {};
  let totalAmount = 0;
  for (const op of ops) {
    if (op.amount > 0) { totalAmount += op.amount; amountsByCategory[op.category || 'Sin categoria'] = (amountsByCategory[op.category || 'Sin categoria'] || 0) + op.amount; }
  }
  const hace24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  res.setHeader('Cache-Control', 'no-store');
  res.json({
    success: true,
    stats: {
      total: ops.length,
      alta: ops.filter((o: any) => o.priority === 'alta').length,
      media: ops.filter((o: any) => o.priority === 'media').length,
      baja: ops.filter((o: any) => o.priority === 'baja').length,
      postular: ops.filter((o: any) => o.recommendation === 'POSTULAR').length,
      evaluar: ops.filter((o: any) => o.recommendation === 'EVALUAR').length,
      evitar: ops.filter((o: any) => o.recommendation === 'EVITAR').length,
      totalAmount,
      amountsByCategory,
      historialTotal: Object.keys(historial).length,
      novedades24h: Object.values(historial).filter((h: HistEntry) => h.firstSeen >= hace24h).length
    }
  });
});

// ---- USER ACTIONS (Hide / Save) ----

app.get('/api/opportunities/actions', (req: Request, res: Response) => {
  const actions = getActions();
  res.setHeader('Cache-Control', 'no-store');
  res.json({ success: true, hidden: actions.hidden, saved: actions.saved });
});

app.post('/api/opportunities/:id/hide', (req: Request, res: Response) => {
  const { id } = req.params;
  const profileId = req.body?.profileId || req.query?.profileId || 'general';
  const visibleIds = req.body?.visibleIds || [];
  const profile = PROFILES.find(p => p.id === profileId);
  hideOpportunity(id);
  // Buscar reemplazo del historial con filtros del perfil - ALEATORIO
  const actions = getActions();
  const savedIds = actions.saved.map((s: any) => s.id);
  const allEntries = Object.values(historial);
  const candidates = allEntries.filter((h: any) => {
    // No oculta, no guardada, no la misma, no visible actualmente
    if (actions.hidden.includes(h.id) || savedIds.includes(h.id) || h.id === id) return false;
    if (visibleIds.includes(h.id)) return false; // no reinsertar una que ya se ve
    // Mismo perfil
    if (!h.profiles || !h.profiles.includes(profileId)) return false;
    // Score minimo
    if ((h.score || 0) < 50) return false;
    // Filtro region
    if (profile?.regions && profile.regions.length > 0) {
      const regionMatch = profile.regions.some((r: string) => (h.region || '').toLowerCase().includes(r.toLowerCase()));
      if (!regionMatch) return false;
    }
    // Filtro monto
    const amt = h.amount || 0;
    const min = profile?.minAmount || 0;
    const max = profile?.maxAmount || Infinity;
    if (amt < min || amt > max) return false;
    return true;
  });
  // Seleccion ALEATORIA entre todos los candidatos para evitar repeticion
  const replacement = candidates.length > 0
    ? candidates[Math.floor(Math.random() * candidates.length)]
    : null;
  res.setHeader('Cache-Control', 'no-store');
  res.json({ success: true, message: 'No aplica - oculta', replacement: replacement || null });
});

app.post('/api/opportunities/:id/restore', (req: Request, res: Response) => {
  const { id } = req.params;
  restoreOpportunity(id);
  res.setHeader('Cache-Control', 'no-store');
  res.json({ success: true, message: 'Restaurada' });
});

app.post('/api/opportunities/:id/save', (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, entity, amount, closingDate, url, recommendation, score } = req.body || {};
  saveOpportunity({ id, title, entity, amount, closingDate, url, recommendation, score });
  res.setHeader('Cache-Control', 'no-store');
  res.json({ success: true, message: 'Guardada' });
});

app.delete('/api/opportunities/:id/save', (req: Request, res: Response) => {
  const { id } = req.params;
  removeSaved(id);
  res.setHeader('Cache-Control', 'no-store');
  res.json({ success: true, message: 'Eliminada de guardadas' });
});

// ---- CUBICADOR DYG ----

app.get('/api/cubicador/licitaciones', (req: Request, res: Response) => {
  // Solo perfil constructora
  const profile = PROFILES.find(p => p.id === 'constructora');
  if (!profile) {
    res.status(404).json({ success: false, error: 'Perfil constructora no encontrado' });
    return;
  }
  const { opportunities = [] } = lastResult || {};
  const actions = getActions();
  const visible = opportunities
    .filter((o: any) => !actions.hidden.includes(o.id))
    .map((o: any) => ({
      id: o.id,
      code: o.code,
      title: o.title,
      entity: o.entity,
      region: o.region,
      amount: o.amount,
      closingDate: o.closingDate,
      url: o.url,
      description: o.description,
      category: o.category,
      recommendation: o.recommendation,
      score: o.score,
      priority: o.priority,
      fitScore: o.v5?.fitScore,
      probabilitySuccess: o.v5?.probabilitySuccess,
      bestExecutorName: o.v5?.bestExecutorName,
      reasoning: o.v5?.reasoning,
      isNew: o.isNew,
      isSaved: actions.saved.some((s: any) => s.id === o.id)
    }));
  res.setHeader('Cache-Control', 'no-store');
  res.json({ success: true, count: visible.length, licitaciones: visible });
});

// Generar URL precargada para cubicador
app.get('/api/cubicador/:id/precargar', (req: Request, res: Response) => {
  const { id } = req.params;
  const { opportunities = [] } = lastResult || {};
  const o = opportunities.find((x: any) => x.id === id);
  if (!o) {
    res.status(404).json({ success: false, error: 'Licitacion no encontrada' });
    return;
  }
  // URL del cubicador DYG con datos precargados
  const params = new URLSearchParams({
    licitacion_id: o.id || '',
    titulo: (o.title || '').substring(0, 200),
    organismo: (o.entity || '').substring(0, 200),
    region: o.region || '',
    monto: String(o.amount || 0),
    cierre: o.closingDate || '',
    categoria: o.category || '',
    descripcion: (o.description || '').substring(0, 500),
    recomendacion: o.recommendation || '',
    score: String(o.score || 0),
    url_mp: o.url || ''
  });
  const cubicadorUrl = `https://dygconstructora.cl/cubicador?${params.toString()}`;
  res.setHeader('Cache-Control', 'no-store');
  res.json({ success: true, url: cubicadorUrl, licitacion: { id: o.id, title: o.title, amount: o.amount } });
});

// ---- PORTFOLIO ----

app.get('/api/portfolio', (req: Request, res: Response) => {
  const { category, profileId } = req.query;
  let items = Array.from(portfolio.values()).sort((a: any, b: any) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
  if (category && typeof category === 'string') items = items.filter((i: any) => i.category === category);
  if (profileId && typeof profileId === 'string') items = items.filter((i: any) => i.profileId === profileId);
  res.setHeader('Cache-Control', 'no-store');
  res.json({ success: true, count: items.length, categories: PORTFOLIO_CATEGORIES, items });
});

app.post('/api/portfolio', (req: Request, res: Response) => {
  const { opportunity, category, notes, profileId, profileName } = req.body || {};
  if (!opportunity || !opportunity.id) { res.status(400).json({ error: 'Falta opportunity.id' }); return; }
  const item = {
    id: `${opportunity.id}-${Date.now()}`,
    opportunityId: opportunity.id,
    title: opportunity.title || '', entity: opportunity.entity || '', region: opportunity.region || '',
    amount: opportunity.amount || 0, url: opportunity.url || '', date: opportunity.date || '',
    status: opportunity.status || '', category: PORTFOLIO_CATEGORIES.includes(category) ? category : 'Sin categoria',
    description: opportunity.description || '', score: opportunity.score || 50,
    priority: scoreToPriority(opportunity.score || 50), matchedKeywords: opportunity.matchedKeywords || [],
    matchScore: opportunity.matchScore || 0, source: opportunity.source || '',
    savedAt: new Date().toISOString(), notes: notes || '', profileId: profileId || '', profileName: profileName || ''
  };
  portfolio.set(item.id, item);
  res.setHeader('Cache-Control', 'no-store');
  res.json({ success: true, item });
});

app.delete('/api/portfolio/:id', (req: Request, res: Response) => {
  if (!portfolio.has(req.params.id)) { res.status(404).json({ error: 'No encontrado' }); return; }
  portfolio.delete(req.params.id);
  res.setHeader('Cache-Control', 'no-store');
  res.json({ success: true, message: 'Eliminado' });
});

// ==========================================
// DECISION ENGINE v5.1 ENDPOINTS (nuevos, opcionales)
// No rompen compatibilidad con v5.0
// ==========================================

app.get('/api/decision/executors', (_req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'no-store');
  res.json({ success: true, count: EXECUTORS.length, executors: EXECUTORS });
});

app.post('/api/decision/analyze', (req: Request, res: Response) => {
  const { opportunity } = req.body || {};
  if (!opportunity) {
    res.status(400).json({ error: 'Falta opportunity en body' });
    return;
  }
  try {
    const normalized = normalizeOpportunity({ ...opportunity, profileId: opportunity.profileId || 'general' });
    const decision = analyzeOpportunity(normalized, EXECUTORS);
    const best = getBestExecutor(normalized, EXECUTORS);
    res.setHeader('Cache-Control', 'no-store');
    res.json({
      success: true,
      opportunityId: opportunity.id,
      decision,
      bestExecutor: best.executor ? { id: best.executor.id, name: best.executor.name, type: best.executor.type } : null,
      allExecutors: EXECUTORS.map(ex => {
        const fit = analyzeOpportunity(normalized, [ex]);
        return { id: ex.id, fitScore: fit.fitScore, decision: fit.decision };
      }).sort((a: any, b: any) => b.fitScore - a.fitScore)
    });
  } catch (e) {
    res.status(500).json({ success: false, error: (e as Error).message });
  }
});

app.post('/api/decision/rank', (req: Request, res: Response) => {
  const { opportunities, topN = 20 } = req.body || {};
  if (!Array.isArray(opportunities)) {
    res.status(400).json({ error: 'Falta opportunities[] en body' });
    return;
  }
  try {
    const normalized = opportunities.map((op: any) => normalizeOpportunity({ ...op, profileId: op.profileId || 'general' }));
    const ranked = rankOpportunities(normalized, EXECUTORS, topN);
    res.setHeader('Cache-Control', 'no-store');
    res.json({
      success: true,
      total: opportunities.length,
      ranked: ranked.map(r => ({
        id: r.opportunity.id,
        title: r.opportunity.title,
        score: r.score,
        profit: r.profit,
        risk: r.risk,
        decision: r.decision,
        executor: r.executor?.name || null
      }))
    });
  } catch (e) {
    res.status(500).json({ success: false, error: (e as Error).message });
  }
});

// ==========================================
// STATIC
// ==========================================
const staticPaths = [
  path.join(__dirname, '../../frontend'),
  path.join(__dirname, '../public'),
  path.join(process.cwd(), 'frontend'),
  path.join(process.cwd(), 'public'),
];
let frontendPath = '';
for (const p of staticPaths) {
  if (fs.existsSync(path.join(p, 'index.html'))) { frontendPath = p; break; }
}
if (frontendPath) {
  app.use((req, res, next) => {
    if (req.path === '/' || req.path.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
    next();
  });
  app.use(express.static(frontendPath, {
    maxAge: '1h',
    setHeaders: (res, path) => {
      if (path.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      }
    }
  }));
  // Todas las rutas sirven index.html (landing + app en un solo archivo)
  app.get('*', (_req: Request, res: Response) => {
    res.setHeader('Cache-Control', 'no-store');
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
  console.log(`[STATIC] Frontend: ${frontendPath}`);
} else {
  app.get('/', (_req: Request, res: Response) => {
    res.json({ status: 'AssetPark API v5', message: 'Frontend no disponible' });
  });
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`AssetPark API v5.1.0 en puerto ${PORT}`);
  console.log(`Decision Engine: ${EXECUTORS.length} ejecutoras configuradas`);
  console.log(`Historial: ${Object.keys(historial).length} licitaciones persistidas`);
});
