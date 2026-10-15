import { describe, it, expect } from 'vitest';
import type { Pedido, LineaPedido, EstadoPedido, Cotizacion } from '../types/orders.types';

describe('TASK-015-01: Tipos y Contratos TypeScript (Trazabilidad B2B de 3 Actores y Catch Weight)', () => {
  it('debe construir un Pedido fuertemente tipado con los 3 actores operativos y trazabilidad WMS/Ruta', () => {
    const linea: LineaPedido = {
      productoId: 'prod-salmon-01',
      cantidadSolicitada: 10,
      cantidadAlistada: 10.4,
      cantidadDespachada: 10.4,
      estadoLinea: 'COMPLETO',
      precioPactado: 45000,
      totalLinea: 468000,
      pesoEstimado: 10,
      pesoReal: 10.4,
      variacionPesoPct: 4.0, // +4% dentro del margen +-5%
      toleranciaAceptada: true,
      subtotalRealAjustado: 468000,
      temperaturaC: -18.2,
      loteSeleccionado: 'LOTE-SALMON-2026-001',
    };

    const pedido: Pedido = {
      id: 'ped-b2b-001',
      numeroPedido: 'PED-B2B-1001',
      fecha: new Date().toISOString(),
      origen: 'VISITA',
      clienteId: 'cli-hote-001',
      bodegaId: 'bodega-central',
      branch_id: 'sucursal-principal',
      vendedorId: 'emp-vend-01',
      vendedorNombre: 'Carlos Mostrador',
      cotizacionIdOriginal: 'cot-789012',
      formaPago: 'CREDITO',
      tipoEntrega: 'EN_RUTA',
      fechaEntrega: new Date().toISOString(),
      jornada: 'MANANA',
      estado: 'CREADO',
      observaciones: 'Entregar en muelle de recepción de cocina fría',
      lineas: [linea],
      subtotal: 450000,
      descuentoGlobalPct: 0,
      descuentoGlobalValor: 0,
      totalFinal: 468000,
      idempotencyKey: 'idemp-ped-1001',
      rutaId: 'ruta-norte-01',
      facturacionElectronica: false,
      idSiigo: null,
      // Trazabilidad de 3 Actores:
      operarioAlistadorId: 'emp-bod-02',
      operarioAlistadorNombre: 'Martín Alistador Bodega',
      horaInicioAlistamiento: '2026-10-15T06:00:00.000Z',
      horaFinAlistamiento: '2026-10-15T06:35:00.000Z',
      remisionId: 'REM-WMS-5501',
      tokenQrRemision: 'QR-REM-5501-VERIFIED',
      precintoCanastilla: 'PREC-CAN-9912',
      conductorRepartidorId: 'emp-rep-03',
      conductorRepartidorNombre: 'Hernán Conductor Furgón',
      manifiestoRutaId: 'MAN-RUTA-2026-08',
      retefuenteValor: 11700,
      reteicaValor: 1937,
    };

    expect(pedido.vendedorId).toBe('emp-vend-01');
    expect(pedido.vendedorNombre).toBe('Carlos Mostrador');
    expect(pedido.operarioAlistadorId).toBe('emp-bod-02');
    expect(pedido.operarioAlistadorNombre).toBe('Martín Alistador Bodega');
    expect(pedido.conductorRepartidorId).toBe('emp-rep-03');
    expect(pedido.conductorRepartidorNombre).toBe('Hernán Conductor Furgón');
    expect(pedido.lineas[0].pesoReal).toBe(10.4);
    expect(pedido.lineas[0].variacionPesoPct).toBe(4.0);
    expect(pedido.lineas[0].toleranciaAceptada).toBe(true);
  });

  it('debe soportar el estado CONVERTIDA_A_PEDIDO en Cotizacion y asociar su vendedor', () => {
    const cotizacion: Cotizacion = {
      id: 'cot-998877',
      fecha: '2026-10-15',
      cliente: 'Restaurante El Faro del Mar',
      clienteId: 'cli-002',
      total: 1250000,
      montoTotal: 1250000,
      subtotal: 1250000,
      estado: 'CONVERTIDA_A_PEDIDO',
      vendedorId: 'emp-vend-01',
      vendedorNombre: 'Carlos Mostrador',
      fechaActualizacion: new Date().toISOString(),
    };

    expect(cotizacion.estado).toBe('CONVERTIDA_A_PEDIDO');
    expect(cotizacion.vendedorId).toBe('emp-vend-01');
    expect(cotizacion.vendedorNombre).toBe('Carlos Mostrador');
  });
});
