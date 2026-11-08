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
      className="cart-item-row group relative flex flex-col justify-between gap-1.5 p-2 sm:p-2.5 border-b border-slate-700/60 bg-slate-800/40 hover:bg-slate-800/70 transition-colors rounded-xl min-h-[58px] max-h-[64px] sm:max-h-[85px] overflow-hidden"
    >
      {/* ── Tier 1: Información de Producto, Badges y Botón Eliminar ── */}
      <div className="flex items-center justify-between gap-2 min-w-0">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <span
            className="cart-item-name font-bold text-xs sm:text-sm text-slate-100 tracking-tight leading-snug truncate"
            title={linea.nombre}
            data-testid={`cart-item-name-${linea.productoId}`}
          >
            {linea.nombre}
          </span>

          {/* Badge distintivo de tipo de venta (Kilos vs Unidades) */}
          {linea.unidad === 'KG' ? (
            <span
              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-950/70 text-sky-300 border border-sky-500/30 shrink-0"
              title="Producto vendido por peso en Kilogramos"
            >
              ⚖️ KG
            </span>
          ) : (
            <span
              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-950/70 text-emerald-300 border border-emerald-500/30 shrink-0"
              title="Producto vendido por Unidades enteras"
            >
              📦 UND
            </span>
          )}

          {linea.esPesoManual && (
            <span
              title="Peso ingresado manualmente (RN-13)"
              className="inline-flex items-center text-[9px] font-bold bg-amber-950/50 text-amber-300 border border-amber-800/50 px-1 py-0.5 rounded shrink-0"
            >
              ⚖️ Manual
            </span>
          )}

          {tieneDescuentoLinea && (
            <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-emerald-950/50 text-emerald-300 border border-emerald-800/50 shrink-0">
              -{linea.descuentoPct}%
            </span>
          )}
        </div>

        {/* Botón eliminar 48px táctil */}
        <button
          type="button"
          data-testid="btn-eliminar-linea"
          className="delete-cart-item-btn min-w-[48px] min-h-[48px] w-12 h-12 p-0 flex items-center justify-center rounded-lg bg-rose-950/40 hover:bg-rose-900/60 active:bg-rose-800/60 text-rose-300 border border-rose-800/50 font-bold active:scale-95 transition-all cursor-pointer shadow-xs shrink-0"
          onClick={() => onRemove(linea.productoId)}
          title="Eliminar producto del carrito"
          aria-label="Eliminar producto del carrito"
        >
          <X size={18} className="stroke-[2.5]" />
        </button>
      </div>

      {/* ── Tier 2: Stepper Táctil + Balanza + Precio Unitario Editable + Subtotal Prominente ── */}
      <div className="flex items-center justify-between gap-1 sm:gap-2 min-w-0 flex-wrap">
        {/* Controles Stepper y Balanza */}
        <div className="cart-item-controls flex items-center gap-1 shrink-0">
          {/* Botón balanza — solo para productos KG (RN-13) */}
          <BalanzaButton
            unidadMedida={linea.unidad}
            onWeightRead={(peso) => onWeightRead(linea.productoId, peso)}
            compact={true}
          />

          {/* Botón decrementar (-) 48px táctil */}
          <button
            type="button"
            data-testid="btn-disminuir-cantidad"
            className="qty-btn min-w-[48px] min-h-[48px] w-12 h-12 p-0 flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-200 border border-slate-600 font-bold active:scale-95 transition-all cursor-pointer shadow-xs"
            onClick={() => handleQtyDelta(-1)}
            title="Disminuir cantidad"
            aria-label="Disminuir cantidad"
          >
            <Minus size={16} className="stroke-[2.5]" />
          </button>

          {/* Input numérico directo inline 48px con auto-foco y select-all al teclear */}
          <input
            type="number"
            data-testid="input-cantidad"
            value={linea.cantidad}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onFocus={(e) => e.target.select()}
            onClick={(e) => (e.target as HTMLInputElement).select()}
            className="w-14 sm:w-16 h-12 min-h-[48px] text-center font-mono font-black text-xs sm:text-sm text-slate-100 bg-slate-900 border-2 border-slate-600 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 rounded-lg outline-none tabular-nums shadow-inner"
            step={linea.unidad === 'KG' ? 'any' : '1'}
            min={linea.unidad === 'KG' ? '0.001' : '1'}
            inputMode={linea.unidad === 'KG' ? 'decimal' : 'numeric'}
            title="Escriba directamente el peso/cantidad o use el teclado"
            aria-label={`Cantidad del producto en ${linea.unidad === 'KG' ? 'kilos' : 'unidades'}`}
          />

          {/* Botón incrementar (+) 48px táctil */}
          <button
            type="button"
            data-testid="btn-aumentar-cantidad"
            className="qty-btn min-w-[48px] min-h-[48px] w-12 h-12 p-0 flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-200 border border-slate-600 font-bold active:scale-95 transition-all cursor-pointer shadow-xs"
            onClick={() => handleQtyDelta(1)}
            title="Aumentar cantidad"
            aria-label="Aumentar cantidad"
          >
            <Plus size={16} className="stroke-[2.5]" />
          </button>
        </div>

        {/* Precios y Stock Intermedios */}
        <div className="flex items-center gap-1.5 min-w-0 flex-wrap text-[10px]">
          {/* Precio unitario editable */}
          <button
            type="button"
            data-testid="btn-editar-precio"
            onClick={handleEditarPrecioClick}
            title="Haga clic para editar el precio de venta unitario"
            className="group inline-flex items-center gap-1 font-mono tabular-nums text-[11px] font-semibold px-2 py-1 rounded border border-slate-700 bg-slate-800/80 hover:bg-indigo-950/60 hover:border-indigo-400 text-slate-300 hover:text-indigo-300 transition-all cursor-pointer shadow-xs shrink-0"
          >
            <span>(${precioFinalDisplay.toLocaleString('es-CO')} / {linea.unidad === 'KG' ? 'kg' : 'und'})</span>
            <Edit3 size={11} className="text-slate-400 group-hover:text-indigo-400" />
          </button>

          {/* Stock disponible */}
          <span
            className={`text-[9px] px-1.5 py-0.5 rounded font-semibold shrink-0 truncate max-w-[90px] ${
              isInsufficient
                ? 'bg-red-950/60 text-red-300 border border-red-800/60'
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}
            title={`Stock disponible: ${stockDisponible}`}
          >
            Stock: {stockDisponible} {linea.unidad === 'KG' ? 'kg' : 'und'} {isInsufficient && '⚠️'}
          </span>

          {isPrecioModificado && (
            <span
              className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-800/60 shrink-0"
              title={`Precio base de catálogo: $${linea.precioModificadoOriginal?.toLocaleString('es-CO')}`}
            >
              ✏️ Mod.
            </span>
          )}

          {isPrecioModificado && onResetItemPrice && (
            <button
              type="button"
              onClick={() => onResetItemPrice(linea.productoId)}
              className="text-[9px] text-amber-400 hover:text-amber-300 underline font-semibold cursor-pointer shrink-0"
              title="Restablecer al precio original de catálogo"
            >
              Reset
            </button>
          )}

          {lastClientPrice !== undefined && (
            <div className="flex items-center gap-1 shrink-0">
              {lastClientPrice === precioFinalDisplay ? (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-300 font-bold border border-emerald-800/60">
                  ✓ Histórico
                </span>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAplicarHistorico}
                  className="text-[9px] px-1.5 py-0.5 border-amber-500/40 bg-amber-950/40 text-amber-300 h-5 font-bold"
                >
                  💡 Hist: ${lastClientPrice.toLocaleString('es-CO')}
                </Button>
              )}
              {tieneDescuentoLinea && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onResetPrecio(linea.productoId)}
                  className="text-[9px] px-1 text-red-400 underline h-5"
                >
                  Reset
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Subtotal Prominente en Verde Esmeralda */}
        <div className="ml-auto shrink-0 pl-1">
          <span
            className="cart-item-price font-mono font-black text-sm sm:text-base tracking-tight tabular-nums text-emerald-400 dark:text-emerald-400 shrink-0"
            title={`Total de línea: $${totalLinea.toLocaleString('es-CO')}`}
            data-testid={`cart-item-price-${linea.productoId}`}
          >
            ${totalLinea.toLocaleString('es-CO')}
          </span>
        </div>
      </div>
    </div>
  );
};
