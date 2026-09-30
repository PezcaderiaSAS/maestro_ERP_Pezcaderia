import { describe, it, expect } from 'vitest';
import {
  VentaPosPayloadSchema,
  AperturaCajaSchema,
  CierreCajaArqueoSchema,
  RecepcionCompraSchema,
  TransicionCotizacionB2BSchema,
  DespachoRutaSchema,
} from '../../packages/validation-schemas/src/operational-flows.schema';

describe('Suite de Aseguramiento de Calidad: 5 Flujos Operativos Críticos', () => {

  // ==========================================================================
  // 1. FLUJO POS INTELIGENTE & BODEGA PRINCIPAL (P)
  // ==========================================================================
  describe('1. Flujo de Venta en POS Inteligente', () => {
    it('debe aprobar una venta POS válida con despacho exclusivo de Bodega Principal (P)', () => {
      const validPayload = {
        tenantId: '00000000-0000-0000-0000-000000000001',
        cajaSesionId: '11111111-1111-1111-1111-111111111111',
        cajeroId: '22222222-2222-2222-2222-222222222222',
        clienteIdentificacion: '900123456',
        clienteNombre: 'Restaurante El Ancla',
        tipoPrecioAplicado: 'RESTAURANTE' as const,
        esUltimoPrecioSugerido: true,
        metodoPago: 'EFECTIVO' as const,
        montoRecibido: 100000,
        cambioDevuelto: 10000,
        lineas: [
          {
            productoId: '33333333-3333-3333-3333-333333333333',
            sku: 'PRD-SALM-01',
            nombre: 'Filete de Salmón',
            cantidad: 2.5,
            precioUnitario: 36000,
            descuentoPct: 0,
            subtotal: 90000,
            bodegaCodigo: 'P' as const,
          },
        ],
        subtotal: 90000,
        impuestos: 0,
        total: 90000,
      };

      const result = VentaPosPayloadSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
    });

    it('debe rechazar la venta si el efectivo recibido es menor al total', () => {
      const invalidPayload = {
        tenantId: '00000000-0000-0000-0000-000000000001',
        cajaSesionId: '11111111-1111-1111-1111-111111111111',
        cajeroId: '22222222-2222-2222-2222-222222222222',
        clienteIdentificacion: '900123456',
        clienteNombre: 'Cliente Casual',
        tipoPrecioAplicado: 'POS' as const,
        metodoPago: 'EFECTIVO' as const,
        montoRecibido: 40000, // Menor al total de 50000
        lineas: [
          {
            productoId: '33333333-3333-3333-3333-333333333333',
            sku: 'PRD-CAM-01',
            nombre: 'Camarón Tití',
            cantidad: 1,
            precioUnitario: 50000,
            subtotal: 50000,
            bodegaCodigo: 'P' as const,
          },
        ],
        subtotal: 50000,
        total: 50000,
      };

      const result = VentaPosPayloadSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('no puede ser inferior al total');
      }
    });
  });

  // ==========================================================================
  // 2. FLUJO DE APERTURA, ARQUEO Y CIERRE DE CAJA
  // ==========================================================================
  describe('2. Flujo de Caja y Control de Descuadres', () => {
    it('debe exigir PIN de supervisor y justificación cuando el descuadre supere $10,000 COP', () => {
      const arqueoDescuadradoSinPin = {
        cajaSesionId: '11111111-1111-1111-1111-111111111111',
        tenantId: '00000000-0000-0000-0000-000000000001',
        cajeroId: '22222222-2222-2222-2222-222222222222',
        efectivoFisicoReportado: 450000,
        totalSistemaEsperado: 500000,
        descuadreMonetario: -50000, // Faltante de $50,000 (> $10,000)
        // Sin supervisorId ni justificacionDescuadre
      };

      const result = CierreCajaArqueoSchema.safeParse(arqueoDescuadradoSinPin);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('requiere justificación escrita y PIN de supervisor');
      }
    });

    it('debe permitir el cierre si el descuadre mayor a $10,000 cuenta con supervisor y justificación', () => {
      const arqueoJustificado = {
        cajaSesionId: '11111111-1111-1111-1111-111111111111',
        tenantId: '00000000-0000-0000-0000-000000000001',
        cajeroId: '22222222-2222-2222-2222-222222222222',
        supervisorId: '99999999-9999-9999-9999-999999999999',
        efectivoFisicoReportado: 450000,
        totalSistemaEsperado: 500000,
        descuadreMonetario: -50000,
        justificacionDescuadre: 'Billete falso detectado y retenido por tesorería según protocolo bancario.',
      };

      const result = CierreCajaArqueoSchema.safeParse(arqueoJustificado);
      expect(result.success).toBe(true);
    });
  });

  // ==========================================================================
  // 3. FLUJO DE COMPRAS Y CADENA DE FRÍO (MÁXIMO 4°C)
  // ==========================================================================
  describe('3. Flujo de Compras y Control de Cadena de Frío', () => {
    it('debe rechazar recepción en muelle si la temperatura supera los 4°C', () => {
      const recepcionCaliente = {
        tenantId: '00000000-0000-0000-0000-000000000001',
        ordenCompraId: '44444444-4444-4444-4444-444444444444',
        proveedorId: '55555555-5555-5555-5555-555555555555',
        fechaRecepcion: '2026-09-28',
        bodegueroId: '66666666-6666-6666-6666-666666666666',
        facturaProveedorNumero: 'FACT-PROV-9081',
        items: [
          {
            productoId: '33333333-3333-3333-3333-333333333333',
            sku: 'PRD-CORV-01',
            numeroLoteProveedor: 'LOT-2026-A1',
            fechaVencimiento: '2026-10-15',
            temperaturaLlegada: 7.5, // 7.5°C supera el umbral crítico de 4°C
            cantidadPedida: 100,
            cantidadRecibida: 100,
            bodegaDestino: 'S' as const,
            costoUnitario: 18000,
          },
        ],
      };

      const result = RecepcionCompraSchema.safeParse(recepcionCaliente);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('La cadena de frío para pescadería exige máximo 4°C');
      }
    });
  });

  // ==========================================================================
  // 4. FLUJO B2B: CONTROL DE MÁRGENES Y RBAC
  // ==========================================================================
  describe('4. Flujo B2B y Restricción de Auto-Aprobación', () => {
    it('debe impedir que un rol VENDEDOR auto-apruebe una cotización', () => {
      const intentoAutoAprobacionVendedor = {
        cotizacionId: '77777777-7777-7777-7777-777777777777',
        tenantId: '00000000-0000-0000-0000-000000000001',
        estadoActual: 'SENT' as const,
        nuevoEstado: 'APPROVED' as const,
        usuarioId: '88888888-8888-8888-8888-888888888888',
        usuarioRol: 'VENDEDOR' as const, // Vendedor no autorizado para aprobar
        margenUtilidadPct: 15.0,
      };

      const result = TransicionCotizacionB2BSchema.safeParse(intentoAutoAprobacionVendedor);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Privilegios insuficientes');
      }
    });

    it('debe permitir la aprobación a un rol SUPERVISOR si el margen es adecuado', () => {
      const aprobacionSupervisor = {
        cotizacionId: '77777777-7777-7777-7777-777777777777',
        tenantId: '00000000-0000-0000-0000-000000000001',
        estadoActual: 'SENT' as const,
        nuevoEstado: 'APPROVED' as const,
        usuarioId: '99999999-9999-9999-9999-999999999999',
        usuarioRol: 'SUPERVISOR' as const,
        margenUtilidadPct: 18.5,
      };

      const result = TransicionCotizacionB2BSchema.safeParse(aprobacionSupervisor);
      expect(result.success).toBe(true);
    });
  });

  // ==========================================================================
  // 5. FLUJO DE RUTAS: CONTROL DE MERMA (>35%) Y PIN DE SUPERVISOR
  // ==========================================================================
  describe('5. Flujo de Despacho de Rutas y Mermas Críticas', () => {
    it('debe detener el despacho si la merma supera el 35% y no se proporciona PIN de supervisor', () => {
      const despachoMermaSinPin = {
        rutaId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        tenantId: '00000000-0000-0000-0000-000000000001',
        despachadorId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        conductorId: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
        pesoSalidaKg: 100.0,
        pesoEntregadoKg: 60.0, // Merma de 40 kg (40%) > 35%
        mermaDeclaradaKg: 40.0,
        mermaPorcentaje: 40.0,
        // Sin pinSupervisorAutorizacion
      };

      const result = DespachoRutaSchema.safeParse(despachoMermaSinPin);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('ALERTA DE MERMA CRÍTICA');
      }
    });

    it('debe autorizar el despacho con merma >35% si se inyecta PIN/token de supervisor y justificación', () => {
      const despachoMermaAutorizada = {
        rutaId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        tenantId: '00000000-0000-0000-0000-000000000001',
        despachadorId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        conductorId: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
        pesoSalidaKg: 100.0,
        pesoEntregadoKg: 60.0,
        mermaDeclaradaKg: 40.0,
        mermaPorcentaje: 40.0,
        pinSupervisorAutorizacion: '8899',
        justificacionMerma: 'Deshielo imprevisto por falla eléctrica temporal de compresor en furgón refrigerado.',
      };

      const result = DespachoRutaSchema.safeParse(despachoMermaAutorizada);
      expect(result.success).toBe(true);
    });
  });

});
