// ==========================================
// COMPONENTE TABLA
// ==========================================

import { Opportunity } from '../types';

interface TableProps {
  opportunities: Opportunity[];
  selectedId: string | null;
  onSelect: (opp: Opportunity) => void;
  onDoubleClick: (opp: Opportunity) => void;
}

function formatAmount(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `$${(amount / 1_000_000_000).toFixed(1)}MM`;
  }
  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(amount % 1_000_000 === 0 ? 0 : 1)}M`;
  }
  if (amount >= 1_000) {
    return `$${(amount / 1_000).toFixed(0)}K`;
  }
  return `$${amount.toFixed(0)}`;
}

function ScoreBadge({ score, priority }: { score: number; priority: string }) {
  return (
    <span className={`score-badge ${priority}`}>
      {score}
    </span>
  );
}

function PriorityLabel({ priority }: { priority: string }) {
  return (
    <span className={`priority ${priority}`}>
      {priority}
    </span>
  );
}

export function Table({ opportunities, selectedId, onSelect, onDoubleClick }: TableProps) {
  if (opportunities.length === 0) {
    return (
      <div className="table-container">
        <div className="empty">
          <h3>Sin datos</h3>
          <p>Seleccione un perfil y ejecute el pipeline para cargar licitaciones.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="table-container">
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Score</th>
              <th>Título</th>
              <th>Entidad</th>
              <th>Región</th>
              <th>Monto</th>
              <th>Código</th>
              <th>Prioridad</th>
            </tr>
          </thead>
          <tbody>
            {opportunities.map(opp => (
              <tr
                key={opp.id}
                className={selectedId === opp.id ? 'active' : ''}
                onClick={() => onSelect(opp)}
                onDoubleClick={() => onDoubleClick(opp)}
              >
                <td>
                  <ScoreBadge score={opp.score} priority={opp.priority} />
                </td>
                <td style={{ maxWidth: 300 }}>
                  <div style={{ fontWeight: 500 }}>{opp.title}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: 2 }}>
                    {opp.category}
                  </div>
                </td>
                <td>{opp.entity}</td>
                <td>{opp.region}</td>
                <td className="amount">{formatAmount(opp.amount)}</td>
                <td>
                  <code style={{ fontSize: '0.8125rem', color: 'var(--color-primary)' }}>
                    {opp.id}
                  </code>
                </td>
                <td>
                  <PriorityLabel priority={opp.priority} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
