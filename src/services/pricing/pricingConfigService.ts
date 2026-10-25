import { load, save } from '../localDb';
import {
  PricingGlobalConfigSchema,
} from '../../../packages/validation-schemas/src/pricingEngine.schema';
import type {
  PricingGlobalConfig,
  CategoryWasteConfig,
} from '../../types/pricingEngine.types';

/**
 * Categorías y Buffers de Merma Biológica predeterminados para La Pezcadería ERP.
 */
export const DEFAULT_CATEGORY_WASTE_CONFIGS: CategoryWasteConfig[] = [
  {
    id: 'waste-cat-salmon',
    categoriaId: 'cat-salmon',
    nombreCategoria: 'Salmón y Pescado Graso',
    bufferDefaultPct: 10,
    mermaDespiecePct: 7,
    mermaDescongelacionGlaseoPct: 3,
    mermaCocinaViscerasPct: 0,
    descripcion: 'Pescados grasos importados (Salmón, Trucha arcoíris) con merma de fileteo y despiece',
  },
  {
    id: 'waste-cat-blanco',
    categoriaId: 'cat-blanco',
    nombreCategoria: 'Pescado Blanco Nacional',
    bufferDefaultPct: 8,
    mermaDespiecePct: 5,
    mermaDescongelacionGlaseoPct: 0,
    mermaCocinaViscerasPct: 3,
    descripcion: 'Tilapia, Róbalo, Pargo y Corvina fresca con desviscerado y escamado',
  },
  {
    id: 'waste-cat-mariscos',
    categoriaId: 'cat-mariscos',
    nombreCategoria: 'Mariscos y Crustáceos',
    bufferDefaultPct: 12,
    mermaDespiecePct: 0,
    mermaDescongelacionGlaseoPct: 8,
    mermaCocinaViscerasPct: 4,
    descripcion: 'Camarones, Langostinos, Calamar y Pulpo con descongelación, desvenado y glaseo',
  },
  {
    id: 'waste-cat-congelados',
    categoriaId: 'cat-congelados',
    nombreCategoria: 'Congelados y Empacados',
    bufferDefaultPct: 5,
    mermaDespiecePct: 0,
    mermaDescongelacionGlaseoPct: 5,
    mermaCocinaViscerasPct: 0,
    descripcion: 'Productos procesados al vacío con merma mínima de frío pasivo',
  },
  {
    id: 'waste-cat-insumos',
    categoriaId: 'cat-insumos',
    nombreCategoria: 'Abarrotes e Insumos',
    bufferDefaultPct: 0,
    mermaDespiecePct: 0,
    mermaDescongelacionGlaseoPct: 0,
    mermaCocinaViscerasPct: 0,
    descripcion: 'Empaques, hielo, condimentos y salsas sin merma biológica',
  },
];

export const DEFAULT_PRICING_GLOBAL_CONFIG: PricingGlobalConfig = {
  id: 'cfg-pricing-global',
  version: '1.0.0',
  ultimaActualizacion: new Date().toISOString(),
  actualizadoPorUsuarioId: 'system-seed',
  redondeoEnteroCop: true,
  bloquearVentaBajoCosto: true,
  canales: {
    margenPosPct: 40,
    margenRestaurantePct: 30,
    margenMayoristaPct: 15,
    margenMinimoSeguridadPct: 10,
  },
  categoriasWaste: DEFAULT_CATEGORY_WASTE_CONFIGS,
};

function getDefaultConfig(): PricingGlobalConfig {
  return JSON.parse(JSON.stringify(DEFAULT_PRICING_GLOBAL_CONFIG));
}

export const pricingConfigService = {
  /**
   * Retorna una copia fresca de la configuración por defecto.
   */
  getDefaultGlobalConfig(): PricingGlobalConfig {
    return getDefaultConfig();
  },

  /**
   * Carga la configuración global desde localDb, o la inicializa con defaults si no existe.
   */
  getPricingGlobalConfig(): PricingGlobalConfig {
    try {
      const stored = load<PricingGlobalConfig>('pricing_global_config', DEFAULT_PRICING_GLOBAL_CONFIG);
      if (stored) {
        const parsed = PricingGlobalConfigSchema.safeParse(stored);
        if (parsed.success) {
          return parsed.data;
        }
      }
    } catch {
      // Si falla lectura, fallback seguro a defaults
    }

    // Inicializar defaults
    const defaultConfig = getDefaultConfig();
    this.savePricingGlobalConfig(defaultConfig, 'system-init');
    return defaultConfig;
  },

  /**
   * Guarda y valida la configuración global en localDb.
   */
  savePricingGlobalConfig(config: PricingGlobalConfig, usuarioId: string): { success: boolean; data?: PricingGlobalConfig; error?: string } {
    const payload = {
      ...config,
      ultimaActualizacion: new Date().toISOString(),
      actualizadoPorUsuarioId: usuarioId,
    };

    const validation = PricingGlobalConfigSchema.safeParse(payload);
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.errors.map((e) => e.message).join(', '),
      };
    }

    try {
      save('pricing_global_config', validation.data);
      return { success: true, data: validation.data };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Error al persistir configuración en localDb' };
    }
  },

  /**
   * Resuelve el buffer efectivo de un producto resolviendo la jerarquía bimodal:
   * 1. Buffer individual del producto si está definido (`bufferPersonalizado != null`).
   * 2. Buffer de la categoría según la configuración activa.
   * 3. Fallback seguro a 0%.
   */
  resolveEffectiveBuffer(
    categoriaId: string,
    bufferPersonalizado: number | null | undefined,
    config?: PricingGlobalConfig
  ): number {
    const activeConfig = config || this.getPricingGlobalConfig();

    if (typeof bufferPersonalizado === 'number' && !isNaN(bufferPersonalizado)) {
      return Math.max(0, Math.min(50, bufferPersonalizado));
    }

    const catConfig = activeConfig.categoriasWaste.find(
      (c) => c.categoriaId.toLowerCase() === categoriaId.toLowerCase()
    );

    if (catConfig && typeof catConfig.bufferDefaultPct === 'number') {
      return catConfig.bufferDefaultPct;
    }

    return 0;
  },
};
