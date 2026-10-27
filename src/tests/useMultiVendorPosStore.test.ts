import { describe, it, expect, beforeEach } from 'vitest';
import { useMultiVendorPosStore } from '../stores/useMultiVendorPosStore';
import { prefacturaService } from '../services/prefacturaService';
import { useAuthStore } from '../store/useAuthStore';

describe('TASK-037-04: useMultiVendorPosStore - Preventa de Mostrador, Descuentos y Control de Recaudo', () => {
  beforeEach(() => {
    prefacturaService.limpiarEstadoPruebas();
    useAuthStore.setState({
      activeTenant: {
        id: 'ten-test-pos',
        razonSocial: 'Ferretería y Pescadería Central',
        nit: '900.555.666-1',
        ciudad: 'Cali',
        telefono: '3151234567',
        regimenTributario: 'COMUN',
        activo: true,
        createdAt: new Date().toISOString(),
      },
    });

    useMultiVendorPosStore.setState({
      terminalId: 'TERM-01',
      vendedorActivo: {
        id: 'usr-vend-marcos',
        nombre: 'Marcos Asesor',
        rol: 'VENDEDOR',
      },
      cartItems: [],
      maxDescuentoVendedorPct: 10,
    });
  });

  describe('1. Control de Permisos de Recaudo por Rol (Vendedores no reciben dineros)', () => {
    it('un asesor con rol "VENDEDOR" no puede procesar recaudo directo en caja (canProcessDirectCashierPayment = false)', () => {
      useMultiVendorPosStore.setState({
        vendedorActivo: { id: 'v1', nombre: 'Asesor 1', rol: 'VENDEDOR' },
      });
      expect(useMultiVendorPosStore.getState().canProcessDirectCashierPayment()).toBe(false);
    });

    it('un usuario con rol "CAJERO" o "ADMIN" sí puede procesar recaudo directo de caja', () => {
      useMultiVendorPosStore.setState({
        vendedorActivo: { id: 'c1', nombre: 'Cajero 1', rol: 'CAJERO' },
      });
      expect(useMultiVendorPosStore.getState().canProcessDirectCashierPayment()).toBe(true);

      useMultiVendorPosStore.setState({
        vendedorActivo: { id: 'a1', nombre: 'Admin 1', rol: 'ADMIN' },
      });
      expect(useMultiVendorPosStore.getState().canProcessDirectCashierPayment()).toBe(true);
    });
  });

  describe('2. Gestión de Carrito de Preventa y Límite de Descuento (10%)', () => {
    it('agrega ítems al carrito de preventa y calcula los subtotales correctamente', () => {
      useMultiVendorPosStore.getState().agregarItem({
        productoId: 'prod-1',
        nombre: 'Disco de Corte 4 1/2 pulgada',
        cantidad: 5,
        precioLista: 6000,
        descuentoPct: 0,
      });

      const items = useMultiVendorPosStore.getState().cartItems;
      expect(items).toHaveLength(1);
      expect(useMultiVendorPosStore.getState().obtenerSubtotalCart()).toBe(30000);
      expect(useMultiVendorPosStore.getState().obtenerTotalCart()).toBe(30000);
    });

    it('permite aplicar descuento comercial hasta el 10% sin requerir supervisor', () => {
      useMultiVendorPosStore.getState().agregarItem({
        productoId: 'prod-2',
        nombre: 'Broca para Concreto 3/8',
        cantidad: 2,
        precioLista: 15000,
        descuentoPct: 0,
      });

      const res = useMultiVendorPosStore.getState().aplicarDescuentoItem('prod-2', 10);
      expect(res.ok).toBe(true);
      expect(res.requiereSupervisor).toBe(false);

      expect(useMultiVendorPosStore.getState().obtenerTotalCart()).toBe(27000); // 2 * 13500
    });

    it('bloquea descuento mayor al 10% si no cuenta con autorización de supervisor', () => {
      useMultiVendorPosStore.getState().agregarItem({
        productoId: 'prod-3',
        nombre: 'Caja Herramientas 19 pulg',
        cantidad: 1,
        precioLista: 80000,
        descuentoPct: 0,
      });

      const res = useMultiVendorPosStore.getState().aplicarDescuentoItem('prod-3', 15);
      expect(res.ok).toBe(false);
      expect(res.requiereSupervisor).toBe(true);
      expect(res.error).toContain('PIN de Supervisor');
    });

    it('permite descuento mayor al 10% cuando se suministra supervisorPinAutorizado: true', () => {
      useMultiVendorPosStore.getState().agregarItem({
        productoId: 'prod-3',
        nombre: 'Caja Herramientas 19 pulg',
        cantidad: 1,
        precioLista: 80000,
        descuentoPct: 0,
      });

      const res = useMultiVendorPosStore.getState().aplicarDescuentoItem('prod-3', 20, true, 'usr-sup-01');
      expect(res.ok).toBe(true);
      expect(res.requiereSupervisor).toBe(true);
      expect(useMultiVendorPosStore.getState().obtenerTotalCart()).toBe(64000); // 80000 - 20%
    });
  });

  describe('3. Emisión de Preventa de Mostrador e Impresión de Ticket QR', () => {
    it('emite la preventa, genera ticket con QR y vacía el carrito automáticamente', async () => {
      useMultiVendorPosStore.getState().agregarItem({
        productoId: 'prod-tubo',
        nombre: 'Tubo Sanitario 3 pulg x 3m',
        cantidad: 3,
        precioLista: 40000,
        descuentoPct: 5,
      });

      const resEmision = await useMultiVendorPosStore.getState().emitirPreventaActual({
        clienteDocumento: '11223344',
        clienteNombre: 'Pedro Contratista',
      });

      expect(resEmision.ok).toBe(true);
      expect(resEmision.prefactura).toBeDefined();
      expect(resEmision.prefactura?.codigoPreventa).toMatch(/^PRE-\d{4}-\d{5}$/);
      expect(resEmision.ticketQrPayload).toContain(resEmision.prefactura?.codigoPreventa);

      // El carrito debe quedar limpio para la siguiente atención
      expect(useMultiVendorPosStore.getState().cartItems).toHaveLength(0);
    });

    it('rechaza emisión si el carrito está vacío', async () => {
      const resEmision = await useMultiVendorPosStore.getState().emitirPreventaActual({});
      expect(resEmision.ok).toBe(false);
      expect(resEmision.error).toContain('carrito');
    });
  });
});
