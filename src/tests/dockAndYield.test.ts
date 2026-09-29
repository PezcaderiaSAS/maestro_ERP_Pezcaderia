import { describe, it, expect } from 'vitest';
import {
  InspeccionSanitariaMuelleSchema,
  RecepcionCompraMuelleSchema,
  calcularLiquidacionMuelle,
  type PesajeTallaMuelle,
  type DeduccionFaena,
} from '../../packages/validation-schemas/src/dockReceiving.schema';
import {
  OrdenProduccionDespieceSchema,
  calcularRendimientoYCosteoDespiece,
  type SalidaCorteDespiece,
} from '../../packages/validation-schemas/src/fishProductionYield.schema';

describe('Módulo de Compras de Muelle y Liquidación a Pescadores', () => {
  it('debe rechazar inspección sanitaria si la temperatura supera los 6.0°C (bloqueo cadena de frío)', () => {
    const inspeccionInvalida = {
      temperaturaPulpaC: 6.8, // > 6.0°C Bloqueo
      ojos: 'EXCELENTE_CONVEXO_TRANSPARENTE' as const,
      agallas: 'EXCELENTE_ROJO_VIVO_BRILLANTE' as const,
      textura: 'EXCELENTE_FIRME_ELASTICA' as const,
      olor: 'EXCELENTE_MAR_FRESCO_ALGAS' as const,
      inspectorCalidad: 'Biólogo Marino Carlos',
    };

    const result = InspeccionSanitariaMuelleSchema.safeParse(inspeccionInvalida);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('BLOQUEO SANITARIO');
    }
  });

  it('debe aprobar inspección sanitaria en rango óptimo (<= 4.0°C)', () => {
    const inspeccionValida = {
      temperaturaPulpaC: 2.5,
      ojos: 'EXCELENTE_CONVEXO_TRANSPARENTE' as const,
      agallas: 'EXCELENTE_ROJO_VIVO_BRILLANTE' as const,
      textura: 'EXCELENTE_FIRME_ELASTICA' as const,
      olor: 'EXCELENTE_MAR_FRESCO_ALGAS' as const,
      inspectorCalidad: 'Ing. Alimentos Laura',
    };

    const result = InspeccionSanitariaMuelleSchema.safeParse(inspeccionValida);
    expect(result.success).toBe(true);
  });

  it('debe calcular correctamente la tara, descuento de escurrido de hielo y neto a pagar al pescador', () => {
    // 2 canastillas de Pargo 400-600g: Bruto = 104 kg, Tara = 2*2kg = 4kg -> Neto báscula = 100 kg.
    // Escurrido hielo 3% -> Descuento = 3 kg -> Neto liquidado = 97 kg.
    // Precio $30.000/kg -> Subtotal = $2.910.000
    const itemsTallas: PesajeTallaMuelle[] = [
      {
        tallaNombre: 'Pargo 400-600g',
        calidad: 'PRIMERA',
        cantidadCanastillas: 2,
        taraPorCanastillaKg: 2.0,
        pesoBrutoBasculaKg: 104,
        porcentajeEscurridoHielo: 3.0,
        precioPorKgAcordado: 30000,
      },
    ];

    // Deducciones de faena: Anticipo $500.000 + Combustible $300.000 = $800.000
    const deducciones: DeduccionFaena[] = [
      {
        tipoDeduccion: 'ANTICIPO_EFECTIVO',
        descripcion: 'Anticipo salida de faena',
        montoDeducido: 500000,
      },
      {
        tipoDeduccion: 'COMBUSTIBLE_GASOLINA',
        descripcion: '10 galones de gasolina',
        montoDeducido: 300000,
      },
    ];

    const liquidacion = calcularLiquidacionMuelle(itemsTallas, deducciones);

    expect(liquidacion.pesoBrutoTotalKg).toBe(104);
    expect(liquidacion.taraTotalKg).toBe(4);
    expect(liquidacion.desgloseTallas[0].pesoNetoLiquidadoKg).toBe(97);
    expect(liquidacion.subtotalCompraPescado).toBe(2910000);
    expect(liquidacion.totalDeducciones).toBe(800000);
    expect(liquidacion.netoPagarPescador).toBe(2910000 - 800000); // $2.110.000
  });

  it('debe validar la estructura completa de Recepción y Compra en Muelle', () => {
    const payload = {
      consecutivoActa: 'ACTA-MUELLE-2026-001',
      fechaRecepcion: new Date().toISOString(),
      embarcacionNombre: 'Don Pedro II',
      patronPescadorNombre: 'Manuel Estupiñán',
      patronIdentificacion: '1144029182',
      puertoMuelleOrigen: 'Muelle La Floresta',
      especiePescado: 'Pargo Rojo',
      bodegaDestinoId: 'cuarto-frio-1',
      inspeccionSanitaria: {
        temperaturaPulpaC: 1.8,
        ojos: 'EXCELENTE_CONVEXO_TRANSPARENTE' as const,
        agallas: 'EXCELENTE_ROJO_VIVO_BRILLANTE' as const,
        textura: 'EXCELENTE_FIRME_ELASTICA' as const,
        olor: 'EXCELENTE_MAR_FRESCO_ALGAS' as const,
        inspectorCalidad: 'Inspector Juan',
      },
      itemsTallas: [
        {
          tallaNombre: 'Pargo Mediano 600-800g',
          calidad: 'PRIMERA' as const,
          cantidadCanastillas: 4,
          taraPorCanastillaKg: 2,
          pesoBrutoBasculaKg: 208,
          porcentajeEscurridoHielo: 3,
          precioPorKgAcordado: 32000,
        },
      ],
      deduccionesFaena: [],
      metodoPagoLiquidacion: 'EFECTIVO_CAJA_MENOR' as const,
    };

    const parsed = RecepcionCompraMuelleSchema.safeParse(payload);
    expect(parsed.success).toBe(true);
  });
});

describe('Módulo de Producción, Despiece, Rendimiento y Costeo de Fileteo', () => {
  it('debe calcular rendimiento óptimo de Corvina y asignar absorción de costos por valor de mercado', () => {
    // 100 kg de Corvina entera a $20.000/kg -> Costo total MP = $2.000.000
    // Salidas:
    // - Filete: 44 kg (44% - En rango óptimo 42-46%) @ Factor 1.6
    // - Cabezas y Espinazo: 32 kg @ Factor 0.3
    // - Retazo para pulpa: 6 kg @ Factor 0.9
    // - Merma no aprovechable (vísceras, escamas): 18 kg @ Factor 0
    const pesoInicialKg = 100;
    const costoKiloMP = 20000;
    const cortes: SalidaCorteDespiece[] = [
      {
        productoId: 'prod-filete-corvina',
        sku: 'FIL-COR-01',
        nombreCorte: 'Filete de Corvina Fresco',
        tipoSalida: 'PRODUCTO_PRINCIPAL_FILETE',
        pesoObtenidoKg: 44,
        factorValorMercado: 1.6,
      },
      {
        productoId: 'prod-cabeza-corvina',
        sku: 'CAB-COR-01',
        nombreCorte: 'Cabezas y Espinazos para Sopa',
        tipoSalida: 'COPRODUCTO_CABEZA_ESPINAZO',
        pesoObtenidoKg: 32,
        factorValorMercado: 0.3,
      },
      {
        productoId: 'prod-retazo-corvina',
        sku: 'RET-COR-01',
        nombreCorte: 'Retazos de Pulpa para Ceviche',
        tipoSalida: 'SUBPRODUCTO_RETAZO_PULPA',
        pesoObtenidoKg: 6,
        factorValorMercado: 0.9,
      },
      {
        productoId: 'merma-corvina',
        sku: 'MERMA-01',
        nombreCorte: 'Vísceras y Escamas',
        tipoSalida: 'MERMA_TECNICA_NO_APROVECHABLE',
        pesoObtenidoKg: 18,
        factorValorMercado: 0.0,
      },
    ];

    const resultado = calcularRendimientoYCosteoDespiece(pesoInicialKg, costoKiloMP, cortes, 'CORVINA');

    // 1. Verificación de Rendimientos
    expect(resultado.pesoFileteKg).toBe(44);
    expect(resultado.rendimientoFileteRealPct).toBe(44.0);
    expect(resultado.mermaTotalKg).toBe(18);
    expect(resultado.calificacionRendimiento).toBe('OPTIMO_EXCELENTE');

    // 2. Verificación de Costeo
    // Puntos ponderados:
    // Filete: 44 * 1.6 = 70.4
    // Cabezas: 32 * 0.3 = 9.6
    // Retazos: 6 * 0.9 = 5.4
    // Merma: 0
    // Total puntos = 85.4
    // Filete absorbe ~ 70.4 / 85.4 = 82.43% del costo ($1.648.712)
    // Costo/kg filete = $1.648.712 / 44 kg ~ $37.471/kg
    const corteFilete = resultado.cortesLiquidados.find((c) => c.tipoSalida === 'PRODUCTO_PRINCIPAL_FILETE');
    const corteCabezas = resultado.cortesLiquidados.find((c) => c.tipoSalida === 'COPRODUCTO_CABEZA_ESPINAZO');
    const corteMerma = resultado.cortesLiquidados.find((c) => c.tipoSalida === 'MERMA_TECNICA_NO_APROVECHABLE');

    expect(corteFilete).toBeDefined();
    expect(corteCabezas).toBeDefined();
    expect(corteMerma).toBeDefined();

    expect(corteFilete!.costoUnitarioPorKg).toBeGreaterThan(costoKiloMP); // El filete cuesta más por kg que el pescado entero
    expect(corteCabezas!.costoUnitarioPorKg).toBeLessThan(costoKiloMP); // Las cabezas cuestan mucho menos por kg
    expect(corteMerma!.costoTotalAsignado).toBe(0); // La merma no absorbe costo
  });

  it('debe alertar desviación crítica si el fileteador saca un rendimiento por debajo de la tolerancia', () => {
    // 100 kg de Trucha entera (estándar mín 47%) pero el operario solo sacó 38 kg de filete
    const cortesBajoRendimiento: SalidaCorteDespiece[] = [
      {
        productoId: 'prod-filete-trucha',
        sku: 'FIL-TRU-01',
        nombreCorte: 'Filete de Trucha',
        tipoSalida: 'PRODUCTO_PRINCIPAL_FILETE',
        pesoObtenidoKg: 38, // 38% vs mín 47% -> Desviación de 9%
        factorValorMercado: 1.6,
      },
      {
        productoId: 'merma-trucha',
        sku: 'MERMA-01',
        nombreCorte: 'Merma no aprovechable',
        tipoSalida: 'MERMA_TECNICA_NO_APROVECHABLE',
        pesoObtenidoKg: 62,
        factorValorMercado: 0.0,
      },
    ];

    const resultado = calcularRendimientoYCosteoDespiece(100, 18000, cortesBajoRendimiento, 'TRUCHA');

    expect(resultado.rendimientoFileteRealPct).toBe(38.0);
    expect(resultado.calificacionRendimiento).toBe('CRITICO_ROJO_DESVIACION');
    expect(resultado.mensajeAuditoria).toContain('ALERTA CRÍTICA: Desviación severa de fileteo');
  });

  it('debe validar la estructura completa de una Orden de Producción y Despiece', () => {
    const ordenPayload = {
      consecutivoOrden: 'OP-DESPIECE-2026-004',
      fechaTransformacion: new Date().toISOString(),
      bodegaOrigenId: 'bodega-principal',
      bodegaDestinoId: 'bodega-principal',
      loteMadreMuelleId: 'LOTE-MUELLE-20260929-001',
      materiaPrimaProductoId: 'prod-salmon-entero',
      materiaPrimaSku: 'SALM-ENT-01',
      materiaPrimaNombre: 'Salmón Atlántico Entero',
      especieClave: 'SALMON',
      pesoInicialMateriaPrimaKg: 80,
      costoKiloMateriaPrima: 45000,
      fileteadorNombre: 'Don Efraín Gómez (Maestro Fileteador)',
      fileteadorIdentificacion: '79201948',
      temperaturaSalaC: 9.5,
      cortesObtenidos: [
        {
          productoId: 'prod-filete-salmon',
          sku: 'FIL-SALM-01',
          nombreCorte: 'Filete de Salmón Premium',
          tipoSalida: 'PRODUCTO_PRINCIPAL_FILETE' as const,
          pesoObtenidoKg: 40,
          factorValorMercado: 1.7,
        },
      ],
    };

    const parsed = OrdenProduccionDespieceSchema.safeParse(ordenPayload);
    expect(parsed.success).toBe(true);
  });
});
