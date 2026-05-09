export interface Profile {
  id: string;
  name: string;
  rubros: string[];
  keywords: string[];
  regions: string[];
}

export type Priority = 'alta' | 'media' | 'baja';

export interface ClientProfile {
  id: string;
  name: string;
  rubros: string[];
  keywords: string[];
  regions: string[];
  minAmount?: number;
  maxAmount?: number;
  excludedKeywords?: string[];
}

export interface PipelineConfig {
  profile: ClientProfile;
  sources?: string[];
  limit?: number;
}

export interface NormalizedOpportunity {
  id: string;
  title: string;
  entity: string;
  region: string;
  amount: number;
  source: string;
  url: string;
  date: string;
  status: string;
  category: string;
  description: string;
  raw: RawOpportunity;
}

export interface ScoredOpportunity extends NormalizedOpportunity {
  score: number;
  priority: Priority;
  matchedKeywords: string[];
  matchScore: number;
  aiScore?: number;
}

export interface RawOpportunity {
  codigo: string;
  nombre: string;
  organismo: string;
  region: string;
  monto: number;
  fecha_publicacion: string;
  fecha_cierre: string;
  estado: string;
  categoria: string;
  url: string;
  descripcion: string;
  fuente: string;
}

export interface Opportunity {
  id: string;
  title: string;
  description: string;
  entity: string;
  region: string;
  amount: number;
  date: string;
  closingDate?: string;
  status: string;
  category: string;
  url: string;
  score: number;
  priority: Priority;
  source: string;
  matchScore: number;
  aiScore?: number;
  matchedKeywords: string[];
}

export interface PipelineResult {
  profileId: string;
  runAt: string;
  total: number;
  alta: number;
  media: number;
  baja: number;
  averageScore: number;
  opportunities: Opportunity[];
}

export interface StatsSummary {
  total: number;
  alta: number;
  media: number;
  baja: number;
  averageScore: number;
  byRegion: Record<string, number>;
  bySource: Record<string, number>;
}

export interface PortfolioItem {
  id: string;
  opportunityId: string;
  title: string;
  entity: string;
  region: string;
  amount: number;
  url: string;
  date: string;
  status: string;
  category: PortfolioCategory;
  description: string;
  score: number;
  priority: Priority;
  matchedKeywords: string[];
  matchScore: number;
  aiScore?: number;
  source: string;
  savedAt: string;
  notes?: string;
  profileId?: string;
  profileName?: string;
}

export type PortfolioCategory =
  | 'Construcción'
  | 'Montaje'
  | 'Mantención'
  | 'Suministro EPP'
  | 'Software a la medida'
  | 'Sin categoría';

export const PORTFOLIO_CATEGORIES: PortfolioCategory[] = [
  'Construcción',
  'Montaje',
  'Mantención',
  'Suministro EPP',
  'Software a la medida'
];

export interface StatsSummary {
  total: number;
  alta: number;
  media: number;
  baja: number;
  averageScore: number;
  byRegion: Record<string, number>;
  bySource: Record<string, number>;
}
