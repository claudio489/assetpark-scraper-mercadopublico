"use strict";
// ==========================================
// PROFILES - Gestión de perfiles de cliente
// ==========================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_PROFILES = void 0;
exports.getProfile = getProfile;
exports.saveProfile = saveProfile;
exports.deleteProfile = deleteProfile;
exports.listProfiles = listProfiles;
exports.createProfileFromTemplate = createProfileFromTemplate;
/**
 * Perfiles predefinidos para distintos rubros
 * Permite reutilizar el engine para múltiples clientes
 */
const DEFAULT_PROFILES = {
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
exports.DEFAULT_PROFILES = DEFAULT_PROFILES;
/**
 * Almacenamiento en memoria de perfiles activos
 * En producción, esto puede reemplazarse por Redis/archivo/DB
 */
const activeProfiles = new Map(Object.entries(DEFAULT_PROFILES));
function getProfile(id) {
    return activeProfiles.get(id);
}
function saveProfile(profile) {
    activeProfiles.set(profile.id, { ...profile });
    return profile;
}
function deleteProfile(id) {
    return activeProfiles.delete(id);
}
function listProfiles() {
    return Array.from(activeProfiles.values());
}
function createProfileFromTemplate(templateId, overrides) {
    const template = activeProfiles.get(templateId) || DEFAULT_PROFILES.general;
    const newProfile = {
        ...template,
        ...overrides,
        keywords: overrides.keywords || [...template.keywords],
        rubros: overrides.rubros || [...template.rubros],
        regions: overrides.regions || [...template.regions]
    };
    return saveProfile(newProfile);
}
