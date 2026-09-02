import { 
  EstadoMargen, 
  SimulacionCanal, 
  TipoPromocion, 
  EvaluacionPromocionAvanzada,
  VentaAncladaItem,
  ProductCatalog
} from '../types/erp.types';

export class FinancialAdvisorService {
  /**
   * 1. calcularCostoAprovechable
   * Calculation of real cost per usable kilo.
   */
  static calcularCostoAprovechable(cpp: number, porcentajeMerma: number = 0): number {
    if (porcentajeMerma >= 100 || porcentajeMerma < 0) {
      throw new Error("El porcentaje de merma debe estar entre 0 y 99.99");
    }
    return cpp / (1 - (porcentajeMerma / 100));
  }

  /**
   * 2. obtenerMargenObjetivo
   * Implement ABC dynamic policy
   * POS: C=35, B=42, A=50
   * Restaurant: C=25, B=30, A=35
   * Wholesale: C=15, B=18, A=22
   */
  static obtenerMargenObjetivo(categoriaABC: 'A' | 'B' | 'C' = 'C', canal: 'POS' | 'RESTAURANTE' | 'MAYORISTA'): number {
    const matrizMargenes = {
      'POS': { 'A': 50, 'B': 42, 'C': 35 },
      'RESTAURANTE': { 'A': 35, 'B': 30, 'C': 25 },
      'MAYORISTA': { 'A': 22, 'B': 18, 'C': 15 }
    };
    return matrizMargenes[canal][categoriaABC];
  }

  /**
   * 3. desglosarIva
   * Exact bidirectional breakdown of Taxable Base and IVA Quota.
   */
  static desglosarIva(precio: number, tarifaIva: number, ivaIncluido: boolean) {
    let precio_base_sin_iva = 0;
    let cuota_iva = 0;

    if (ivaIncluido) {
      precio_base_sin_iva = precio / (1 + (tarifaIva / 100));
      cuota_iva = precio - precio_base_sin_iva;
    } else {
      precio_base_sin_iva = precio;
      cuota_iva = precio * (tarifaIva / 100);
    }

    return {
      precio_base_sin_iva: Number(precio_base_sin_iva.toFixed(2)),
      cuota_iva: Number(cuota_iva.toFixed(2)),
      precio_total_con_iva: Number((precio_base_sin_iva + cuota_iva).toFixed(2))
    };
  }

  /**
   * 4. calcularPreciosSugeridos
   * Algorithmic price suggestion per channel over net cost.
   * Sugerido = Costo Real / (1 - MargenObjetivo / 100)
   */
  static calcularPreciosSugeridos(cpp: number, clasificacionAbc: 'A' | 'B' | 'C' = 'C', porcentajeMerma: number = 0) {
    const costoAprovechable = this.calcularCostoAprovechable(cpp, porcentajeMerma);
    
    const margenPos = this.obtenerMargenObjetivo(clasificacionAbc, 'POS');
    const margenRestaurante = this.obtenerMargenObjetivo(clasificacionAbc, 'RESTAURANTE');
    const margenMayorista = this.obtenerMargenObjetivo(clasificacionAbc, 'MAYORISTA');

    // Precio sugerido SIN IVA
    const sugeridoPos = costoAprovechable / (1 - (margenPos / 100));
    const sugeridoRestaurante = costoAprovechable / (1 - (margenRestaurante / 100));
    const sugeridoMayorista = costoAprovechable / (1 - (margenMayorista / 100));

    return {
      costoAprovechable: Number(costoAprovechable.toFixed(2)),
      POS: Number(sugeridoPos.toFixed(2)),
      RESTAURANTE: Number(sugeridoRestaurante.toFixed(2)),
      MAYORISTA: Number(sugeridoMayorista.toFixed(2))
    };
  }

  /**
   * 5. simularRentabilidadCanal
   * Calculation of gross margin %, COP profit, traffic light status and break-even price.
   */
  static simularRentabilidadCanal(
    costoBase: number, 
    precioVenta: number, 
    tarifaIva: number, 
    ivaIncluido: boolean, 
    clasificacionAbc: 'A' | 'B' | 'C' = 'C', 
    canal: 'POS' | 'RESTAURANTE' | 'MAYORISTA'
  ): SimulacionCanal {
    
    const desglose = this.desglosarIva(precioVenta, tarifaIva, ivaIncluido);
    const precioBaseSinIva = desglose.precio_base_sin_iva;
    
    const utilidadCop = precioBaseSinIva - costoBase;
    const margenBrutoPct = precioBaseSinIva > 0 ? (utilidadCop / precioBaseSinIva) * 100 : 0;
    
    const margenObjetivoPct = this.obtenerMargenObjetivo(clasificacionAbc, canal);
    const precioSugeridoAsesorSinIva = costoBase / (1 - (margenObjetivoPct / 100));
    
    let estado: EstadoMargen = 'OPTIMO';
    if (utilidadCop <= 0) {
      estado = 'PERDIDA';
    } else if (margenBrutoPct < (margenObjetivoPct * 0.9)) { // Tolerance of 10% below target
      estado = 'AJUSTADO';
    }

    const breakEven = costoBase; // Break-even sin IVA

    return {
      canal,
      precio_venta: Number(precioVenta.toFixed(2)),
      precio_base_sin_iva: Number(precioBaseSinIva.toFixed(2)),
      cuota_iva: Number(desglose.cuota_iva.toFixed(2)),
      margen_bruto_pct: Number(margenBrutoPct.toFixed(2)),
      utilidad_cop: Number(utilidadCop.toFixed(2)),
      margen_objetivo_pct: margenObjetivoPct,
      precio_sugerido_asesor: Number(precioSugeridoAsesorSinIva.toFixed(2)), // Suggestion sin IVA
      estado,
      break_even: Number(breakEven.toFixed(2))
    };
  }

  /**
   * 6. evaluarOfertaAvanzada
   * Guard for effective margin for offers.
   */
  static evaluarOfertaAvanzada(
    tipoPromo: TipoPromocion, 
    valorPromo: number, 
    precioNormalSinIva: number, 
    costoBase: number
  ): EvaluacionPromocionAvanzada {
    
    let precioUnitarioEfectivo = precioNormalSinIva;
    
    switch (tipoPromo) {
      case 'PORCENTAJE':
        precioUnitarioEfectivo = precioNormalSinIva * (1 - (valorPromo / 100));
        break;
      case 'PRECIO_FIJO':
        precioUnitarioEfectivo = valorPromo;
        break;
      case '2X1':
        precioUnitarioEfectivo = precioNormalSinIva * (1 / 2);
        break;
      case '12_MAS_1':
        precioUnitarioEfectivo = precioNormalSinIva * (12 / 13);
        break;
      case 'VOLUMEN':
        // Asumiendo que valor promo es el descuento % por volumen, simplificado
        precioUnitarioEfectivo = precioNormalSinIva * (1 - (valorPromo / 100));
        break;
    }

    const utilidadEfectiva = precioUnitarioEfectivo - costoBase;
    const margenEfectivoPct = precioUnitarioEfectivo > 0 ? (utilidadEfectiva / precioUnitarioEfectivo) * 100 : 0;
    
    let estado: EstadoMargen = 'OPTIMO';
    let advertencia: string | undefined;

    if (utilidadEfectiva < 0) {
      estado = 'PERDIDA';
      advertencia = 'Venta a pérdida detectada. Esta promoción generará rentabilidad negativa por unidad.';
    } else if (margenEfectivoPct < 15) { // Arbitrary low margin threshold for promos
      estado = 'AJUSTADO';
      advertencia = 'Margen muy ajustado. Rentabilidad menor al 15%.';
    }

    return {
      precio_unitario_efectivo: Number(precioUnitarioEfectivo.toFixed(2)),
      margen_efectivo_pct: Number(margenEfectivoPct.toFixed(2)),
      utilidad_efectiva_cop: Number(utilidadEfectiva.toFixed(2)),
      estado,
      advertencia
    };
  }

  /**
   * 7. obtenerSugerenciasCanasta
   * MOCK: Correlation analysis of joint purchases.
   */
  static obtenerSugerenciasCanasta(sku: string): VentaAncladaItem[] {
    // In a real scenario, this would query the backend/DB for basket analysis.
    // For now, returning some mock suggestions.
    if (sku.includes('SALMON')) {
      return [
        { producto_id: 'mock_1', sku: 'SALSA-SOYA', nombre: 'Salsa Soya 500ml', descuento_combo_pct: 10 },
        { producto_id: 'mock_2', sku: 'LIMON', nombre: 'Limón Tahití', descuento_combo_pct: 5 }
      ];
    }
    
    if (sku.includes('CAMARON')) {
      return [
        { producto_id: 'mock_3', sku: 'SALSA-AJO', nombre: 'Salsa de Ajo 250g', descuento_combo_pct: 15 }
      ];
    }

    return [];
  }
}
