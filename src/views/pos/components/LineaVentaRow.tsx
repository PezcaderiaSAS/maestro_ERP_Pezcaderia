import React from 'react';
import { Minus, Plus, X } from 'lucide-react';
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
}) => {
  const isInsufficient = stockDisponible < linea.cantidad;
  const totalLinea = precioFinalDisplay * linea.cantidad;
  const tieneDescuentoLinea = linea.descuentoPct > 0;

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
        {/* Nombre y badge peso manual */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span className="cart-item-name" style={{ fontWeight: 700, fontSize: '13px' }}>
            {linea.nombre}
          </span>
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
          <span className="font-mono tabular-nums text-[11px] text-slate-400">
            (${precioFinalDisplay.toLocaleString('es-CO')} c/u)
          </span>
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
            Stock: {stockDisponible} {isInsufficient && '⚠️ Insuficiente'}
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

      {/* Columna derecha: controles táctiles (44x44px ergonomics) */}
      <div
        className="cart-item-controls flex items-center gap-1.5 sm:gap-2 self-center shrink-0"
      >
        {/* Botón balanza — solo para productos KG (RN-13) */}
        <BalanzaButton
          unidadMedida={linea.unidad}
          onWeightRead={(peso) => onWeightRead(linea.productoId, peso)}
        />

        {/* Botón decrementar */}
        <Button
          variant="secondary"
          className="qty-btn min-w-[44px] min-h-[44px] w-11 h-11 p-0 flex items-center justify-center rounded-lg active:scale-95 transition-all text-secondary dark:text-slate-200 bg-slate-800/60 hover:bg-slate-700/60 dark:bg-slate-800 dark:hover:bg-slate-700 border border-white/10 dark:border-white/10 cursor-pointer"
          onClick={() => handleQtyDelta(-1)}
          title="Disminuir cantidad"
          aria-label="Disminuir cantidad"
        >
          <Minus size={16} />
        </Button>

        {/* Input cantidad */}
        <div className="w-16">
          <Input
            type="number"
            value={linea.cantidad}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            className="w-full text-center border border-white/10 dark:border-white/15 rounded-lg text-base font-bold h-11 px-1 bg-card border-white/5 dark:bg-slate-900 text-primary dark:text-white tabular-nums shadow-inner"
            step="any"
            min="0"
            inputMode="decimal"
            aria-label="Cantidad del producto"
          />
        </div>

        {/* Botón incrementar */}
        <Button
          variant="secondary"
          className="qty-btn min-w-[44px] min-h-[44px] w-11 h-11 p-0 flex items-center justify-center rounded-lg active:scale-95 transition-all text-secondary dark:text-slate-200 bg-slate-800/60 hover:bg-slate-700/60 dark:bg-slate-800 dark:hover:bg-slate-700 border border-white/10 dark:border-white/10 cursor-pointer"
          onClick={() => handleQtyDelta(1)}
          title="Aumentar cantidad"
          aria-label="Aumentar cantidad"
        >
          <Plus size={16} />
        </Button>

        {/* Botón eliminar */}
        <Button
          variant="danger"
          className="delete-cart-item-btn min-w-[44px] min-h-[44px] w-11 h-11 p-0 flex items-center justify-center rounded-lg active:scale-95 transition-all bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 cursor-pointer shadow-none"
          onClick={() => onRemove(linea.productoId)}
          title="Eliminar producto del carrito"
          aria-label="Eliminar producto del carrito"
        >
          <X size={16} />
        </Button>
      </div>
    </div>
  );
};
