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

export interface Profile {
  id: string;
  name: string;
  rubros: string[];
  keywords: string[];
  regions: string[];
}
