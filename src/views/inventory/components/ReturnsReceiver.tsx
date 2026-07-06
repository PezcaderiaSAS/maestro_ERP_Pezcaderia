
import { RefreshCw, X } from 'lucide-react';

export function ReturnsReceiver({
  devoluciones,
  selectedDevId,
  setSelectedDevId,
  receivedDevItems,
  setReceivedDevItems,
  handleProcesarRecepcionDevolucion
}: any) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px', minHeight: '500px' }}>
      {/* COLUMNA IZQUIERDA: LISTADO DE DEVOLUCIONES PROGRAMADAS */}
      <div className="hr-table-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <span style={{ fontSize: '13px', color: '#3B82F6', fontWeight: 600, textTransform: 'uppercase' }}>Logística Inversa</span>
          <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', marginTop: '2px' }}>Devoluciones por Recibir</h3>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', maxHeight: '600px' }}>
          {devoluciones.filter((d: any) => d.estado === 'PROGRAMADA').length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: '#64748B' }}>
              <RefreshCw size={32} style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
              <p style={{ fontSize: '14px', fontWeight: 600 }}>No hay devoluciones programadas pendientes.</p>
            </div>
          ) : (
            devoluciones
              .filter((d: any) => d.estado === 'PROGRAMADA')
              .map((d: any) => {
                const isSelected = selectedDevId === d.id;
                return (
                  <div
                    key={d.id}
                    onClick={() => {
                      setSelectedDevId(d.id);
                      const initialItems: Record<string, { cantidadRecibida: number; destino: 'APROBADO_REINGRESO' | 'DESCARTE_MERMA' }> = {};
                      (d.items || []).forEach((item: any) => {
                        initialItems[item.sku] = {
                          cantidadRecibida: item.cantidad || 0,
                          destino: 'APROBADO_REINGRESO'
                        };
                      });
                      setReceivedDevItems(initialItems);
                    }}
                    style={{
                      padding: '16px',
                      borderRadius: '12px',
                      border: isSelected ? '2px solid #3B82F6' : '1px solid #E2E8F0',
                      backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.05)' : 'white',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <span style={{ fontWeight: 800, fontSize: '14px', color: '#0F172A' }}>
                        Devolución #{d.id.slice(-6).toUpperCase()}
                      </span>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '12px',
                        backgroundColor: '#EFF6FF',
                        color: '#3B82F6'
                      }}>
                        {d.estado}
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px', color: '#475569' }}>
                      <div><strong>Cliente:</strong> {d.clienteNombre}</div>
                      <div><strong>Asociado a:</strong> {d.pedidoId ? `Pedido #${d.pedidoId.slice(-6).toUpperCase()}` : 'Alistamiento manual'}</div>
                      <div><strong>Recogida:</strong> {d.fechaProgramacion ? new Date(d.fechaProgramacion).toLocaleDateString() : 'N/A'}</div>
                    </div>
                  </div>
                );
              })
          )}
        </div>
      </div>

      {/* COLUMNA DERECHA: VALIDACIÓN DE ITEMS DE DEVOLUCIÓN */}
      <div className="hr-table-card" style={{ padding: '24px' }}>
        {selectedDevId ? (
          (() => {
            const dev = devoluciones.find((d: any) => d.id === selectedDevId);
            if (!dev) return null;
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ borderBottom: '1px solid #E2E8F0', paddingBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Recepción Física de Devolución</span>
                      <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A' }}>Recepción de Devolución #{dev.id.slice(-6).toUpperCase()}</h3>
                    </div>
                    <button 
                      onClick={() => setSelectedDevId(null)}
                      style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' }}
                    >
                      <X size={20} />
                    </button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px', fontSize: '13px', color: '#475569', backgroundColor: '#F8FAFC', padding: '16px', borderRadius: '12px' }}>
                    <div>
                      <div><strong>Cliente:</strong> {dev.clienteNombre}</div>
                      <div><strong>Dirección de Recogida:</strong> N/A</div>
                    </div>
                    <div>
                      <div><strong>Pedido Original:</strong> {dev.pedidoId ? `#${dev.pedidoId.slice(-6).toUpperCase()}` : 'N/A'}</div>
                      <div><strong>Motivo General:</strong> N/A</div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#0F172A', marginBottom: '12px' }}>Productos Recibidos</h4>
                  <div style={{ overflowX: 'auto' }}>
                    <table className="hr-table">
                      <thead>
                        <tr>
                          <th>Producto</th>
                          <th style={{ textAlign: 'right' }}>Cant. Programada</th>
                          <th style={{ width: '150px', textAlign: 'center' }}>Cant. Recibida</th>
                          <th style={{ width: '220px' }}>Calidad y Destino</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(dev.items || []).map((item: any) => {
                          const plannedQty = item.cantidad;
                          const details = receivedDevItems[item.sku] || { cantidadRecibida: plannedQty, destino: 'APROBADO_REINGRESO' };
                          
                          return (
                            <tr key={item.sku}>
                              <td style={{ fontWeight: 600 }}>{item.nombre}</td>
                              <td style={{ textAlign: 'right', fontWeight: 700 }}>{plannedQty} kg/un</td>
                              <td style={{ display: 'flex', justifyContent: 'center' }}>
                                <input
                                  type="number"
                                  step="any"
                                  className="form-control"
                                  style={{ textAlign: 'right', fontWeight: 700, width: '100px' }}
                                  value={details.cantidadRecibida}
                                  onChange={e => {
                                    setReceivedDevItems((prev: any) => ({
                                      ...prev,
                                      [item.sku]: {
                                        ...prev[item.sku],
                                        cantidadRecibida: e.target.value
                                      }
                                    }));
                                  }}
                                />
                              </td>
                              <td>
                                <select
                                  className="form-control"
                                  style={{ fontWeight: 600 }}
                                  value={details.destino}
                                  onChange={e => {
                                    setReceivedDevItems((prev: any) => ({
                                      ...prev,
                                      [item.sku]: {
                                        ...prev[item.sku],
                                        destino: e.target.value as any
                                      }
                                    }));
                                  }}
                                >
                                  <option value="APROBADO_REINGRESO">Aprobado: Reingresar Stock</option>
                                  <option value="DESCARTE_MERMA">Descarte: Desperdicio/Merma</option>
                                </select>
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
                    onClick={() => setSelectedDevId(null)}
                    className="btn-secondary"
                    style={{ padding: '12px 24px', borderRadius: '12px', fontWeight: 700 }}
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={() => handleProcesarRecepcionDevolucion(dev.id)}
                    className="btn-primary"
                    style={{ padding: '12px 24px', borderRadius: '12px', fontWeight: 700, backgroundColor: '#3B82F6', color: 'white', border: 'none', cursor: 'pointer' }}
                  >
                    Registrar Recepción Física
                  </button>
                </div>

              </div>
            );
          })()
        ) : (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: '#64748B', padding: '48px 0' }}>
            <RefreshCw size={48} style={{ opacity: 0.5, marginBottom: '16px' }} />
            <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Seleccione una devolución para registrar la entrada física</h3>
            <p style={{ fontSize: '13px', marginTop: '4px' }}>El sistema actualizará el stock en Bodega Principal para los ítems aptos.</p>
          </div>
        )}
      </div>
    </div>
  );
}
