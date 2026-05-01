// ==========================================
// COMPONENTE MODAL DETALLE
// ==========================================

import { Opportunity } from '../types';

interface ModalProps {
  opportunity: Opportunity | null;
  onClose: () => void;
}

function formatAmountCLP(amount: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0
  }).format(amount);
}

export function Modal({ opportunity, onClose }: ModalProps) {
  if (!opportunity) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Detalle de Licitación</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        
        <div className="modal-body">
          <div className="detail-grid">
            <div className="detail-item">
              <dt>Código</dt>
              <dd>
                <code>
                  {opportunity.id}
                </code>
              </dd>
            </div>
            
            <div className="detail-item">
              <dt>Score</dt>
              <dd>
                <span className={`priority ${opportunity.priority}`}>
                  {opportunity.score}/100 ({opportunity.priority})
                </span>
              </dd>
            </div>
            
            <div className="detail-item">
              <dt>Entidad</dt>
              <dd>{opportunity.entity}</dd>
            </div>
            
            <div className="detail-item">
              <dt>Región</dt>
              <dd>{opportunity.region}</dd>
            </div>
            
            <div className="detail-item">
              <dt>Monto</dt>
              <dd className="amount">{formatAmountCLP(opportunity.amount)}</dd>
            </div>
            
            <div className="detail-item">
              <dt>Fecha Publicación</dt>
              <dd>{opportunity.date}</dd>
            </div>
            
            <div className="detail-item">
              <dt>Categoría</dt>
              <dd>{opportunity.category}</dd>
            </div>
            
            <div className="detail-item">
              <dt>Estado</dt>
              <dd>{opportunity.status}</dd>
            </div>
            
            <div className="detail-item">
              <dt>Fuente</dt>
              <dd>{opportunity.source}</dd>
            </div>
            
            <div className="detail-item">
              <dt>Match Score</dt>
              <dd>{opportunity.matchScore}/100</dd>
            </div>
            
            {opportunity.aiScore !== undefined && (
              <div className="detail-item">
                <dt>AI Score</dt>
                <dd>{opportunity.aiScore}/100</dd>
              </div>
            )}
            
            {opportunity.matchedKeywords.length > 0 && (
              <div className="detail-item full">
                <dt>Keywords Coincidentes</dt>
                <dd>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                    {opportunity.matchedKeywords.map(kw => (
                      <span key={kw} className="keyword-tag">
                        {kw}
                      </span>
                    ))}
                  </div>
                </dd>
              </div>
            )}
            
            <div className="detail-item">
              <dt>Fecha Cierre</dt>
              <dd>{opportunity.date}</dd>
            </div>
            
            <div className="detail-item full">
              <dt>Título</dt>
              <dd style={{ fontWeight: 500 }}>{opportunity.title}</dd>
            </div>
            
            <div className="detail-item full">
              <dt>Descripción</dt>
              <dd>{opportunity.description || 'Sin descripción disponible.'}</dd>
            </div>
          </div>
          
          <div className="modal-actions">
            <a
              href={opportunity.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              Ver en fuente externa →
            </a>
            <button className="btn btn-secondary" onClick={onClose}>
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
