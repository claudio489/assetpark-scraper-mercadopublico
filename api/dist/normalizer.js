"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeOpportunity = normalizeOpportunity;
function normalizeOpportunity(raw) {
    const now = new Date().toISOString();
    const closing = raw.closingDate ? new Date(raw.closingDate) : null;
    const today = new Date();
    const daysLeft = closing ? Math.ceil((closing.getTime() - today.getTime()) / (864e5)) : 999;
    // Urgencia: 100 si vence en 0 dias, decrece lineal hasta 0 a 90 dias
    const urgency = Math.max(0, Math.min(100, 100 - (daysLeft * 100 / 90)));
    // Complejidad: basada en cantidad de keywords matched (mas palabras = mas complejo)
    const matchedCount = raw.matchedKeywords?.length || 0;
    const complexity = Math.min(100, 20 + matchedCount * 8);
    // Industria: perfil que mejor matchea (primero en lista, o general)
    const industry = raw.profiles?.[0] || raw.profileId || 'general';
    return {
        id: raw.id || '',
        title: raw.title || '',
        description: raw.description || raw.title || '',
        source: 'mercadopublico',
        industry,
        value: raw.amount || 0,
        urgency: Math.round(urgency),
        complexity: Math.round(complexity),
        firstSeen: raw.firstSeen || raw.date || now,
        lastSeen: raw.lastSeen || now,
        closingDate: raw.closingDate || '',
        profiles: raw.profiles || [raw.profileId || 'general'],
        region: raw.region || 'No especificada',
        entity: raw.entity || '',
        category: raw.category || 'General',
        scoreV50: raw.score || 0,
        recommendationV50: raw.recommendation || 'EVALUAR'
    };
}
