import {
  generarPdfContratoAlquiler,
  generarPdfCertificadoCustodia,
  generarPdfActaRecepcion,
  generarPdfActaDespacho,
  generarPdfActaRecepcionMultiple,
  generarPdfActaDespachoMultiple,
  generarActaRecepcionConsolidadaPdf,
  generarActaDespachoConsolidadaPdf,
  generarPdfReciboPagoAlquiler,
  generarPdfTicketTermicoAlquiler,
} from './coldStoragePdf';

export * from './coldStoragePdf';

/**
 * Servicio fachada unificado para la generación de documentos PDF de Cuartos Fríos y Custodia (WMS 3PL).
 * Desacoplado bajo principios SOLID / SRP en submódulos especializados atómicos.
 */
export const coldStoragePdfService = {
  /**
   * 1. Contrato de Alquiler de Espacio Frigorífico
   */
  generarPdfContratoAlquiler,

  /**
   * 2. Acta de Recepción e Ingreso en Custodia (1 a 1)
   */
  generarPdfActaRecepcion,

  /**
   * 3. Acta de Despacho y Salida de Custodia (1 a 1)
   */
  generarPdfActaDespacho,

  /**
   * 4. Certificado Oficial de Existencias en Custodia
   */
  generarPdfCertificadoCustodia,

  /**
   * 5. Recibo Oficial de Caja y Paz y Salvo (Formato Carta Ejecutivo)
   */
  generarPdfReciboPagoAlquiler,

  /**
   * 6. Ticket Térmico de Caja POS (Formato Rollo 80mm)
   */
  generarPdfTicketTermicoAlquiler,

  /**
   * 7. Acta Oficial Consolidada de Recepción e Ingreso con Múltiples Partidas
   */
  generarPdfActaRecepcionMultiple,

  /**
   * 8. Acta Oficial Consolidada de Despacho y Salida para Múltiples Lotes
   */
  generarPdfActaDespachoMultiple,

  /**
   * Alias de compatibilidad para Acta Consolidada de Recepción
   */
  generarActaRecepcionConsolidadaPdf,

  /**
   * Alias de compatibilidad para Acta Consolidada de Despacho
   */
  generarActaDespachoConsolidadaPdf,
};
