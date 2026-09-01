import React from 'react';
import { Printer } from 'lucide-react';

interface QuotePrintModalProps {
  selectedQuoteForPrint: any;
  onClose: () => void;
  onPrint: () => void;
}

export const QuotePrintModal: React.FC<QuotePrintModalProps> = ({
  selectedQuoteForPrint,
  onClose,
  onPrint,
}) => {
  if (!selectedQuoteForPrint) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
      <div style={{ display: 'flex', gap: '12px', width: '100%', maxWidth: '800px', justifyContent: 'flex-end' }} className="no-print">
        <button onClick={onClose} className="btn-secondary" style={{ padding: '10px 20px' }}>
          Volver al Editor
        </button>
        <button
          onClick={onPrint}
          className="btn-primary"
          style={{
            border: 'none',
            padding: '10px 20px',
            backgroundColor: 'var(--primary-color)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Printer size={18} />
          Imprimir / Guardar PDF
        </button>
      </div>

      {/* Formato Proforma */}
      <div
        id="quotation-print-sheet"
        style={{
          backgroundColor: 'white',
          width: '100%',
          maxWidth: '800px',
          border: '1px solid #E2E8F0',
          boxShadow: 'var(--shadow-lg)',
          padding: '40px',
          borderRadius: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          color: '#0F172A',
        }}
      >
        {/* Encabezado Cotización */}
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #E2E8F0', paddingBottom: '20px' }}>
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: 900, color: 'var(--primary-color)', letterSpacing: '-0.5px' }}>LA PEZCADERÍA S.A.S.</h1>
            <p style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>
              NIT: 901.482.911-5<br />
              Dirección: Carrera 15 # 85-32, Bogotá D.C.<br />
              Teléfono: +57 (312) 485-9921 | Email: ventas@lapezcaderia.com
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span
              className={`badge-${selectedQuoteForPrint.estado.toLowerCase()}`}
              style={{
                padding: '4px 10px',
                borderRadius: '8px',
                fontSize: '11px',
                fontWeight: 'bold',
                color:
                  selectedQuoteForPrint.estado === 'Approved'
                    ? '#10B981'
                    : selectedQuoteForPrint.estado === 'Sent'
                    ? 'var(--primary-color)'
                    : '#64748B',
                backgroundColor:
                  selectedQuoteForPrint.estado === 'Approved'
                    ? '#D1FAE5'
                    : selectedQuoteForPrint.estado === 'Sent'
                    ? 'var(--primary-light)'
                    : '#F1F5F9',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor:
                    selectedQuoteForPrint.estado === 'Approved'
                      ? '#10B981'
                      : selectedQuoteForPrint.estado === 'Sent'
                      ? 'var(--primary-color)'
                      : '#64748B',
                }}
              ></span>
              Estado: {selectedQuoteForPrint.estado}
            </span>
            <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#1E293B', marginTop: '12px' }}>{selectedQuoteForPrint.no}</h2>
            <p style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>
              Fecha: {selectedQuoteForPrint.fecha}<br />
              Vencimiento: {selectedQuoteForPrint.vencimiento} (15 días)
            </p>
          </div>
        </div>

        {/* Datos Tercero */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', backgroundColor: '#F8FAFC', padding: '16px', borderRadius: '12px' }}>
          <div>
            <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Cotizado A:</span>
            <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#1E293B', marginTop: '4px' }}>{selectedQuoteForPrint.clientName.toUpperCase()}</h3>
            {selectedQuoteForPrint.clientIdent && <p style={{ fontSize: '12px', color: '#475569', marginTop: '2px' }}>NIT/CC: {selectedQuoteForPrint.clientIdent}</p>}
          </div>
          <div>
            <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Canal de Ventas:</span>
            <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--primary-color)', marginTop: '4px' }}>
              Lista Especial:{' '}
              {selectedQuoteForPrint.clientType === 'POS'
                ? 'VENTA DIRECTA POS'
                : selectedQuoteForPrint.clientType === 'RESTAURANTE'
                ? 'RESTAURANTES / HORECA'
                : 'MAYORISTA / DISTRIBUIDORES'}
            </p>
            <p style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>Vendedor: Administrador ERP</p>
          </div>
        </div>

        {/* Tabla Productos */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #E2E8F0' }}>
              <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '12px', color: '#64748B', fontWeight: 700 }}>SKU</th>
              <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '12px', color: '#64748B', fontWeight: 700 }}>DESCRIPCIÓN</th>
              <th style={{ textAlign: 'right', padding: '12px 8px', fontSize: '12px', color: '#64748B', fontWeight: 700 }}>CANTIDAD</th>
              <th style={{ textAlign: 'right', padding: '12px 8px', fontSize: '12px', color: '#64748B', fontWeight: 700 }}>PRECIO UNIT.</th>
              {selectedQuoteForPrint.items.some((i: any) => i.descuento > 0) && (
                <th style={{ textAlign: 'right', padding: '12px 8px', fontSize: '12px', color: '#64748B', fontWeight: 700 }}>DESC.</th>
              )}
              <th style={{ textAlign: 'right', padding: '12px 8px', fontSize: '12px', color: '#64748B', fontWeight: 700 }}>SUBTOTAL</th>
            </tr>
          </thead>
          <tbody>
            {selectedQuoteForPrint.items.map((item: any) => {
              const lineTotal = item.precio * item.cantidad * (1 - item.descuento / 100);
              return (
                <tr key={item.sku} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '12px 8px', fontSize: '12px', fontWeight: 700, color: '#64748B' }}>{item.sku}</td>
                  <td style={{ padding: '12px 8px', fontSize: '13px', fontWeight: 600 }}>{item.nombre}</td>
                  <td style={{ padding: '12px 8px', fontSize: '13px', textAlign: 'right' }}>{item.cantidad}</td>
                  <td style={{ padding: '12px 8px', fontSize: '13px', textAlign: 'right' }}>${item.precio.toLocaleString('es-CO')}</td>
                  {selectedQuoteForPrint.items.some((i: any) => i.descuento > 0) && (
                    <td style={{ padding: '12px 8px', fontSize: '13px', textAlign: 'right', color: '#EF4444' }}>
                      {item.descuento > 0 ? `${item.descuento}%` : '-'}
                    </td>
                  )}
                  <td style={{ padding: '12px 8px', fontSize: '13px', fontWeight: 700, textAlign: 'right' }}>
                    ${Math.round(lineTotal).toLocaleString('es-CO')}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Desglose Totales */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
          <div style={{ width: '300px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748B' }}>
              <span>Subtotal Bruto:</span>
              <span>${selectedQuoteForPrint.subtotal.toLocaleString('es-CO')}</span>
            </div>
            {selectedQuoteForPrint.descuentos > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#EF4444' }}>
                <span>Descuentos Aplicados:</span>
                <span>-${Math.round(selectedQuoteForPrint.descuentos).toLocaleString('es-CO')}</span>
              </div>
            )}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '18px',
                fontWeight: 900,
                color: 'var(--primary-color)',
                borderTop: '2px solid var(--primary-color)',
                paddingTop: '12px',
                marginTop: '4px',
              }}
            >
              <span>TOTAL NETO:</span>
              <span>${selectedQuoteForPrint.total.toLocaleString('es-CO')}</span>
            </div>
          </div>
        </div>

        {/* Términos y Firmas */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '40px', marginTop: '40px', borderTop: '1px solid #E2E8F0', paddingTop: '24px' }}>
          <div>
            <h4 style={{ fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Términos y Condiciones:</h4>
            <ol style={{ fontSize: '11px', color: '#64748B', paddingLeft: '14px', marginTop: '6px', lineHeight: 1.6 }}>
              <li>Los precios cotizados no incluyen IVA (productos de pesca exentos/excluidos según estatuto).</li>
              <li>Esta proforma no representa una reserva de inventario físico hasta ser confirmada con orden de compra.</li>
              <li>El despacho se realizará de acuerdo al cronograma de rutas de La Pezcadería.</li>
            </ol>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100px' }}>
            <div style={{ width: '80%', borderBottom: '1px solid #94A3B8' }}></div>
            <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 600, marginTop: '8px' }}>Firma Autorizada</span>
          </div>
        </div>
      </div>
    </div>
  );
};
