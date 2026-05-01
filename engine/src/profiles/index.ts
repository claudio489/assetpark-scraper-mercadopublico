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

  imprenta: {
    id: 'imprenta',
    name: 'Imprenta / Gráfica / Publicidad',
    rubros: [
      'Imprenta', 'Gráfica', 'Publicidad Impresa', 'Comunicación Visual',
      'Señalética', 'Rotulación', 'Impresión Digital', 'Offset',
      'Serigrafía', 'Gigantografía', 'Packaging', 'Material POP'
    ],
    keywords: [
      // Impresión general
      'imprenta', 'imprentas', 'impresión', 'impresion', 'printing', 'print',
      'gráfica', 'grafica', 'gráfico', 'grafico', 'comunicación visual', 'comunicacion visual',
      'artes gráficas', 'artes graficas', 'pre-prensa', 'preprensa', 'impresión comercial',

      // Pendones / Banners / Gigantografía
      'pendón', 'pendon', 'pendones', 'pvc', 'banner', 'banners', 'gigantografía', 'gigantografia',
      'frontlight', 'backlight', 'lona', 'lonas', 'malla publicitaria', 'mesh', 'publicidad exterior',
      'valla', 'vallas', 'cartel', 'carteles', 'cartelera', 'pasacalle', 'pasacalles', 'banderola',

      // Letreros / Señalética / Luminosos
      'letrero', 'letreros', 'rótulo', 'rotulo', 'rótulos', 'rotulos', 'señalética', 'señaletica',
      'señalización', 'señalizacion', 'señal', 'señales', 'letra corpórea', 'letra corporea',
      'letras corpóreas', 'letras corporeas', 'luminoso', 'luminosos', 'neón', 'neon', 'led',
      'caja de luz', 'cajas de luz', 'backlit', 'display luminoso', 'totem', 'tótem', 'totems',
      'direccional', 'direccionales', 'nomenclatura', 'placa', 'placas', 'placa identificación',

      // Vinilos / Autoadhesivos / Stickers
      'autoadhesivo', 'autoadhesivos', 'vinilo', 'vinilos', 'adhesivo', 'adhesivos',
      'calcomanía', 'calcomania', 'calcomanías', 'calcomanias', 'sticker', 'stickers',
      ' etiqueta', 'etiquetas', 'label', 'labels', 'microperforado', 'esmerilado',
      'vinilo de corte', 'vinilo impresión', 'vinilo de recorte', 'wrap', 'wrapping',

      // Troquelado / Corte / Acabados
      'troquelado', 'troquel', 'troqueles', 'corte', 'corte especial', 'plotter de corte',
      'router cnc', 'cnc', 'corte láser', 'corte laser', 'láser', 'laser', 'grabado',
      'grabado láser', 'grabado laser', 'corte digital', 'waterjet', 'corte por chorro',

      // Materiales rígidos / Soportes
      'foamboard', 'foam', 'kapa', 'kapafix', 'acrílico', 'acrilico', 'acrílicos', 'acrilicos',
      'policarbonato', 'aluminio compuesto', 'composite', 'dibond', 'alucobond', ' MDF',
      'pvc expandido', 'forex', 'sintra', 'coroplast', 'correx', 'cartón pluma', 'carton pluma',
      'lámina', 'lamina', 'láminas', 'laminas', 'acetato', 'pet', 'poliestireno',

      // Offset / Digital / Serigrafía / Sublimación
      'offset', 'impresión offset', 'impresion offset', 'digital', 'impresión digital',
      'impresion digital', 'plotter', 'plotters', 'gran formato', 'gran formato impresión',
      'serigrafía', 'serigrafia', 'serigrafías', 'serigrafias', 'sublimación', 'sublimacion',
      'transfer', 'transferencia', 'estampado', 'estampado textil', 'dtg', 'directo a prenda',
      'uv', 'impresión uv', 'impresion uv', 'uv led', 'barniz uv', 'barniz',

      // Publicidad impresa / POP / Editorial
      'folleto', 'folletos', 'flyer', 'flyers', 'afiche', 'afiches', 'póster', 'poster',
      'brochure', 'brochures', 'catálogo', 'catalogo', 'catálogos', 'catalogos',
      'revista', 'revistas', 'libro', 'libros', 'editorial', 'encuadernación', 'encuadernacion',
      'plastificado', 'plastificación', 'plastificacion', 'laminado', 'laminación', 'laminacion',
      'tapa dura', 'rustica', 'cosido', 'pegamento', 'espiral', 'anillado', 'encolado',
      'cuaderno', 'cuadernos', 'agenda', 'agendas', 'tarjeta', 'tarjetas', 'invitación',
      'invitacion', 'invitaciones', 'menú', 'menu', 'menús', 'menus',

      // Packaging / Envases / Cajas
      'packaging', 'empaque', 'empaques', 'envase', 'envases', 'caja', 'cajas',
      'caja de cartón', 'caja de regalo', 'bolsa', 'bolsas', 'bolsa de papel',
      'bolsa plástica', 'bolsa plastica', 'estuche', 'estuches', 'tubo', 'tubos',
      'doypack', 'doy pack', 'stand up pouch', 'flexografía', 'flexografia', 'flexo',
      'bolsas preformadas', 'pouch', 'sachet', 'sachets', 'blister', 'blisters',

      // Material POP / Exhibidores / Displays
      'material pop', 'pop', 'display', 'displays', 'exhibidor', 'exhibidores',
      'punto de venta', 'pdv', 'mostrador', 'counter', 'counter display', 'floor stand',
      'dispensador', 'expositor', 'expositores', 'mobiliario comercial', 'mobiliario pdv',
      'caballete', 'caballete publicitario', 'parante', 'porta gráfica', 'porta grafica',
      'roll up', 'rollup', 'mini roll up', 'enrollable', 'retractil', 'x banner',
      'banner x', 'arana', 'araña', 'backwall', 'back wall', 'muro de imágenes',
      'isla', 'isla comercial', 'modulo', 'módulo', 'módulos', 'modulos',

      // Rotulación / Instalación / Vehicular
      'rotulación', 'rotulacion', 'rotulaciones', 'rotulaciones', 'instalación', 'instalacion',
      'montaje', 'montajes', 'colocación', 'colocacion', 'adhesión', 'adhesion',
      'vehicular', 'vehiculo', 'vehículo', 'vehiculos', 'vehículos', 'flota', 'flotas',
      'carrocería', 'carroceria', 'carro', 'auto', 'camión', 'camion', 'bus',
      'colectivo', 'taxi', 'transporte', 'movilidad', 'magnético', 'magnetico',
      'imantado', 'iman', 'imanes', 'placa magnética', 'cobertura vehicular',

      // Plotter / Router / CNC / Otros equipos
      'plotter', 'plotters', 'impresora gran formato', 'impresora gran formato',
      'roland', 'hp latex', 'mimaki', 'mutoh', 'efi', 'efi vutek', 'durst',
      'cortadora', 'guillotina', 'guillotinas', 'plegadora', 'plegadoras',
      'refiladora', 'perforadora', 'espiraladora', 'encuadernadora',

      // Términos en inglés asociados
      'sign', 'signage', 'signs', 'printer', 'vinyl', 'cutting', 'printing press',
      'large format', 'wide format', 'digital print', 'screen print', 'litho',
      'lithography', 'bindery', 'binding', 'laminate', 'finishing', 'post press',
      'pre press', 'bind', 'die cut', 'diecut', 'kiss cut', 'kisscut',
      ' POP display', 'retail display', 'instore', 'in-store', 'visual merchandising',
      'wayfinding', 'branding', 'corporate identity', 'identity', 'logotype',
      'logo', 'brand', 'rediseño', 'redisenio', 'redesign', 'refresh'
    ],
    regions: ['Todas'],
    minAmount: 50000,
    maxAmount: 1000000000,
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
