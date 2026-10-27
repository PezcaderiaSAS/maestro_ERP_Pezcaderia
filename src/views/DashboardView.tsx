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
import { ExecutiveTrafficLightWidget } from './dashboard/components/ExecutiveTrafficLightWidget';
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
      iconBg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
    },
    blue: {
      iconBg: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30'
    },
    purple: {
      iconBg: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30'
    },
    rose: {
      iconBg: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
      badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30'
    }
  }[iconTheme];

  return (
    <div className="bg-slate-900/85 backdrop-blur-2xl rounded-xl border border-white/12 shadow-md hover:border-cyan-500/40 transition-all p-3.5 flex flex-col justify-between gap-2.5 text-white">
      <div className="flex justify-between items-start">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{title}</span>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center border shadow-xs ${themeStyles.iconBg}`}>
          {icon}
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-xl sm:text-2xl font-black font-mono text-white tracking-tight">{value}</span>
        <div className="flex items-center gap-1">
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border flex items-center gap-1 ${themeStyles.badge}`}>
            {positive ? '+' : ''}{change} {positive ? <ArrowUpRight size={11} /> : null}
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
    <div className="animate-fade-in flex flex-col gap-3 md:gap-3.5 p-1 md:p-2 h-full">
      
      {/* Encabezado Compacto */}
      <div className="flex items-center justify-between pb-0.5">
        <div>
          <span className="text-[10px] md:text-xs font-extrabold uppercase tracking-wider text-slate-400">
            Resumen Ejecutivo & Calendario Operativo
          </span>
          <h2 className="text-lg md:text-xl font-black tracking-tight text-white m-0">
            Panel de Control y Obligaciones
          </h2>
        </div>
      </div>

      {/* Semáforo Operativo Ejecutivo (Regla del Niño de 12 Años - TASK-018-11) */}
      <ExecutiveTrafficLightWidget cajaDisponibleOverride={isolatedCajaFisica > 0 ? isolatedCajaFisica : undefined} />
 
      {/* Grid de Metricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2.5 md:gap-3">
        <MetricCard
          title="Ventas del Día"
          value={`$${totalSalesToday.toLocaleString('es-CO')}`}
          change={`${salesTodayCount} transacciones`}
          positive={totalSalesToday > 0}
          iconTheme="emerald"
          icon={<DollarSign size={16} />}
        />
        <MetricCard
          title="Caja Chica (Efectivo Neto)"
          value={`$${isolatedCajaFisica.toLocaleString('es-CO')}`}
          change="Excluye canales digitales (RN-06)"
          positive={true}
          iconTheme="blue"
          icon={<Wallet size={16} />}
        />
        <MetricCard
          title="Canales Digitales (Shopify/Rappi)"
          value={`$${totalDigitalSales.toLocaleString('es-CO')}`}
          change="Procesado en cola (RN-03)"
          positive={totalDigitalSales > 0}
          iconTheme="purple"
          icon={<ShoppingBag size={16} />}
        />
        <MetricCard
          title="Notas de Crédito Hoy"
          value={`$${totalDevoluciones.toLocaleString('es-CO')}`}
          change="Cancelaciones de pedido"
          positive={false}
          iconTheme="rose"
          icon={<RefreshCw size={16} />}
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
