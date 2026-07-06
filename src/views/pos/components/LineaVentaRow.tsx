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
          <span className="cart-item-price" style={{ color: 'var(--primary-color)', fontWeight: 700 }}>
            ${totalLinea.toLocaleString('es-CO')}
          </span>
          <span style={{ fontSize: '11px', color: '#64748B' }}>
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

      {/* Columna derecha: controles táctiles */}
      <div
        className="cart-item-controls"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          alignSelf: 'center',
          flexShrink: 0,
        }}
      >
        {/* Botón balanza — solo para productos KG (RN-13) */}
        <BalanzaButton
          unidadMedida={linea.unidad}
          onWeightRead={(peso) => onWeightRead(linea.productoId, peso)}
        />

        {/* Botón decrementar */}
        <Button
          variant="secondary"
          className="qty-btn"
          onClick={() => handleQtyDelta(-1)}
          style={{ width: '36px', height: '36px', padding: 0 }}
        >
          <Minus size={14} />
        </Button>

        {/* Input cantidad */}
        <div style={{ width: '60px' }}>
          <Input
            type="number"
            value={linea.cantidad}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            style={{
              textAlign: 'center',
              border: '1px solid #CBD5E1',
              borderRadius: '6px',
              fontSize: '15px',
              fontWeight: 'bold',
              height: '36px',
              padding: '0 4px',
            }}
            step="any"
            min="0"
          />
        </div>

        {/* Botón incrementar */}
        <Button
          variant="secondary"
          className="qty-btn"
          onClick={() => handleQtyDelta(1)}
          style={{ width: '36px', height: '36px', padding: 0 }}
        >
          <Plus size={14} />
        </Button>

        {/* Botón eliminar */}
        <Button
          variant="danger"
          className="delete-cart-item-btn"
          onClick={() => onRemove(linea.productoId)}
          style={{
            width: '36px',
            height: '36px',
            backgroundColor: '#FEE2E2',
            color: '#EF4444',
            padding: 0,
            boxShadow: 'none',
          }}
        >
          <X size={14} />
        </Button>
      </div>
    </div>
  );
};
