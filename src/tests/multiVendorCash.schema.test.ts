import { describe, it, expect } from 'vitest';
import {
  VentaPosConcurrenteSchema,
  TurnoCentralCompartidoSchema,
  TenantConfigSchema,
  BulkItemHardwareRowSchema,
  validarVentaConcurrente,
  validarBulkItemHardwareRow,
} from '../schemas/multiVendorCash.schema';

describe('TASK-034-01: Contratos Zod para Concurrencia de Caja Única y Multi-Tenant', () => {
  const validUUID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
  const validTenantId = 'tenant-pezcaderia-01';
  const validTurnoId = 'turno-central-001';

  describe('VentaPosConcurrenteSchema', () => {
    it('debe validar exitosamente un payload de venta emitido por una de las 8 terminales', () => {
      const payload = {
        idempotencyKey: validUUID,
        tenantId: validTenantId,
        turnoId: validTurnoId,
        terminalId: 'TERM-01',
        vendedorId: 'emp-vendedor-10',
        items: [
          {
            productoId: 'prod-01',
            nombre: 'Tornillo Acero 2 pulg',
            cantidad: 10,
            precioUnitario: 500,
            subtotal: 5000,
          },
        ],
        pagos: [
          {
            metodoPago: 'EFECTIVO' as const,
            monto: 5000,
          },
        ],
        montoTotal: 5000,
        clienteDocumento: '222222222222',
        fechaLocal: '2026-10-26T16:55:00-05:00',
      };

      const result = VentaPosConcurrenteSchema.safeParse(payload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.terminalId).toBe('TERM-01');
        expect(result.data.vendedorId).toBe('emp-vendedor-10');
        expect(result.data.montoTotal).toBe(5000);
      }
    });

    it('debe rechazar ventas sin terminalId o sin vendedorId', () => {
      const payloadSinTerminal = {
        idempotencyKey: validUUID,
        tenantId: validTenantId,
        turnoId: validTurnoId,
        vendedorId: 'emp-vendedor-10',
        items: [],
        pagos: [],
        montoTotal: 0,
      };

      const result = VentaPosConcurrenteSchema.safeParse(payloadSinTerminal);
      expect(result.success).toBe(false);
    });

    it('debe rechazar ventas donde la suma de pagos no coincida con el monto total', () => {
      const payload = {
        idempotencyKey: validUUID,
        tenantId: validTenantId,
        turnoId: validTurnoId,
        terminalId: 'TERM-02',
        vendedorId: 'emp-vendedor-10',
        items: [
          {
            productoId: 'p-1',
            nombre: 'Martillo Mecánico',
            cantidad: 1,
            precioUnitario: 35000,
            subtotal: 35000,
          },
        ],
        pagos: [
          {
            metodoPago: 'EFECTIVO' as const,
            monto: 30000, // Discrepancia: 30000 != 35000
          },
        ],
        montoTotal: 35000,
      };

      const validation = validarVentaConcurrente(payload);
      expect(validation.success).toBe(false);
      expect(validation.error).toContain('La suma de los pagos');
    });
  });

  describe('TurnoCentralCompartidoSchema', () => {
    it('debe validar un turno de caja central en estado ABIERTO', () => {
      const turno = {
        id: validTurnoId,
        cajaId: 'caja-fisica-central',
        sucursalId: 'sucursal-principal',
        tenantId: validTenantId,
        cajeroAperturaId: 'emp-cajero-principal',
        baseInicial: 300000,
        estado: 'ABIERTO',
        fechaApertura: '2026-10-26T08:00:00-05:00',
        terminalesAutorizadas: ['TERM-01', 'TERM-02', 'TERM-03', 'TERM-04', 'TERM-05', 'TERM-06', 'TERM-07', 'TERM-08'],
      };

      const result = TurnoCentralCompartidoSchema.safeParse(turno);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.terminalesAutorizadas.length).toBe(8);
      }
    });

    it('debe rechazar base inicial negativa', () => {
      const turno = {
        id: validTurnoId,
        cajaId: 'caja-fisica-central',
        sucursalId: 'sucursal-principal',
        tenantId: validTenantId,
        cajeroAperturaId: 'emp-cajero-principal',
        baseInicial: -5000,
        estado: 'ABIERTO',
        fechaApertura: '2026-10-26T08:00:00-05:00',
      };

      const result = TurnoCentralCompartidoSchema.safeParse(turno);
      expect(result.success).toBe(false);
    });
  });

  describe('TenantConfigSchema (Super Admin)', () => {
    it('debe validar la configuración de una empresa multi-tenant', () => {
      const tenant = {
        id: validTenantId,
        nombre: 'Ferretería y Suministros Industriales SAS',
        nit: '901.888.777-1',
        razonSocial: 'Ferretería Central SAS',
        rubro: 'FERRETERIA',
        activo: true,
        maxTerminales: 8,
        createdAt: '2026-10-26T10:00:00-05:00',
      };

      const result = TenantConfigSchema.safeParse(tenant);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.maxTerminales).toBe(8);
        expect(result.data.rubro).toBe('FERRETERIA');
      }
    });
  });

  describe('BulkItemHardwareRowSchema', () => {
    it('debe validar un ítem con campos específicos de ferretería', () => {
      const row = {
        sku: 'FERR-001',
        codigoBarras: '7701234567890',
        nombre: 'Disco Corte Metal 4 1/2 DeWalt',
        marca: 'DeWalt',
        categoria: 'Herramientas y Abrasivos',
        unidadMedida: 'UND',
        ubicacionPasillo: 'Pasillo 3 - Estante B',
        costoUnitario: 4200,
        precioDetal: 7500,
        precioMayorista: 6000,
        stockMinimo: 20,
        stockInicial: 100,
      };

      const result = BulkItemHardwareRowSchema.safeParse(row);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.marca).toBe('DeWalt');
        expect(result.data.ubicacionPasillo).toBe('Pasillo 3 - Estante B');
      }
    });

    it('debe normalizar valores numéricos que vengan como strings con comas o puntos', () => {
      const row = {
        sku: 'FERR-002',
        nombre: 'Taladro Percutor 1/2 650W',
        categoria: 'Herramientas Eléctricas',
        costoUnitario: '150.000',
        precioDetal: '220.000,00',
        stockInicial: '15',
      };

      const result = validarBulkItemHardwareRow(row);
      expect(result.success).toBe(true);
      if (result.success && result.data) {
        expect(result.data.costoUnitario).toBe(150000);
        expect(result.data.precioDetal).toBe(220000);
        expect(result.data.stockInicial).toBe(15);
      }
    });
  });
});
