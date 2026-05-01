// ==========================================
// COMPONENTE PORTFOLIO - Licitaciones guardadas
// Con filtro por perfil y categoría editable
// ==========================================

import { useState } from 'react';
import { PortfolioItem, PortfolioCategory, PORTFOLIO_CATEGORIES, Profile } from '../types';

interface PortfolioProps {
  items: PortfolioItem[];
  stats: { total: number; byCategory: Record<string, number>; byPriority: Record<string, number>; averageScore: number } | null;
  profiles: Profile[];
  onRemove: (id: string) => void;
  onUpdateScore: (id: string, score: number) => void;
  onUpdateCategory: (id: string, category: PortfolioCategory) => void;
  onUpdateProfile: (id: string, profileId: string, profileName: string) => void;
}

function formatAmount(amount: number): string {
  if (amount <= 0) return 'No disp.';
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0
  }).format(amount);
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

function ScoreBadge({ score, priority }: { score: number; priority: string }) {
  return (
    <span className={`score-badge ${priority}`}>
      {score}
    </span>
  );
}

export function Portfolio({ items, stats, profiles, onRemove, onUpdateScore, onUpdateCategory, onUpdateProfile }: PortfolioProps) {
  const [editingScore, setEditingScore] = useState<string | null>(null);
  const [scoreInput, setScoreInput] = useState<number>(0);
  const [filterCategory, setFilterCategory] = useState<PortfolioCategory | 'Todas'>('Todas');
  const [filterProfile, setFilterProfile] = useState<string>('Todas');

  // Extraer perfiles únicos presentes en el portfolio
  const profilesInPortfolio = Array.from(new Set(
    items.filter(i => i.profileId).map(i => i.profileId)
  ));

  let filtered = items;
  
  if (filterCategory !== 'Todas') {
    filtered = filtered.filter(i => i.category === filterCategory);
  }
  
  if (filterProfile !== 'Todas') {
    filtered = filtered.filter(i => i.profileId === filterProfile);
  }

  if (items.length === 0) {
    return (
      <div className="portfolio-empty">
        <div className="empty">
          <h3>Portfolio vacío</h3>
          <p>Seleccione una licitación y haga clic en "Guardar" para agregarla a su portfolio de postulaciones.</p>
        </div>
      </div>
    );
  }

  const startEditScore = (item: PortfolioItem) => {
    setEditingScore(item.id);
    setScoreInput(item.score);
  };

  const confirmScore = (id: string) => {
    onUpdateScore(id, scoreInput);
    setEditingScore(null);
  };

  return (
    <div className="portfolio">
      {/* Stats del portfolio */}
      {stats && (
        <div className="dashboard portfolio-stats">
          <div className="card">
            <div className="card-label">Guardadas</div>
            <div className="card-value">{stats.total}</div>
          </div>
          <div className="card">
            <div className="card-label">Score Promedio</div>
            <div className="card-value score">{stats.averageScore}</div>
          </div>
          {PORTFOLIO_CATEGORIES.map(cat => (
            <div className="card" key={cat}>
              <div className="card-label">{cat}</div>
              <div className="card-value">{stats.byCategory[cat] || 0}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filtros */}
      <div className="portfolio-filters">
        <select 
          value={filterCategory} 
          onChange={e => setFilterCategory(e.target.value as PortfolioCategory | 'Todas')}
        >
          <option value="Todas">Todas las categorías</option>
          {PORTFOLIO_CATEGORIES.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        
        <select 
          value={filterProfile} 
          onChange={e => setFilterProfile(e.target.value)}
        >
          <option value="Todas">Todos los perfiles</option>
          {profilesInPortfolio.map(pid => {
            const pname = profiles.find(p => p.id === pid)?.name || pid;
            return <option key={pid} value={pid}>{pname}</option>;
          })}
        </select>
        
        <span className="filter-count">{filtered.length} licitaciones</span>
      </div>

      {/* Tabla */}
      <div className="table-container">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Score</th>
                <th>Título</th>
                <th>Entidad</th>
                <th>Perfil Búsqueda</th>
                <th>Categoría</th>
                <th>Monto</th>
                <th>Cierre</th>
                <th>Guardada</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => (
                <tr key={item.id}>
                  <td>
                    {editingScore === item.id ? (
                      <div className="score-edit">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={scoreInput}
                          onChange={e => setScoreInput(Number(e.target.value))}
                          autoFocus
                        />
                        <button onClick={() => confirmScore(item.id)}>✓</button>
                      </div>
                    ) : (
                      <div onClick={() => startEditScore(item)} style={{ cursor: 'pointer' }}>
                        <ScoreBadge score={item.score} priority={item.priority} />
                      </div>
                    )}
                  </td>
                  <td style={{ maxWidth: 280 }}>
                    <div style={{ fontWeight: 500 }}>{item.title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: 2 }}>
                      {item.opportunityId}
                    </div>
                  </td>
                  <td>{item.entity}</td>
                  <td>
                    <select
                      value={item.profileId || ''}
                      onChange={e => {
                        const pid = e.target.value;
                        const pname = profiles.find(p => p.id === pid)?.name || pid;
                        onUpdateProfile(item.id, pid, pname);
                      }}
                      className="profile-select"
                    >
                      <option value="">Sin perfil</option>
                      {profiles.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <select
                      value={item.category}
                      onChange={e => onUpdateCategory(item.id, e.target.value as PortfolioCategory)}
                      className="category-select"
                    >
                      {PORTFOLIO_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </td>
                  <td className="amount">{formatAmount(item.amount)}</td>
                  <td>{formatDate(item.date)}</td>
                  <td>{formatDate(item.savedAt.split('T')[0])}</td>
                  <td>
                    <div className="row-actions">
                      <a 
                        href={item.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="btn-icon"
                        title="Ver en MercadoPublico"
                      >
                        ↗
                      </a>
                      <button 
                        className="btn-icon delete"
                        onClick={() => onRemove(item.id)}
                        title="Eliminar"
                      >
                        🗑
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
