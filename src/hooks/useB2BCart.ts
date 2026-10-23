/**
 * ============================================================================
 * LA PEZCADERIA ERP — HOOK REACTIVO: useB2BCart
 * ============================================================================
 * Carrito de compras reactivo para clientes HORECA (Restaurantes, Hoteles).
 * Maneja líneas de pedido, cortes marinos, empaque térmico con hielo,
 * pesos estimados (Catch Weight) y subtotales en tiempo real.
 */

import { useState, useCallback, useMemo } from 'react';
import type {
  B2BCartItem,
  B2BCatalogProductItem,
  B2BOrderLineInput,
  B2BProductCut,
  B2BPackaging,
  B2BSaleModality,
} from '../types/b2bCustomerPortal.types';

export interface UseB2BCartReturn {
  items: B2BCartItem[];
  itemCount: number;
  totalEstimadoCop: number;
  pesoTotalEstimadoKg: number;
  piezasTotalesEstimadas: number;
  instruccionesCocina: string;
  setInstruccionesCocina: (instrucciones: string) => void;
  agregarItem: (
    producto: B2BCatalogProductItem,
    config: {
      corte: B2BProductCut;
      empaque: B2BPackaging;
      modalidadVenta: B2BSaleModality;
      cantidad: number;
      piezas?: number;
      observaciones?: string;
    }
  ) => void;
  actualizarCantidad: (index: number, nuevaCantidad: number) => void;
  actualizarItem: (index: number, update: Partial<B2BOrderLineInput>) => void;
  eliminarItem: (index: number) => void;
  cargarDesdePlantilla: (lineas: B2BOrderLineInput[]) => void;
  vaciarCarrito: () => void;
}

function calcularLinea(linea: B2BOrderLineInput): B2BCartItem {
  const subtotal = Math.round(linea.cantidadSolicitada * linea.precioPactadoCop);
  const pesoEstimado = linea.modalidadVenta === 'KILOGRAMOS_ESTIMADOS'
    ? linea.cantidadSolicitada
    : (linea.piezasEstimadas ? linea.piezasEstimadas * 0.45 : linea.cantidadSolicitada * 0.45);

  return {
    ...linea,
    subtotalCop: subtotal,
    pesoEstimadoTotalKg: Math.round(pesoEstimado * 10) / 10,
  };
}

export function useB2BCart(initialItems: B2BCartItem[] = []): UseB2BCartReturn {
  const [items, setItems] = useState<B2BCartItem[]>(initialItems);
  const [instruccionesCocina, setInstruccionesCocina] = useState<string>('');

  const agregarItem = useCallback(
    (
      producto: B2BCatalogProductItem,
      config: {
        corte: B2BProductCut;
        empaque: B2BPackaging;
        modalidadVenta: B2BSaleModality;
        cantidad: number;
        piezas?: number;
        observaciones?: string;
      }
    ) => {
      if (config.cantidad <= 0) return;

      setItems((prevItems) => {
        // Buscar si ya existe una línea idéntica en corte, empaque y modalidad
        const idxExistente = prevItems.findIndex(
          (item) =>
            item.productoId === producto.productoId &&
            item.corte === config.corte &&
            item.empaque === config.empaque &&
            item.modalidadVenta === config.modalidadVenta
        );

        if (idxExistente >= 0) {
          const itemExistente = prevItems[idxExistente];
          const nuevaCantidad = itemExistente.cantidadSolicitada + config.cantidad;
          const nuevasPiezas = itemExistente.piezasEstimadas
            ? itemExistente.piezasEstimadas + (config.piezas || 0)
            : config.piezas;

          const lineaActualizada = calcularLinea({
            ...itemExistente,
            cantidadSolicitada: nuevaCantidad,
            piezasEstimadas: nuevasPiezas,
            observacionesCorte: config.observaciones || itemExistente.observacionesCorte,
          });

          const copia = [...prevItems];
          copia[idxExistente] = lineaActualizada;
          return copia;
        }

        const nuevaLinea: B2BOrderLineInput = {
          productoId: producto.productoId,
          sku: producto.sku,
          nombre: producto.nombre,
          corte: config.corte,
          empaque: config.empaque,
          modalidadVenta: config.modalidadVenta,
          cantidadSolicitada: config.cantidad,
          piezasEstimadas: config.piezas,
          precioPactadoCop: producto.precioPactadoCop,
          observacionesCorte: config.observaciones,
        };

        return [...prevItems, calcularLinea(nuevaLinea)];
      });
    },
    []
  );

  const actualizarCantidad = useCallback((index: number, nuevaCantidad: number) => {
    if (nuevaCantidad <= 0) {
      setItems((prev) => prev.filter((_, idx) => idx !== index));
      return;
    }

    setItems((prev) => {
      if (index < 0 || index >= prev.length) return prev;
      const actual = prev[index];
      const copia = [...prev];
      copia[index] = calcularLinea({
        ...actual,
        cantidadSolicitada: nuevaCantidad,
      });
      return copia;
    });
  }, []);

  const actualizarItem = useCallback((index: number, update: Partial<B2BOrderLineInput>) => {
    setItems((prev) => {
      if (index < 0 || index >= prev.length) return prev;
      const actual = prev[index];
      const copia = [...prev];
      copia[index] = calcularLinea({
        ...actual,
        ...update,
      });
      return copia;
    });
  }, []);

  const eliminarItem = useCallback((index: number) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  }, []);

  const cargarDesdePlantilla = useCallback((lineas: B2BOrderLineInput[]) => {
    const calculadas = lineas.map((l) => calcularLinea(l));
    setItems(calculadas);
  }, []);

  const vaciarCarrito = useCallback(() => {
    setItems([]);
    setInstruccionesCocina('');
  }, []);

  const totalEstimadoCop = useMemo(
    () => items.reduce((acc, item) => acc + item.subtotalCop, 0),
    [items]
  );

  const pesoTotalEstimadoKg = useMemo(
    () =>
      Math.round(
        items.reduce((acc, item) => acc + item.pesoEstimadoTotalKg, 0) * 10
      ) / 10,
    [items]
  );

  const piezasTotalesEstimadas = useMemo(
    () =>
      items.reduce((acc, item) => acc + (item.piezasEstimadas || 0), 0),
    [items]
  );

  return {
    items,
    itemCount: items.length,
    totalEstimadoCop,
    pesoTotalEstimadoKg,
    piezasTotalesEstimadas,
    instruccionesCocina,
    setInstruccionesCocina,
    agregarItem,
    actualizarCantidad,
    actualizarItem,
    eliminarItem,
    cargarDesdePlantilla,
    vaciarCarrito,
  };
}
