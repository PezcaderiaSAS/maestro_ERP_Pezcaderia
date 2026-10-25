import type { PricingGlobalConfig } from '../../types/pricingEngine.types';

export interface TariffSubmissionInput {
  costoAjustadoCop: number;
  tarifas: {
    POS: number;
    RESTAURANTE_HORECA: number;
    MAYORISTA: number;
  };
  globalConfig: PricingGlobalConfig;
  userRole?: string;
}

export interface TariffSubmissionValidationResult {
  valido: boolean;
  bloqueos: string[];
  advertencias: string[];
  requiereAuditoria: boolean;
}

/**
 * Servicio de Auditoría de Márgenes y Control de Acceso (RBAC)
 */
export const marginAuditService = {
  /**
   * Valida una propuesta de tarifas antes de persistir o publicar en catálogo.
   */
  validateTariffSubmission(input: TariffSubmissionInput): TariffSubmissionValidationResult {
    const bloqueos: string[] = [];
    const advertencias: string[] = [];
    let requiereAuditoria = false;

    const { costoAjustadoCop, tarifas, globalConfig, userRole = 'vendedor' } = input;
    const esAdmin = userRole.toLowerCase() === 'admin' || userRole.toLowerCase() === 'administrador';
    const minSeguridad = globalConfig.canales.margenMinimoSeguridadPct;

    const canales = [
      { key: 'POS', nombre: 'POS', precio: tarifas.POS },
      { key: 'RESTAURANTE_HORECA', nombre: 'HORECA', precio: tarifas.RESTAURANTE_HORECA },
      { key: 'MAYORISTA', nombre: 'MAYORISTA', precio: tarifas.MAYORISTA },
    ];

    for (const c of canales) {
      // 1. Bloqueo estricto de venta bajo costo
      if (c.precio < costoAjustadoCop) {
        bloqueos.push(`Venta bajo costo detectada en canal ${c.nombre}`);
      }

      // 2. Control de margen mínimo de seguridad
      const margenNetoPct =
        c.precio > 0
          ? ((c.precio - costoAjustadoCop) / c.precio) * 100
          : 0;

      if (c.precio >= costoAjustadoCop && margenNetoPct < minSeguridad) {
        if (!esAdmin) {
          bloqueos.push(
            `El canal ${c.nombre} tiene un margen del ${margenNetoPct.toFixed(1)}%. Requiere autorización de usuario ADMIN para márgenes por debajo del ${minSeguridad}%.`
          );
        } else {
          advertencias.push(
            `Canal ${c.nombre} autorizado con margen reducido (${margenNetoPct.toFixed(1)}%).`
          );
          requiereAuditoria = true;
        }
      }
    }

    return {
      valido: bloqueos.length === 0,
      bloqueos,
      advertencias,
      requiereAuditoria,
    };
  },
};
