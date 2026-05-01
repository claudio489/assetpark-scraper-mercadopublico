// ==========================================
// HOOK - Carga de oportunidades y portfolio
// ==========================================

import { useState, useCallback } from 'react';
import { Opportunity, StatsSummary, Profile, PortfolioItem, PortfolioStats, PortfolioCategory } from '../types';

const API_BASE = '/api';

interface UseOpportunitiesReturn {
  opportunities: Opportunity[];
  stats: StatsSummary | null;
  profiles: Profile[];
  portfolio: PortfolioItem[];
  portfolioStats: PortfolioStats | null;
  loading: boolean;
  error: string | null;
  activeProfileId: string;
  activeTab: 'oportunidades' | 'portfolio';
  setActiveProfileId: (id: string) => void;
  setActiveTab: (tab: 'oportunidades' | 'portfolio') => void;
  runPipeline: (profileId?: string) => Promise<void>;
  loadProfiles: () => Promise<void>;
  saveToPortfolio: (opportunity: Opportunity, category: PortfolioCategory, notes?: string, profileId?: string, profileName?: string) => Promise<void>;
  removeFromPortfolio: (id: string) => Promise<void>;
  updatePortfolioScore: (id: string, score: number) => Promise<void>;
  updatePortfolioCategory: (id: string, category: PortfolioCategory) => Promise<void>;
  updatePortfolioProfile: (id: string, profileId: string, profileName: string) => Promise<void>;
  loadPortfolio: (profileFilter?: string) => Promise<void>;
}

export function useOpportunities(): UseOpportunitiesReturn {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [stats, setStats] = useState<StatsSummary | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [portfolioStats, setPortfolioStats] = useState<PortfolioStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeProfileId, setActiveProfileId] = useState('buceo');
  const [activeTab, setActiveTab] = useState<'oportunidades' | 'portfolio'>('oportunidades');

  const runPipeline = useCallback(async (profileId?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const targetId = profileId || activeProfileId;
      
      const runRes = await fetch(`${API_BASE}/opportunities/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId: targetId })
      });
      
      if (!runRes.ok) {
        const err = await runRes.json();
        throw new Error(err.error || 'Error ejecutando pipeline');
      }
      
      const runData = await runRes.json();
      
      if (runData.success && runData.opportunities) {
        setOpportunities(runData.opportunities);
        
        const statsRes = await fetch(`${API_BASE}/opportunities/stats`);
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          if (statsData.success) {
            setStats(statsData.stats);
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [activeProfileId]);

  const loadProfiles = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/profiles`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setProfiles(data.profiles);
        }
      }
    } catch {
      // Silencioso
    }
  }, []);

  const loadPortfolio = useCallback(async (profileFilter?: string) => {
    try {
      const url = profileFilter
        ? `${API_BASE}/portfolio?profileId=${encodeURIComponent(profileFilter)}`
        : `${API_BASE}/portfolio`;
      
      const [itemsRes, statsRes] = await Promise.all([
        fetch(url),
        fetch(`${API_BASE}/portfolio/stats`)
      ]);
      
      if (itemsRes.ok) {
        const data = await itemsRes.json();
        if (data.success) {
          setPortfolio(data.items);
        }
      }
      
      if (statsRes.ok) {
        const data = await statsRes.json();
        if (data.success) {
          setPortfolioStats(data);
        }
      }
    } catch {
      // Silencioso
    }
  }, []);

  const saveToPortfolio = useCallback(async (opportunity: Opportunity, category: PortfolioCategory, notes?: string, profileId?: string, profileName?: string) => {
    try {
      const res = await fetch(`${API_BASE}/portfolio`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opportunity, category, notes, profileId, profileName })
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error guardando');
      }
      
      await loadPortfolio();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error guardando');
    }
  }, [loadPortfolio]);

  const removeFromPortfolio = useCallback(async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/portfolio/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setPortfolio(prev => prev.filter(p => p.id !== id));
        await loadPortfolio();
      }
    } catch {
      // Silencioso
    }
  }, [loadPortfolio]);

  const updatePortfolioScore = useCallback(async (id: string, score: number) => {
    try {
      const res = await fetch(`${API_BASE}/portfolio/${id}/score`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score })
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setPortfolio(prev => prev.map(p => p.id === id ? data.item : p));
          await loadPortfolio();
        }
      }
    } catch {
      // Silencioso
    }
  }, [loadPortfolio]);

  const updatePortfolioCategory = useCallback(async (id: string, category: PortfolioCategory) => {
    try {
      const res = await fetch(`${API_BASE}/portfolio/${id}/category`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category })
      });
      
      if (res.ok) {
        await loadPortfolio();
      }
    } catch {
      // Silencioso
    }
  }, [loadPortfolio]);

  const updatePortfolioProfile = useCallback(async (id: string, profileId: string, profileName: string) => {
    try {
      const res = await fetch(`${API_BASE}/portfolio/${id}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId, profileName })
      });
      
      if (res.ok) {
        await loadPortfolio();
      }
    } catch {
      // Silencioso
    }
  }, [loadPortfolio]);

  return {
    opportunities,
    stats,
    profiles,
    portfolio,
    portfolioStats,
    loading,
    error,
    activeProfileId,
    activeTab,
    setActiveProfileId,
    setActiveTab,
    runPipeline,
    loadProfiles,
    saveToPortfolio,
    removeFromPortfolio,
    updatePortfolioScore,
    updatePortfolioCategory,
    updatePortfolioProfile,
    loadPortfolio
  };
}
