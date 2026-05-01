// ==========================================
// COMPONENTE MODAL DETALLE + GUARDAR
// ==========================================

import { useState } from 'react';
import { Opportunity, PortfolioCategory, PORTFOLIO_CATEGORIES } from '../types';

interface ModalProps {
  opportunity: Opportunity | null;
  onClose: () => void;
  onSave?: (opportunity: Opportunity, category: PortfolioCategory, notes?: string) => void;
  profileName?: string;
}

function formatAmountCLP(amount: number): string {
  if (amount <= 0) return 'No disponible';
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0
  }).format(amount);
}

export function Modal({ opportunity, onClose, onSave, profileName }: ModalProps) {
  const [category, setCategory] = useState<PortfolioCategory>('Sin categoría');
  const [notes, setNotes] = useState('');
  const [saved, setSaved] = useState(false);

  if (!opportunity) return null;

  const handleSave = () => {
    if (onSave) {
      onSave(opportunity, category, notes);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

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
              <dd><code>{opportunity.id}</code></dd>
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
            
            {profileName && (
              <div className="detail-item">
                <dt>Perfil de Búsqueda</dt>
                <dd>
                  <span className="profile-tag">{profileName}</span>
                </dd>
              </div>
            )}
            
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
                      <span key={kw} className="keyword-tag">{kw}</span>
                    ))}
                  </div>
                </dd>
              </div>
            )}
            
            <div className="detail-item full">
              <dt>Título</dt>
              <dd style={{ fontWeight: 500 }}>{opportunity.title}</dd>
            </div>
            
            <div className="detail-item full">
              <dt>Descripción</dt>
              <dd>{opportunity.description || 'Sin descripción disponible.'}</dd>
            </div>
          </div>

          {/* Guardar a Portfolio */}
          {onSave && (
            <div className="save-section">
              <div className="save-header">
                <span className="save-icon">★</span>
                <strong>Guardar en Mi Portfolio</strong>
              </div>
              
              <div className="save-fields">
                <div className="save-field">
                  <label>Categoría de negocio</label>
                  <select 
                    value={category} 
                    onChange={e => setCategory(e.target.value as PortfolioCategory)}
                  >
                    <option value="Sin categoría">Seleccionar categoría...</option>
                    {PORTFOLIO_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                
                <div className="save-field">
                  <label>Notas / Observaciones</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Ej: Revisar pliegos, contactar comprador..."
                  />
                </div>
              </div>
              
              <button 
                className={`btn btn-save ${saved ? 'saved' : ''}`}
                onClick={handleSave}
                disabled={saved}
              >
                {saved ? '✓ Guardado' : '★ Guardar Licitación'}
              </button>
            </div>
          )}
          
          <div className="modal-actions">
            <a
              href={opportunity.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              Ver en MercadoPublico →
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
