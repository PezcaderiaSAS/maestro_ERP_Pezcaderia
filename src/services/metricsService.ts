// src/services/metricsService.ts
/**
 * Servicio de métricas agregadas y cálculos ejecutivos para el Dashboard del ERP.
 * Desacopla la lógica pesada de negocio de las vistas (conforme a Constitución del ERP).
 */

export interface TransaccionResumen {
  id: string;
  descripcion: string;
  tipo: 'INGRESO' | 'EGRESO';
  valor: number;
  hora: string;
}

export interface DashboardMetrics {
  totalSalesToday: number;
  salesTodayCount: number;
  isolatedCajaFisica: number;
  totalDigitalSales: number;
  totalDevoluciones: number;
  transaccionesRecientes: TransaccionResumen[];
}

/**
 * Calcula las métricas ejecutivas del Dashboard a partir de ventas y devoluciones.
 * RN-06: Aisla canales digitales de la caja chica de efectivo neto.
 * RN-03: Agrupa ventas de canales digitales (Shopify/Rappi).
 */
export function calculateDashboardMetrics(
  ventas: any[] = [],
  devoluciones: any[] = []
): DashboardMetrics {
  const todayStr = new Date().toISOString().split('T')[0];
  const salesToday = ventas.filter((v: any) => v.fecha && v.fecha.startsWith(todayStr));

  // 1. Ventas del Día
  const totalSalesToday = salesToday.reduce((sum: number, v: any) => sum + (v.total || 0), 0);

  // 2. Caja Chica (Efectivo Neto en POS) - RN-06: Aislar canales digitales
  const isolatedCajaFisica = salesToday.reduce((sum: number, v: any) => {
    // Excluir si viene de un canal digital
    if (v.metadata?.canal) return sum;
    
    // Sumar el efectivo recibido neto del cambio entregado
    const efectivoRecibido = v.montoPagadoEfectivo || 0;
    const cambio = v.cambioEntregado || 0;
    return sum + Math.max(0, efectivoRecibido - cambio);
  }, 0);

  // 3. Ventas por Canales Digitales (RN-03)
  const totalDigitalSales = salesToday
    .filter((v: any) => v.metadata?.canal)
    .reduce((sum: number, v: any) => sum + (v.total || 0), 0);

  // 4. Devoluciones / Notas de Crédito Hoy
  const totalDevoluciones = devoluciones
    .filter((d: any) => d.fechaValidacion && d.fechaValidacion.startsWith(todayStr))
    .reduce((sum: number, d: any) => {
      const devAmount = (d.items || []).reduce((s: number, item: any) => {
        const qty = item.cantidadRecibida || 0;
        return s + qty * (item.precioUnitarioVenta || 0);
      }, 0);
      return sum + devAmount;
    }, 0);

  // 5. Transacciones Recientes (últimas 5 ventas)
  const transaccionesRecientes: TransaccionResumen[] = ventas.slice(0, 5).map((v: any) => {
    const hora = v.fecha ? new Date(v.fecha).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) : '--:--';
    const esDigital = !!v.metadata?.canal;
    const desc = esDigital 
      ? `Pedido Digital (${v.metadata.canal.toUpperCase()}) - ${v.metadata.id_pedido_externo || ''}` 
      : `Venta POS (${v.clienteNombre || 'Cliente Contado'})`;
    return {
      id: (v.id || '').slice(0, 10).toUpperCase(),
      descripcion: desc,
      tipo: 'INGRESO',
      valor: v.total || 0,
      hora
    };
  });

  return {
    totalSalesToday,
    salesTodayCount: salesToday.length,
    isolatedCajaFisica,
    totalDigitalSales,
    totalDevoluciones,
    transaccionesRecientes
  };
}
