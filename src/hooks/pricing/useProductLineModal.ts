import { useState, useCallback } from 'react';
import type { QuoteItem, CurrentProductLineState } from './pricing.types';

export interface UseProductLineModalProps {
  quoteItems: QuoteItem[];
  setQuoteItems: React.Dispatch<React.SetStateAction<QuoteItem[]>>;
}

export interface UseProductLineModalReturn {
  isProductModalOpen: boolean;
  setIsProductModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  editingItemIndex: number | null;
  setEditingItemIndex: React.Dispatch<React.SetStateAction<number | null>>;
  currentProductLine: CurrentProductLineState;
  setCurrentProductLine: React.Dispatch<React.SetStateAction<CurrentProductLineState>>;
  saveProductLine: () => void;
  removeProductLine: (index: number) => void;
  openAddItemModal: (product: any) => void;
  openEditItemModal: (index: number) => void;
}

const INITIAL_PRODUCT_LINE: CurrentProductLineState = {
  product: null,
  cantidad: 1,
  descuento: 0,
  precioOverride: 0,
  detalle: '',
  listo: false,
  esDevolucion: false,
  devolucionId: '',
};

/**
 * Hook modular para el modal de edición de líneas de cotización, adición de productos,
 * descuentos individuales por ítem y sobreescrituras manuales de precio.
 */
export function useProductLineModal({
  quoteItems,
  setQuoteItems,
}: UseProductLineModalProps): UseProductLineModalReturn {
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [currentProductLine, setCurrentProductLine] = useState<CurrentProductLineState>(INITIAL_PRODUCT_LINE);

  const saveProductLine = useCallback(() => {
    if (!currentProductLine.product) return;

    const qty = parseFloat(currentProductLine.cantidad as string) || 0;
    const discount = parseFloat(currentProductLine.descuento as string) || 0;
    const override = parseFloat(currentProductLine.precioOverride as string) || 0;

    const newLineItem: QuoteItem = {
      product: currentProductLine.product,
      cantidad: qty,
      descuento: discount,
      precioOverride: override > 0 ? override : undefined,
      detalle: currentProductLine.detalle,
      listo: currentProductLine.listo,
      esDevolucion: currentProductLine.esDevolucion,
      devolucionId: currentProductLine.devolucionId,
    };

    setQuoteItems((prev) => {
      const updated = [...prev];
      if (editingItemIndex !== null) {
        updated[editingItemIndex] = newLineItem;
      } else {
        const normalizedNewDetail = (newLineItem.detalle || '').trim().toLowerCase();
        const existingIndex = updated.findIndex(
          (item) =>
            item.product.sku === newLineItem.product.sku &&
            (item.detalle || '').trim().toLowerCase() === normalizedNewDetail &&
            Boolean(item.esDevolucion) === Boolean(newLineItem.esDevolucion)
        );

        if (existingIndex !== -1) {
          updated[existingIndex] = {
            ...updated[existingIndex],
            cantidad: updated[existingIndex].cantidad + qty,
          };
        } else {
          updated.push(newLineItem);
        }
      }
      return updated;
    });

    setIsProductModalOpen(false);
    setEditingItemIndex(null);
  }, [currentProductLine, editingItemIndex, setQuoteItems]);

  const removeProductLine = useCallback(
    (index: number) => {
      setQuoteItems((prev) => prev.filter((_, i) => i !== index));
    },
    [setQuoteItems]
  );

  const openAddItemModal = useCallback((product: any) => {
    setCurrentProductLine({
      product,
      cantidad: 1,
      descuento: 0,
      precioOverride: 0,
      detalle: '',
      listo: false,
      esDevolucion: false,
      devolucionId: '',
    });
    setEditingItemIndex(null);
    setIsProductModalOpen(true);
  }, []);

  const openEditItemModal = useCallback(
    (index: number) => {
      const item = quoteItems[index];
      if (!item) return;
      setCurrentProductLine({
        product: item.product,
        cantidad: item.cantidad,
        descuento: item.descuento,
        precioOverride: item.precioOverride || 0,
        detalle: item.detalle || '',
        listo: item.listo || false,
        esDevolucion: item.esDevolucion || false,
        devolucionId: item.devolucionId || '',
      });
      setEditingItemIndex(index);
      setIsProductModalOpen(true);
    },
    [quoteItems]
  );

  return {
    isProductModalOpen,
    setIsProductModalOpen,
    editingItemIndex,
    setEditingItemIndex,
    currentProductLine,
    setCurrentProductLine,
    saveProductLine,
    removeProductLine,
    openAddItemModal,
    openEditItemModal,
  };
}

