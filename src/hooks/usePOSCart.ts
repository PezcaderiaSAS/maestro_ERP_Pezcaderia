// src/hooks/usePOSCart.ts

import { useState, useMemo } from 'react';
import type { LineaVenta } from '../types/pos.types';
import type { Producto } from '../types/inventory.types';
import { calcularTotalLinea, calcularTotalesPedido } from '../services/posService';

// Declaración local del tipo Cliente para evitar acoplamiento rígido con App.tsx
export interface ClientePOS {
  id: string;
  nombre: string;
  identificacion: string;
  tipoPrecio: 'POS' | 'RESTAURANTE' | 'MAYORISTA';
  cupoCredito: number;
  activo: boolean;
}

export function usePOSCart(initialCliente: ClientePOS | null = null) {
  const [lineas, setLineas] = useState<LineaVenta[]>([]);
  const [cliente, setCliente] = useState<ClientePOS | null>(initialCliente);
  const [descuentoGlobalPct, setDescuentoGlobalPct] = useState<number>(0);
  const [descuentoGlobalValor, setDescuentoGlobalValor] = useState<number>(0);

  // Recálculo automático de totales reactivos
  const totales = useMemo(() => {
    const calc = calcularTotalesPedido(lineas, descuentoGlobalPct, descuentoGlobalValor);
    if (calc.error || !calc.data) {
      return { subtotal: 0, descuento: 0, totalFinal: 0, error: calc.error };
    }
    return { ...calc.data, error: null };
  }, [lineas, descuentoGlobalPct, descuentoGlobalValor]);

  const agregarProducto = (producto: Producto, cantidad: number = 1, esPesoManual: boolean = false) => {
    // Resolver precio de venta según el tipo de cliente
    let precioLista = (producto as any).precio_venta_pos || producto.precioVentaPOS || 0;
    if (cliente) {
      if (cliente.tipoPrecio === 'RESTAURANTE') {
        precioLista = (producto as any).precio_venta_restaurante || producto.precioVentaRestaurante || 0;
      } else if (cliente.tipoPrecio === 'MAYORISTA') {
        precioLista = (producto as any).precio_venta_mayorista || producto.precioVentaMayorista || 0;
      }
    }

    setLineas((prev) => {
      const idx = prev.findIndex((l) => l.productoId === producto.id);
      if (idx > -1) {
        const itemActual = prev[idx];
        const nuevaCantidad = itemActual.cantidad + cantidad;
        const calc = calcularTotalLinea(precioLista, itemActual.descuentoPct, nuevaCantidad);
        const updated = [...prev];
        updated[idx] = {
          ...itemActual,
          cantidad: nuevaCantidad,
          precioLista,
          precioFinal: calc.precioFinal,
          totalLinea: calc.totalLinea,
          esPesoManual: esPesoManual || itemActual.esPesoManual,
        };
        return updated;
      }

      const calc = calcularTotalLinea(precioLista, 0, cantidad);
      const nuevaLinea: LineaVenta = {
        productoId: producto.id,
        sku: producto.sku,
        nombre: producto.nombre,
        cantidad,
        unidad: producto.unidadMedida === 'KG' ? 'KG' : 'UNIDAD',
        precioLista,
        descuentoPct: 0,
        precioFinal: calc.precioFinal,
        totalLinea: calc.totalLinea,
        esPesoManual,
      };
      return [...prev, nuevaLinea];
    });
  };

  const actualizarCantidad = (productoId: string, cantidad: number) => {
    if (cantidad <= 0) {
      removerProducto(productoId);
      return;
    }

    setLineas((prev) =>
      prev.map((l) => {
        if (l.productoId === productoId) {
          const calc = calcularTotalLinea(l.precioLista, l.descuentoPct, cantidad);
          return {
            ...l,
            cantidad,
            precioFinal: calc.precioFinal,
            totalLinea: calc.totalLinea,
          };
        }
        return l;
      })
    );
  };

  const actualizarDescuentoLinea = (productoId: string, descuentoPct: number) => {
    if (descuentoPct < 0 || descuentoPct > 100) return;

    setLineas((prev) =>
      prev.map((l) => {
        if (l.productoId === productoId) {
          const calc = calcularTotalLinea(l.precioLista, descuentoPct, l.cantidad);
          return {
            ...l,
            descuentoPct,
            precioFinal: calc.precioFinal,
            totalLinea: calc.totalLinea,
          };
        }
        return l;
      })
    );
  };

  const removerProducto = (productoId: string) => {
    setLineas((prev) => prev.filter((l) => l.productoId !== productoId));
  };

  const limpiarCarrito = () => {
    setLineas([]);
    setDescuentoGlobalPct(0);
    setDescuentoGlobalValor(0);
  };

  return {
    lineas,
    cliente,
    descuentoGlobalPct,
    descuentoGlobalValor,
    totales,
    agregarProducto,
    actualizarCantidad,
    actualizarDescuentoLinea,
    removerProducto,
    setCliente,
    setDescuentoGlobalPct,
    setDescuentoGlobalValor,
    limpiarCarrito,
    setLineas,
  };
}
