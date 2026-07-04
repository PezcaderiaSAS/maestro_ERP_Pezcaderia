import { Truck, CheckCircle, PackageSearch, Package, AlertCircle, FileText } from 'lucide-react';
import Swal from 'sweetalert2';
import { b2bService } from '../services/b2bService';
import { cashService } from '../services/cashService';
import { EstadoPedido } from '../types/orders.types';
import { useOrderStore } from '../store/useOrderStore.ts';
import { useEventStore } from '../store/useEventStore.ts';
import { useAppStore } from '../store/useAppStore.ts';
import { useInventoryStore } from '../store/useInventoryStore.ts';
import { useMovementStore } from '../store/useMovementStore.ts';

interface OrderKanbanViewProps {
  onEditOrder: (quote: any) => void;
}

type ColumnId = 'pausados' | 'creados' | 'listos' | 'en_despacho' | 'entregados' | 'facturados' | 'pagados';

export default function OrderKanbanView({ onEditOrder }: OrderKanbanViewProps) {
  const { ventas, setVentas, updateVenta } = useOrderStore();
  const publishEvent = useEventStore((s) => s.publishEvent);
  const userRole = useAppStore((s) => s.userRole);
  const { products, stock, setStock } = useInventoryStore();
  const { addMovimiento } = useMovementStore();

  const columns: { id: ColumnId; title: string; states: string[]; color: string; icon: React.ReactNode }[] = [
    { id: 'pausados', title: 'Pausados', states: ['PAUSADO', 'PAUSADO_POR_CREDITO'], color: '#FEE2E2', icon: <AlertCircle size={20} color="#EF4444" /> },
    { id: 'creados', title: 'Por Alistar', states: ['CREADO'], color: '#F1F5F9', icon: <PackageSearch size={20} color="#64748B" /> },
    { id: 'listos', title: 'Listos para Despacho', states: ['LISTO'], color: '#FEF3C7', icon: <Package size={20} color="#D97706" /> },
    { id: 'en_despacho', title: 'En Despacho', states: ['EN_DESPACHO'], color: '#EDE9FE', icon: <Truck size={20} color="#8B5CF6" /> },
    { id: 'entregados', title: 'Entregados', states: ['ENTREGADO'], color: '#DCFCE7', icon: <CheckCircle size={20} color="#059669" /> },
    { id: 'facturados', title: 'Facturados', states: ['FACTURADO'], color: '#E0F2FE', icon: <FileText size={20} color="#0284C7" /> },
    { id: 'pagados', title: 'Pagados / Finalizados', states: ['PAGADO', 'ANULADO'], color: '#F3F4F6', icon: <CheckCircle size={20} color="#9CA3AF" /> },
  ];

  const handleDragStart = (e: React.DragEvent, quoteId: string) => {
    e.dataTransfer.setData('quoteId', quoteId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Necesario para permitir el drop
  };

  const handleDrop = async (e: React.DragEvent, targetColumnId: ColumnId) => {
    e.preventDefault();
    const quoteId = e.dataTransfer.getData('quoteId');
    if (!quoteId) return;

    if (targetColumnId === 'pausados') {
      Swal.fire({
        icon: 'error',
        title: 'Acción no permitida',
        text: 'Los pedidos solo entran en pausa automáticamente por reglas de negocio.',
        confirmButtonColor: 'var(--primary-color)'
      });
      return;
    }

    let nuevoEstado: EstadoPedido = 'CREADO';
    if (targetColumnId === 'creados') nuevoEstado = 'CREADO';
    if (targetColumnId === 'listos') nuevoEstado = 'LISTO';
    if (targetColumnId === 'en_despacho') nuevoEstado = 'EN_DESPACHO';
    if (targetColumnId === 'entregados') nuevoEstado = 'ENTREGADO';
    if (targetColumnId === 'facturados') nuevoEstado = 'FACTURADO';
    if (targetColumnId === 'pagados') nuevoEstado = 'PAGADO';

    // Validación de permisos
    if (['listos', 'en_despacho'].includes(targetColumnId)) {
      if (!['admin', 'administrativo', 'vendedor', 'Jefe de Bodega'].includes(userRole)) {
        Swal.fire({ icon: 'error', title: 'Acceso Denegado', text: 'No tienes permisos para avanzar pedidos a este estado.', confirmButtonColor: 'var(--primary-color)' });
        return;
      }
    }

    if (['entregados', 'facturados', 'pagados'].includes(targetColumnId)) {
      if (!['admin', 'administrativo'].includes(userRole)) {
        Swal.fire({ icon: 'error', title: 'Acceso Denegado', text: 'No tienes permisos para facturar o liquidar pedidos.', confirmButtonColor: 'var(--primary-color)' });
        return;
      }
    }

    const currentQuote = ventas.find(q => q.id === quoteId);
    if (!currentQuote || currentQuote.estado === nuevoEstado) return;

    // Lógica para DESPACHO (Inventario)
    if (nuevoEstado === 'EN_DESPACHO') {
      if (currentQuote.inventarioDescontado) {
        Swal.fire({
          icon: 'error',
          title: 'Stock ya descontado',
          text: 'Este pedido ya generó una salida de inventario previamente.',
          confirmButtonColor: 'var(--primary-color)'
        });
        return;
      }

      Swal.fire({
        title: 'Despachar y Descontar Stock',
        html: `
          <div style="text-align: left; font-size: 14px;">
            <p>Se descontará el stock de bodega y el pedido pasará a EN_DESPACHO.</p>
            <label style="display: block; font-weight: 600; margin-top: 10px;">Seleccionar Conductor:</label>
            <select id="dispatch-driver" class="swal2-select" style="margin-top: 5px; width: 100%; font-size: 14px;">
              <option value="Conductor Interno 1">Conductor Interno 1</option>
              <option value="Conductor Interno 2">Conductor Interno 2</option>
              <option value="Servicio Tercerizado">Servicio Tercerizado</option>
            </select>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Confirmar y Descontar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#3B82F6',
        preConfirm: () => {
          const select = document.getElementById('dispatch-driver') as HTMLSelectElement;
          return select.value;
        }
      }).then((result) => {
        if (result.isConfirmed) {
          const conductor = result.value || 'Conductor Predeterminado';
          try {
            const newStock = { ...stock };
            const bodegaId = currentQuote.bodegaId || 'Bodega Principal';
            
            if (!newStock[bodegaId]) newStock[bodegaId] = {};

            currentQuote.lineas.forEach((linea: any) => {
              const producto = products.find((p: any) => p.id === linea.productoId);
              if (!producto) return;

              const sku = producto.sku;
              const cantidadADescontar = linea.pesoReal || linea.cantidadAlistada || linea.cantidadSolicitada;

              if (newStock[bodegaId][sku] === undefined) newStock[bodegaId][sku] = 0;
              newStock[bodegaId][sku] -= cantidadADescontar;

              addMovimiento({
                id: crypto.randomUUID(),
                timestamp: new Date().toISOString(),
                tipo: 'VENTA',
                sku: sku,
                nombreProducto: producto.nombre,
                bodegaOrigen: bodegaId,
                cantidad: cantidadADescontar,
                lote: linea.loteSeleccionado || 'DESPACHO',
                referenciaId: currentQuote.id,
                referenciaTipo: 'DESPACHO_B2B',
                actor: userRole,
                notas: \`Despacho de Pedido \${currentQuote.numeroPedido} (Conductor: \${conductor})\`
              });
            });

            setStock(newStock);

            const pedidoActualizado = {
              ...currentQuote,
              estado: 'EN_DESPACHO',
              inventarioDescontado: true,
              fechaActualizacionKanban: new Date().toISOString(),
              observaciones: \`\${currentQuote.observaciones || ''}\\nDespachado con: \${conductor}\`
            };

            updateVenta(currentQuote.id, pedidoActualizado);
            
            publishEvent('QUOTE_STATUS_CHANGED', userRole, \`Pedido despachado con \${conductor}\`, { quoteId, nuevoEstado });
            
            Swal.fire({ icon: 'success', title: 'Despacho Exitoso', text: 'El pedido está en ruta y el stock ha sido descontado.', confirmButtonColor: '#10B981' });
          } catch (e: any) {
            Swal.fire({ icon: 'error', title: 'Error interno', text: e.message, confirmButtonColor: 'var(--primary-color)' });
          }
        }
      });
      return;
    }

    // Lógica especial para cuando el pedido se mueve a 'PAGADO' (RN-58 y RN-57)
    if (nuevoEstado === 'PAGADO') {
      const turnosAbiertos = cashService.getTurnos().filter(t => t.estado === 'ABIERTO');
      
      if (turnosAbiertos.length === 0) {
        Swal.fire({
          icon: 'error',
          title: 'Operación Bloqueada',
          text: 'Debe haber al menos un Turno de Caja abierto para poder registrar el pago de un pedido B2B.',
          confirmButtonColor: 'var(--primary-color)'
        });
        return;
      }

      const totalPedido = currentQuote.totalFinal || currentQuote.subtotal || 0;

      Swal.fire({
        title: 'Registrar Pago B2B',
        html: `
          <div style="text-align: left; font-size: 14px; color: var(--text-primary);">
            <div style="margin-bottom: 12px; display: flex; justify-content: space-between; font-size: 16px; border-bottom: 2px solid #E2E8F0; padding-bottom: 8px;">
              <strong>Total a Pagar:</strong> <strong style="color: var(--primary-color);">$ ${totalPedido.toLocaleString('es-CO')}</strong>
            </div>

            <!-- Selección de Caja Destino -->
            <div style="margin-bottom: 16px; padding: 12px; background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px;">
              <label style="display: block; font-weight: 600; margin-bottom: 4px; color: #0F172A;">Caja Destino (Ingreso):</label>
              <select id="pay-b2b-caja" class="swal2-select" style="margin: 0; width: 100%; height: 38px; padding: 4px; font-size: 13px;">
                ${turnosAbiertos.map(t => {
                  const cajaInfo = cashService.getCajas().find(c => c.id === t.cajaId);
                  const isMiTurno = t.cajeroId === userRole ? ' (Mi Turno)' : '';
                  const isSelected = t.cajeroId === userRole ? 'selected' : '';
                  return `<option value="${t.id}" ${isSelected}>${cajaInfo?.nombre || 'Caja Desconocida'} - ${t.cajeroId}${isMiTurno}</option>`;
                }).join('')}
              </select>
            </div>

            <p style="margin-bottom: 12px; font-weight: 600;">Desglose de Pago:</p>
            
            <div style="display: flex; flex-direction: column; gap: 10px;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <label>Efectivo:</label>
                <input type="number" id="pay-b2b-cash" class="swal2-input" value="${totalPedido}" style="width: 150px; margin: 0; height: 36px; font-size: 14px;" />
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <label>Datáfono (Tarjeta):</label>
                <input type="number" id="pay-b2b-card" class="swal2-input" value="0" style="width: 150px; margin: 0; height: 36px; font-size: 14px;" />
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <label>Transferencia:</label>
                <input type="number" id="pay-b2b-transfer" class="swal2-input" value="0" style="width: 150px; margin: 0; height: 36px; font-size: 14px;" />
              </div>
            </div>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Registrar Pago',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: 'var(--primary-color)',
        preConfirm: () => {
          const cash = parseFloat((document.getElementById('pay-b2b-cash') as HTMLInputElement).value) || 0;
          const card = parseFloat((document.getElementById('pay-b2b-card') as HTMLInputElement).value) || 0;
          const transfer = parseFloat((document.getElementById('pay-b2b-transfer') as HTMLInputElement).value) || 0;
          const turnoId = (document.getElementById('pay-b2b-caja') as HTMLSelectElement).value;

          const totalIngresado = cash + card + transfer;

          if (totalIngresado < totalPedido) {
            Swal.showValidationMessage(`El pago desglosado ($${totalIngresado.toLocaleString('es-CO')}) no cubre el total del pedido ($${totalPedido.toLocaleString('es-CO')}). Faltan $${(totalPedido - totalIngresado).toLocaleString('es-CO')}`);
            return false;
          }

          if (!turnoId) {
            Swal.showValidationMessage('Debe seleccionar una Caja Destino.');
            return false;
          }

          return { cash, card, transfer, turnoId, change: totalIngresado - totalPedido };
        }
      }).then(async (result) => {
        if (result.isConfirmed && result.value) {
          const { cash, card, transfer, turnoId, change } = result.value;
          
          try {
            // Nota: Aquí se usará useOrderStore o b2bService dependiendo del modelo unificado
            const resultado = b2bService.cambiarEstadoPedido(quoteId, nuevoEstado); // Podría requerir updateVenta
            if (resultado.error) {
              Swal.fire({ icon: 'error', title: 'Error de transición', text: resultado.error, confirmButtonColor: 'var(--primary-color)' });
              return;
            }

            const turnoDestino = cashService.getTurnos().find(t => t.id === turnoId);
            if (turnoDestino) {
              const orderNoStr = currentQuote.numeroPedido || currentQuote.id;
              const refId = currentQuote.id;
              
              const efectivoReal = Math.max(0, cash - change);
              if (efectivoReal > 0) {
                cashService.registrarMovimiento(turnoDestino.id, turnoDestino.cajaId, 'INGRESO_VENTA', 'EFECTIVO', efectivoReal, `Pago B2B (Pedido: ${orderNoStr})`, refId, userRole);
              }
              if (card > 0) {
                cashService.registrarMovimiento(turnoDestino.id, turnoDestino.cajaId, 'INGRESO_VENTA', 'DATAFONO', card, `Pago B2B (Pedido: ${orderNoStr})`, refId, userRole);
              }
              if (transfer > 0) {
                cashService.registrarMovimiento(turnoDestino.id, turnoDestino.cajaId, 'INGRESO_VENTA', 'TRANSFERENCIA', transfer, `Pago B2B (Pedido: ${orderNoStr})`, refId, userRole);
              }
            }

            setVentas((prev: any[]) => prev.map((q: any) => q.id === quoteId ? { ...q, estado: nuevoEstado, fechaActualizacionKanban: new Date().toISOString() } : q));
            publishEvent('QUOTE_STATUS_CHANGED', userRole, `Pedido pagado y registrado en Caja`, { quoteId, nuevoEstado });
            
            Swal.fire({ icon: 'success', title: 'Pago Registrado', text: 'El pedido ha sido marcado como pagado y el ingreso se registró en la caja.', confirmButtonColor: 'var(--primary-color)' });

          } catch (e: any) {
            Swal.fire({ icon: 'error', title: 'Error interno', text: e.message, confirmButtonColor: 'var(--primary-color)' });
          }
        }
      });
      
      return; // Detenemos la ejecución síncrona aquí porque dependemos de la promesa del Swal
    }

    try {
      // También podríamos querer unificar con Supabase update acá, por ahora update local state
      const resultado = b2bService.cambiarEstadoPedido(quoteId, nuevoEstado);
      if (resultado.error) {
        Swal.fire({ icon: 'error', title: 'Error de transición', text: resultado.error, confirmButtonColor: 'var(--primary-color)' });
        return;
      }

      setVentas((prev: any[]) => prev.map((q: any) => q.id === quoteId ? { ...q, estado: nuevoEstado, fechaActualizacionKanban: new Date().toISOString() } : q));
      
      publishEvent('QUOTE_STATUS_CHANGED', userRole, `Pedido actualizado a estado ${nuevoEstado}`, { quoteId, nuevoEstado });
    } catch (e: any) {
      Swal.fire({ icon: 'error', title: 'Error interno', text: e.message, confirmButtonColor: 'var(--primary-color)' });
    }
  };

  return (
    <div className="animate-fade-in" style={{ padding: '24px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#1E293B', margin: 0 }}>Kanban B2B</h2>
          <p style={{ color: '#64748B', margin: '4px 0 0 0', fontSize: '14px' }}>Flujo logístico: Creado → Listo → En Despacho → Entregado → Facturado → Pagado.</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '20px', flex: 1, overflowX: 'auto', paddingBottom: '16px' }}>
        {columns.map(column => {
          const now = new Date();
          const cutoffTime = new Date(now);
          cutoffTime.setHours(6, 0, 0, 0);
          if (now.getHours() < 6) cutoffTime.setDate(cutoffTime.getDate() - 1);

          const columnQuotes = ventas.filter(q => {
            if (!column.states.includes(q.estado)) return false;
            
            if (['PAGADO', 'ANULADO'].includes(q.estado)) {
              const updateTimeStr = (q as any).fechaActualizacionKanban || q.fecha;
              if (!updateTimeStr) return false;
              const updateTime = new Date(updateTimeStr);
              if (isNaN(updateTime.getTime())) return true; 
              if (updateTime < cutoffTime) return false;
            }
            return true;
          });

          return (
            <div
              key={column.id}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
              style={{
                flex: '0 0 320px',
                backgroundColor: column.color,
                borderRadius: '12px',
                display: 'flex',
                flexDirection: 'column',
                border: '1px solid #E2E8F0',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
              }}
            >
              <div style={{ padding: '16px', borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {column.icon}
                  <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#1E293B' }}>{column.title}</h3>
                </div>
                <div style={{ backgroundColor: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 700, color: '#475569', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                  {columnQuotes.length}
                </div>
              </div>

              <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {columnQuotes.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#94A3B8', fontSize: '13px', padding: '24px 0', fontStyle: 'italic' }}>
                    Sin pedidos
                  </div>
                ) : (
                  columnQuotes.map(quote => (
                    <div
                      key={quote.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, quote.id)}
                      onClick={() => onEditOrder(quote)}
                      style={{
                        backgroundColor: 'white',
                        padding: '16px',
                        borderRadius: '8px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                        border: '1px solid #E2E8F0',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary-color)' }}>{quote.numeroPedido || (quote as any).no}</div>
                          <div style={{ fontSize: '14px', fontWeight: 700, color: '#1E293B', marginTop: '2px' }}>{(quote as any).clientName || quote.clienteId || 'Cliente No Identificado'}</div>
                        </div>
                        {quote.estado === 'PAUSADO' && (
                          <span style={{ backgroundColor: '#FEE2E2', color: '#EF4444', fontSize: '10px', padding: '2px 6px', borderRadius: '4px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <AlertCircle size={10} /> Peso &gt; 5%
                          </span>
                        )}
                        {quote.estado === 'PAUSADO_POR_CREDITO' && (
                          <span style={{ backgroundColor: '#FEE2E2', color: '#EF4444', fontSize: '10px', padding: '2px 6px', borderRadius: '4px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <AlertCircle size={10} /> Cupo Lleno
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748B' }}>
                        <FileText size={14} />
                        <span>{quote.lineas?.length || 0} ítems</span>
                      </div>

                      {quote.tipoEntrega === 'EN_RUTA' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748B' }}>
                          <Truck size={14} />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            En Ruta Asignada
                          </span>
                        </div>
                      )}

                      <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '8px', marginTop: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: '11px', color: '#94A3B8' }}>{quote.fecha}</div>
                        <div style={{ fontWeight: 800, color: '#1E293B', fontSize: '14px' }}>
                          ${(quote.totalFinal || quote.subtotal || 0).toLocaleString('es-CO')}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
