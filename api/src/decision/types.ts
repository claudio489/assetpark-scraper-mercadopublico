// ==========================================
// DECISION ENGINE v5.1 - Tipos
// Capa de inteligencia de decisiones de negocio
// ==========================================

export interface Opportunity {
  id: string;
  title: string;
  description: string;
  source: 'mercadopublico';
  industry: string;          // perfil que mejor matchea
  value: number;             // monto estimado
  urgency: number;           // 0-100, basado en dias para cierre
  complexity: number;        // 0-100, basado en keyword diversity
  firstSeen: string;         // ISO date
  lastSeen: string;
  closingDate: string;
  profiles: string[];
  region: string;
  entity: string;
  category: string;
  scoreV50: number;          // score del sistema v5.0
  recommendationV50: string; // POSTULAR/EVALUAR/EVITAR v5.0
}

export interface Executor {
  id: string;
  name: string;
  type: 'internal' | 'partner' | 'supplier';
  industries: string[];
  capacity: number;      // 0-100, cuantas licitaciones puede ejecutar al mes
  successRate: number;   // 0-1, tasa historica de exito
  efficiency: number;    // 0-1, eficiencia de ejecucion
  margin: number;        // 0-1, margen esperado (0.05 - 0.25)
  minAmount: number;     // monto minimo que aceptan
  maxAmount: number;     // monto maximo que pueden ejecutar
}

export interface DecisionScores {
  probabilitySuccess: number;  // 0-1
  fitScore: number;          // 0-1
  expectedProfit: number;    // CLP estimado
  riskScore: number;         // 0-100 (menor es mejor)
  decisionValue: number;     // 0-100, score final ponderado
  decision: 'ACCEPT' | 'REJECT' | 'MONITOR' | 'PARTNER';
  bestExecutorId: string;
  bestExecutorName: string;
  reasoning: string[];
}

export interface DecisionOutput {
  v5: DecisionScores;
}
