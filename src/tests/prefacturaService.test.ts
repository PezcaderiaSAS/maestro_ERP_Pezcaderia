import { describe, it, expect, beforeEach } from 'vitest';
import { PrefacturaService } from '../services/prefacturaService';
import type { EmitirPrefacturaInput, CobrarPrefacturaInput, DespachoVerificacionInput } from '../types/prefactura.types';

describe('TASK-037-02: PrefacturaService - Gestión de Preventas, Hard-Hold y Despacho', () => {
  let service: PrefacturaService;

  beforeEach(() => {
    service = new PrefacturaService({ isMockMode: true });
    service.limpiarEstadoPruebas();
  });

  describe('1. Emisión de Preventas y Hard-Hold de Stock', () => {
    it('emite una preventa exitosamente con Hard-Hold activo y genera código y ticket con QR', async () => {
      const input: EmitirPrefacturaInput = {
        tenantId: 'ten-ferre-01',
        vendedorId: 'usr-vend-01',
        vendedorNombre: 'Marcos Asesor',
        terminalId: 'TERM-01',
        clienteDocumento: '1098765432',
        clienteNombre: 'Construcciones S.A.',
        items: [
          {
            productoId: 'prod-cemento',
            nombre: 'Cemento Gris 50kg',
            cantidad: 5,
            precioLista: 30000,
            descuentoPct: 0,
          },
        ],
      };

      const result = await service.emitirPrefactura(input);
      expect(result.ok).toBe(true);
      expect(result.prefactura).toBeDefined();
      expect(result.prefactura?.codigoPreventa).toMatch(/^PRE-\d{4}-\d{5}$/);
      expect(result.prefactura?.estado).toBe('PENDIENTE_COBRO');
      expect(result.prefactura?.hardHoldActivo).toBe(true);
      expect(result.prefactura?.total).toBe(150000);
      expect(result.ticketQrPayload).toContain(result.prefactura?.codigoPreventa);
    });

    it('aplica descuento comercial dentro del límite (<=10%) sin requerir supervisor', async () => {
      const input: EmitirPrefacturaInput = {
        tenantId: 'ten-ferre-01',
        vendedorId: 'usr-vend-01',
        vendedorNombre: 'Marcos Asesor',
        terminalId: 'TERM-01',
        items: [
          {
            productoId: 'prod-tubo',
            nombre: 'Tubo PVC 1/2 pulgada 6m',
            cantidad: 2,
            precioLista: 20000,
            descuentoPct: 10,
          },
        ],
      };

      const result = await service.emitirPrefactura(input);
      expect(result.ok).toBe(true);
      expect(result.prefactura?.total).toBe(36000); // 2 * 18000
      expect(result.prefactura?.descuentoTotal).toBe(4000);
    });
  });

  describe('2. Aislamiento Multi-Tenant Estricto (Zero Cross-Tenant Leakage)', () => {
    it('garantiza que las preventas de la Empresa A jamás se mezclan con las de la Empresa B', async () => {
      // 1. Preventa en Empresa A
      await service.emitirPrefactura({
        tenantId: 'ten-empresa-a',
        vendedorId: 'usr-v-a',
        vendedorNombre: 'Vendedor A',
        terminalId: 'TERM-01',
        items: [{ productoId: 'prod-a', nombre: 'Ítem Empresa A', cantidad: 1, precioLista: 10000 }],
      });

      // 2. Preventa en Empresa B
      await service.emitirPrefactura({
        tenantId: 'ten-empresa-b',
        vendedorId: 'usr-v-b',
        vendedorNombre: 'Vendedor B',
        terminalId: 'TERM-02',
        items: [{ productoId: 'prod-b', nombre: 'Ítem Empresa B', cantidad: 3, precioLista: 5000 }],
      });

      // 3. Consultas aisladas por tenant_id
      const preventasA = service.obtenerPrefacturasPorTenant('ten-empresa-a');
      expect(preventasA).toHaveLength(1);
      expect(preventasA[0].items[0].nombre).toBe('Ítem Empresa A');

      const preventasB = service.obtenerPrefacturasPorTenant('ten-empresa-b');
      expect(preventasB).toHaveLength(1);
      expect(preventasB[0].items[0].nombre).toBe('Ítem Empresa B');

      // 4. Intento de búsqueda cross-tenant: Empresa B busca código de Empresa A y recibe null
      const codigoA = preventasA[0].codigoPreventa;
      const busquedaInvalida = service.buscarPorCodigo('ten-empresa-b', codigoA);
      expect(busquedaInvalida).toBeNull();
    });
  });

  describe('3. Transición de Estados: Caja Única y Recaudo (Kanban)', () => {
    it('permite al cajero pasar la preventa a EN_COBRO y posteriormente recaudar pasando a PAGADA', async () => {
      const emision = await service.emitirPrefactura({
        tenantId: 'ten-ferre-01',
        vendedorId: 'usr-v-1',
        vendedorNombre: 'Vendedor 1',
        terminalId: 'TERM-01',
        items: [{ productoId: 'p1', nombre: 'Pintura Blanca Galón', cantidad: 1, precioLista: 65000 }],
      });
      const prefId = emision.prefactura!.id;

      // 1. Pasar a EN_COBRO en la ventanilla del cajero
      const resEnCobro = service.marcarEnCobro('ten-ferre-01', prefId, 'usr-cajero-01');
      expect(resEnCobro.ok).toBe(true);
      expect(resEnCobro.prefactura?.estado).toBe('EN_COBRO');
      expect(resEnCobro.prefactura?.cajeroId).toBe('usr-cajero-01');

      // 2. Procesar recaudo del 100%
      const cobroInput: CobrarPrefacturaInput = {
        prefacturaId: prefId,
        tenantId: 'ten-ferre-01',
        cajeroId: 'usr-cajero-01',
        turnoId: 'tur-01',
        montoTotal: 65000,
        pagos: [{ metodoPago: 'EFECTIVO', monto: 65000 }],
      };

      const resCobro = await service.registrarCobroEnCaja(cobroInput);
      expect(resCobro.ok).toBe(true);
      expect(resCobro.prefactura?.estado).toBe('PAGADA');
      expect(resCobro.prefactura?.facturaId).toBeDefined();
      expect(resCobro.prefactura?.pagadoAt).toBeDefined();
      expect(resCobro.prefactura?.hardHoldActivo).toBe(true); // Se mantiene reservado hasta entrega
    });
  });

  describe('4. Verificación de Despacho y Entrega Física por el Asesor', () => {
    it('bloquea el despacho si la preventa NO está en estado PAGADA', async () => {
      const emision = await service.emitirPrefactura({
        tenantId: 'ten-ferre-01',
        vendedorId: 'usr-v-1',
        vendedorNombre: 'Vendedor 1',
        terminalId: 'TERM-01',
        items: [{ productoId: 'p1', nombre: 'Varilla Corrugada 1/2', cantidad: 4, precioLista: 25000 }],
      });
      const prefId = emision.prefactura!.id;

      const despachoInvalido: DespachoVerificacionInput = {
        prefacturaId: prefId,
        tenantId: 'ten-ferre-01',
        asesorId: 'usr-v-1',
        metodoVerificacion: 'BANDEJA_TACTIL',
      };

      const res = await service.registrarDespacho(despachoInvalido);
      expect(res.ok).toBe(false);
      expect(res.error).toContain('PAGADA');
    });

    it('permite despachar exitosamente una preventa PAGADA y libera el ciclo marcando DESPACHADA', async () => {
      // 1. Emitir y cobrar preventa
      const emision = await service.emitirPrefactura({
        tenantId: 'ten-ferre-01',
        vendedorId: 'usr-v-1',
        vendedorNombre: 'Vendedor 1',
        terminalId: 'TERM-01',
        items: [{ productoId: 'p1', nombre: 'Arena Lavada Bulto', cantidad: 3, precioLista: 12000 }],
      });
      const prefId = emision.prefactura!.id;

      await service.registrarCobroEnCaja({
        prefacturaId: prefId,
        tenantId: 'ten-ferre-01',
        cajeroId: 'usr-cajero-01',
        turnoId: 'tur-01',
        montoTotal: 36000,
        pagos: [{ metodoPago: 'DATAFONO', monto: 36000 }],
      });

      // 2. Asesor verifica entrega mediante escaneo QR
      const despachoOk: DespachoVerificacionInput = {
        prefacturaId: prefId,
        tenantId: 'ten-ferre-01',
        asesorId: 'usr-v-1',
        metodoVerificacion: 'QR_SCAN',
        codigoEscaneado: emision.prefactura!.codigoPreventa,
      };

      const resDespacho = await service.registrarDespacho(despachoOk);
      expect(resDespacho.ok).toBe(true);
      expect(resDespacho.prefactura?.estado).toBe('DESPACHADA');
      expect(resDespacho.prefactura?.despachadoAt).toBeDefined();
      expect(resDespacho.prefactura?.despachadoPorId).toBe('usr-v-1');
      expect(resDespacho.prefactura?.hardHoldActivo).toBe(false); // Liberado tras entrega
    });
  });

  describe('5. Cancelación de Preventa por Supervisor y Liberación de Hard-Hold', () => {
    it('permite a un supervisor cancelar una preventa pendiente liberando el stock reservado', async () => {
      const emision = await service.emitirPrefactura({
        tenantId: 'ten-ferre-01',
        vendedorId: 'usr-v-1',
        vendedorNombre: 'Vendedor 1',
        terminalId: 'TERM-01',
        items: [{ productoId: 'p1', nombre: 'Taladro Demo', cantidad: 1, precioLista: 200000 }],
      });
      const prefId = emision.prefactura!.id;

      const resCancelacion = await service.cancelarPrefactura({
        tenantId: 'ten-ferre-01',
        prefacturaId: prefId,
        supervisorId: 'usr-sup-01',
        motivo: 'Cliente desistió de la compra en mostrador',
      });

      expect(resCancelacion.ok).toBe(true);
      expect(resCancelacion.prefactura?.estado).toBe('ANULADA');
      expect(resCancelacion.prefactura?.hardHoldActivo).toBe(false);
    });
  });
});
