"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EXECUTORS = void 0;
exports.EXECUTORS = [
    // === INTERNOS DYG ===
    {
        id: 'dyg-constructora',
        name: 'DYG Constructora',
        type: 'internal',
        industries: ['constructora', 'hormigon'],
        capacity: 8,
        successRate: 0.72,
        efficiency: 0.85,
        margin: 0.18,
        minAmount: 5_000_000,
        maxAmount: 2_000_000_000
    },
    {
        id: 'dyg-tecnologia',
        name: 'DYG Tecnologia',
        type: 'internal',
        industries: ['tecnologia'],
        capacity: 12,
        successRate: 0.68,
        efficiency: 0.90,
        margin: 0.25,
        minAmount: 1_000_000,
        maxAmount: 500_000_000
    },
    {
        id: 'dyg-salud',
        name: 'DYG Salud',
        type: 'internal',
        industries: ['salud'],
        capacity: 6,
        successRate: 0.65,
        efficiency: 0.80,
        margin: 0.15,
        minAmount: 2_000_000,
        maxAmount: 300_000_000
    },
    {
        id: 'dyg-imprenta',
        name: 'DYG Imprenta',
        type: 'internal',
        industries: ['imprenta'],
        capacity: 15,
        successRate: 0.80,
        efficiency: 0.88,
        margin: 0.35,
        minAmount: 100_000,
        maxAmount: 50_000_000
    },
    {
        id: 'dyg-buceo',
        name: 'DYG Buceo Industrial',
        type: 'internal',
        industries: ['buceo'],
        capacity: 3,
        successRate: 0.55,
        efficiency: 0.75,
        margin: 0.20,
        minAmount: 500_000,
        maxAmount: 20_000_000
    },
    // === PARTNERS ===
    {
        id: 'partner-it-solutions',
        name: 'Partner IT Solutions',
        type: 'partner',
        industries: ['tecnologia', 'salud'],
        capacity: 20,
        successRate: 0.60,
        efficiency: 0.70,
        margin: 0.12,
        minAmount: 5_000_000,
        maxAmount: 800_000_000
    },
    {
        id: 'partner-construccion',
        name: 'Partner Construccion Regional',
        type: 'partner',
        industries: ['constructora', 'hormigon'],
        capacity: 10,
        successRate: 0.58,
        efficiency: 0.65,
        margin: 0.10,
        minAmount: 10_000_000,
        maxAmount: 1_500_000_000
    },
    // === SUPPLIERS ===
    {
        id: 'supplier-hormigon-premium',
        name: 'Supplier Hormigon Premium',
        type: 'supplier',
        industries: ['hormigon', 'constructora'],
        capacity: 25,
        successRate: 0.75,
        efficiency: 0.82,
        margin: 0.08,
        minAmount: 1_000_000,
        maxAmount: 500_000_000
    },
    {
        id: 'supplier-medico-nacional',
        name: 'Supplier Medico Nacional',
        type: 'supplier',
        industries: ['salud'],
        capacity: 30,
        successRate: 0.70,
        efficiency: 0.78,
        margin: 0.06,
        minAmount: 500_000,
        maxAmount: 200_000_000
    }
];
