import { describe, it, expect } from 'vitest';
import {
  validateWeightTolerance,
  validateCalibrePieceWeight,
  calculateCatchWeightTotal,
  B2BOrderLineSpecsSchema,
  CatchWeightConfigSchema,
  PesajeAlistamientoSchema,
  WmsDispatchRemisionSchema
} from '../../packages/validation-schemas/src/b2bDispatch.schema';

describe('B2B Dispatch & Catch Weight Engine - Tests Unitarios', () => {

  describe('1. Algoritmo de Tolerancia de Peso (validateWeightTolerance)', () => {
    it('debe confirmar peso exacto al nominal (0% de variación)', () => {
      const res = validateWeightTolerance(5.0, 5.0, 10);
      expect(res.isWithinTolerance).toBe(true);
      expect(res.variancePercent).toBe(0);
      expect(res.diffKg).toBe(0);
    });

    it('debe aceptar peso dentro del margen positivo (+3.6%)', () => {
      // Nominal: 5 kg, Real: 5.180 kg -> +3.6%
      const res = validateWeightTolerance(5.0, 5.180, 10);
      expect(res.isWithinTolerance).toBe(true);
      expect(res.variancePercent).toBe(3.6);
      expect(res.diffKg).toBe(0.18);
    });

    it('debe aceptar peso dentro del margen negativo (-5.0%)', () => {
      // Nominal: 5 kg, Real: 4.750 kg -> -5.0%
      const res = validateWeightTolerance(5.0, 4.750, 10);
      expect(res.isWithinTolerance).toBe(true);
      expect(res.variancePercent).toBe(-5.0);
      expect(res.diffKg).toBe(-0.25);
    });

    it('debe rechazar peso que excede la tolerancia superior (+15%)', () => {
      // Nominal: 5 kg, Real: 5.750 kg -> +15%
      const res = validateWeightTolerance(5.0, 5.750, 10);
      expect(res.isWithinTolerance).toBe(false);
      expect(res.variancePercent).toBe(15.0);
    });

    it('debe rechazar peso que excede la tolerancia inferior (-14%)', () => {
      // Nominal: 5 kg, Real: 4.300 kg -> -14%
      const res = validateWeightTolerance(5.0, 4.300, 10);
      expect(res.isWithinTolerance).toBe(false);
      expect(res.variancePercent).toBe(-14.0);
    });
  });

  describe('2. Validación Catch Weight Dual de Calibre por Pieza (validateCalibrePieceWeight)', () => {
    it('debe validar exitosamente 5 truchas de 450-500g que pesaron 2.400 kg en total', () => {
      // Caso de negocio: 5 truchas de 450-500g, peso real 2.400 kg -> 480 g/unidad
      const res = validateCalibrePieceWeight(2.400, 5, 450, 500);
      expect(res.isWithinCalibre).toBe(true);
      expect(res.pesoPromedioGramos).toBe(480);
      expect(res.motivo).toBeUndefined();
    });

    it('debe rechazar cuando el peso promedio está por debajo del calibre mínimo', () => {
      // 5 truchas que pesaron 2.100 kg -> 420 g/unidad (mínimo solicitado 450g)
      const res = validateCalibrePieceWeight(2.100, 5, 450, 500);
      expect(res.isWithinCalibre).toBe(false);
      expect(res.pesoPromedioGramos).toBe(420);
      expect(res.motivo).toContain('por debajo del calibre mínimo (450g)');
    });

    it('debe rechazar cuando el peso promedio excede el calibre máximo', () => {
      // 5 truchas que pesaron 2.700 kg -> 540 g/unidad (máximo solicitado 500g)
      const res = validateCalibrePieceWeight(2.700, 5, 450, 500);
      expect(res.isWithinCalibre).toBe(false);
      expect(res.pesoPromedioGramos).toBe(540);
      expect(res.motivo).toContain('excede el calibre máximo (500g)');
    });

    it('debe calcular el total facturado exacto por peso real (2.4 kg * $35.000 = $84.000)', () => {
      const total = calculateCatchWeightTotal(2.400, 35000);
      expect(total).toBe(84000);
    });
  });

  describe('3. Esquemas de Especificaciones B2B y Catch Weight (Zod)', () => {
    it('debe validar especificaciones de corte y empaque', () => {
      const validSpecs = {
        corte: 'filete_sin_piel' as const,
        empaque: 'vacio' as const,
        temperaturaObjetivoC: 2.0,
        notasAlistamiento: 'Empacar en bandejas de 500g rotuladas para Restaurante Barú'
      };
      const parsed = B2BOrderLineSpecsSchema.parse(validSpecs);
      expect(parsed.corte).toBe('filete_sin_piel');
      expect(parsed.empaque).toBe('vacio');
      expect(parsed.temperaturaObjetivoC).toBe(2.0);
    });

    it('debe validar configuración de venta Catch Weight en pedido del vendedor', () => {
      const validCatchWeight = {
        modalidad: 'CATCH_WEIGHT_PIEZAS' as const,
        piezasSolicitadas: 5,
        calibreMinGramos: 450,
        calibreMaxGramos: 500,
        pesoEstimadoNominalKg: 2.375
      };
      const parsed = CatchWeightConfigSchema.parse(validCatchWeight);
      expect(parsed.piezasSolicitadas).toBe(5);
    });

    it('debe fallar si modalidad es CATCH_WEIGHT_PIEZAS pero no se especifican piezas', () => {
      const invalidCatchWeight = {
        modalidad: 'CATCH_WEIGHT_PIEZAS' as const,
        calibreMinGramos: 450,
        calibreMaxGramos: 500
      };
      expect(() => CatchWeightConfigSchema.parse(invalidCatchWeight)).toThrow(
        /piezas solicitadas/i
      );
    });

    it('debe fallar si calibre mínimo es mayor al calibre máximo', () => {
      const invalidCalibre = {
        modalidad: 'CATCH_WEIGHT_PIEZAS' as const,
        piezasSolicitadas: 5,
        calibreMinGramos: 600,
        calibreMaxGramos: 500
      };
      expect(() => CatchWeightConfigSchema.parse(invalidCalibre)).toThrow(
        /calibre mínimo no puede ser superior/i
      );
    });
  });

  describe('4. Esquema de Pesaje y Packing en Báscula (PesajeAlistamientoSchema)', () => {
    it('debe validar un pesaje completo con lote FEFO y temperatura en frío', () => {
      const validPesaje = {
        lineaPedidoId: 'line-101',
        productoId: 'prod-trucha-arcoiris',
        modalidad: 'CATCH_WEIGHT_PIEZAS' as const,
        pesoNominalKg: 2.375,
        pesoRealKg: 2.400,
        piezasAlistadas: 5,
        calibreMinGramos: 450,
        calibreMaxGramos: 500,
        precioUnitarioPactado: 35000,
        toleranciaPorcentaje: 10,
        temperaturaProductoC: 1.8,
        loteFefo: 'LOTE-TRU-2026-09-001',
        operarioId: 'user-op-carlos',
        observaciones: 'Alistado en cava fría #2'
      };

      const parsed = PesajeAlistamientoSchema.parse(validPesaje);
      expect(parsed.pesoRealKg).toBe(2.400);
      expect(parsed.temperaturaProductoC).toBe(1.8);
      expect(parsed.loteFefo).toBe('LOTE-TRU-2026-09-001');
    });

    it('debe rechazar si falta el lote FEFO o la temperatura está fuera de rango perecedero', () => {
      const invalidPesaje = {
        lineaPedidoId: 'line-101',
        productoId: 'prod-trucha',
        pesoNominalKg: 2.0,
        pesoRealKg: 2.0,
        precioUnitarioPactado: 30000,
        temperaturaProductoC: 28.0, // Muy caliente para pescado fresco
        loteFefo: '', // Vacío
        operarioId: 'user-1'
      };

      expect(() => PesajeAlistamientoSchema.parse(invalidPesaje)).toThrow();
    });
  });

  describe('5. Esquema de Remisión WMS con Código QR (WmsDispatchRemisionSchema)', () => {
    it('debe validar una remisión de despacho completa para el transportador', () => {
      const validRemision = {
        numeroRemision: 'REM-WMS-2026-0089',
        pedidoId: 'ped-b2b-9942',
        clienteId: 'cli-restaurante-mar-azul',
        clienteNombre: 'Restaurante Mar Azul Gourmet',
        direccionEntrega: 'Cra 43A # 18 Sur - 120, El Poblado',
        transportistaNombre: 'Jorge Ramírez',
        placaVehiculo: 'WMA-842',
        temperaturaSalidaC: 2.2,
        tokenQr: 'f8a7e2b1c4d9e0f3a5b6c7d8e9f0a1b2',
        pesoTotalNetoKg: 28.650,
        piezasTotales: 35,
        items: [
          {
            lineaPedidoId: 'line-1',
            productoId: 'prod-trucha',
            nombreProducto: 'Trucha Arcoíris Entera',
            pesoDespachadoKg: 2.400,
            piezasDespachadas: 5,
            precioUnitario: 35000,
            subtotal: 84000,
            loteFefo: 'LOTE-TRU-001',
            temperaturaSalidaC: 2.0,
            corte: 'eviscerado' as const,
            empaque: 'hielo' as const
          },
          {
            lineaPedidoId: 'line-2',
            productoId: 'prod-salmon',
            nombreProducto: 'Filete de Salmón Premium',
            pesoDespachadoKg: 26.250,
            piezasDespachadas: 30,
            precioUnitario: 68000,
            subtotal: 1785000,
            loteFefo: 'LOTE-SAL-004',
            temperaturaSalidaC: 2.2,
            corte: 'filete_sin_piel' as const,
            empaque: 'vacio' as const
          }
        ],
        estado: 'EN_RUTA' as const
      };

      const parsed = WmsDispatchRemisionSchema.parse(validRemision);
      expect(parsed.numeroRemision).toBe('REM-WMS-2026-0089');
      expect(parsed.items.length).toBe(2);
      expect(parsed.pesoTotalNetoKg).toBe(28.650);
      expect(parsed.temperaturaSalidaC).toBe(2.2);
    });
  });

});
