import { describe, it, expect } from 'vitest';
import {
  DatosFurgonMuelleSchema,
  PesadaCanastillaMuelleSchema,
  LiquidacionCompraMuelleSchema,
  calcularPesajeMuelleNeto,
  evaluarSemaforoTermico,
  calcularLiquidacionTotalMuelle
} from '../../packages/validation-schemas/src/dockPurchasesReceiving.schema';

describe('TASK-022-01: dockPurchasesReceiving.schema - Validación Zod y Metrología', () => {
  describe('1. Semáforo Térmico de Inocuidad (HACCP)', () => {
    it('Evalúa correctamente pescado fresco: Óptimo (<= 4.0°C), Precaución (4.1°C a 7.0°C) y Alerta Crítica (> 7.0°C)', () => {
      expect(evaluarSemaforoTermico(2.5, 'FRESCO')).toEqual({
        estado: 'OPTIMO',
        color: 'emerald',
        permitido: true,
        mensaje: expect.stringMatching(/óptim/i)
      });

      expect(evaluarSemaforoTermico(4.0, 'FRESCO')).toEqual({
        estado: 'OPTIMO',
        color: 'emerald',
        permitido: true,
        mensaje: expect.stringMatching(/óptim/i)
      });


      expect(evaluarSemaforoTermico(5.5, 'FRESCO')).toEqual({
        estado: 'PRECAUCION',
        color: 'amber',
        permitido: true,
        mensaje: expect.stringContaining('Precaución')
      });

      expect(evaluarSemaforoTermico(7.5, 'FRESCO')).toEqual({
        estado: 'ALERTA_CRITICA',
        color: 'rose',
        permitido: false,
        mensaje: expect.stringContaining('Peligro')
      });
    });

    it('Evalúa correctamente producto congelado: Óptimo (<= -18°C), Aceptable (-17.9°C a -15°C) y Crítico (> -15°C)', () => {
      expect(evaluarSemaforoTermico(-20, 'CONGELADO')).toMatchObject({
        estado: 'OPTIMO',
        permitido: true
      });

      expect(evaluarSemaforoTermico(-16, 'CONGELADO')).toMatchObject({
        estado: 'PRECAUCION',
        permitido: true
      });

      expect(evaluarSemaforoTermico(-10, 'CONGELADO')).toMatchObject({
        estado: 'ALERTA_CRITICA',
        permitido: false
      });
    });
  });

  describe('2. Datos de Furgón y Cadena de Frío (DatosFurgonMuelleSchema)', () => {
    it('Valida exitosamente un furgón con datos sanitarios completos', () => {
      const validFurgon = {
        proveedorId: 'PROV-001',
        proveedorNombre: 'Pesquera del Pacífico S.A.S.',
        placaVehiculo: 'WKL-482',
        conductorNombre: 'Carlos Andrés Benítez',
        temperaturaCava: 2.8,
        fechaFaena: '2026-10-18',
        tipoConservacion: 'FRESCO',
        loteOrigenManual: 'GUIA-PAC-9912'
      };

      const result = DatosFurgonMuelleSchema.safeParse(validFurgon);
      expect(result.success).toBe(true);
    });

    it('Rechaza datos con placa o conductor vacíos o temperatura fuera de rango fisiológico', () => {
      const invalidFurgon = {
        proveedorId: '',
        proveedorNombre: '',
        placaVehiculo: '12',
        conductorNombre: '',
        temperaturaCava: 65,
        fechaFaena: 'fecha-invalida',
        tipoConservacion: 'FRESCO'
      };

      const result = DatosFurgonMuelleSchema.safeParse(invalidFurgon);
      expect(result.success).toBe(false);
      if (!result.success) {
        const errorFields = result.error.errors.map(e => e.path[0]);
        expect(errorFields).toContain('proveedorId');
        expect(errorFields).toContain('placaVehiculo');
        expect(errorFields).toContain('conductorNombre');
        expect(errorFields).toContain('temperaturaCava');
        expect(errorFields).toContain('fechaFaena');
      }
    });
  });

  describe('3. Función Metrológica Pura: calcularPesajeMuelleNeto', () => {
    it('Calcula exactamente la tara invariable de 2.0 kg por canastilla y el descuento de hielo', () => {
      // 4 canastillas * 2.0 kg = 8.0 kg tara.
      // Peso bruto = 100.0 kg -> Peso con hielo = 92.0 kg.
      // Descuento 5% de hielo: 92.0 * 0.05 = 4.60 kg.
      // Peso neto real = 92.0 - 4.60 = 87.40 kg.
      const pesaje = calcularPesajeMuelleNeto(100.0, 4, 5, 2.0);

      expect(pesaje.pesoTaraTotalKg).toBe(8.0);
      expect(pesaje.pesoConHieloKg).toBe(92.0);
      expect(pesaje.descuentoHieloKg).toBe(4.6);
      expect(pesaje.pesoNetoRealKg).toBe(87.4);
    });

    it('Maneja pesaje sin hielo (0% de hielo)', () => {
      // 5 canastillas * 2.0 kg = 10.0 kg tara.
      // Peso bruto = 150.0 kg -> Peso con hielo = 140.0 kg.
      // 0% hielo -> Descuento = 0.0 kg, Neto = 140.0 kg.
      const pesaje = calcularPesajeMuelleNeto(150.0, 5, 0, 2.0);

      expect(pesaje.pesoTaraTotalKg).toBe(10.0);
      expect(pesaje.pesoConHieloKg).toBe(140.0);
      expect(pesaje.descuentoHieloKg).toBe(0.0);
      expect(pesaje.pesoNetoRealKg).toBe(140.0);
    });

    it('Aplica tope de seguridad de máximo 15% de hielo según norma comercial', () => {
      // Si operario ingresa 25% por error, se restringe a 15%
      const pesaje = calcularPesajeMuelleNeto(100.0, 1, 25, 2.0);
      // Tara 2.0 -> con hielo 98.0 kg -> 15% de 98.0 = 14.7 kg -> Neto = 83.3 kg
      expect(pesaje.descuentoHieloKg).toBe(14.7);
      expect(pesaje.pesoNetoRealKg).toBe(83.3);
    });
  });

  describe('4. Validación de Pesada Individual: PesadaCanastillaMuelleSchema', () => {
    it('Aprueba una pesada válida con peso bruto superior a la tara de las canastillas', () => {
      const pesada = {
        id: 'pes-001',
        productoId: 'prod-mojarra-roja',
        productoNombre: 'Mojarra Roja Entera',
        cantidadCanastillas: 3,
        pesoBrutoKg: 75.5,
        taraCanastillaKg: 2.0,
        porcentajeHielo: 5,
        precioKgAcordado: 14500
      };

      const result = PesadaCanastillaMuelleSchema.safeParse(pesada);
      expect(result.success).toBe(true);
    });

    it('Rechaza si el peso bruto es menor o igual a la tara total de las canastillas', () => {
      const pesadaInvalida = {
        id: 'pes-002',
        productoId: 'prod-mojarra-roja',
        productoNombre: 'Mojarra Roja Entera',
        cantidadCanastillas: 4, // 4 * 2.0 = 8.0 kg de tara
        pesoBrutoKg: 7.5,      // 7.5 <= 8.0 kg -> Imposible físicamente
        taraCanastillaKg: 2.0,
        porcentajeHielo: 5,
        precioKgAcordado: 14500
      };

      const result = PesadaCanastillaMuelleSchema.safeParse(pesadaInvalida);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('superior al peso de las canastillas');
      }
    });
  });

  describe('5. Liquidación Financiera en COP: calcularLiquidacionTotalMuelle', () => {
    it('Calcula el total de la compra redondeando a número entero en pesos COP (Regla SPEC-009)', () => {
      const partidas = [
        { pesoNetoKg: 87.45, precioKg: 18500 }, // 1.617.825 COP
        { pesoNetoKg: 32.18, precioKg: 24700 }  // 794.846 COP
      ];

      const liquidacion = calcularLiquidacionTotalMuelle(partidas);
      expect(liquidacion.totalKilosNetos).toBe(119.63);
      expect(liquidacion.totalCompraCOP).toBe(2412671);
      expect(Number.isInteger(liquidacion.totalCompraCOP)).toBe(true);
    });

    it('Valida LiquidacionCompraMuelleSchema con crédito y días de plazo', () => {
      const liquidacionCredito = {
        formaPago: 'CREDITO',
        diasCredito: 15,
        totalKilosNetos: 119.63,
        totalCompraCOP: 2412671,
        observaciones: 'Pago quincenal acordado'
      };

      const result = LiquidacionCompraMuelleSchema.safeParse(liquidacionCredito);
      expect(result.success).toBe(true);
    });

    it('Rechaza forma de pago CREDITO si los días de crédito no están definidos o son <= 0', () => {
      const liquidacionInvalida = {
        formaPago: 'CREDITO',
        diasCredito: 0,
        totalKilosNetos: 50.0,
        totalCompraCOP: 500000
      };

      const result = LiquidacionCompraMuelleSchema.safeParse(liquidacionInvalida);
      expect(result.success).toBe(false);
    });
  });
});
