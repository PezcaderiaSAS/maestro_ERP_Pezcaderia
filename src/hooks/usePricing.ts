import { useState, useEffect } from 'react';
import { useInventoryStore } from '../store/useInventoryStore.ts';
import { useOrderStore } from '../store/useOrderStore.ts';
import { useEventStore } from '../store/useEventStore.ts';
import { useAppStore } from '../store/useAppStore.ts';
import { useClientStore } from '../store/useClientStore.ts';
import { useDriverStore } from '../store/useDriverStore.ts';
import { useReturnStore } from '../store/useReturnStore.ts';

import type { PricingTab, QuoteSubTab, ClientPriceType, UsePricingReturn } from './pricing';
import {
  useCatalogManagement,
  usePriceMatrix,
  useQuoteDraft,
  useDevolucionesDraft,
} from './pricing';

export * from './pricing';

/**
 * Hook orquestador principal (fachada) para el módulo de Pricing / Cotizaciones / Catálogo.
 * Desacoplado en submódulos especializados con responsabilidad única (SRP).
 */
export function usePricing(): UsePricingReturn {
  // Stores de persistencia global
  const {
    products,
    setProducts,
    setProductsCatalog,
    productPricings,
    setProductPricings,
    setStock,
  } = useInventoryStore();

  const { quotations, setQuotations } = useOrderStore();
  const publishEvent = useEventStore((s) => s.publishEvent);
  const userRole = useAppStore((s) => s.userRole);
  const { clientes, lastClientPrices, loadLastClientPrices, updateLastClientPrice } = useClientStore();
  const conductores = useDriverStore((s) => s.conductores);
  const { devoluciones } = useReturnStore();

  // Carga de precios históricos al montar
  useEffect(() => {
    loadLastClientPrices();
  }, [loadLastClientPrices]);

  // Estados generales de navegación y segmento de cliente
  const [activeTab, setActiveTab] = useState<PricingTab>('quotes');
  const [quoteSubTab, setQuoteSubTab] = useState<QuoteSubTab>('create');
  const [selectedQuoteForPrint, setSelectedQuoteForPrint] = useState<any>(null);
  const [clientType, setClientType] = useState<ClientPriceType>('POS');

  // Submódulos especializados
  const catalog = useCatalogManagement({
    products,
    setProducts,
    setProductsCatalog,
  });

  const priceMatrix = usePriceMatrix({
    clientType,
    userRole,
    setProductPricings,
    publishEvent,
  });

  const quoteDraft = useQuoteDraft({
    clientType,
    setClientType,
    products,
    clientes,
    conductores,
    userRole,
    setQuotations,
    publishEvent,
    setStock,
    updateLastClientPrice,
    setQuoteSubTab,
    getQuoteItemUnitPrice: priceMatrix.getQuoteItemUnitPrice,
  });

  const devolucionesDraft = useDevolucionesDraft({
    userRole,
    publishEvent,
    clientes,
    conductores,
    quotations,
  });

  return {
    // Estados generales
    activeTab,
    setActiveTab,
    quoteSubTab,
    setQuoteSubTab,
    selectedQuoteForPrint,
    setSelectedQuoteForPrint,

    // Catálogo
    ...catalog,

    // Precios
    ...priceMatrix,

    // Cotización, logística, modal de línea y cálculos
    ...quoteDraft,

    // Devoluciones
    ...devolucionesDraft,

    // Datos stores
    products,
    productPricings,
    quotations,
    devoluciones,
    clientes,
    conductores,
    lastClientPrices,
    userRole,
  };
}
