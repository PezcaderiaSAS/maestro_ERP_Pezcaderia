// src/stores/useMultiVendorPosStore.ts
// Store Zustand para gestión de terminal POS (1 a 8), preventas de mostrador y control de recaudo (SPEC-037)

import { create } from 'zustand';
import { zustandConsoleMiddleware } from '../lib/consoleMiddleware';
import type { ItemPrefacturaInput } from '../types/prefactura.types';
import { prefacturaService, type ResultadoEmisionPrefactura } from '../services/prefacturaService';
import { validarItemPrefactura, LIMITE_DESCUENTO_DEFAULT_PCT } from '../schemas/prefactura.schema';
import { useAuthStore } from '../store/useAuthStore';

export interface VendedorSesion {
  id: string;
  nombre: string;
  rol: string;
  pin?: string;
  avatarUrl?: string;
}

export interface AplicarDescuentoResultado {
  ok: boolean;
  requiereSupervisor: boolean;
  error?: string;
}

interface MultiVendorPosState {
  terminalId: string;
  vendedorActivo: VendedorSesion | null;
  turnoCentralEstado: 'ABIERTO' | 'CERRADO' | 'SIN_TURNO';
  turnoCentralId: string | null;

  // Estado del Carrito de Preventa
  cartItems: ItemPrefacturaInput[];
  maxDescuentoVendedorPct: number;

  // Acciones de Terminal y Vendedor
  setTerminalId: (id: string) => void;
  setVendedorActivo: (vendedor: VendedorSesion | null) => void;
  setTurnoCentralEstado: (
    estado: 'ABIERTO' | 'CERRADO' | 'SIN_TURNO',
    turnoId: string | null
  ) => void;
  clearVendedor: () => void;

  // Gobernanza de Permisos de Recaudo
  canProcessDirectCashierPayment: () => boolean;

  // Acciones de Carrito de Preventa
  agregarItem: (item: ItemPrefacturaInput) => void;
  eliminarItem: (productoId: string) => void;
  actualizarCantidadItem: (productoId: string, cantidad: number) => void;
  aplicarDescuentoItem: (
    productoId: string,
    descuentoPct: number,
    supervisorPinAutorizado?: boolean,
    supervisorId?: string
  ) => AplicarDescuentoResultado;
  obtenerSubtotalCart: () => number;
  obtenerTotalCart: () => number;
  limpiarCart: () => void;

  // Emisión de Preventa de Mostrador
  emitirPreventaActual: (cliente?: {
    clienteDocumento?: string;
    clienteNombre?: string;
  }) => Promise<ResultadoEmisionPrefactura>;
}

const STORAGE_KEY_TERMINAL = 'erp_pos_terminal_id';

const getInitialTerminal = (): string => {
  if (typeof window !== 'undefined' && window.localStorage) {
    return localStorage.getItem(STORAGE_KEY_TERMINAL) || 'TERM-01';
  }
  return 'TERM-01';
};

export const useMultiVendorPosStore = create<MultiVendorPosState>()(
  zustandConsoleMiddleware((set, get) => ({
    terminalId: getInitialTerminal(),
    vendedorActivo: {
      id: 'emp-cajero-default',
      nombre: 'Vendedor de Turno',
      rol: 'VENDEDOR',
    },
    turnoCentralEstado: 'ABIERTO',
    turnoCentralId: null,

    cartItems: [],
    maxDescuentoVendedorPct: LIMITE_DESCUENTO_DEFAULT_PCT,

    setTerminalId: (id: string) => {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(STORAGE_KEY_TERMINAL, id);
      }
      set({ terminalId: id });
    },

    setVendedorActivo: (vendedor: VendedorSesion | null) => {
      set({ vendedorActivo: vendedor });
    },

    setTurnoCentralEstado: (
      estado: 'ABIERTO' | 'CERRADO' | 'SIN_TURNO',
      turnoId: string | null
    ) => {
      set({ turnoCentralEstado: estado, turnoCentralId: turnoId });
    },

    clearVendedor: () => {
      set({ vendedorActivo: null });
    },

    /**
     * Regla de Negocio: Los vendedores NO recaudan ni tocan dinero.
     * Solo cajeros y administradores pueden procesar cobros y movimientos de caja.
     */
    canProcessDirectCashierPayment: () => {
      const { vendedorActivo } = get();
      if (!vendedorActivo) return false;
      const rol = vendedorActivo.rol.toUpperCase();
      return rol === 'CAJERO' || rol === 'ADMIN' || rol === 'SUPERVISOR';
    },

    agregarItem: (item: ItemPrefacturaInput) => {
      const { cartItems } = get();
      const index = cartItems.findIndex((it) => it.productoId === item.productoId);

      if (index >= 0) {
        const nuevos = [...cartItems];
        nuevos[index] = {
          ...nuevos[index],
          cantidad: nuevos[index].cantidad + item.cantidad,
        };
        set({ cartItems: nuevos });
      } else {
        set({ cartItems: [...cartItems, { ...item, descuentoPct: item.descuentoPct || 0 }] });
      }
    },

    eliminarItem: (productoId: string) => {
      const { cartItems } = get();
      set({ cartItems: cartItems.filter((it) => it.productoId !== productoId) });
    },

    actualizarCantidadItem: (productoId: string, cantidad: number) => {
      const { cartItems } = get();
      if (cantidad <= 0) {
        get().eliminarItem(productoId);
        return;
      }
      set({
        cartItems: cartItems.map((it) =>
          it.productoId === productoId ? { ...it, cantidad } : it
        ),
      });
    },

    aplicarDescuentoItem: (
      productoId: string,
      descuentoPct: number,
      supervisorPinAutorizado?: boolean,
      supervisorId?: string
    ): AplicarDescuentoResultado => {
      const { cartItems, maxDescuentoVendedorPct } = get();
      const item = cartItems.find((it) => it.productoId === productoId);

      if (!item) {
        return { ok: false, requiereSupervisor: false, error: 'Producto no encontrado en carrito' };
      }

      const validacion = validarItemPrefactura(
        {
          ...item,
          descuentoPct,
          supervisorPinAutorizado,
          supervisorId,
        },
        maxDescuentoVendedorPct
      );

      if (!validacion.success) {
        return {
          ok: false,
          requiereSupervisor: validacion.requiereSupervisor,
          error: validacion.error || 'Descuento inválido',
        };
      }

      if (validacion.requiereSupervisor && !validacion.supervisorAutorizado) {
        return {
          ok: false,
          requiereSupervisor: true,
          error: `El descuento del ${descuentoPct}% supera el ${maxDescuentoVendedorPct}% permitido al asesor y requiere autorización por PIN de Supervisor`,
        };
      }

      set({
        cartItems: cartItems.map((it) =>
          it.productoId === productoId
            ? {
                ...it,
                descuentoPct,
                supervisorPinAutorizado: Boolean(supervisorPinAutorizado),
                supervisorId,
              }
            : it
        ),
      });

      return {
        ok: true,
        requiereSupervisor: validacion.requiereSupervisor,
      };
    },

    obtenerSubtotalCart: () => {
      const { cartItems } = get();
      return cartItems.reduce((acc, it) => acc + it.precioLista * it.cantidad, 0);
    },

    obtenerTotalCart: () => {
      const { cartItems } = get();
      return cartItems.reduce((acc, it) => {
        const desc = it.descuentoPct || 0;
        const precioFinal = Math.round(it.precioLista * (1 - desc / 100));
        return acc + precioFinal * it.cantidad;
      }, 0);
    },

    limpiarCart: () => {
      set({ cartItems: [] });
    },

    emitirPreventaActual: async (cliente?: {
      clienteDocumento?: string;
      clienteNombre?: string;
    }) => {
      const { cartItems, terminalId, vendedorActivo } = get();

      if (cartItems.length === 0) {
        return { ok: false, error: 'El carrito de preventa está vacío' };
      }

      const activeTenant = useAuthStore.getState().activeTenant;
      const tenantId = activeTenant?.id || 'ten-default';

      const emisionRes = await prefacturaService.emitirPrefactura({
        tenantId,
        vendedorId: vendedorActivo?.id || 'usr-vendedor-default',
        vendedorNombre: vendedorActivo?.nombre || 'Vendedor Comercial',
        terminalId,
        clienteDocumento: cliente?.clienteDocumento,
        clienteNombre: cliente?.clienteNombre,
        items: cartItems,
      });

      if (emisionRes.ok) {
        // Vaciar carrito tras emisión exitosa
        set({ cartItems: [] });
      }

      return emisionRes;
    },
  }))
);
