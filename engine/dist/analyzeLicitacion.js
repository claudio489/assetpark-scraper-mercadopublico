"use strict";
// ==========================================
// ANALYZER — Analiza texto de bases licitación
// ==========================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeLicitacion = analyzeLicitacion;
const RIESGO_INDICATORS = {
    alto: ['garantia de seriedad', 'garantia de cumplimiento', 'garantia de anticipo', 'garantia de oferta', 'seguro de caucion', 'fianza', 'aval', 'contrato marco', 'plazo de entrega 24 horas', 'plazo de entrega inmediato'],
    medio: ['garantia', 'experiencia minima', 'referencias comerciales', 'visita tecnica obligatoria', 'muestra previa', 'certificacion', 'homologacion'],
    bajo: []
};
const COMPLEJIDAD_INDICATORS = {
    alta: ['ingenieria detallada', 'proyecto llave en mano', 'diseño propio', 'fabricacion a medida', 'instalacion incluida', 'puesta en marcha', 'capacitacion obligatoria', 'mantencion post venta 12 meses'],
    media: ['instalacion', 'capacitacion', 'manual de operacion', 'soporte tecnico', 'repuestos'],
    baja: ['entrega en bodega', 'producto estandar', 'sin instalacion', 'soporte telefonico']
};
function countMatches(text, keywords) {
    const t = text.toLowerCase();
    return keywords.filter(k => t.includes(k.toLowerCase())).length;
}
function extractRequisitos(text) {
    const requisitos = [];
    const patterns = [
        /(?:requisito|condici[oó]n|exigencia|obligaci[oó]n)[\s:]*([^\n]{10,200})/gi,
        /(?:el proveedor debe|se exige|es obligatorio|deber[aá])[\s:]*([^\n]{10,200})/gi,
        /(?:experiencia m[ií]nima|antig[uü]edad|patente comercial|permiso)[\s:]*([^\n]{10,200})/gi,
        /(?:garant[ií]a|fianza|aval)[\s:]*([^\n]{10,200})/gi,
    ];
    for (const pattern of patterns) {
        let match;
        while ((match = pattern.exec(text)) !== null) {
            const req = match[1].trim();
            if (req.length > 10 && !requisitos.includes(req)) {
                requisitos.push(req);
            }
        }
    }
    return requisitos.slice(0, 8);
}
function analyzeLicitacion(text, profile) {
    const t = text.toLowerCase();
    const requisitos = extractRequisitos(text);
    const riesgoAlto = countMatches(t, RIESGO_INDICATORS.alto);
    const riesgoMedio = countMatches(t, RIESGO_INDICATORS.medio);
    const riesgoScore = riesgoAlto * 3 + riesgoMedio;
    let riesgo;
    if (riesgoScore >= 5)
        riesgo = 'alto';
    else if (riesgoScore >= 2)
        riesgo = 'medio';
    else
        riesgo = 'bajo';
    const compAlta = countMatches(t, COMPLEJIDAD_INDICATORS.alta);
    const compMedia = countMatches(t, COMPLEJIDAD_INDICATORS.media);
    const compScore = compAlta * 3 + compMedia;
    let complejidad;
    if (compScore >= 4)
        complejidad = 'alta';
    else if (compScore >= 1)
        complejidad = 'media';
    else
        complejidad = 'baja';
    const profileMatch = countMatches(t, profile.keywords);
    const excludedMatch = countMatches(t, profile.excludedKeywords || []);
    let recomendacion;
    let justificacion;
    if (excludedMatch > 0) {
        recomendacion = 'descartar';
        justificacion = `Detectado ${excludedMatch} termino(s) excluido(s) del perfil. No es rubro objetivo.`;
    }
    else if (profileMatch >= 3 && riesgo !== 'alto' && complejidad !== 'alta') {
        recomendacion = 'postular';
        justificacion = `Alto match (${profileMatch} keywords). Riesgo ${riesgo}, complejidad ${complejidad}. Buena oportunidad.`;
    }
    else if (profileMatch >= 1 && riesgo !== 'alto') {
        recomendacion = 'evaluar';
        justificacion = `Match moderado (${profileMatch} keywords). Revisar requisitos antes de postular.`;
    }
    else {
        recomendacion = 'descartar';
        justificacion = `Bajo match (${profileMatch} keywords). Riesgo ${riesgo}, complejidad ${complejidad}. No recomendado.`;
    }
    return { requisitos_clave: requisitos, riesgo, complejidad, recomendacion, justificacion };
}
