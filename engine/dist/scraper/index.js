"use strict";
// ==========================================
// SCRAPER - Extracción de datos crudos
// Simula y consume fuentes de licitaciones
// ==========================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.MOCK_DATABASE = void 0;
exports.scrapeOpportunities = scrapeOpportunities;
exports.registerSource = registerSource;
/**
 * Datos simulados de licitaciones reales (formato MercadoPublico.cl)
 * En producción, esto se reemplaza por fetch real a la API del estado
 */
const MOCK_DATABASE = [
    {
        codigo: 'LIC-2024-001',
        nombre: 'Construcción de Puente Peatonal en Avenida Principal',
        organismo: 'Ministerio de Obras Públicas',
        region: 'Metropolitana',
        monto: 450000000,
        fecha_publicacion: '2024-03-15',
        fecha_cierre: '2024-04-15',
        estado: 'Publicada',
        categoria: 'Obras Públicas',
        url: 'https://www.mercadopublico.cl/Licitation/Details/LIC-2024-001',
        descripcion: 'Construcción de puente peatonal de hormigón armado con accesos universales',
        fuente: 'MercadoPublico'
    },
    {
        codigo: 'LIC-2024-002',
        nombre: 'Servicio de Seguridad Informática y Pentesting',
        organismo: 'BancoEstado',
        region: 'Metropolitana',
        monto: 85000000,
        fecha_publicacion: '2024-03-10',
        fecha_cierre: '2024-04-10',
        estado: 'Publicada',
        categoria: 'Servicios TI',
        url: 'https://www.mercadopublico.cl/Licitation/Details/LIC-2024-002',
        descripcion: 'Servicio de auditoría de seguridad, pentesting y monitoreo de vulnerabilidades',
        fuente: 'MercadoPublico'
    },
    {
        codigo: 'LIC-2024-003',
        nombre: 'Suministro de Equipos Médicos para Hospital Regional',
        organismo: 'Servicio de Salud Valparaíso',
        region: 'Valparaíso',
        monto: 1200000000,
        fecha_publicacion: '2024-03-12',
        fecha_cierre: '2024-05-12',
        estado: 'Publicada',
        categoria: 'Equipamiento Médico',
        url: 'https://www.mercadopublico.cl/Licitation/Details/LIC-2024-003',
        descripcion: 'Adquisición de resonadores magnéticos, tomógrafos y equipos de rayos X',
        fuente: 'MercadoPublico'
    },
    {
        codigo: 'LIC-2024-004',
        nombre: 'Desarrollo de Plataforma de Gestión Documental',
        organismo: 'Ministerio del Interior',
        region: 'Metropolitana',
        monto: 195000000,
        fecha_publicacion: '2024-03-08',
        fecha_cierre: '2024-04-20',
        estado: 'Publicada',
        categoria: 'Desarrollo Software',
        url: 'https://www.mercadopublico.cl/Licitation/Details/LIC-2024-004',
        descripcion: 'Desarrollo e implementación de plataforma de gestión documental con firma electrónica',
        fuente: 'MercadoPublico'
    },
    {
        codigo: 'LIC-2024-005',
        nombre: 'Mantenimiento de Caminos Rurales Región del Maule',
        organismo: 'Ministerio de Obras Públicas',
        region: 'Maule',
        monto: 2300000000,
        fecha_publicacion: '2024-03-05',
        fecha_cierre: '2024-06-05',
        estado: 'Publicada',
        categoria: 'Obras Públicas',
        url: 'https://www.mercadopublico.cl/Licitation/Details/LIC-2024-005',
        descripcion: 'Mantenimiento periódico de 150 km de caminos rurales en la región del Maule',
        fuente: 'MercadoPublico'
    },
    {
        codigo: 'LIC-2024-006',
        nombre: 'Servicios de Consultoría en Transformación Digital',
        organismo: 'Subsecretaría de Economía',
        region: 'Metropolitana',
        monto: 68000000,
        fecha_publicacion: '2024-03-18',
        fecha_cierre: '2024-04-18',
        estado: 'Publicada',
        categoria: 'Consultoría TI',
        url: 'https://www.mercadopublico.cl/Licitation/Details/LIC-2024-006',
        descripcion: 'Consultoría para plan de transformación digital de procesos administrativos',
        fuente: 'MercadoPublico'
    },
    {
        codigo: 'LIC-2024-007',
        nombre: 'Suministro de Mobiliario Escolar para 50 Establecimientos',
        organismo: 'Junta Nacional de Auxilio Escolar',
        region: 'Biobío',
        monto: 340000000,
        fecha_publicacion: '2024-03-14',
        fecha_cierre: '2024-05-14',
        estado: 'Publicada',
        categoria: 'Mobiliario',
        url: 'https://www.mercadopublico.cl/Licitation/Details/LIC-2024-007',
        descripcion: 'Fabricación y entrega de pupitres, sillas, pizarras y mobiliario bibliotecario',
        fuente: 'MercadoPublico'
    },
    {
        codigo: 'LIC-2024-008',
        nombre: 'Implementación de Sistema de Videovigilancia Urbana',
        organismo: 'Municipalidad de Antofagasta',
        region: 'Antofagasta',
        monto: 520000000,
        fecha_publicacion: '2024-03-01',
        fecha_cierre: '2024-04-30',
        estado: 'Publicada',
        categoria: 'Seguridad Electrónica',
        url: 'https://www.mercadopublico.cl/Licitation/Details/LIC-2024-008',
        descripcion: 'Instalación de 200 cámaras de videovigilancia con centro de monitoreo y analítica',
        fuente: 'MercadoPublico'
    },
    {
        codigo: 'LIC-2024-009',
        nombre: 'Desarrollo de App Móvil para Servicios Ciudadanos',
        organismo: 'Municipalidad de Concepción',
        region: 'Biobío',
        monto: 145000000,
        fecha_publicacion: '2024-03-20',
        fecha_cierre: '2024-04-25',
        estado: 'Publicada',
        categoria: 'Desarrollo Software',
        url: 'https://www.mercadopublico.cl/Licitation/Details/LIC-2024-009',
        descripcion: 'Desarrollo de aplicación móvil nativa iOS/Android para trámites municipales',
        fuente: 'MercadoPublico'
    },
    {
        codigo: 'LIC-2024-010',
        nombre: 'Servicio de Limpieza y Mantenimiento de Edificios',
        organismo: 'Dirección de Presupuestos',
        region: 'Metropolitana',
        monto: 42000000,
        fecha_publicacion: '2024-03-11',
        fecha_cierre: '2024-04-11',
        estado: 'Publicada',
        categoria: 'Servicios Generales',
        url: 'https://www.mercadopublico.cl/Licitation/Details/LIC-2024-010',
        descripcion: 'Servicio de limpieza diaria, mantenimiento de jardines y áreas comunes',
        fuente: 'MercadoPublico'
    },
    {
        codigo: 'LIC-2024-011',
        nombre: 'Construcción de Cecosf en Comuna Rural',
        organismo: 'Servicio de Salud Araucanía',
        region: 'Araucanía',
        monto: 890000000,
        fecha_publicacion: '2024-03-07',
        fecha_cierre: '2024-05-07',
        estado: 'Publicada',
        categoria: 'Obras Públicas',
        url: 'https://www.mercadopublico.cl/Licitation/Details/LIC-2024-011',
        descripcion: 'Construcción de Centro de Salud Familiar con sala de urgencia y farmacia',
        fuente: 'MercadoPublico'
    },
    {
        codigo: 'LIC-2024-012',
        nombre: 'Implementación de Sistema ERP para Gestión Logística',
        organismo: 'Fuerza Aérea de Chile',
        region: 'Metropolitana',
        monto: 780000000,
        fecha_publicacion: '2024-03-16',
        fecha_cierre: '2024-06-16',
        estado: 'Publicada',
        categoria: 'Software Empresarial',
        url: 'https://www.mercadopublico.cl/Licitation/Details/LIC-2024-012',
        descripcion: 'Implementación de sistema ERP para gestión de abastecimiento y logística',
        fuente: 'MercadoPublico'
    },
    {
        codigo: 'LIC-2024-013',
        nombre: 'Suministro de Equipos de Buceo para Unidad de Búsqueda y Rescate',
        organismo: 'Armada de Chile',
        region: 'Valparaíso',
        monto: 125000000,
        fecha_publicacion: '2024-04-02',
        fecha_cierre: '2024-05-15',
        estado: 'Publicada',
        categoria: 'Equipamiento de Buceo',
        url: 'https://www.mercadopublico.cl/Licitation/Details/LIC-2024-013',
        descripcion: 'Adquisición de reguladores, trajes secos, máscaras y aletas para operaciones de rescate acuático y buceo táctico',
        fuente: 'MercadoPublico'
    },
    {
        codigo: 'LIC-2024-014',
        nombre: 'Mantenimiento y Reparación de Equipos de Buceo Institucional',
        organismo: 'Servicio Nacional de Pesca',
        region: 'Los Lagos',
        monto: 45000000,
        fecha_publicacion: '2024-04-05',
        fecha_cierre: '2024-04-30',
        estado: 'Publicada',
        categoria: 'Mantenimiento de Buceo',
        url: 'https://www.mercadopublico.cl/Licitation/Details/LIC-2024-014',
        descripcion: 'Servicio de mantenimiento anual de reguladores, revisiones de botellas de aluminio y acero, y reparación de trajes húmedos y secos',
        fuente: 'MercadoPublico'
    },
    {
        codigo: 'LIC-2024-015',
        nombre: 'Adquisición de Trajes Secos y Equipamiento para Buceo Científico',
        organismo: 'Universidad de Concepción',
        region: 'Biobío',
        monto: 89000000,
        fecha_publicacion: '2024-04-08',
        fecha_cierre: '2024-05-20',
        estado: 'Publicada',
        categoria: 'Buceo Científico',
        url: 'https://www.mercadopublico.cl/Licitation/Details/LIC-2024-015',
        descripcion: 'Suministro de trajes secos de neopreno, capuchas, guantes, boyas marcadoras, carretes y linternas submarinas para investigación marina',
        fuente: 'MercadoPublico'
    },
    {
        codigo: 'LIC-2024-016',
        nombre: 'Curso de Certificación en Buceo Técnico y Equipamiento Asociado',
        organismo: 'Gobernación Marítima de Iquique',
        region: 'Tarapacá',
        monto: 32000000,
        fecha_publicacion: '2024-04-10',
        fecha_cierre: '2024-05-10',
        estado: 'Publicada',
        categoria: 'Capacitación y Buceo',
        url: 'https://www.mercadopublico.cl/Licitation/Details/LIC-2024-016',
        descripcion: 'Curso de buceo técnico con certificación internacional, incluyendo doble botella, sidemount, etapas de decompression y computadoras de buceo',
        fuente: 'MercadoPublico'
    },
    {
        codigo: 'LIC-2024-017',
        nombre: 'Dotación de Equipos de Buceo para Parque Nacional Submarino',
        organismo: 'Corporación Nacional Forestal',
        region: 'Los Ríos',
        monto: 67000000,
        fecha_publicacion: '2024-04-12',
        fecha_cierre: '2024-06-12',
        estado: 'Publicada',
        categoria: 'Equipamiento Subacuático',
        url: 'https://www.mercadopublico.cl/Licitation/Details/LIC-2024-017',
        descripcion: 'Adquisición de sets completos de buceo recreativo: reguladores con primer y segundo estado, chalecos compensadores, snorkel, pesas y cuchillos submarinos',
        fuente: 'MercadoPublico'
    },
    {
        codigo: 'LIC-2024-018',
        nombre: 'Suministro de Compresores y Botellas para Centro de Buceo Municipal',
        organismo: 'Municipalidad de Algarrobo',
        region: 'Valparaíso',
        monto: 28000000,
        fecha_publicacion: '2024-04-15',
        fecha_cierre: '2024-05-15',
        estado: 'Publicada',
        categoria: 'Infraestructura de Buceo',
        url: 'https://www.mercadopublico.cl/Licitation/Details/LIC-2024-018',
        descripcion: 'Suministro de compresor de aire de alta presión, botellas de aluminio de 12 litros con válvula DIN y Yoke, manómetros y kits de revisión',
        fuente: 'MercadoPublico'
    },
    {
        codigo: 'LIC-2024-019',
        nombre: 'Equipamiento de Buceo Industrial para Mantenimiento de Muelles',
        organismo: 'Empresa Portuaria de San Antonio',
        region: 'Valparaíso',
        monto: 185000000,
        fecha_publicacion: '2024-04-18',
        fecha_cierre: '2024-07-18',
        estado: 'Publicada',
        categoria: 'Buceo Industrial',
        url: 'https://www.mercadopublico.cl/Licitation/Details/LIC-2024-019',
        descripcion: 'Equipamiento completo de buceo industrial: escafandras semicerradas, comunicación subacuática, linternas de 5000 lúmenes, cuerdas y carretes de seguridad',
        fuente: 'MercadoPublico'
    },
    {
        codigo: 'LIC-2024-020',
        nombre: 'Renovación de Trajes Húmedos y Accesorios para Programa de Buceo Adaptado',
        organismo: 'Servicio Nacional de la Discapacidad',
        region: 'Metropolitana',
        monto: 38000000,
        fecha_publicacion: '2024-04-20',
        fecha_cierre: '2024-05-25',
        estado: 'Publicada',
        categoria: 'Buceo Adaptado',
        url: 'https://www.mercadopublico.cl/Licitation/Details/LIC-2024-020',
        descripcion: 'Adquisición de trajes húmedos de 5mm y 7mm, botas de neopreno, capuchas, aletas de tracción adaptable y boyas de señalización para terapia acuática',
        fuente: 'MercadoPublico'
    }
];
exports.MOCK_DATABASE = MOCK_DATABASE;
/**
 * Simula la extracción de datos desde una fuente externa
 * En producción, esto haría fetch() a la API real de MercadoPublico
 */
async function scrapeOpportunities(options) {
    const { limit = 50 } = options || {};
    // Simular latencia de red realista
    await delay(300 + Math.random() * 400);
    // En producción: return await fetch('https://api.mercadopublico.cl/...')
    const results = MOCK_DATABASE.slice(0, limit);
    return results;
}
/**
 * Permite agregar fuentes adicionales en runtime
 */
function registerSource(name, fetcher) {
    SOURCE_REGISTRY[name] = fetcher;
}
const SOURCE_REGISTRY = {
    MercadoPublico: () => Promise.resolve(MOCK_DATABASE)
};
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
