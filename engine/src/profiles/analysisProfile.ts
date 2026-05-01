// ==========================================
// PROFILE para análisis de licitaciones
// ==========================================

import { AnalysisProfile } from '../analyzer/analyzeLicitacion';

export const DYG_ANALYSIS_PROFILE: AnalysisProfile = {
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

export function getAnalysisProfile(profileId: string): AnalysisProfile {
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
    default: return DYG_ANALYSIS_PROFILE;
  }
}
