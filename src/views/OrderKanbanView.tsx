import React from 'react';
import { Truck, CheckCircle, PackageSearch, Package, Clock, AlertCircle, FileText } from 'lucide-react';
import Swal from 'sweetalert2';

interface OrderKanbanViewProps {
  quotations: any[];
  setQuotations: React.Dispatch<React.SetStateAction<any[]>>;
  publishEvent: (tipo: any, actor: string, descripcion: string, metadata?: any) => void;
  userRole: string;
  onEditOrder: (quote: any) => void;
}

type ColumnId = 'por-revisar' | 'en-proceso' | 'listo' | 'en-entrega' | 'entregado' | 'finalizado';

export default function OrderKanbanView({
  quotations,
  setQuotations,
  publishEvent,
  userRole,
  onEditOrder
}: OrderKanbanViewProps) {

  const columns: { id: ColumnId; title: string; states: string[]; color: string; icon: React.ReactNode }[] = [
    { id: 'por-revisar', title: 'Por Revisar', states: ['Creado', 'Sent'], color: '#F1F5F9', icon: <PackageSearch size={20} color="#64748B" /> },
    { id: 'en-proceso', title: 'En Proceso', states: ['Approved', 'Pausado'], color: '#E0F2FE', icon: <Clock size={20} color="#0284C7" /> },
    { id: 'listo', title: 'Listos para Despacho', states: ['Listo'], color: '#FEF3C7', icon: <Package size={20} color="#D97706" /> },
    { id: 'en-entrega', title: 'En Entrega', states: ['En Entrega'], color: '#EDE9FE', icon: <Truck size={20} color="#8B5CF6" /> },
    { id: 'entregado', title: 'Entregado', states: ['Entregado'], color: '#DCFCE7', icon: <CheckCircle size={20} color="#059669" /> },
    { id: 'finalizado', title: 'Finalizado', states: ['Sold', 'Finalizado'], color: '#F3F4F6', icon: <CheckCircle size={20} color="#9CA3AF" /> },
  ];

  const handleDragStart = (e: React.DragEvent, quoteId: string) => {
    e.dataTransfer.setData('quoteId', quoteId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Necesario para permitir el drop
  };

  const handleDrop = (e: React.DragEvent, targetColumnId: ColumnId) => {
    e.preventDefault();
    const quoteId = e.dataTransfer.getData('quoteId');
    if (!quoteId) return;

    // Obtener el estado destino basado en la columna
    let nuevoEstado = '';
    if (targetColumnId === 'por-revisar') nuevoEstado = 'Creado';
    if (targetColumnId === 'en-proceso') nuevoEstado = 'Approved';
    if (targetColumnId === 'listo') nuevoEstado = 'Listo';
    if (targetColumnId === 'en-entrega') nuevoEstado = 'En Entrega';
    if (targetColumnId === 'entregado') nuevoEstado = 'Entregado';
    if (targetColumnId === 'finalizado') nuevoEstado = 'Finalizado';

    // Validación de permisos
    if (['en-proceso', 'listo', 'en-entrega'].includes(targetColumnId)) {
      if (!['admin', 'administrativo', 'vendedor', 'Jefe de Bodega'].includes(userRole)) {
        Swal.fire({
          icon: 'error',
          title: 'Acceso Denegado',
          text: 'No tienes permisos para avanzar pedidos a este estado.',
          confirmButtonColor: 'var(--primary-color)'
        });
        return;
      }
    }

    if (['entregado', 'finalizado'].includes(targetColumnId)) {
      if (!['admin', 'administrativo', 'vendedor'].includes(userRole)) {
        Swal.fire({
          icon: 'error',
          title: 'Acceso Denegado',
          text: 'No tienes permisos para marcar pedidos como entregados/finalizados.',
          confirmButtonColor: 'var(--primary-color)'
        });
        return;
      }
    }

    const currentQuote = quotations.find(q => q.id === quoteId);
    if (!currentQuote || currentQuote.estado === nuevoEstado) return;

    // Confirmar si pasa a finalizado
    if (targetColumnId === 'finalizado') {
      Swal.fire({
        title: '¿Finalizar Pedido?',
        text: 'Esto marcará el pedido como completado definitivamente.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, Finalizar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#10B981'
      }).then((result) => {
        if (result.isConfirmed) {
          updateQuoteState(quoteId, nuevoEstado);
        }
      });
    } else {
      updateQuoteState(quoteId, nuevoEstado);
    }
  };

  const updateQuoteState = (quoteId: string, nuevoEstado: string) => {
    setQuotations(prev => prev.map(q => q.id === quoteId ? { ...q, estado: nuevoEstado, fechaActualizacionKanban: new Date().toISOString() } : q));
    
    publishEvent(
      'QUOTE_STATUS_CHANGED',
      userRole,
      `Pedido actualizado a estado ${nuevoEstado}`,
      { quoteId, nuevoEstado }
    );
  };

  return (
    <div className="animate-fade-in" style={{ padding: '24px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#1E293B', margin: 0 }}>Kanban de Pedidos</h2>
          <p style={{ color: '#64748B', margin: '4px 0 0 0', fontSize: '14px' }}>Arrastra y suelta los pedidos para actualizar su estado logístico.</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '20px', flex: 1, overflowX: 'auto', paddingBottom: '16px' }}>
        {columns.map(column => {
          // Lógica de limpieza para finalizados (6:00 am del día actual)
          const now = new Date();
          const cutoffTime = new Date(now);
          cutoffTime.setHours(6, 0, 0, 0);
          if (now.getHours() < 6) {
            cutoffTime.setDate(cutoffTime.getDate() - 1);
          }

          const columnQuotes = quotations.filter(q => {
            if (!column.states.includes(q.estado)) return false;
            
            // Si es un estado finalizado, ocultarlo si fue modificado antes del cutoff
            if (['Sold', 'Finalizado'].includes(q.estado)) {
              const updateTimeStr = q.fechaActualizacionKanban || q.fecha;
              // Si no podemos parsear la fecha, asumimos que es vieja
              if (!updateTimeStr) return false;
              
              const updateTime = new Date(updateTimeStr);
              // Validar si la fecha es inválida (por formato DD/MM/YYYY)
              if (isNaN(updateTime.getTime())) {
                // Intento simple de parsear DD/MM/YYYY o usar fecha actual como fallback
                // En un caso real, esto dependerá del formato guardado en q.fecha
                return true; 
              }
              if (updateTime < cutoffTime) {
                return false; // Se oculta porque ya pasó de las 6am del nuevo día
              }
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
                          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary-color)' }}>{quote.no}</div>
                          <div style={{ fontSize: '14px', fontWeight: 700, color: '#1E293B', marginTop: '2px' }}>{quote.clientName}</div>
                        </div>
                        {quote.estado === 'Pausado' && (
                          <span style={{ backgroundColor: '#FEE2E2', color: '#EF4444', fontSize: '10px', padding: '2px 6px', borderRadius: '4px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <AlertCircle size={10} /> Pausado
                          </span>
                        )}
                        {quote.estado === 'Approved' && (
                          <span style={{ backgroundColor: '#E0E7FF', color: '#4338CA', fontSize: '10px', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                            Aprobado
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748B' }}>
                        <FileText size={14} />
                        <span>{quote.items?.length || 0} ítems</span>
                      </div>

                      {quote.logistica && quote.logistica.tipoEntrega !== 'RECOGEN' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748B' }}>
                          <Truck size={14} />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {quote.logistica.direccionEntrega || 'Sin dirección'}
                          </span>
                        </div>
                      )}

                      <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '8px', marginTop: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: '11px', color: '#94A3B8' }}>{quote.fecha}</div>
                        <div style={{ fontWeight: 800, color: '#1E293B', fontSize: '14px' }}>
                          ${quote.total?.toLocaleString('es-CO') || 0}
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
