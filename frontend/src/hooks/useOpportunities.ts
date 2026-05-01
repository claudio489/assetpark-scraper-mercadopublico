// ==========================================
// HOOK - Carga de oportunidades desde API REST
// ==========================================

import { useState, useCallback } from 'react';
import { Opportunity, StatsSummary, Profile } from '../types';

const API_BASE = '/api';

interface UseOpportunitiesReturn {
  opportunities: Opportunity[];
  stats: StatsSummary | null;
  profiles: Profile[];
  loading: boolean;
  error: string | null;
  activeProfileId: string;
  setActiveProfileId: (id: string) => void;
  runPipeline: (profileId?: string) => Promise<void>;
  loadProfiles: () => Promise<void>;
}

export function useOpportunities(): UseOpportunitiesReturn {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [stats, setStats] = useState<StatsSummary | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeProfileId, setActiveProfileId] = useState('buceo');

  const runPipeline = useCallback(async (profileId?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const targetId = profileId || activeProfileId;
      
      // Ejecutar pipeline
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
        
        // Cargar stats desde el mismo array
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
      // Silencioso - profiles no es crítico
    }
  }, []);

  return {
    opportunities,
    stats,
    profiles,
    loading,
    error,
    activeProfileId,
    setActiveProfileId,
    runPipeline,
    loadProfiles
  };
}
