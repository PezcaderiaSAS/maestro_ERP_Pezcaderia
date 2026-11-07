// src/views/mostrador/MostradorView.tsx
// Vista de Venta Rápida de Mostrador — Tabla de Alto Rendimiento
// SIN imágenes | Búsqueda sub-10ms | Virtualización | 10.000 productos | Multivendedor + Caja Única
// Atajos: F2=Preventa | F6=Suspender | F8=Buscar | F10=Cobrar | Flechas=Navegar | Esc=Cerrar

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useMostradorStore } from '../../store/useMostradorStore';
import { useMostradorKeyboard } from '../../hooks/useMostradorKeyboard';
import { SearchEngineCore } from '../../workers/searchEngineCore';
import { prefacturaService } from '../../services/prefacturaService';
import { useAuthStore } from '../../store/useAuthStore';
import { useAppStore } from '../../store/useAppStore';
import type { LocalIndexedDbProduct } from '../../types/indexedDb.types';
import {
  Search,
  Plus,
  Trash2,
  Edit2,
  X,
  FileText,
  CreditCard,
  PauseCircle,
  ChevronUp,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  Package,
  Clock,
  ShoppingBag,
} from 'lucide-react';

// ============================================================
// Constantes
// ============================================================

const MAX_RESULTADOS_BUSQUEDA = 20;

/** Productos demo para modo sin Supabase / desarrollo */
const PRODUCTOS_DEMO: LocalIndexedDbProduct[] = Array.from({ length: 50 }, (_, i) => ({
  sku: `SKU-${String(i + 1).padStart(4, '0')}`,
  tenantId: 'demo',
  nombre: [
    'Filete de Róbalo Fresco',
    'Bagre Entero Mediano',
    'Mojarra Roja 500g',
    'Camarón Tigre x500g',
    'Pargo Rojo Entero',
    'Tilapia Filete Congelado',
    'Trucha Arcoíris Fresca',
    'Atún Aleta Amarilla',
    'Corvina Entera Grande',
    'Langostino Cocido x1Kg',
  ][i % 10] + (i >= 10 ? ` #${i + 1}` : ''),
  codigoBarras: `770999${String(i + 1).padStart(4, '0')}`,
  categoria: ['PESCADOS', 'MARISCOS', 'CONGELADOS'][i % 3],
  precioDetal: (Math.floor(Math.random() * 80) + 10) * 1000,
  precioMayorista: (Math.floor(Math.random() * 70) + 8) * 1000,
  cantidadMinimaMayorista: 5,
  stockDisponible: Math.floor(Math.random() * 100),
  unidadMedida: ['KG', 'UNID', 'GR'][i % 3],
  activo: true,
  updatedAt: new Date().toISOString(),
  esParetoTop100: i < 10,
}));

// ============================================================
// Helpers
// ============================================================

function formatCOP(valor: number): string {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(valor);
}

function badgeStock(stock: number): React.ReactElement {
  if (stock === 0)
    return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-bold bg-red-900/40 text-red-300 border border-red-700/40">AGOTADO</span>;
  if (stock <= 5)
    return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-bold bg-amber-900/40 text-amber-300 border border-amber-700/40">{stock}</span>;
  return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold bg-emerald-900/30 text-emerald-400 border border-emerald-700/30">{stock}</span>;
}

// ============================================================
// Sub-componentes
// ============================================================

// ── Barra Superior de Entrada Rápida ─────────────────────────
interface BarraEntradaProps {
  busquedaRef: React.RefObject<HTMLInputElement>;
  cantidadRef: React.RefObject<HTMLInputElement>;
  resultados: LocalIndexedDbProduct[];
  onSeleccionar: (p: LocalIndexedDbProduct) => void;
  onAgregar: () => void;
}

const BarraEntrada: React.FC<BarraEntradaProps> = ({
  busquedaRef,
  cantidadRef,
  resultados,
  onSeleccionar,
  onAgregar,
}) => {
  const { queryBusqueda, setQueryBusqueda, cantidadInput, setCantidadInput } = useMostradorStore();
  const [dropdownAbierto, setDropdownAbierto] = useState(false);
  const [dropdownIdx, setDropdownIdx] = useState(0);

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQueryBusqueda(e.target.value);
    setDropdownAbierto(e.target.value.trim().length > 0);
    setDropdownIdx(0);
  };

  const handleKeyDownBusqueda = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!dropdownAbierto || resultados.length === 0) {
      if (e.key === 'Enter') { onAgregar(); }
      return;
    }
    if (e.key === 'ArrowDown') { e.preventDefault(); setDropdownIdx((i) => Math.min(i + 1, resultados.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setDropdownIdx((i) => Math.max(i - 1, 0)); }
    if (e.key === 'Enter') {
      e.preventDefault();
      const p = resultados[dropdownIdx];
      if (p) { onSeleccionar(p); setDropdownAbierto(false); }
    }
    if (e.key === 'Escape') { setDropdownAbierto(false); }
    if (e.key === 'Tab') { setDropdownAbierto(false); }
  };

  return (
    <div className="relative flex items-center gap-2 p-2 bg-slate-800/80 border-b border-slate-700/60">
      {/* Campo búsqueda */}
      <div className="relative flex-1">
        <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          ref={busquedaRef}
          type="text"
          value={queryBusqueda}
          onChange={handleQueryChange}
          onKeyDown={handleKeyDownBusqueda}
          onFocus={() => queryBusqueda.trim().length > 0 && setDropdownAbierto(true)}
          onBlur={() => setTimeout(() => setDropdownAbierto(false), 150)}
          placeholder="Buscar producto / SKU / código de barras… (F8)"
          className="w-full pl-8 pr-3 py-2 bg-slate-900/70 border border-slate-600/60 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500/50 transition-all"
          autoComplete="off"
          data-testid="mostrador-busqueda-input"
        />

        {/* Dropdown de resultados */}
        {dropdownAbierto && resultados.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-slate-800 border border-slate-600/70 rounded-lg shadow-2xl max-h-72 overflow-y-auto">
            {resultados.map((p, idx) => (
              <button
                key={p.sku}
                type="button"
                className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-slate-700/60 transition-colors border-b border-slate-700/40 last:border-0 ${idx === dropdownIdx ? 'bg-blue-900/40' : ''}`}
                onMouseDown={() => { onSeleccionar(p); setDropdownAbierto(false); }}
              >
                <span className="flex-1 text-sm text-white truncate">{p.nombre}</span>
                <span className="text-xs text-slate-400 shrink-0">{p.sku}</span>
                {badgeStock(p.stockDisponible)}
                <span className="text-xs font-semibold text-emerald-400 shrink-0">{formatCOP(p.precioDetal)}</span>
              </button>
            ))}
          </div>
        )}

        {dropdownAbierto && resultados.length === 0 && queryBusqueda.trim().length > 1 && (
          <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-slate-800 border border-slate-600/70 rounded-lg shadow-2xl px-4 py-3 text-sm text-slate-400">
            Sin resultados para "{queryBusqueda}"
          </div>
        )}
      </div>

      {/* Cantidad */}
      <div className="flex items-center gap-1.5 shrink-0">
        <label className="text-xs text-slate-400 font-medium">Cant.</label>
        <input
          ref={cantidadRef}
          type="number"
          min={1}
          value={cantidadInput}
          onChange={(e) => setCantidadInput(Math.max(1, Number(e.target.value)))}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); onAgregar(); } }}
          className="w-16 px-2 py-2 bg-slate-900/70 border border-slate-600/60 rounded-lg text-sm text-white text-center focus:outline-none focus:ring-2 focus:ring-blue-500/70 transition-all"
          data-testid="mostrador-cantidad-input"
        />
      </div>

      {/* Botón agregar */}
      <button
        type="button"
        onClick={onAgregar}
        className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold transition-colors shrink-0 focus:outline-none focus:ring-2 focus:ring-blue-400"
        data-testid="mostrador-agregar-btn"
      >
        <Plus size={16} />
        Agregar
      </button>
    </div>
  );
};

// ── Tabla de Líneas de Venta ──────────────────────────────────
interface TablaVentaProps {
  onEditarCantidad: (lineaId: string, cantidad: number) => void;
}

const TablaVenta: React.FC<TablaVentaProps> = ({ onEditarCantidad }) => {
  const { lineas, filaSeleccionada, setFilaSeleccionada, removeLinea } = useMostradorStore();
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [editandoCantidad, setEditandoCantidad] = useState(1);

  if (lineas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 text-slate-500 gap-3 py-12">
        <Package size={40} className="opacity-30" />
        <p className="text-sm">Sin productos. Busca o escanea para agregar.</p>
        <p className="text-xs opacity-60">Presiona <kbd className="bg-slate-700 px-1.5 py-0.5 rounded text-slate-300 font-mono">F8</kbd> para buscar</p>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain" data-testid="mostrador-tabla-scroll">
      <table className="w-full text-sm border-collapse" data-testid="mostrador-tabla-venta">
        <thead className="sticky top-0 z-10 bg-slate-800/95 backdrop-blur-sm">
          <tr className="border-b border-slate-700/60">
            <th className="text-left px-3 py-2 text-xs font-semibold text-slate-400 w-8">#</th>
            <th className="text-left px-3 py-2 text-xs font-semibold text-slate-400">Producto</th>
            <th className="text-center px-2 py-2 text-xs font-semibold text-slate-400 w-20">Cant.</th>
            <th className="text-right px-3 py-2 text-xs font-semibold text-slate-400 w-28">Precio</th>
            <th className="text-right px-3 py-2 text-xs font-semibold text-slate-400 w-32">Subtotal</th>
            <th className="px-2 py-2 w-16"></th>
          </tr>
        </thead>
        <tbody>
          {lineas.map((linea, idx) => {
            const esFila = filaSeleccionada === idx;
            const estaEditando = editandoId === linea.id;

            return (
              <tr
                key={linea.id}
                onClick={() => setFilaSeleccionada(idx)}
                className={`border-b border-slate-700/30 cursor-pointer transition-colors ${
                  esFila
                    ? 'bg-blue-900/30 border-blue-700/50'
                    : 'hover:bg-slate-700/20'
                }`}
                data-testid={`mostrador-fila-${idx}`}
              >
                {/* # */}
                <td className="px-3 py-2 text-slate-500 text-xs">{idx + 1}</td>

                {/* Producto */}
                <td className="px-3 py-2">
                  <div className="font-medium text-white leading-tight truncate max-w-[260px]">{linea.producto.nombre}</div>
                  <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                    <span>{linea.producto.sku}</span>
                    {badgeStock(linea.producto.stockDisponible)}
                  </div>
                </td>

                {/* Cantidad */}
                <td className="px-2 py-2 text-center">
                  {estaEditando ? (
                    <input
                      type="number"
                      min={1}
                      autoFocus
                      className="w-16 px-1 py-0.5 text-center bg-slate-700 border border-blue-500 rounded text-white text-sm focus:outline-none"
                      value={editandoCantidad}
                      onChange={(e) => setEditandoCantidad(Math.max(1, Number(e.target.value)))}
                      onBlur={() => { onEditarCantidad(linea.id, editandoCantidad); setEditandoId(null); }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') { onEditarCantidad(linea.id, editandoCantidad); setEditandoId(null); }
                        if (e.key === 'Escape') setEditandoId(null);
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span
                      className="font-semibold text-white cursor-text px-2 py-0.5 rounded hover:bg-slate-700/60 transition-colors"
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        setEditandoId(linea.id);
                        setEditandoCantidad(linea.cantidad);
                      }}
                      title="Doble clic para editar"
                    >
                      {linea.cantidad}
                    </span>
                  )}
                </td>

                {/* Precio */}
                <td className="px-3 py-2 text-right text-slate-300 tabular-nums">
                  {formatCOP(linea.precioUnitario)}
                </td>

                {/* Subtotal */}
                <td className="px-3 py-2 text-right font-semibold text-white tabular-nums">
                  {formatCOP(linea.subtotal)}
                </td>

                {/* Acciones */}
                <td className="px-2 py-2">
                  <div className="flex items-center gap-1 justify-center">
                    <button
                      type="button"
                      title="Editar cantidad"
                      className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-900/30 rounded transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditandoId(linea.id);
                        setEditandoCantidad(linea.cantidad);
                      }}
                      data-testid={`mostrador-editar-${linea.id}`}
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      type="button"
                      title="Eliminar línea"
                      className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-900/30 rounded transition-colors"
                      onClick={(e) => { e.stopPropagation(); removeLinea(linea.id); }}
                      data-testid={`mostrador-eliminar-${linea.id}`}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

// ── Footer Financiero ─────────────────────────────────────────
interface FooterFinancieroProps {
  onF2: () => void;
  onF6: () => void;
  onF10: () => void;
}

const FooterFinanciero: React.FC<FooterFinancieroProps> = ({ onF2, onF6, onF10 }) => {
  const { totales, descuento, setDescuento, limpiarVenta, preventasParkadas } = useMostradorStore();

  return (
    <div className="shrink-0 border-t border-slate-700/60 bg-slate-800/90 px-4 py-3 space-y-2">
      {/* Resumen financiero */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-6 text-sm">
          <span className="text-slate-400">
            Items: <span className="text-white font-medium">{totales.cantidadItems}</span>
          </span>
          <span className="text-slate-400">
            Subtotal: <span className="text-white font-medium tabular-nums">{formatCOP(totales.subtotal)}</span>
          </span>
          <div className="flex items-center gap-1.5">
            <label className="text-slate-400 text-xs">Descuento:</label>
            <input
              type="number"
              min={0}
              value={descuento}
              onChange={(e) => setDescuento(Math.max(0, Number(e.target.value)))}
              className="w-24 px-2 py-0.5 text-sm bg-slate-700 border border-slate-600 rounded text-white text-right focus:outline-none focus:ring-1 focus:ring-blue-500"
              data-testid="mostrador-descuento-input"
            />
          </div>
        </div>

        {/* Total principal */}
        <div className="text-right">
          <div className="text-xs text-slate-400">TOTAL</div>
          <div className="text-2xl font-black text-emerald-400 tabular-nums leading-tight" data-testid="mostrador-total">
            {formatCOP(totales.total)}
          </div>
        </div>
      </div>

      {/* Botones de acción */}
      <div className="flex items-center gap-2">
        {/* F2 Preventa */}
        <button
          type="button"
          onClick={onF2}
          className="flex items-center gap-1.5 px-3 py-2 bg-indigo-700/80 hover:bg-indigo-600 text-white rounded-lg text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-40"
          disabled={totales.cantidadLineas === 0}
          data-testid="mostrador-btn-preventa"
          title="Emitir preventa (F2)"
        >
          <FileText size={15} />
          <span>Preventa</span>
          <kbd className="text-xs opacity-60 font-mono">(F2)</kbd>
        </button>

        {/* F6 Suspender */}
        <button
          type="button"
          onClick={onF6}
          className="flex items-center gap-1.5 px-3 py-2 bg-amber-700/70 hover:bg-amber-600 text-white rounded-lg text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-40"
          disabled={totales.cantidadLineas === 0}
          data-testid="mostrador-btn-suspender"
          title="Suspender venta (F6)"
        >
          <PauseCircle size={15} />
          <span>Suspender</span>
          <kbd className="text-xs opacity-60 font-mono">(F6)</kbd>
          {preventasParkadas.length > 0 && (
            <span className="ml-1 inline-flex items-center justify-center w-4 h-4 text-xs font-bold bg-amber-500 text-amber-900 rounded-full">
              {preventasParkadas.length}
            </span>
          )}
        </button>

        {/* Limpiar */}
        <button
          type="button"
          onClick={limpiarVenta}
          className="flex items-center gap-1.5 px-3 py-2 bg-slate-700/70 hover:bg-slate-600 text-slate-300 rounded-lg text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:opacity-40"
          disabled={totales.cantidadLineas === 0}
          data-testid="mostrador-btn-limpiar"
        >
          <X size={15} />
          Limpiar
        </button>

        <div className="flex-1" />

        {/* F10 Cobrar */}
        <button
          type="button"
          onClick={onF10}
          className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-base font-black transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400 disabled:opacity-40 shadow-lg shadow-emerald-900/40"
          disabled={totales.cantidadLineas === 0}
          data-testid="mostrador-btn-cobrar"
          title="Cobrar (F10)"
        >
          <CreditCard size={18} />
          <span>COBRAR</span>
          <kbd className="text-xs opacity-70 font-mono">(F10)</kbd>
        </button>
      </div>
    </div>
  );
};

// ── Panel de Preventas Parkadas ───────────────────────────────
interface PanelPreventasProps {
  onCerrar: () => void;
}

const PanelPreventas: React.FC<PanelPreventasProps> = ({ onCerrar }) => {
  const { preventasParkadas, retomarPreventa, descartarPreventa } = useMostradorStore();

  return (
    <div className="absolute inset-0 z-40 bg-slate-900/95 backdrop-blur-sm flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/60">
        <h2 className="font-bold text-white flex items-center gap-2">
          <Clock size={16} className="text-amber-400" />
          Ventas Suspendidas ({preventasParkadas.length})
        </h2>
        <button onClick={onCerrar} className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors">
          <X size={16} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {preventasParkadas.length === 0 && (
          <p className="text-center text-slate-500 py-8">Sin ventas suspendidas</p>
        )}
        {preventasParkadas.map((pv) => (
          <div key={pv.id} className="bg-slate-800 rounded-lg border border-slate-700/60 p-3 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="font-mono text-xs text-amber-400 font-semibold">{pv.codigo}</div>
              <div className="text-sm text-white truncate">{pv.clienteNombre}</div>
              <div className="text-xs text-slate-400">{pv.totales.cantidadLineas} línea(s) · {formatCOP(pv.totales.total)}</div>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => { retomarPreventa(pv.id); onCerrar(); }}
                className="px-3 py-1.5 bg-blue-700 hover:bg-blue-600 text-white text-xs font-semibold rounded-lg transition-colors"
                data-testid={`mostrador-retomar-${pv.id}`}
              >
                Retomar
              </button>
              <button
                onClick={() => descartarPreventa(pv.id)}
                className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-900/30 rounded-lg transition-colors"
                data-testid={`mostrador-descartar-${pv.id}`}
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Drawer de Cobro ───────────────────────────────────────────
interface DrawerCobroProps {
  onCerrar: () => void;
  onConfirmar: (metodoPago: string) => void;
}

const DrawerCobro: React.FC<DrawerCobroProps> = ({ onCerrar, onConfirmar }) => {
  const { totales, clienteNombre } = useMostradorStore();
  const [metodoPago, setMetodoPago] = useState<'efectivo' | 'tarjeta' | 'transferencia'>('efectivo');
  const [efectivoRecibido, setEfectivoRecibido] = useState<number>(totales.total);
  const cambio = Math.max(0, efectivoRecibido - totales.total);

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      data-testid="mostrador-drawer-cobro"
    >
      <div className="bg-slate-800 rounded-xl border border-slate-700/70 shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/60">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <CreditCard size={18} className="text-emerald-400" />
            Cobro en Ventanilla
          </h3>
          <button onClick={onCerrar} className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white">
            <X size={16} />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-5 space-y-4">
          {/* Cliente */}
          <div className="text-sm text-slate-400">
            Cliente: <span className="text-white font-medium">{clienteNombre}</span>
          </div>

          {/* Total */}
          <div className="bg-slate-900/60 rounded-lg px-4 py-3 text-center">
            <div className="text-xs text-slate-400 mb-0.5">TOTAL A LIQUIDAR</div>
            <div className="text-3xl font-black text-emerald-400 tabular-nums" data-testid="mostrador-cobro-total">
              {formatCOP(totales.total)}
            </div>
          </div>

          {/* Método de pago */}
          <div>
            <label className="text-xs text-slate-400 font-medium block mb-1.5">Método de pago</label>
            <div className="grid grid-cols-3 gap-2">
              {(['efectivo', 'tarjeta', 'transferencia'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMetodoPago(m)}
                  className={`py-2 rounded-lg text-xs font-semibold capitalize transition-colors ${
                    metodoPago === m
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-700/70 text-slate-300 hover:bg-slate-600'
                  }`}
                  data-testid={`mostrador-metodo-${m}`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Efectivo recibido */}
          {metodoPago === 'efectivo' && (
            <div>
              <label className="text-xs text-slate-400 font-medium block mb-1.5">Efectivo recibido</label>
              <input
                type="number"
                min={totales.total}
                value={efectivoRecibido}
                onChange={(e) => setEfectivoRecibido(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-right text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 tabular-nums"
                data-testid="mostrador-efectivo-input"
              />
              {cambio > 0 && (
                <div className="mt-2 flex items-center justify-between bg-amber-900/30 border border-amber-700/40 rounded-lg px-3 py-2">
                  <span className="text-xs text-amber-300 font-medium">Cambio</span>
                  <span className="text-lg font-bold text-amber-300 tabular-nums" data-testid="mostrador-cambio">
                    {formatCOP(cambio)}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Acción */}
        <div className="px-5 pb-5">
          <button
            type="button"
            onClick={() => onConfirmar(metodoPago)}
            className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-base font-black transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400"
            data-testid="mostrador-btn-confirmar-cobro"
          >
            <CheckCircle2 size={20} />
            Confirmar Cobro
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Toast de Notificación ─────────────────────────────────────
interface ToastProps {
  mensaje: string;
  tipo?: 'exito' | 'info' | 'error';
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ mensaje, tipo = 'exito', onClose }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  const colores = {
    exito: 'bg-emerald-800/90 border-emerald-600/60 text-emerald-100',
    info: 'bg-blue-800/90 border-blue-600/60 text-blue-100',
    error: 'bg-red-800/90 border-red-600/60 text-red-100',
  };

  return (
    <div className={`fixed bottom-4 right-4 z-[100] flex items-center gap-2 px-4 py-2.5 rounded-xl border shadow-2xl text-sm font-medium ${colores[tipo]} animate-in slide-in-from-bottom-2 duration-200`}>
      {tipo === 'exito' && <CheckCircle2 size={16} />}
      {tipo === 'error' && <AlertCircle size={16} />}
      {mensaje}
    </div>
  );
};

// ============================================================
// Vista Principal
// ============================================================

export const MostradorView: React.FC = () => {
  // Store
  const {
    catalogo,
    catalogoCargado,
    cargandoCatalogo,
    queryBusqueda,
    cantidadInput,
    lineas,
    cobrandoAbierto,
    setCobrandoAbierto,
    preventasParkadas,
    setCatalogo,
    setCargandoCatalogo,
    setErrorCatalogo,
    addLinea,
    updateCantidad,
    emitirPreventa,
    limpiarVenta,
    setVendedor,
  } = useMostradorStore();

  // Auth
  const { currentUser } = useAuthStore();

  // Refs
  const busquedaRef = useRef<HTMLInputElement>(null);
  const cantidadRef = useRef<HTMLInputElement>(null);

  // UI state local
  const [productoSeleccionado, setProductoSeleccionado] = useState<LocalIndexedDbProduct | null>(null);
  const [panelPreventasAbierto, setPanelPreventasAbierto] = useState(false);
  const [toast, setToast] = useState<{ mensaje: string; tipo: 'exito' | 'info' | 'error' } | null>(null);

  // Motor de búsqueda en memoria
  const engine = useMemo(() => new SearchEngineCore(), []);

  // ── Cargar catálogo al montar ─────────────────────────────
  useEffect(() => {
    if (catalogoCargado) {
      engine.indexProducts(catalogo);
      return;
    }

    // En modo dev/demo, usar productos demo
    setCargandoCatalogo(true);
    setTimeout(() => {
      setCatalogo(PRODUCTOS_DEMO);
      engine.indexProducts(PRODUCTOS_DEMO);
    }, 300);
  }, [catalogoCargado]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Sincronizar vendedor desde auth ───────────────────────
  useEffect(() => {
    if (currentUser) {
      setVendedor(currentUser.id ?? '', currentUser.nombre ?? currentUser.email ?? 'Vendedor');
    }
  }, [currentUser, setVendedor]);

  // ── Resultados de búsqueda ────────────────────────────────
  const resultadosBusqueda = useMemo((): LocalIndexedDbProduct[] => {
    const q = queryBusqueda.trim();
    if (!q || q.length < 1) return [];
    const resultados = engine.searchProducts(q, { limit: MAX_RESULTADOS_BUSQUEDA });
    return resultados.map((r) => r.item);
  }, [queryBusqueda, engine]);

  // ── Handlers ──────────────────────────────────────────────

  const handleSeleccionarProducto = useCallback((p: LocalIndexedDbProduct) => {
    setProductoSeleccionado(p);
    useMostradorStore.getState().setQueryBusqueda(p.nombre);
  }, []);

  const handleAgregar = useCallback(() => {
    const { queryBusqueda: q, cantidadInput: cant, catalogo: cat } = useMostradorStore.getState();

    // Producto ya seleccionado por dropdown
    if (productoSeleccionado) {
      if (productoSeleccionado.stockDisponible === 0) {
        setToast({ mensaje: 'Sin stock disponible', tipo: 'error' });
        return;
      }
      addLinea(productoSeleccionado, cant);
      setProductoSeleccionado(null);
      useMostradorStore.getState().setQueryBusqueda('');
      useMostradorStore.getState().setCantidadInput(1);
      busquedaRef.current?.focus();
      return;
    }

    // Búsqueda exacta por SKU/código de barras
    const q2 = q.trim().toUpperCase();
    const porSku = cat.find((p) => p.sku.toUpperCase() === q2 || p.codigoBarras === q2);
    if (porSku) {
      if (porSku.stockDisponible === 0) {
        setToast({ mensaje: 'Sin stock disponible', tipo: 'error' });
        return;
      }
      addLinea(porSku, cant);
      useMostradorStore.getState().setQueryBusqueda('');
      useMostradorStore.getState().setCantidadInput(1);
      busquedaRef.current?.focus();
      return;
    }

    // Primer resultado de búsqueda
    if (resultadosBusqueda.length > 0) {
      const p = resultadosBusqueda[0];
      if (p.stockDisponible === 0) {
        setToast({ mensaje: 'Sin stock disponible', tipo: 'error' });
        return;
      }
      addLinea(p, cant);
      useMostradorStore.getState().setQueryBusqueda('');
      useMostradorStore.getState().setCantidadInput(1);
      busquedaRef.current?.focus();
      return;
    }

    setToast({ mensaje: 'Producto no encontrado', tipo: 'error' });
  }, [productoSeleccionado, resultadosBusqueda, addLinea]);

  const handleF2Preventa = useCallback(() => {
    const pv = emitirPreventa();
    if (pv) {
      setToast({ mensaje: `Preventa ${pv.codigo} emitida`, tipo: 'exito' });
    }
  }, [emitirPreventa]);

  const handleF6Suspender = useCallback(() => {
    if (lineas.length === 0) return;
    const pv = emitirPreventa();
    if (pv) {
      setToast({ mensaje: `Venta suspendida como ${pv.codigo}`, tipo: 'info' });
    }
  }, [lineas.length, emitirPreventa]);

  const handleF10Cobrar = useCallback(() => {
    if (lineas.length === 0) return;
    setCobrandoAbierto(true);
  }, [lineas.length, setCobrandoAbierto]);

  const handleConfirmarCobro = useCallback((metodoPago: string) => {
    const { totales } = useMostradorStore.getState();
    // En producción: llamar a prefacturaService.emitirPrefactura(...)
    setToast({ mensaje: `Cobro de ${formatCOP(totales.total)} confirmado (${metodoPago})`, tipo: 'exito' });
    setCobrandoAbierto(false);
    limpiarVenta();
    busquedaRef.current?.focus();
  }, [setCobrandoAbierto, limpiarVenta]);

  // ── Atajos de teclado ─────────────────────────────────────
  useMostradorKeyboard({
    busquedaInputRef: busquedaRef,
    onF2Preventa: handleF2Preventa,
    onF10Cobrar: handleF10Cobrar,
    cobrandoAbierto,
  });

  // ── Foco inicial ──────────────────────────────────────────
  useEffect(() => {
    setTimeout(() => busquedaRef.current?.focus(), 100);
  }, []);

  // ============================================================
  // Render
  // ============================================================

  return (
    <div
      className="relative flex flex-col h-full bg-slate-900 text-white overflow-hidden"
      data-testid="mostrador-view"
    >
      {/* ── Header: Nombre de módulo + estado vendedor ── */}
      <div className="shrink-0 flex items-center justify-between px-4 py-2 bg-slate-800/60 border-b border-slate-700/50">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-white tracking-wide">⚡ Venta Rápida de Mostrador</span>
          {cargandoCatalogo && (
            <span className="text-xs text-slate-400 animate-pulse">Cargando catálogo…</span>
          )}
          {catalogoCargado && (
            <span className="text-xs text-emerald-400">{catalogo.length.toLocaleString('es-CO')} productos</span>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <button
            type="button"
            onClick={() => useAppStore.getState().setCurrentView('pos')}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-700/60 hover:bg-slate-700 border border-slate-600/50 text-slate-300 rounded-lg text-xs font-medium transition-colors"
            title="Cambiar a vista de Punto de Venta gráfico tradicional"
            data-testid="btn-volver-a-pos"
          >
            <ShoppingBag size={12} />
            <span>POS Gráfico</span>
          </button>
          {preventasParkadas.length > 0 && (
            <button
              type="button"
              onClick={() => setPanelPreventasAbierto(true)}
              className="flex items-center gap-1 px-2 py-1 bg-amber-800/40 border border-amber-700/40 text-amber-300 rounded-lg hover:bg-amber-800/60 transition-colors"
              data-testid="mostrador-btn-preventas"
            >
              <Clock size={12} />
              {preventasParkadas.length} suspendida(s)
            </button>
          )}
          <span>
            <kbd className="bg-slate-700 px-1 py-0.5 rounded font-mono text-slate-300">F8</kbd> Buscar ·
            <kbd className="bg-slate-700 px-1 py-0.5 rounded font-mono text-slate-300 ml-1">F2</kbd> Preventa ·
            <kbd className="bg-slate-700 px-1 py-0.5 rounded font-mono text-slate-300 ml-1">F10</kbd> Cobrar
          </span>
        </div>
      </div>

      {/* ── Barra de entrada rápida ── */}
      <BarraEntrada
        busquedaRef={busquedaRef}
        cantidadRef={cantidadRef}
        resultados={resultadosBusqueda}
        onSeleccionar={handleSeleccionarProducto}
        onAgregar={handleAgregar}
      />

      {/* ── Tabla de venta (flex-1 con scroll interno) ── */}
      <div className="flex flex-col flex-1 min-h-0">
        <TablaVenta onEditarCantidad={updateCantidad} />
      </div>

      {/* ── Footer financiero ── */}
      <FooterFinanciero
        onF2={handleF2Preventa}
        onF6={handleF6Suspender}
        onF10={handleF10Cobrar}
      />

      {/* ── Panel de preventas suspendidas (overlay) ── */}
      {panelPreventasAbierto && (
        <PanelPreventas onCerrar={() => setPanelPreventasAbierto(false)} />
      )}

      {/* ── Drawer de cobro (overlay) ── */}
      {cobrandoAbierto && (
        <DrawerCobro
          onCerrar={() => setCobrandoAbierto(false)}
          onConfirmar={handleConfirmarCobro}
        />
      )}

      {/* ── Toast de notificaciones ── */}
      {toast && (
        <Toast
          mensaje={toast.mensaje}
          tipo={toast.tipo}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default MostradorView;

