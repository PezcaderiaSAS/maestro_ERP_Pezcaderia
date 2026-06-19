import React from 'react';
import { Package, X } from 'lucide-react';

export function ColdRoomPreparation({
  quotations,
  selectedQuoteId,
  setSelectedQuoteId,
  preparedWeights,
  setPreparedWeights,
  handleFinalizarAlistamiento
}: any) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px', minHeight: '500px' }}>
      {/* COLUMNA IZQUIERDA: LISTADO DE PEDIDOS PENDIENTES */}
      <div className="hr-table-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <span style={{ fontSize: '13px', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>WMS - Bodega</span>
          <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', marginTop: '2px' }}>Pedidos por Preparar</h3>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', maxHeight: '600px' }}>
          {quotations.filter((q: any) => q.estado === 'Approved' || q.estado === 'Pausado').length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: '#64748B' }}>
              <Package size={32} style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
              <p style={{ fontSize: '14px', fontWeight: 600 }}>No hay pedidos B2B pendientes de alistamiento.</p>
            </div>
          ) : (
            quotations
              .filter((q: any) => q.estado === 'Approved' || q.estado === 'Pausado')
              .map((q: any) => {
                const isSelected = selectedQuoteId === q.id;
                return (
                  <div
                    key={q.id}
                    onClick={() => {
                      setSelectedQuoteId(q.id);
                      const initialWeights: Record<string, number> = {};
                      (q.items || []).forEach((item: any) => {
                        if (item.cantidad_real) {
                          initialWeights[item.sku] = item.cantidad_real;
                        }
                      });
                      setPreparedWeights(initialWeights);
                    }}
                    style={{
                      padding: '16px',
                      borderRadius: '12px',
                      border: isSelected ? '2px solid var(--primary-color)' : '1px solid #E2E8F0',
                      backgroundColor: isSelected ? 'rgba(14, 116, 144, 0.05)' : 'white',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      position: 'relative'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <span style={{ fontWeight: 800, fontSize: '14px', color: '#0F172A' }}>
                        Cotización #{q.id.slice(-6).toUpperCase()}
                      </span>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '12px',
                        backgroundColor: q.estado === 'Pausado' ? '#FEF2F2' : '#F0FDF4',
                        color: q.estado === 'Pausado' ? '#EF4444' : '#10B981'
                      }}>
                        {q.estado === 'Pausado' ? 'PAUSADO (Discrepancia)' : 'APROBADO'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px', color: '#475569' }}>
                      <div><strong>Cliente:</strong> {q.clienteNombre || 'Cliente B2B'}</div>
                      <div><strong>Fecha Límite:</strong> {q.logistica?.fechaEntrega ? new Date(q.logistica.fechaEntrega).toLocaleDateString() : 'No definida'}</div>
                      <div><strong>Conductor:</strong> {q.logistica?.conductor?.nombre || 'No asignado'}</div>
                    </div>
                  </div>
                );
              })
          )}
        </div>
      </div>

      {/* COLUMNA DERECHA: ÁREA DE TRABAJO Y PESAJE */}
      <div className="hr-table-card" style={{ padding: '24px' }}>
        {selectedQuoteId ? (
          (() => {
            const quote = quotations.find((q: any) => q.id === selectedQuoteId);
            if (!quote) return null;
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ borderBottom: '1px solid #E2E8F0', paddingBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Báscula y Alistamiento</span>
                      <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A' }}>Alistamiento de Pedido #{quote.id.slice(-6).toUpperCase()}</h3>
                    </div>
                    <button 
                      onClick={() => setSelectedQuoteId(null)}
                      style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' }}
                    >
                      <X size={20} />
                    </button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px', fontSize: '13px', color: '#475569', backgroundColor: '#F8FAFC', padding: '16px', borderRadius: '12px' }}>
                    <div>
                      <div><strong>Cliente:</strong> {quote.clienteNombre}</div>
                      <div><strong>Dirección:</strong> {quote.logistica?.direccion || 'N/A'}</div>
                    </div>
                    <div>
                      <div><strong>Conductor Asignado:</strong> {quote.logistica?.conductor?.nombre || 'No asignado'}</div>
                      <div><strong>Ruta / Jornada:</strong> {quote.logistica?.ruta ? `${quote.logistica.ruta} / ${quote.logistica.jornada || 'N/A'}` : 'N/A'}</div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#0F172A', marginBottom: '12px' }}>Productos a Pesar y Preparar (Tolerancia: 5%)</h4>
                  <div style={{ overflowX: 'auto' }}>
                    <table className="hr-table">
                      <thead>
                        <tr>
                          <th>Producto</th>
                          <th style={{ textAlign: 'right' }}>Cant. Solicitada</th>
                          <th style={{ width: '180px', textAlign: 'center' }}>Peso Real Báscula</th>
                          <th style={{ textAlign: 'right' }}>Desviación %</th>
                          <th>Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(quote.items || []).map((item: any) => {
                          const reqQty = item.cantidad;
                          const prepQty = preparedWeights[item.sku];
                          const parsedPrepQty = Number(prepQty);
                          const dev = (prepQty !== undefined && prepQty !== '') ? ((parsedPrepQty - reqQty) / reqQty) * 100 : null;
                          const isOutOfRange = dev !== null && Math.abs(dev) > 5;
                          
                          return (
                            <tr key={item.sku}>
                              <td style={{ fontWeight: 600 }}>{item.nombre}</td>
                              <td style={{ textAlign: 'right', fontWeight: 700 }}>{reqQty} kg</td>
                              <td style={{ display: 'flex', justifyContent: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '130px' }}>
                                  <input
                                    type="number"
                                    step="any"
                                    className="form-control"
                                    style={{ textAlign: 'right', fontWeight: 700 }}
                                    value={prepQty === undefined ? '' : prepQty}
                                    onChange={e => {
                                      setPreparedWeights((prev: any) => ({
                                        ...prev,
                                        [item.sku]: e.target.value
                                      }));
                                    }}
                                    placeholder="0.00"
                                  />
                                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748B' }}>kg</span>
                                </div>
                              </td>
                              <td style={{ textAlign: 'right', fontWeight: 700, color: isOutOfRange ? '#EF4444' : '#10B981' }}>
                                {dev !== null ? `${dev > 0 ? '+' : ''}${dev.toFixed(1)}%` : '-'}
                              </td>
                              <td>
                                {dev !== null ? (
                                  isOutOfRange ? (
                                    <span style={{ fontSize: '11px', fontWeight: 800, color: '#EF4444', backgroundColor: '#FEF2F2', padding: '2px 8px', borderRadius: '4px' }}>
                                      ⚠️ AJUSTE REQUERIDO
                                    </span>
                                  ) : (
                                    <span style={{ fontSize: '11px', fontWeight: 800, color: '#10B981', backgroundColor: '#F0FDF4', padding: '2px 8px', borderRadius: '4px' }}>
                                      ✓ OK
                                    </span>
                                  )
                                ) : (
                                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748B' }}>Pendiente</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                  <button 
                    onClick={() => setSelectedQuoteId(null)}
                    className="btn-secondary"
                    style={{ padding: '12px 24px', borderRadius: '12px', fontWeight: 700 }}
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={() => handleFinalizarAlistamiento(quote.id)}
                    className="btn-primary"
                    style={{ padding: '12px 24px', borderRadius: '12px', fontWeight: 700, backgroundColor: 'var(--primary-color)', color: 'white', border: 'none', cursor: 'pointer' }}
                  >
                    Finalizar Alistamiento
                  </button>
                </div>

              </div>
            );
          })()
        ) : (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: '#64748B', padding: '48px 0' }}>
            <Package size={48} style={{ opacity: 0.5, marginBottom: '16px' }} />
            <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Seleccione un pedido para iniciar el pesaje</h3>
            <p style={{ fontSize: '13px', marginTop: '4px' }}>El sistema validará automáticamente la tolerancia del 5%.</p>
          </div>
        )}
      </div>
    </div>
  );
}
