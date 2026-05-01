"use strict";
// ==========================================
// NORMALIZER - Conversión a formato estándar
// ==========================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeOpportunities = normalizeOpportunities;
exports.normalizeSingle = normalizeSingle;
function normalizeOpportunities(raw) {
    return raw.map(normalizeSingle);
}
function normalizeSingle(raw) {
    return {
        id: raw.codigo?.trim() || generateId(),
        title: sanitizeText(raw.nombre),
        entity: sanitizeText(raw.organismo),
        region: sanitizeRegion(raw.region),
        amount: normalizeAmount(raw.monto),
        source: raw.fuente || 'Desconocida',
        url: raw.url || `https://www.mercadopublico.cl/Licitation/Details/${raw.codigo}`,
        date: raw.fecha_publicacion || new Date().toISOString().split('T')[0],
        status: raw.estado || 'Publicada',
        category: raw.categoria || 'General',
        description: sanitizeText(raw.descripcion),
        raw
    };
}
function generateId() {
    return `GEN-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}
function sanitizeText(input) {
    if (!input)
        return '';
    return input
        .replace(/\s+/g, ' ')
        .replace(/[\r\n\t]/g, ' ')
        .trim();
}
function sanitizeRegion(region) {
    if (!region)
        return 'No especificada';
    const regionMap = {
        'metropolitana': 'Metropolitana',
        'valparaiso': 'Valparaíso',
        'valparaíso': 'Valparaíso',
        'maule': 'Maule',
        'biobio': 'Biobío',
        'biobío': 'Biobío',
        'antofagasta': 'Antofagasta',
        'araucania': 'Araucanía',
        'araucanía': 'Araucanía',
        'tarapaca': 'Tarapacá',
        'tarapacá': 'Tarapacá',
        'atacama': 'Atacama',
        'coquimbo': 'Coquimbo',
        'ohiggins': "O'Higgins",
        "o'higgins": "O'Higgins",
        'los lagos': 'Los Lagos',
        'aysen': 'Aysén',
        'aysén': 'Aysén',
        'magallanes': 'Magallanes'
    };
    const normalized = region.toLowerCase().trim();
    return regionMap[normalized] || region.charAt(0).toUpperCase() + region.slice(1);
}
function normalizeAmount(amount) {
    if (amount === undefined || amount === null)
        return 0;
    if (typeof amount === 'number')
        return amount;
    // Limpiar strings: "$ 1.234.567,89" → 1234567.89
    const cleaned = amount
        .toString()
        .replace(/\$/g, '')
        .replace(/\./g, '')
        .replace(/,/g, '.')
        .replace(/\s/g, '')
        .trim();
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
}
