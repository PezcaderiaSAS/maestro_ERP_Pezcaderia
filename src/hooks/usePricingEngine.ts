import { useState, useEffect, useCallback } from 'react';
import { pricingConfigService } from '../services/pricing/pricingConfigService';
import { pricingCalculationService } from '../services/pricing/pricingCalculationService';
import { marginAuditService, type TariffSubmissionValidationResult } from '../services/pricing/marginAuditService';
import { useInventoryStore } from '../store/useInventoryStore';
import { useEventStore } from '../store/useEventStore';
import { useAppStore } from '../store/useAppStore';
import { load, save } from '../services/localDb';
import type {
  PricingGlobalConfig,
  ProductPricingSimulationInput,
  ProductPricingSimulationResult,
  PricingRecordSnapshot,
  BatchCategoryRecalculateItem,
} from '../types/pricingEngine.types';
import type { Product } from '../types/erp.types';

export const DB_KEY_HISTORICO_PRECIOS = 'pezcaderia_precios_historico';

/**
 * ============================================================================
 * LA PEZCADERIA ERP — HOOK ORQUESTADOR DEL MOTOR DE PRECIOS Y MERMAS
 * ============================================================================
 * Centraliza la reactividad de la configuración de mermas (Admin Only),
 * la simulación interactiva multicanal en tiempo real y la auditoría NIIF.
 */
export function usePricingEngine() {
  const { products, setProducts } = useInventoryStore();
  const publishEvent = useEventStore((s) => s.publishEvent);
  const currentUserRole = useAppStore((s) => s.userRole);

  // 1. Estado de la Configuración Maestra
  const [globalConfig, setGlobalConfig] = useState<PricingGlobalConfig>(() =>
    pricingConfigService.getPricingGlobalConfig()
  );

  // 2. Estado de la Simulación Activa
  const [simulationInput, setSimulationInput] = useState<ProductPricingSimulationInput | null>(null);
  const [simulation, setSimulation] = useState<ProductPricingSimulationResult | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Cargar configuración inicial o ante cambios externos
  useEffect(() => {
    const config = pricingConfigService.getPricingGlobalConfig();
    setGlobalConfig(config);
  }, []);

  /**
   * Actualiza y persiste la configuración global en localDb (Solo rol ADMIN)
   */
  const saveGlobalConfig = useCallback(
    (newConfig: PricingGlobalConfig, usuarioId: string = 'admin') => {
      const res = pricingConfigService.savePricingGlobalConfig(newConfig, usuarioId);
      if (res.success && res.data) {
        setGlobalConfig(res.data);
        publishEvent(
          'METADATA_CONFIGURED',
          usuarioId,
          'Configuración global de mermas y márgenes actualizada',
          {
            version: res.data.version,
            usuarioId,
            timestamp: res.data.ultimaActualizacion,
          }
        );
      }
      return res;
    },
    [publishEvent]
  );

  /**
   * Ejecuta la simulación de precios de un producto en tiempo real (<50ms)
   */
  const runSimulation = useCallback(
    (input: ProductPricingSimulationInput) => {
      setSimulationInput(input);
      const result = pricingCalculationService.simulateProductPricing(input, globalConfig);
      setSimulation(result);
      return result;
    },
    [globalConfig]
  );

  /**
   * Limpia el estado de simulación actual
   */
  const clearSimulation = useCallback(() => {
    setSimulationInput(null);
    setSimulation(null);
  }, []);

  /**
   * Verifica permisos y bloqueos según rol de usuario
   */
  const checkTariffPermissions = useCallback(
    (
      tarifas: { POS: number; RESTAURANTE_HORECA: number; MAYORISTA: number },
      costoAjustadoCop: number,
      userRole: string = currentUserRole || 'vendedor'
    ): TariffSubmissionValidationResult => {
      return marginAuditService.validateTariffSubmission({
        costoAjustadoCop,
        tarifas,
        globalConfig,
        userRole,
      });
    },
    [globalConfig, currentUserRole]
  );

  /**
   * Confirma y publica las tarifas de un producto generando un snapshot inmutable
   */
  const commitProductTariffs = useCallback(
    (
      productoId: string,
      tarifas: { POS: number; RESTAURANTE_HORECA: number; MAYORISTA: number },
      motivo: string,
      usuarioId: string = 'admin',
      usuarioNombre: string = 'Administrador',
      excepcionAutorizada: boolean = false
    ): { success: boolean; error?: string; snapshot?: PricingRecordSnapshot } => {
      setIsSaving(true);
      try {
        const product = products.find((p) => p.id === productoId);
        if (!product) {
          setIsSaving(false);
          return { success: false, error: 'Producto no encontrado en el catálogo' };
        }

        const bufferEfectivo = simulation
          ? simulation.bufferEfectivoPct
          : pricingConfigService.resolveEffectiveBuffer(product.categoria, product.buffer_seguridad, globalConfig);

        const costoAjustado = pricingCalculationService.calculateAdjustedCost(
          product.precio_compra,
          bufferEfectivo,
          globalConfig.redondeoEnteroCop
        );

        // Validación de márgenes
        const audit = checkTariffPermissions(tarifas, costoAjustado, currentUserRole);
        if (!audit.valido && !excepcionAutorizada) {
          setIsSaving(false);
          return { success: false, error: audit.bloqueos.join('. ') };
        }

        const margenPosCop = tarifas.POS - costoAjustado;
        const margenRestCop = tarifas.RESTAURANTE_HORECA - costoAjustado;
        const margenMayorCop = tarifas.MAYORISTA - costoAjustado;

        const snapshot: PricingRecordSnapshot = {
          id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `prc-${Date.now()}`,
          productoId,
          sku: product.sku,
          nombreProducto: product.nombre,
          vigenciaDesde: new Date().toISOString(),
          costoCompraCop: product.precio_compra,
          bufferEfectivoPct: bufferEfectivo,
          costoAjustadoCop: costoAjustado,
          regimenIva: simulation?.regimenIva || 'EXENTO_O_EXCLUIDO',
          precioPosCop: tarifas.POS,
          precioRestauranteCop: tarifas.RESTAURANTE_HORECA,
          precioMayoristaCop: tarifas.MAYORISTA,
          margenPosCop,
          margenRestauranteCop: margenRestCop,
          margenMayoristaCop: margenMayorCop,
          margenPosPct: tarifas.POS > 0 ? Number(((margenPosCop / tarifas.POS) * 100).toFixed(2)) : 0,
          margenRestaurantePct:
            tarifas.RESTAURANTE_HORECA > 0
              ? Number(((margenRestCop / tarifas.RESTAURANTE_HORECA) * 100).toFixed(2))
              : 0,
          margenMayoristaPct:
            tarifas.MAYORISTA > 0
              ? Number(((margenMayorCop / tarifas.MAYORISTA) * 100).toFixed(2))
              : 0,
          motivoCambio: motivo || 'Actualización de tarifas comerciales',
          usuarioId,
          usuarioNombre,
          excepcionAutorizada,
        };

        // 1. Guardar snapshot en historial localDb
        const historicoActual = load<PricingRecordSnapshot[]>(DB_KEY_HISTORICO_PRECIOS as any, []);
        historicoActual.unshift(snapshot);
        save(DB_KEY_HISTORICO_PRECIOS as any, historicoActual);

        // 2. Actualizar producto en useInventoryStore
        const updatedProducts = products.map((p) => {
          if (p.id === productoId) {
            return {
              ...p,
              buffer_seguridad: bufferEfectivo,
              precio_venta_pos: tarifas.POS,
              precio_venta_restaurante: tarifas.RESTAURANTE_HORECA,
              precio_venta_mayorista: tarifas.MAYORISTA,
            };
          }
          return p;
        });
        setProducts(updatedProducts);

        // 3. Emitir evento inmutable
        publishEvent(
          'PRICE_CHANGED',
          usuarioId,
          `Precios actualizados para producto ${product.sku}`,
          {
            productoId,
            sku: product.sku,
            tarifas,
            usuarioId,
            vigenciaDesde: snapshot.vigenciaDesde,
          }
        );

        setIsSaving(false);
        return { success: true, snapshot };
      } catch (e: any) {
        setIsSaving(false);
        return { success: false, error: e?.message || 'Error al persistir tarifas' };
      }
    },
    [products, setProducts, simulation, globalConfig, checkTariffPermissions, currentUserRole, publishEvent]
  );

  /**
   * Genera la previsualización comparativa de recálculo masivo para una categoría
   */
  const generateBatchPreview = useCallback(
    (categoriaId: string): BatchCategoryRecalculateItem[] => {
      const itemsCat = products.filter(
        (p) => p.categoria.toLowerCase() === categoriaId.toLowerCase()
      );

      return itemsCat.map((prod) => {
        const buffer = pricingConfigService.resolveEffectiveBuffer(
          prod.categoria,
          prod.buffer_seguridad,
          globalConfig
        );
        const costoAdj = pricingCalculationService.calculateAdjustedCost(
          prod.precio_compra,
          buffer,
          globalConfig.redondeoEnteroCop
        );

        const posResult = pricingCalculationService.calculateChannelTariff(
          costoAdj,
          globalConfig.canales.margenPosPct,
          'EXENTO_O_EXCLUIDO',
          globalConfig.redondeoEnteroCop,
          'POS'
        );
        const restResult = pricingCalculationService.calculateChannelTariff(
          costoAdj,
          globalConfig.canales.margenRestaurantePct,
          'EXENTO_O_EXCLUIDO',
          globalConfig.redondeoEnteroCop,
          'RESTAURANTE_HORECA'
        );
        const mayorResult = pricingCalculationService.calculateChannelTariff(
          costoAdj,
          globalConfig.canales.margenMayoristaPct,
          'EXENTO_O_EXCLUIDO',
          globalConfig.redondeoEnteroCop,
          'MAYORISTA'
        );

        const variacion =
          posResult.precioFinalCop - prod.precio_venta_pos +
          (restResult.precioFinalCop - prod.precio_venta_restaurante) +
          (mayorResult.precioFinalCop - prod.precio_venta_mayorista);

        return {
          productoId: prod.id,
          sku: prod.sku,
          nombreProducto: prod.nombre,
          costoCompraCop: prod.precio_compra,
          bufferMermaPct: buffer,
          costoAjustadoCop: costoAdj,
          precioPosAnteriorCop: prod.precio_venta_pos,
          precioPosNuevoCop: posResult.precioFinalCop,
          precioRestauranteAnteriorCop: prod.precio_venta_restaurante,
          precioRestauranteNuevoCop: restResult.precioFinalCop,
          precioMayoristaAnteriorCop: prod.precio_venta_mayorista,
          precioMayoristaNuevoCop: mayorResult.precioFinalCop,
          variacionTotalCop: variacion,
        };
      });
    },
    [products, globalConfig]
  );

  /**
   * Aplica el recálculo masivo a todos los productos de la categoría seleccionada
   */
  const applyBatchRecalculate = useCallback(
    (
      categoriaId: string,
      usuarioId: string = 'admin',
      usuarioNombre: string = 'Administrador'
    ): { actualizados: number } => {
      const preview = generateBatchPreview(categoriaId);
      if (preview.length === 0) return { actualizados: 0 };

      for (const item of preview) {
        commitProductTariffs(
          item.productoId,
          {
            POS: item.precioPosNuevoCop,
            RESTAURANTE_HORECA: item.precioRestauranteNuevoCop,
            MAYORISTA: item.precioMayoristaNuevoCop,
          },
          `Recálculo masivo por cambio en categoría ${categoriaId}`,
          usuarioId,
          usuarioNombre,
          false
        );
      }

      return { actualizados: preview.length };
    },
    [generateBatchPreview, commitProductTariffs]
  );

  return {
    globalConfig,
    saveGlobalConfig,
    simulationInput,
    simulation,
    runSimulation,
    clearSimulation,
    isSaving,
    checkTariffPermissions,
    commitProductTariffs,
    generateBatchPreview,
    applyBatchRecalculate,
  };
}
