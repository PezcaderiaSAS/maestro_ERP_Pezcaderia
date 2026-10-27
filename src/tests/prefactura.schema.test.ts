import { describe, it, expect } from 'vitest';
import {
  validarItemPrefactura,
  validarEmitirPrefactura,
  validarCobroCaja,
  validarDespacho,
  LIMITE_DESCUENTO_DEFAULT_PCT,
} from '../schemas/prefactura.schema';
import type {
  ItemPrefacturaInput,
  EmitirPrefacturaInput,
  CobrarPrefacturaInput,
  DespachoVerificacionInput,
} from '../types/prefactura.types';

describe('TASK-037-01: Validadores Zod y Contratos de Preventa, Descuentos y Despacho', () => {
  describe('1. Validación de Líneas de Ítems y Límite de Descuento (10% Default)', () => {
    it('acepta un ítem válido con descuento dentro del límite permitido (<= 10%)', () => {
      const item: ItemPrefacturaInput = {
        productoId: 'prod-001',
        nombre: 'Martillo de Uña 16oz',
        cantidad: 2,
        precioLista: 25000,
        descuentoPct: 10,
      };

      const result = validarItemPrefactura(item, LIMITE_DESCUENTO_DEFAULT_PCT);
      expect(result.success).toBe(true);
      expect(result.data?.precioFinal).toBe(22500);
      expect(result.data?.subtotal).toBe(45000);
      expect(result.requiereSupervisor).toBe(false);
    });

    it('acepta un ítem sin descuento (0%) y calcula el subtotal correctamente', () => {
      const item: ItemPrefacturaInput = {
        productoId: 'prod-002',
        nombre: 'Tornillo Drywall 1 pulgada x100',
        cantidad: 5,
        precioLista: 8000,
        descuentoPct: 0,
      };

      const result = validarItemPrefactura(item);
      expect(result.success).toBe(true);
      expect(result.data?.precioFinal).toBe(8000);
      expect(result.data?.subtotal).toBe(40000);
      expect(result.requiereSupervisor).toBe(false);
    });

    it('rechaza ítem con cantidad menor o igual a cero', () => {
      const item: ItemPrefacturaInput = {
        productoId: 'prod-003',
        nombre: 'Sierra Copa Bimetálica',
        cantidad: 0,
        precioLista: 45000,
        descuentoPct: 0,
      };

      const result = validarItemPrefactura(item);
      expect(result.success).toBe(false);
      expect(result.error).toContain('cantidad');
    });

    it('detecta si el descuento supera el umbral permitido (> 10%) y marca requiereSupervisor: true', () => {
      const item: ItemPrefacturaInput = {
        productoId: 'prod-004',
        nombre: 'Taladro Percutor 650W',
        cantidad: 1,
        precioLista: 180000,
        descuentoPct: 15, // Supera el 10%
      };

      const result = validarItemPrefactura(item, LIMITE_DESCUENTO_DEFAULT_PCT);
      expect(result.success).toBe(true);
      expect(result.requiereSupervisor).toBe(true);
      expect(result.supervisorAutorizado).toBe(false);
    });

    it('permite descuento superior al umbral si cuenta con supervisorPinAutorizado: true', () => {
      const item: ItemPrefacturaInput = {
        productoId: 'prod-004',
        nombre: 'Taladro Percutor 650W',
        cantidad: 1,
        precioLista: 180000,
        descuentoPct: 20,
        supervisorPinAutorizado: true,
        supervisorId: 'usr-sup-01',
      };

      const result = validarItemPrefactura(item, LIMITE_DESCUENTO_DEFAULT_PCT);
      expect(result.success).toBe(true);
      expect(result.requiereSupervisor).toBe(true);
      expect(result.supervisorAutorizado).toBe(true);
      expect(result.data?.precioFinal).toBe(144000);
      expect(result.data?.subtotal).toBe(144000);
    });

    it('rechaza porcentajes de descuento negativos o mayores al 100%', () => {
      const itemNegativo: ItemPrefacturaInput = {
        productoId: 'prod-005',
        nombre: 'Cinta Métrica 5m',
        cantidad: 1,
        precioLista: 12000,
        descuentoPct: -5,
      };
      expect(validarItemPrefactura(itemNegativo).success).toBe(false);

      const itemExcesivo: ItemPrefacturaInput = {
        productoId: 'prod-005',
        nombre: 'Cinta Métrica 5m',
        cantidad: 1,
        precioLista: 12000,
        descuentoPct: 105,
      };
      expect(validarItemPrefactura(itemExcesivo).success).toBe(false);
    });
  });

  describe('2. Validación de Emisión de Preventa (Payload Asesor)', () => {
    it('valida exitosamente una preventa con cabecera completa e ítems correctos', () => {
      const payload: EmitirPrefacturaInput = {
        tenantId: 'ten-ferre-01',
        vendedorId: 'usr-vend-01',
        vendedorNombre: 'Marcos Asesor',
        terminalId: 'TERM-01',
        clienteDocumento: '1098765432',
        clienteNombre: 'Construcciones S.A.',
        items: [
          {
            productoId: 'prod-10',
            nombre: 'Cemento Gris 50kg',
            cantidad: 10,
            precioLista: 32000,
            descuentoPct: 5,
          },
        ],
      };

      const res = validarEmitirPrefactura(payload);
      expect(res.success).toBe(true);
      expect(res.data?.tenantId).toBe('ten-ferre-01');
      expect(res.data?.items).toHaveLength(1);
      expect(res.data?.total).toBe(304000); // 10 * 30400
    });

    it('rechaza emisión de preventa con lista vacía de ítems', () => {
      const payload: EmitirPrefacturaInput = {
        tenantId: 'ten-ferre-01',
        vendedorId: 'usr-vend-01',
        vendedorNombre: 'Marcos Asesor',
        terminalId: 'TERM-01',
        items: [],
      };

      const res = validarEmitirPrefactura(payload);
      expect(res.success).toBe(false);
      expect(res.error).toContain('al menos un ítem');
    });

    it('rechaza preventa si falta el tenantId para garantizar Zero Cross-Tenant Leakage', () => {
      const payload = {
        tenantId: '',
        vendedorId: 'usr-vend-01',
        vendedorNombre: 'Marcos Asesor',
        terminalId: 'TERM-01',
        items: [
          {
            productoId: 'prod-01',
            nombre: 'Lija de Agua #220',
            cantidad: 5,
            precioLista: 2000,
            descuentoPct: 0,
          },
        ],
      } as any;

      const res = validarEmitirPrefactura(payload);
      expect(res.success).toBe(false);
      expect(res.error).toContain('tenant');
    });
  });

  describe('3. Validación de Cobro en Caja Central', () => {
    it('valida el cobro en caja cuando los pagos cubren el 100% del total', () => {
      const cobro: CobrarPrefacturaInput = {
        prefacturaId: 'pref-2026-001',
        tenantId: 'ten-ferre-01',
        cajeroId: 'usr-caj-01',
        turnoId: 'tur-caja-01',
        montoTotal: 50000,
        pagos: [
          { metodoPago: 'EFECTIVO', monto: 30000 },
          { metodoPago: 'DATAFONO', monto: 20000, referenciaComprobante: 'AUTH-9988' },
        ],
      };

      const res = validarCobroCaja(cobro);
      expect(res.success).toBe(true);
      expect(res.data?.montoTotal).toBe(50000);
    });

    it('rechaza el cobro si los pagos suman menos que el monto total a recaudar', () => {
      const cobroInsuficiente: CobrarPrefacturaInput = {
        prefacturaId: 'pref-2026-001',
        tenantId: 'ten-ferre-01',
        cajeroId: 'usr-caj-01',
        turnoId: 'tur-caja-01',
        montoTotal: 50000,
        pagos: [{ metodoPago: 'EFECTIVO', monto: 40000 }],
      };

      const res = validarCobroCaja(cobroInsuficiente);
      expect(res.success).toBe(false);
      expect(res.error).toContain('suma de los pagos');
    });
  });

  describe('4. Validación de Despacho y Entrega Física por el Asesor', () => {
    it('valida solicitud de despacho mediante escaneo de QR', () => {
      const input: DespachoVerificacionInput = {
        prefacturaId: 'pref-2026-001',
        tenantId: 'ten-ferre-01',
        asesorId: 'usr-vend-01',
        metodoVerificacion: 'QR_SCAN',
        codigoEscaneado: 'FAC-2026-00042',
      };

      const res = validarDespacho(input);
      expect(res.success).toBe(true);
      expect(res.data?.metodoVerificacion).toBe('QR_SCAN');
    });

    it('valida solicitud de despacho directo desde la bandeja táctil sincronizada', () => {
      const input: DespachoVerificacionInput = {
        prefacturaId: 'pref-2026-001',
        tenantId: 'ten-ferre-01',
        asesorId: 'usr-vend-01',
        metodoVerificacion: 'BANDEJA_TACTIL',
      };

      const res = validarDespacho(input);
      expect(res.success).toBe(true);
      expect(res.data?.metodoVerificacion).toBe('BANDEJA_TACTIL');
    });

    it('rechaza despacho si falta el identificador del asesor o el tenantId', () => {
      const inputInvalido = {
        prefacturaId: 'pref-2026-001',
        tenantId: '',
        asesorId: '',
        metodoVerificacion: 'BANDEJA_TACTIL',
      } as any;

      const res = validarDespacho(inputInvalido);
      expect(res.success).toBe(false);
    });
  });
});
