
import { Package, ShieldAlert, CheckCircle } from 'lucide-react';

export function ProductionForm({
  prodMateriaPrima,
  setProdMateriaPrima,
  prodMateriaCant,
  setProdMateriaCant,
  prodTerminado,
  setProdTerminado,
  prodTerminadoCant,
  setProdTerminadoCant,
  mermaPct,
  activeProducts,
  handleProcesarProduccion
}: any) {
  return (
    <div className="hr-table-card" style={{ padding: '24px', flex: 1 }}>
      <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Package size={18} color="#00B171" /> Procesar Orden de Producción
      </h3>

      <form onSubmit={handleProcesarProduccion} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        <div style={{ border: '1px solid #E2E8F0', padding: '16px', borderRadius: '12px' }}>
          <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#64748B', marginBottom: '12px' }}>MATERIA PRIMA (ENTRADA)</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Insumo</label>
              <select className="form-control" value={prodMateriaPrima} onChange={e => setProdMateriaPrima(e.target.value)}>
                {activeProducts.filter((p: any) => p.categoria === 'MATERIA PRIMA').map((p: any) => (
                  <option key={p.sku} value={p.sku}>{p.nombre}</option>
                ))}
                {activeProducts.filter((p: any) => p.categoria === 'MATERIA PRIMA').length === 0 && 
                  activeProducts.map((p: any) => (
                    <option key={p.sku} value={p.sku}>{p.nombre}</option>
                  ))
                }
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Cantidad (kg)</label>
              <input
                type="number"
                step="any"
                className="form-control"
                value={prodMateriaCant}
                onChange={e => setProdMateriaCant(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div style={{ border: '1px solid #E2E8F0', padding: '16px', borderRadius: '12px' }}>
          <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#64748B', marginBottom: '12px' }}>PRODUCTO FINAL (SALIDA)</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Destino</label>
              <select className="form-control" value={prodTerminado} onChange={e => setProdTerminado(e.target.value)}>
                {activeProducts.filter((p: any) => p.categoria !== 'MATERIA PRIMA').map((p: any) => (
                  <option key={p.sku} value={p.sku}>{p.nombre}</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Rendimiento (kg)</label>
              <input
                type="number"
                step="any"
                className="form-control"
                value={prodTerminadoCant}
                onChange={e => setProdTerminadoCant(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Cálculo de Merma y Alertas en Vivo */}
        <div style={{
          display: 'flex', flexDirection: 'column', gap: '12px',
          backgroundColor: mermaPct > 35 ? 'rgba(239, 68, 68, 0.08)' : 'rgba(16, 185, 129, 0.08)',
          border: `1px solid ${mermaPct > 35 ? '#FCA5A5' : '#6EE7B7'}`,
          padding: '16px', borderRadius: '12px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#334155' }}>Porcentaje de Merma Resultante:</span>
            <span style={{ fontSize: '18px', fontWeight: 800, color: mermaPct > 35 ? '#EF4444' : '#10B981' }}>{mermaPct}%</span>
          </div>
          {mermaPct > 35 ? (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', color: '#B91C1C', fontSize: '12px', lineHeight: 1.4 }}>
              <ShieldAlert size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>
                La merma excede la tolerancia permitida (35%). Se solicitará <strong>PIN de autorización</strong> y justificación al momento de procesar.
              </span>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', color: '#047857', fontSize: '12px', lineHeight: 1.4 }}>
              <CheckCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>La merma está dentro del rango operativo normal.</span>
            </div>
          )}
        </div>

        <button type="submit" className="hr-btn-new" style={{ border: 'none', justifyContent: 'center', marginTop: '12px' }}>
          Procesar Producción
        </button>
      </form>
    </div>
  );
}
