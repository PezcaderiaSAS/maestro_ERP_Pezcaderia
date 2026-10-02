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
}

function MetricCard({ title, value, change, positive, icon }: MetricCardProps) {
  return (
    <Card glass style={{ display: 'flex', flexDirection: 'column', gap: '12px', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '13px', color: 'var(--text-secondary, #64748B)', fontWeight: 600 }}>{title}</span>
        <div style={{
          width: '36px', height: '36px', borderRadius: '10px',
          backgroundColor: positive ? 'rgba(0, 177, 113, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center'
        }}>
          {icon}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <span style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.5px' }}>{value}</span>
        <span style={{ fontSize: '12px', color: positive ? 'var(--success-color, #10B981)' : 'var(--error-color, #EF4444)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px' }}>
          {positive ? '+' : ''}{change} <ArrowUpRight size={12} />
        </span>
      </div>
    </Card>
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
        <span className="text-xs md:text-sm font-medium text-slate-400">Resumen Ejecutivo & Calendario</span>
        <h2 className="text-xl md:text-2xl font-extrabold mt-1 tracking-tight text-primary">Panel de Control y Obligaciones</h2>
      </div>
 
      {/* Grid de Metricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-5">
        <MetricCard
          title="Ventas del Día"
          value={`$${totalSalesToday.toLocaleString('es-CO')}`}
          change={`${salesTodayCount} transacciones`}
          positive={totalSalesToday > 0}
          icon={<DollarSign size={18} color="var(--success-color, #00B171)" />}
        />
        <MetricCard
          title="Caja Chica (Efectivo Neto)"
          value={`$${isolatedCajaFisica.toLocaleString('es-CO')}`}
          change="Excluye canales digitales (RN-06)"
          positive={true}
          icon={<Wallet size={18} color="var(--success-color, #00B171)" />}
        />
        <MetricCard
          title="Canales Digitales (Shopify/Rappi)"
          value={`$${totalDigitalSales.toLocaleString('es-CO')}`}
          change="Procesado en cola (RN-03)"
          positive={totalDigitalSales > 0}
          icon={<ShoppingBag size={18} color="var(--success-color, #00B171)" />}
        />
        <MetricCard
          title="Notas de Crédito Hoy"
          value={`$${totalDevoluciones.toLocaleString('es-CO')}`}
          change="Cancelaciones de pedido"
          positive={false}
          icon={<RefreshCw size={18} color="var(--error-color, #EF4444)" />}
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
