import { useState } from 'react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays,
  isToday
} from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import type { CalendarEvent } from '../../types/calendar.types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

interface CalendarGridProps {
  events: CalendarEvent[];
  onSelectEvent: (event: CalendarEvent) => void;
  selectedEventId?: string;
}

export function CalendarGrid({ events, onSelectEvent, selectedEventId }: CalendarGridProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Lunes
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const dateFormat = "MMMM yyyy";
  const days = [];
  let day = startDate;
  let formattedDate = "";

  // Generar nombres de días de la semana
  const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  const getEventColor = (category: string) => {
    switch(category) {
      case 'PAYROLL': return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
      case 'ACCOUNTS_PAYABLE': return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      case 'ACCOUNTS_RECEIVABLE': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'UTILITY_BILL': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  while (day <= endDate) {
    for (let i = 0; i < 7; i++) {
      formattedDate = format(day, "d");
      const cloneDay = day;
      
      // Filtrar eventos del día (inmutabilidad estricta)
      const dayEvents = events.filter(e => isSameDay(e.date, cloneDay));
      
      days.push(
        <div 
          key={day.toISOString()} 
          className={`min-h-[70px] md:min-h-[100px] p-1 md:p-2 border border-white/5 transition-colors
            ${!isSameMonth(day, monthStart) ? 'opacity-30' : ''}
            ${isToday(day) ? 'bg-primary/10' : 'hover:bg-white/5'}
          `}
        >
          <div className="flex justify-between items-start mb-0.5 md:mb-1">
            <span className={`text-xs md:text-sm font-semibold ${isToday(day) ? 'text-primary' : 'text-slate-400'}`}>
              {formattedDate}
            </span>
          </div>
          
          <div className="flex flex-col gap-1 mt-1">
            {dayEvents.map(event => (
              <button
                key={event.id}
                onClick={() => onSelectEvent(event)}
                className={`text-[9px] md:text-xs px-1 py-0.5 md:py-1 md:px-1.5 rounded border text-left truncate w-full transition-all
                  ${getEventColor(event.category)}
                  ${selectedEventId === event.id ? 'ring-2 ring-primary ring-offset-1 ring-offset-slate-900' : 'hover:brightness-125'}
                  ${event.isPaid ? 'opacity-50 line-through' : ''}
                `}
              >
                ${event.amount.toLocaleString('es-CO')} <span className="hidden md:inline">- {event.title}</span>
              </button>
            ))}
          </div>
        </div>
      );
      day = addDays(day, 1);
    }
  }

  return (
    <Card glass className="p-0 overflow-hidden flex flex-col h-full">
      {/* Header del Calendario */}
      <div className="p-4 border-b border-white/10 flex justify-between items-center bg-slate-900/40">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/20 rounded-lg">
            <CalendarIcon className="text-primary" size={20} />
          </div>
          <h2 className="text-xl font-bold capitalize text-white">
            {format(currentDate, dateFormat, { locale: es })}
          </h2>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={prevMonth} icon={<ChevronLeft size={16} />} />
          <Button variant="outline" onClick={() => setCurrentDate(new Date())}>Hoy</Button>
          <Button variant="outline" onClick={nextMonth} icon={<ChevronRight size={16} />} />
        </div>
      </div>

      {/* Días de la semana */}
      <div className="grid grid-cols-7 border-b border-white/10 bg-slate-900/60">
        {weekDays.map(d => (
          <div key={d} className="p-2 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">
            {d}
          </div>
        ))}
      </div>

      {/* Grid del mes */}
      <div className="grid grid-cols-7 flex-1 auto-rows-fr">
        {days}
      </div>
    </Card>
  );
}
