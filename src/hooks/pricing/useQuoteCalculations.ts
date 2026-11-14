import { useMemo } from 'react';
import type { QuoteItem } from './pricing.types';

export interface UseQuoteCalculationsProps {
  quoteItems: QuoteItem[];
  quoteDiscountGlobal: number;
  getQuoteItemUnitPrice: (item: any) => number;
}

export interface UseQuoteCalculationsReturn {
  quoteSubtotal: number;
  quoteLineDiscountsTotal: number;
  quoteDevolucionesTotal: number;
  quoteSubtotalAfterLineDiscounts: number;
  quoteGlobalDiscountValue: number;
  quoteTotalFinal: number;
}

/**
 * Hook modular para el cálculo determinista y reactivo de los totales financieros,
 * descuentos individuales de línea, descuentos globales y deducciones por devolución.
 */
export function useQuoteCalculations({
  quoteItems,
  quoteDiscountGlobal,
  getQuoteItemUnitPrice,
}: UseQuoteCalculationsProps): UseQuoteCalculationsReturn {
  // Subtotal bruto de ítems (excluyendo líneas marcadas como devolución)
  const quoteSubtotal = useMemo(() => {
    return quoteItems.reduce((sum, item) => {
      if (item.esDevolucion) return sum;
      const unitPrice = getQuoteItemUnitPrice(item);
      return sum + unitPrice * item.cantidad;
    }, 0);
  }, [quoteItems, getQuoteItemUnitPrice]);

  // Total de descuentos específicos aplicados línea por línea
  const quoteLineDiscountsTotal = useMemo(() => {
    return quoteItems.reduce((sum, item) => {
      if (item.esDevolucion) return sum;
      const unitPrice = getQuoteItemUnitPrice(item);
      const lineSubtotal = unitPrice * item.cantidad;
      return sum + lineSubtotal * ((item.descuento || 0) / 100);
    }, 0);
  }, [quoteItems, getQuoteItemUnitPrice]);

  // Total de créditos o deducciones por ítems devueltos en mesa B2B
  const quoteDevolucionesTotal = useMemo(() => {
    return quoteItems.reduce((sum, item) => {
      if (!item.esDevolucion) return sum;
      const unitPrice = getQuoteItemUnitPrice(item);
      return sum + unitPrice * item.cantidad;
    }, 0);
  }, [quoteItems, getQuoteItemUnitPrice]);

  // Subtotal neto tras deducir los descuentos de línea
  const quoteSubtotalAfterLineDiscounts = useMemo(() => {
    return quoteSubtotal - quoteLineDiscountsTotal;
  }, [quoteSubtotal, quoteLineDiscountsTotal]);

  // Valor monetario del descuento global sobre el subtotal neto
  const quoteGlobalDiscountValue = useMemo(() => {
    return quoteSubtotalAfterLineDiscounts * (quoteDiscountGlobal / 100);
  }, [quoteSubtotalAfterLineDiscounts, quoteDiscountGlobal]);

  // Gran total antes de aplicar el límite no-negativo
  const totalPrevio = useMemo(() => {
    return quoteSubtotalAfterLineDiscounts - quoteGlobalDiscountValue - quoteDevolucionesTotal;
  }, [quoteSubtotalAfterLineDiscounts, quoteGlobalDiscountValue, quoteDevolucionesTotal]);

  // Gran total final de la cotización garantizando >= 0
  const quoteTotalFinal = useMemo(() => {
    return Math.max(0, totalPrevio);
  }, [totalPrevio]);

  return {
    quoteSubtotal,
    quoteLineDiscountsTotal,
    quoteDevolucionesTotal,
    quoteSubtotalAfterLineDiscounts,
    quoteGlobalDiscountValue,
    quoteTotalFinal,
  };
}

