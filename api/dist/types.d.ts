export interface Opportunity {
    id: string;
    title: string;
    description: string;
    source: 'mercadopublico';
    industry: string;
    value: number;
    urgency: number;
    complexity: number;
    firstSeen: string;
    lastSeen: string;
    closingDate: string;
    profiles: string[];
    region: string;
    entity: string;
    category: string;
    scoreV50: number;
    recommendationV50: string;
}
export interface Executor {
    id: string;
    name: string;
    type: 'internal' | 'partner' | 'supplier';
    industries: string[];
    capacity: number;
    successRate: number;
    efficiency: number;
    margin: number;
    minAmount: number;
    maxAmount: number;
}
export interface DecisionScores {
    probabilitySuccess: number;
    fitScore: number;
    expectedProfit: number;
    riskScore: number;
    decisionValue: number;
    decision: 'ACCEPT' | 'REJECT' | 'MONITOR' | 'PARTNER';
    bestExecutorId: string;
    bestExecutorName: string;
    reasoning: string[];
}
export interface DecisionOutput {
    v5: DecisionScores;
}
