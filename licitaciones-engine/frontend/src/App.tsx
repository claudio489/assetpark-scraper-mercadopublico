// ==========================================
// APP PRINCIPAL - AssetPark Scraper MercadoPublico
// ==========================================

import { useState, useEffect } from 'react';
import { useOpportunities } from './hooks/useOpportunities';
import { Dashboard } from './components/Dashboard';
import { Table } from './components/Table';
import { Modal } from './components/Modal';
import { Portfolio } from './components/Portfolio';
import { Opportunity, PortfolioCategory } from './types';

export default function App() {
  const {
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
  } = useOpportunities();

  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);

  useEffect(() => {
    loadProfiles();
    runPipeline();
    loadPortfolio();
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

  const handleSave = (opp: Opportunity, category: PortfolioCategory, notes?: string) => {
    const profile = profiles.find(p => p.id === activeProfileId);
    saveToPortfolio(opp, category, notes, activeProfileId, profile?.name || activeProfileId);
  };

  return (
    <div className="app">
      {/* Header AssetPark */}
      <header className="app-header">
        <div>
          <div className="brand-badge">AssetPark</div>
          <h1>Scraper MercadoPublico</h1>
          <div className="subtitle">Prospectador de licitaciones • Múltiples perfiles de búsqueda para cañón de ventas</div>
        </div>
        <div className="header-tabs">
          <button 
            className={`tab ${activeTab === 'oportunidades' ? 'active' : ''}`}
            onClick={() => setActiveTab('oportunidades')}
          >
            Oportunidades
          </button>
          <button 
            className={`tab ${activeTab === 'portfolio' ? 'active' : ''}`}
            onClick={() => setActiveTab('portfolio')}
          >
            Mi Portfolio
            {portfolio.length > 0 && <span className="tab-badge">{portfolio.length}</span>}
          </button>
        </div>
      </header>

      {activeTab === 'oportunidades' && (
        <>
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

            <button
              className="btn btn-secondary"
              onClick={() => setActiveTab('portfolio')}
            >
              ★ Portfolio ({portfolio.length})
            </button>
          </div>

          {error && (
            <div className="error-box">
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
        </>
      )}

      {activeTab === 'portfolio' && (
        <Portfolio
          items={portfolio}
          stats={portfolioStats}
          profiles={profiles}
          onRemove={removeFromPortfolio}
          onUpdateScore={updatePortfolioScore}
          onUpdateCategory={updatePortfolioCategory}
          onUpdateProfile={updatePortfolioProfile}
        />
      )}

      <Modal
        opportunity={selectedOpportunity}
        onClose={() => setSelectedOpportunity(null)}
        onSave={activeTab === 'oportunidades' ? handleSave : undefined}
        profileName={profiles.find(p => p.id === activeProfileId)?.name || activeProfileId}
      />
    </div>
  );
}
