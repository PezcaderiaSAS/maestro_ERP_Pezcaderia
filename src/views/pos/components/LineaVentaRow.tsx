import React from 'react';
import { Minus, Plus, X, Edit3 } from 'lucide-react';
import type { LineaVenta } from '../../../types/pos.types';
import { BalanzaButton } from './BalanzaButton';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
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
      className="cart-item-row"
      style={{
        minHeight: '72px',
        height: 'auto',
        padding: '10px 12px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '8px',
        borderBottom: '1px solid #F1F5F9',
      }}
    >
      {/* Columna izquierda: nombre, precio y badges */}
      <div
        className="cart-item-left"
        style={{ display: 'flex', flexDirection: 'column', gap: '3px', flex: 1 }}
      >
        {/* Nombre, badge de unidad y badge peso manual */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <span className="cart-item-name" style={{ fontWeight: 700, fontSize: '13px' }}>
            {linea.nombre}
          </span>

          {/* Badge distintivo de tipo de venta (Kilos vs Unidades) */}
          {linea.unidad === 'KG' ? (
            <span
              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800"
              title="Producto vendido por peso en Kilogramos"
            >
              ⚖️ KILOS
            </span>
          ) : (
            <span
              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
              title="Producto vendido por Unidades enteras"
            >
              📦 UNIDAD
            </span>
          )}

          {linea.esPesoManual && (
            <span
              title="Peso ingresado manualmente (RN-13)"
              style={{
                fontSize: '10px',
                backgroundColor: '#FEF3C7',
                color: '#D97706',
                padding: '1px 5px',
                borderRadius: '4px',
                fontWeight: 700,
              }}
            >
              ⚖️ Manual
            </span>
          )}
        </div>

        {/* Precio total línea + precio unitario */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
          <span className="cart-item-price font-mono tabular-nums tracking-tight" style={{ color: 'var(--primary-color)', fontWeight: 700 }}>
            ${totalLinea.toLocaleString('es-CO')}
          </span>
          <button
            type="button"
            onClick={handleEditarPrecioClick}
            title="Haga clic para editar el precio de venta unitario"
            className="group inline-flex items-center gap-1 font-mono tabular-nums text-[11px] font-semibold px-1.5 py-0.5 rounded border border-slate-200 bg-white hover:bg-indigo-50 hover:border-indigo-300 text-slate-600 hover:text-indigo-600 transition-all cursor-pointer shadow-2xs"
          >
            <span>(${precioFinalDisplay.toLocaleString('es-CO')} / {linea.unidad === 'KG' ? 'kg' : 'und'})</span>
            <Edit3 size={11} className="text-slate-400 group-hover:text-indigo-600" />
          </button>
          {isPrecioModificado && (
            <span
              style={{
                fontSize: '10px',
                padding: '1px 5px',
                borderRadius: '4px',
                backgroundColor: '#FEF3C7',
                color: '#D97706',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '2px',
              }}
              title={`Precio base de catálogo: $${linea.precioModificadoOriginal?.toLocaleString('es-CO')}`}
            >
              ✏️ Modificado (Base: ${linea.precioModificadoOriginal?.toLocaleString('es-CO')})
            </span>
          )}
          {isPrecioModificado && onResetItemPrice && (
            <button
              type="button"
              onClick={() => onResetItemPrice(linea.productoId)}
              className="text-[10px] text-amber-600 hover:text-amber-800 underline font-semibold cursor-pointer"
              title="Restablecer al precio original de catálogo"
            >
              Restablecer
            </button>
          )}
          {tieneDescuentoLinea && (
            <span
              style={{
                fontSize: '10px',
                padding: '1px 5px',
                borderRadius: '4px',
                backgroundColor: '#DCFCE7',
                color: '#16A34A',
                fontWeight: 600,
              }}
            >
              -{linea.descuentoPct}%
            </span>
          )}
          {/* Badge de stock */}
          <span
            style={{
              fontSize: '10px',
              padding: '2px 6px',
              borderRadius: '4px',
              backgroundColor: isInsufficient ? '#FEE2E2' : '#F1F5F9',
              color: isInsufficient ? '#EF4444' : '#64748B',
              fontWeight: 600,
            }}
          >
            Stock: {stockDisponible} {linea.unidad === 'KG' ? 'kg' : 'und'} {isInsufficient && '⚠️ Insuficiente'}
          </span>
        </div>

        {/* Precio histórico del cliente */}
        {lastClientPrice !== undefined && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
            {lastClientPrice === precioFinalDisplay ? (
              <span
                style={{
                  fontSize: '10px',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  backgroundColor: '#D1FAE5',
                  color: '#065F46',
                  fontWeight: 'bold',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '2px',
                }}
              >
                ✓ Tarifa histórica aplicada
              </span>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={handleAplicarHistorico}
                style={{
                  fontSize: '10px',
                  padding: '2px 6px',
                  borderColor: '#F59E0B',
                  backgroundColor: '#FEF3C7',
                  color: '#D97706',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '2px',
                }}
              >
                💡 Último precio: ${lastClientPrice.toLocaleString('es-CO')} (Aplicar)
              </Button>
            )}

            {tieneDescuentoLinea && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onResetPrecio(linea.productoId)}
                style={{
                  fontSize: '10px',
                  padding: '2px 4px',
                  color: '#EF4444',
                  textDecoration: 'underline',
                }}
              >
                Restablecer
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Columna derecha: controles táctiles ergonómicos (>= 48px WCAG AAA) */}
      <div
        className="cart-item-controls flex items-center gap-2 self-center shrink-0"
      >
        {/* Botón balanza — solo para productos KG (RN-13) */}
        <BalanzaButton
          unidadMedida={linea.unidad}
          onWeightRead={(peso) => onWeightRead(linea.productoId, peso)}
        />

        {/* Botón decrementar (-) >= 48px */}
        <button
          type="button"
          className="qty-btn min-w-[48px] min-h-[48px] w-12 h-12 p-0 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 border border-slate-300 font-bold active:scale-95 transition-all cursor-pointer shadow-sm"
          onClick={() => handleQtyDelta(-1)}
          title="Disminuir cantidad"
          aria-label="Disminuir cantidad"
        >
          <Minus size={18} className="stroke-[2.5]" />
        </button>

        {/* Input cantidad >= 48px con auto-selección total */}
        <div className="w-20">
          <Input
            type="number"
            value={linea.cantidad}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onFocus={(e) => e.target.select()}
            className="w-full text-center border-2 border-slate-200 focus:border-cyan-500 rounded-xl text-base font-black h-12 min-h-[48px] px-1 bg-white text-slate-900 font-mono tabular-nums shadow-sm"
            step={linea.unidad === 'KG' ? 'any' : '1'}
            min={linea.unidad === 'KG' ? '0.001' : '1'}
            inputMode={linea.unidad === 'KG' ? 'decimal' : 'numeric'}
            aria-label={`Cantidad del producto en ${linea.unidad === 'KG' ? 'kilos' : 'unidades'}`}
          />
        </div>

        {/* Botón incrementar (+) >= 48px */}
        <button
          type="button"
          className="qty-btn min-w-[48px] min-h-[48px] w-12 h-12 p-0 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 border border-slate-300 font-bold active:scale-95 transition-all cursor-pointer shadow-sm"
          onClick={() => handleQtyDelta(1)}
          title="Aumentar cantidad"
          aria-label="Aumentar cantidad"
        >
          <Plus size={18} className="stroke-[2.5]" />
        </button>

        {/* Botón eliminar >= 48px */}
        <button
          type="button"
          className="delete-cart-item-btn min-w-[48px] min-h-[48px] w-12 h-12 p-0 flex items-center justify-center rounded-xl bg-rose-50 hover:bg-rose-100 active:bg-rose-200 text-rose-600 border border-rose-200 font-bold active:scale-95 transition-all cursor-pointer shadow-sm"
          onClick={() => onRemove(linea.productoId)}
          title="Eliminar producto del carrito"
          aria-label="Eliminar producto del carrito"
        >
          <X size={20} className="stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
};
