// src/tests/siigoPayloadAndExport.test.ts
import { describe, it, expect } from 'vitest';
import { siigoPayloadMapper } from '../services/siigoPayloadMapper';
import { siigoExportService } from '../services/siigoExportService';
import type { ResolucionVenta } from '../types/resoluciones.types';
import type { VentaPOS } from '../types/pos.types';

describe('SPEC-020: Mapeador SIIGO Nube API v2 y Exportador CSV', () => {
  const MOCK_RESOLUCION: ResolucionVenta = {
    id: 'res-dian-1',
    nombre: 'Factura Electrónica Principal',
    tipo: 'FACTURA_ELECTRONICA_DIAN',
    prefijo: 'FEVP',
    rangoDesde: 1,
    rangoHasta: 50000,
    consecutivoActual: 1540,
    siigoDocumentId: 2458,
    esPredeterminada: true,
    activa: true,
    alertaUmbralConsecutivos: 100,
    alertaUmbralDias: 30,
  };

  const MOCK_VENTA: VentaPOS = {
    id: 'venta-pos-001',
    fecha: '2026-10-16T14:30:00.000Z',
    clienteId: 'cli-01',
    cajeroId: 'usr-cajero-1',
    lineas: [
      {
        productoId: 'prod-salmon-01',
        sku: 'SALM-NOR-01',
        nombre: 'Salmón Noruego Fresco',
        unidad: 'KG',
        cantidad: 2.5,
        precioLista: 45000,
        descuentoPct: 0,
        precioFinal: 45000,
        totalLinea: 112500,
        precioCompra: 30000,
        esPesoManual: false,
      },
    ],
    subtotal: 112500,
    descuentoGlobalPct: 0,
    descuentoGlobalValor: 0,
    totalFinal: 112500,
    formaPago: 'TRANSFERENCIA',
    requiereFacturaElectronica: true,
    estadoSiigo: 'PENDIENTE',
    idempotencyKey: 'idemp-uuid-1234',
  };

  const MOCK_CLIENTE = {
    id: 'cli-01',
    nombre: 'Restaurante Mar y Fuego',
    identificacion: '900123456',
    email: 'facturacion@maryfuego.com',
    direccion: 'Carrera 7 # 72-15',
    ciudad: 'Bogotá',
    ciudadDane: '11001',
  };

  it('1. Debe mapear la venta a un payload estricto para SIIGO Nube API v2', () => {
    const payload = siigoPayloadMapper.buildInvoicePayload({
      venta: MOCK_VENTA,
      cliente: MOCK_CLIENTE,
      resolucion: MOCK_RESOLUCION,
      consecutivoInterno: 'VTA-101',
      sellerId: 10,
    });

    expect(payload.document.id).toBe(2458);
    expect(payload.date).toBe('2026-10-16');
    expect(payload.customer.identification).toBe('900123456');
    expect(payload.customer.branch_office).toBe(0);
    expect(payload.seller).toBe(10);
    expect(payload.send_dian).toBe(true);

    // Items
    expect(payload.items.length).toBe(1);
    expect(payload.items[0].code).toBe('SALM-NOR-01');
    expect(payload.items[0].description).toBe('Salmón Noruego Fresco');
    expect(payload.items[0].quantity).toBe(2.5);
    expect(payload.items[0].price).toBe(45000);

    // Payments
    expect(payload.payments.length).toBe(1);
    expect(payload.payments[0].value).toBe(112500);
    expect(payload.payments[0].due_date).toBe('2026-10-16');
  });

  it('2. Debe usar Consumidor Final genérico 222222222222 si el cliente no tiene identificación', () => {
    const payload = siigoPayloadMapper.buildInvoicePayload({
      venta: MOCK_VENTA,
      cliente: null,
      resolucion: MOCK_RESOLUCION,
      consecutivoInterno: 'VTA-102',
    });

    expect(payload.customer.identification).toBe('222222222222');
  });

  it('3. Debe generar CSV compatible con la plantilla contable de importación de Siigo', () => {
    const facturas = [
      {
        consecutivoFiscal: 'FEVP-1541',
        consecutivoInterno: 'VTA-101',
        fecha: '2026-10-16',
        clienteIdentificacion: '900123456',
        clienteNombre: 'Restaurante Mar y Fuego',
        productoCodigo: 'SALM-NOR-01',
        productoNombre: 'Salmón Noruego Fresco',
        cantidad: 2.5,
        valorUnitario: 45000,
        descuentoPct: 0,
        total: 112500,
        formaPago: 'Transferencia',
      },
    ];

    const csv = siigoExportService.generarCsvSiigo(facturas);

    expect(csv).toContain('Tipo Comprobante');
    expect(csv).toContain('FEVP-1541');
    expect(csv).toContain('900123456');
    expect(csv).toContain('SALM-NOR-01');
    expect(csv).toContain('112500');
  });
});
