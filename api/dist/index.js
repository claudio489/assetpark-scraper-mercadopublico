"use strict";
// ==========================================
// API v5.1 - AssetPark Scraper MercadoPublico
// Persistencia historica 30 dias + Novedades + Multi-request + Decision Engine
// ==========================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const decision_1 = require("./decision");
const userActions_1 = require("./userActions");
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
const PORT = parseInt(process.env.PORT || '3001', 10);
const TICKET = process.env.MP_TICKET || '8BBCAB7E-0911-4E40-BD68-C56A0A33FF78';
const MP_API = 'https://api.mercadopublico.cl/servicios/v1/publico';
const DATA_DIR = path_1.default.join(process.cwd(), 'data');
const HIST_FILE = path_1.default.join(DATA_DIR, 'historial.json');
const MAX_HIST_DAYS = 30;
// ---- AUTH CONFIG ----
const JWT_SECRET = process.env.JWT_SECRET || 'assetpark-dev-secret-2024';
const JWT_EXPIRES = '24h';
const USERS_FILE = path_1.default.join(DATA_DIR, 'users.json');
function loadUsers() {
    try {
        if (fs_1.default.existsSync(USERS_FILE)) {
            return JSON.parse(fs_1.default.readFileSync(USERS_FILE, 'utf-8'));
        }
    }
    catch (e) {
        console.error('[AUTH] Error cargando users:', e.message);
    }
    return [];
}
// Asegurar directorio de datos existe
if (!fs_1.default.existsSync(DATA_DIR))
    fs_1.default.mkdirSync(DATA_DIR, { recursive: true });
let historial = {};
function loadHistorial() {
    try {
        if (fs_1.default.existsSync(HIST_FILE)) {
            const raw = fs_1.default.readFileSync(HIST_FILE, 'utf-8');
            historial = JSON.parse(raw);
            const keys = Object.keys(historial);
            console.log(`[HIST] ${keys.length} licitaciones cargadas`);
            // Purge viejas (>30 dias)
            const cutoff = new Date();
            cutoff.setDate(cutoff.getDate() - MAX_HIST_DAYS);
            let purged = 0;
            for (const k of keys) {
                const last = new Date(historial[k].lastSeen);
                if (last < cutoff) {
                    delete historial[k];
                    purged++;
                }
            }
            if (purged > 0) {
                console.log(`[HIST] Purge: ${purged} licitaciones eliminadas (>${MAX_HIST_DAYS} dias)`);
                saveHistorial();
            }
        }
    }
    catch (e) {
        console.log('[HIST] Error cargando:', e.message);
        historial = {};
    }
}
function saveHistorial() {
    try {
        fs_1.default.writeFileSync(HIST_FILE, JSON.stringify(historial, null, 0), 'utf-8');
    }
    catch (e) {
        console.log('[HIST] Error guardando:', e.message);
    }
}
// Cargar al iniciar
loadHistorial();
const PROFILES = [
    { id: 'constructora', name: 'Constructora / Obras Civiles', keywords: ['construccion', 'obra civil', 'obra publica', 'infraestructura', 'edificacion', 'puente', 'camino', 'pavimentacion', 'hormigon', 'asfalto', 'movimiento de tierra', 'demolicion', 'excavacion', 'terraplen', 'estructura', 'tabiqueria', 'terminaciones', 'instalaciones', 'conservacion', 'escuela', 'plaza publica', 'sede comunitaria', 'obra gruesa', 'obra menor', 'reparacion', 'mantencion', 'ampliacion', 'remodelacion', 'climatizacion', 'hvac', 'aire acondicionado', 'calefaccion', 'ventilacion', 'bomba de calor', 'eficiencia energetica', 'inverter', 'refrigeracion', 'calefactor', 'sistema termico', 'ventilacion mecanica', 'sistema hvac', 'montaje industrial', 'estructura metalica', 'silo', 'laboratorio', 'izaje', 'soldadura certificada', 'torque controlado', 'andamio', 'andamio multidireccional', 'estructura gran porte', 'montaje estructural', 'cmpc', 'celulosa', 'industria forestal', 'planta industrial', 'bodega', 'galpon', 'centro distribucion', 'parque industrial', 'caminos'], excluded: ['medico', 'hospital', 'insumos medicos', 'quirurgico', 'material esteril', 'instrumental quirurgico', 'equipamiento medico', 'medicamentos', 'oficina', 'mueble', 'computador', 'impresora', 'papeleria', 'software', 'mobiliario', 'silla oficina', 'escritorio', 'servicio transporte', 'seguro', 'consultoria juridica', 'estudio contable', 'servicio limpieza', 'servicio vigilancia', 'arriendo vehiculo', 'servicio de buffet', 'alimentacion', 'catering', 'buceo', 'submarino', 'deporte acuatico', 'equipo de buceo', 'imprenta', 'impresion offset', 'banner publicitario', 'pendon pvc', 'desarrollo software', 'aplicacion movil', 'ciberseguridad', 'plataforma digital'], regions: ['Maule', 'Biobio', 'Araucania'], minAmount: 100000000, maxAmount: 500000000 },
    { id: 'tecnologia', name: 'Tecnologia / Software / TI', keywords: ['software', 'desarrollo software', 'sistema informatico', 'plataforma digital', 'aplicacion movil', 'ciberseguridad', 'hosting cloud', 'data center', 'red de datos', 'telecomunicaciones'], excluded: ['construccion', 'hormigon', 'asfalto', 'medico', 'hospital'] },
    { id: 'salud', name: 'Salud / Insumos Medicos', keywords: ['insumos medicos', 'equipamiento medico', 'medicamentos', 'material de curacion', 'material esteril', 'instrumental quirurgico', 'equipo de rayos x', 'tomografo', 'resonancia magnetica'], excluded: ['oficina', 'papeleria', 'computador', 'mueble', 'limpieza'] },
    { id: 'imprenta', name: 'Imprenta / Grafica / Publicidad', keywords: ['imprenta', 'impresion offset', 'impresion digital', 'pendon pvc', 'banner publicitario', 'gigantografia', 'letrero luminoso', 'rotulacion vehicular', 'troquelado', 'corte laser', 'vinilo de corte', 'serigrafia'], excluded: ['medico', 'hospital', 'insumos medicos', 'quirurgico'] },
    { id: 'hormigon', name: 'Preformado de Hormigon', keywords: ['hormigon preformado', 'concreto preformado', 'concreto prefabricado', 'tubos hormigon', 'tubos concreto', 'postes hormigon', 'postes concreto', 'postes prefabricados', 'vigas hormigon', 'vigas concreto', 'vigas prefabricadas', 'losas hormigon', 'losas concreto', 'bordillos hormigon', 'bordillos concreto', 'bordillos prefabricados', 'bovedilla', 'bovedillas', 'arqueta', 'arquetas', 'camara inspeccion', 'camara inspeccion hormigon', 'placas concreto', 'paneles prefabricados', 'adoquines hormigon', 'bloques hormigon', 'bloques concreto', 'concreto premoldeado', 'elementos premoldeados', 'elementos preformados', 'vibrado de hormigon', 'encofrados', 'hormigon presforzado', 'piezas concreto', 'estructuras prefabricadas'], excluded: ['pavimentacion', 'pavimento', 'intertrabado', 'adoquinado', 'baldosas ceramicas', 'veredas', 'aceras', 'cunetas', 'base granular', 'asfalto', 'mejoramiento camino', 'conservacion camino', 'reparacion camino', 'asfaltica', 'riego', 'jardineria', 'mobiliario urbano', 'senalizacion', 'demarcacion', 'oficina', 'mueble', 'computador', 'impresora', 'papeleria', 'software', 'camara fotografica'] },
    { id: 'pallets', name: 'Pallets / Logistica / Almacenaje', keywords: ['pallet', 'palet', 'pallets', 'palletizado', 'palletizacion', 'estiba', 'estibado', 'estibar', 'transporte de carga', 'almacenaje', 'logistica', 'cadena de suministro', 'distribucion', 'carga y descarga', 'embalaje', 'envase', 'contenedor', 'sku', 'inventario', 'bodega', 'galpon logistico', 'centro de distribucion', 'manipulacion de carga', 'montacargas', 'elevador', 'conveyor', 'conveyors', 'transportador', 'racking', 'rack', 'anaquel', 'almacenamiento', 'despacho', 'fulfillment', 'cross docking', 'embalaje industrial', 'caja de carton', 'carton corrugado', 'exportacion', 'importacion', 'aduana', 'puerto', 'terminal portuaria', 'transporte terrestre', 'camion', 'flota vehicular', 'flete', 'fletamento', 'consolidacion de carga', 'desconsolidacion'], excluded: ['medico', 'hospital', 'insumos medicos', 'quirurgico', 'software', 'desarrollo software', 'aplicacion movil', 'consultoria juridica', 'estudio contable', 'seguro'] },
    { id: 'general', name: 'Perfil General', keywords: [], excluded: [] },
    { id: 'buceo', name: 'Importacion Equipo de Buceo', keywords: ['buceo', 'submarino', 'subacuatico', 'buceo tecnico', 'equipo de buceo', 'tanque de buceo', 'regulador de buceo', 'traje de buceo', 'mascara de buceo', 'aletas de buceo', 'buceo profesional', 'buceo industrial', 'escafandra autonoma'], excluded: ['medico', 'hospital', 'insumos medicos', 'paciente', 'quirurgico'] }
];
// ==========================================
// UTILS
// ==========================================
function httpGet(url, timeoutMs = 20000) {
    return new Promise((resolve, reject) => {
        const https = require('https');
        const req = https.get(url, { headers: { 'User-Agent': 'AssetPark-Scraper/1.0' } }, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                }
                catch (e) {
                    reject(new Error('JSON invalido'));
                }
            });
        });
        req.on('error', (e) => reject(e));
        req.setTimeout(timeoutMs, () => { req.destroy(); reject(new Error('Timeout HTTP')); });
    });
}
function parseRegion(regionRaw) {
    if (!regionRaw)
        return 'No especificada';
    return regionRaw.replace(/^Region\s*/i, '').replace(/^del?\s*/i, '').replace(/^de\s*/i, '').trim();
}
function fmtAmount(amount) {
    if (!amount || amount <= 0)
        return 'No disp.';
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(amount);
}
function formatDateMP(d) {
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}${mm}${yyyy}`;
}
// Batch promises: ejecuta N promesas en paralelo, espera, sigue con las siguientes N
async function batchPromises(promises, batchSize) {
    const results = [];
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
async function fetchActivasByDate(fechaStr, ticket) {
    try {
        const url = fechaStr
            ? `${MP_API}/licitaciones.json?fecha=${fechaStr}&estado=activas&ticket=${ticket}`
            : `${MP_API}/licitaciones.json?estado=activas&ticket=${ticket}`;
        const data = await httpGet(url, 20000);
        return data.Listado || [];
    }
    catch {
        return [];
    }
}
async function scrapeMercadoPublico(profileKeywords, excludedKeywords = [], limit = 50) {
    try {
        const requests = [];
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
        const seen = new Set();
        let combined = [];
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
            combined = combined.filter((lic) => {
                const text = `${lic.Nombre || ''} ${lic.Descripcion || ''}`.toLowerCase();
                return kw.some(w => text.includes(w));
            });
            console.log(`[Scraper] Keywords: ${before} -> ${combined.length}`);
        }
        // Excluir por keywords negativas
        if (excludedKeywords.length > 0) {
            const ex = excludedKeywords.map(k => k.toLowerCase());
            const before = combined.length;
            combined = combined.filter((lic) => {
                const text = `${lic.Nombre || ''} ${lic.Descripcion || ''}`.toLowerCase();
                return !ex.some(w => text.includes(w));
            });
            if (before > combined.length) {
                console.log(`[Scraper] Excluidas: ${before - combined.length}`);
            }
        }
        return combined.slice(0, limit).map((lic) => {
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
    }
    catch (err) {
        console.log('[Scraper] Error:', err.message);
        return [];
    }
}
// ==========================================
// SCORING
// ==========================================
function calculateScore(title, description, keywords) {
    if (keywords.length === 0) {
        return { score: 50, priority: 'media', matchedKeywords: ['General'], matchScore: 50 };
    }
    const text = (title + ' ' + description).toLowerCase();
    const matched = [];
    for (const k of keywords) {
        if (text.includes(k.toLowerCase()))
            matched.push(k);
    }
    const matchRate = keywords.length > 0 ? matched.length / keywords.length : 0;
    let score = Math.round(matchRate * 100);
    if (matched.length > 0 && matched.length < keywords.length) {
        score = Math.min(100, score + 12);
    }
    const priority = score >= 80 ? 'alta' : score >= 60 ? 'media' : 'baja';
    return { score, priority, matchedKeywords: matched, matchScore: score };
}
const BUSINESS_CRITERIA = {
    constructora: { minAmount: 3_000_000, optimalAmount: 150_000_000 },
    tecnologia: { minAmount: 2_000_000, optimalAmount: 50_000_000 },
    salud: { minAmount: 5_000_000, optimalAmount: 100_000_000 },
    buceo: { minAmount: 1_000_000, optimalAmount: 10_000_000 },
    imprenta: { minAmount: 500_000, optimalAmount: 20_000_000 },
    hormigon: { minAmount: 1_000_000, optimalAmount: 30_000_000 },
    pallets: { minAmount: 500_000, optimalAmount: 15_000_000 },
    general: { minAmount: 100_000, optimalAmount: 1_000_000 }
};
function calculateBusinessScore(amount, profileId) {
    const criteria = BUSINESS_CRITERIA[profileId] || BUSINESS_CRITERIA.general;
    const reasons = [];
    let score = 50;
    if (amount === 0) {
        reasons.push('Monto oculto en licitacion activa — revisar en ficha de MercadoPublico');
        score = 60;
    }
    else if (amount < criteria.minAmount) {
        reasons.push(`Monto ${fmtMoney(amount)} esta por debajo del minimo operativo ${fmtMoney(criteria.minAmount)} para este rubro`);
        score = 20;
    }
    else if (amount >= criteria.optimalAmount) {
        reasons.push(`Monto ${fmtMoney(amount)} supera el optimo ${fmtMoney(criteria.optimalAmount)}`);
        score = 95;
    }
    else {
        const ratio = (amount - criteria.minAmount) / (criteria.optimalAmount - criteria.minAmount);
        score = 50 + Math.round(ratio * 45);
        reasons.push(`Monto ${fmtMoney(amount)} dentro de rango operativo`);
    }
    return { score: Math.min(100, score), reasons };
}
function fmtMoney(n) {
    if (n >= 1_000_000_000)
        return `$${(n / 1_000_000_000).toFixed(1)} mil millones`;
    if (n >= 1_000_000)
        return `$${Math.round(n / 1_000_000)} millones`;
    if (n >= 1_000)
        return `$${Math.round(n / 1_000)} mil`;
    return `$${n}`;
}
function scoreToPriority(score) {
    if (score >= 80)
        return 'alta';
    if (score >= 60)
        return 'media';
    return 'baja';
}
// ==========================================
// PORTFOLIO (in-memory)
// ==========================================
const portfolio = new Map();
const PORTFOLIO_CATEGORIES = ['Construccion', 'Montaje', 'Mantencion', 'Suministro EPP', 'Software a la medida'];
// ==========================================
// ENDPOINTS
// ==========================================
app.get('/api/health', (_req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    const histKeys = Object.keys(historial);
    res.json({ status: 'ok', service: 'assetpark-scraper', version: '5.1.0', historialSize: histKeys.length, decisionEngine: true });
});
app.get('/api/health/external', async (_req, res) => {
    try {
        const data = await httpGet(`${MP_API}/licitaciones.json?estado=activas&ticket=${TICKET}`, 10000);
        res.setHeader('Cache-Control', 'no-store');
        res.json({ success: true, mercadoPublico: true, count: data.Listado?.length || 0 });
    }
    catch (err) {
        res.setHeader('Cache-Control', 'no-store');
        res.json({ success: false, message: err.message });
    }
});
app.get('/api/profiles', (_req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.json({ success: true, profiles: PROFILES });
});
// ---- AUTH MIDDLEWARE (soft mode) ----
function authMiddleware(req, res, next) {
    try {
        const authHeader = req.headers['authorization'] || req.headers['Authorization'];
        if (!authHeader)
            return next();
        const token = authHeader.replace(/^Bearer\s+/i, '');
        if (!token)
            return next();
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        if (decoded && decoded.id) {
            req.user = { id: decoded.id, email: decoded.email, profile: decoded.profile, name: decoded.name };
        }
    }
    catch (e) { /* token invalido = anonimo */ }
    next();
}
// ---- IN-MEMORY EXCLUSIONS (survives Render tmpfs issues) ----
const hiddenIds = [];
function getActions() { return { hidden: hiddenIds, saved: [] }; }
function hideOpportunity(id) { if (!hiddenIds.includes(id)) hiddenIds.push(id); return true; }
function restoreOpportunity(id) { const i = hiddenIds.indexOf(id); if (i >= 0) hiddenIds.splice(i, 1); return true; }
// Override userActions module functions
try { require('./userActions').getActions = getActions; } catch(e){}

app.use(authMiddleware);
// ---- AUTH ENDPOINTS ----
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password) {
        res.status(400).json({ success: false, error: 'Falta email o password' });
        return;
    }
    const users = loadUsers();
    const user = users.find((u) => u.email === email);
    if (!user || !bcryptjs_1.default.compareSync(password, user.password)) {
        res.status(401).json({ success: false, error: 'Credenciales invalidas' });
        return;
    }
    const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email, profile: user.profile, name: user.name }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
    res.setHeader('Cache-Control', 'no-store');
    res.json({ success: true, token, profile: user.profile, name: user.name });
});
app.post('/api/auth/logout', (_req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.json({ success: true, message: 'Logout OK - elimina el token en el cliente' });
});
app.get('/api/auth/me', (req, res) => {
    if (!req.user) {
        res.status(401).json({ success: false, error: 'No autenticado' });
        return;
    }
    res.setHeader('Cache-Control', 'no-store');
    res.json({ success: true, user: req.user });
});
// ---- PIPELINE ----
let lastResult = null;
app.post('/api/opportunities/run', async (req, res) => {
    const effectiveProfileId = req.user ? (req.user.profile === 'general' ? (req.body?.profileId || 'general') : req.user.profile) : (req.body?.profileId || 'general');
    const { limit = 50 } = req.body || {};
    const profile = PROFILES.find(p => p.id === effectiveProfileId) || PROFILES[4];
    const now = new Date().toISOString();
    console.log(`[API] Pipeline v5 - perfil: ${profile.id}, limit: ${limit}`);
    try {
        const pipelinePromise = scrapeMercadoPublico(profile.keywords, profile.excluded || [], limit || 50);
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Pipeline timeout')), 60000); // 60s para 31 requests
        });
        const raw = await Promise.race([pipelinePromise, timeoutPromise]);
        // Scoring
        const opportunities = raw.map((op) => {
            const baseSc = calculateScore(op.title, op.description, profile.keywords);
            const bizSc = calculateBusinessScore(op.amount, profile.id);
            const finalScore = Math.round(baseSc.score * 0.60 + bizSc.score * 0.40);
            // Nuevo sistema de recomendacion: solo POSTULAR / EVALUAR / REVISION
            // EVITAR eliminado porque genera rechazo en clientes
            let recommendation;
            if (finalScore >= 60)
                recommendation = 'POSTULAR';
            else if (finalScore >= 35)
                recommendation = 'EVALUAR';
            else
                recommendation = 'REVISION'; // antes era EVITAR - ahora es "revisar con cuidado"
            // Perfil General: todo EVALUAR para que el usuario decida manualmente
            if (effectiveProfileId === 'general')
                recommendation = 'EVALUAR';
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
                v5: {}
            };
            // Agregar analisis Decision Engine (solo si hay ejecutoras configuradas)
            try {
                const normalized = (0, decision_1.normalizeOpportunity)({ ...scored, profileId: effectiveProfileId });
                const decision = (0, decision_1.analyzeOpportunity)(normalized, decision_1.EXECUTORS);
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
            }
            catch (e) {
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
            }
            else {
                existing.lastSeen = now;
                existing.status = op.status;
                existing.closingDate = op.closingDate;
                if (!existing.profiles.includes(effectiveProfileId))
                    existing.profiles.push(effectiveProfileId);
            }
            return scored;
        });
        saveHistorial();
        // Detectar novedades (aparecidas en las ultimas 24h)
        const hace24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const novedades = opportunities.filter((o) => {
            const entry = historial[o.id];
            return entry && entry.firstSeen >= hace24h;
        });
        const actions = getActions();
        const hiddenCount = actions.hidden.length;
        const activeOps = opportunities.filter((o) => !actions.hidden.includes(o.id));
        const stats = {
            total: activeOps.length,
            alta: activeOps.filter((o) => o.priority === 'alta').length,
            media: activeOps.filter((o) => o.priority === 'media').length,
            baja: activeOps.filter((o) => o.priority === 'baja').length,
            novedades: novedades.length,
            historialTotal: Object.keys(historial).length,
            excluidas: hiddenCount
        };
        const opsWithSaved = activeOps.map((o) => ({
            ...o,
            isSaved: actions.saved.some((s) => s.id === o.id)
        }));
        lastResult = { profileId: effectiveProfileId, runAt: now, stats, opportunities: opsWithSaved };
        res.setHeader('Cache-Control', 'no-store');
        res.json({ success: true, profileId: profile.id, profileName: profile.name, ...stats, opportunities: opsWithSaved });
        console.log(`[API] Pipeline OK - ${activeOps.length}/${opportunities.length} activas (${hiddenCount} no-aplica), ${novedades.length} novedades, ${actions.saved.length} guardadas`);
    }
    catch (error) {
        console.error('[API] Pipeline error:', error.message);
        res.setHeader('Cache-Control', 'no-store');
        res.json({ success: false, error: error.message });
    }
});
app.get('/api/opportunities', (_req, res) => {
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
app.get('/api/opportunities/demo', (_req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    const stats = {
        total: DEMO_OPPORTUNITIES.length,
        alta: DEMO_OPPORTUNITIES.filter((o) => o.priority === 'alta').length,
        media: DEMO_OPPORTUNITIES.filter((o) => o.priority === 'media').length,
        baja: DEMO_OPPORTUNITIES.filter((o) => o.priority === 'baja').length,
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
app.get('/api/opportunities/historial', (req, res) => {
    const { profileId, search, days = '30' } = req.query;
    const maxDays = parseInt(days) || 30;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - maxDays);
    let items = Object.values(historial)
        .filter((h) => new Date(h.lastSeen) >= cutoff)
        .sort((a, b) => new Date(b.firstSeen).getTime() - new Date(a.firstSeen).getTime());
    if (profileId && typeof profileId === 'string') {
        items = items.filter((h) => h.profiles && h.profiles.includes(profileId));
    }
    if (search && typeof search === 'string') {
        const s = search.toLowerCase();
        items = items.filter((h) => (h.title || '').toLowerCase().includes(s) ||
            (h.entity || '').toLowerCase().includes(s) ||
            (h.region || '').toLowerCase().includes(s));
    }
    res.setHeader('Cache-Control', 'no-store');
    res.json({ success: true, count: items.length, maxDays, items });
});
// ---- NOVEDADES (ultimas 24h) ----
app.get('/api/opportunities/novedades', (_req, res) => {
    const hace24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const items = Object.values(historial)
        .filter((h) => h.firstSeen >= hace24h)
        .sort((a, b) => new Date(b.firstSeen).getTime() - new Date(a.firstSeen).getTime());
    res.setHeader('Cache-Control', 'no-store');
    res.json({ success: true, count: items.length, periodo: '24h', items });
});
// ---- POR VENCER (cierran en 7 dias) ----
app.get('/api/opportunities/vencer', (_req, res) => {
    const hoy = new Date();
    const en7dias = new Date();
    en7dias.setDate(en7dias.getDate() + 7);
    const items = Object.values(historial)
        .filter((h) => {
        if (!h.closingDate)
            return false;
        const cierre = new Date(h.closingDate);
        return cierre >= hoy && cierre <= en7dias;
    })
        .sort((a, b) => new Date(a.closingDate).getTime() - new Date(b.closingDate).getTime());
    res.setHeader('Cache-Control', 'no-store');
    res.json({ success: true, count: items.length, periodo: '7 dias', items });
});
app.get('/api/opportunities/stats', (_req, res) => {
    const ops = lastResult?.opportunities || [];
    const amountsByCategory = {};
    let totalAmount = 0;
    for (const op of ops) {
        if (op.amount > 0) {
            totalAmount += op.amount;
            amountsByCategory[op.category || 'Sin categoria'] = (amountsByCategory[op.category || 'Sin categoria'] || 0) + op.amount;
        }
    }
    const hace24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    res.setHeader('Cache-Control', 'no-store');
    res.json({
        success: true,
        stats: {
            total: ops.length,
            alta: ops.filter((o) => o.priority === 'alta').length,
            media: ops.filter((o) => o.priority === 'media').length,
            baja: ops.filter((o) => o.priority === 'baja').length,
            postular: ops.filter((o) => o.recommendation === 'POSTULAR').length,
            evaluar: ops.filter((o) => o.recommendation === 'EVALUAR').length,
            evitar: ops.filter((o) => o.recommendation === 'EVITAR').length,
            totalAmount,
            amountsByCategory,
            historialTotal: Object.keys(historial).length,
            novedades24h: Object.values(historial).filter((h) => h.firstSeen >= hace24h).length
        }
    });
});
// ---- USER ACTIONS (Hide / Save) ----
app.get('/api/opportunities/actions', (req, res) => {
    const actions = getActions();
    res.setHeader('Cache-Control', 'no-store');
    res.json({ success: true, hidden: actions.hidden, saved: actions.saved });
});
app.post('/api/opportunities/:id/hide', (req, res) => {
    const { id } = req.params;
    const profileId = req.body?.profileId || req.query?.profileId || 'general';
    const visibleIds = req.body?.visibleIds || [];
    hideOpportunity(id);
    const actions = getActions();
    const allEntries = Object.values(historial);
    const candidates = allEntries.filter((h) => {
        if (actions.hidden.includes(h.id)) return false;
        if (h.id === id) return false;
        if (visibleIds.includes(h.id)) return false;
        if (!h.profiles || !h.profiles.includes(profileId)) return false;
        return true;
    });
    const replacement = candidates.length > 0
        ? candidates[Math.floor(Math.random() * candidates.length)]
        : null;
    res.setHeader('Cache-Control', 'no-store');
    res.json({ success: true, message: 'No aplica', replacement: replacement || null });
});
app.post('/api/opportunities/hide-batch', (req, res) => {
    const { ids, profileId } = req.body || {};
    if (!Array.isArray(ids) || ids.length === 0) {
        res.status(400).json({ success: false, error: 'ids requerido' });
        return;
    }
    const effectiveProfileId = profileId || 'general';
    const visibleIds = req.body?.visibleIds || [];
    // Ocultar todas
    for (const id of ids) {
        hideOpportunity(id);
    }
    // Buscar reemplazos (uno por cada eliminada)
    const actions = getActions();
    const allEntries = Object.values(historial);
    const replacements = [];
    for (const id of ids) {
        const candidates = allEntries.filter((h) => {
            if (actions.hidden.includes(h.id)) return false;
            if (h.id === id) return false;
            if (visibleIds.includes(h.id)) return false;
            if (replacements.some(r => r.id === h.id)) return false;
            if (!h.profiles || !h.profiles.includes(effectiveProfileId)) return false;
            return true;
        });
        if (candidates.length > 0) {
            replacements.push(candidates[Math.floor(Math.random() * candidates.length)]);
        }
    }
    res.setHeader('Cache-Control', 'no-store');
    res.json({ success: true, message: ids.length + ' licitaciones ocultadas', replacements });
});
app.post('/api/opportunities/:id/restore', (req, res) => {
    const { id } = req.params;
    restoreOpportunity(id);
    res.setHeader('Cache-Control', 'no-store');
    res.json({ success: true, message: 'Restaurada' });
});
app.post('/api/opportunities/:id/save', (req, res) => {
    const { id } = req.params;
    const { title, entity, amount, closingDate, url, recommendation, score } = req.body || {};
    (0, userActions_1.saveOpportunity)({ id, title, entity, amount, closingDate, url, recommendation, score });
    res.setHeader('Cache-Control', 'no-store');
    res.json({ success: true, message: 'Guardada' });
});
app.delete('/api/opportunities/:id/save', (req, res) => {
    const { id } = req.params;
    (0, userActions_1.removeSaved)(id);
    res.setHeader('Cache-Control', 'no-store');
    res.json({ success: true, message: 'Eliminada de guardadas' });
});
// ---- CUBICADOR DYG ----
app.get('/api/cubicador/licitaciones', (req, res) => {
    // Solo perfil constructora
    const profile = PROFILES.find(p => p.id === 'constructora');
    if (!profile) {
        res.status(404).json({ success: false, error: 'Perfil constructora no encontrado' });
        return;
    }
    const { opportunities = [] } = lastResult || {};
    const visible = opportunities.map((o) => ({
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
        isSaved: actions.saved.some((s) => s.id === o.id)
    }));
    res.setHeader('Cache-Control', 'no-store');
    res.json({ success: true, count: visible.length, licitaciones: visible });
});
// Generar URL precargada para cubicador
app.get('/api/cubicador/:id/precargar', (req, res) => {
    const { id } = req.params;
    const { opportunities = [] } = lastResult || {};
    const o = opportunities.find((x) => x.id === id);
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
app.get('/api/portfolio', (req, res) => {
    const { category, profileId } = req.query;
    let items = Array.from(portfolio.values()).sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
    if (category && typeof category === 'string')
        items = items.filter((i) => i.category === category);
    if (profileId && typeof profileId === 'string')
        items = items.filter((i) => i.profileId === profileId);
    res.setHeader('Cache-Control', 'no-store');
    res.json({ success: true, count: items.length, categories: PORTFOLIO_CATEGORIES, items });
});
app.post('/api/portfolio', (req, res) => {
    const { opportunity, category, notes, profileId, profileName } = req.body || {};
    if (!opportunity || !opportunity.id) {
        res.status(400).json({ error: 'Falta opportunity.id' });
        return;
    }
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
app.delete('/api/portfolio/:id', (req, res) => {
    if (!portfolio.has(req.params.id)) {
        res.status(404).json({ error: 'No encontrado' });
        return;
    }
    portfolio.delete(req.params.id);
    res.setHeader('Cache-Control', 'no-store');
    res.json({ success: true, message: 'Eliminado' });
});
// ==========================================
// DECISION ENGINE v5.1 ENDPOINTS (nuevos, opcionales)
// No rompen compatibilidad con v5.0
// ==========================================
app.get('/api/decision/executors', (_req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.json({ success: true, count: decision_1.EXECUTORS.length, executors: decision_1.EXECUTORS });
});
app.post('/api/decision/analyze', (req, res) => {
    const { opportunity } = req.body || {};
    if (!opportunity) {
        res.status(400).json({ error: 'Falta opportunity en body' });
        return;
    }
    try {
        const normalized = (0, decision_1.normalizeOpportunity)({ ...opportunity, profileId: opportunity.profileId || 'general' });
        const decision = (0, decision_1.analyzeOpportunity)(normalized, decision_1.EXECUTORS);
        const best = (0, decision_1.getBestExecutor)(normalized, decision_1.EXECUTORS);
        res.setHeader('Cache-Control', 'no-store');
        res.json({
            success: true,
            opportunityId: opportunity.id,
            decision,
            bestExecutor: best.executor ? { id: best.executor.id, name: best.executor.name, type: best.executor.type } : null,
            allExecutors: decision_1.EXECUTORS.map(ex => {
                const fit = (0, decision_1.analyzeOpportunity)(normalized, [ex]);
                return { id: ex.id, fitScore: fit.fitScore, decision: fit.decision };
            }).sort((a, b) => b.fitScore - a.fitScore)
        });
    }
    catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});
app.post('/api/decision/rank', (req, res) => {
    const { opportunities, topN = 20 } = req.body || {};
    if (!Array.isArray(opportunities)) {
        res.status(400).json({ error: 'Falta opportunities[] en body' });
        return;
    }
    try {
        const normalized = opportunities.map((op) => (0, decision_1.normalizeOpportunity)({ ...op, profileId: op.profileId || 'general' }));
        const ranked = (0, decision_1.rankOpportunities)(normalized, decision_1.EXECUTORS, topN);
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
    }
    catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});
// ==========================================
// STATIC
// ==========================================
const staticPaths = [
    path_1.default.join(__dirname, '../../frontend'),
    path_1.default.join(__dirname, '../public'),
    path_1.default.join(process.cwd(), 'frontend'),
    path_1.default.join(process.cwd(), 'public'),
];
let frontendPath = '';
for (const p of staticPaths) {
    if (fs_1.default.existsSync(path_1.default.join(p, 'index.html'))) {
        frontendPath = p;
        break;
    }
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
    app.use(express_1.default.static(frontendPath, {
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
    app.get('*', (_req, res) => {
        res.setHeader('Cache-Control', 'no-store');
        res.sendFile(path_1.default.join(frontendPath, 'index.html'));
    });
    console.log(`[STATIC] Frontend: ${frontendPath}`);
}
else {
    app.get('/', (_req, res) => {
        res.json({ status: 'AssetPark API v5', message: 'Frontend no disponible' });
    });
}
app.listen(PORT, "0.0.0.0", () => {
    console.log(`AssetPark API v5.1.0 en puerto ${PORT}`);
    console.log(`Decision Engine: ${decision_1.EXECUTORS.length} ejecutoras configuradas`);
    console.log(`Historial: ${Object.keys(historial).length} licitaciones persistidas`);
});
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            