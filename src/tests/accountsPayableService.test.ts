import { describe, it, expect, beforeEach } from 'vitest';
import {
  accountsPayableService,
  calcularFechaVencimiento
} from '../services/accountsPayableService';
import { useAccountsPayableStore } from '../store/useAccountsPayableStore';

describe('TASK-022-02: accountsPayableService & useAccountsPayableStore', () => {
  beforeEach(() => {
    localStorage.clear();
    accountsPayableService.limpiarEnMemoria();
    useAccountsPayableStore.getState().recargarCuentas();
  });

  describe('1. Utilidades de Fecha y Vencimiento', () => {
    it('Calcula exactamente la fecha de vencimiento sumando los días de crédito a la fecha de emisión', () => {
      // 2026-10-18 + 15 días = 2026-11-02
      const fechaVencimiento = calcularFechaVencimiento('2026-10-18', 15);
      expect(fechaVencimiento).toBe('2026-11-02');
    });

    it('Maneja meses con 31 días y cambios de año', () => {
      // 2026-12-25 + 10 días = 2027-01-04
      const fechaVencimiento = calcularFechaVencimiento('2026-12-25', 10);
      expect(fechaVencimiento).toBe('2027-01-04');
    });
  });

  describe('2. Registro de Cuentas por Pagar (Causación en Muelle)', () => {
    it('Crea una cuenta por pagar con saldo inicial igual al monto total y estado PENDIENTE', () => {
      const cuenta = accountsPayableService.registrarCuentaPorPagar({
        proveedorId: 'PROV-PACIFICO-01',
        proveedorNombre: 'Pesquera del Pacífico S.A.S.',
        proveedorNit: '900.123.456-7',
        montoTotal: 2500000.75, // Debe redondear a entero 2500001
        fechaEmision: '2026-10-18',
        diasCredito: 15,
        recepcionMuelleId: 'REC-20261018-001',
        observaciones: 'Furgón 4 canastillas mojarra'
      });

      expect(cuenta.id).toMatch(/^CXP-20261018-\d{4}$/);
      expect(cuenta.montoTotal).toBe(2500001);
      expect(cuenta.saldoPendiente).toBe(2500001);
      expect(cuenta.estado).toBe('PENDIENTE');
      expect(cuenta.fechaEmision).toBe('2026-10-18');
      expect(cuenta.fechaVencimiento).toBe('2026-11-02');
      expect(cuenta.abonos).toHaveLength(0);
    });

    it('Recupera la lista de cuentas almacenadas', () => {
      accountsPayableService.registrarCuentaPorPagar({
        proveedorId: 'PROV-1',
        proveedorNombre: 'Proveedor 1',
        proveedorNit: '9001',
        montoTotal: 1000000,
        fechaEmision: '2026-10-18',
        diasCredito: 30
      });

      const cuentas = accountsPayableService.obtenerTodas();
      expect(cuentas).toHaveLength(1);
      expect(cuentas[0].proveedorNombre).toBe('Proveedor 1');
    });
  });

  describe('3. Registro de Abonos y Actualización de Saldos', () => {
    it('Registra un abono parcial cambiando el estado a PAGADO_PARCIAL y reduciendo el saldo', () => {
      const cuenta = accountsPayableService.registrarCuentaPorPagar({
        proveedorId: 'PROV-1',
        proveedorNombre: 'Proveedor 1',
        proveedorNit: '9001',
        montoTotal: 1000000,
        fechaEmision: '2026-10-18',
        diasCredito: 15
      });

      const cuentaActualizada = accountsPayableService.registrarAbono({
        cuentaPorPagarId: cuenta.id,
        monto: 400000,
        medioPago: 'TRANSFERENCIA',
        referenciaComprobante: 'TRANSF-BANCOLOMBIA-8891'
      });

      expect(cuentaActualizada.saldoPendiente).toBe(600000);
      expect(cuentaActualizada.estado).toBe('PAGADO_PARCIAL');
      expect(cuentaActualizada.abonos).toHaveLength(1);
      expect(cuentaActualizada.abonos[0].monto).toBe(400000);
      expect(cuentaActualizada.abonos[0].referenciaComprobante).toBe('TRANSF-BANCOLOMBIA-8891');
    });

    it('Cambia el estado a PAGADO cuando el saldo pendiente llega exactamente a cero', () => {
      const cuenta = accountsPayableService.registrarCuentaPorPagar({
        proveedorId: 'PROV-1',
        proveedorNombre: 'Proveedor 1',
        proveedorNit: '9001',
        montoTotal: 500000,
        fechaEmision: '2026-10-18',
        diasCredito: 10
      });

      const cuentaLiquidada = accountsPayableService.registrarAbono({
        cuentaPorPagarId: cuenta.id,
        monto: 500000,
        medioPago: 'EFECTIVO'
      });

      expect(cuentaLiquidada.saldoPendiente).toBe(0);
      expect(cuentaLiquidada.estado).toBe('PAGADO');
    });

    it('Rechaza abonos que superen el saldo pendiente de la cuenta', () => {
      const cuenta = accountsPayableService.registrarCuentaPorPagar({
        proveedorId: 'PROV-1',
        proveedorNombre: 'Proveedor 1',
        proveedorNit: '9001',
        montoTotal: 300000,
        fechaEmision: '2026-10-18',
        diasCredito: 10
      });

      expect(() => {
        accountsPayableService.registrarAbono({
          cuentaPorPagarId: cuenta.id,
          monto: 350000,
          medioPago: 'EFECTIVO'
        });
      }).toThrow(/El abono.*no puede superar el saldo pendiente/);
    });

    it('Rechaza abonos menores o iguales a cero', () => {
      const cuenta = accountsPayableService.registrarCuentaPorPagar({
        proveedorId: 'PROV-1',
        proveedorNombre: 'Proveedor 1',
        proveedorNit: '9001',
        montoTotal: 300000,
        fechaEmision: '2026-10-18',
        diasCredito: 10
      });

      expect(() => {
        accountsPayableService.registrarAbono({
          cuentaPorPagarId: cuenta.id,
          monto: 0,
          medioPago: 'EFECTIVO'
        });
      }).toThrow(/El monto del abono debe ser mayor a cero/);
    });
  });

  describe('4. Store Reactivo: useAccountsPayableStore', () => {
    it('Crea y actualiza cuentas de forma reactiva en el store', () => {
      const store = useAccountsPayableStore.getState();

      const nuevaCuenta = store.crearCuentaPorPagar({
        proveedorId: 'PROV-REACTIVO',
        proveedorNombre: 'Pescados del Caribe',
        proveedorNit: '901234',
        montoTotal: 800000,
        fechaEmision: '2026-10-18',
        diasCredito: 8
      });

      expect(nuevaCuenta).toBeDefined();
      expect(useAccountsPayableStore.getState().cuentas).toHaveLength(1);
      expect(useAccountsPayableStore.getState().totalSaldoPendiente).toBe(800000);

      // Abonar desde el store
      store.abonarCuenta({
        cuentaPorPagarId: nuevaCuenta.id,
        monto: 300000,
        medioPago: 'TRANSFERENCIA'
      });

      expect(useAccountsPayableStore.getState().totalSaldoPendiente).toBe(500000);
      const cuentaEnStore = useAccountsPayableStore.getState().cuentas.find(c => c.id === nuevaCuenta.id);
      expect(cuentaEnStore?.estado).toBe('PAGADO_PARCIAL');
    });
  });
});
