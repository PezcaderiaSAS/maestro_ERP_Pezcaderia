import { create } from 'zustand';
import type { IDataService } from '../types/services.types';
import { LocalDataService } from '../services/LocalDataService';
import { zustandConsoleMiddleware } from '../lib/consoleMiddleware';
import { cashService } from '../services/cashService';

let dataService: IDataService = new LocalDataService();
export const setPurchaseDataService = (ds: IDataService) => { dataService = ds; };

export interface ItemOrdenCompra {
  sku: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  lote: string;
}

export interface OrdenCompra {
  id: string;
  proveedorId: string;
  proveedorNombre: string;
  fecha: string;
  estado: 'RECIBIDA';
  items: ItemOrdenCompra[];
  totalCompra: number;
  subtotal?: number;
  iva?: number;
  valorIva?: number;
  fletes?: number;
  formaPago?: 'CONTADO' | 'CREDITO';
  saldo?: number;
  bodegaDestino: string;
  actor: string;
  notas?: string;
}

export interface CuentaPorPagar {
  id: string;
  ordenCompraId: string;
  proveedorId: string;
  proveedorNombre: string;
  fechaEmision: string;
  fechaVencimiento: string;
  montoTotal: number;
  saldoPendiente: number;
  estado: 'PENDIENTE' | 'PAGADA_PARCIAL' | 'PAGADA';
  notas?: string;
}

interface PurchaseState {
  ordenesCompra: OrdenCompra[];
  cuentasPorPagar: CuentaPorPagar[];
  loadOrdenesCompra: () => Promise<void>;
  setOrdenesCompra: (ordenesOrUpdater: any) => void;
  addOrdenCompra: (oc: OrdenCompra) => void;
  addOrdenCompraAsync: (oc: OrdenCompra) => Promise<void>;
  updateOrdenCompra: (id: string, data: Partial<OrdenCompra>) => void;
  loadCuentasPorPagar: () => Promise<void>;
  addCuentaPorPagarAsync: (cpp: CuentaPorPagar) => Promise<void>;
  updateCuentaPorPagar: (id: string, data: Partial<CuentaPorPagar>) => Promise<void>;
  registrarAbonoCuentaPorPagar: (params: {
    cuentaId: string;
    monto: number;
    metodoPago: 'EFECTIVO' | 'DATAFONO' | 'TRANSFERENCIA';
    usuarioId?: string;
  }) => Promise<{ ok: boolean; error?: string }>;
}

export const usePurchaseStore = create<PurchaseState>()(
  zustandConsoleMiddleware((set, get) => ({
  ordenesCompra: [],
  cuentasPorPagar: [],

  loadOrdenesCompra: async () => {
    try {
      const loaded = await dataService.getAll<OrdenCompra>('ordenes_compra');
      set({ ordenesCompra: loaded });
    } catch {
      set({ ordenesCompra: [] });
    }
  },

  setOrdenesCompra: (ordenesOrUpdater: any) => set((state) => {
    const newOrdenes = typeof ordenesOrUpdater === 'function' ? ordenesOrUpdater(state.ordenesCompra) : ordenesOrUpdater;
    return { ordenesCompra: newOrdenes };
  }),

  addOrdenCompra: (oc) => {
    dataService.create('ordenes_compra', oc);
    set((state) => ({ ordenesCompra: [oc, ...state.ordenesCompra] }));
  },

  addOrdenCompraAsync: async (oc) => {
    await dataService.create('ordenes_compra', oc);
    set((state) => ({ ordenesCompra: [oc, ...state.ordenesCompra] }));
  },

  updateOrdenCompra: (id, data) => {
    dataService.update('ordenes_compra', id, data);
    set((state) => ({
      ordenesCompra: state.ordenesCompra.map(o => o.id === id ? { ...o, ...data } : o),
    }));
  },

  loadCuentasPorPagar: async () => {
    try {
      const loaded = await dataService.getAll<CuentaPorPagar>('cuentas_por_pagar');
      set({ cuentasPorPagar: loaded });
    } catch {
      set({ cuentasPorPagar: [] });
    }
  },

  addCuentaPorPagarAsync: async (cpp) => {
    await dataService.create('cuentas_por_pagar', cpp);
    set((state) => ({ cuentasPorPagar: [cpp, ...state.cuentasPorPagar] }));
  },

  updateCuentaPorPagar: async (id, data) => {
    await dataService.update('cuentas_por_pagar', id, data);
    set((state) => ({
      cuentasPorPagar: state.cuentasPorPagar.map(c => c.id === id ? { ...c, ...data } : c),
    }));
  },

  registrarAbonoCuentaPorPagar: async ({ cuentaId, monto, metodoPago, usuarioId = 'SISTEMA' }) => {
    const cpp = get().cuentasPorPagar.find(c => c.id === cuentaId);
    if (!cpp) return { ok: false, error: 'Cuenta por pagar no encontrada' };
    if (monto <= 0) return { ok: false, error: 'El monto debe ser mayor a cero' };
    if (monto > cpp.saldoPendiente) return { ok: false, error: 'El abono supera el saldo pendiente' };

    const nuevoSaldo = Math.max(0, cpp.saldoPendiente - monto);
    const nuevoEstado = nuevoSaldo === 0 ? 'PAGADA' : 'PAGADA_PARCIAL';

    await get().updateCuentaPorPagar(cuentaId, { saldoPendiente: nuevoSaldo, estado: nuevoEstado });

    try {
      cashService.seedCajasParaBodegas();
      const todosTurnos = cashService.getTurnos();
      const turnoActivo = todosTurnos.find(t => t.estado === 'ABIERTO');
      if (turnoActivo) {
        cashService.registrarMovimiento(
          turnoActivo.id,
          turnoActivo.cajaId,
          'EGRESO_GASTO',
          metodoPago,
          monto,
          `Abono CxP Compra ${cpp.ordenCompraId} (${cpp.proveedorNombre})`,
          cpp.id,
          usuarioId
        );
      }
    } catch (cashErr) {
      console.error('Error al registrar egreso por abono a proveedor en caja:', cashErr);
    }

    return { ok: true };
  },
  })));

