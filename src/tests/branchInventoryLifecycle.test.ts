// src/tests/branchInventoryLifecycle.test.ts

import { describe, it, expect, beforeEach } from 'vitest';
import { save } from '../services/localDb';
import {
  validarAbastecimientoSucursal,
  ejecutarAbastecimientoInmediato,
  obtenerStockPorSucursal,
  solicitarReabastecimientoSucursal,
  obtenerSolicitudesReabastecimiento,
} from '../services/branchInventoryService';
import {
  generarReporteVentasPorSucursal,
  generarReporteMovimientosSucursal,
  exportarReporteSucursalCsv,
  exportarReporteSucursalPdf,
} from '../services/branchReportsService';
import type { Producto, Bodega } from '../types/inventory.types';
import type { VentaPOS } from '../types/pos.types';

describe('SDD 010 — Ciclo de Vida de Inventario Multi-Sucursal y Reportes POS', () => {
  const bodegaPrincipalId = 'bodega-central';
  const sucursalNorteId = 'sucursal-norte';
  const sucursalSurId = 'sucursal-sur';

  const productoRobalo: Producto = {
    id: 'prod-robalo',
    sku: 'ROB-ENT-001',
    nombre: 'Robalo Entero Fresco',
    categoriaId: 'cat-pescados',
    unidadMedida: 'KG',
    precioCompra: 25000,
    precioVentaPOS: 35000,
    precioVentaRestaurante: 33000,
    precioVentaMayorista: 30000,
    codigoBarras: '7701234567890',
    imagenUrl: null,
    bufferSeguridad: 10,
    activo: true,
  };

  const productoCamaron: Producto = {
    id: 'prod-camaron',
    sku: 'CAM-PAC-500G',
    nombre: 'Camaron Pacotilla 500g',
    categoriaId: 'cat-mariscos',
    unidadMedida: 'UNIDAD',
    precioCompra: 14000,
    precioVentaPOS: 22000,
    precioVentaRestaurante: 20000,
    precioVentaMayorista: 18000,
    codigoBarras: null,
    imagenUrl: null,
    bufferSeguridad: 5,
    activo: true,
  };

  const bodegasMock: Bodega[] = [
    {
      id: bodegaPrincipalId,
      nombre: 'Bodega Principal Central',
      codigo: 'BPRIN',
      activa: true,
      tipo: 'PRINCIPAL',
      esPuntoVenta: false,
    },
    {
      id: sucursalNorteId,
      nombre: 'Punto de Venta Sucursal Norte',
      codigo: 'POS-NOR',
      activa: true,
      tipo: 'PUNTO_VENTA',
      bodegaPadreId: bodegaPrincipalId,
      esPuntoVenta: true,
    },
    {
      id: sucursalSurId,
      nombre: 'Punto de Venta Sucursal Sur',
      codigo: 'POS-SUR',
      activa: true,
      tipo: 'PUNTO_VENTA',
      bodegaPadreId: bodegaPrincipalId,
      esPuntoVenta: true,
    },
  ];

  beforeEach(() => {
    // Inicializar base local limpia
    save('productsCatalog', [productoRobalo, productoCamaron]);
    save('bodegas', bodegasMock);
    save('stock', {
      [bodegaPrincipalId]: {
        [productoRobalo.sku]: 100, // 100 kg en Central
        [productoCamaron.sku]: 50,  // 50 und en Central
      },
      [sucursalNorteId]: {
        [productoRobalo.sku]: 5,   // 5 kg (crítico, buffer = 10)
        [productoCamaron.sku]: 8,   // 8 und (normal, buffer = 5)
      },
      [sucursalSurId]: {
        [productoRobalo.sku]: 0,
        [productoCamaron.sku]: 0,
      },
    });
    save('movimientos', []);
    save('pos_orders', []);
    save('sales_orders', []);
    save('branch_replenishment_requests', []);
  });

  describe('1. Abastecimiento Dependiente de Bodega Principal a Sucursales', () => {
    it('debe rechazar el traslado si la Bodega Principal no tiene stock suficiente', () => {
      // Intentar pedir 150 kg cuando solo hay 100 kg en Bodega Principal
      const validacion = validarAbastecimientoSucursal({
        bodegaPrincipalId,
        sucursalId: sucursalNorteId,
        productoId: productoRobalo.id,
        cantidad: 150,
      });

      expect(validacion.error).not.toBeNull();
      expect(validacion.data?.suficiente).toBe(false);
      expect(validacion.data?.disponibleOrigen).toBe(100);
    });

    it('debe aprobar y ejecutar el traslado atómico decrementando origen e incrementando destino', () => {
      // Trasladar 40 kg de Robalo desde Central a Sucursal Norte
      const resultado = ejecutarAbastecimientoInmediato({
        bodegaPrincipalId,
        sucursalId: sucursalNorteId,
        productoId: productoRobalo.id,
        cantidad: 40,
        usuarioResponsable: 'admin-carlos',
        motivo: 'REABASTECIMIENTO_PUNTO_VENTA',
      });

      expect(resultado.error).toBeNull();
      expect(resultado.data).toBeDefined();
      expect(resultado.data?.stockOrigenRestante).toBe(60); // 100 - 40 = 60 kg
      expect(resultado.data?.stockSucursalNuevo).toBe(45);   // 5 + 40 = 45 kg

      // Verificar stock en sucursal Norte
      const stockRes = obtenerStockPorSucursal(sucursalNorteId);
      const robaloEnSucursal = stockRes.data?.find((p) => p.sku === productoRobalo.sku);
      expect(robaloEnSucursal?.cantidad).toBe(45);
      expect(robaloEnSucursal?.esCritico).toBe(false); // 45 > 10 buffer
    });

    it('debe registrar la trazabilidad del movimiento de traslado con origen y destino', () => {
      ejecutarAbastecimientoInmediato({
        bodegaPrincipalId,
        sucursalId: sucursalSurId,
        productoId: productoCamaron.id,
        cantidad: 20,
        usuarioResponsable: 'supervisor-ana',
      });

      const movimientosRes = generarReporteMovimientosSucursal({
        sucursalId: sucursalSurId,
      });

      expect(movimientosRes.error).toBeNull();
      expect(movimientosRes.data).toHaveLength(1);
      expect(movimientosRes.data![0].concepto).toBe('ABASTECIMIENTO_RECIBIDO');
      expect(movimientosRes.data![0].cantidad).toBe(20);
    });
  });

  describe('2. Solicitudes de Reabastecimiento desde Punto de Venta', () => {
    it('debe registrar y consultar una solicitud de reabastecimiento para bodega principal', () => {
      const solicitudRes = solicitarReabastecimientoSucursal({
        sucursalId: sucursalNorteId,
        bodegaPrincipalId,
        prioridad: 'URGENTE',
        justificacion: 'Feriado de fin de semana con alta afluencia',
        solicitadoPor: 'cajero-juan',
        fechaSolicitud: new Date().toISOString(),
        items: [
          {
            productoId: productoRobalo.id,
            sku: productoRobalo.sku,
            nombreProducto: productoRobalo.nombre,
            unidadMedida: 'KG',
            cantidadSolicitada: 30,
            stockActualSucursal: 5,
            bufferSeguridad: 10,
          },
        ],
        estado: 'PENDIENTE',
      });

      expect(solicitudRes.error).toBeNull();
      expect(solicitudRes.data?.solicitudId).toBeDefined();

      const listado = obtenerSolicitudesReabastecimiento({ sucursalId: sucursalNorteId });
      expect(listado.data).toHaveLength(1);
      expect(listado.data![0].prioridad).toBe('URGENTE');
    });
  });

  describe('3. Reportes de Ventas Segregados por Sucursal', () => {
    beforeEach(() => {
      // Sembrar ventas diferenciadas en sucursales
      const ventaNorte1: VentaPOS = {
        id: 'v-nor-01',
        fecha: '2026-10-13T10:00:00.000Z',
        clienteId: null,
        cajeroId: 'cajero-1',
        sucursalId: sucursalNorteId,
        bodegaId: sucursalNorteId,
        subtotal: 70000,
        descuentoGlobalPct: 0,
        descuentoGlobalValor: 0,
        totalFinal: 70000,
        formaPago: 'EFECTIVO',
        requiereFacturaElectronica: false,
        estadoSiigo: 'NO_REQUERIDO',
        idempotencyKey: 'idem-1',
        montoPagadoEfectivo: 70000,
        lineas: [
          {
            productoId: productoRobalo.id,
            sku: productoRobalo.sku,
            nombre: productoRobalo.nombre,
            cantidad: 2,
            unidad: 'KG',
            precioLista: 35000,
            descuentoPct: 0,
            precioFinal: 35000,
            totalLinea: 70000,
            precioCompra: 25000,
            esPesoManual: false,
          },
        ],
      };

      const ventaNorte2: VentaPOS = {
        id: 'v-nor-02',
        fecha: '2026-10-13T11:30:00.000Z',
        clienteId: null,
        cajeroId: 'cajero-1',
        sucursalId: sucursalNorteId,
        bodegaId: sucursalNorteId,
        subtotal: 44000,
        descuentoGlobalPct: 0,
        descuentoGlobalValor: 0,
        totalFinal: 44000,
        formaPago: 'TRANSFERENCIA',
        montoPagadoTransferencia: 44000,
        requiereFacturaElectronica: false,
        estadoSiigo: 'NO_REQUERIDO',
        idempotencyKey: 'idem-2',
        lineas: [
          {
            productoId: productoCamaron.id,
            sku: productoCamaron.sku,
            nombre: productoCamaron.nombre,
            cantidad: 2,
            unidad: 'UNIDAD',
            precioLista: 22000,
            descuentoPct: 0,
            precioFinal: 22000,
            totalLinea: 44000,
            precioCompra: 14000,
            esPesoManual: false,
          },
        ],
      };

      const ventaSur1: VentaPOS = {
        id: 'v-sur-01',
        fecha: '2026-10-13T12:00:00.000Z',
        clienteId: null,
        cajeroId: 'cajero-2',
        sucursalId: sucursalSurId,
        bodegaId: sucursalSurId,
        subtotal: 105000,
        descuentoGlobalPct: 0,
        descuentoGlobalValor: 0,
        totalFinal: 105000,
        formaPago: 'TARJETA',
        requiereFacturaElectronica: false,
        estadoSiigo: 'NO_REQUERIDO',
        idempotencyKey: 'idem-3',
        montoPagadoTarjeta: 105000,
        lineas: [
          {
            productoId: productoRobalo.id,
            sku: productoRobalo.sku,
            nombre: productoRobalo.nombre,
            cantidad: 3,
            unidad: 'KG',
            precioLista: 35000,
            descuentoPct: 0,
            precioFinal: 35000,
            totalLinea: 105000,
            precioCompra: 25000,
            esPesoManual: false,
          },
        ],
      };

      save('pos_orders', [ventaNorte1, ventaNorte2, ventaSur1]);
    });

    it('debe calcular de forma exacta y aislada las ventas de la Sucursal Norte', () => {
      const reporte = generarReporteVentasPorSucursal({
        sucursalId: sucursalNorteId,
        fechaInicio: '2026-10-13',
        fechaFin: '2026-10-13',
        metodoPago: 'TODOS',
        agrupacion: 'DIA',
      });

      expect(reporte.error).toBeNull();
      expect(reporte.data).toHaveLength(1);

      const resumenNorte = reporte.data![0];
      expect(resumenNorte.sucursalId).toBe(sucursalNorteId);
      expect(resumenNorte.totalVentasCOP).toBe(114000); // 70.000 + 44.000
      expect(resumenNorte.totalKilos).toBe(2);           // 2 kg de robalo
      expect(resumenNorte.totalUnidades).toBe(2);        // 2 und de camaron
      expect(resumenNorte.ticketsCount).toBe(2);
      expect(resumenNorte.ticketPromedioCOP).toBe(57000); // 114.000 / 2
      expect(resumenNorte.desgloseMediosPago.EFECTIVO).toBe(70000);
      expect(resumenNorte.desgloseMediosPago.TRANSFERENCIA).toBe(44000);
      expect(resumenNorte.desgloseMediosPago.TARJETA).toBe(0);
    });

    it('debe consolidar todas las sucursales cuando sucursalId es "TODAS"', () => {
      const reporte = generarReporteVentasPorSucursal({
        sucursalId: 'TODAS',
        fechaInicio: '2026-10-13',
        fechaFin: '2026-10-13',
        metodoPago: 'TODOS',
        agrupacion: 'DIA',
      });

      expect(reporte.error).toBeNull();
      expect(reporte.data!.length).toBeGreaterThanOrEqual(2);

      const norte = reporte.data!.find((r) => r.sucursalId === sucursalNorteId);
      const sur = reporte.data!.find((r) => r.sucursalId === sucursalSurId);

      expect(norte?.totalVentasCOP).toBe(114000);
      expect(sur?.totalVentasCOP).toBe(105000);
    });

    it('debe exportar correctamente el reporte a CSV y generar el PDF oficial', () => {
      const reporte = generarReporteVentasPorSucursal({
        sucursalId: 'TODAS',
        fechaInicio: '2026-10-13',
        fechaFin: '2026-10-13',
        metodoPago: 'TODOS',
        agrupacion: 'DIA',
      });

      const csv = exportarReporteSucursalCsv(reporte.data!);
      expect(csv.startsWith('\uFEFF')).toBe(true); // Con BOM UTF-8
      expect(csv).toContain('Sucursal Norte');
      expect(csv).toContain('114000');

      const docPdf = exportarReporteSucursalPdf(reporte.data![0]);
      expect(docPdf).toBeDefined();
      expect(typeof docPdf.output).toBe('function');
    });
  });
});
