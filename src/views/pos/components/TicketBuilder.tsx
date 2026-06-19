import React from 'react';
import { Printer } from 'lucide-react';
import { usePOSPrinter } from '../../../hooks/usePOSPrinter';
import type { VentaPOS } from '../../../types/pos.types';
import type { ClientePrinter } from '../../../hooks/usePOSPrinter';
import Swal from 'sweetalert2';

interface TicketBuilderProps {
  venta: VentaPOS;
  cliente: ClientePrinter | null;
  onPrinted?: () => void;
}

export const TicketBuilder: React.FC<TicketBuilderProps> = ({
  venta,
  cliente,
  onPrinted,
}) => {
  const { printing, formatearTextoTicket, imprimirTicket } = usePOSPrinter();

  const ticketText = formatearTextoTicket(venta, cliente);

  const handlePrint = async () => {
    const success = await imprimirTicket(venta, cliente);
    if (success) {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Ticket enviado a la impresora',
        showConfirmButton: false,
        timer: 1500
      });
      if (onPrinted) onPrinted();
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Error de Impresión',
        text: 'No se pudo completar la impresión en la ticketera.',
        confirmButtonColor: 'var(--primary-color)'
      });
    }
  };

  return (
    <div 
      className="ticket-preview-container" 
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        backgroundColor: '#F8FAFC',
        border: '1px solid #E2E8F0',
        borderRadius: '12px',
        padding: '16px',
        maxWidth: '350px',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>
          Previsualización de Ticket
        </span>
        <button
          onClick={handlePrint}
          disabled={printing}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            padding: '6px 12px',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: 'var(--primary-color)',
            color: '#FFFFFF',
            cursor: printing ? 'not-allowed' : 'pointer',
            fontWeight: 700,
            boxShadow: '0 2px 4px rgba(14, 116, 144, 0.2)',
          }}
        >
          <Printer size={14} />
          <span>{printing ? 'Imprimiendo...' : 'Imprimir'}</span>
        </button>
      </div>

      <pre
        style={{
          fontFamily: 'monospace',
          fontSize: '11px',
          backgroundColor: '#FFFFFF',
          border: '1px solid #CBD5E1',
          borderRadius: '8px',
          padding: '12px',
          color: '#1E293B',
          margin: 0,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)',
        }}
      >
        {ticketText}
      </pre>
    </div>
  );
};
