/**
 * ============================================================================
 * LA PEZCADERIA ERP — EXPORTADOR GERENCIAL CSV OTIF
 * ============================================================================
 * Genera archivos CSV con BOM UTF-8 y delimitador ';' para compatibilidad nativa
 * con Microsoft Excel en español (Colombia).
 */

import type { OtifStopRecord } from '../types/otif.types';

export const otifCsvExporter = {
  /**
   * Genera el contenido de texto CSV con BOM UTF-8 y delimitador punto y coma.
   */
  generarCsvString(paradas: OtifStopRecord[]): string {
    const BOM = '\uFEFF';
    const delimitador = ';';

    const headers = [
      'Pedido',
      'Cliente',
      'Conductor',
      'Placa',
      'Zona',
      'Manifiesto',
      'Jornada',
      'Hora Pactada',
      'Hora Llegada',
      'Hora Entrega',
      'Tiempo Transito Min',
      'Tiempo Atencion Min',
      'OTIF Conforme',
      'On Time',
      'In Full',
      'SLA Cumplimiento',
      'Temp Salida C',
      'Temp Entrega C',
      'Semaforo Frio',
      'Forma Pago',
      'Monto Cobrado COP',
      'Estado Entrega',
      'Tiene Devolucion',
      'Kilos Despachados',
      'Kilos Devueltos',
    ];

    const escapeValue = (val: unknown): string => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = paradas.map((p) => [
      escapeValue(p.numeroPedido),
      escapeValue(p.clienteNombre),
      escapeValue(p.conductorNombre),
      escapeValue(p.vehiculoPlaca),
      escapeValue(p.zonaRuta),
      escapeValue(p.numeroManifiesto),
      escapeValue(p.jornadaPactada || ''),
      escapeValue(p.horaLimitePactada ? new Date(p.horaLimitePactada).toLocaleTimeString() : ''),
      escapeValue(p.horaLlegadaSitio ? new Date(p.horaLlegadaSitio).toLocaleTimeString() : ''),
      escapeValue(p.horaEntregaEfectiva ? new Date(p.horaEntregaEfectiva).toLocaleTimeString() : ''),
      p.tiempoTransitoMinutos || 0,
      p.tiempoAtencionMinutos || 0,
      p.isOtif ? 'SI' : 'NO',
      p.onTime ? 'SI' : 'NO',
      p.inFull ? 'SI' : 'NO',
      escapeValue(p.cumplimientoSLA),
      p.temperaturaSalidaCelsius !== undefined ? p.temperaturaSalidaCelsius : '',
      p.temperaturaEntregaCelsius !== undefined ? p.temperaturaEntregaCelsius : '',
      escapeValue(p.estadoCadenaFrio),
      escapeValue(p.formaPago || ''),
      p.montoCobrado || 0,
      escapeValue(p.estadoEntrega),
      p.tieneDevolucion ? 'SI' : 'NO',
      p.totalKilosDespachados || 0,
      p.totalKilosDevueltos || 0,
    ]);

    const lineas = [
      headers.join(delimitador),
      ...rows.map((r) => r.join(delimitador)),
    ];

    return BOM + lineas.join('\r\n');
  },

  /**
   * Dispara la descarga del archivo CSV en el navegador cliente.
   */
  descargarExcelCsv(paradas: OtifStopRecord[], nombreArchivo = 'Auditoria_Logistica_OTIF.csv'): void {
    if (!paradas || paradas.length === 0) {
      return;
    }

    const csvContent = this.generarCsvString(paradas);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.setAttribute('href', url);
    link.setAttribute('download', nombreArchivo);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },
};
