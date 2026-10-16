// src/services/resolucionService.ts
import {
  useResolucionStore,
  calcularDiagnosticoResolucion,
} from '../store/useResolucionStore';
import type {
  ResolucionVenta,
  TipoResolucion,
  ResolucionDiagnostico,
} from '../types/resoluciones.types';

export interface ConsecutivoConsumido {
  numero: number;
  consecutivoCompleto: string;
  resolucionId: string;
  prefijo: string;
  siigoDocumentId?: number;
}

class ResolucionService {
  /**
   * Obtiene la resolución activa predeterminada para un tipo dado
   */
  getResolucionPredeterminada(tipo: TipoResolucion): ResolucionVenta | undefined {
    return useResolucionStore.getState().getResolucionPredeterminada(tipo);
  }

  /**
   * Obtiene una resolución por su identificador
   */
  getResolucionById(id: string): ResolucionVenta | undefined {
    return useResolucionStore.getState().getResolucionById(id);
  }

  /**
   * Valida que una resolución esté activa, no vencida y con rango disponible
   */
  validarResolucionDisponible(res: ResolucionVenta): void {
    if (!res.activa) {
      throw new Error(`La resolución "${res.nombre}" (${res.prefijo}) se encuentra inactiva.`);
    }

    const diag = calcularDiagnosticoResolucion(res);

    if (diag.isVencida) {
      throw new Error(
        `La resolución fiscal "${res.nombre}" (${res.prefijo}) se encuentra vencida desde el ${res.fechaVencimiento}. Requiere actualización de resolución DIAN.`
      );
    }

    if (diag.isAgotada) {
      throw new Error(
        `Rango de numeración agotado para la resolución "${res.nombre}" (${res.prefijo}). Consecutivo actual: ${res.consecutivoActual}, rango máximo: ${res.rangoHasta}.`
      );
    }
  }

  /**
   * Obtiene el diagnóstico y estado de alertas de una resolución
   */
  obtenerDiagnostico(resolucionId: string): ResolucionDiagnostico | null {
    const res = this.getResolucionById(resolucionId);
    if (!res) return null;
    return calcularDiagnosticoResolucion(res);
  }

  /**
   * Sincroniza el punto de partida con el último consecutivo emitido en Siigo Nube
   */
  sincronizarUltimoConsecutivoSiigo(resolucionId: string, nuevoNumero: number): void {
    const res = this.getResolucionById(resolucionId);
    if (!res) {
      throw new Error(`Resolución no encontrada: ${resolucionId}`);
    }
    useResolucionStore.getState().setUltimoConsecutivoSiigo(resolucionId, nuevoNumero);
  }

  /**
   * Consume atómicamente el siguiente consecutivo de control interno operativo
   */
  consumirConsecutivoInterno(resolucionId?: string): ConsecutivoConsumido {
    const store = useResolucionStore.getState();
    const res = resolucionId
      ? store.getResolucionById(resolucionId)
      : store.getResolucionPredeterminada('CONTROL_INTERNO');

    if (!res) {
      throw new Error('No se encontró una resolución de Control Interno activa configurada.');
    }

    this.validarResolucionDisponible(res);

    const siguienteNumero = res.consecutivoActual + 1;
    store.updateResolucion(res.id, { consecutivoActual: siguienteNumero });

    return {
      numero: siguienteNumero,
      consecutivoCompleto: `${res.prefijo}-${siguienteNumero}`,
      resolucionId: res.id,
      prefijo: res.prefijo,
      siigoDocumentId: res.siigoDocumentId,
    };
  }

  /**
   * Consume atómicamente el siguiente consecutivo fiscal DIAN para Siigo Nube
   */
  consumirConsecutivoFiscal(resolucionId?: string): ConsecutivoConsumido {
    const store = useResolucionStore.getState();
    const res = resolucionId
      ? store.getResolucionById(resolucionId)
      : store.getResolucionPredeterminada('FACTURA_ELECTRONICA_DIAN');

    if (!res) {
      throw new Error('No se encontró una resolución de Facturación Electrónica DIAN activa configurada.');
    }

    this.validarResolucionDisponible(res);

    const siguienteNumero = res.consecutivoActual + 1;
    store.updateResolucion(res.id, { consecutivoActual: siguienteNumero });

    return {
      numero: siguienteNumero,
      consecutivoCompleto: `${res.prefijo}-${siguienteNumero}`,
      resolucionId: res.id,
      prefijo: res.prefijo,
      siigoDocumentId: res.siigoDocumentId,
    };
  }
}

export const resolucionService = new ResolucionService();
