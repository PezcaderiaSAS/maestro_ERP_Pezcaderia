// src/store/useMostradorStore.ts
// Store Zustand — Vista de Mostrador Tipo Tabla (Venta Rápida de Mostrador)
// Gestión de estado: catálogo, líneas de venta, búsqueda y preventas multivendedor

import { create } from 'zustand';
import type { LocalIndexedDbProduct } from '../types/indexedDb.types';

// ============================================================
// Tipos
// ============================================================

export interface LineaVentaMostrador {
  /** Identificador único de línea (UUID corto) */
  id: string;
  producto: LocalIndexedDbProduct;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface TotalesMostrador {
  subtotal: number;
  descuento: number;
  total: number;
  cantidadLineas: number;
  cantidadItems: number;
}

export interface PreventaParkadaMostrador {
  id: string;
  codigo: string; // PRE-YYYY-XXXXX
  lineas: LineaVentaMostrador[];
  totales: TotalesMostrador;
  vendedorId: string;
  vendedorNombre: string;
  clienteNombre: string;
  creadoEn: string;
}

// ============================================================
// Helpers
// ============================================================

function generarIdLinea(): string {
  return `l-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function generarCodigoPreventa(): string {
  const anio = new Date().getFullYear();
  const seq = String(Math.floor(Math.random() * 90000) + 10000);
  return `PRE-${anio}-${seq}`;
}

function calcularTotales(lineas: LineaVentaMostrador[], descuento = 0): TotalesMostrador {
  const subtotal = lineas.reduce((acc, l) => acc + l.subtotal, 0);
  const total = Math.max(0, subtotal - descuento);
  return {
    subtotal,
    descuento,
    total,
    cantidadLineas: lineas.length,
    cantidadItems: lineas.reduce((acc, l) => acc + l.cantidad, 0),
  };
}

// ============================================================
// Estado
// ============================================================

interface MostradorState {
  // Catálogo cargado en memoria
  catalogo: LocalIndexedDbProduct[];
  catalogoCargado: boolean;
  cargandoCatalogo: boolean;
  errorCatalogo: string | null;

  // Líneas de venta activas
  lineas: LineaVentaMostrador[];
  descuento: number;
  totales: TotalesMostrador;

  // Input rápido
  queryBusqueda: string;
  cantidadInput: number;

  // Fila seleccionada en tabla (índice)
  filaSeleccionada: number;

  // Panel de cobro
  cobrandoAbierto: boolean;

  // Preventas parkadas
  preventasParkadas: PreventaParkadaMostrador[];

  // Cliente y vendedor activos
  clienteNombre: string;
  vendedorId: string;
  vendedorNombre: string;

  // Acciones
  setCatalogo: (productos: LocalIndexedDbProduct[]) => void;
  setCargandoCatalogo: (v: boolean) => void;
  setErrorCatalogo: (e: string | null) => void;

  addLinea: (producto: LocalIndexedDbProduct, cantidad?: number) => void;
  removeLinea: (lineaId: string) => void;
  updateCantidad: (lineaId: string, cantidad: number) => void;
  setDescuento: (valor: number) => void;
  limpiarVenta: () => void;

  setQueryBusqueda: (q: string) => void;
  setCantidadInput: (n: number) => void;
  setFilaSeleccionada: (i: number) => void;
  setCobrandoAbierto: (v: boolean) => void;

  emitirPreventa: () => PreventaParkadaMostrador | null;
  retomarPreventa: (id: string) => void;
  descartarPreventa: (id: string) => void;

  setClienteNombre: (nombre: string) => void;
  setVendedor: (id: string, nombre: string) => void;
}

export const useMostradorStore = create<MostradorState>((set, get) => ({
  // Catálogo
  catalogo: [],
  catalogoCargado: false,
  cargandoCatalogo: false,
  errorCatalogo: null,

  // Venta activa
  lineas: [],
  descuento: 0,
  totales: calcularTotales([]),

  // UI
  queryBusqueda: '',
  cantidadInput: 1,
  filaSeleccionada: -1,
  cobrandoAbierto: false,

  // Preventas
  preventasParkadas: [],

  // Sesión
  clienteNombre: 'Consumidor Final',
  vendedorId: '',
  vendedorNombre: '',

  // ── Catálogo ──────────────────────────────────────────────
  setCatalogo: (productos) =>
    set({ catalogo: productos, catalogoCargado: true, cargandoCatalogo: false }),
  setCargandoCatalogo: (v) => set({ cargandoCatalogo: v }),
  setErrorCatalogo: (e) => set({ errorCatalogo: e, cargandoCatalogo: false }),

  // ── Líneas de venta ───────────────────────────────────────
  addLinea: (producto, cantidad = 1) => {
    const { lineas, descuento } = get();
    const existente = lineas.find((l) => l.producto.sku === producto.sku);
    let nuevasLineas: LineaVentaMostrador[];

    if (existente) {
      const nuevaCantidad = existente.cantidad + cantidad;
      nuevasLineas = lineas.map((l) =>
        l.id === existente.id
          ? { ...l, cantidad: nuevaCantidad, subtotal: nuevaCantidad * l.precioUnitario }
          : l
      );
    } else {
      const nuevaLinea: LineaVentaMostrador = {
        id: generarIdLinea(),
        producto,
        cantidad,
        precioUnitario: producto.precioDetal,
        subtotal: cantidad * producto.precioDetal,
      };
      nuevasLineas = [...lineas, nuevaLinea];
    }

    set({ lineas: nuevasLineas, totales: calcularTotales(nuevasLineas, descuento) });
  },

  removeLinea: (lineaId) => {
    const { lineas, descuento } = get();
    const nuevasLineas = lineas.filter((l) => l.id !== lineaId);
    set({ lineas: nuevasLineas, totales: calcularTotales(nuevasLineas, descuento) });
  },

  updateCantidad: (lineaId, cantidad) => {
    const { lineas, descuento } = get();
    if (cantidad <= 0) {
      const nuevasLineas = lineas.filter((l) => l.id !== lineaId);
      set({ lineas: nuevasLineas, totales: calcularTotales(nuevasLineas, descuento) });
      return;
    }
    const nuevasLineas = lineas.map((l) =>
      l.id === lineaId
        ? { ...l, cantidad, subtotal: cantidad * l.precioUnitario }
        : l
    );
    set({ lineas: nuevasLineas, totales: calcularTotales(nuevasLineas, descuento) });
  },

  setDescuento: (valor) => {
    const { lineas } = get();
    set({ descuento: valor, totales: calcularTotales(lineas, valor) });
  },

  limpiarVenta: () =>
    set({ lineas: [], descuento: 0, totales: calcularTotales([]), filaSeleccionada: -1, queryBusqueda: '', cantidadInput: 1 }),

  // ── UI ────────────────────────────────────────────────────
  setQueryBusqueda: (q) => set({ queryBusqueda: q }),
  setCantidadInput: (n) => set({ cantidadInput: n }),
  setFilaSeleccionada: (i) => set({ filaSeleccionada: i }),
  setCobrandoAbierto: (v) => set({ cobrandoAbierto: v }),

  // ── Preventas ─────────────────────────────────────────────
  emitirPreventa: () => {
    const { lineas, descuento, totales, vendedorId, vendedorNombre, clienteNombre } = get();
    if (lineas.length === 0) return null;

    const preventa: PreventaParkadaMostrador = {
      id: `prev-${Date.now()}`,
      codigo: generarCodigoPreventa(),
      lineas: [...lineas],
      totales,
      vendedorId,
      vendedorNombre,
      clienteNombre,
      creadoEn: new Date().toISOString(),
    };

    set((s) => ({
      preventasParkadas: [...s.preventasParkadas, preventa],
      lineas: [],
      descuento: 0,
      totales: calcularTotales([]),
      filaSeleccionada: -1,
      queryBusqueda: '',
      cantidadInput: 1,
    }));

    return preventa;
  },

  retomarPreventa: (id) => {
    const { preventasParkadas } = get();
    const preventa = preventasParkadas.find((p) => p.id === id);
    if (!preventa) return;
    set({
      lineas: [...preventa.lineas],
      descuento: preventa.totales.descuento,
      totales: preventa.totales,
      preventasParkadas: preventasParkadas.filter((p) => p.id !== id),
      clienteNombre: preventa.clienteNombre,
    });
  },

  descartarPreventa: (id) =>
    set((s) => ({ preventasParkadas: s.preventasParkadas.filter((p) => p.id !== id) })),

  // ── Sesión ────────────────────────────────────────────────
  setClienteNombre: (nombre) => set({ clienteNombre: nombre }),
  setVendedor: (id, nombre) => set({ vendedorId: id, vendedorNombre: nombre }),
}));

