import { useMemo } from 'react';
import { useExpenseStore } from '../store/useExpenseStore';
import { useARStore } from '../store/useARStore';
import { usePurchaseStore } from '../store/usePurchaseStore';
import { useEmployeeStore } from '../store/useEmployeeStore';
import type { CalendarEvent } from '../types/calendar.types';
import { parseISO, isValid } from 'date-fns';

export function useCalendarEvents(): CalendarEvent[] {
  // Suscripción a los 4 stores
  const gastos = useExpenseStore(state => state.gastos);
  const cartera = useARStore(state => state.cartera);
  const cuentasPorPagar = usePurchaseStore(state => state.cuentasPorPagar);
  const nominas = useEmployeeStore(state => state.nominas);

  // Memorizamos la agregación para evitar re-cálculos pesados en cada render
  const events = useMemo(() => {
    const allEvents: CalendarEvent[] = [];

    // 1. Cuentas por Cobrar (Clientes)
    cartera.forEach(inv => {
      if (!inv.fechaVencimiento) return;
      const parsedDate = parseISO(inv.fechaVencimiento);
      if (!isValid(parsedDate)) return;

      allEvents.push({
        id: `cxc-${inv.id}`,
        title: `Cobro Factura ${inv.id}`,
        date: parsedDate,
        amount: inv.saldo > 0 ? inv.saldo : inv.total,
        category: 'ACCOUNTS_RECEIVABLE',
        isPaid: inv.saldo === 0,
        referenceId: inv.id,
        entityName: inv.clienteNombre
      });
    });

    // 2. Cuentas por Pagar (Proveedores)
    cuentasPorPagar.forEach(cpp => {
      if (!cpp.fechaVencimiento) return;
      const parsedDate = parseISO(cpp.fechaVencimiento);
      if (!isValid(parsedDate)) return;

      allEvents.push({
        id: `cxp-${cpp.id}`,
        title: `Pago CxP ${cpp.ordenCompraId}`,
        date: parsedDate,
        amount: cpp.saldoPendiente > 0 ? cpp.saldoPendiente : cpp.montoTotal,
        category: 'ACCOUNTS_PAYABLE',
        isPaid: cpp.estado === 'PAGADA',
        referenceId: cpp.id,
        entityName: cpp.proveedorNombre
      });
    });

    // 3. Gastos y Servicios Públicos
    gastos.forEach(g => {
      if (!g.fecha) return;
      const parsedDate = parseISO(g.fecha);
      if (!isValid(parsedDate)) return;
      
      // Filtramos para no duplicar nóminas, ya que nómina tiene su propio store
      if (g.categoria === 'NÓMINA') return;

      allEvents.push({
        id: `exp-${g.id}`,
        title: g.concepto,
        date: parsedDate,
        amount: g.monto,
        category: g.categoria === 'SERVICIOS_PUBLICOS' ? 'UTILITY_BILL' : 'OTHER',
        isPaid: true, // Los gastos registrados ya están pagados, o deberíamos modelar "gastos proyectados"
        referenceId: g.id,
        entityName: g.categoria
      });
    });

    // 4. Nóminas (Payroll)
    nominas.forEach(n => {
      if (!n.fechaEmision) return;
      const parsedDate = parseISO(n.fechaEmision);
      if (!isValid(parsedDate)) return;

      allEvents.push({
        id: `pay-${n.id}`,
        title: `Nómina ${n.periodoInicio} al ${n.periodoFin}`,
        date: parsedDate,
        amount: n.netoAPagar,
        category: 'PAYROLL',
        isPaid: n.estadoPago === 'PAGADO',
        referenceId: n.id,
        entityName: n.empleadoNombre
      });
    });

    return allEvents;
  }, [gastos, cartera, cuentasPorPagar, nominas]);

  return events;
}
