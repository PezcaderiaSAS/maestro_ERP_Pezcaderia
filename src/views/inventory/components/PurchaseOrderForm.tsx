import React from 'react';
import { Truck, PlusCircle } from 'lucide-react';

export function PurchaseOrderForm({
  compra,
  setCompra,
  proveedores,
  activeProducts,
  handleProcesarCompra
}: any) {
  return (
    <div className="hr-table-card" style={{ padding: '24px' }}>
      <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Truck size={18} color="#00B171" /> Entrada de Mercadería (Proveedores)
      </h3>
      <form onSubmit={handleProcesarCompra} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Proveedor Origen</label>
            <select
              className="form-control"
              value={compra.proveedorId}
              onChange={e => setCompra({ ...compra, proveedorId: e.target.value })}
              style={{ border: '2px solid var(--primary-light)' }}
            >
              <option value="">-- Seleccionar Proveedor --</option>
              {proveedores.filter((p: any) => p.activo).map((p: any) => (
                <option key={p.id} value={p.id}>{p.nombre} ({p.nit})</option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Bodega Destino</label>
            <select className="form-control" value={compra.bodega} onChange={e => setCompra({ ...compra, bodega: e.target.value })}>
              <option value="Bodega Principal">Bodega Principal</option>
              <option value="Bodega Secundaria">Bodega Secundaria</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Producto a Recibir</label>
            <select className="form-control" value={compra.sku} onChange={e => setCompra({ ...compra, sku: e.target.value })}>
              {activeProducts.map((p: any) => (
                <option key={p.sku} value={p.sku}>{p.nombre} ({p.sku})</option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Cantidad</label>
            <input
              type="number"
              className="form-control"
              value={compra.cantidad}
              onChange={e => setCompra({ ...compra, cantidad: parseInt(e.target.value) || 0 })}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Lote (Auto-generado si vacío)</label>
            <input
              type="text"
              className="form-control"
              placeholder="Ej. LT-2506"
              value={compra.lote}
              onChange={e => setCompra({ ...compra, lote: e.target.value })}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Costo por Unidad ($ COP)</label>
            <input
              type="number"
              className="form-control"
              placeholder="Ej. 12000"
              value={compra.costoUnitario || ''}
              onChange={e => setCompra({ ...compra, costoUnitario: parseInt(e.target.value) || 0 })}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Forma de Pago</label>
            <select
              className="form-control"
              value={compra.formaPago || 'CONTADO'}
              onChange={e => setCompra({ ...compra, formaPago: e.target.value })}
              style={{ border: '2px solid var(--primary-light)' }}
            >
              <option value="CONTADO">Contado</option>
              <option value="CREDITO">Crédito</option>
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">IVA (%)</label>
            <input
              type="number"
              className="form-control"
              placeholder="19"
              value={compra.iva !== undefined ? compra.iva : 19}
              onChange={e => setCompra({ ...compra, iva: parseInt(e.target.value) || 0 })}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Fletes / Adicionales ($ COP)</label>
            <input
              type="number"
              className="form-control"
              placeholder="0"
              value={compra.fletes || 0}
              onChange={e => setCompra({ ...compra, fletes: parseInt(e.target.value) || 0 })}
            />
          </div>
        </div>

        <button type="submit" className="hr-btn-new" style={{ border: 'none', justifyContent: 'center', marginTop: '8px', backgroundColor: 'var(--primary-color)' }}>
          <span>Registrar Entrada de Compra</span>
          <PlusCircle size={16} />
        </button>
      </form>
    </div>
  );
}
