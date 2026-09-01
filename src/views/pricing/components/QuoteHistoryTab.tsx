import React from 'react';

interface QuoteHistoryTabProps {
  quotations: any[];
  onSelectQuoteForPrint: (q: any) => void;
  onEditQuote: (q: any) => void;
  onTransitionQuote: (id: string, newStatus: string) => void;
}

export const QuoteHistoryTab: React.FC<QuoteHistoryTabProps> = ({
  quotations,
  onSelectQuoteForPrint,
  onEditQuote,
  onTransitionQuote,
}) => {
  return (
    <div className="hr-table-card" style={{ padding: '24px' }}>
      <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '16px' }}>Cotizaciones Registradas en el Sistema</h3>

      {quotations.length === 0 ? (
        <div style={{ padding: '48px', textAlign: 'center', color: '#64748B', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '48px' }}>📂</span>
          <span style={{ fontWeight: 500 }}>No hay cotizaciones registradas</span>
          <span style={{ fontSize: '12px' }}>Usa la pestaña "Nuevo Cotizador" para registrar una cotización.</span>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="hr-table">
            <thead>
              <tr>
                <th>Nro Doc</th>
                <th>Fecha</th>
                <th>Cliente</th>
                <th>Canal</th>
                <th>Items</th>
                <th>Total Neto</th>
                <th>Estado</th>
                <th>Flujo de Trabajo (Workflow)</th>
              </tr>
            </thead>
            <tbody>
              {quotations.map((q: any) => {
                let statusColor = '#64748B';
                let statusBg = '#F1F5F9';
                if (q.estado === 'Sent') {
                  statusColor = 'var(--primary-color)';
                  statusBg = 'var(--primary-light)';
                } else if (q.estado === 'Approved') {
                  statusColor = '#10B981';
                  statusBg = '#D1FAE5';
                } else if (q.estado === 'Pausado') {
                  statusColor = '#F59E0B';
                  statusBg = '#FEF3C7';
                } else if (q.estado === 'Listo') {
                  statusColor = '#8B5CF6';
                  statusBg = '#EDE9FE';
                } else if (q.estado === 'Sold' || q.estado === 'Facturado') {
                  statusColor = '#0EA5E9';
                  statusBg = '#E0F2FE';
                } else if (q.estado === 'Expired') {
                  statusColor = '#EF4444';
                  statusBg = '#FEE2E2';
                }

                return (
                  <tr key={q.id}>
                    <td style={{ fontWeight: 'bold', color: 'var(--primary-color)' }}>{q.no}</td>
                    <td>{q.fecha}</td>
                    <td>
                      <div style={{ fontWeight: 700 }}>{q.clientName}</div>
                      <div style={{ fontSize: '11px', color: '#64748B' }}>NIT: {q.clientIdent || 'N/A'}</div>
                    </td>
                    <td>
                      <span style={{ fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '12px', backgroundColor: '#F1F5F9' }}>
                        {q.clientType}
                      </span>
                    </td>
                    <td>{q.items.reduce((sum: number, i: any) => sum + i.cantidad, 0)} uds</td>
                    <td style={{ fontWeight: 'bold' }}>${q.total.toLocaleString('es-CO')}</td>
                    <td>
                      <span
                        style={{
                          padding: '4px 10px',
                          borderRadius: '8px',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          color: statusColor,
                          backgroundColor: statusBg,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: statusColor }}></span>
                        {q.estado}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          className="btn-secondary"
                          style={{ padding: '6px 10px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                          onClick={() => onSelectQuoteForPrint(q)}
                        >
                          Ver PDF
                        </button>

                        {q.estado !== 'Sold' && q.estado !== 'Facturado' && (
                          <button
                            type="button"
                            className="btn-secondary"
                            style={{ padding: '6px 10px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', borderColor: '#F59E0B', color: '#D97706' }}
                            onClick={() => onEditQuote(q)}
                          >
                            Editar
                          </button>
                        )}

                        {q.estado === 'Creado' && (
                          <>
                            <button
                              type="button"
                              className="btn-primary"
                              style={{ padding: '6px 10px', fontSize: '11px', border: 'none', backgroundColor: 'var(--primary-color)', color: 'white' }}
                              onClick={() => onTransitionQuote(q.id, 'Sent')}
                            >
                              Enviar Cliente
                            </button>
                            <button
                              type="button"
                              className="btn-primary"
                              style={{ padding: '6px 10px', fontSize: '11px', border: 'none', backgroundColor: '#10B981', color: 'white' }}
                              onClick={() => onTransitionQuote(q.id, 'Approved')}
                            >
                              Aprobar
                            </button>
                          </>
                        )}

                        {q.estado === 'Draft' && (
                          <button
                            type="button"
                            className="btn-primary"
                            style={{ padding: '6px 10px', fontSize: '11px', border: 'none', backgroundColor: 'var(--primary-color)', color: 'white' }}
                            onClick={() => onTransitionQuote(q.id, 'Sent')}
                          >
                            Enviar Cliente
                          </button>
                        )}

                        {q.estado === 'Sent' && (
                          <>
                            <button
                              type="button"
                              className="btn-primary"
                              style={{ padding: '6px 10px', fontSize: '11px', border: 'none', backgroundColor: '#10B981', color: 'white' }}
                              onClick={() => onTransitionQuote(q.id, 'Approved')}
                            >
                              Aprobar
                            </button>
                            <button
                              type="button"
                              className="btn-secondary"
                              style={{ padding: '6px 10px', fontSize: '11px', color: '#EF4444', borderColor: '#EF4444' }}
                              onClick={() => onTransitionQuote(q.id, 'Expired')}
                            >
                              Vencer
                            </button>
                          </>
                        )}

                        {q.estado === 'Approved' && (
                          <>
                            <button
                              type="button"
                              className="btn-primary"
                              style={{ padding: '6px 10px', fontSize: '11px', border: 'none', backgroundColor: '#F59E0B', color: 'white' }}
                              onClick={() => onTransitionQuote(q.id, 'Pausado')}
                            >
                              Pausar
                            </button>
                            <button
                              type="button"
                              className="btn-primary"
                              style={{ padding: '6px 10px', fontSize: '11px', border: 'none', backgroundColor: '#8B5CF6', color: 'white' }}
                              onClick={() => onTransitionQuote(q.id, 'Listo')}
                            >
                              Listo Despacho
                            </button>
                          </>
                        )}

                        {q.estado === 'Pausado' && (
                          <>
                            <button
                              type="button"
                              className="btn-primary"
                              style={{ padding: '6px 10px', fontSize: '11px', border: 'none', backgroundColor: '#8B5CF6', color: 'white' }}
                              onClick={() => onTransitionQuote(q.id, 'Listo')}
                            >
                              Aprobar Alistamiento (Listo)
                            </button>
                            <button
                              type="button"
                              className="btn-secondary"
                              style={{ padding: '6px 10px', fontSize: '11px', color: '#3B82F6', borderColor: '#3B82F6' }}
                              onClick={() => onTransitionQuote(q.id, 'Approved')}
                            >
                              Re-Aprobar
                            </button>
                          </>
                        )}

                        {q.estado === 'Listo' && (
                          <button
                            type="button"
                            className="btn-primary"
                            style={{ padding: '6px 10px', fontSize: '11px', border: 'none', backgroundColor: '#0EA5E9', color: 'white' }}
                            onClick={() => onTransitionQuote(q.id, 'Sold')}
                          >
                            Facturar Venta
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
