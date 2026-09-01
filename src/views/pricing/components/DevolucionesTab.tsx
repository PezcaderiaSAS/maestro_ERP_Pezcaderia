import React from 'react';
import { X } from 'lucide-react';
import Swal from 'sweetalert2';
import type { Cliente, Conductor, DevolucionPedido, Product } from '../../../types/erp.types';

interface DevolucionesTabProps {
  clientes: Cliente[];
  conductores: Conductor[];
  products: Product[];
  quotations: any[];
  devoluciones: DevolucionPedido[];
  devClienteId: string;
  setDevClienteId: (val: string) => void;
  devConductorId: string;
  setDevConductorId: (val: string) => void;
  devFechaProg: string;
  setDevFechaProg: (val: string) => void;
  devPedidoId: string;
  setDevPedidoId: (val: string) => void;
  devItems: any[];
  setDevItems: React.Dispatch<React.SetStateAction<any[]>>;
  devSelProductSku: string;
  setDevSelProductSku: (val: string) => void;
  devSelProductCant: string | number;
  setDevSelProductCant: (val: string | number) => void;
  devSelProductMotivo: string;
  setDevSelProductMotivo: (val: string) => void;
  onSaveDevolucion: () => void;
}

export const DevolucionesTab: React.FC<DevolucionesTabProps> = ({
  clientes,
  conductores,
  products,
  quotations,
  devoluciones,
  devClienteId,
  setDevClienteId,
  devConductorId,
  setDevConductorId,
  devFechaProg,
  setDevFechaProg,
  devPedidoId,
  setDevPedidoId,
  devItems,
  setDevItems,
  devSelProductSku,
  setDevSelProductSku,
  devSelProductCant,
  setDevSelProductCant,
  devSelProductMotivo,
  setDevSelProductMotivo,
  onSaveDevolucion,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '24px' }}>
        {/* Formulario Nueva Devolución */}
        <div className="hr-table-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '16px' }}>Programar Nueva Devolución</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Cliente B2B *</label>
              <select
                className="form-control"
                value={devClienteId}
                onChange={(e) => {
                  setDevClienteId(e.target.value);
                  setDevPedidoId('');
                  setDevItems([]);
                }}
              >
                <option value="">Seleccione un cliente...</option>
                {clientes
                  .filter((c) => c.tipoPrecio === 'MAYORISTA' || c.tipoPrecio === 'RESTAURANTE')
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Asociar a Pedido / Factura (Opcional)</label>
              <select
                className="form-control"
                value={devPedidoId}
                onChange={(e) => {
                  const pId = e.target.value;
                  setDevPedidoId(pId);
                  const q = quotations.find((qt) => qt.id === pId);
                  if (q && q.items) {
                    setDevItems(
                      q.items.map((i: any) => ({
                        sku: i.sku || i.product?.sku,
                        nombre: i.nombre || i.product?.nombre,
                        cantidad: i.cantidad,
                        precio: i.precio || i.precioOverride || 0,
                        motivo: 'MAL_ESTADO',
                      }))
                    );
                  } else {
                    setDevItems([]);
                  }
                }}
                disabled={!devClienteId}
              >
                <option value="">Seleccione un pedido...</option>
                {quotations
                  .filter((q) => q.clienteId === devClienteId && (q.estado === 'Sold' || q.estado === 'Listo' || q.estado === 'FACTURADO'))
                  .map((q: any) => (
                    <option key={q.id} value={q.id}>
                      {q.no} ({q.fecha} - ${q.total.toLocaleString('es-CO')})
                    </option>
                  ))}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Conductor Asignado para Recogida *</label>
              <select
                className="form-control"
                value={devConductorId}
                onChange={(e) => setDevConductorId(e.target.value)}
              >
                <option value="">Seleccione un conductor...</option>
                {conductores.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Fecha de Recogida Programada</label>
              <input
                type="date"
                className="form-control"
                value={devFechaProg}
                onChange={(e) => setDevFechaProg(e.target.value)}
              />
            </div>

            {/* Agregar productos individualmente si no se asocia pedido */}
            {!devPedidoId && (
              <div
                style={{
                  border: '1px solid #E2E8F0',
                  padding: '12px',
                  borderRadius: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  marginTop: '8px',
                }}
              >
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Agregar Producto Individual</span>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <select
                    className="form-control"
                    value={devSelProductSku}
                    onChange={(e) => setDevSelProductSku(e.target.value)}
                  >
                    <option value="">Seleccione producto...</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.sku}>
                        {p.nombre} ({p.sku})
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
                    <input
                      type="number"
                      step="any"
                      className="form-control"
                      placeholder="Cant (kg)"
                      value={devSelProductCant}
                      onChange={(e) => setDevSelProductCant(e.target.value)}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0, flex: 1.5 }}>
                    <select
                      className="form-control"
                      value={devSelProductMotivo}
                      onChange={(e) => setDevSelProductMotivo(e.target.value)}
                    >
                      <option value="MAL_ESTADO">Mal Estado / Caducado</option>
                      <option value="CAMBIO">Cambio / Devolución Comercial</option>
                      <option value="EXCESO_PEDIDO">Exceso en Pedido</option>
                    </select>
                  </div>
                  <button
                    type="button"
                    className="btn-primary"
                    style={{ border: 'none', backgroundColor: 'var(--primary-color)', color: 'white', padding: '8px 12px', borderRadius: '8px' }}
                    onClick={() => {
                      const prod = products.find((p) => p.sku === devSelProductSku);
                      if (!prod) {
                        Swal.fire({
                          icon: 'warning',
                          title: 'Seleccione Producto',
                          text: 'Por favor seleccione un producto del catálogo.',
                          confirmButtonColor: 'var(--primary-color)',
                        });
                        return;
                      }
                      if (devItems.some((i) => i.sku === devSelProductSku)) {
                        Swal.fire({
                          icon: 'warning',
                          title: 'Producto duplicado',
                          text: 'El producto ya está en la lista de devolución.',
                          confirmButtonColor: 'var(--primary-color)',
                        });
                        return;
                      }
                      const cli = clientes.find((c) => c.id === devClienteId);
                      const cliType = cli?.tipoPrecio || 'POS';
                      let price = prod.precio_venta_pos;
                      if (cliType === 'RESTAURANTE') price = prod.precio_venta_restaurante;
                      else if (cliType === 'MAYORISTA') price = prod.precio_venta_mayorista;

                      setDevItems((prev) => [
                        ...prev,
                        {
                          sku: prod.sku,
                          nombre: prod.nombre,
                          cantidad: Number(devSelProductCant) || 0,
                          precio: price,
                          motivo: devSelProductMotivo,
                        },
                      ]);
                      setDevSelProductSku('');
                      setDevSelProductCant(1);
                    }}
                    disabled={!devClienteId}
                  >
                    Agregar
                  </button>
                </div>
              </div>
            )}

            {/* Detalle Devolución */}
            <div style={{ marginTop: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '8px' }}>
                Ítems a Recoger
              </span>
              {devItems.length === 0 ? (
                <div style={{ padding: '12px', border: '1px dashed #CBD5E1', borderRadius: '8px', textAlign: 'center', fontSize: '11px', color: '#64748B' }}>
                  No hay ítems para devolución
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto' }}>
                  {devItems.map((item, index) => (
                    <div
                      key={index}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px',
                        border: '1px solid #E2E8F0',
                        borderRadius: '6px',
                        fontSize: '11px',
                      }}
                    >
                      <div>
                        <span style={{ fontWeight: 700 }}>{item.nombre}</span> ({item.sku})<br />
                        <span style={{ color: 'var(--primary-color)', fontWeight: 600 }}>Cant: {item.cantidad} kg</span> | Motivo: {item.motivo}
                      </div>
                      <button
                        type="button"
                        style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }}
                        onClick={() => setDevItems((prev) => prev.filter((_, idx) => idx !== index))}
                        disabled={!!devPedidoId}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              className="btn-primary"
              style={{
                border: 'none',
                backgroundColor: 'var(--primary-color)',
                color: 'white',
                padding: '12px',
                borderRadius: '8px',
                fontWeight: 'bold',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '8px',
                marginTop: '12px',
              }}
              onClick={onSaveDevolucion}
            >
              Programar Recogida
            </button>
          </div>
        </div>

        {/* Listado de Devoluciones Programadas */}
        <div className="hr-table-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '16px' }}>Estado de Devoluciones B2B</h3>
          {devoluciones.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '200px', color: '#64748B', gap: '8px' }}>
              <span style={{ fontSize: '32px' }}>🔄</span>
              <span style={{ fontSize: '13px', fontWeight: 500 }}>No hay devoluciones programadas</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '550px', overflowY: 'auto' }}>
              {devoluciones.map((dev) => {
                const totalEstimado = dev.items.reduce((sum, i) => sum + i.precioUnitarioVenta * i.cantidadSolicitada, 0);
                return (
                  <div
                    key={dev.id}
                    style={{ border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', fontWeight: 800, color: '#1E293B' }}>{dev.clienteNombre}</span>
                      <span
                        style={{
                          fontSize: '11px',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontWeight: 700,
                          backgroundColor:
                            dev.estado === 'PROGRAMADA'
                              ? '#FEF3C7'
                              : dev.estado === 'RECIBIDA_BODEGA'
                              ? '#DBEAFE'
                              : dev.estado === 'VALIDADA_FINANZAS'
                              ? '#D1FAE5'
                              : '#F1F5F9',
                          color:
                            dev.estado === 'PROGRAMADA'
                              ? '#D97706'
                              : dev.estado === 'RECIBIDA_BODEGA'
                              ? '#2563EB'
                              : dev.estado === 'VALIDADA_FINANZAS'
                              ? '#059669'
                              : '#475569',
                        }}
                      >
                        {dev.estado}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748B', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                      <span>
                        <strong>Pedido:</strong> {dev.pedidoNo}
                      </span>
                      <span>
                        <strong>Fecha Prog:</strong> {dev.fechaProgramacion}
                      </span>
                      <span style={{ gridColumn: 'span 2' }}>
                        <strong>Conductor:</strong> {dev.conductorNombre}
                      </span>
                    </div>

                    <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '8px', marginTop: '4px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#475569' }}>Productos:</span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '4px' }}>
                        {dev.items.map((it, idx) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#475569' }}>
                            <span>{it.nombre}</span>
                            <span>{it.cantidadRecibida !== undefined ? `${it.cantidadRecibida} / ${it.cantidadSolicitada}` : it.cantidadSolicitada} kg</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #F1F5F9', paddingTop: '8px', marginTop: '4px' }}>
                      <span style={{ fontSize: '11px', color: '#64748B' }}>Total Estimado:</span>
                      <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--primary-color)' }}>
                        ${totalEstimado.toLocaleString('es-CO')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
