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
    <Card glass className="h-full flex flex-col p-0 border-l border-white/10 animate-fade-in shadow-2xl relative">
      {/* Header del panel */}
      <div className="p-4 border-b border-white/10 flex justify-between items-start bg-slate-900/40">
        <div>
          <div className="flex items-center gap-2 mb-2" style={{ color: details.color }}>
            {details.icon}
            <span className="text-xs font-bold uppercase tracking-wider">{details.label}</span>
          </div>
          <h3 className="text-lg font-bold text-white leading-tight">{event.title}</h3>
        </div>
        <button 
          onClick={onClose}
          className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* Cuerpo del panel */}
      <div className="p-5 flex-1 flex flex-col gap-6 overflow-y-auto">
        
        {/* Info principal */}
        <div className="flex flex-col gap-2">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Monto de la Obligación</span>
          <span className="text-3xl md:text-4xl font-extrabold text-white tracking-tighter break-all">
            ${event.amount.toLocaleString('es-CO')}
          </span>
          <div className="mt-1">
            <Badge variant={event.isPaid ? 'success' : 'warning'}>
              {event.isPaid ? 'Completado / Pagado' : 'Pendiente'}
            </Badge>
          </div>
        </div>

        <div className="h-px w-full bg-white/5"></div>

        {/* Detalles específicos */}
        <div className="flex flex-col gap-4">
          <div className="flex gap-3 items-start">
            <div className="p-2 rounded bg-white/5 text-slate-400 mt-0.5">
              <Clock size={16} />
            </div>
            <div>
              <span className="block text-xs text-slate-500 font-semibold">Fecha de Compromiso</span>
              <span className="block text-sm font-medium text-slate-200">
                {format(event.date, "EEEE, d 'de' MMMM, yyyy", { locale: es })}
              </span>
            </div>
          </div>

          <div className="flex gap-3 items-start">
            <div className="p-2 rounded bg-white/5 text-slate-400 mt-0.5">
              <Building size={16} />
            </div>
            <div>
              <span className="block text-xs text-slate-500 font-semibold">Entidad / Tercero</span>
              <span className="block text-sm font-medium text-slate-200">
                {event.entityName}
              </span>
            </div>
          </div>
          
          <div className="flex gap-3 items-start">
            <div className="p-2 rounded bg-white/5 text-slate-400 mt-0.5">
              <Info size={16} />
            </div>
            <div>
              <span className="block text-xs text-slate-500 font-semibold">ID de Referencia</span>
              <span className="block text-xs font-mono text-slate-300">
                {event.referenceId}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Acciones (Footer) */}
      <div className="p-4 border-t border-white/10 bg-slate-900/60 flex flex-col gap-3">
        {!event.isPaid && (
          <Button 
            variant="primary"
            className="w-full justify-center py-3 text-sm"
            onClick={() => onAction && onAction(event)}
          >
            Procesar Obligación
          </Button>
        )}
        <Button 
          variant="outline"
          className="w-full justify-center"
          onClick={onClose}
        >
          Cerrar Panel
        </Button>
      </div>
    </Card>
  );
}
