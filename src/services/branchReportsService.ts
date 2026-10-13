// src/services/branchReportsService.ts

import { jsPDF } from 'jspdf';
import { load } from './localDb';
import type { ResultadoOperacion } from '../types/common.types';
import type { Bodega } from '../types/inventory.types';
import type { VentaPOS } from '../types/pos.types';
import type { MovimientoInventario } from './inventoryService';
import {
  BranchSalesReportFilterSchema,
  type BranchSalesReportFilter,
  type BranchSalesSummary,
} from '../../packages/validation-schemas/src/branchInventory.schema';

export interface MovimientoSucursalItem {
  id: string;
  fecha: string;
  tipo: string;
  concepto: string;
  sku: string;
  nombre: string;
  cantidad: number;
  origen: string;
  destino: string;
}

/**
 * 1. Genera el resumen consolidado de ventas por sucursal con cálculos deterministas.
 * Cumple con la regla de redondeo entero COP (Math.round).
 */
export function generarReporteVentasPorSucursal(
  filtros: BranchSalesReportFilter
): ResultadoOperacion<BranchSalesSummary[]> {
  const parseResult = BranchSalesReportFilterSchema.safeParse(filtros);
  if (!parseResult.success) {
    return { data: null, error: parseResult.error.errors.map((e) => e.message).join('; ') };
  }

  const { sucursalId, fechaInicio, fechaFin, metodoPago } = parseResult.data;

  try {
    const bodegas = load<Bodega[]>('bodegas', [
      { id: 'b-1', nombre: 'Bodega Principal', activa: true, esencial: true, esPuntoVenta: false },
      { id: 'b-pos-1', nombre: 'Punto de Venta Mostrador', activa: true, esencial: false, esPuntoVenta: true },
      { id: 'b-pos-2', nombre: 'Punto de Venta Norte', activa: true, esencial: false, esPuntoVenta: true },
    ]);

    // Buscar ventas en las colecciones estándar y deduplicar por ID
    const posOrders = load<VentaPOS[]>('pos_orders', []);
    const salesOrders = load<any[]>('sales_orders', []);
    const ventasMap = new Map<string, VentaPOS>();
    for (const v of [...posOrders, ...salesOrders]) {
      if (v && v.id) {
        ventasMap.set(v.id, v);
      }
    }
    const todasLasVentas: VentaPOS[] = Array.from(ventasMap.values());

    // Filtrar por fechas de forma determinista (inmune a desfases UTC)
    const fechaIniIso = fechaInicio.slice(0, 10);
    const fechaFinIso = fechaFin.slice(0, 10);

    const ventasFiltradas = todasLasVentas.filter((v) => {
      const vFechaStr = (v.fecha || '').slice(0, 10);
      if (!vFechaStr) return false;
      if (vFechaStr < fechaIniIso || vFechaStr > fechaFinIso) return false;

      if (metodoPago !== 'TODOS') {
        const pago = (v.formaPago || v.metodoPago || '').toUpperCase();
        if (pago !== metodoPago) return false;
      }
      return true;
    });

    // Determinar qué bodegas incluir
    const bodegasAProcesar =
      sucursalId === 'TODAS'
        ? bodegas.filter((b) => b.esPuntoVenta || b.tipo === 'PUNTO_VENTA' || b.id.includes('pos'))
        : bodegas.filter((b) => b.id === sucursalId);

    // Si la lista de bodegas a procesar está vacía (ej: id no encontrado en catálogo), procesar directamente el sucursalId
    const listaFinal =
      bodegasAProcesar.length > 0
        ? bodegasAProcesar
        : [{ id: sucursalId, nombre: `Sucursal ${sucursalId}`, activa: true }];

    const resumenes: BranchSalesSummary[] = listaFinal.map((bodega) => {
      // Filtrar ventas asignadas a esta sucursal (por sucursalId o bodegaId)
      const ventasDeEstaBodega = ventasFiltradas.filter((v) => {
        const idAsignado = v.sucursalId || v.bodegaId || (v as any).posBranchId;
        // Si no tiene asignación explícita pero solo hay una sucursal, asociar por defecto
        if (!idAsignado && listaFinal.length === 1) return true;
        return idAsignado === bodega.id;
      });

      let totalVentasCOP = 0;
      let totalKilos = 0;
      let totalUnidades = 0;
      const desgloseMediosPago: Record<string, number> = {
        EFECTIVO: 0,
        NEQUI: 0,
        TARJETA: 0,
        TRANSFERENCIA: 0,
        CREDITO: 0,
      };

      for (const v of ventasDeEstaBodega) {
        const montoVenta = Math.round(v.totalFinal || v.total || 0);
        totalVentasCOP += montoVenta;

        // Sumar medios de pago
        const forma = (v.formaPago || v.metodoPago || 'EFECTIVO').toUpperCase();
        if (forma.includes('EFECT')) {
          desgloseMediosPago.EFECTIVO += Math.round(v.montoPagadoEfectivo ?? montoVenta);
        } else if (forma.includes('NEQUI')) {
          desgloseMediosPago.NEQUI += montoVenta;
        } else if (forma.includes('TARJET')) {
          desgloseMediosPago.TARJETA += Math.round(v.montoPagadoTarjeta ?? montoVenta);
        } else if (forma.includes('TRANSF')) {
          desgloseMediosPago.TRANSFERENCIA += Math.round(v.montoPagadoTransferencia ?? montoVenta);
        } else if (forma.includes('CRED')) {
          desgloseMediosPago.CREDITO += Math.round(v.montoPagadoCredito ?? montoVenta);
        } else {
          desgloseMediosPago[forma] = (desgloseMediosPago[forma] || 0) + montoVenta;
        }

        // Analizar líneas
        for (const line of v.lineas || v.items || []) {
          const cant = Number(line.cantidad) || 0;
          if (line.unidad === 'KG' || (line as any).unidadMedida === 'KG') {
            totalKilos += cant;
          } else {
            totalUnidades += Math.round(cant);
          }
        }
      }

      const ticketsCount = ventasDeEstaBodega.length;
      const ticketPromedioCOP = ticketsCount > 0 ? Math.round(totalVentasCOP / ticketsCount) : 0;

      return {
        sucursalId: bodega.id,
        sucursalNombre: bodega.nombre,
        totalVentasCOP: Math.round(totalVentasCOP),
        totalKilos: Math.round(totalKilos * 1000) / 1000,
        totalUnidades: Math.round(totalUnidades),
        ticketsCount,
        ticketPromedioCOP,
        desgloseMediosPago,
      };
    });

    return { data: resumenes, error: null };
  } catch (err: any) {
    return { data: null, error: err?.message || 'Error al generar el reporte de ventas por sucursal' };
  }
}

/**
 * 2. Genera el reporte de trazabilidad de movimientos (entradas por traslado vs salidas por venta) para una sucursal.
 */
export function generarReporteMovimientosSucursal(params: {
  sucursalId: string;
  fechaInicio?: string;
  fechaFin?: string;
}): ResultadoOperacion<MovimientoSucursalItem[]> {
  const { sucursalId, fechaInicio, fechaFin } = params;

  try {
    const movimientos = load<MovimientoInventario[]>('movimientos', []);
    const bodegas = load<Bodega[]>('bodegas', []);
    const nombreBodega = (id: string | null) => {
      if (!id) return 'Externa / Proveedor';
      const b = bodegas.find((x) => x.id === id);
      return b?.nombre || id;
    };

    let filtrados = movimientos.filter(
      (m) => m.bodegaOrigenId === sucursalId || m.bodegaDestinoId === sucursalId
    );

    if (fechaInicio) {
      const ini = fechaInicio.slice(0, 10);
      filtrados = filtrados.filter((m) => (m.fecha || '').slice(0, 10) >= ini);
    }
    if (fechaFin) {
      const fin = fechaFin.slice(0, 10);
      filtrados = filtrados.filter((m) => (m.fecha || '').slice(0, 10) <= fin);
    }

    const items: MovimientoSucursalItem[] = filtrados.map((m) => {
      const esEntrada = m.bodegaDestinoId === sucursalId;
      const concepto = esEntrada ? 'ABASTECIMIENTO_RECIBIDO' : m.tipo;
      return {
        id: m.id,
        fecha: m.fecha,
        tipo: m.tipo,
        concepto,
        sku: m.productoId,
        nombre: m.productoId,
        cantidad: m.cantidad,
        origen: nombreBodega(m.bodegaOrigenId),
        destino: nombreBodega(m.bodegaDestinoId),
      };
    });

    return { data: items, error: null };
  } catch (err: any) {
    return { data: null, error: err?.message || 'Error al generar movimientos de la sucursal' };
  }
}

/**
 * 3. Exporta la consolidación de ventas de sucursales a formato CSV compatible con Microsoft Excel.
 */
export function exportarReporteSucursalCsv(resumenes: BranchSalesSummary[]): string {
  const headers = [
    'Sucursal ID',
    'Sucursal Nombre',
    'Ventas Totales COP',
    'Kilos Vendidos',
    'Unidades Vendidas',
    'Total Tickets',
    'Ticket Promedio COP',
    'Efectivo COP',
    'Nequi COP',
    'Tarjeta COP',
    'Transferencia COP',
    'Credito COP',
  ];

  const rows = resumenes.map((r) => [
    `"${r.sucursalId}"`,
    `"${r.sucursalNombre}"`,
    r.totalVentasCOP,
    r.totalKilos,
    r.totalUnidades,
    r.ticketsCount,
    r.ticketPromedioCOP,
    r.desgloseMediosPago.EFECTIVO || 0,
    r.desgloseMediosPago.NEQUI || 0,
    r.desgloseMediosPago.TARJETA || 0,
    r.desgloseMediosPago.TRANSFERENCIA || 0,
    r.desgloseMediosPago.CREDITO || 0,
  ]);

  // Anteponer BOM UTF-8 (\uFEFF) para visualización correcta de tildes en Excel
  return '\uFEFF' + [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
}

/**
 * 4. Genera documento formal PDF para la sucursal usando jsPDF.
 */
export function exportarReporteSucursalPdf(
  resumen: BranchSalesSummary,
  infoEmpresa = { nombre: 'LA PEZCADERIA S.A.S.', nit: 'NIT: 901.458.789-1' }
): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter',
  });

  const primaryColor = [15, 23, 42]; // Slate 900
  const accentColor = [14, 165, 233]; // Sky 500

  // Header Banner
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 216, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(infoEmpresa.nombre, 14, 12);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`${infoEmpresa.nit} | Reporte Oficial de Ventas por Sucursal`, 14, 18);
  doc.text(`Generado: ${new Date().toLocaleString('es-CO')}`, 14, 23);

  // Subtítulo de Sucursal
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`Punto de Venta: ${resumen.sucursalNombre}`, 14, 40);

  doc.setDrawColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.setLineWidth(0.8);
  doc.line(14, 43, 202, 43);

  // Tarjetas KPI (Tabla Resumen)
  let yPos = 55;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Resumen General de Operación', 14, yPos);
  yPos += 8;

  const kpis = [
    ['Total Ventas Facturadas (COP):', `$${resumen.totalVentasCOP.toLocaleString('es-CO')}`],
    ['Volumen Total en Kilos:', `${resumen.totalKilos.toLocaleString('es-CO')} kg`],
    ['Volumen Total en Unidades:', `${resumen.totalUnidades.toLocaleString('es-CO')} und`],
    ['Total de Tickets Emitidos:', `${resumen.ticketsCount}`],
    ['Ticket Promedio:', `$${resumen.ticketPromedioCOP.toLocaleString('es-CO')}`],
  ];

  doc.setFontSize(10);
  kpis.forEach(([label, valor]) => {
    doc.setFont('helvetica', 'normal');
    doc.text(label, 16, yPos);
    doc.setFont('helvetica', 'bold');
    doc.text(valor, 140, yPos);
    yPos += 7;
  });

  yPos += 6;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Desglose de Ingresos por Medio de Pago', 14, yPos);
  yPos += 8;

  const pagos = [
    ['Efectivo en Caja:', `$${(resumen.desgloseMediosPago.EFECTIVO || 0).toLocaleString('es-CO')}`],
    ['Transferencias Nequi:', `$${(resumen.desgloseMediosPago.NEQUI || 0).toLocaleString('es-CO')}`],
    ['Tarjetas Débito / Crédito:', `$${(resumen.desgloseMediosPago.TARJETA || 0).toLocaleString('es-CO')}`],
    ['Transferencias Bancarias:', `$${(resumen.desgloseMediosPago.TRANSFERENCIA || 0).toLocaleString('es-CO')}`],
    ['Ventas a Crédito:', `$${(resumen.desgloseMediosPago.CREDITO || 0).toLocaleString('es-CO')}`],
  ];

  doc.setFontSize(10);
  pagos.forEach(([medio, monto]) => {
    doc.setFont('helvetica', 'normal');
    doc.text(medio, 16, yPos);
    doc.setFont('helvetica', 'bold');
    doc.text(monto, 140, yPos);
    yPos += 7;
  });

  // Footer institucional
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100, 116, 139);
  doc.text(
    'Documento confidencial para control de auditoría interna. Sistema La Pezcadería ERP.',
    14,
    260
  );

  return doc;
}
