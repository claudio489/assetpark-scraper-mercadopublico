// ==========================================
// TIPOS DEL FRONTEND
// ==========================================

export interface Opportunity {
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
  score: number;
  priority: 'alta' | 'media' | 'baja';
  matchedKeywords: string[];
  matchScore: number;
  aiScore?: number;
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
  priority: 'alta' | 'media' | 'baja';
  matchedKeywords: string[];
  matchScore: number;
  aiScore?: number;
  source: string;
  savedAt: string;
  notes?: string;
  profileId?: string;
  profileName?: string;
}

export interface PortfolioStats {
  total: number;
  byCategory: Record<string, number>;
  byPriority: Record<string, number>;
  averageScore: number;
}

export interface Profile {
  id: string;
  name: string;
  rubros: string[];
  keywords: string[];
  regions: string[];
}
