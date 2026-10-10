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
      case 'PAYROLL': return 'bg-cyan-50 text-cyan-950 border border-cyan-300 hover:bg-cyan-100';
      case 'ACCOUNTS_PAYABLE': return 'bg-rose-50 text-rose-950 border border-rose-300 hover:bg-rose-100';
      case 'ACCOUNTS_RECEIVABLE': return 'bg-emerald-50 text-emerald-950 border border-emerald-300 hover:bg-emerald-100';
      case 'UTILITY_BILL': return 'bg-amber-50 text-amber-950 border border-amber-300 hover:bg-amber-100';
      default: return 'bg-slate-100 text-slate-900 border border-slate-300 hover:bg-slate-200';
    }
  };

  while (day <= endDate) {
    for (let i = 0; i < 7; i++) {
      formattedDate = format(day, "d");
      const cloneDay = day;
      const inMonth = isSameMonth(day, monthStart);
      const today = isToday(day);
      
      // Filtrar eventos del día (inmutabilidad estricta)
      const dayEvents = events.filter(e => isSameDay(e.date, cloneDay));
      
      days.push(
        <div 
          key={day.toISOString()} 
          className={`min-h-[75px] md:min-h-[105px] p-1.5 md:p-2.5 transition-colors flex flex-col justify-between
            ${inMonth ? (today ? 'bg-blue-50/70' : 'bg-white hover:bg-slate-50') : 'bg-slate-50/90 text-slate-400'}
            ${today ? 'ring-2 ring-inset ring-blue-600' : ''}
          `}
        >
          <div className="flex justify-between items-start mb-1">
            <span className={`text-xs md:text-sm font-bold ${
              today 
                ? 'bg-blue-600 text-white px-1.5 py-0.5 rounded-md shadow-xs' 
                : inMonth ? 'text-slate-800' : 'text-slate-400'
            }`}>
              {formattedDate}
            </span>
            {today && (
              <span className="hidden md:inline-block text-[10px] font-extrabold uppercase tracking-wider text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded border border-blue-200">
                Hoy
              </span>
            )}
          </div>
          
          <div className="flex flex-col gap-1 mt-1 flex-1 overflow-y-auto max-h-[85px]">
            {dayEvents.map(event => (
              <button
                key={event.id}
                onClick={() => onSelectEvent(event)}
                className={`text-[10px] md:text-xs font-semibold px-1.5 py-0.5 md:py-1 rounded text-left truncate w-full transition-all shadow-xs
                  ${getEventColor(event.category)}
                  ${selectedEventId === event.id ? 'ring-2 ring-blue-600 ring-offset-1' : ''}
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
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
      {/* Header del Calendario */}
      <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl border border-blue-200 shadow-xs">
            <CalendarIcon size={20} className="text-blue-700" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">Calendario Operativo</span>
            <h2 className="text-xl md:text-2xl font-black capitalize text-slate-900 tracking-tight">
              {format(currentDate, dateFormat, { locale: es })}
            </h2>
          </div>
        </div>
        <div className="flex items-center gap-1.5 md:gap-2">
          <Button 
            variant="outline" 
            onClick={prevMonth} 
            icon={<ChevronLeft size={16} />}
            className="bg-white hover:bg-slate-100 text-slate-700 border-slate-300 shadow-xs px-2.5 py-1.5" 
          />
          <Button 
            variant="outline" 
            onClick={() => setCurrentDate(new Date())}
            className="bg-white hover:bg-slate-100 text-slate-800 font-bold border-slate-300 shadow-xs px-3.5 py-1.5 text-xs"
          >
            Hoy
          </Button>
          <Button 
            variant="outline" 
            onClick={nextMonth} 
            icon={<ChevronRight size={16} />}
            className="bg-white hover:bg-slate-100 text-slate-700 border-slate-300 shadow-xs px-2.5 py-1.5" 
          />
        </div>
      </div>

      {/* Días de la semana */}
      <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-100/90">
        {weekDays.map(d => (
          <div key={d} className="py-2.5 text-center text-xs font-black text-slate-700 uppercase tracking-wider">
            {d}
          </div>
        ))}
      </div>

      {/* Grid del mes con bordes de 1px usando gap-px bg-slate-200 */}
      <div className="grid grid-cols-7 flex-1 auto-rows-fr bg-slate-200 gap-px">
        {days}
      </div>
    </div>
  );
}
