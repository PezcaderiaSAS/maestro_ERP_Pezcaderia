import { describe, it, expect } from 'vitest';
import {
  CadenaFrioBucaramangaSchema,
  PesajeCanastillaBucaramangaSchema,
  RecepcionBucaramangaSchema,
  calcularPesajeCanastilla,
  calcularLiquidacionBucaramanga,
  type PesajeCanastillaBucaramanga,
} from '../../packages/validation-schemas/src/purchasesBucaramanga.schema';

describe('Suite de Validación: Compras & Recepción Bucaramanga (Regla de los 12 Años)', () => {
  describe('1. Cadena de Frío e Inspección Sanitaria (Resolución 776 de 2008)', () => {
    it('debe aceptar pescado fresco dentro del rango seguro (0°C a 2°C / máx 4°C)', () => {
      const validFresco = {
        tipoProducto: 'FRESCO' as const,
        temperaturaFurgonC: 1.8,
        estadoSensorial: 'EXCELENTE' as const,
        inspectorNombre: 'Carlos Bodeguero',
        observaciones: 'Pescado firme, agallas rojas, furgón limpio',
      };
      const result = CadenaFrioBucaramangaSchema.safeParse(validFresco);
      expect(result.success).toBe(true);
    });

    it('debe BLOQUEAR pescado fresco si la temperatura del furgón supera los 4.0°C', () => {
      const invalidFresco = {
        tipoProducto: 'FRESCO' as const,
        temperaturaFurgonC: 5.5,
        estadoSensorial: 'ACEPTABLE' as const,
        inspectorNombre: 'Carlos Bodeguero',
      };
      const result = CadenaFrioBucaramangaSchema.safeParse(invalidFresco);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('BLOQUEO DE FRÍO');
      }
    });

    it('debe aceptar producto congelado a <= -15°C (óptimo -18°C)', () => {
      const validCongelado = {
        tipoProducto: 'CONGELADO' as const,
        temperaturaFurgonC: -19.2,
        estadoSensorial: 'EXCELENTE' as const,
        inspectorNombre: 'Carlos Bodeguero',
      };
      const result = CadenaFrioBucaramangaSchema.safeParse(validCongelado);
      expect(result.success).toBe(true);
    });

    it('debe BLOQUEAR producto congelado si llega a temperatura mayor a -15°C', () => {
      const invalidCongelado = {
        tipoProducto: 'CONGELADO' as const,
        temperaturaFurgonC: -10.0,
        estadoSensorial: 'ACEPTABLE' as const,
        inspectorNombre: 'Carlos Bodeguero',
      };
      const result = CadenaFrioBucaramangaSchema.safeParse(invalidCongelado);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('BLOQUEO DE FRÍO');
      }
    });
  });

  describe('2. Pesaje Granular de Canastillas y Deducción de Tara/Hielo', () => {
    it('debe calcular exactamente la tara plástica y deducción de hielo de una canastilla', () => {
      // 52 kg bruto, 2 kg tara canastilla -> 50 kg pescado+hielo
      // 4% hielo -> 2 kg hielo -> 48 kg neto real
      const { netWeightKg, iceWeightKg } = calcularPesajeCanastilla(52.0, 2.0, 4.0);
      expect(iceWeightKg).toBe(2.0);
      expect(netWeightKg).toBe(48.0);
    });

    it('debe validar un pesaje válido de canastilla', () => {
      const crate: PesajeCanastillaBucaramanga = {
        crateNumber: 1,
        sku: 'PES-CORV-01',
        productName: 'Corvina Entera',
        crateTareKg: 2.0,
        grossWeightKg: 32.5,
        iceDeductionPct: 3.0,
        unitCostOriginKg: 22000,
        warehouseId: 'bodega-cava-1',
        shelfLifeDays: 5,
      };
      const result = PesajeCanastillaBucaramangaSchema.safeParse(crate);
      expect(result.success).toBe(true);
    });

    it('debe rechazar la canastilla si el peso bruto es menor o igual a la tara', () => {
      const crateInvalida = {
        crateNumber: 1,
        sku: 'PES-CORV-01',
        productName: 'Corvina Entera',
        crateTareKg: 2.0,
        grossWeightKg: 2.0, // Peso bruto igual a tara -> 0 kg pescado
        iceDeductionPct: 0,
        unitCostOriginKg: 22000,
        warehouseId: 'bodega-cava-1',
      };
      const result = PesajeCanastillaBucaramangaSchema.safeParse(crateInvalida);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('superior a la tara');
      }
    });
  });

  describe('3. Liquidación Financiera, Prorrateo de Flete y Saldo a Pagar al Proveedor', () => {
    it('debe prorratear el flete con precisión matemática entre los kilos netos recibidos', () => {
      const crates: PesajeCanastillaBucaramanga[] = [
        {
          crateNumber: 1,
          sku: 'SIERRA-01',
          productName: 'Sierra Entera',
          crateTareKg: 2.0,
          grossWeightKg: 52.0, // 50 kg netos
          iceDeductionPct: 0,
          unitCostOriginKg: 20000, // Subtotal: 1.000.000 COP
          warehouseId: 'cava-1',
          shelfLifeDays: 5,
        },
        {
          crateNumber: 2,
          sku: 'PARGO-01',
          productName: 'Pargo Rojo',
          crateTareKg: 2.0,
          grossWeightKg: 52.0, // 50 kg netos
          iceDeductionPct: 0,
          unitCostOriginKg: 30000, // Subtotal: 1.500.000 COP
          warehouseId: 'cava-1',
          shelfLifeDays: 5,
        },
      ];

      const fleteTotalCamion = 200000; // 200.000 COP de flete furgón
      const anticipoPagado = 1000000;  // 1.000.000 COP consignados al despachar de la costa

      const liquidacion = calcularLiquidacionBucaramanga(crates, fleteTotalCamion, anticipoPagado);

      expect(liquidacion.totalCrates).toBe(2);
      expect(liquidacion.totalGrossWeightKg).toBe(104.0);
      expect(liquidacion.totalTareKg).toBe(4.0);
      expect(liquidacion.totalNetWeightKg).toBe(100.0);

      // Prorrateo de flete: 200.000 COP / 100 kg = 2.000 COP/kg
      expect(liquidacion.proratedFreightPerKg).toBe(2000);

      // Costo de compra puro en origen: 1.000.000 + 1.500.000 = 2.500.000 COP
      expect(liquidacion.totalPurchaseCost).toBe(2500000);

      // Landed cost total puesto en Bucaramanga: 2.500.000 + 200.000 = 2.700.000 COP
      expect(liquidacion.landedCostTotal).toBe(2700000);

      // Saldo a pagar al proveedor del pescado: 2.500.000 - 1.000.000 anticipo = 1.500.000 COP
      expect(liquidacion.balanceToPaySupplier).toBe(1500000);

      // Verificar Landed Cost por producto:
      // Sierra: 20.000 + 2.000 = 22.000 COP/kg
      expect(liquidacion.cratesCalculadas[0].landedCostKg).toBe(22000);
      // Pargo: 30.000 + 2.000 = 32.000 COP/kg
      expect(liquidacion.cratesCalculadas[1].landedCostKg).toBe(32000);
    });

    it('debe validar la recepción completa con el esquema RecepcionBucaramangaSchema', () => {
      const recepcionValida = {
        receptionNumber: 'REC-BCM-2026-001',
        supplierId: 'prov-costa-01',
        supplierName: 'Distribuidora del Caribe',
        truckPlate: 'XBC-789',
        transportCompany: 'Transfrío del Oriente',
        shippingGuideNumber: 'REM-8921',
        driverName: 'Jairo Mora',
        refrigerationTempC: 1.5,
        tipoProducto: 'FRESCO' as const,
        sensoryStatus: 'ACEPTADO' as const,
        inspectorName: 'Manuel Operario',
        crates: [
          {
            crateNumber: 1,
            sku: 'SIERRA-01',
            productName: 'Sierra Entera',
            crateTareKg: 2.0,
            grossWeightKg: 42.0,
            iceDeductionPct: 2.0,
            unitCostOriginKg: 22000,
            warehouseId: 'cava-1',
            shelfLifeDays: 5,
          },
        ],
        totalFreightCost: 150000,
        advancePaymentDeducted: 500000,
        paymentStatus: 'PENDIENTE' as const,
      };

      const result = RecepcionBucaramangaSchema.safeParse(recepcionValida);
      expect(result.success).toBe(true);
    });
  });
});
