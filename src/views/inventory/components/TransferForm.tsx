import React from 'react';
import { RefreshCw, ArrowRight } from 'lucide-react';

export function TransferForm({
  traslado,
  setTraslado,
  activeProducts,
  handleTraslado
}: any) {
  return (
    <div className="hr-table-card" style={{ padding: '24px' }}>
      <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <RefreshCw size={18} color="#00B171" /> Traslado entre Bodegas
      </h3>
      <form onSubmit={handleTraslado} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Origen</label>
            <select className="form-control" value={traslado.origen} onChange={e => setTraslado({ ...traslado, origen: e.target.value })}>
              <option value="Bodega Principal">Bodega Principal</option>
              <option value="Bodega Secundaria">Bodega Secundaria</option>
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Destino</label>
            <select className="form-control" value={traslado.destino} onChange={e => setTraslado({ ...traslado, destino: e.target.value })}>
              <option value="Bodega Principal">Bodega Principal</option>
              <option value="Bodega Secundaria">Bodega Secundaria</option>
              <option value="Bodega Averías">Bodega Averías</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Producto a Trasladar</label>
            <select className="form-control" value={traslado.sku} onChange={e => setTraslado({ ...traslado, sku: e.target.value })}>
              {activeProducts.map((p: any) => (
                <option key={p.sku} value={p.sku}>{p.nombre}</option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Cantidad</label>
            <input
              type="number"
              step="any"
              className="form-control"
              value={traslado.cantidad}
              onChange={e => setTraslado({ ...traslado, cantidad: e.target.value })}
            />
          </div>
        </div>

        <button type="submit" className="hr-btn-new" style={{ border: 'none', justifyContent: 'center', marginTop: '8px' }}>
          <span>Confirmar Traslado</span>
          <ArrowRight size={16} />
        </button>
      </form>
    </div>
  );
}
