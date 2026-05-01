// ==========================================
// COMPONENTE DASHBOARD
// ==========================================

import { StatsSummary } from '../types';

interface DashboardProps {
  stats: StatsSummary | null;
  loading: boolean;
}

export function Dashboard({ stats, loading }: DashboardProps) {
  if (loading) {
    return (
      <div className="dashboard">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="card" style={{ minHeight: 100 }}>
            <div className="loading">
              <div className="spinner" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="dashboard">
      <div className="card">
        <div className="card-label">Total Licitaciones</div>
        <div className="card-value">{stats.total}</div>
      </div>
      <div className="card">
        <div className="card-label">Prioridad Alta</div>
        <div className="card-value alta">{stats.alta}</div>
      </div>
      <div className="card">
        <div className="card-label">Prioridad Media</div>
        <div className="card-value media">{stats.media}</div>
      </div>
      <div className="card">
        <div className="card-label">Prioridad Baja</div>
        <div className="card-value baja">{stats.baja}</div>
      </div>
      <div className="card">
        <div className="card-label">Score Promedio</div>
        <div className="card-value score">{stats.averageScore}</div>
      </div>
    </div>
  );
}
