// src/tests/b2bQuotationService.test.ts
// Suite de Pruebas Unitarias TDD para el Servicio de Cotizaciones B2B y Conversión POS

import { describe, it, expect, beforeEach } from 'vitest';
import { b2bQuotationService } from '../services/b2bQuotationService';
import { prefacturaService } from '../services/prefacturaService';
import type { B2BQuotationItem } from '../types/b2bQuotation.types';

describe('B2BQuotationService - Ciclo de Vida y Conversión Atómica POS', () => {
  const TENANT_A = 'tenant-ferreteria-josase';
  const TENANT_B = 'tenant-pezcaderia-central';

  beforeEach(() => {
    b2bQuotationService.limpiarEstadoPruebas();
    prefacturaService.limpiarEstadoPruebas();
  });

  it('debe generar código consecutivo válido con formato COT-YYYY-XXXXX', () => {
    const year = new Date().getFullYear();
    const codigo1 = b2bQuotationService.generarConsecutivo(TENANT_A);
    const codigo2 = b2bQuotationService.generarConsecutivo(TENANT_A);

    expect(codigo1).toMatch(new RegExp(`^COT-${year}-\\d{5}$`));
    expect(codigo2).toMatch(new RegExp(`^COT-${year}-\\d{5}$`));
    expect(codigo1).not.toBe(codigo2);
  });

  it('debe calcular los totales de cotización con precisión aritmética', () => {
    const items: B2BQuotationItem[] = [
      {
        id: 'item-1',
        productoSku: 'HERR-001',
        nombre: 'Martillo Tubular de Uña 16oz',
        cantidad: 10,
        precioUnitarioPactado: 35000,
        tarifaAplicada: 'MAYORISTA',
        descuentoPct: 0,
        subtotalItem: 350000,
      },
      {
        id: 'item-2',
        productoSku: 'ABRA-002',
        nombre: 'Disco de Corte 4 1/2',
        cantidad: 50,
        precioUnitarioPactado: 4500,
        tarifaAplicada: 'MAYORISTA',
        descuentoPct: 5,
        subtotalItem: 213750, // 50 * 4500 = 225000 - 5% (11250) = 213750
      },
    ];

    const totales = b2bQuotationService.calcularTotales(items);
    expect(totales.subtotal).toBe(575000); // 350000 + 225000
    expect(totales.totalDescuentos).toBe(11250);
    expect(totales.totalGeneral).toBe(563750); // 350000 + 213750
  });

  it('debe crear una cotización B2B válida en estado BORRADOR o EMITIDA', async () => {
    const items: B2BQuotationItem[] = [
      {
        id: 'item-1',
        productoSku: 'CEM-001',
        nombre: 'Cemento Gris x 50kg',
        cantidad: 20,
        precioUnitarioPactado: 28000,
        tarifaAplicada: 'MAYORISTA',
        descuentoPct: 0,
        subtotalItem: 560000,
      },
    ];

    const cotizacion = await b2bQuotationService.crearCotizacion({
      tenantId: TENANT_A,
      clienteId: 'cli-constructor-123',
      asesorUsuarioId: 'user-asesor-01',
      items,
      diasVigencia: 15,
      observaciones: 'Precios especiales por volumen de obra',
    });

    expect(cotizacion.id).toBeDefined();
    expect(cotizacion.tenantId).toBe(TENANT_A);
    expect(cotizacion.codigoCotizacion).toMatch(/^COT-\d{4}-\d{5}$/);
    expect(cotizacion.estado).toBe('EMITIDA');
    expect(cotizacion.totalGeneral).toBe(560000);
    expect(cotizacion.diasVigencia).toBe(15);
    expect(cotizacion.fechaVencimiento).toBeDefined();
  });

  it('debe permitir la transición de estados de cotización (EMITIDA -> APROBADA)', async () => {
    const cotizacion = await b2bQuotationService.crearCotizacion({
      tenantId: TENANT_A,
      clienteId: 'cli-001',
      asesorUsuarioId: 'user-001',
      items: [
        {
          id: 'item-1',
          productoSku: 'SKU-001',
          nombre: 'Producto Test',
          cantidad: 5,
          precioUnitarioPactado: 10000,
          tarifaAplicada: 'DETAL',
          descuentoPct: 0,
          subtotalItem: 50000,
        },
      ],
    });

    const aprobada = await b2bQuotationService.actualizarEstado(
      TENANT_A,
      cotizacion.id,
      'APROBADA'
    );
    expect(aprobada.estado).toBe('APROBADA');
  });

  it('debe convertir atómicamente una cotización a preventa POS y reservar stock (Hard-Hold)', async () => {
    const cotizacion = await b2bQuotationService.crearCotizacion({
      tenantId: TENANT_A,
      clienteId: 'cli-ferretero-99',
      asesorUsuarioId: 'user-vendedor-02',
      items: [
        {
          id: 'item-1',
          productoSku: 'PINT-001',
          nombre: 'Pintura Viniltex Galón Blanco',
          cantidad: 10,
          precioUnitarioPactado: 65000,
          tarifaAplicada: 'MAYORISTA',
          descuentoPct: 0,
          subtotalItem: 650000,
        },
      ],
    });

    // Aprobar la cotización antes de convertir
    await b2bQuotationService.actualizarEstado(TENANT_A, cotizacion.id, 'APROBADA');

    // Conversión 1-clic a Preventa POS
    const resultado = await b2bQuotationService.convertirAPreventaPOS({
      cotizacionId: cotizacion.id,
      tenantId: TENANT_A,
      bodegaId: 'bodega-principal',
      vendedorId: 'user-vendedor-02',
      vendedorNombre: 'Carlos Mostrador',
      terminalId: 'TERM-B2B-01',
      tipoPreventa: 'MOSTRADOR_B2B',
    });

    expect(resultado.ok).toBe(true);
    expect(resultado.prefactura).toBeDefined();
    expect(resultado.cotizacion?.estado).toBe('CONVERTIDA');
    expect(resultado.cotizacion?.convertidaPrefacturaId).toBe(resultado.prefactura?.id);

    // Verificar que la preventa fue registrada en el Kanban de Caja Central con Hard-Hold
    const prefactura = resultado.prefactura!;
    expect(prefactura.estado).toBe('PENDIENTE_COBRO');
    expect(prefactura.hardHoldActivo).toBe(true);
    expect(prefactura.total).toBe(650000);
    expect(prefactura.items[0].precioFinal).toBe(65000);
  });

  it('debe rechazar la conversión si la cotización ya fue convertida previamente', async () => {
    const cotizacion = await b2bQuotationService.crearCotizacion({
      tenantId: TENANT_A,
      clienteId: 'cli-002',
      asesorUsuarioId: 'user-001',
      items: [
        {
          id: 'item-1',
          productoSku: 'SKU-001',
          nombre: 'Producto 1',
          cantidad: 2,
          precioUnitarioPactado: 12000,
          tarifaAplicada: 'DETAL',
          descuentoPct: 0,
          subtotalItem: 24000,
        },
      ],
    });

    await b2bQuotationService.actualizarEstado(TENANT_A, cotizacion.id, 'APROBADA');

    // Primera conversión exitosa
    await b2bQuotationService.convertirAPreventaPOS({
      cotizacionId: cotizacion.id,
      tenantId: TENANT_A,
      bodegaId: 'bodega-1',
      vendedorId: 'user-1',
      vendedorNombre: 'Vendedor 1',
      terminalId: 'TERM-01',
    });

    // Segunda conversión debe fallar
    const reintento = await b2bQuotationService.convertirAPreventaPOS({
      cotizacionId: cotizacion.id,
      tenantId: TENANT_A,
      bodegaId: 'bodega-1',
      vendedorId: 'user-1',
      vendedorNombre: 'Vendedor 1',
      terminalId: 'TERM-01',
    });

    expect(reintento.ok).toBe(false);
    expect(reintento.error).toContain('ya fue convertida');
  });

  it('debe rechazar la conversión si la cotización está vencida', async () => {
    // Creamos cotización con vigencia de 0 días y fecha pasada
    const cotizacion = await b2bQuotationService.crearCotizacion({
      tenantId: TENANT_A,
      clienteId: 'cli-003',
      asesorUsuarioId: 'user-001',
      items: [
        {
          id: 'item-1',
          productoSku: 'SKU-002',
          nombre: 'Producto Vencible',
          cantidad: 1,
          precioUnitarioPactado: 5000,
          tarifaAplicada: 'DETAL',
          descuentoPct: 0,
          subtotalItem: 5000,
        },
      ],
    });

    // Forzar fecha de vencimiento en el pasado
    cotizacion.fechaVencimiento = '2020-01-01T00:00:00.000Z';

    const resultado = await b2bQuotationService.convertirAPreventaPOS({
      cotizacionId: cotizacion.id,
      tenantId: TENANT_A,
      bodegaId: 'bodega-1',
      vendedorId: 'user-1',
      vendedorNombre: 'Vendedor 1',
      terminalId: 'TERM-01',
    });

    expect(resultado.ok).toBe(false);
    expect(resultado.error).toMatch(/vencida/i);
    expect(cotizacion.estado).toBe('VENCIDA');
  });

  it('debe aislar estrictamente las cotizaciones entre diferentes empresas (multi-tenant)', async () => {
    await b2bQuotationService.crearCotizacion({
      tenantId: TENANT_A,
      clienteId: 'cli-tenant-a',
      asesorUsuarioId: 'user-a',
      items: [
        {
          id: 'item-a',
          productoSku: 'SKU-A',
          nombre: 'Producto A',
          cantidad: 1,
          precioUnitarioPactado: 1000,
          tarifaAplicada: 'DETAL',
          descuentoPct: 0,
          subtotalItem: 1000,
        },
      ],
    });

    await b2bQuotationService.crearCotizacion({
      tenantId: TENANT_B,
      clienteId: 'cli-tenant-b',
      asesorUsuarioId: 'user-b',
      items: [
        {
          id: 'item-b',
          productoSku: 'SKU-B',
          nombre: 'Producto B',
          cantidad: 2,
          precioUnitarioPactado: 2000,
          tarifaAplicada: 'DETAL',
          descuentoPct: 0,
          subtotalItem: 4000,
        },
      ],
    });

    const cotizacionesA = await b2bQuotationService.listarCotizaciones(TENANT_A);
    const cotizacionesB = await b2bQuotationService.listarCotizaciones(TENANT_B);

    expect(cotizacionesA).toHaveLength(1);
    expect(cotizacionesA[0].tenantId).toBe(TENANT_A);

    expect(cotizacionesB).toHaveLength(1);
    expect(cotizacionesB[0].tenantId).toBe(TENANT_B);
  });
});

