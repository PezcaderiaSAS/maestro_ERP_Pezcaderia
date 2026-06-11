import React from 'react';
import { Truck, CheckCircle, PackageSearch, Package, Clock, AlertCircle, FileText } from 'lucide-react';
import Swal from 'sweetalert2';

interface OrderKanbanViewProps {
  quotations: any[];
  setQuotations: React.Dispatch<React.SetStateAction<any[]>>;
  publishEvent: (tipo: any, actor: string, descripcion: string, metadata?: any) => void;
  userRole: string;
}

type ColumnId = 'por-revisar' | 'en-proceso' | 'listo' | 'completados';

export default function OrderKanbanView({
  quotations,
  setQuotations,
  publishEvent,
  userRole
}: OrderKanbanViewProps) {

  const columns: { id: ColumnId; title: string; states: string[]; color: string; icon: React.ReactNode }[] = [
    { id: 'por-revisar', title: 'Por Revisar', states: ['Creado', 'Sent'], color: '#F1F5F9', icon: <PackageSearch size={20} color="#64748B" /> },
    { id: 'en-proceso', title: 'En Proceso', states: ['Approved', 'Pausado'], color: '#E0F2FE', icon: <Clock size={20} color="#0284C7" /> },
    { id: 'listo', title: 'Listos para Despacho', states: ['Listo'], color: '#FEF3C7', icon: <Package size={20} color="#D97706" /> },
    { id: 'completados', title: 'Completados', states: ['Sold'], color: '#DCFCE7', icon: <CheckCircle size={20} color="#059669" /> },
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
    if (targetColumnId === 'completados') nuevoEstado = 'Sold';

    // Validación de permisos
    if (targetColumnId === 'en-proceso' || targetColumnId === 'listo') {
      if (userRole !== 'admin' && userRole !== 'administrativo' && userRole !== 'vendedor' && userRole !== 'Jefe de Bodega') {
        Swal.fire({
          icon: 'error',
          title: 'Acceso Denegado',
          text: 'No tienes permisos para avanzar pedidos a este estado.',
          confirmButtonColor: 'var(--primary-color)'
        });
        return;
      }
    }

    if (targetColumnId === 'completados') {
      if (userRole !== 'admin' && userRole !== 'administrativo' && userRole !== 'vendedor') {
        Swal.fire({
          icon: 'error',
          title: 'Acceso Denegado',
          text: 'No tienes permisos para facturar/completar pedidos.',
          confirmButtonColor: 'var(--primary-color)'
        });
        return;
      }
    }

    const currentQuote = quotations.find(q => q.id === quoteId);
    if (!currentQuote || currentQuote.estado === nuevoEstado) return;

    // Confirmar si pasa a completado
    if (targetColumnId === 'completados') {
      Swal.fire({
        title: '¿Completar Pedido?',
        text: 'Esto marcará el pedido como facturado/entregado de forma definitiva.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, Completar',
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
    setQuotations(prev => prev.map(q => q.id === quoteId ? { ...q, estado: nuevoEstado } : q));
    
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
          const columnQuotes = quotations.filter(q => column.states.includes(q.estado));

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
                      style={{
                        backgroundColor: 'white',
                        padding: '16px',
                        borderRadius: '8px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                        border: '1px solid #E2E8F0',
                        cursor: 'grab',
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
