// ==========================================
// APP PRINCIPAL
// ==========================================

import { useState, useEffect } from 'react';
import { useOpportunities } from './hooks/useOpportunities';
import { Dashboard } from './components/Dashboard';
import { Table } from './components/Table';
import { Modal } from './components/Modal';
import { Opportunity } from './types';

export default function App() {
  const {
    opportunities,
    stats,
    profiles,
    loading,
    error,
    activeProfileId,
    setActiveProfileId,
    runPipeline,
    loadProfiles
  } = useOpportunities();

  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);

  useEffect(() => {
    loadProfiles();
    // Auto-ejecutar al cargar
    runPipeline();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleProfileChange = (id: string) => {
    setActiveProfileId(id);
    runPipeline(id);
  };

  const handleSelect = (opp: Opportunity) => {
    setSelectedOpportunity(opp);
  };

  const handleDoubleClick = (opp: Opportunity) => {
    window.open(opp.url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <h1>Licitaciones Intelligence</h1>
          <div className="subtitle">Motor de inteligencia de oportunidades de licitación</div>
        </div>
      </header>

      <div className="controls">
        <select
          value={activeProfileId}
          onChange={e => handleProfileChange(e.target.value)}
          disabled={loading}
        >
          {profiles.map(p => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        <button
          className="btn btn-primary"
          onClick={() => runPipeline()}
          disabled={loading}
        >
          {loading ? (
            <>
              <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
              Procesando...
            </>
          ) : (
            '⟳ Ejecutar Pipeline'
          )}
        </button>
      </div>

      {error && (
        <div
          style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            padding: '12px 16px',
            borderRadius: 'var(--radius)',
            marginBottom: 16,
            fontSize: '0.875rem'
          }}
        >
          <strong>Error:</strong> {error}
        </div>
      )}

      <Dashboard stats={stats} loading={loading && opportunities.length === 0} />

      <Table
        opportunities={opportunities}
        selectedId={selectedOpportunity?.id || null}
        onSelect={handleSelect}
        onDoubleClick={handleDoubleClick}
      />

      <Modal
        opportunity={selectedOpportunity}
        onClose={() => setSelectedOpportunity(null)}
      />
    </div>
  );
}
