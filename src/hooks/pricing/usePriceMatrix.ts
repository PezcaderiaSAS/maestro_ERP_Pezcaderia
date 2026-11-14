import { useState, useCallback } from 'react';
import type React from 'react';
import { generateId } from '../../lib/utils';
import type { ProductPricing } from '../../types/erp.types';
import type { PriceFormData, ClientPriceType } from './pricing.types';

export interface UsePriceMatrixProps {
  clientType: ClientPriceType;
  userRole: string;
  setProductPricings?: (updater: (prev: any[]) => any[]) => void;
  publishEvent: (type: any, userRole: string, description: string, metadata?: any) => void;
}

export interface UsePriceMatrixReturn {
  editingPriceId: string | null;
  setEditingPriceId: React.Dispatch<React.SetStateAction<string | null>>;
  priceForm: PriceFormData;
  setPriceForm: React.Dispatch<React.SetStateAction<PriceFormData>>;
  selectedProductHistory: string | null;
  setSelectedProductHistory: React.Dispatch<React.SetStateAction<string | null>>;
  handleStartEditPrice: (prod: any) => void;
  handleSavePrices: (prodId: string, callbacks: { onSuccess: () => void }) => void;
  getProductPriceByClientType: (prod: any) => number;
  getQuoteItemUnitPrice: (item: any) => number;
}

const INITIAL_PRICE_FORM: PriceFormData = {
  precio_compra: 0,
  buffer_seguridad: 0,
  precio_venta_pos: 0,
  precio_venta_restaurante: 0,
  precio_venta_mayorista: 0,
};

/**
 * Hook modular para la gestión de listas de precios por segmento de cliente
 * (POS, RESTAURANTE, MAYORISTA), edición de tarifas y auditoría histórica.
 */
export function usePriceMatrix({
  clientType,
  userRole,
  setProductPricings,
  publishEvent,
}: UsePriceMatrixProps): UsePriceMatrixReturn {
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [priceForm, setPriceForm] = useState<PriceFormData>(INITIAL_PRICE_FORM);
  const [selectedProductHistory, setSelectedProductHistory] = useState<string | null>(null);

  // Iniciar edición de precios cargando los valores vigentes del producto
  const handleStartEditPrice = useCallback((prod: any) => {
    setEditingPriceId(prod.id);
    setPriceForm({
      precio_compra: prod.precio_compra,
      buffer_seguridad: prod.buffer_seguridad,
      precio_venta_pos: prod.precio_venta_pos,
      precio_venta_restaurante: prod.precio_venta_restaurante,
      precio_venta_mayorista: prod.precio_venta_mayorista,
    });
  }, []);

  // Guardar nueva vigencia de precios y publicar evento de auditoría
  const handleSavePrices = useCallback(
    (prodId: string, callbacks: { onSuccess: () => void }) => {
      if (setProductPricings) {
        const newPricing: ProductPricing = {
          id: generateId('prc'),
          productoId: prodId,
          vigenciaDesde: new Date().toISOString(),
          precio_compra: priceForm.precio_compra,
          buffer_seguridad: priceForm.buffer_seguridad,
          precio_venta_pos: priceForm.precio_venta_pos,
          precio_venta_restaurante: priceForm.precio_venta_restaurante,
          precio_venta_mayorista: priceForm.precio_venta_mayorista,
          actualizadoPor: userRole,
        };
        setProductPricings((prev: any[]) => [...prev, newPricing]);
        publishEvent('PRICE_CHANGED', userRole, `Actualización de precios para el producto ${prodId}`);
      }

      setEditingPriceId(null);
      callbacks.onSuccess();
    },
    [priceForm, userRole, setProductPricings, publishEvent]
  );

  // Obtener precio unitario según el segmento comercial del cliente
  const getProductPriceByClientType = useCallback(
    (prod: any) => {
      switch (clientType) {
        case 'RESTAURANTE':
          return prod.precio_venta_restaurante;
        case 'MAYORISTA':
          return prod.precio_venta_mayorista;
        default:
          return prod.precio_venta_pos;
      }
    },
    [clientType]
  );

  // Obtener precio unitario de una línea de cotización (respetando sobreescrituras manuales)
  const getQuoteItemUnitPrice = useCallback(
    (item: any) => {
      return item.precioOverride !== undefined ? item.precioOverride : getProductPriceByClientType(item.product);
    },
    [getProductPriceByClientType]
  );

  return {
    editingPriceId,
    setEditingPriceId,
    priceForm,
    setPriceForm,
    selectedProductHistory,
    setSelectedProductHistory,
    handleStartEditPrice,
    handleSavePrices,
    getProductPriceByClientType,
    getQuoteItemUnitPrice,
  };
}

