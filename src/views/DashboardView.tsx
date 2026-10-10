import { ReactNode, useState } from 'react';
import { DollarSign, ShoppingBag, PlusCircle, ArrowUpRight, Wallet, RefreshCw } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { calculateDashboardMetrics } from '../services/metricsService';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useCalendarEvents } from '../services/calendarService';
import { CalendarGrid } from './dashboard/CalendarGrid';
import { EventSidePanel } from './dashboard/EventSidePanel';
import type { CalendarEvent } from '../types/calendar.types';

interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  positive: boolean;
  icon: ReactNode;
  iconTheme?: 'emerald' | 'blue' | 'purple' | 'rose';
}

function MetricCard({ title, value, change, positive, icon, iconTheme = 'emerald' }: MetricCardProps) {
  const themeStyles = {
    emerald: {
      iconBg: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      badge: 'bg-emerald-50 text-emerald-800 border-emerald-200'
    },
    blue: {
      iconBg: 'bg-blue-100 text-blue-700 border-blue-200',
      badge: 'bg-blue-50 text-blue-800 border-blue-200'
    },
    purple: {
      iconBg: 'bg-purple-100 text-purple-700 border-purple-200',
      badge: 'bg-purple-50 text-purple-800 border-purple-200'
    },
    rose: {
      iconBg: 'bg-rose-100 text-rose-700 border-rose-200',
      badge: 'bg-rose-50 text-rose-800 border-rose-200'
    }
  }[iconTheme];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between gap-4">
      <div className="flex justify-between items-start">
        <span className="text-xs md:text-sm font-bold text-slate-600 uppercase tracking-wider">{title}</span>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-xs ${themeStyles.iconBg}`}>
          {icon}
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-3xl font-black text-slate-900 tracking-tight">{value}</span>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className={`text-xs font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${themeStyles.badge}`}>
            {positive ? '+' : ''}{change} {positive ? <ArrowUpRight size={13} /> : null}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function DashboardView({ ventas = [], parametros: _parametros = {}, devoluciones = [] }: any) {
  const setView = useAppStore((s) => s.setCurrentView);
  
  // Métricas financieras
  const {
    totalSalesToday,
    salesTodayCount,
    isolatedCajaFisica,
    totalDigitalSales,
    totalDevoluciones
  } = calculateDashboardMetrics(ventas, devoluciones);

  // Hook del adaptador de calendario
  const calendarEvents = useCalendarEvents();
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const handleProcessAction = (event: CalendarEvent) => {
    // Redirigir según el tipo de obligación
    switch (event.category) {
      case 'PAYROLL':
        setView('rrhh');
        break;
      case 'ACCOUNTS_PAYABLE':
        setView('compras');
        break;
      case 'ACCOUNTS_RECEIVABLE':
        setView('clientes');
        break;
      default:
        // default fallback
        break;
    }
  };

  return (
    <div className="animate-fade-in flex flex-col gap-4 md:gap-6 p-4 md:p-6 h-full overflow-y-auto">
      
      {/* Encabezado */}
      <div>
        <span className="text-xs md:text-sm font-extrabold uppercase tracking-wider text-slate-500">
          Resumen Ejecutivo & Calendario Operativo
        </span>
        <h2 className="text-2xl md:text-3xl font-black mt-1 tracking-tight text-slate-900">
          Panel de Control y Obligaciones
        </h2>
      </div>
 
      {/* Grid de Metricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-5">
        <MetricCard
          title="Ventas del Día"
          value={`$${totalSalesToday.toLocaleString('es-CO')}`}
          change={`${salesTodayCount} transacciones`}
          positive={totalSalesToday > 0}
          iconTheme="emerald"
          icon={<DollarSign size={20} />}
        />
        <MetricCard
          title="Caja Chica (Efectivo Neto)"
          value={`$${isolatedCajaFisica.toLocaleString('es-CO')}`}
          change="Excluye canales digitales (RN-06)"
          positive={true}
          iconTheme="blue"
          icon={<Wallet size={20} />}
        />
        <MetricCard
          title="Canales Digitales (Shopify/Rappi)"
          value={`$${totalDigitalSales.toLocaleString('es-CO')}`}
          change="Procesado en cola (RN-03)"
          positive={totalDigitalSales > 0}
          iconTheme="purple"
          icon={<ShoppingBag size={20} />}
        />
        <MetricCard
          title="Notas de Crédito Hoy"
          value={`$${totalDevoluciones.toLocaleString('es-CO')}`}
          change="Cancelaciones de pedido"
          positive={false}
          iconTheme="rose"
          icon={<RefreshCw size={20} />}
        />
      </div>
 
      {/* Split-View Calendario (Adaptativo) */}
      <div className={`grid gap-4 md:gap-6 flex-1 transition-all duration-300 ${selectedEvent ? 'grid-cols-1 lg:grid-cols-[1fr_350px] xl:grid-cols-[1fr_400px]' : 'grid-cols-1'}`}>
        
        {/* Izquierda: Calendario (CSS Grid) */}
        <div className="min-h-[500px] lg:h-[650px] flex flex-col">
          <CalendarGrid 
            events={calendarEvents} 
            onSelectEvent={(evt) => {
              setSelectedEvent(evt);
              // Auto-scroll to side panel on mobile
              if (window.innerWidth < 1024) {
                setTimeout(() => {
                  document.getElementById('event-side-panel')?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }
            }} 
            selectedEventId={selectedEvent?.id}
          />
        </div>

        {/* Derecha: Side Panel dinámico */}
        {selectedEvent && (
          <div id="event-side-panel" className="min-h-[400px] lg:h-[650px] flex flex-col">
            <EventSidePanel 
              event={selectedEvent} 
              onClose={() => setSelectedEvent(null)}
              onAction={handleProcessAction}
            />
          </div>
        )}
        
      </div>
    </div>
  );
}
