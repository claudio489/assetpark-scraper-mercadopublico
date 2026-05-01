"use strict";
// ==========================================
// API - Backend proxy para AssetPark Scraper
// Scrapea MercadoPublico.cl y devuelve datos enriquecidos
// ==========================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
const PORT = process.env.PORT || 3001;
const TICKET = process.env.MP_TICKET || '8BBCAB7E-0911-4E40-BD68-C56A0A33FF78';
const MP_API = 'https://api.mercadopublico.cl/servicios/v1/publico';
// ==========================================
// PROFILES - Con negative keywords (excluded)
// ==========================================
const PROFILES = [
    { id: 'constructora', name: 'Constructora / Obras Civiles', keywords: ['construccion', 'obra civil', 'obra publica', 'infraestructura', 'edificacion', 'puente', 'camino', 'pavimentacion', 'hormigon', 'asfalto', 'movimiento de tierra', 'demolicion', 'excavacion', 'terraplen', 'estructura'], excluded: ['oficina', 'mueble', 'computador', 'impresora', 'papeleria'] },
    { id: 'tecnologia', name: 'TecnologÃ­a / Software / TI', keywords: ['software', 'desarrollo software', 'sistema informatico', 'plataforma digital', 'aplicacion movil', 'ciberseguridad', 'hosting cloud', 'data center', 'red de datos', 'telecomunicaciones'], excluded: ['construccion', 'hormigon', 'asfalto', 'medico', 'hospital'] },
    { id: 'salud', name: 'Salud / Insumos MÃ©dicos', keywords: ['insumos medicos', 'equipamiento medico', 'medicamentos', 'material de curacion', 'material esteril', 'instrumental quirurgico', 'equipo de rayos x', 'tomografo', 'resonancia magnetica'], excluded: ['oficina', 'papeleria', 'computador', 'mueble', 'limpieza'] },
    { id: 'imprenta', name: 'Imprenta / GrÃ¡fica / Publicidad', keywords: ['imprenta', 'impresion offset', 'impresion digital', 'pendon pvc', 'banner publicitario', 'gigantografia', 'letrero luminoso', 'rotulacion vehicular', 'troquelado', 'corte laser', 'vinilo de corte', 'serigrafia'], excluded: ['medico', 'hospital', 'insumos medicos', 'quirurgico'] },
    { id: 'general', name: 'Perfil General', keywords: [], excluded: [] },
    { id: 'buceo', name: 'ImportaciÃ³n Equipo de Buceo', keywords: ['buceo', 'submarino', 'subacuatico', 'buceo tecnico', 'equipo de buceo', 'tanque de buceo', 'regulador de buceo', 'traje de buceo', 'mascara de buceo', 'aletas de buceo', 'buceo profesional', 'buceo industrial', 'escafandra autonoma'], excluded: ['medico', 'hospital', 'insumos medicos', 'paciente', 'quirurgico'] }
];
// ==========================================
// UTILS - HTTP con timeout
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
// ==========================================
// SCRAPER - Lista bÃ¡sica de MercadoPublico
// ==========================================
async function scrapeMercadoPublico(profileKeywords, excludedKeywords = [], limit = 20) {
    try {
        const url = `${MP_API}/licitaciones.json?estado=activas&ticket=${TICKET}`;
        const data = await httpGet(url, 20000);
        if (!data.Listado || !Array.isArray(data.Listado) || data.Listado.length === 0) {
            console.log('[Scraper] API vacia');
            return [];
        }
        let list = data.Listado;
        // Filtrar por keywords positivas
        if (profileKeywords.length > 0) {
            const kw = profileKeywords.map(k => k.toLowerCase());
            list = list.filter((lic) => {
                const text = `${lic.Nombre || ''} ${lic.Descripcion || ''}`.toLowerCase();
                return kw.some(w => text.includes(w));
            });
        }
        // EXCLUIR por keywords negativas (limpiar ruido)
        if (excludedKeywords.length > 0) {
            const ex = excludedKeywords.map(k => k.toLowerCase());
            const before = list.length;
            list = list.filter((lic) => {
                const text = `${lic.Nombre || ''} ${lic.Descripcion || ''}`.toLowerCase();
                return !ex.some(w => text.includes(w));
            });
            const after = list.length;
            if (before > after) {
                console.log(`[Scraper] Excluidas ${before - after} licitaciones por keywords negativas`);
            }
        }
        return list.slice(0, limit).map((lic) => {
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
                url: `https://www.mercadopublico.cl/Procurement/Modules/RFB/fichaLicitacion.html?idLicitacion=${encodeURIComponent(lic.CodigoExterno || '')}`,
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
    const text = (title + ' ' + description).toLowerCase();
    const matched = [];
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
const BUSINESS_CRITERIA = {
    constructora: { minAmount: 10_000_000, optimalAmount: 500_000_000 },
    tecnologia: { minAmount: 2_000_000, optimalAmount: 50_000_000 },
    salud: { minAmount: 5_000_000, optimalAmount: 100_000_000 },
    buceo: { minAmount: 1_000_000, optimalAmount: 10_000_000 },
    imprenta: { minAmount: 500_000, optimalAmount: 20_000_000 },
    general: { minAmount: 100_000, optimalAmount: 1_000_000 }
};
function calculateBusinessScore(amount, profileId) {
    const criteria = BUSINESS_CRITERIA[profileId] || BUSINESS_CRITERIA.general;
    const reasons = [];
    let score = 50;
    if (amount === 0) {
        reasons.push('Monto no visible (licitaciÃ³n activa)');
        score = 40;
    }
    else if (amount < criteria.minAmount) {
        reasons.push(`Monto ${fmtMoney(amount)} estÃ¡ por debajo del mÃ­nimo operativo ${fmtMoney(criteria.minAmount)} para este rubro`);
        score = 15;
    }
    else if (amount >= criteria.optimalAmount) {
        reasons.push(`Monto ${fmtMoney(amount)} supera el Ã³ptimo ${fmtMoney(criteria.optimalAmount)}`);
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
// ==========================================
// PORTFOLIO (in-memory)
// ==================================================
const portfolio = new Map();
const PORTFOLIO_CATEGORIES = ['ConstrucciÃ³n', 'Montaje', 'MantenciÃ³n', 'Suministro EPP', 'Software a la medida'];
function scoreToPriority(score) {
    if (score >= 80)
        return 'alta';
    if (score >= 60)
        return 'media';
    return 'baja';
}
// ==========================================
// ENDPOINTS
// ==========================================
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'assetpark-scraper', version: '3.1.0' });
});
app.get('/api/health/external', async (_req, res) => {
    try {
        const data = await httpGet(`${MP_API}/licitaciones.json?estado=activas&ticket=${TICKET}`, 10000);
        const count = data.Listado?.length || 0;
        res.json({ success: true, mercadoPublico: true, count, message: `Conectado - ${count} activas` });
    }
    catch (err) {
        res.json({ success: false, mercadoPublico: false, message: err.message });
    }
});
app.get('/api/profiles', (_req, res) => {
    res.json({ success: true, profiles: PROFILES });
});
app.get('/api/profile/:id', (req, res) => {
    const p = PROFILES.find(x => x.id === req.params.id);
    if (!p) {
        res.status(404).json({ error: 'No encontrado' });
        return;
    }
    res.json({ success: true, profile: p });
});
// ---- PIPELINE ----
let lastResult = null;
app.post('/api/opportunities/run', async (req, res) => {
    const { profileId = 'general', limit = 20 } = req.body || {};
    const profile = PROFILES.find(p => p.id === profileId) || PROFILES[4];
    console.log(`[API] Pipeline iniciado - perfil: ${profile.id}`);
    try {
        // Timeout global de 30 segundos
        const pipelinePromise = scrapeMercadoPublico(profile.keywords, profile.excluded || [], limit || 50);
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Pipeline timeout')), 30000);
        });
        const raw = await Promise.race([pipelinePromise, timeoutPromise]);
        // Scoring + Business Analysis
        const opportunities = raw.map((op) => {
            const baseSc = calculateScore(op.title, op.description, profile.keywords);
            const bizSc = calculateBusinessScore(op.amount, profile.id);
            // PonderaciÃ³n: 50% base + 50% negocio
            const finalScore = Math.round(baseSc.score * 0.50 + bizSc.score * 0.50);
            let recommendation;
            if (finalScore >= 75 && bizSc.score >= 60)
                recommendation = 'POSTULAR';
            else if (finalScore >= 50 && bizSc.score >= 40)
                recommendation = 'EVALUAR';
            else
                recommendation = 'EVITAR';
            return {
                ...op,
                score: finalScore,
                priority: finalScore >= 80 ? 'alta' : finalScore >= 60 ? 'media' : 'baja',
                matchScore: baseSc.matchScore,
                matchedKeywords: baseSc.matchedKeywords,
                businessScore: bizSc.score,
                businessReasons: bizSc.reasons,
                recommendation
            };
        });
        const stats = {
            total: opportunities.length,
            alta: opportunities.filter((o) => o.priority === 'alta').length,
            media: opportunities.filter((o) => o.priority === 'media').length,
            baja: opportunities.filter((o) => o.priority === 'baja').length,
            averageScore: opportunities.length > 0 ? Math.round(opportunities.reduce((s, o) => s + o.score, 0) / opportunities.length) : 0
        };
        lastResult = { profileId, runAt: new Date().toISOString(), stats, opportunities };
        res.json({ success: true, profileId: profile.id, profileName: profile.name, ...stats, opportunities });
        console.log(`[API] Pipeline OK - ${opportunities.length} oportunidades`);
    }
    catch (error) {
        console.error('[API] Pipeline error:', error.message);
        // Devolver resultado vacio para que el frontend no se quede colgado
        res.json({
            success: true,
            profileId: profile.id,
            profileName: profile.name,
            total: 0, alta: 0, media: 0, baja: 0, averageScore: 0,
            opportunities: [],
            warning: `Error: ${error.message}. MercadoPublico puede estar bloqueando requests desde cloud.`
        });
    }
});
app.get('/api/opportunities', (_req, res) => {
    if (!lastResult) {
        res.json({ success: true, count: 0, opportunities: [], warning: 'Ejecute POST /api/opportunities/run primero' });
        return;
    }
    res.json({ success: true, count: lastResult.opportunities.length, profileId: lastResult.profileId, opportunities: lastResult.opportunities });
});
app.get('/api/opportunities/stats', (_req, res) => {
    if (!lastResult) {
        res.json({ success: true, stats: { total: 0, alta: 0, media: 0, baja: 0, averageScore: 0, postular: 0, evaluar: 0, evitar: 0, totalAmount: 0, amountsByCategory: {} } });
        return;
    }
    const ops = lastResult.opportunities;
    const amountsByCategory = {};
    let totalAmount = 0;
    for (const op of ops) {
        if (op.amount > 0) {
            totalAmount += op.amount;
            const cat = op.category || 'Sin categorÃ­a';
            amountsByCategory[cat] = (amountsByCategory[cat] || 0) + op.amount;
        }
    }
    const stats = {
        total: ops.length,
        alta: ops.filter((o) => o.priority === 'alta').length,
        media: ops.filter((o) => o.priority === 'media').length,
        baja: ops.filter((o) => o.priority === 'baja').length,
        averageScore: ops.length > 0 ? Math.round(ops.reduce((s, o) => s + o.score, 0) / ops.length) : 0,
        postular: ops.filter((o) => o.recommendation === 'POSTULAR').length,
        evaluar: ops.filter((o) => o.recommendation === 'EVALUAR').length,
        evitar: ops.filter((o) => o.recommendation === 'EVITAR').length,
        totalAmount,
        amountsByCategory
    };
    res.json({ success: true, stats });
});
// ---- PORTFOLIO ----
app.get('/api/portfolio', (req, res) => {
    const { category, profileId } = req.query;
    let items = Array.from(portfolio.values()).sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
    if (category && typeof category === 'string')
        items = items.filter((i) => i.category === category);
    if (profileId && typeof profileId === 'string')
        items = items.filter((i) => i.profileId === profileId);
    res.json({ success: true, count: items.length, categories: PORTFOLIO_CATEGORIES, items });
});
app.get('/api/portfolio/stats', (_req, res) => {
    const items = Array.from(portfolio.values());
    const byCategory = {};
    const byPriority = {};
    for (const item of items) {
        byCategory[item.category] = (byCategory[item.category] || 0) + 1;
        byPriority[item.priority] = (byPriority[item.priority] || 0) + 1;
    }
    res.json({ success: true, total: items.length, byCategory, byPriority, averageScore: items.length > 0 ? Math.round(items.reduce((s, i) => s + i.score, 0) / items.length) : 0 });
});
app.post('/api/portfolio', (req, res) => {
    const { opportunity, category, notes, profileId, profileName } = req.body || {};
    if (!opportunity || !opportunity.id) {
        res.status(400).json({ error: 'Falta opportunity.id' });
        return;
    }
    const validCat = PORTFOLIO_CATEGORIES.includes(category) ? category : 'Sin categorÃ­a';
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
app.put('/api/portfolio/:id/score', (req, res) => {
    const item = portfolio.get(req.params.id);
    if (!item) {
        res.status(404).json({ error: 'No encontrado' });
        return;
    }
    const ns = typeof req.body.score === 'number' ? Math.max(0, Math.min(100, req.body.score)) : item.score;
    const updated = { ...item, score: ns, priority: scoreToPriority(ns) };
    portfolio.set(req.params.id, updated);
    res.json({ success: true, item: updated });
});
app.put('/api/portfolio/:id/category', (req, res) => {
    const item = portfolio.get(req.params.id);
    if (!item) {
        res.status(404).json({ error: 'No encontrado' });
        return;
    }
    const validCat = PORTFOLIO_CATEGORIES.includes(req.body.category) ? req.body.category : item.category;
    const updated = { ...item, category: validCat };
    portfolio.set(req.params.id, updated);
    res.json({ success: true, item: updated });
});
app.put('/api/portfolio/:id/profile', (req, res) => {
    const item = portfolio.get(req.params.id);
    if (!item) {
        res.status(404).json({ error: 'No encontrado' });
        return;
    }
    const updated = { ...item, profileId: req.body.profileId || item.profileId, profileName: req.body.profileName || item.profileName };
    portfolio.set(req.params.id, updated);
    res.json({ success: true, item: updated });
});
app.delete('/api/portfolio/:id', (req, res) => {
    if (!portfolio.has(req.params.id)) {
        res.status(404).json({ error: 'No encontrado' });
        return;
    }
    portfolio.delete(req.params.id);
    res.json({ success: true, message: 'Eliminado' });
});
// ==========================================
// STATIC
// ==========================================
app.use(express_1.default.static(path_1.default.join(__dirname, '../../frontend')));
app.get('*', (_req, res) => {
    res.sendFile(path_1.default.join(__dirname, '../../frontend/index.html'));
});
// ==========================================
// START
// ==========================================
app.listen(PORT, () => {
    console.log(`ðŸš€ AssetPark API en puerto ${PORT}`);
    console.log(`ðŸ“‹ /api/health | /api/health/external | /api/profiles | /api/opportunities/run | /api/portfolio/*`);
});
