"use strict";
// ==========================================
// API REST - Licitaciones Intelligence
// Endpoints simples, sin auth, sin tRPC, sin sesiones
// ==========================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
exports.startServer = startServer;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dist_1 = require("../../engine/dist");
const app = (0, express_1.default)();
exports.app = app;
const PORT = parseInt(process.env.PORT || '3001', 10);
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Cache en memoria de la Ãºltima ejecuciÃ³n
let lastRunResult = null;
let activeProfileId = 'tecnologia';
// ==========================================
// ENDPOINTS
// ==========================================
/**
 * GET /api/opportunities
 * Retorna las licitaciones enriquecidas de la Ãºltima ejecuciÃ³n
 * Query params: ?profileId=string&priority=alta|media|baja
 */
app.get('/api/opportunities', (req, res) => {
    const { profileId, priority } = req.query;
    const targetProfile = profileId
        ? (0, dist_1.getProfile)(profileId)
        : (0, dist_1.getProfile)(activeProfileId);
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
app.get('/api/opportunities/stats', (req, res) => {
    if (!lastRunResult) {
        res.status(400).json({ error: 'No hay datos. Ejecute POST /api/opportunities/run primero.' });
        return;
    }
    const stats = (0, dist_1.calculateStats)(lastRunResult.opportunities);
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
app.post('/api/opportunities/run', async (req, res) => {
    const { profileId, limit } = req.body || {};
    const targetId = profileId || activeProfileId;
    const profile = (0, dist_1.getProfile)(targetId);
    if (!profile) {
        res.status(404).json({
            error: `Profile '${targetId}' no encontrado`,
            availableProfiles: (0, dist_1.listProfiles)().map(p => ({ id: p.id, name: p.name }))
        });
        return;
    }
    activeProfileId = targetId;
    try {
        const result = await (0, dist_1.runPipeline)({
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
    }
    catch (error) {
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
app.get('/api/profiles', (_req, res) => {
    const profiles = (0, dist_1.listProfiles)();
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
app.post('/api/profiles', (req, res) => {
    const profile = req.body;
    if (!profile.id || !profile.name) {
        res.status(400).json({ error: 'Se requiere id y name' });
        return;
    }
    const saved = (0, dist_1.saveProfile)(profile);
    res.json({ success: true, profile: saved });
});
/**
 * Health check
 */
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'licitaciones-intelligence-api', version: '1.0.0' });
});
// ==========================================
// START
// ==========================================
function startServer() {
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
// Arrancar servidor cuando este archivo se ejecuta directamente
startServer();
