// ==========================================
// PROFILES - Gestión de perfiles de cliente
// ==========================================

import { ClientProfile } from '../types';

/**
 * Perfiles predefinidos para distintos rubros
 * Permite reutilizar el engine para múltiples clientes
 */
const DEFAULT_PROFILES: Record<string, ClientProfile> = {
  constructora: {
    id: 'constructora',
    name: 'Constructora Demo',
    rubros: ['Construcción', 'Obras Públicas', 'Infraestructura', 'Civil'],
    keywords: ['puente', 'caminos', 'hormigón', 'edificación', 'civil', 'infraestructura', 'mantenimiento'],
    regions: ['Metropolitana', 'Valparaíso', 'Maule', 'Biobío'],
    minAmount: 50000000,
    maxAmount: 5000000000,
    excludedKeywords: ['software', 'consultoría ti', 'seguridad informática']
  },
  
  tecnologia: {
    id: 'tecnologia',
    name: 'Empresa de Tecnología Demo',
    rubros: ['Tecnología', 'Software', 'Servicios TI', 'Consultoría TI'],
    keywords: ['software', 'desarrollo', 'app', 'plataforma', 'digital', 'erp', 'gestión documental', 'transformación digital', 'pentesting', 'ciberseguridad'],
    regions: ['Metropolitana', 'Biobío', 'Valparaíso'],
    minAmount: 20000000,
    maxAmount: 1000000000,
    excludedKeywords: ['construcción', 'obras', 'caminos']
  },
  
  salud: {
    id: 'salud',
    name: 'Proveedor Salud Demo',
    rubros: ['Salud', 'Equipamiento Médico', 'Servicios de Salud'],
    keywords: ['médico', 'hospital', 'resonador', 'tomógrafo', 'rayos x', 'cecosf', 'equipamiento', 'salud', 'farmacéutico'],
    regions: ['Todas'],
    minAmount: 100000000,
    maxAmount: 3000000000,
    excludedKeywords: []
  },
  
  general: {
    id: 'general',
    name: 'Perfil General Demo',
    rubros: ['General'],
    keywords: [],
    regions: ['Todas'],
    excludedKeywords: []
  },

  buceo: {
    id: 'buceo',
    name: 'Importación Equipo de Buceo',
    rubros: ['Buceo', 'Deportes Acuáticos', 'Equipamiento Subacuático', 'Seguridad Marítima', 'Buceo Industrial'],
    keywords: [
      'buceo', 'equipo de buceo', 'aletas', 'máscaras', 'reguladores', 'primer estado', 'segundo estado',
      'segunda etapa', 'trajes secos', 'trajes húmedos', 'capucha', 'boya marcadora', 'botella', 'tanque',
      'compresor', 'snorkel', 'chaleco', 'bcd', 'pesas', 'cuchillo', 'linterna', 'computadora de buceo',
      'wetsuit', 'dry suit', 'monkey', 'fins', 'mask', 'regulator', 'first stage', 'second stage',
      'octopus', 'weights', 'dive computer', 'depth gauge', 'underwater', 'submarino',
      'buceo técnico', 'buceo recreativo', 'rescue diver', 'dive master', 'instructor',
      'padi', 'naui', 'ssi', 'buceo industrial', 'buceo científico', 'buceo militar',
      'rescate acuático', 'salvamento', 'inmersión', 'escafandra', 'neopreno', 'butxa',
      'manómetro', 'octopus', 'correa', 'arnés', 'bola de seguridad', 'spg',
      'botella de aluminio', 'botella de acero', 'valvula din', 'valvula yoke',
      'drysuit', 'hood', 'gloves', 'boots', ' SMB', 'surface marker', 'reel',
      'linea de guía', 'carrete', 'sopras', 'mares', 'apeks', 'aqualung', 'scubapro',
      'atomic', 'oceanic', 'tusa', 'cressi', 'beuchat', 'halcyon', 'xdeep', 'garmin',
      'shearwater', 'suunto', 'divesoft', 'fourth element', 'bare', 'waterproof',
      'dive rite', 'tecnica', 'sidemount', 'backmount', 'doble botella', 'etapa',
      'deco', 'decompression', 'nitrox', 'trimix', 'rebreather', 'ecr',
      'semicerrado', 'buceo profundo', 'cave diving', 'wreck diving', 'ice diving',
      'buceo bajo hielo', 'buceo en cuevas', 'buceo en naufragios'
    ],
    regions: ['Todas'],
    minAmount: 500000,
    maxAmount: 500000000,
    excludedKeywords: []
  }
};

/**
 * Almacenamiento en memoria de perfiles activos
 * En producción, esto puede reemplazarse por Redis/archivo/DB
 */
const activeProfiles = new Map<string, ClientProfile>(Object.entries(DEFAULT_PROFILES));

export function getProfile(id: string): ClientProfile | undefined {
  return activeProfiles.get(id);
}

export function saveProfile(profile: ClientProfile): ClientProfile {
  activeProfiles.set(profile.id, { ...profile });
  return profile;
}

export function deleteProfile(id: string): boolean {
  return activeProfiles.delete(id);
}

export function listProfiles(): ClientProfile[] {
  return Array.from(activeProfiles.values());
}

export function createProfileFromTemplate(
  templateId: string,
  overrides: Partial<ClientProfile> & { id: string; name: string }
): ClientProfile {
  const template = activeProfiles.get(templateId) || DEFAULT_PROFILES.general;
  const newProfile: ClientProfile = {
    ...template,
    ...overrides,
    keywords: overrides.keywords || [...template.keywords],
    rubros: overrides.rubros || [...template.rubros],
    regions: overrides.regions || [...template.regions]
  };
  return saveProfile(newProfile);
}

export { DEFAULT_PROFILES };
