import { describe, it, expect } from 'vitest';
import {
  calcularCambioEfectivo,
  calcularTotalConteoFisico,
  evaluarDescuadreArqueo,
  DENOMINACIONES_COLOMBIA,
  BILLETES_RAPIDOS_SUGERIDOS,
  AperturaTurnoInputSchema,
  RetiroParcialInputSchema,
  CierreTurnoInputSchema,
} from '../../packages/validation-schemas/src/posCashEngine.schema';

describe('Motor de Caja POS - Cálculos Deterministas y Validaciones', () => {
  describe('1. Cálculo de Cambio / Vuelto en Efectivo', () => {
    it('calcula correctamente el cambio cuando el efectivo recibido es superior', () => {
      const res = calcularCambioEfectivo(32500, 50000);
      expect(res.valido).toBe(true);
      expect(res.cambio).toBe(17500);
      expect(res.faltante).toBe(0);
    });

    it('identifica pago exacto con cambio en cero', () => {
      const res = calcularCambioEfectivo(45000, 45000);
      expect(res.valido).toBe(true);
      expect(res.cambio).toBe(0);
      expect(res.faltante).toBe(0);
    });

    it('bloquea y calcula faltante cuando el efectivo es inferior al total', () => {
      const res = calcularCambioEfectivo(50000, 40000);
      expect(res.valido).toBe(false);
      expect(res.cambio).toBe(0);
      expect(res.faltante).toBe(10000);
    });
  });

  describe('2. Denominaciones Colombianas y Conteo Físico', () => {
    it('contiene las 11 especies oficiales (6 billetes y 5 monedas)', () => {
      expect(DENOMINACIONES_COLOMBIA).toHaveLength(11);
      const billetes = DENOMINACIONES_COLOMBIA.filter(d => d.tipo === 'BILLETE');
      const monedas = DENOMINACIONES_COLOMBIA.filter(d => d.tipo === 'MONEDA');
      expect(billetes).toHaveLength(6);
      expect(monedas).toHaveLength(5);
    });

    it('ofrece billetes rápidos sugeridos para mostrador', () => {
      expect(BILLETES_RAPIDOS_SUGERIDOS).toEqual([10000, 20000, 50000, 100000]);
    });

    it('calcula la sumatoria física exacta a partir del desglose de monedas y billetes', () => {
      const conteo = [
        { valor: 100000, etiqueta: '$100.000', tipo: 'BILLETE' as const, cantidad: 5 }, // 500.000
        { valor: 50000,  etiqueta: '$50.000',  tipo: 'BILLETE' as const, cantidad: 4 }, // 200.000
        { valor: 20000,  etiqueta: '$20.000',  tipo: 'BILLETE' as const, cantidad: 10 }, // 200.000
        { valor: 500,    etiqueta: '$500',     tipo: 'MONEDA' as const, cantidad: 20 }, // 10.000
      ];
      const total = calcularTotalConteoFisico(conteo);
      expect(total).toBe(910000);
    });
  });

  describe('3. Evaluación de Descuadres y Umbral de Tolerancia', () => {
    it('clasifica como EXACTO cuando no hay diferencia', () => {
      const evalRes = evaluarDescuadreArqueo(1000000, 1000000, 5000);
      expect(evalRes.tipo).toBe('EXACTO');
      expect(evalRes.diferencia).toBe(0);
      expect(evalRes.requiereAutorizacion).toBe(false);
    });

    it('clasifica como TOLERANCIA_REDONDEO cuando la diferencia es menor o igual a $5.000', () => {
      const evalPos = evaluarDescuadreArqueo(1000000, 1003000, 5000);
      expect(evalPos.tipo).toBe('TOLERANCIA_REDONDEO');
      expect(evalPos.diferencia).toBe(3000);
      expect(evalPos.requiereAutorizacion).toBe(false);

      const evalNeg = evaluarDescuadreArqueo(1000000, 998000, 5000);
      expect(evalNeg.tipo).toBe('TOLERANCIA_REDONDEO');
      expect(evalNeg.diferencia).toBe(-2000);
      expect(evalNeg.requiereAutorizacion).toBe(false);
    });

    it('clasifica como FALTANTE y exige autorización si el descuadre supera la tolerancia negativa', () => {
      const evalFaltante = evaluarDescuadreArqueo(1000000, 950000, 5000);
      expect(evalFaltante.tipo).toBe('FALTANTE');
      expect(evalFaltante.diferencia).toBe(-50000);
      expect(evalFaltante.requiereAutorizacion).toBe(true);
    });

    it('clasifica como SOBRANTE y exige justificación si el descuadre supera la tolerancia positiva', () => {
      const evalSobrante = evaluarDescuadreArqueo(1000000, 1050000, 5000);
      expect(evalSobrante.tipo).toBe('SOBRANTE');
      expect(evalSobrante.diferencia).toBe(50000);
      expect(evalSobrante.requiereAutorizacion).toBe(true);
    });
  });

  describe('4. Validación de Esquemas Zod para Entradas de Turno', () => {
    it('valida exitosamente la apertura de turno', () => {
      const input = {
        empresa_id: '00000000-0000-0000-0000-000000000001',
        caja_id: '00000000-0000-0000-0000-000000000010',
        cajero_id: '00000000-0000-0000-0000-000000000000',
        cajero_nombre: 'Carlos Cajero',
        base_inicial: 200000,
      };
      const parsed = AperturaTurnoInputSchema.safeParse(input);
      expect(parsed.success).toBe(true);
    });

    it('rechaza retiro parcial con monto menor o igual a cero', () => {
      const input = {
        empresa_id: '00000000-0000-0000-0000-000000000001',
        turno_id: '00000000-0000-0000-0000-000000000010',
        monto_retiro: 0,
        motivo: 'Alivio por exceso de efectivo en gaveta',
        cajero_nombre: 'Carlos Cajero',
        supervisor_nombre: 'Yurgen Moreno',
      };
      const parsed = RetiroParcialInputSchema.safeParse(input);
      expect(parsed.success).toBe(false);
    });

    it('valida cierre de turno con conteo de denominaciones', () => {
      const input = {
        empresa_id: '00000000-0000-0000-0000-000000000001',
        turno_id: '00000000-0000-0000-0000-000000000010',
        denominaciones: [
          { valor: 50000, etiqueta: '$50.000', tipo: 'BILLETE' as const, cantidad: 10 },
          { valor: 20000, etiqueta: '$20.000', tipo: 'BILLETE' as const, cantidad: 5 },
        ],
        justificacion: 'Turno tarde cerrado sin incidentes',
      };
      const parsed = CierreTurnoInputSchema.safeParse(input);
      expect(parsed.success).toBe(true);
    });
  });
});
