// src/tests/resolucionesConsecutivoDual.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useResolucionStore } from '../store/useResolucionStore';
import { resolucionService } from '../services/resolucionService';

describe('SPEC-020: Servicio Central de Resoluciones y Consecutivo Dual', () => {
  beforeEach(() => {
    useResolucionStore.getState().resetStore();
  });

  it('1. Debe generar consecutivo interno operativo autoincremental inmutable', () => {
    const resInterna = resolucionService.getResolucionPredeterminada('CONTROL_INTERNO');
    expect(resInterna).toBeDefined();
    expect(resInterna?.prefijo).toBe('VTA');
    expect(resInterna?.consecutivoActual).toBe(100);

    // Primer consumo
    const consecutivo1 = resolucionService.consumirConsecutivoInterno();
    expect(consecutivo1.numero).toBe(101);
    expect(consecutivo1.consecutivoCompleto).toBe('VTA-101');

    // Segundo consumo
    const consecutivo2 = resolucionService.consumirConsecutivoInterno();
    expect(consecutivo2.numero).toBe(102);
    expect(consecutivo2.consecutivoCompleto).toBe('VTA-102');

    // Verificar persistencia en store
    const storeRes = useResolucionStore.getState().getResolucionById(resInterna!.id);
    expect(storeRes?.consecutivoActual).toBe(102);
  });

  it('2. Debe generar consecutivo fiscal DIAN empatado con el número actual de Siigo Nube', () => {
    const resDian = resolucionService.getResolucionPredeterminada('FACTURA_ELECTRONICA_DIAN');
    expect(resDian).toBeDefined();
    expect(resDian?.prefijo).toBe('FEVP');
    expect(resDian?.consecutivoActual).toBe(1540); // Base configurada en Siigo
    expect(resDian?.siigoDocumentId).toBe(2458);

    // Consumir el siguiente consecutivo para Siigo
    const consecutivoFiscal = resolucionService.consumirConsecutivoFiscal();
    expect(consecutivoFiscal.numero).toBe(1541);
    expect(consecutivoFiscal.consecutivoCompleto).toBe('FEVP-1541');
    expect(consecutivoFiscal.siigoDocumentId).toBe(2458);

    const storeRes = useResolucionStore.getState().getResolucionById(resDian!.id);
    expect(storeRes?.consecutivoActual).toBe(1541);
  });

  it('3. Debe permitir al administrador actualizar el último consecutivo emitido en Siigo', () => {
    const resDian = resolucionService.getResolucionPredeterminada('FACTURA_ELECTRONICA_DIAN');
    expect(resDian).toBeDefined();

    // Sincronizar manualmente que en Siigo ya van por la 2050
    resolucionService.sincronizarUltimoConsecutivoSiigo(resDian!.id, 2050);

    const resActualizada = useResolucionStore.getState().getResolucionById(resDian!.id);
    expect(resActualizada?.consecutivoActual).toBe(2050);

    // El siguiente consumo debe ser 2051
    const siguiente = resolucionService.consumirConsecutivoFiscal();
    expect(siguiente.numero).toBe(2051);
    expect(siguiente.consecutivoCompleto).toBe('FEVP-2051');
  });

  it('4. Debe emitir alertas preventivas de agotamiento de rango cuando falten < 100 números', () => {
    const resDian = resolucionService.getResolucionPredeterminada('FACTURA_ELECTRONICA_DIAN');
    expect(resDian).toBeDefined();

    // Rango hasta 50000. Ajustamos a 49950 (quedan 50 números disponibles)
    resolucionService.sincronizarUltimoConsecutivoSiigo(resDian!.id, 49950);

    const diag = resolucionService.obtenerDiagnostico(resDian!.id);
    expect(diag?.consecutivosRestantes).toBe(50);
    expect(diag?.isAlertaConsecutivos).toBe(true);
    expect(diag?.estadoSemaforo).toBe('PRECAUCION');
  });

  it('5. Debe prevenir el desbordamiento de rango lanzando un error bloqueante', () => {
    const resDian = resolucionService.getResolucionPredeterminada('FACTURA_ELECTRONICA_DIAN');
    expect(resDian).toBeDefined();

    // Ajustamos al límite máximo (50000)
    resolucionService.sincronizarUltimoConsecutivoSiigo(resDian!.id, 50000);

    const diag = resolucionService.obtenerDiagnostico(resDian!.id);
    expect(diag?.isAgotada).toBe(true);
    expect(diag?.estadoSemaforo).toBe('CRITICO');

    // Intentar consumir debe arrojar excepción
    expect(() => {
      resolucionService.consumirConsecutivoFiscal(resDian!.id);
    }).toThrowError(/agotado/i);
  });

  it('6. Debe detectar resolución vencida y bloquear la emisión fiscal', () => {
    // Crear resolución vencida en 2025
    const resVencida = useResolucionStore.getState().addResolucion({
      nombre: 'Resolución Antigua Vencida',
      tipo: 'FACTURA_ELECTRONICA_DIAN',
      prefijo: 'SETP',
      rangoDesde: 1,
      rangoHasta: 1000,
      consecutivoActual: 50,
      fechaVencimiento: '2025-01-01',
      activa: true,
      esPredeterminada: false,
      alertaUmbralConsecutivos: 100,
      alertaUmbralDias: 30,
    });

    const diag = resolucionService.obtenerDiagnostico(resVencida.id);
    expect(diag?.isVencida).toBe(true);
    expect(diag?.estadoSemaforo).toBe('CRITICO');

    expect(() => {
      resolucionService.consumirConsecutivoFiscal(resVencida.id);
    }).toThrowError(/vencida/i);
  });
});
