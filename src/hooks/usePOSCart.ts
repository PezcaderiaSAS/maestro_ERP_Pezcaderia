// src/hooks/usePOSCart.ts

import { useState, useMemo } from 'react';
import type { LineaVenta } from '../types/pos.types';
import type { Producto } from '../types/inventory.types';
import { calcularTotalLinea, calcularTotalesPedido } from '../services/posService';
import { createLogger } from '../lib/consoleLogger';

const log = createLogger('POSCart');

// Declaración local del tipo Cliente para evitar acoplamiento rígido con App.tsx
export interface ClientePOS {
  id: string;
  nombre: string;
  identificacion: string;
  tipoPrecio: 'POS' | 'RESTAURANTE' | 'MAYORISTA';
  cupoCredito: number;
  activo: boolean;
  email?: string;
  telefono?: string;
  direccion?: string;
  ciudad?: string;
  exigeFacturaElectronica?: boolean;
}

export function usePOSCart(initialCliente: ClientePOS | null = null) {
  const [lineas, setLineas] = useState<LineaVenta[]>([]);
  const [cliente, setClienteState] = useState<ClientePOS | null>(initialCliente);
  const [descuentoGlobalPct, setDescuentoGlobalPct] = useState<number>(0);
  const [descuentoGlobalValor, setDescuentoGlobalValor] = useState<number>(0);

  const setCliente = (value: ClientePOS | null) => {
    if (value) log.info('setCliente', { clienteId: value.id, nombre: value.nombre, tipoPrecio: value.tipoPrecio });
    setClienteState(value);
  };

  // Recálculo automático de totales reactivos
  const totales = useMemo(() => {
    const calc = calcularTotalesPedido(lineas, descuentoGlobalPct, descuentoGlobalValor);
    if (calc.error || !calc.data) {
      return { subtotal: 0, descuento: 0, totalFinal: 0, error: calc.error };
    }
    return { ...calc.data, error: null };
  }, [lineas, descuentoGlobalPct, descuentoGlobalValor]);

  const agregarProducto = (producto: Producto, cantidad: number = 1, esPesoManual: boolean = false) => {
    log.info('agregarProducto', { sku: producto.sku, nombre: producto.nombre, cantidad });
    // Resolver precio de venta según el tipo de cliente (siempre entero en COP)
    let precioLista = Math.round(Number((producto as any).precio_venta_pos ?? producto.precioVentaPOS) || 0);
    if (cliente) {
      if (cliente.tipoPrecio === 'RESTAURANTE') {
        precioLista = Math.round(Number((producto as any).precio_venta_restaurante ?? producto.precioVentaRestaurante) || 0);
      } else if (cliente.tipoPrecio === 'MAYORISTA') {
        precioLista = Math.round(Number((producto as any).precio_venta_mayorista ?? producto.precioVentaMayorista) || 0);
      }
    }

    // Normalizar unidad de medida: detecta 'kg', 'KG', 'kilo', 'kilos'
    const unidadMedidaStr = (producto.unidadMedida || (producto as any).unidad || '').toString().trim().toUpperCase();
    const unidad: 'KG' | 'UNIDAD' = unidadMedidaStr === 'KG' || unidadMedidaStr === 'KILO' || unidadMedidaStr === 'KILOS' ? 'KG' : 'UNIDAD';

    // Manejo de IVA
    const tarifaIva = Number((producto as any).iva) || 0;
    const ivaIncluido = (producto as any).ivaIncluido !== false;

    setLineas((prev) => {
      const idx = prev.findIndex((l) => l.productoId === producto.id);
      if (idx > -1) {
        const itemActual = prev[idx];
        const nuevaCantidad = itemActual.cantidad + cantidad;
        const calc = calcularTotalLinea(
          precioLista,
          itemActual.descuentoPct,
          nuevaCantidad,
          itemActual.iva ?? tarifaIva,
          itemActual.ivaIncluido ?? ivaIncluido
        );
        const updated = [...prev];
        updated[idx] = {
          ...itemActual,
          cantidad: nuevaCantidad,
          precioLista,
          precioFinal: calc.precioFinal,
          totalLinea: calc.totalLinea,
          baseGravableLinea: calc.baseGravableLinea,
          cuotaIvaLinea: calc.cuotaIvaLinea,
          esPesoManual: esPesoManual || itemActual.esPesoManual,
        };
        return updated;
      }

      const calc = calcularTotalLinea(precioLista, 0, cantidad, tarifaIva, ivaIncluido);
      const nuevaLinea: LineaVenta = {
        productoId: producto.id,
        sku: producto.sku,
        nombre: producto.nombre,
        cantidad,
        unidad,
        precioLista,
        descuentoPct: 0,
        precioFinal: calc.precioFinal,
        totalLinea: calc.totalLinea,
        baseGravableLinea: calc.baseGravableLinea,
        cuotaIvaLinea: calc.cuotaIvaLinea,
        precioCompra: Math.round(producto.precioCompra || (producto as any).precio_compra || 0),
        esPesoManual,
        iva: tarifaIva,
        ivaIncluido,
      };
      return [...prev, nuevaLinea];
    });
  };

  const actualizarCantidad = (productoId: string, cantidad: number) => {
    if (cantidad <= 0) {
      log.info('actualizarCantidad', { productoId, cantidad: 0 });
      removerProducto(productoId);
      return;
    }

    log.info('actualizarCantidad', { productoId, cantidad });
    setLineas((prev) =>
      prev.map((l) => {
        if (l.productoId === productoId) {
          const calc = calcularTotalLinea(l.precioLista, l.descuentoPct, cantidad, l.iva, l.ivaIncluido);
          return {
            ...l,
            cantidad,
            precioFinal: calc.precioFinal,
            totalLinea: calc.totalLinea,
            baseGravableLinea: calc.baseGravableLinea,
            cuotaIvaLinea: calc.cuotaIvaLinea,
          };
        }
        return l;
      })
    );
  };

  const actualizarDescuentoLinea = (productoId: string, descuentoPct: number) => {
    if (descuentoPct < 0 || descuentoPct > 100) return;

    log.info('actualizarDescuentoLinea', { productoId, descuentoPct });
    setLineas((prev) =>
      prev.map((l) => {
        if (l.productoId === productoId) {
          const calc = calcularTotalLinea(l.precioLista, descuentoPct, l.cantidad, l.iva, l.ivaIncluido);
          return {
            ...l,
            descuentoPct,
            precioFinal: calc.precioFinal,
            totalLinea: calc.totalLinea,
            baseGravableLinea: calc.baseGravableLinea,
            cuotaIvaLinea: calc.cuotaIvaLinea,
          };
        }
        return l;
      })
    );
  };

  const updateItemPrice = (productoId: string, newPrice: number) => {
    if (newPrice < 0) return;
    const cleanPrice = Math.round(newPrice);

    setLineas((prev) =>
      prev.map((l) => {
        if (l.productoId === productoId) {
          const calc = calcularTotalLinea(cleanPrice, l.descuentoPct, l.cantidad, l.iva, l.ivaIncluido);
          return {
            ...l,
            precioModificadoOriginal: l.precioModificadoOriginal ?? l.precioLista,
            precioLista: cleanPrice,
            precioFinal: calc.precioFinal,
            totalLinea: calc.totalLinea,
            baseGravableLinea: calc.baseGravableLinea,
            cuotaIvaLinea: calc.cuotaIvaLinea,
          };
        }
        return l;
      })
    );
  };

  const resetItemPrice = (productoId: string) => {
    log.info('resetItemPrice', { productoId });
    setLineas((prev) =>
      prev.map((l) => {
        if (l.productoId === productoId && l.precioModificadoOriginal !== undefined) {
          const originalPrice = l.precioModificadoOriginal;
          const calc = calcularTotalLinea(originalPrice, l.descuentoPct, l.cantidad, l.iva, l.ivaIncluido);
          return {
            ...l,
            precioLista: originalPrice,
            precioFinal: calc.precioFinal,
            totalLinea: calc.totalLinea,
            baseGravableLinea: calc.baseGravableLinea,
            cuotaIvaLinea: calc.cuotaIvaLinea,
            precioModificadoOriginal: undefined,
          };
        }
        return l;
      })
    );
  };

  const removerProducto = (productoId: string) => {
    log.info('removerProducto', { productoId });
    setLineas((prev) => prev.filter((l) => l.productoId !== productoId));
  };

  const limpiarCarrito = () => {
    log.info('limpiarCarrito', { lineasPrevias: lineas.length });
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
    updateItemPrice,
    resetItemPrice,
    removerProducto,
    setCliente,
    setDescuentoGlobalPct,
    setDescuentoGlobalValor,
    limpiarCarrito,
    setLineas,
  };
}
