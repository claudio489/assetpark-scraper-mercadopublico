"use strict";
// ==========================================
// PROFILE para análisis de licitaciones
// ==========================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.DYG_ANALYSIS_PROFILE = void 0;
exports.getAnalysisProfile = getAnalysisProfile;
exports.DYG_ANALYSIS_PROFILE = {
    keywords: [
        'buceo', 'submarino', 'subacuatico', 'equipo de buceo', 'tanque de buceo',
        'regulador de buceo', 'traje de buceo', 'mascara de buceo', 'aletas de buceo',
        'escafandra autonoma', 'buceo tecnico', 'buceo profesional', 'buceo industrial',
        'construccion', 'obra civil', 'obra publica', 'infraestructura', 'edificacion',
        'puente', 'camino', 'pavimentacion', 'hormigon', 'asfalto', 'movimiento de tierra',
        'imprenta', 'impresion', 'pendon pvc', 'banner', 'gigantografia', 'letrero luminoso',
        'rotulacion vehicular', 'troquelado', 'corte laser', 'vinilo de corte', 'serigrafia'
    ],
    regiones: ['Biobio', 'Metropolitana', 'Valparaiso', 'Maule', 'Los Rios'],
    excludedKeywords: [
        'medico', 'hospital', 'paciente', 'quirurgico', 'insumos medicos', 'medicamentos',
        'oficina', 'mueble', 'computador', 'impresora', 'papeleria', 'limpieza',
        'alimentacion', 'comedor', 'cafeteria', 'transporte escolar'
    ]
};
function getAnalysisProfile(profileId) {
    switch (profileId) {
        case 'buceo': return {
            keywords: ['buceo', 'submarino', 'subacuatico', 'equipo de buceo', 'tanque de buceo', 'regulador de buceo', 'traje de buceo', 'mascara de buceo', 'aletas de buceo', 'escafandra autonoma'],
            regiones: ['Todas'],
            excludedKeywords: ['medico', 'hospital', 'paciente', 'quirurgico']
        };
        case 'constructora': return {
            keywords: ['construccion', 'obra civil', 'obra publica', 'infraestructura', 'edificacion', 'puente', 'camino', 'pavimentacion', 'hormigon', 'asfalto'],
            regiones: ['Todas'],
            excludedKeywords: ['oficina', 'mueble', 'computador', 'impresora', 'papeleria']
        };
        case 'imprenta': return {
            keywords: ['imprenta', 'impresion', 'pendon pvc', 'banner', 'gigantografia', 'letrero luminoso', 'rotulacion', 'troquelado', 'corte laser', 'serigrafia'],
            regiones: ['Todas'],
            excludedKeywords: ['medico', 'hospital', 'quirurgico']
        };
        default: return exports.DYG_ANALYSIS_PROFILE;
    }
}
