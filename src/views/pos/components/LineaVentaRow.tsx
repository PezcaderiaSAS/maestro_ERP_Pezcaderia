import React from 'react';
import { Minus, Plus, X, Edit3 } from 'lucide-react';
import type { LineaVenta } from '../../../types/pos.types';
import { BalanzaButton } from './BalanzaButton';
import { Button } from '../../../components/ui/Button';
import Swal from 'sweetalert2';
interface LineaVentaRowProps {
  linea: LineaVenta;
  stockDisponible: number;
  precioFinalDisplay: number;
  lastClientPrice?: number;
  onUpdateCantidad: (productoId: string, cantidad: number) => void;
  onUpdateDescuentoLinea: (productoId: string, pct: number) => void;
  onRemove: (productoId: string) => void;
  onWeightRead: (productoId: string, peso: number) => void;
  onAplicarPrecioHistorico: (productoId: string, precio: number) => void;
  onResetPrecio: (productoId: string) => void;
  onUpdatePrecio?: (productoId: string, precio: number) => void;
  onResetItemPrice?: (productoId: string) => void;
  onOpenKeypad?: (linea: LineaVenta) => void;
}

export const LineaVentaRow: React.FC<LineaVentaRowProps> = ({
  linea,
  stockDisponible,
  precioFinalDisplay,
  lastClientPrice,
  onUpdateCantidad,
  onUpdateDescuentoLinea,
  onRemove,
  onWeightRead,
  onAplicarPrecioHistorico,
  onResetPrecio,
  onUpdatePrecio,
  onResetItemPrice,
  onOpenKeypad,
}) => {
  const isInsufficient = stockDisponible < linea.cantidad;
  const totalLinea = precioFinalDisplay * linea.cantidad;
  const tieneDescuentoLinea = linea.descuentoPct > 0;
  const isPrecioModificado =
    linea.precioModificadoOriginal !== undefined &&
    linea.precioModificadoOriginal !== linea.precioLista;

  const handleEditarPrecioClick = async () => {
    if (!onUpdatePrecio) return;

    const precioBaseActual = Math.round(linea.precioLista);

    const { value: nuevoPrecioStr, isConfirmed } = await Swal.fire({
      title: 'Modificar Precio de Venta',
      text: `Producto: ${linea.nombre}`,
      input: 'number',
      inputLabel: `Precio unitario por ${linea.unidad === 'KG' ? 'Kg' : 'Unidad'} ($ COP)`,
      inputValue: precioBaseActual.toString(),
      inputAttributes: {
        min: '0',
        step: 'any',
        inputmode: 'numeric',
        placeholder: 'Ej: 31000',
      },
      inputValidator: (value) => {
        if (!value || isNaN(Number(value))) {
          return 'Por favor ingresa un precio válido en pesos colombianos (COP)';
        }
        if (Number(value) <= 0) {
          return 'El precio de venta debe ser mayor a $0 COP';
        }
        return null;
      },
      showCancelButton: true,
      confirmButtonText: 'Guardar Precio',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#059669',
      cancelButtonColor: '#64748b',
    });

    if (!isConfirmed || !nuevoPrecioStr) return;

    const nuevoPrecio = Math.round(parseFloat(nuevoPrecioStr));
    if (isNaN(nuevoPrecio) || nuevoPrecio <= 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Precio inválido',
        text: 'Ingrese un valor numérico mayor a $0 COP.',
      });
      return;
    }

    // Validación de rentabilidad si precio < costo de compra
    if (linea.precioCompra > 0 && nuevoPrecio < linea.precioCompra) {
      const { isConfirmed: confirmaBajoCosto } = await Swal.fire({
        icon: 'warning',
        title: 'Rentabilidad Comprometida',
        html: `El precio ingresado (<strong>$${nuevoPrecio.toLocaleString('es-CO')} COP</strong>) es inferior al costo de compra (<strong>$${linea.precioCompra.toLocaleString('es-CO')} COP</strong>).<br/><br/>¿Desea aplicar este precio con margen negativo?`,
        showCancelButton: true,
        confirmButtonText: 'Sí, aplicar precio',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#d97706',
        cancelButtonColor: '#64748b',
      });

      if (!confirmaBajoCosto) return;
    }

    onUpdatePrecio(linea.productoId, nuevoPrecio);
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: `Precio actualizado: $${nuevoPrecio.toLocaleString('es-CO')} COP`,
      showConfirmButton: false,
      timer: 1500,
    });
  };

  const handleQtyDelta = (delta: number) => {
    const nuevaCantidad = Number(linea.cantidad) + delta;
    if (nuevaCantidad <= 0) {
      onRemove(linea.productoId);
    } else {
      onUpdateCantidad(linea.productoId, nuevaCantidad);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val) && val > 0) {
      onUpdateCantidad(linea.productoId, val);
    }
  };

  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (isNaN(val) || val <= 0) {
      onRemove(linea.productoId);
    } else {
      onUpdateCantidad(linea.productoId, val);
    }
  };

  const handleAplicarHistorico = () => {
    if (lastClientPrice !== undefined) {
      onAplicarPrecioHistorico(linea.productoId, lastClientPrice);
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: `Tarifa histórica aplicada: $${lastClientPrice.toLocaleString('es-CO')}`,
        showConfirmButton: false,
        timer: 1500,
      });
    }
  };

  return (
    <div
      data-testid={`cart-item-row-${linea.productoId}`}
      className="cart-item-row group relative flex items-center justify-between gap-1 sm:gap-2 px-2 py-1.5 border-b border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 hover:bg-slate-50/90 dark:hover:bg-slate-800/80 transition-colors rounded-lg min-h-[58px] max-h-[64px]"
    >
      {/* ── Columna Izquierda: Información de Producto y Precios Compactos ── */}
      <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
        {/* Fila 1: Nombre del Producto + Badges */}
        <div className="flex items-center gap-1.5 min-w-0">
          <span
            className="cart-item-name font-bold text-xs sm:text-sm text-slate-900 dark:text-white tracking-tight leading-tight truncate"
            title={linea.nombre}
            data-testid={`cart-item-name-${linea.productoId}`}
          >
            {linea.nombre}
          </span>

          {/* Badge distintivo de tipo de venta (Kilos vs Unidades) */}
          {linea.unidad === 'KG' ? (
            <span
              className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded text-[9px] font-bold bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800 shrink-0"
              title="Producto vendido por peso en Kilogramos"
            >
              ⚖️ KG
            </span>
          ) : (
            <span
              className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800 shrink-0"
              title="Producto vendido por Unidades enteras"
            >
              📦 UND
            </span>
          )}

          {linea.esPesoManual && (
            <span
              title="Peso ingresado manualmente (RN-13)"
              className="inline-flex items-center text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800 px-1 py-0.2 rounded shrink-0"
            >
              ⚖️ Manual
            </span>
          )}

          {tieneDescuentoLinea && (
            <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 shrink-0">
              -{linea.descuentoPct}%
            </span>
          )}
        </div>

        {/* Fila 2: Subtotal Prominente + Precio Unitario + Stock */}
        <div className="flex items-center gap-1.5 min-w-0 flex-nowrap overflow-hidden text-[10px]">
          {/* Subtotal / Total de línea */}
          <span
            className="cart-item-price font-mono font-black text-xs sm:text-sm tracking-tight tabular-nums text-emerald-600 dark:text-emerald-400 shrink-0"
            title={`Total de línea: $${totalLinea.toLocaleString('es-CO')}`}
            data-testid={`cart-item-price-${linea.productoId}`}
          >
            ${totalLinea.toLocaleString('es-CO')}
          </span>

          {/* Precio unitario editable */}
          <button
            type="button"
            data-testid="btn-editar-precio"
            onClick={handleEditarPrecioClick}
            title="Haga clic para editar el precio de venta unitario"
            className="group inline-flex items-center gap-0.5 font-mono tabular-nums text-[10px] font-semibold px-1 py-0.2 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 hover:bg-indigo-50 hover:border-indigo-300 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all cursor-pointer shadow-2xs shrink-0"
          >
            <span>(${precioFinalDisplay.toLocaleString('es-CO')} / {linea.unidad === 'KG' ? 'kg' : 'und'})</span>
            <Edit3 size={10} className="text-slate-400 group-hover:text-indigo-500" />
          </button>

          {/* Stock disponible */}
          <span
            className={`text-[9px] px-1 py-0.2 rounded font-semibold shrink-0 truncate max-w-[85px] ${
              isInsufficient
                ? 'bg-red-50 text-red-600 border border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800'
                : 'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
            }`}
            title={`Stock disponible: ${stockDisponible}`}
          >
            Stock: {stockDisponible} {linea.unidad === 'KG' ? 'kg' : 'und'} {isInsufficient && '⚠️'}
          </span>

          {isPrecioModificado && (
            <span
              className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 shrink-0"
              title={`Precio base de catálogo: $${linea.precioModificadoOriginal?.toLocaleString('es-CO')}`}
            >
              ✏️ Mod.
            </span>
          )}

          {isPrecioModificado && onResetItemPrice && (
            <button
              type="button"
              onClick={() => onResetItemPrice(linea.productoId)}
              className="text-[9px] text-amber-600 hover:text-amber-800 underline font-semibold cursor-pointer shrink-0"
              title="Restablecer al precio original de catálogo"
            >
              Reset
            </button>
          )}

          {lastClientPrice !== undefined && (
            <div className="flex items-center gap-1 shrink-0">
              {lastClientPrice === precioFinalDisplay ? (
                <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-100 text-emerald-800 font-bold border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800">
                  ✓ Histórico
                </span>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAplicarHistorico}
                  className="text-[9px] px-1 py-0.2 border-amber-300 bg-amber-50 text-amber-800 h-5 font-bold"
                >
                  💡 Hist: ${lastClientPrice.toLocaleString('es-CO')}
                </Button>
              )}
              {tieneDescuentoLinea && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onResetPrecio(linea.productoId)}
                  className="text-[9px] px-1 text-red-600 underline h-5"
                >
                  Reset
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Columna Derecha: Controles Táctiles y Numéricos Compactos (Opciones 1 y 2) ── */}
      <div className="cart-item-controls flex items-center gap-1 shrink-0 ml-1">
        {/* Botón balanza — solo para productos KG (RN-13) en formato compacto */}
        <BalanzaButton
          unidadMedida={linea.unidad}
          onWeightRead={(peso) => onWeightRead(linea.productoId, peso)}
          compact={true}
        />

        {/* Botón decrementar (-) 34-36px táctil */}
        <button
          type="button"
          data-testid="btn-disminuir-cantidad"
          className="qty-btn min-w-[34px] sm:min-w-[36px] min-h-[34px] sm:min-h-[36px] touch:min-w-[48px] touch:min-h-[48px] w-8 sm:w-9 h-8 sm:h-9 p-0 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 border border-slate-300 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 font-bold active:scale-95 transition-all cursor-pointer shadow-2xs"
          onClick={() => handleQtyDelta(-1)}
          title="Disminuir cantidad"
          aria-label="Disminuir cantidad"
        >
          <Minus size={15} className="stroke-[2.5]" />
        </button>

        {/* Input numérico directo inline con auto-foco y select-all al teclear (Opción 2) */}
        <input
          type="number"
          data-testid="input-cantidad"
          value={linea.cantidad}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onFocus={(e) => e.target.select()}
          onClick={(e) => (e.target as HTMLInputElement).select()}
          className="w-12 sm:w-14 h-8 sm:h-9 min-h-[34px] touch:min-h-[48px] text-center font-mono font-black text-xs sm:text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 rounded-lg outline-none tabular-nums shadow-2xs"
          step={linea.unidad === 'KG' ? 'any' : '1'}
          min={linea.unidad === 'KG' ? '0.001' : '1'}
          inputMode={linea.unidad === 'KG' ? 'decimal' : 'numeric'}
          title="Escriba directamente el peso/cantidad o use el teclado"
          aria-label={`Cantidad del producto en ${linea.unidad === 'KG' ? 'kilos' : 'unidades'}`}
        />

        {/* Botón incrementar (+) 34-36px táctil */}
        <button
          type="button"
          data-testid="btn-aumentar-cantidad"
          className="qty-btn min-w-[34px] sm:min-w-[36px] min-h-[34px] sm:min-h-[36px] touch:min-w-[48px] touch:min-h-[48px] w-8 sm:w-9 h-8 sm:h-9 p-0 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 border border-slate-300 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 font-bold active:scale-95 transition-all cursor-pointer shadow-2xs"
          onClick={() => handleQtyDelta(1)}
          title="Aumentar cantidad"
          aria-label="Aumentar cantidad"
        >
          <Plus size={15} className="stroke-[2.5]" />
        </button>

        {/* Botón eliminar 34-36px táctil */}
        <button
          type="button"
          data-testid="btn-eliminar-linea"
          className="delete-cart-item-btn min-w-[34px] sm:min-w-[36px] min-h-[34px] sm:min-h-[36px] touch:min-w-[48px] touch:min-h-[48px] w-8 sm:w-9 h-8 sm:h-9 p-0 flex items-center justify-center rounded-lg bg-rose-50 hover:bg-rose-100 active:bg-rose-200 text-rose-600 border border-rose-200 dark:bg-rose-950/40 dark:border-rose-900/60 dark:text-rose-400 font-bold active:scale-95 transition-all cursor-pointer shadow-2xs shrink-0"
          onClick={() => onRemove(linea.productoId)}
          title="Eliminar producto del carrito"
          aria-label="Eliminar producto del carrito"
        >
          <X size={16} className="stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
};
