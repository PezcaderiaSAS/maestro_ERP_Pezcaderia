import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { X, CheckCircle, Info, Building, CreditCard, Clock, AlertTriangle } from 'lucide-react';
import type { CalendarEvent } from '../../types/calendar.types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

interface EventSidePanelProps {
  event: CalendarEvent;
  onClose: () => void;
  onAction?: (event: CalendarEvent) => void;
}

export function EventSidePanel({ event, onClose, onAction }: EventSidePanelProps) {
  
  const getCategoryDetails = () => {
    switch (event.category) {
      case 'PAYROLL':
        return { label: 'Nómina de Empleado', icon: <Building size={16} />, color: 'var(--cyan-500, #06b6d4)' };
      case 'ACCOUNTS_PAYABLE':
        return { label: 'Pago a Proveedor', icon: <CreditCard size={16} />, color: 'var(--rose-500, #f43f5e)' };
      case 'ACCOUNTS_RECEIVABLE':
        return { label: 'Cobro a Cliente', icon: <CheckCircle size={16} />, color: 'var(--emerald-500, #10b981)' };
      case 'UTILITY_BILL':
        return { label: 'Servicio Público', icon: <AlertTriangle size={16} />, color: 'var(--amber-500, #f59e0b)' };
      default:
        return { label: 'Otro Compromiso', icon: <Info size={16} />, color: 'var(--slate-500, #64748b)' };
    }
  };

  const details = getCategoryDetails();

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xl h-full flex flex-col p-0 animate-fade-in relative overflow-hidden">
      {/* Header del panel */}
      <div className="p-4 border-b border-slate-200 flex justify-between items-start bg-slate-50">
        <div>
          <div className="flex items-center gap-2 mb-1.5" style={{ color: details.color }}>
            {details.icon}
            <span className="text-xs font-black uppercase tracking-wider">{details.label}</span>
          </div>
          <h3 className="text-lg font-black text-slate-900 leading-tight">{event.title}</h3>
        </div>
        <button 
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Cuerpo del panel */}
      <div className="p-5 flex-1 flex flex-col gap-5 overflow-y-auto">
        
        {/* Info principal */}
        <div className="flex flex-col gap-1.5 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <span className="text-[11px] text-slate-500 font-extrabold uppercase tracking-wider">Monto de la Obligación</span>
          <span className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight break-all">
            ${event.amount.toLocaleString('es-CO')}
          </span>
          <div className="mt-1">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold border ${
              event.isPaid 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                : 'bg-amber-50 text-amber-800 border-amber-300'
            }`}>
              {event.isPaid ? 'Completado / Pagado' : 'Pendiente por Pagar'}
            </span>
          </div>
        </div>

        {/* Detalles específicos */}
        <div className="flex flex-col gap-3.5">
          <div className="flex gap-3 items-start p-2.5 rounded-xl bg-white border border-slate-200">
            <div className="p-2 rounded-lg bg-slate-100 text-slate-700 mt-0.5 shadow-xs">
              <Clock size={16} />
            </div>
            <div>
              <span className="block text-[11px] text-slate-500 font-bold uppercase">Fecha de Compromiso</span>
              <span className="block text-sm font-bold text-slate-800">
                {format(event.date, "EEEE, d 'de' MMMM, yyyy", { locale: es })}
              </span>
            </div>
          </div>

          <div className="flex gap-3 items-start p-2.5 rounded-xl bg-white border border-slate-200">
            <div className="p-2 rounded-lg bg-slate-100 text-slate-700 mt-0.5 shadow-xs">
              <Building size={16} />
            </div>
            <div>
              <span className="block text-[11px] text-slate-500 font-bold uppercase">Entidad / Tercero</span>
              <span className="block text-sm font-bold text-slate-800">
                {event.entityName}
              </span>
            </div>
          </div>
          
          <div className="flex gap-3 items-start p-2.5 rounded-xl bg-white border border-slate-200">
            <div className="p-2 rounded-lg bg-slate-100 text-slate-700 mt-0.5 shadow-xs">
              <Info size={16} />
            </div>
            <div>
              <span className="block text-[11px] text-slate-500 font-bold uppercase">ID de Referencia</span>
              <span className="block text-xs font-mono font-bold text-slate-700">
                {event.referenceId}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Acciones (Footer) */}
      <div className="p-4 border-t border-slate-200 bg-slate-50 flex flex-col gap-2.5">
        {!event.isPaid && (
          <Button 
            variant="primary"
            className="w-full justify-center py-3 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
            onClick={() => onAction && onAction(event)}
          >
            Procesar Obligación
          </Button>
        )}
        <Button 
          variant="outline"
          className="w-full justify-center py-2 text-sm font-semibold bg-white hover:bg-slate-100 text-slate-700 border-slate-300"
          onClick={onClose}
        >
          Cerrar Panel
        </Button>
      </div>
    </div>
  );
}
